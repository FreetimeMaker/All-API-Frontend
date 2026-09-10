"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface AppSubmission {
  id: string;
  name: string;
  description: string;
  link: string;
  status: "Pending" | "In Review" | "Approved" | "Rejected";
  submittedAt: string;
  category: string;
}

interface LumaSubmissionRow {
  id: string;
  name: string;
  description: string;
  link: string | null;
  status: AppSubmission["status"];
  submitted_at: string;
  category: string;
}

export default function LumaDeveloperPortal() {
  const [step, setStep] = useState(1);
  const [appName, setAppName] = useState("");
  const [appDescription, setAppDescription] = useState("");
  const [appLink, setAppLink] = useState("");
  const [appCategory, setAppCategory] = useState("Productivity");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [myApps, setMyApps] = useState<AppSubmission[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const supabase = createClient();

  // Load apps from Supabase on mount
  useEffect(() => {
    async function fetchApps() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("luma_submissions")
        .select("*")
        .eq("user_id", user.id)
        .order("submitted_at", { ascending: false });

      if (!error && data) {
        setMyApps(data.map((item: LumaSubmissionRow) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          link: item.link || "",
          status: item.status,
          submittedAt: item.submitted_at,
          category: item.category
        })));
      }
      setLoadingApps(false);
    }
    fetchApps();
  }, [supabase]);

  const resetForm = () => {
    setStep(1);
    setAppName("");
    setAppDescription("");
    setAppLink("");
    setAppCategory("Productivity");
    setEditingId(null);
  };

  const handleEdit = (app: AppSubmission) => {
    if (app.status !== "Rejected") return;

    setEditingId(app.id);
    setAppName(app.name);
    setAppDescription(app.description);
    setAppLink(app.link);
    setAppCategory(app.category);
    setStep(1);
    setSubmitted(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let data: LumaSubmissionRow | null = null;
      let error: { message?: string } | null = null;

      if (editingId) {
        const result = await supabase
          .from("luma_submissions")
          .update({
            name: appName,
            description: appDescription,
            link: appLink,
            category: appCategory,
            status: "Pending",
            review_message: null,
          })
          .eq("id", editingId)
          .eq("user_id", user.id)
          .eq("status", "Rejected")
          .select()
          .single();

        data = result.data as LumaSubmissionRow | null;
        error = result.error;
      } else {
        const newSubmission = {
          user_id: user.id,
          name: appName,
          description: appDescription,
          link: appLink,
          category: appCategory,
          status: "Pending",
          submitted_at: new Date().toISOString(),
        };

        const result = await supabase
          .from("luma_submissions")
          .insert([newSubmission])
          .select()
          .single();

        data = result.data as LumaSubmissionRow | null;
        error = result.error;
      }

      if (error) throw error;
      if (!data) throw new Error("Submission could not be saved");

      const savedApp: AppSubmission = {
        id: data.id,
        name: data.name,
        description: data.description,
        link: data.link || "",
        status: data.status,
        submittedAt: data.submitted_at,
        category: data.category
      };

      if (editingId) {
        setMyApps((apps) => apps.map((app) => app.id === editingId ? savedApp : app));
      } else {
        setMyApps((apps) => [savedApp, ...apps]);
      }

      setSubmitted(true);
      setEditingId(null);
    } catch (err) {
      console.error("Submission error:", err);
      alert("Failed to save submission. Rejected submissions can only be edited while their status is still Rejected.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "bg-yellow-900/50 text-yellow-400 border-yellow-700/50";
      case "In Review": return "bg-blue-900/50 text-blue-400 border-blue-700/50";
      case "Approved": return "bg-emerald-900/50 text-emerald-400 border-emerald-700/50";
      case "Rejected": return "bg-red-900/50 text-red-400 border-red-700/50";
      default: return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  if (submitted) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-6 text-center">
        <div className="w-20 h-20 bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/50">
          <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Submission Received!</h1>
        <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
          Thank you for submitting <strong>{appName}</strong>. Since it is Open-Source, our team will review the code and get back to you shortly.
        </p>
        <button
          onClick={() => { setSubmitted(false); resetForm(); }}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
        >
          Submit another app
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <span className="bg-gradient-to-r from-pink-500 to-indigo-500 text-transparent bg-clip-text">Luma Store</span> Developer Portal
          </h1>
          <p className="text-slate-400 mt-2">Publish your Open-Source apps on the Luma ecosystem.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-emerald-900/20 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/30 uppercase tracking-wider text-center">
            Open Source Only
          </div>
        </div>
      </header>

      {/* Stats / Dashboard Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <p className="text-xs text-slate-500 font-bold uppercase mb-1">Total Submissions</p>
          <p className="text-2xl font-bold text-white">{loadingApps ? "..." : myApps.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <p className="text-xs text-slate-500 font-bold uppercase mb-1">Approved Apps</p>
          <p className="text-2xl font-bold text-white">{loadingApps ? "..." : myApps.filter(a => a.status === 'Approved').length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <p className="text-xs text-slate-500 font-bold uppercase mb-1">Avg. Review Time</p>
          <p className="text-2xl font-bold text-white">~2.5d</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <p className="text-xs text-slate-500 font-bold uppercase mb-1">Revenue Share</p>
          <p className="text-2xl font-bold text-emerald-400">0%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Submission Form */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <h2 className="font-semibold text-white">{editingId ? "Edit Rejected Submission" : "New App Submission"}</h2>
              <div className="flex gap-1">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`h-1.5 w-8 rounded-full transition-colors ${i <= step ? "bg-indigo-500" : "bg-slate-700"}`} />
                ))}
              </div>
            </div>

            {editingId && (
              <div className="mx-8 mt-6 rounded-lg border border-red-500/30 bg-red-950/20 px-4 py-3 text-sm text-red-200">
                You are editing a rejected submission. Saving it will resubmit the app and set its status back to Pending.
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-8">
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
                    <p className="text-sm text-indigo-300 flex items-start gap-3">
                      <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Important: We only accept **Open-Source** applications. You will need to provide a public repository link (GitHub, GitLab, etc.) in the next step.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Application Name</label>
                    <input
                      type="text"
                      required
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      placeholder="e.g. Luma Weather Pro"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Short Description</label>
                    <textarea
                      rows={4}
                      required
                      value={appDescription}
                      onChange={(e) => setAppDescription(e.target.value)}
                      placeholder="Describe what your app does in a few sentences..."
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={!appName || !appDescription}
                      className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next Step
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Öffentliche Git URL (GitHub / GitLab)</label>
                    <div className="relative">
                      <input
                        type="url"
                        required
                        value={appLink}
                        onChange={(e) => setAppLink(e.target.value)}
                        placeholder="https://github.com/nutzer/projekt.git"
                        className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono text-sm"
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">App Category</label>
                      <select
                        value={appCategory}
                        onChange={(e) => setAppCategory(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-all"
                      >
                        <option>Productivity</option>
                        <option>Entertainment</option>
                        <option>Utilities</option>
                        <option>Lifestyle</option>
                        <option>Health & Fitness</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">License Type</label>
                      <select className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-all">
                        <option>MIT</option>
                        <option>Apache 2.0</option>
                        <option>GPL v3</option>
                        <option>BSD 3-Clause</option>
                        <option>Unlicense / Public Domain</option>
                      </select>
                    </div>
                  </div>
                  <div className="pt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-8 py-3 text-slate-400 hover:text-white transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      disabled={!appLink}
                      className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-500 transition-all disabled:opacity-50"
                    >
                      Next Step
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 text-center py-4">
                  <div className="w-16 h-16 bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                    <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">Verify Open-Source</h3>
                  <p className="text-slate-400 max-w-sm mx-auto">By submitting, you confirm that <strong>{appName}</strong> is Open-Source and its repository at <span className="text-indigo-400 break-all">{appLink}</span> is public.</p>

                  <div className="flex flex-col gap-3 max-w-xs mx-auto pt-6">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Verifying...
                        </>
                      ) : editingId ? "Save & Resubmit" : "Confirm & Submit"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      Wait, check link again
                    </button>
                  </div>
                </div>
              )}
            </form>
          </section>

          {/* Submissions List */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="font-semibold text-white">My Open-Source Submissions</h2>
              <span className="text-xs text-slate-500">{myApps.length} Apps</span>
            </div>
            <div className="divide-y divide-slate-800">
              {loadingApps ? (
                <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-2 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
                  Connecting to cloud...
                </div>
              ) : myApps.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  No submissions yet. Share your first open-source app above!
                </div>
              ) : (
                myApps.map((app) => (
                  <div key={app.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-white text-lg">{app.name}</h3>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${getStatusColor(app.status)}`}>
                          {app.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mt-1 line-clamp-1">{app.description}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" strokeWidth={2} /></svg>
                          {app.category}
                        </span>
                        <a
                          href={app.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-indigo-400 flex items-center gap-1 hover:underline"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                          Repository
                        </a>
                      </div>
                    </div>
                    {app.status === "Rejected" && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(app)}
                          className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-medium border border-slate-700 hover:bg-slate-700 transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Sidebar info */}
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 text-center justify-center">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Open-Source Policy
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Luma Store is built on the principles of transparency and community. Every application in our ecosystem **must** be Open-Source.
            </p>
            <div className="p-3 bg-indigo-900/20 border border-indigo-800/30 rounded-lg">
              <p className="text-xs text-indigo-300 font-medium">Why Open Source?</p>
              <p className="text-[10px] text-slate-500 mt-1">It ensures security, allows for community contributions, and helps us build a better ecosystem together.</p>
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Guidelines
            </h2>
            <ul className="space-y-4 text-sm text-slate-400">
              <li className="flex gap-3">
                <span className="text-indigo-400 font-bold">01.</span>
                <span>Provide a public link to your code repository.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-indigo-400 font-bold">02.</span>
                <span>Choose a standard Open-Source license (MIT, GPL, etc.).</span>
              </li>
              <li className="flex gap-3">
                <span className="text-indigo-400 font-bold">03.</span>
                <span>No obfuscated or malicious code allowed.</span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}