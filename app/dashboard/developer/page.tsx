"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type SubmissionStatus = "Pending" | "In Review" | "Approved" | "Rejected";

type AppSubmission = {
  id: string;
  name: string;
  shortDescription: string;
  description: string;
  link: string;
  status: SubmissionStatus;
  submittedAt: string;
  category: string;
  licenseType: string;
  iconUrl: string;
  version: string;
  platform: string;
  downloadUrl: string;
  changelog: string;
  packageName: string;
  versionCode: string;
  screenshots: string[];
};

type LumaSubmissionRow = {
  id: string;
  name: string;
  short_description: string | null;
  description: string;
  link: string | null;
  status: SubmissionStatus;
  submitted_at: string;
  category: string;
  license_type: string | null;
  icon_url: string | null;
  version: string | null;
  platform: string | null;
  download_url: string | null;
  changelog: string | null;
  package_name: string | null;
  version_code: number | string | null;
  screenshots: unknown;
};

type FastlaneMetadata = {
  title: string;
  shortDescription: string;
  fullDescription: string;
  changelog: string;
  screenshots: string[];
  locale: string;
  branch: string;
};

const FDROID_CATEGORIES = [
  "AI Chat", "App Manager", "App Store & Updater", "Battery", "Bookmark", "Browser",
  "Calculator", "Calendar & Agenda", "Clock", "Cloud Storage & File Sync", "Connectivity",
  "Contact", "Development", "Diet", "DNS & Hosts", "Draw", "Ebook Reader", "Email",
  "File Encryption & Vault", "File Transfer", "Firewall", "Finance Manager", "Flashlight",
  "Forum", "Gallery", "Games", "Graphics", "Habit Tracker", "Health Manager", "Icon Pack",
  "Internet", "Inventory", "Keyboard & IME", "Launcher", "Local Media Player",
  "Location Tracker & Sharer", "Messaging", "Money", "Multimedia", "Music Practice Tool",
  "Navigation", "Network Analyzer", "News", "Note", "Online Media Player", "Pass Wallet",
  "Password & 2FA", "Phone & SMS", "Podcast", "Public Transport", "Radio", "Reading",
  "Recipe Manager", "Remote Control", "Science & Education", "Security", "Shopping",
  "Sports & Health", "System", "Task", "Theming", "Time", "Translator", "VPN & Proxy",
  "Weather", "Writing",
] as const;

const LICENSE_OPTIONS = [
  ["MIT", "MIT License"], ["Apache-2.0", "Apache License 2.0"],
  ["GPL-2.0-only", "GNU GPL v2 only"], ["GPL-2.0-or-later", "GNU GPL v2 or later"],
  ["GPL-3.0-only", "GNU GPL v3 only"], ["GPL-3.0-or-later", "GNU GPL v3 or later"],
  ["LGPL-2.1-only", "GNU LGPL v2.1 only"], ["LGPL-2.1-or-later", "GNU LGPL v2.1 or later"],
  ["LGPL-3.0-only", "GNU LGPL v3 only"], ["LGPL-3.0-or-later", "GNU LGPL v3 or later"],
  ["AGPL-3.0-only", "GNU AGPL v3 only"], ["AGPL-3.0-or-later", "GNU AGPL v3 or later"],
  ["MPL-2.0", "Mozilla Public License 2.0"], ["BSD-2-Clause", "BSD 2-Clause"],
  ["BSD-3-Clause", "BSD 3-Clause"], ["ISC", "ISC License"], ["Unlicense", "The Unlicense"],
  ["CC0-1.0", "CC0 1.0"], ["EPL-2.0", "Eclipse Public License 2.0"],
  ["EUPL-1.2", "European Union Public Licence 1.2"], ["Zlib", "zlib License"],
  ["BSL-1.0", "Boost Software License 1.0"], ["Artistic-2.0", "Artistic License 2.0"],
] as const;

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function githubRepository(projectUrl: string): { owner: string; repo: string; branches: string[] } {
  let parsed: URL;
  try {
    parsed = new URL(projectUrl.trim());
  } catch {
    throw new Error("Please enter a valid GitHub repository URL.");
  }
  if (parsed.hostname.toLowerCase() !== "github.com") {
    throw new Error("Fastlane metadata is currently read from GitHub repositories. Please use a github.com repository URL.");
  }
  const parts = parsed.pathname.split("/").filter(Boolean);
  if (parts.length < 2) throw new Error("Please enter the URL of a GitHub repository.");
  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/i, "");
  const branchFromUrl = parts[2] === "tree" && parts[3] ? decodeURIComponent(parts[3]) : null;
  const branches = Array.from(new Set([branchFromUrl, "main", "master"].filter(Boolean))) as string[];
  return { owner, repo, branches };
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    const value = (await response.text()).trim();
    return value || null;
  } catch {
    return null;
  }
}

