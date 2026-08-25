"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: import("@supabase/supabase-js").User | null } }) => {
      setLoading(false);
      if (!user) {
        router.push("/login");
      }
    });
  }, [router, supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) return <main className="p-8 text-slate-300">Checking session...</main>;

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold text-slate-100">Logout</h1>
      <div className="mt-4">
        <p className="text-slate-300">Are you sure you want to sign out?</p>
        <button onClick={handleLogout} className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">Logout</button>
      </div>
    </main>
  );
}
