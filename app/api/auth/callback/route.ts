import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_BASE || "https://all-api-node.vercel.app";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const searchParams = url.searchParams;
  
  console.log("Custom OAuth callback handler received params:", Object.fromEntries(searchParams.entries()));
  
  // Check if this is the callback from the OAuth provider (has code or error)
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const provider = searchParams.get("provider");
  
  if (error) {
    console.error("OAuth error:", error);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, req.url));
  }
  
  if (code && provider) {
    // Exchange the authorization code for tokens
    console.log(`Exchanging authorization code for tokens (Provider: ${provider})`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const tokenResponse = await fetch(`${API_BASE}/api/v1/auth/callback?code=${encodeURIComponent(code)}&provider=${provider}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log("Token exchange response status:", tokenResponse.status);
      
      if (tokenResponse.ok) {
        const contentType = tokenResponse.headers.get("content-type") || "";
        let tokens: any = {};
        
        if (contentType.includes("application/json")) {
          try {
            const jsonData = await tokenResponse.json();
            console.log("Token response JSON received");
            
            // Extract tokens from response
            if (jsonData.access_token) tokens.access_token = jsonData.access_token;
            if (jsonData.token_type) tokens.token_type = jsonData.token_type;
            if (jsonData.expires_in) tokens.expires_in = jsonData.expires_in;
            if (jsonData.refresh_token) tokens.refresh_token = jsonData.refresh_token;
            if (jsonData.user) tokens.user = jsonData.user;
          } catch (e) {
            console.error("Error parsing token JSON:", e);
          }
        }
        
        // Redirect to frontend callback with tokens
        if (tokens.access_token) {
          console.log("Tokens extracted, redirecting to frontend callback");
          const frontendCallback = new URL("/auth/callback", req.url);
          Object.keys(tokens).forEach(key => {
            if (tokens[key]) {
              if (key === "user") {
                frontendCallback.searchParams.set(key, JSON.stringify(tokens[key]));
              } else {
                frontendCallback.searchParams.set(key, tokens[key]);
              }
            }
          });
          return NextResponse.redirect(frontendCallback.toString(), 302);
        }
      } else {
        const errorText = await tokenResponse.text().catch(() => "Unknown error");
        console.error("Token exchange failed:", errorText);
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("Token exchange failed.")}`, req.url));
      }
    } catch (e: any) {
      clearTimeout(timeoutId);
      console.error("Error exchanging code for tokens:", e);
      const message = e.name === 'AbortError' ? "Timeout during token exchange." : "Error during token exchange.";
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(message)}`, req.url));
    }
  }
  
  // Fallback: redirect to login with error if no tokens could be exchanged
  console.log("Insufficient parameters for token exchange, redirecting to login");
  return NextResponse.redirect(new URL("/login?error=" + encodeURIComponent("Invalid callback parameters."), req.url), 302);
}