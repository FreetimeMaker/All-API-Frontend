"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface AppSubmission {
  id: string;
  name: string;
  description: string;
  link: string;
  status: "Pending" | "In Review" | "Approved" | "Rejected";
  submittedAt: string;
  category: string;
  iconUrl: string;
  version: string;
  platform: string;
  downloadUrl: string;
  changelog: string;
  packageName: string;
  versionCode: string;
}

interface LumaSubmissionRow {
  id: string;
  name: string;
  description: string;
  link: string | null;
  status: AppSubmission["status"];
  submitted_at: string;
  category: string;
  icon_url: string | null;
  version: string | null;
  platform: string | null;
  download_url: string | null;
  changelog: string | null;
  package_name: string | null;
  version_code: number | string | null;
}

export default function LumaDeveloperPortal() {
  const supabase = useMemo(() => createClient(), []);
  const [step, setStep] = useState(1);
  const [appName, setAppName] = useState("");
  const [appDescription, setAppDescription] = useState("");
  const [appLink, setAppLink] = useState("");
  const [appCategory, setAppCategory] = useState("Productivity");
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
  const [editingStatus, setEditingStatus] = useState<AppSubmission["status"] | null>(null);
  const [myApps, setMyApps] = useState<AppSubmission[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);

  const isAndroid = appPlatform === "Android";
  const validAndroidMetadata = !isAndroid || (
    appPackageName.trim().length > 0 &&
    /^([A-Za-z][A-Za-z0-9_]*\.)+[A-Za-z][A-Za-z0-9_]*$/.test(appPackageName.trim()) &&
    /^\d+$/.test(appVersionCode.trim()) &&
    Number(appVersionCode) > 0
  );

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

      const appMetadata = {
        name: appName.trim(),
        description: appDescription.trim(),
        link: appLink.trim(),
        category: appCategory,
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
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">App Icon URL</label>
                    <input type="url" required value={appIconUrl} onChange={(e) => setAppIconUrl(e.target.value)} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500" />
                    {appIconUrl.trim() && (
                      <div className="mt-4 flex items-center gap-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img key={appIconUrl} src={appIconUrl} alt="App icon preview" className="h-16 w-16 rounded-xl border border-slate-600 bg-slate-900 object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} />
                        <div><p className="text-sm font-medium text-slate-200">Icon preview</p><p className="mt-1 text-xs text-slate-500">Preview of the public icon URL.</p></div>
                      </div>
                    )}
                  </div>
                  <div className="pt-4 flex justify-end"><button type="button" onClick={() => setStep(2)} disabled={!appName.trim() || !appDescription.trim() || !appIconUrl.trim()} className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-500 disabled:opacity-50">Next Step</button></div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div><label className="block text-sm font-medium text-slate-300 mb-2">Public Git URL (GitHub / GitLab)</label><input type="url" required value={appLink} onChange={(e) => setAppLink(e.target.value)} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 font-mono text-sm" /></div>
                  <div><label className="block text-sm font-medium text-slate-300 mb-2">Download URL</label><input type="url" required value={appDownloadUrl} onChange={(e) => setAppDownloadUrl(e.target.value)} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 font-mono text-sm" /></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="block text-sm font-medium text-slate-300 mb-2">Version Name</label><input type="text" required value={appVersion} onChange={(e) => setAppVersion(e.target.value)} placeholder="e.g. 2.3.0" className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500" /></div>
                    <div><label className="block text-sm font-medium text-slate-300 mb-2">Platform</label><select required value={appPlatform} onChange={(e) => setAppPlatform(e.target.value)} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"><option value="Android">Android</option><option value="Windows">Windows</option><option value="Linux (debian based)">Linux (debian based)</option><option value="Linux (rpm based)">Linux (rpm based)</option></select></div>
                  </div>

                  {isAndroid && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Android Package Name</label>
                        <input type="text" required value={appPackageName} onChange={(e) => setAppPackageName(e.target.value)} placeholder="com.example.app" className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 font-mono text-sm" />
                        <p className="mt-2 text-xs text-slate-500">The applicationId from your Android Gradle configuration.</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Android versionCode</label>
                        <input type="number" min="1" step="1" required value={appVersionCode} onChange={(e) => setAppVersionCode(e.target.value)} placeholder="42" className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500" />
                        <p className="mt-2 text-xs text-slate-500">Used by Luma Store to determine whether an update is available.</p>
                      </div>
                    </div>
                  )}

                  {isApprovedUpdate && <div><label className="block text-sm font-medium text-slate-300 mb-2">Changelog <span className="text-red-400">*</span></label><textarea rows={6} required value={appChangelog} onChange={(e) => setAppChangelog(e.target.value)} placeholder="Describe what changed in this version..." className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500" /><p className="mt-2 text-xs text-slate-500">Required for updates to an already approved app.</p></div>}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className="block text-sm font-medium text-slate-300 mb-2">App Category</label><select value={appCategory} onChange={(e) => setAppCategory(e.target.value)} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"><option>Productivity</option><option>Entertainment</option><option>Utilities</option><option>Lifestyle</option><option>Health & Fitness</option></select></div><div><label className="block text-sm font-medium text-slate-300 mb-2">License Type</label><select className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"><option>MIT</option><option>Apache 2.0</option><option>GPL v3</option><option>BSD 3-Clause</option><option>Unlicense / Public Domain</option></select></div></div>
                  <div className="pt-4 flex justify-between"><button type="button" onClick={() => setStep(1)} className="px-8 py-3 text-slate-400 hover:text-white">Back</button><button type="button" onClick={() => setStep(3)} disabled={!appLink.trim() || !appDownloadUrl.trim() || !appVersion.trim() || !appPlatform || !validAndroidMetadata || (isApprovedUpdate && !appChangelog.trim())} className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-500 disabled:opacity-50">Next Step</button></div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 text-center py-4">
                  <h3 className="text-xl font-bold text-white">Verify submission</h3>
                  <p className="text-slate-400 max-w-md mx-auto">{isApprovedUpdate ? "This update will be sent back to manual review. The currently approved store version remains published until this update is approved." : "By submitting, you confirm that the repository and download URL are public."}</p>
                  {isAndroid && <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/10 p-4 text-left text-sm"><p><span className="font-semibold text-slate-300">Package:</span> <span className="font-mono text-emerald-300">{appPackageName}</span></p><p className="mt-1"><span className="font-semibold text-slate-300">versionCode:</span> <span className="text-emerald-300">{appVersionCode}</span></p></div>}
                  {isApprovedUpdate && <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-left"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Changelog</p><p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{appChangelog}</p></div>}
                  <div className="flex flex-col gap-3 max-w-xs mx-auto pt-6"><button type="submit" disabled={isSubmitting || !appIconUrl.trim() || !appVersion.trim() || !appPlatform || !appDownloadUrl.trim() || !validAndroidMetadata || (isApprovedUpdate && !appChangelog.trim())} className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-500 disabled:opacity-50">{isSubmitting ? "Submitting..." : isApprovedUpdate ? "Submit Update for Review" : editingId ? "Save & Resubmit" : "Confirm & Submit"}</button><button type="button" onClick={() => setStep(2)} className="text-sm text-slate-500 hover:text-slate-300">Wait, check details again</button></div>
                </div>
              )}
            </form>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between"><h2 className="font-semibold text-white">My Open-Source Submissions</h2><span className="text-xs text-slate-500">{myApps.length} Apps</span></div>
            <div className="divide-y divide-slate-800">
              {loadingApps ? <div className="p-12 text-center text-slate-500">Connecting to cloud...</div> : myApps.length === 0 ? <div className="p-12 text-center text-slate-500">No submissions yet.</div> : myApps.map((app) => (
                <div key={app.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/30">
                  <div className="flex gap-4 flex-1 min-w-0">{app.iconUrl && <img src={app.iconUrl} alt={`${app.name} icon`} className="w-14 h-14 rounded-xl object-cover border border-slate-700 shrink-0" />}<div className="min-w-0"><div className="flex flex-wrap items-center gap-3"><h3 className="font-bold text-white text-lg">{app.name}</h3><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${getStatusColor(app.status)}`}>{app.status}</span></div><p className="text-sm text-slate-400 mt-1 line-clamp-1">{app.description}</p><div className="flex flex-wrap items-center gap-3 mt-3 text-[10px] text-slate-500"><span>{app.category}</span><span>Version {app.version || "—"}</span><span>{app.platform || "—"}</span>{app.packageName && <span className="font-mono">{app.packageName}</span>}{app.versionCode && <span>code {app.versionCode}</span>}<a href={app.link} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Repository</a>{app.downloadUrl && <a href={app.downloadUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Download</a>}</div>{app.changelog && <p className="mt-3 text-xs text-slate-400"><span className="font-semibold text-slate-300">Changelog:</span> {app.changelog}</p>}</div></div>
                  {(app.status === "Rejected" || app.status === "Approved") && <button type="button" onClick={() => beginEdit(app)} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-medium border border-slate-700 hover:bg-slate-700">{app.status === "Approved" ? "Update" : "Edit"}</button>}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="lg:col-span-1 space-y-6"><section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm"><h2 className="text-lg font-semibold text-white mb-4">Submission requirements</h2><ul className="space-y-3 text-sm text-slate-400"><li>Public open-source repository</li><li>Public app icon URL</li><li>Current app version</li><li>Target platform</li><li>Direct public download URL</li><li>Android: package name + versionCode</li><li>Changelog required for updates</li><li>Standard open-source license</li></ul></section></div>
      </div>
    </div>
  );
}