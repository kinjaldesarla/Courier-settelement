import Card from "../components/Card.jsx";
import { Skeleton } from "../components/Skeleton.jsx";
import { BellDot, BriefcaseBusiness, CircleAlert, ShieldCheck } from "lucide-react";

function inr(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return "--";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(n);
}

export default function SummaryCards({ settlements, loading, status, notifications, jobs }) {
  const total = (settlements ?? []).length;
  const discrepancyRows = (settlements ?? []).filter((s) => (s.discrepancyTypes?.length ?? 0) > 0);
  const matchedRows = Math.max(total - discrepancyRows.length, 0);
  const alertCount = (notifications ?? []).length;
  const jobCount = (jobs ?? []).length;

  let codShort = 0;
  for (const settlement of discrepancyRows) {
    for (const discrepancy of settlement.discrepancies ?? []) {
      if (discrepancy.type === "COD_SHORT_REMITTANCE" && typeof discrepancy.difference === "number") {
        codShort += Math.abs(discrepancy.difference);
      }
    }
  }

  const cards = [
    {
      label: "Rows in scope",
      value: total,
      tone: "bg-sky-50 text-sky-900 ring-sky-200",
      accent: "text-sky-600",
      icon: BriefcaseBusiness
    },
    {
      label: "Matched rows",
      value: matchedRows,
      tone: "bg-emerald-50 text-emerald-900 ring-emerald-200",
      accent: "text-emerald-600",
      icon: ShieldCheck
    },
    {
      label: "Discrepancy rows",
      value: discrepancyRows.length,
      tone: "bg-rose-50 text-rose-900 ring-rose-200",
      accent: "text-rose-600",
      icon: CircleAlert
    },
    {
      label: "Notification events",
      value: alertCount,
      tone: "bg-amber-50 text-amber-900 ring-amber-200",
      accent: "text-amber-600",
      icon: BellDot
    }
  ];

  return (
    <Card className="overflow-hidden border border-slate-200/70 bg-white/90">
      <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">At a glance</div>
          <div className="mt-1 text-xl font-semibold text-slate-950">Operational snapshot</div>
          <div className="mt-1 text-sm text-slate-500">Current filter: {status.replaceAll("_", " ")}</div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs sm:flex sm:flex-wrap">
          <div className="rounded-full bg-slate-100 px-3 py-2 font-semibold text-slate-600">{jobCount} recent jobs</div>
          <div className="rounded-full bg-slate-100 px-3 py-2 font-semibold text-slate-600">{inr(codShort)} at risk</div>
        </div>
      </div>
      <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className={`rounded-[24px] p-4 ring-1 ring-inset ${card.tone}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-80">{card.label}</div>
              <card.icon className={`h-4 w-4 ${card.accent}`} />
            </div>
            {loading ? (
              <Skeleton className="mt-4 h-8 w-16 bg-white/70" />
            ) : (
              <div className="mt-4 text-3xl font-semibold">{card.value}</div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
