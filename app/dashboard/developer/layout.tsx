import type { ReactNode } from "react";
import Link from "next/link";

export default function DeveloperLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <div className="mx-auto max-w-6xl min-w-0 space-y-3 px-0 sm:px-1">
        <div className="flex sm:justify-end">
          <Link
            href="/dashboard/developer/status"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-indigo-700/50 bg-indigo-950/30 px-4 py-2.5 text-center text-sm font-medium text-indigo-200 transition-colors hover:bg-indigo-900/40 active:bg-indigo-900/60 sm:w-auto"
          >
            View submission status & timeline
          </Link>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-4 sm:px-5">
          <h2 className="font-semibold text-amber-200">Manual review and publishing</h2>
          <p className="mt-1 text-sm leading-relaxed text-amber-100/80">
            Every Luma Store submission is reviewed and processed manually. I manually check the public source code,
            licensing, app details and publishing requirements before changing its status. Once an app is manually
            marked as Approved, it is automatically exposed through the public Luma Store API at{" "}
            <code className="inline break-all rounded bg-slate-950/60 px-1.5 py-0.5 text-amber-200">/api/luma/apps</code>.
            Developers can follow every status change and reviewer message in the submission timeline and receive
            email notifications when the status changes.
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}
