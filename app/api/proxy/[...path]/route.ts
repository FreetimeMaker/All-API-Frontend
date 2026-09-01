import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_BASE || "https://free-time.me/api";
const PROXY_TIMEOUT = 15000; // 15 seconds

async function checkApiHealth() {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 2000); // 2s health check
  try {
    const res = await fetch(`${API_BASE}/v1/health`, {
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(id);
    return res.ok;
  } catch (e) {
    clearTimeout(id);
    return false;
  }
}

// Headers that should not be forwarded to/from the upstream API
const HOP_BY_HOP_HEADERS = [
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
];

async function forward(req: NextRequest, pathArray: string[] | string) {
  try {
    const path = Array.isArray(pathArray) ? pathArray.join("/") : String(pathArray);

    // Check health unless it's the health endpoint itself or a static asset
    if (!path.includes("health") && !path.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|css|js)$/i)) {
      const isHealthy = await checkApiHealth();
      if (!isHealthy) {
        return NextResponse.json(
          { error: "API not reachable", message: "The API is currently not responding." },
          { status: 503 }
        );
      }
    }

    const target = new URL(`${API_BASE}/${path}`);

    // Preserve incoming query parameters
    const incomingSearch = req.nextUrl.search;
    if (incomingSearch) target.search = incomingSearch;

    // Filter incoming headers
    const headers = new Headers();
    req.headers.forEach((value, key) => {
      if (HOP_BY_HOP_HEADERS.includes(key.toLowerCase())) return;
      headers.set(key, value);
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROXY_TIMEOUT);

    // Special handling for login routes (direct browser redirect to provider)
    if (req.method === "GET" && path.toLowerCase().includes("/auth/login")) {
      console.log("Proxying login redirect to:", target.toString());
      clearTimeout(timeoutId);
      return NextResponse.redirect(target.toString(), 307);
    }

    // Special handling for OAuth callback - intercept to extract tokens
    if (req.method === "GET" && path.toLowerCase().includes("/auth/callback")) {
      console.log("Proxying OAuth callback, intercepting for token extraction");
      
      // Forward the request to the API
      const res = await fetch(target.toString(), {
        method: req.method,
        headers,
        redirect: "follow",
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Try to extract tokens from the response
      const contentType = res.headers.get("content-type") || "";
      let tokens: any = {};

      if (contentType.includes("application/json")) {
        try {
          const jsonData = await res.json();
          console.log("OAuth callback JSON response:", jsonData);
          
          // Extract tokens from JSON response
          if (jsonData.access_token) tokens.access_token = jsonData.access_token;
          if (jsonData.token_type) tokens.token_type = jsonData.token_type;
          if (jsonData.expires_in) tokens.expires_in = jsonData.expires_in;
          if (jsonData.refresh_token) tokens.refresh_token = jsonData.refresh_token;
        } catch (e) {
          console.error("Error parsing OAuth JSON response:", e);
        }
      } else {
        // Check if tokens are in URL fragment or query params
        const url = new URL(req.url);
        const searchParams = url.searchParams;
        
        if (searchParams.get("access_token")) tokens.access_token = searchParams.get("access_token");
        if (searchParams.get("token_type")) tokens.token_type = searchParams.get("token_type");
        if (searchParams.get("expires_in")) tokens.expires_in = searchParams.get("expires_in");
        
        console.log("OAuth callback URL params:", Object.fromEntries(searchParams.entries()));
      }

      // If we found tokens, redirect to frontend callback with tokens
      if (tokens.access_token) {
        console.log("Tokens extracted, redirecting to frontend callback with tokens");
        const frontendCallback = new URL("/auth/callback", req.url);
        Object.keys(tokens).forEach(key => {
          if (tokens[key]) frontendCallback.searchParams.set(key, tokens[key]);
        });
        return NextResponse.redirect(frontendCallback.toString(), 302);
      }

      // Otherwise, just follow the original redirect behavior
      console.log("No tokens found, following original redirect");
      const responseHeaders = new Headers();
      res.headers.forEach((value, key) => {
        const lowerKey = key.toLowerCase();
        if (HOP_BY_HOP_HEADERS.includes(lowerKey)) return;
        if (lowerKey === "set-cookie") return;
        if (lowerKey === "content-encoding") return;
        if (lowerKey === "content-length") return;
        responseHeaders.set(key, value);
      });

      // Handle Set-Cookie headers
      const setCookies = (res.headers as any).getSetCookie?.() || res.headers.get("set-cookie");
      if (setCookies) {
        const cookiesArray = Array.isArray(setCookies) ? setCookies : [setCookies];
        cookiesArray.forEach(c => responseHeaders.append("Set-Cookie", c));
      }

      // If upstream returned a redirect, pass it through
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (location) {
          return new Response(null, {
            status: res.status,
            headers: responseHeaders,
          });
        }
      }

      const resBody = await res.arrayBuffer();
      return new Response(resBody, {
        status: res.status,
        headers: responseHeaders,
      });
    }

    // Prepare request body
    let body: any = undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      body = await req.arrayBuffer();
    }

    // Proxy the request to the upstream API
    const res = await fetch(target.toString(), {
      method: req.method,
      headers,
      body,
      redirect: "follow",
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const responseHeaders = new Headers();
    res.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      // Skip hop-by-hop and problematic headers
      if (HOP_BY_HOP_HEADERS.includes(lowerKey)) return;
      if (lowerKey === "set-cookie") return; // Handled below
      if (lowerKey === "content-encoding") return; // Let Next.js handle compression
      if (lowerKey === "content-length") return; // Let Response calculate it

      responseHeaders.set(key, value);
    });

    // Handle Set-Cookie headers correctly (supports multiple)
    const setCookies = (res.headers as any).getSetCookie?.() || res.headers.get("set-cookie");
    if (setCookies) {
      const cookiesArray = Array.isArray(setCookies) ? setCookies : [setCookies];
      cookiesArray.forEach(c => responseHeaders.append("Set-Cookie", c));
    }

    // If upstream returned a redirect, we must pass it through to the browser
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (location) {
        // If location is relative, we could make it absolute if needed,
        // but browser should handle it relative to the proxy URL.
        return new Response(null, {
          status: res.status,
          headers: responseHeaders,
        });
      }
    }

    const resBody = await res.arrayBuffer();
    return new Response(resBody, {
      status: res.status,
      headers: responseHeaders,
    });

  } catch (error: any) {
    console.error("Proxy Error:", error);
    return NextResponse.json(
      { error: "Proxy failure", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest, context: any) {
  const ctxParams = await (context?.params ?? {});
  return forward(req, ctxParams.path || "");
}
export async function POST(req: NextRequest, context: any) {
  const ctxParams = await (context?.params ?? {});
  return forward(req, ctxParams.path || "");
}
export async function PUT(req: NextRequest, context: any) {
  const ctxParams = await (context?.params ?? {});
  return forward(req, ctxParams.path || "");
}
export async function DELETE(req: NextRequest, context: any) {
  const ctxParams = await (context?.params ?? {});
  return forward(req, ctxParams.path || "");
}
export async function PATCH(req: NextRequest, context: any) {
  const ctxParams = await (context?.params ?? {});
  return forward(req, ctxParams.path || "");
}
