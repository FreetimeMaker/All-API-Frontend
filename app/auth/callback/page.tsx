"use client";
import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
      router.push("/login?error=" + encodeURIComponent(errorDescription || error));
      return;
    }

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }: { error: Error | null }) => {
        if (error) {
          console.error("Session exchange error:", error.message);
          if (error.message.includes("PKCE")) {
            router.push("/login?error=" + encodeURIComponent("Session expired. Please try again."));
          } else {
            router.push("/login?error=" + encodeURIComponent("Authentication failed."));
          }
        } else {
          router.push("/dashboard");
        }
      });
    } else {
      const accessToken = searchParams.get("access_token");
      if (accessToken) {
        router.push("/dashboard");
      } else {
        router.push("/login?error=" + encodeURIComponent("No authorization code received."));
      }
    }
  }, [router, searchParams, supabase]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-slate-300">Authentication is being processed...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-slate-950"><p className="text-slate-300">Loading...</p></div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
