"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface SubmissionRow {
  id: string;
  name: string;
  description: string;
  link: string | null;
  category: string | null;
  status: "Pending" | "In Review" | "Approved" | "Rejected";
  submitted_at: string;
  review_message: string | null;
  changelog: string | null;
  status_updated_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
}

interface HistoryRow {
  id: number;
  submission_id: string;
  status: SubmissionRow["status"];
  review_message: string | null;
  created_at: string;
}

const statusColors: Record<SubmissionRow["status"], string> = {
  Pending: "border-yellow-700/50 bg-yellow-900/30 text-yellow-300",
  "In Review": "border-blue-700/50 bg-blue-900/30 text-blue-300",
  Approved: "border-emerald-700/50 bg-emerald-900/30 text-emerald-300",
  Rejected: "border-red-700/50 bg-red-900/30 text-red-300",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default function DeveloperStatusPage() {
  const supabase = useMemo(() => createClient(), []);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be signed in.");
        setLoading(false);
        return;
      }

      const { data: submissionData, error: submissionError } = await supabase
        .from("luma_submissions")
        .select("id,name,description,link,category,status,submitted_at,review_message,changelog,status_updated_at,approved_at,rejected_at")
        .eq("user_id", user.id)
        .order("submitted_at", { ascending: false });

      if (submissionError) {
        setError("Could not load your app submissions.");
        setLoading(false);
        return;
      }

      const rows = (submissionData ?? []) as SubmissionRow[];
      setSubmissions(rows);

      if (rows.length > 0) {
        const { data: historyData, error: historyError } = await supabase
          .from("luma_submission_status_history")
          .select("id,submission_id,status,review_message,created_at")
          .in("submission_id", rows.map((row) => row.id))
          .order("created_at", { ascending: true });

        if (historyError) {
          setError("Submissions loaded, but the status timeline could not be loaded.");
        } else {
          setHistory((historyData ?? []) as HistoryRow[]);
        }
      }

      setLoading(false);
    }

    load();
  }, [supabase]);

  return (
    <div className="mx-auto min-w-0 max-w-6xl space-y-4 pb-16 sm:space-y-6 sm:pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Submission status</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400 sm:text-base">Follow review steps, changelogs, reviewer messages and publication decisions for your apps.</p>
        </div>
        <Link href="/dashboard/developer" className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-center text-sm font-medium text-slate-200 hover:bg-slate-800 sm:w-auto">Back to Developer Portal</Link>
      </div>

      {loading && <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-center text-slate-400 sm:p-10">Loading submission history…</div>}
      {error && <div className="rounded-xl border border-amber-800/50 bg-amber-950/30 px-4 py-4 text-sm text-amber-200 sm:px-5">{error}</div>}
      {!loading && submissions.length === 0 && <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-center text-slate-400 sm:p-10">You have not submitted an app yet.</div>}

      <div className="space-y-4 sm:space-y-5">
        {submissions.map((submission) => {
          const events = history.filter((entry) => entry.submission_id === submission.id);
          return (
            <section key={submission.id} className="min-w-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
              <div className="flex min-w-0 flex-col gap-3 border-b border-slate-800 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-6">
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
                    <h2 className="min-w-0 break-words text-lg font-bold text-white sm:text-xl">{submission.name}</h2>
                    <span className={`shrink-0 rounded border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider sm:text-xs ${statusColors[submission.status]}`}>{submission.status}</span>
                  </div>
                  <p className="mt-2 break-words text-sm leading-relaxed text-slate-400">{submission.description}</p>
                  <p className="mt-2 text-xs text-slate-500">Last status update: {formatDate(submission.status_updated_at)}</p>
                </div>
                {submission.link && <a href={submission.link} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-slate-700 px-3 py-2 text-center text-sm font-medium text-indigo-400 hover:bg-slate-800 hover:underline sm:w-auto sm:border-0 sm:p-0">Open repository</a>}
              </div>

              {submission.changelog && (
                <div className="mx-4 mt-4 rounded-lg border border-blue-800/40 bg-blue-950/30 p-4 sm:mx-6 sm:mt-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-300">Update changelog</p>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-300">{submission.changelog}</p>
                </div>
              )}

              {submission.review_message && (
                <div className="mx-4 mt-4 rounded-lg border border-indigo-800/40 bg-indigo-950/30 p-4 sm:mx-6 sm:mt-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-300">Latest reviewer message</p>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-300">{submission.review_message}</p>
                </div>
              )}

              <div className="p-4 sm:p-6">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300 sm:mb-5">Timeline</h3>
                <div className="space-y-0">
                  {events.length === 0 ? <p className="text-sm text-slate-500">No timeline entries are available yet.</p> : events.map((event, index) => (
                    <div key={event.id} className="relative flex min-w-0 gap-3 pb-6 last:pb-0 sm:gap-4">
                      {index < events.length - 1 && <div className="absolute left-[7px] top-4 h-full w-px bg-slate-700" />}
                      <div className="relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-indigo-400 bg-slate-900" />
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                          <p className="font-semibold text-white">{event.status}</p>
                          <span className="text-xs text-slate-500">{formatDate(event.created_at)}</span>
                        </div>
                        {event.review_message && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-400">{event.review_message}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
