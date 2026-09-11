"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type SubmissionStatus = "Pending" | "In Review" | "Approved" | "Rejected";

type AppSubmission = {
  id: string;
  name: string;
  description: string;
  link: string;
  status: SubmissionStatus;
  submittedAt: string;
  category: string;
  subcategory: string;
  licenseType: string;
  iconUrl: string;
  version: string;
  platform: string;
  downloadUrl: string;
  changelog: string;
  packageName: string;
  versionCode: string;
};

type LumaSubmissionRow = {
  id: string;
  name: string;
  description: string;
  link: string | null;
  status: SubmissionStatus;
  submitted_at: string;
  category: string;
  subcategory: string | null;
  license_type: string | null;
  icon_url: string | null;
  version: string | null;
  platform: string | null;
  download_url: string | null;
  changelog: string | null;
  package_name: string | null;
  version_code: number | string | null;
};

const CATEGORY_OPTIONS: Record<string, string[]> = {
  Productivity: ["Office", "Notes & Tasks", "Calendar & Time", "File Management"],
  Entertainment: ["Streaming", "Podcasts", "Radio"],
  Utilities: ["System Tools", "Backup & Sync", "Automation", "Calculators & Converters"],
  Lifestyle: [],
  "Health & Fitness": ["Fitness", "Nutrition", "Wellbeing"],
  Games: ["Action", "Adventure", "Arcade", "Puzzle", "Racing", "Role Playing", "Simulation", "Strategy", "Casual"],
  Development: ["IDEs & Editors", "Git & Version Control", "API & Networking Tools", "Terminal & Shell"],
  Education: ["Languages", "Mathematics", "Programming", "Study Tools"],
  Communication: ["Messaging", "Email", "VoIP & Calls"],
  Internet: ["Browsers", "Download Managers", "Network Tools"],
  Multimedia: ["Music & Audio", "Video", "Photography", "Graphics & Design"],
  Finance: ["Budgeting", "Cryptocurrency"],
  Science: ["Astronomy", "Electronics"],
  "Navigation & Travel": ["Maps", "Public Transport", "Travel Planning"],
  "Security & Privacy": ["Password Managers", "Authentication", "Encryption", "Privacy Tools"],
  Accessibility: [],
  Customization: ["Launchers", "Themes & Wallpapers"],
  "Books & Reference": ["E-Books", "Dictionaries"],
  "News & Weather": ["Weather", "News Readers"],
  Social: ["Social Networks", "Forums & Communities"],
};

const LICENSE_OPTIONS = [
  ["MIT", "MIT License"],
  ["Apache-2.0", "Apache License 2.0"],
  ["GPL-2.0-only", "GNU GPL v2 only"],
  ["GPL-2.0-or-later", "GNU GPL v2 or later"],
  ["GPL-3.0-only", "GNU GPL v3 only"],
  ["GPL-3.0-or-later", "GNU GPL v3 or later"],
  ["LGPL-2.1-only", "GNU LGPL v2.1 only"],
  ["LGPL-2.1-or-later", "GNU LGPL v2.1 or later"],
  ["LGPL-3.0-only", "GNU LGPL v3 only"],
  ["LGPL-3.0-or-later", "GNU LGPL v3 or later"],
  ["AGPL-3.0-only", "GNU AGPL v3 only"],
  ["AGPL-3.0-or-later", "GNU AGPL v3 or later"],
  ["MPL-2.0", "Mozilla Public License 2.0"],
  ["BSD-2-Clause", "BSD 2-Clause"],
  ["BSD-3-Clause", "BSD 3-Clause"],
  ["ISC", "ISC License"],
  ["Unlicense", "The Unlicense"],
  ["CC0-1.0", "CC0 1.0"],
  ["EPL-2.0", "Eclipse Public License 2.0"],
  ["EUPL-1.2", "European Union Public Licence 1.2"],
  ["Zlib", "zlib License"],
  ["BSL-1.0", "Boost Software License 1.0"],
  ["Artistic-2.0", "Artistic License 2.0"],
] as const;

