import { createServerClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import type { NextRequest } from "next/server";

export function createClient(request: NextRequest) {
  let supabaseResponse = new Response(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables are not configured");
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet, cacheHeaders) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = new Response(null, {
          status: supabaseResponse.status,
          headers: supabaseResponse.headers,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.headers.append(
            "Set-Cookie",
            serializeCookieHeader(name, value, options)
          )
        );
        if (cacheHeaders) {
          Object.entries(cacheHeaders).forEach(([key, value]) => {
            supabaseResponse.headers.set(key, value);
          });
        }
      },
    },
  });

  return { supabase, supabaseResponse };
}
