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
  "Action Game", "AI Chat", "Alarm Clock", "Ambient Sound", "App Manager", "App Store & Updater",
  "Battery", "Board Game", "Bookmark", "Browser", "Calculator", "Calendar & Agenda", "Camera",
  "Card Game", "Cast", "Casual Game", "Clock", "Cloud Storage & File Sync", "Code & Forge",
  "Connectivity", "Contact", "Covid", "Development", "Dice", "Diet", "DNS & Hosts", "Download",
  "Draw", "Ebook Reader", "Educational Game", "Email", "Emulator", "File Encryption & Vault",
  "File Manager", "File Transfer", "Firewall", "Finance Manager", "Flashlight", "Forum", "Gallery",
  "Game Helper", "Graphics", "Habit Tracker", "Health Manager", "Icon Pack", "Internet", "Inventory",
  "Keyboard & IME", "Launcher", "Local Media Player", "Location Tracker & Sharer", "Lyrics",
  "Market & Price", "Messaging", "Medication", "Meditation", "Mental Health", "Multimedia",
  "Music Practice Tool", "Navigation", "Network Analyzer", "News", "Note", "Notification", "OCR",
  "Online Media Player", "Party Game", "Pass Wallet", "Password & 2FA", "Phone & SMS", "Platformer Game",
  "Podcast", "Public Transport", "Push", "Puzzle Game", "Radio", "Reading", "Recipe Manager", "Recorder",
  "Remote Access", "Remote Controller", "Religion", "Role-Playing Game", "Science & Education", "Security",
  "Schedule", "Shooter Game", "Shopping List", "Social Network", "Sport Game", "Sports & Health",
  "Stopwatch", "Strategy Game", "System", "Task", "Text Editor", "Text Encryption", "Text to Speech",
  "Theming", "Time Tracker", "Timer", "Translation & Dictionary", "Unit Convertor", "Visual Novel",
  "Voice & Video Chat", "Volume", "VPN & Proxy", "Wallet", "Wallpaper", "Weather", "Workout",
  "Word Game", "Writing",
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

const fieldClass = "w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";
const cardClass = "rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-black/10";

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

  throw new Error("Fastlane metadata is incomplete. Luma Store requires title.txt, short_description.txt, full_description.txt, a changelog for the versionCode (or default.txt), and at least one phone screenshot.");
}

