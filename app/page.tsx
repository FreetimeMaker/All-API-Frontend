"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Spinner from "./components/Spinner";

function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 via-slate-950 to-slate-950" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/10 blur-[120px] rounded-full" />
      <div className="relative max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-800/50 text-indigo-300 text-xs font-medium mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Powered by Supabase Auth
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight">
          All API
          <span className="block text-indigo-400">Frontend</span>
        </h1>
        <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Your central hub for API management. Monitor backend health, manage your account,
          and interact with services &mdash; all from a single, secure dashboard.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-all duration-200 font-medium shadow-lg shadow-indigo-600/25"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            Sign In to Get Started
          </Link>
          <Link
            href="/health"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-slate-800/80 text-slate-300 rounded-lg hover:bg-slate-700/80 transition-all duration-200 border border-slate-700"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
            </svg>
            View System Status
          </Link>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      ),
      title: "Secure OAuth Login",
      description: "Sign in with your GitHub or GitLab account. No passwords to remember &mdash; authentication is handled by Supabase with industry-standard OAuth 2.0.",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
        </svg>
      ),
      title: "API Health Monitoring",
      description: "Real-time health checks on every request. The dashboard shows live API status, so you always know if your backend services are operational.",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0021 9.349m-16.5 0V6.75a3 3 0 013-3h9a3 3 0 013 3v2.594" />
        </svg>
      ),
      title: "Account Dashboard",
      description: "Manage your profile, view account activity, and control your connected services &mdash; all from an intuitive, responsive interface.",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
        </svg>
      ),
      title: "Universal API Proxy",
      description: "A secure proxy layer routes all backend requests. CORS handling, header filtering, and request forwarding are managed automatically.",
    },
  ];

  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-white">Everything you need</h2>
        <p className="mt-3 text-slate-400 max-w-xl mx-auto">
          A complete frontend for managing and interacting with your API infrastructure.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((f, i) => (
          <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
            <div className="h-10 w-10 rounded-lg bg-indigo-600/15 border border-indigo-800/40 flex items-center justify-center text-indigo-400 mb-4">
              {f.icon}
            </div>
            <h3 className="text-lg font-semibold text-white">{f.title}</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: f.description }} />
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      step: "1",
      title: "Sign In",
      description: "Click the sign-in button and authenticate with GitHub or GitLab. Your session is securely managed via Supabase cookies.",
    },
    {
      step: "2",
      title: "Access Dashboard",
      description: "Once authenticated, you land on your personal dashboard with account overview, activity feed, and quick actions.",
    },
    {
      step: "3",
      title: "Manage & Monitor",
      description: "View your profile, monitor API health in real time, and interact with backend services through the integrated proxy.",
    },
  ];

  return (
    <section className="max-w-5xl mx-auto px-6 py-20">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-white">How it works</h2>
        <p className="mt-3 text-slate-400">Three simple steps to get started.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((s, i) => (
          <div key={i} className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-indigo-600/15 border border-indigo-800/50 flex items-center justify-center text-indigo-400 text-lg font-bold mb-4">
              {s.step}
            </div>
            <h3 className="text-lg font-semibold text-white">{s.title}</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">{s.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function TechStackSection() {
  const techs = [
    { name: "Next.js", desc: "React Framework" },
    { name: "Supabase", desc: "Auth & Database" },
    { name: "Tailwind CSS", desc: "Styling" },
    { name: "TypeScript", desc: "Type Safety" },
    { name: "Vercel", desc: "Deployment" },
    { name: "Node.js", desc: "Backend API" },
  ];

  return (
    <section className="max-w-5xl mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-white">Built with modern tech</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {techs.map((t, i) => (
          <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 text-center hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-white">{t.name}</p>
            <p className="text-xs text-slate-500 mt-1">{t.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="max-w-4xl mx-auto px-6 py-20">
      <div className="relative rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-800/30 p-12 text-center overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[80px] rounded-full" />
        <div className="relative">
          <h2 className="text-3xl font-bold text-white">Ready to get started?</h2>
          <p className="mt-3 text-slate-400 max-w-md mx-auto">
            Sign in with your GitHub or GitLab account and explore the dashboard in seconds.
          </p>
          <div className="mt-8">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-all duration-200 font-medium shadow-lg shadow-indigo-600/25 text-lg"
            >
              Sign In Now
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: import("@supabase/supabase-js").User | null } }) => {
      if (user) {
        router.push("/dashboard");
      } else {
        setLoading(false);
      }
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
    <div className="bg-slate-950 min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TechStackSection />
      <CTASection />
    </div>
  );
}
