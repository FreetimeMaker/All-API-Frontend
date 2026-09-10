import type { ReactNode } from "react";

export default function DeveloperLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="max-w-6xl mx-auto px-1">
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 px-5 py-4">
          <h2 className="font-semibold text-amber-200">Manual review and publishing</h2>
          <p className="mt-1 text-sm leading-relaxed text-amber-100/80">
            Every Luma Store submission is reviewed and processed manually. We manually check the public source code,
            licensing, app details and publishing requirements before changing its status. Once an app is manually
            marked as Approved, it is automatically exposed through the public Luma Store API at
            <code className="mx-1 rounded bg-slate-950/60 px-1.5 py-0.5 text-amber-200">/api/luma/apps</code>.
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}
