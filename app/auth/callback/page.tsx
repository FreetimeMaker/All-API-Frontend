"use client";
import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for error parameters from URL
    const error = searchParams.get("error");
    
    if (error) {
      console.error("OAuth error:", error);
      router.push("/login?error=" + encodeURIComponent(error));
      return;
    }

    // Log callback parameters for debugging
    console.log("Auth callback received params:", Object.fromEntries(searchParams.entries()));

    // Check for access_token in query parameters
    let accessToken = searchParams.get("access_token");
    let tokenType = searchParams.get("token_type") || "Bearer";
    let expiresIn = searchParams.get("expires_in");
    let userParam = searchParams.get("user");

    // If not in query params, check hash fragment (common in OAuth implicit flow)
    if (!accessToken) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      accessToken = hashParams.get("access_token");
      tokenType = hashParams.get("token_type") || "Bearer";
      expiresIn = hashParams.get("expires_in");
      userParam = hashParams.get("user");
      console.log("Hash parameters found:", Object.fromEntries(hashParams.entries()));
    }
    
    if (accessToken) {
      console.log("Access token received, storing in localStorage");
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('token_type', tokenType);
      localStorage.setItem('auth_token', accessToken); // Store with consistent key
      
      if (expiresIn) {
        const expiresAt = Date.now() + (parseInt(expiresIn) * 1000);
        localStorage.setItem('token_expires_at', expiresAt.toString());
      }
      
      // If user data is already provided, store it directly
      if (userParam) {
        try {
          const userData = JSON.parse(decodeURIComponent(userParam));
          console.log("User data received in callback:", userData);
          localStorage.setItem('user_info', JSON.stringify(userData));
          
          // Redirect to dashboard immediately
          setTimeout(() => {
            console.log("Redirecting to dashboard with user data");
            router.push("/dashboard");
          }, 500);
          return;
        } catch (e) {
          console.error("Error parsing user data:", e);
        }
      }
      
      // Otherwise fetch user info using the access token
      fetchUserInfo(accessToken, router);
    } else {
      // No token received - redirect back to login with error
      console.log("No access token received in callback");
      router.push("/login?error=" + encodeURIComponent("Authentication failed: No token received."));
    }
  }, [router, searchParams]);

  async function fetchUserInfo(accessToken: string, router: any) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const API_BASE = process.env.API_BASE || "https://all-api-node.vercel.app";
      const response = await fetch(`${API_BASE}/api/v1/auth/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const userData = await response.json();
        console.log("User data fetched:", userData);
        
        // Store user info in localStorage
        localStorage.setItem('user_info', JSON.stringify(userData));
        localStorage.setItem('auth_token', accessToken);
        
        // Redirect to dashboard
        router.push("/dashboard");
      } else {
        console.error("Failed to fetch user info:", response.status);
        router.push("/login?error=" + encodeURIComponent("User information could not be loaded."));
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("Error fetching user info:", error);
      const message = error.name === 'AbortError' ? "Timeout while loading user data." : "Error loading user data.";
      router.push("/login?error=" + encodeURIComponent(message));
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-slate-300">Authentication is being processed...</p>
        <p className="text-slate-500 text-sm mt-2">Tokens are being retrieved and stored...</p>
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