export default function LumaDeveloperPortal() {
  const supabase = useMemo(() => createClient(), []);
  const [step, setStep] = useState(1);
  const [appName, setAppName] = useState("");
  const [appDescription, setAppDescription] = useState("");
  const [appLink, setAppLink] = useState("");
  const [appCategory, setAppCategory] = useState("Productivity");
  const [appSubcategory, setAppSubcategory] = useState("Office");
  const [appLicenseType, setAppLicenseType] = useState("MIT");
  const [appIconUrl, setAppIconUrl] = useState("");
  const [appVersion, setAppVersion] = useState("");
  const [appPlatform, setAppPlatform] = useState("Android");
  const [appDownloadUrl, setAppDownloadUrl] = useState("");
  const [appChangelog, setAppChangelog] = useState("");
  const [appPackageName, setAppPackageName] = useState("");
  const [appVersionCode, setAppVersionCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<SubmissionStatus | null>(null);
  const [myApps, setMyApps] = useState<AppSubmission[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);

  const subcategoryOptions = CATEGORY_OPTIONS[appCategory] ?? [];
  const isAndroid = appPlatform === "Android";
  const validAndroidMetadata = !isAndroid || (
    appPackageName.trim().length > 0 &&
    /^([A-Za-z][A-Za-z0-9_]*\.)+[A-Za-z][A-Za-z0-9_]*$/.test(appPackageName.trim()) &&
    /^\d+$/.test(appVersionCode.trim()) &&
    Number(appVersionCode) > 0
  );

  useEffect(() => {
    if (subcategoryOptions.length === 0) {
      if (appSubcategory !== "") setAppSubcategory("");
      return;
    }
    if (!subcategoryOptions.includes(appSubcategory)) {
      setAppSubcategory(subcategoryOptions[0]);
    }
  }, [appCategory, appSubcategory, subcategoryOptions]);

  useEffect(() => {
    async function fetchApps() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadingApps(false);
        return;
      }

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
          category: item.category,
          subcategory: item.subcategory || "",
          licenseType: item.license_type || "",
          iconUrl: item.icon_url || "",
          version: item.version || "",
          platform: item.platform || "",
          downloadUrl: item.download_url || "",
          changelog: item.changelog || "",
          packageName: item.package_name || "",
          versionCode: item.version_code == null ? "" : String(item.version_code),
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
    setAppSubcategory("Office");
    setAppLicenseType("MIT");
    setAppIconUrl("");
    setAppVersion("");
    setAppPlatform("Android");
    setAppDownloadUrl("");
    setAppChangelog("");
    setAppPackageName("");
    setAppVersionCode("");
    setEditingId(null);
    setEditingStatus(null);
  };

  const beginEdit = (app: AppSubmission) => {
    if (app.status !== "Rejected" && app.status !== "Approved") return;

    setEditingId(app.id);
    setEditingStatus(app.status);
    setAppName(app.name);
    setAppDescription(app.description);
    setAppLink(app.link);
    setAppCategory(app.category);
    setAppSubcategory(app.subcategory);
    setAppLicenseType(app.licenseType || "MIT");
    setAppIconUrl(app.iconUrl);
    setAppVersion(app.version);
    setAppPlatform(app.platform || "Android");
    setAppDownloadUrl(app.downloadUrl);
    setAppChangelog("");
    setAppPackageName(app.packageName);
    setAppVersionCode(app.versionCode);
    setStep(1);
    setSubmitted(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isApprovedUpdate = editingStatus === "Approved";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      if (isApprovedUpdate && !appChangelog.trim()) throw new Error("A changelog is required for app updates.");
      if (!validAndroidMetadata) throw new Error("Android apps require a valid package name and positive versionCode.");
      if (!appLicenseType) throw new Error("Please select an open-source license.");

      const appMetadata = {
        name: appName.trim(),
        description: appDescription.trim(),
        link: appLink.trim(),
        category: appCategory,
        subcategory: appSubcategory || null,
        license_type: appLicenseType,
        icon_url: appIconUrl.trim(),
        version: appVersion.trim(),
        platform: appPlatform,
        download_url: appDownloadUrl.trim(),
        changelog: appChangelog.trim() || null,
        package_name: isAndroid ? appPackageName.trim() : null,
        version_code: isAndroid ? Number(appVersionCode) : null,
      };

      let data: LumaSubmissionRow | null = null;
      let error: { message?: string; code?: string; details?: string; hint?: string } | null = null;

      if (editingId && editingStatus) {
        const result = await supabase
          .from("luma_submissions")
          .update({
            ...appMetadata,
            status: "Pending",
            review_message: null,
            status_updated_at: new Date().toISOString(),
          })
          .eq("id", editingId)
          .eq("user_id", user.id)
          .eq("status", editingStatus)
          .select()
          .single();

        data = result.data as LumaSubmissionRow | null;
        error = result.error;
      } else {
        const result = await supabase
          .from("luma_submissions")
          .insert([{
            user_id: user.id,
            ...appMetadata,
            changelog: null,
            status: "Pending",
            submitted_at: new Date().toISOString(),
          }])
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
        category: data.category,
        subcategory: data.subcategory || "",
        licenseType: data.license_type || "",
        iconUrl: data.icon_url || "",
        version: data.version || "",
        platform: data.platform || "",
        downloadUrl: data.download_url || "",
        changelog: data.changelog || "",
        packageName: data.package_name || "",
        versionCode: data.version_code == null ? "" : String(data.version_code),
      };

      if (editingId) {
        setMyApps((apps) => apps.map((app) => app.id === editingId ? savedApp : app));
      } else {
        setMyApps((apps) => [savedApp, ...apps]);
      }

      setSubmitted(true);
      setEditingId(null);
      setEditingStatus(null);
    } catch (err) {
      console.error("Submission error:", err);
      const e = err as { message?: string; code?: string; details?: string; hint?: string };
      const details = [e.message, e.code, e.details, e.hint].filter(Boolean).join(" | ");
      alert(`Failed to save submission${details ? `: ${details}` : "."}`);
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
          <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">{isApprovedUpdate ? "Update submitted for review!" : "Submission received!"}</h1>
        <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">Your submission for <strong>{appName}</strong> is now Pending and will be reviewed again.</p>
        <button onClick={() => { setSubmitted(false); resetForm(); }} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors">Back to apps</button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3"><span className="bg-gradient-to-r from-pink-500 to-indigo-500 text-transparent bg-clip-text">Luma Store</span> Developer Portal</h1>
          <p className="text-slate-400 mt-2">Publish and update your Open-Source apps on the Luma ecosystem.</p>
        </div>
        <div className="px-3 py-1 bg-emerald-900/20 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/30 uppercase tracking-wider text-center">Open Source Only</div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl"><p className="text-xs text-slate-500 font-bold uppercase mb-1">Total Submissions</p><p className="text-2xl font-bold text-white">{loadingApps ? "..." : myApps.length}</p></div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl"><p className="text-xs text-slate-500 font-bold uppercase mb-1">Approved Apps</p><p className="text-2xl font-bold text-white">{loadingApps ? "..." : myApps.filter((app) => app.status === "Approved").length}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <h2 className="font-semibold text-white">{isApprovedUpdate ? "Submit App Update" : editingId ? "Edit Rejected Submission" : "New App Submission"}</h2>
              <div className="flex gap-1">{[1, 2, 3].map((i) => <div key={i} className={`h-1.5 w-8 rounded-full transition-colors ${i <= step ? "bg-indigo-500" : "bg-slate-700"}`} />)}</div>
            </div>

            {isApprovedUpdate && <div className="mx-8 mt-6 rounded-lg border border-blue-500/30 bg-blue-950/20 px-4 py-3 text-sm text-blue-200">You are updating an approved app. The currently published version stays available while this update is reviewed. A changelog is required.</div>}
            {editingStatus === "Rejected" && <div className="mx-8 mt-6 rounded-lg border border-red-500/30 bg-red-950/20 px-4 py-3 text-sm text-red-200">You are editing a rejected submission. Saving it will resubmit the app and set its status back to Pending.</div>}

            <form onSubmit={handleSubmit} className="p-8">
              {step === 1 && (
                <div className="space-y-6">
                  <div className="p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-lg"><p className="text-sm text-indigo-300">Important: We only accept Open-Source applications.</p></div>
                  <div><label className="block text-sm font-medium text-slate-300 mb-2">Application Name</label><input type="text" required value={appName} onChange={(e) => setAppName(e.target.value)} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500" /></div>
                  <div><label className="block text-sm font-medium text-slate-300 mb-2">Short Description</label><textarea rows={4} required value={appDescription} onChange={(e) => setAppDescription(e.target.value)} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500" /></div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                      <select value={appCategory} onChange={(e) => setAppCategory(e.target.value)} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white">
                        {Object.keys(CATEGORY_OPTIONS).map((category) => <option key={category} value={category}>{category}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Subcategory</label>
                      <select disabled={subcategoryOptions.length === 0} value={appSubcategory} onChange={(e) => setAppSubcategory(e.target.value)} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white disabled:opacity-50">
                        {subcategoryOptions.length === 0 ? <option value="">No subcategory</option> : subcategoryOptions.map((subcategory) => <option key={subcategory} value={subcategory}>{subcategory}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Open-Source License</label>
                    <select required value={appLicenseType} onChange={(e) => setAppLicenseType(e.target.value)} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white">
                      {LICENSE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label} ({value})</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">App Icon URL</label>
                    <input type="url" required value={appIconUrl} onChange={(e) => setAppIconUrl(e.target.value)} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500" />
                    {appIconUrl.trim() && (
                      <div className="mt-4 flex items-center gap-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          key={appIconUrl}
                          src={appIconUrl}
                          alt="App icon preview"
                          className="h-20 w-20 shrink-0 rounded-2xl border border-slate-600 bg-slate-900 object-cover"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white">App Icon Preview</p>
                          <p className="mt-1 break-all text-xs text-slate-400">{appIconUrl}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end"><button type="button" onClick={() => setStep(2)} disabled={!appName.trim() || !appDescription.trim() || !appLicenseType} className="px-5 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-40">Next</button></div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div><label className="block text-sm font-medium text-slate-300 mb-2">Project / Source URL</label><input type="url" required value={appLink} onChange={(e) => setAppLink(e.target.value)} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" /></div>
                  <div><label className="block text-sm font-medium text-slate-300 mb-2">Download URL</label><input type="url" required value={appDownloadUrl} onChange={(e) => setAppDownloadUrl(e.target.value)} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" /></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-slate-300 mb-2">Version</label><input type="text" required value={appVersion} onChange={(e) => setAppVersion(e.target.value)} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" /></div>
                    <div><label className="block text-sm font-medium text-slate-300 mb-2">Platform</label><select value={appPlatform} onChange={(e) => setAppPlatform(e.target.value)} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"><option>Android</option><option>Windows</option><option>Linux</option></select></div>
                  </div>
                  {isAndroid && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-slate-300 mb-2">Android Package Name</label><input type="text" required value={appPackageName} onChange={(e) => setAppPackageName(e.target.value)} placeholder="com.example.app" className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" /></div>
                    <div><label className="block text-sm font-medium text-slate-300 mb-2">Android versionCode</label><input type="number" min={1} step={1} required value={appVersionCode} onChange={(e) => setAppVersionCode(e.target.value)} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" /></div>
                  </div>}
                  {isApprovedUpdate && <div><label className="block text-sm font-medium text-slate-300 mb-2">Changelog</label><textarea rows={4} required value={appChangelog} onChange={(e) => setAppChangelog(e.target.value)} placeholder="Describe what changed in this version..." className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" /></div>}
                  <div className="flex justify-between"><button type="button" onClick={() => setStep(1)} className="px-5 py-2 rounded-lg bg-slate-800 text-white">Back</button><button type="button" onClick={() => setStep(3)} disabled={!appLink.trim() || !appDownloadUrl.trim() || !appVersion.trim() || !appPlatform || !validAndroidMetadata || (isApprovedUpdate && !appChangelog.trim())} className="px-5 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-40">Next</button></div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-5 space-y-3 text-sm">
                    <p><span className="text-slate-400">Name:</span> <span className="text-white">{appName}</span></p>
                    <p><span className="text-slate-400">Category:</span> <span className="text-white">{appCategory}{appSubcategory ? ` / ${appSubcategory}` : ""}</span></p>
                    <p><span className="text-slate-400">License:</span> <span className="text-white">{appLicenseType}</span></p>
                    <p><span className="text-slate-400">Version:</span> <span className="text-white">{appVersion}</span></p>
                    <p><span className="text-slate-400">Platform:</span> <span className="text-white">{appPlatform}</span></p>
                    {isAndroid && <p><span className="text-slate-400">Android:</span> <span className="text-white">{appPackageName} · versionCode {appVersionCode}</span></p>}
                  </div>
                  <div className="flex justify-between"><button type="button" onClick={() => setStep(2)} className="px-5 py-2 rounded-lg bg-slate-800 text-white">Back</button><button type="submit" disabled={isSubmitting} className="px-5 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-40">{isSubmitting ? "Saving..." : isApprovedUpdate ? "Submit Update" : "Submit App"}</button></div>
                </div>
              )}
            </form>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800"><h2 className="font-semibold text-white">My submissions</h2></div>
            <div className="divide-y divide-slate-800">
              {loadingApps ? <div className="p-6 text-slate-400">Loading...</div> : myApps.length === 0 ? <div className="p-6 text-slate-400">No submissions yet.</div> : myApps.map((app) => (
                <div key={app.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-white">{app.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full border text-xs ${getStatusColor(app.status)}`}>{app.status}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">{app.category}{app.subcategory ? ` / ${app.subcategory}` : ""} · {app.licenseType || "No license"} · {app.version || "No version"}</p>
                    {app.packageName && <p className="mt-1 text-xs text-slate-500">{app.packageName}{app.versionCode ? ` · versionCode ${app.versionCode}` : ""}</p>}
                  </div>
                  {(app.status === "Rejected" || app.status === "Approved") && <button type="button" onClick={() => beginEdit(app)} className="px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700">{app.status === "Approved" ? "Submit update" : "Edit & resubmit"}</button>}
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="font-semibold text-white mb-3">Submission requirements</h3>
            <ul className="space-y-2 text-sm text-slate-400 list-disc pl-5">
              <li>Open-source application</li>
              <li>Valid project and download URLs</li>
              <li>Category, optional subcategory and license</li>
              <li>Android: package name + versionCode</li>
              <li>Updates require a changelog</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