async function fetchPhoneScreenshots(owner: string, repo: string, branch: string, locale: string): Promise<string[]> {
  const path = `fastlane/metadata/android/${locale}/images/phoneScreenshots`;
  const apiUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path}?ref=${encodeURIComponent(branch)}`;
  try {
    const response = await fetch(apiUrl, {
      cache: "no-store",
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!response.ok) return [];
    const data = await response.json();
    if (!Array.isArray(data)) return [];
    return data
      .filter((item) => item?.type === "file" && typeof item?.name === "string" && /\.(png|jpe?g)$/i.test(item.name))
      .sort((a, b) => String(a.name).localeCompare(String(b.name)))
      .map((item) => item.download_url)
      .filter((url): url is string => typeof url === "string" && url.length > 0);
  } catch {
    return [];
  }
}

async function fetchFastlaneMetadata(projectUrl: string, versionCode: string): Promise<FastlaneMetadata> {
  const numericVersionCode = Number(versionCode);
  if (!Number.isInteger(numericVersionCode) || numericVersionCode <= 0) {
    throw new Error("Enter a positive Android versionCode before checking Fastlane metadata.");
  }

  const { owner, repo, branches } = githubRepository(projectUrl);
  const locales = ["en-US", "en-GB", "de-DE", "en", "de"];

  for (const branch of branches) {
    for (const locale of locales) {
      const base = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/fastlane/metadata/android/${locale}`;
      const title = await fetchText(`${base}/title.txt`);
      if (!title) continue;
      const shortDescription = await fetchText(`${base}/short_description.txt`);
      const fullDescription = await fetchText(`${base}/full_description.txt`);
      if (!shortDescription || !fullDescription) continue;

      const changelog =
        (await fetchText(`${base}/changelogs/${numericVersionCode}.txt`)) ??
        (await fetchText(`${base}/changelogs/default.txt`));
      if (!changelog) continue;

      const screenshots = await fetchPhoneScreenshots(owner, repo, branch, locale);
      if (screenshots.length === 0) continue;

      return { title, shortDescription, fullDescription, changelog, screenshots, locale, branch };
    }
  }

  throw new Error(
    "Fastlane metadata is incomplete. Luma Store requires title.txt, short_description.txt, full_description.txt, a changelog for the versionCode (or default.txt), and at least one images/phoneScreenshots image."
  );
}

