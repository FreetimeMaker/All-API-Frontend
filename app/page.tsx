"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Spinner from "./components/Spinner";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/session")
      .then(res => res.json())
      .then(data => {
        if (data.loggedIn) {
          setLoggedIn(true);
          router.push("/dashboard");
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-slate-950 font-sans min-h-screen">
      <main className="flex flex-1 w-full max-w-4xl flex-col items-center justify-center py-20 px-6">
        <div className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold mb-4">
          v1.0.0
        </div>
        <h1 className="text-5xl font-extrabold mb-6 tracking-tight text-white">
          All API <span className="text-indigo-400">Frontend</span>
        </h1>
        <p className="text-lg text-slate-300 mb-10 max-w-lg leading-relaxed text-center">
          Manage your user account, check your security statistics, and keep track of your profile activities – all in one central place.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            href="/login"
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all text-center"
          >
            Get Started
          </Link>
          <Link
            href="/health"
            className="px-8 py-3 bg-slate-800 text-slate-100 border border-slate-700 rounded-xl font-bold hover:bg-slate-700 transition-all text-center"
          >
            System Status
          </Link>
        </div>

        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8 w-full border-t border-slate-800 pt-10">
          <div className="text-center sm:text-left">
            <h3 className="font-bold text-white mb-2 text-lg">OAuth Login</h3>
            <p className="text-sm text-slate-400">Secure sign-in via GitHub or GitLab.</p>
          </div>
          <div className="text-center sm:text-left">
            <h3 className="font-bold text-white mb-2 text-lg">Proxy API</h3>
            <p className="text-sm text-slate-400">Seamless integration of your backend services.</p>
          </div>
          <div className="text-center sm:text-left">
            <h3 className="font-bold text-white mb-2 text-lg">Live Monitor</h3>
            <p className="text-sm text-slate-400">Real-time health checks for all endpoints.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
