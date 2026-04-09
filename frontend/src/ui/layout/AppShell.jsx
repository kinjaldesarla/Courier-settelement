import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Bell, Boxes, ChartColumn, Menu, Settings2, X } from "lucide-react";
import clsx from "clsx";

const navItems = [
  { to: "/", label: "Dashboard", icon: ChartColumn },
  { to: "/settlements", label: "Settlements", icon: Boxes },
  { to: "/jobs", label: "Jobs", icon: Settings2 },
  { to: "/notifications", label: "Notifications", icon: Bell }
];

function SidebarContent({ onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-lg font-bold text-white shadow-lg shadow-indigo-200">
            C
          </div>
          <div>
            <div className="text-lg font-semibold text-slate-900">CleverBooks</div>
            <div className="text-xs text-slate-500">Settlement control center</div>
          </div>
        </div>
      </div>

      <nav className="space-y-1 px-4 py-6">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onClick={onNavigate}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto p-4">
        <div className="rounded-3xl bg-slate-100 p-4 text-sm text-slate-600">
          <div className="font-semibold text-slate-900">Courier Settlement Reconciliation & Alert Engine</div>
          <p className="mt-2 leading-6">
            Monitor disputes, reconcile batches, and keep notification delivery visible in one place.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 border-r border-slate-200 bg-white lg:block">
          <SidebarContent />
        </aside>

        <div className="flex-1">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between px-4 py-4 sm:px-6">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Fintech Dashboard</div>
                <div className="text-lg font-semibold text-slate-900">Courier Settlement Reconciliation & Alert Engine</div>
              </div>
              <button
                type="button"
                className="rounded-2xl border border-slate-200 p-2 text-slate-700 lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </header>

          <main className="px-4 py-6 sm:px-6">{children}</main>
        </div>
      </div>

      <div
        className={clsx(
          "fixed inset-0 z-40 bg-slate-900/40 transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setMobileOpen(false)}
      />
      <div
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transition-transform lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex justify-end px-4 pt-4">
          <button
            type="button"
            className="rounded-2xl border border-slate-200 p-2 text-slate-700"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <SidebarContent onNavigate={() => setMobileOpen(false)} />
      </div>
    </div>
  );
}