export default function LumaDeveloperPortal() {
  const supabase = useMemo(() => createClient(), []);
  const [step, setStep] = useState(1);
  const [appName, setAppName] = useState("");
  const [appLink, setAppLink] = useState("");
  const [appCategory, setAppCategory] = useState<string>("System");
  const [appLicenseType, setAppLicenseType] = useState("MIT");
  const [appIconUrl, setAppIconUrl] = useState("");
  const [appVersion, setAppVersion] = useState("");
  const [appPlatform, setAppPlatform] = useState("Android");
  const [appDownloadUrl, setAppDownloadUrl] = useState("");
  const [appPackageName, setAppPackageName] = useState("");
  const [appVersionCode, setAppVersionCode] = useState("");
  const [fastlaneMetadata, setFastlaneMetadata] = useState<FastlaneMetadata | null>(null);
  const [fastlaneError, setFastlaneError] = useState<string | null>(null);
  const [fastlaneLoading, setFastlaneLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<SubmissionStatus | null>(null);
  const [myApps, setMyApps] = useState<AppSubmission[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);

  const isAndroid = appPlatform === "Android";
  const validAndroidMetadata = !isAndroid || (
    appPackageName.trim().length > 0 &&
    /^([A-Za-z][A-Za-z0-9_]*\.)+[A-Za-z][A-Za-z0-9_]*$/.test(appPackageName.trim()) &&
    /^\d+$/.test(appVersionCode.trim()) && Number(appVersionCode) > 0
  );

  const invalidateFastlane = () => {
    setFastlaneMetadata(null);
    setFastlaneError(null);
  };

  useEffect(() => {
    async function fetchApps() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoadingApps(false); return; }
      const { data, error } = await supabase
        .from("luma_submissions")
        .select("*")
        .eq("user_id", user.id)
        .order("submitted_at", { ascending: false });
      if (!error && data) {
        setMyApps(data.map((item: LumaSubmissionRow) => ({
          id: item.id,
          name: item.name,
          shortDescription: item.short_description || "",
          description: item.description,
          link: item.link || "",
          status: item.status,
          submittedAt: item.submitted_at,
          category: item.category,
          licenseType: item.license_type || "",
          iconUrl: item.icon_url || "",
          version: item.version || "",
          platform: item.platform || "",
          downloadUrl: item.download_url || "",
          changelog: item.changelog || "",
          packageName: item.package_name || "",
          versionCode: item.version_code == null ? "" : String(item.version_code),
          screenshots: asStringArray(item.screenshots),
        })));
      }
      setLoadingApps(false);
    }
    fetchApps();
  }, [supabase]);

  const resetForm = () => {
    setStep(1); setAppName(""); setAppLink(""); setAppCategory("System"); setAppLicenseType("MIT");
    setAppIconUrl(""); setAppVersion(""); setAppPlatform("Android"); setAppDownloadUrl("");
    setAppPackageName(""); setAppVersionCode(""); setFastlaneMetadata(null); setFastlaneError(null);
    setFastlaneLoading(false); setEditingId(null); setEditingStatus(null);
  };

  const beginEdit = (app: AppSubmission) => {
    if (app.status !== "Rejected" && app.status !== "Approved") return;
    setEditingId(app.id); setEditingStatus(app.status); setAppName(app.name); setAppLink(app.link);
    setAppCategory(FDROID_CATEGORIES.includes(app.category as typeof FDROID_CATEGORIES[number]) ? app.category : "System");
    setAppLicenseType(app.licenseType || "MIT"); setAppIconUrl(app.iconUrl); setAppVersion(app.version);
    setAppPlatform(app.platform || "Android"); setAppDownloadUrl(app.downloadUrl);
    setAppPackageName(app.packageName); setAppVersionCode(app.versionCode); setFastlaneMetadata(null);
    setFastlaneError(null); setStep(1); setSubmitted(false); window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const verifyFastlane = async () => {
    setFastlaneLoading(true); setFastlaneError(null); setFastlaneMetadata(null);
    try {
      const metadata = await fetchFastlaneMetadata(appLink, appVersionCode);
      setFastlaneMetadata(metadata); setAppName(metadata.title);
    } catch (error) {
      setFastlaneError(error instanceof Error ? error.message : "Fastlane metadata could not be loaded.");
    } finally {
      setFastlaneLoading(false);
    }
  };

  const isApprovedUpdate = editingStatus === "Approved";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      if (!validAndroidMetadata) throw new Error("Android apps require a valid package name and positive versionCode.");
      if (!FDROID_CATEGORIES.includes(appCategory as typeof FDROID_CATEGORIES[number])) throw new Error("Please select a valid F-Droid category.");
      if (!appLicenseType) throw new Error("Please select an open-source license.");

      const currentFastlaneMetadata = await fetchFastlaneMetadata(appLink.trim(), appVersionCode);
      setFastlaneMetadata(currentFastlaneMetadata);
      setAppName(currentFastlaneMetadata.title);

      const appMetadata = {
        name: currentFastlaneMetadata.title,
        short_description: currentFastlaneMetadata.shortDescription,
        description: currentFastlaneMetadata.fullDescription,
        link: appLink.trim(),
        category: appCategory,
        subcategory: null,
        license_type: appLicenseType,
        icon_url: appIconUrl.trim(),
        version: appVersion.trim(),
        platform: appPlatform,
        download_url: appDownloadUrl.trim(),
        changelog: currentFastlaneMetadata.changelog,
        package_name: isAndroid ? appPackageName.trim() : null,
        version_code: isAndroid ? Number(appVersionCode) : null,
        screenshots: currentFastlaneMetadata.screenshots,
      };

      let data: LumaSubmissionRow | null = null;
      let error: { message?: string; code?: string; details?: string; hint?: string } | null = null;
      if (editingId && editingStatus) {
        const result = await supabase.from("luma_submissions").update({
          ...appMetadata, status: "Pending", review_message: null, status_updated_at: new Date().toISOString(),
        }).eq("id", editingId).eq("user_id", user.id).eq("status", editingStatus).select().single();
        data = result.data as LumaSubmissionRow | null; error = result.error;
      } else {
        const result = await supabase.from("luma_submissions").insert([{
          user_id: user.id, ...appMetadata, status: "Pending", submitted_at: new Date().toISOString(),
        }]).select().single();
        data = result.data as LumaSubmissionRow | null; error = result.error;
      }
      if (error) throw error;
      if (!data) throw new Error("Submission could not be saved");

      const savedApp: AppSubmission = {
        id: data.id, name: data.name, shortDescription: data.short_description || "", description: data.description,
        link: data.link || "", status: data.status, submittedAt: data.submitted_at, category: data.category,
        licenseType: data.license_type || "", iconUrl: data.icon_url || "", version: data.version || "",
        platform: data.platform || "", downloadUrl: data.download_url || "", changelog: data.changelog || "",
        packageName: data.package_name || "", versionCode: data.version_code == null ? "" : String(data.version_code),
        screenshots: asStringArray(data.screenshots),
      };
      if (editingId) setMyApps((apps) => apps.map((app) => app.id === editingId ? savedApp : app));
      else setMyApps((apps) => [savedApp, ...apps]);
      setSubmitted(true); setEditingId(null); setEditingStatus(null);
    } catch (err) {
      console.error("Submission error:", err);
      const error = err as { message?: string; code?: string; details?: string; hint?: string };
      const details = [error.message, error.code, error.details, error.hint].filter(Boolean).join(" | ");
      alert(`Failed to save submission${details ? `: ${details}` : "."}`);
    } finally { setIsSubmitting(false); }
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

  if (submitted) return (
    <div className="max-w-4xl mx-auto py-12 px-6 text-center">
      <div className="w-20 h-20 bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/50">
        <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
      </div>
      <h1 className="text-3xl font-bold text-white mb-4">{isApprovedUpdate ? "Update submitted for review!" : "Submission received!"}</h1>
      <p className="text-slate-400 text-lg mb-8">Fastlane metadata for <strong>{appName}</strong> was imported successfully.</p>
      <button onClick={() => { setSubmitted(false); resetForm(); }} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500">Back to apps</button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-8">
        <div><h1 className="text-3xl font-bold text-white"><span className="bg-gradient-to-r from-pink-500 to-indigo-500 text-transparent bg-clip-text">Luma Store</span> Developer Portal</h1><p className="text-slate-400 mt-2">Publish and update your Open-Source apps on the Luma ecosystem.</p></div>
        <div className="px-3 py-1 bg-emerald-900/20 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/30 uppercase">Open Source Only</div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-700 flex items-center justify-between"><h2 className="font-semibold text-white">{isApprovedUpdate ? "Submit App Update" : editingId ? "Edit Rejected Submission" : "New App Submission"}</h2><div className="flex gap-1">{[1,2,3].map((i) => <div key={i} className={`h-1.5 w-8 rounded-full ${i <= step ? "bg-indigo-500" : "bg-slate-700"}`} />)}</div></div>
            <form onSubmit={handleSubmit} className="p-8">
              {step === 1 && <div className="space-y-6">
                <div className="p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-lg"><p className="text-sm text-indigo-300">Fastlane is required. App title, short description, full description, changelog and phone screenshots are imported from fastlane/metadata/android.</p></div>
                <div><label className="block text-sm font-medium text-slate-300 mb-2">F-Droid Category</label><select value={appCategory} onChange={(e) => setAppCategory(e.target.value)} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white">{FDROID_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-slate-300 mb-2">Open-Source License</label><select required value={appLicenseType} onChange={(e) => setAppLicenseType(e.target.value)} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white">{LICENSE_OPTIONS.map(([value,label]) => <option key={value} value={value}>{label} ({value})</option>)}</select></div>
                <div><label className="block text-sm font-medium text-slate-300 mb-2">App Icon URL</label><input type="url" required value={appIconUrl} onChange={(e) => setAppIconUrl(e.target.value)} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" />{appIconUrl.trim() && <div className="mt-3 flex items-center gap-3"><img src={appIconUrl} alt="App icon preview" className="h-16 w-16 rounded-xl object-cover" /><span className="text-sm text-slate-400">App Icon Preview</span></div>}</div>
                <div className="flex justify-end"><button type="button" onClick={() => setStep(2)} className="px-5 py-2 rounded-lg bg-indigo-600 text-white">Next</button></div>
              </div>}

              {step === 2 && <div className="space-y-6">
                <div><label className="block text-sm font-medium text-slate-300 mb-2">GitHub Project / Source URL</label><input type="url" required value={appLink} onChange={(e) => { setAppLink(e.target.value); invalidateFastlane(); }} placeholder="https://github.com/owner/repository" className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" /></div>
                <div><label className="block text-sm font-medium text-slate-300 mb-2">Download URL</label><input type="url" required value={appDownloadUrl} onChange={(e) => setAppDownloadUrl(e.target.value)} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-slate-300 mb-2">Version</label><input required value={appVersion} onChange={(e) => setAppVersion(e.target.value)} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" /></div><div><label className="block text-sm font-medium text-slate-300 mb-2">Platform</label><select value={appPlatform} onChange={(e) => { setAppPlatform(e.target.value); invalidateFastlane(); }} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"><option>Android</option></select></div></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-slate-300 mb-2">Android Package Name</label><input required value={appPackageName} onChange={(e) => setAppPackageName(e.target.value)} placeholder="com.example.app" className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" /></div><div><label className="block text-sm font-medium text-slate-300 mb-2">Android versionCode</label><input type="number" min={1} step={1} required value={appVersionCode} onChange={(e) => { setAppVersionCode(e.target.value); invalidateFastlane(); }} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" /></div></div>
                <div><button type="button" onClick={verifyFastlane} disabled={!appLink.trim() || !validAndroidMetadata || fastlaneLoading} className="px-4 py-2 rounded-lg bg-slate-700 text-white disabled:opacity-40">{fastlaneLoading ? "Checking Fastlane..." : "Check Fastlane metadata"}</button>{fastlaneError && <p className="mt-3 text-sm text-red-400">{fastlaneError}</p>}</div>
                {fastlaneMetadata && <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-3"><p className="font-semibold text-emerald-300">Fastlane metadata found · {fastlaneMetadata.locale} · {fastlaneMetadata.branch}</p><p className="text-white font-semibold">{fastlaneMetadata.title}</p><p className="text-sm text-slate-300">{fastlaneMetadata.shortDescription}</p><div className="max-h-36 overflow-y-auto whitespace-pre-wrap text-sm text-slate-400">{fastlaneMetadata.fullDescription}</div><div className="border-t border-slate-700 pt-3"><p className="text-xs font-semibold text-slate-300">Changelog</p><p className="whitespace-pre-wrap text-sm text-slate-400">{fastlaneMetadata.changelog}</p></div><div><p className="text-xs font-semibold text-slate-300 mb-2">Phone screenshots ({fastlaneMetadata.screenshots.length})</p><div className="flex gap-2 overflow-x-auto">{fastlaneMetadata.screenshots.map((url) => <img key={url} src={url} alt="Phone screenshot" className="h-48 rounded-lg border border-slate-700" />)}</div></div></div>}
                <div className="flex justify-between"><button type="button" onClick={() => setStep(1)} className="px-5 py-2 rounded-lg bg-slate-800 text-white">Back</button><button type="button" onClick={() => setStep(3)} disabled={!fastlaneMetadata || !appDownloadUrl.trim() || !appVersion.trim() || !validAndroidMetadata} className="px-5 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-40">Next</button></div>
              </div>}

              {step === 3 && <div className="space-y-6"><div className="rounded-xl border border-slate-700 bg-slate-800/40 p-5 space-y-3 text-sm"><p><span className="text-slate-400">Fastlane title:</span> <span className="text-white">{fastlaneMetadata?.title}</span></p><p><span className="text-slate-400">Short description:</span> <span className="text-white">{fastlaneMetadata?.shortDescription}</span></p><p><span className="text-slate-400">Screenshots:</span> <span className="text-white">{fastlaneMetadata?.screenshots.length ?? 0}</span></p><p><span className="text-slate-400">F-Droid Category:</span> <span className="text-white">{appCategory}</span></p><p><span className="text-slate-400">Version:</span> <span className="text-white">{appVersion} · versionCode {appVersionCode}</span></p></div><div className="flex justify-between"><button type="button" onClick={() => setStep(2)} className="px-5 py-2 rounded-lg bg-slate-800 text-white">Back</button><button type="submit" disabled={isSubmitting || !fastlaneMetadata} className="px-5 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-40">{isSubmitting ? "Saving..." : isApprovedUpdate ? "Submit Update" : "Submit App"}</button></div></div>}
            </form>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"><div className="px-6 py-4 border-b border-slate-800"><h2 className="font-semibold text-white">My submissions</h2></div><div className="divide-y divide-slate-800">{loadingApps ? <div className="p-6 text-slate-400">Loading...</div> : myApps.length === 0 ? <div className="p-6 text-slate-400">No submissions yet.</div> : myApps.map((app) => <div key={app.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-white">{app.name}</h3><span className={`px-2 py-0.5 rounded-full border text-xs ${getStatusColor(app.status)}`}>{app.status}</span></div><p className="mt-1 text-sm text-slate-400">{app.shortDescription || app.description} · {app.category} · {app.version}</p><p className="mt-1 text-xs text-slate-500">{app.screenshots.length} phone screenshot(s)</p></div>{(app.status === "Rejected" || app.status === "Approved") && <button type="button" onClick={() => beginEdit(app)} className="px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700">{app.status === "Approved" ? "Submit update" : "Edit & resubmit"}</button>}</div>)}</div></section>
        </div>

        <aside className="space-y-4"><div className="bg-slate-900 border border-slate-800 rounded-xl p-5"><h3 className="font-semibold text-white mb-3">Fastlane requirements</h3><ul className="space-y-2 text-sm text-slate-400 list-disc pl-5"><li>title.txt</li><li>short_description.txt</li><li>full_description.txt</li><li>changelogs/&lt;versionCode&gt;.txt or changelogs/default.txt</li><li>images/phoneScreenshots with at least one PNG/JPG</li><li>All metadata is re-read when submitting</li></ul></div></aside>
      </div>
    </div>
  );
}