export default function LumaDeveloperPortal() {
  const supabase = useMemo(() => createClient(), []);
  const [step, setStep] = useState(1);
  const [appName, setAppName] = useState("");
  const [appLink, setAppLink] = useState("");
  const [appCategory, setAppCategory] = useState<string>("System");
  const [appLicenseType, setAppLicenseType] = useState("MIT");
  const [appIconUrl, setAppIconUrl] = useState("");
  const [iconPreviewError, setIconPreviewError] = useState(false);
  const [appVersion, setAppVersion] = useState("");
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

  const validAndroidMetadata =
    appPackageName.trim().length > 0 &&
    /^([A-Za-z][A-Za-z0-9_]*\.)+[A-Za-z][A-Za-z0-9_]*$/.test(appPackageName.trim()) &&
    /^\d+$/.test(appVersionCode.trim()) &&
    Number(appVersionCode) > 0;

  const invalidateFastlane = () => {
    setFastlaneMetadata(null);
    setFastlaneError(null);
  };

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
          shortDescription: item.short_description || "",
          description: item.description,
          link: item.link || "",
          status: item.status,
          submittedAt: item.submitted_at,
          category: item.category,
          licenseType: item.license_type || "",
          iconUrl: item.icon_url || "",
          version: item.version || "",
          platform: item.platform || "Android",
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
    setStep(1);
    setAppName("");
    setAppLink("");
    setAppCategory("System");
    setAppLicenseType("MIT");
    setAppIconUrl("");
    setIconPreviewError(false);
    setAppVersion("");
    setAppDownloadUrl("");
    setAppPackageName("");
    setAppVersionCode("");
    setFastlaneMetadata(null);
    setFastlaneError(null);
    setEditingId(null);
    setEditingStatus(null);
  };

  const beginEdit = (app: AppSubmission) => {
    if (app.status !== "Rejected" && app.status !== "Approved") return;

    setEditingId(app.id);
    setEditingStatus(app.status);
    setAppName(app.name);
    setAppLink(app.link);
    setAppCategory(FDROID_CATEGORIES.includes(app.category as typeof FDROID_CATEGORIES[number]) ? app.category : "System");
    setAppLicenseType(app.licenseType || "MIT");
    setAppIconUrl(app.iconUrl);
    setIconPreviewError(false);
    setAppVersion(app.version);
    setAppDownloadUrl(app.downloadUrl);
    setAppPackageName(app.packageName);
    setAppVersionCode(app.versionCode);
    setFastlaneMetadata(null);
    setFastlaneError(null);
    setStep(1);
    setSubmitted(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const verifyFastlane = async () => {
    setFastlaneLoading(true);
    setFastlaneError(null);
    setFastlaneMetadata(null);

    try {
      const metadata = await fetchFastlaneMetadata(appLink, appVersionCode);
      setFastlaneMetadata(metadata);
      setAppName(metadata.title);
    } catch (error) {
      setFastlaneError(error instanceof Error ? error.message : "Fastlane metadata could not be loaded.");
    } finally {
      setFastlaneLoading(false);
    }
  };

  const isApprovedUpdate = editingStatus === "Approved";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

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
        platform: "Android",
        download_url: appDownloadUrl.trim(),
        changelog: currentFastlaneMetadata.changelog,
        package_name: appPackageName.trim(),
        version_code: Number(appVersionCode),
        screenshots: currentFastlaneMetadata.screenshots,
      };

      let data: LumaSubmissionRow | null = null;
      let error: { message?: string; code?: string; details?: string; hint?: string } | null = null;

      if (editingId && editingStatus) {
        const result = await supabase
          .from("luma_submissions")
          .update({ ...appMetadata, status: "Pending", review_message: null, status_updated_at: new Date().toISOString() })
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
          .insert([{ user_id: user.id, ...appMetadata, status: "Pending", submitted_at: new Date().toISOString() }])
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
        shortDescription: data.short_description || "",
        description: data.description,
        link: data.link || "",
        status: data.status,
        submittedAt: data.submitted_at,
        category: data.category,
        licenseType: data.license_type || "",
        iconUrl: data.icon_url || "",
        version: data.version || "",
        platform: data.platform || "Android",
        downloadUrl: data.download_url || "",
        changelog: data.changelog || "",
        packageName: data.package_name || "",
        versionCode: data.version_code == null ? "" : String(data.version_code),
        screenshots: asStringArray(data.screenshots),
      };

      if (editingId) setMyApps((apps) => apps.map((app) => app.id === editingId ? savedApp : app));
      else setMyApps((apps) => [savedApp, ...apps]);

      setSubmitted(true);
      setEditingId(null);
      setEditingStatus(null);
    } catch (err) {
      console.error("Submission error:", err);
      const error = err as { message?: string; code?: string; details?: string; hint?: string };
      const details = [error.message, error.code, error.details, error.hint].filter(Boolean).join(" | ");
      alert(`Failed to save submission${details ? `: ${details}` : "."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "border-yellow-700/50 bg-yellow-900/30 text-yellow-300";
      case "In Review": return "border-blue-700/50 bg-blue-900/30 text-blue-300";
      case "Approved": return "border-emerald-700/50 bg-emerald-900/30 text-emerald-300";
      case "Rejected": return "border-red-700/50 bg-red-900/30 text-red-300";
      default: return "border-slate-700 bg-slate-800 text-slate-300";
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <div className={`${cardClass} p-10`}>
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-950/40 text-2xl text-emerald-300">✓</div>
          <h1 className="text-3xl font-bold text-white">{isApprovedUpdate ? "Update submitted" : "Submission received"}</h1>
          <p className="mt-3 text-slate-400">Fastlane metadata for <strong className="text-white">{appName}</strong> was imported successfully.</p>
          <button onClick={() => { setSubmitted(false); resetForm(); }} className="mt-8 rounded-xl bg-indigo-600 px-5 py-2.5 font-medium text-white transition hover:bg-indigo-500">Back to apps</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-20">
      <header className="flex flex-col gap-4 border-b border-slate-800 pb-7 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white"><span className="bg-gradient-to-r from-pink-500 to-indigo-500 bg-clip-text text-transparent">Luma Store</span> Developer Portal</h1>
          <p className="mt-2 max-w-2xl text-slate-400">Submit open-source Android apps using Fastlane metadata and the current F-Droid category set.</p>
        </div>
        <div className="w-fit rounded-full border border-emerald-500/30 bg-emerald-950/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">Open Source Only</div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <main className="space-y-8">
          <section className={cardClass}>
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
              <div>
                <h2 className="font-semibold text-white">{isApprovedUpdate ? "Submit App Update" : editingId ? "Edit Rejected Submission" : "New App Submission"}</h2>
                <p className="mt-1 text-xs text-slate-500">Step {step} of 3</p>
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3].map((i) => <div key={i} className={`h-1.5 w-9 rounded-full ${i <= step ? "bg-indigo-500" : "bg-slate-700"}`} />)}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-8">
              {step === 1 && (
                <div className="space-y-6">
                  <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-4 text-sm text-indigo-200">
                    Fastlane provides the app title, descriptions, changelog and phone screenshots. You only choose store-specific values here.
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">F-Droid Category</label>
                      <select value={appCategory} onChange={(e) => setAppCategory(e.target.value)} className={fieldClass}>
                        {FDROID_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">Open-Source License</label>
                      <select required value={appLicenseType} onChange={(e) => setAppLicenseType(e.target.value)} className={fieldClass}>
                        {LICENSE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label} ({value})</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">App Icon URL</label>
                    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
                      <div>
                        <input type="url" required value={appIconUrl} onChange={(e) => { setAppIconUrl(e.target.value); setIconPreviewError(false); }} placeholder="https://example.com/icon.png" className={fieldClass} />
                        <p className="mt-2 text-xs text-slate-500">Use a direct HTTPS image URL. PNG, JPG and WebP work best.</p>
                      </div>
                      <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4 text-center">
                        <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-slate-700 bg-slate-900">
                          {appIconUrl.trim() && !iconPreviewError ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={appIconUrl} src={appIconUrl.trim()} alt="App icon preview" className="h-full w-full object-cover" onError={() => setIconPreviewError(true)} />
                          ) : (
                            <span className="px-2 text-xs text-slate-500">{iconPreviewError ? "Preview failed" : "No icon"}</span>
                          )}
                        </div>
                        <p className={`mt-3 text-xs ${iconPreviewError ? "text-red-400" : "text-slate-500"}`}>{iconPreviewError ? "Check the image URL" : "Icon preview"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button type="button" onClick={() => setStep(2)} className="rounded-xl bg-indigo-600 px-5 py-2.5 font-medium text-white transition hover:bg-indigo-500">Next</button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-slate-300">GitHub Project / Source URL</label>
                      <input type="url" required value={appLink} onChange={(e) => { setAppLink(e.target.value); invalidateFastlane(); }} placeholder="https://github.com/owner/repository" className={fieldClass} />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">Download URL</label>
                      <input type="url" required value={appDownloadUrl} onChange={(e) => setAppDownloadUrl(e.target.value)} className={fieldClass} />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">Version</label>
                      <input required value={appVersion} onChange={(e) => setAppVersion(e.target.value)} className={fieldClass} />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">Android Package Name</label>
                      <input required value={appPackageName} onChange={(e) => setAppPackageName(e.target.value)} placeholder="com.example.app" className={fieldClass} />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">Android versionCode</label>
                      <input type="number" min={1} step={1} required value={appVersionCode} onChange={(e) => { setAppVersionCode(e.target.value); invalidateFastlane(); }} className={fieldClass} />
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                    <button type="button" onClick={verifyFastlane} disabled={!appLink.trim() || !validAndroidMetadata || fastlaneLoading} className="rounded-xl bg-slate-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-40">
                      {fastlaneLoading ? "Checking Fastlane…" : "Check Fastlane metadata"}
                    </button>
                    {fastlaneError && <p className="mt-3 text-sm text-red-400">{fastlaneError}</p>}
                  </div>

                  {fastlaneMetadata && (
                    <div className="space-y-5 rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-emerald-300">Fastlane metadata found</p>
                          <p className="mt-1 text-xs text-slate-500">{fastlaneMetadata.locale} · {fastlaneMetadata.branch}</p>
                        </div>
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-950/30 px-3 py-1 text-xs text-emerald-300">{fastlaneMetadata.screenshots.length} screenshots</span>
                      </div>

                      <div>
                        <p className="text-lg font-semibold text-white">{fastlaneMetadata.title}</p>
                        <p className="mt-1 text-sm text-slate-300">{fastlaneMetadata.shortDescription}</p>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Description</p>
                          <div className="max-h-48 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-slate-300">{fastlaneMetadata.fullDescription}</div>
                        </div>
                        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Changelog</p>
                          <div className="max-h-48 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-slate-300">{fastlaneMetadata.changelog}</div>
                        </div>
                      </div>

                      <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Phone screenshots</p>
                        <div className="flex gap-3 overflow-x-auto pb-2">
                          {fastlaneMetadata.screenshots.map((url) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={url} src={url} alt="Phone screenshot" className="h-56 w-auto shrink-0 rounded-xl border border-slate-700 bg-slate-950 object-contain" />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <button type="button" onClick={() => setStep(1)} className="rounded-xl bg-slate-800 px-5 py-2.5 font-medium text-white transition hover:bg-slate-700">Back</button>
                    <button type="button" onClick={() => setStep(3)} disabled={!fastlaneMetadata || !appDownloadUrl.trim() || !appVersion.trim() || !validAndroidMetadata} className="rounded-xl bg-indigo-600 px-5 py-2.5 font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
                    <dl className="grid gap-4 text-sm md:grid-cols-2">
                      <div><dt className="text-slate-500">Title</dt><dd className="mt-1 font-medium text-white">{fastlaneMetadata?.title}</dd></div>
                      <div><dt className="text-slate-500">Category</dt><dd className="mt-1 font-medium text-white">{appCategory}</dd></div>
                      <div><dt className="text-slate-500">Version</dt><dd className="mt-1 font-medium text-white">{appVersion}</dd></div>
                      <div><dt className="text-slate-500">versionCode</dt><dd className="mt-1 font-medium text-white">{appVersionCode}</dd></div>
                      <div><dt className="text-slate-500">Package</dt><dd className="mt-1 break-all font-medium text-white">{appPackageName}</dd></div>
                      <div><dt className="text-slate-500">Screenshots</dt><dd className="mt-1 font-medium text-white">{fastlaneMetadata?.screenshots.length ?? 0}</dd></div>
                    </dl>
                  </div>

                  <div className="flex justify-between">
                    <button type="button" onClick={() => setStep(2)} className="rounded-xl bg-slate-800 px-5 py-2.5 font-medium text-white transition hover:bg-slate-700">Back</button>
                    <button type="submit" disabled={isSubmitting || !fastlaneMetadata} className="rounded-xl bg-emerald-600 px-5 py-2.5 font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40">{isSubmitting ? "Saving…" : isApprovedUpdate ? "Submit Update" : "Submit App"}</button>
                  </div>
                </div>
              )}
            </form>
          </section>

          <section className={cardClass}>
            <div className="border-b border-slate-800 px-6 py-5">
              <h2 className="font-semibold text-white">My submissions</h2>
            </div>
            <div className="divide-y divide-slate-800">
              {loadingApps ? (
                <div className="p-6 text-slate-400">Loading…</div>
              ) : myApps.length === 0 ? (
                <div className="p-6 text-slate-400">No submissions yet.</div>
              ) : (
                myApps.map((app) => (
                  <div key={app.id} className="grid gap-4 p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-white">{app.name}</h3>
                        <span className={`rounded-full border px-2 py-0.5 text-xs ${getStatusColor(app.status)}`}>{app.status}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-400">{app.shortDescription || app.description}</p>
                      <p className="mt-2 text-xs text-slate-500">{app.category} · {app.version} · {app.screenshots.length} screenshot(s)</p>
                    </div>
                    {(app.status === "Rejected" || app.status === "Approved") && (
                      <div className="flex justify-start md:justify-end">
                        <button
                          type="button"
                          onClick={() => beginEdit(app)}
                          className="min-w-[132px] shrink-0 whitespace-nowrap rounded-xl bg-slate-800 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-slate-700"
                        >
                          {app.status === "Approved" ? "Submit update" : "Edit & resubmit"}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </main>

        <aside className="space-y-4">
          <div className={`${cardClass} p-5`}>
            <h3 className="font-semibold text-white">Fastlane requirements</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              <li>• title.txt</li>
              <li>• short_description.txt</li>
              <li>• full_description.txt</li>
              <li>• changelogs/&lt;versionCode&gt;.txt or default.txt</li>
              <li>• images/phoneScreenshots/*</li>
            </ul>
          </div>
          <div className={`${cardClass} p-5`}>
            <h3 className="font-semibold text-white">Category source</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">The dropdown now uses the current F-Droid metadata category set, including the newer game-specific and utility categories.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
