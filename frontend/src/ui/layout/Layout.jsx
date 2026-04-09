import {
  Bell,
  FileUp,
  LayoutDashboard,
  Menu,
  RefreshCw,
  Sparkles,
  X
} from "lucide-react";
import { useMemo, useState } from "react";

const nav = [
  { label: "Overview", href: "#dashboard", icon: LayoutDashboard },
  { label: "Uploads", href: "#uploads", icon: FileUp },
  { label: "Alerts", href: "#dashboard", icon: Bell }
];

export default function Layout({ children, onManualReconcile, reconciling }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = useMemo(
    () => (
      <div className="flex h-full flex-col">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#38bdf8,_#2563eb)] text-white shadow-[0_12px_32px_rgba(37,99,235,0.4)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-lg text-white">Settlement OS</div>
              <div className="text-xs text-slate-400">Courier reconciliation suite</div>
            </div>
          </div>
        </div>

        <nav className="space-y-1 px-3 py-6">
          {nav.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-slate-300 transition hover:bg-white/8 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              <item.icon className="h-4 w-4 text-slate-500 transition group-hover:text-sky-300" />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="mt-auto p-4">
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Mission</div>
            <div className="mt-2 font-medium text-white">Catch financial leakage before it compounds.</div>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Upload settlement batches, review mismatches, and trigger reconciliation from one responsive workspace.
            </p>
          </div>
        </div>
      </div>
    ),
    []
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f7fafc_0%,_#eef4ff_34%,_#f7f7f2_100%)] text-slate-900">
      <div className="fixed inset-x-0 top-0 z-10 h-[32rem] bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_55%),radial-gradient(circle_at_left_top,_rgba(245,158,11,0.12),_transparent_35%)] pointer-events-none" />
      <div className="relative mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-[290px] shrink-0 border-r border-white/10 bg-slate-950 lg:block">
          {sidebar}
        </aside>

        <div
          className={[
            "fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm transition lg:hidden",
            mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
          ].join(" ")}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
        <aside
          className={[
            "fixed inset-y-0 left-0 z-50 w-[290px] bg-slate-950 shadow-2xl transition-transform lg:hidden",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          ].join(" ")}
        >
          <div className="flex items-center justify-end px-4 pt-4">
            <button
              onClick={() => setMobileOpen(false)}
              className="rounded-xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {sidebar}
        </aside>

        <main className="min-w-0 flex-1 px-4 py-4 sm:px-6 lg:px-8">
          <header className="sticky top-0 z-30 mb-6 rounded-[28px] border border-white/70 bg-white/72 px-4 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <button
                  onClick={() => setMobileOpen(true)}
                  className="mt-0.5 rounded-2xl border border-slate-200 bg-white p-2 text-slate-700 shadow-sm lg:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Professional dashboard</div>
                  <div className="mt-1 font-display text-2xl text-slate-950 sm:text-3xl">
                    Courier Settlement Reconciliation and Alert Engine
                  </div>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Smooth landing experience, responsive dashboard surfaces, and richer operational visibility across uploads,
                    reconciliation, and notifications.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                  System live
                </div>
                <button
                  onClick={onManualReconcile}
                  disabled={reconciling}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw className={["h-4 w-4", reconciling ? "animate-spin" : ""].join(" ")} />
                  Run reconciliation
                </button>
              </div>
            </div>
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}
