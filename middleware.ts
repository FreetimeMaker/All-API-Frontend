import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/middleware";

const protectedRoutes = ["/dashboard"];
const authRoutes = ["/login", "/logout"];

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request);

  await supabase.auth.getClaims();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (!user && protectedRoutes.some((route) => pathname.startsWith(route))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return Response.redirect(url);
  }

  if (user && authRoutes.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return Response.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
