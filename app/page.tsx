"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Spinner from "./components/Spinner";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setLoggedIn(true);
        router.push("/dashboard");
      }
      setLoading(false);
    });
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-slate-950">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 bg-slate-950">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-white">All API Frontend</h1>
        <p className="text-slate-400 max-w-md">Welcome to the All API Frontend. Please sign in to access your dashboard.</p>
        <div className="flex gap-4 justify-center">
          {!loggedIn && (
            <Link href="/login" className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">Sign In</Link>
          )}
          <Link href="/health" className="px-6 py-3 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700">System Status</Link>
        </div>
      </div>
    </div>
  );
}
