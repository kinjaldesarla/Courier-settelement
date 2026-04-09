import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Skeleton } from "../components/Skeleton.jsx";

const COLORS = ["#0f172a", "#1d4ed8", "#0f766e", "#f59e0b", "#dc2626", "#7c3aed"];

export default function DiscrepancyChart({ items, loading }) {
  const data = useMemo(() => {
    const counts = new Map();
    for (const settlement of items ?? []) {
      for (const type of settlement.discrepancyTypes ?? []) {
        counts.set(type, (counts.get(type) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [items]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-64 w-full rounded-[24px]" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
        No discrepancies to chart yet.
      </div>
    );
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="#dbe6f3" vertical={false} />
          <XAxis dataKey="type" tick={{ fontSize: 11, fill: "#475569" }} interval={0} angle={-14} height={56} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#475569" }} />
          <Tooltip
            cursor={{ fill: "rgba(15, 23, 42, 0.05)" }}
            contentStyle={{ borderRadius: 16, borderColor: "#e2e8f0", boxShadow: "0 20px 50px rgba(15,23,42,0.12)" }}
          />
          <Bar dataKey="count" radius={[14, 14, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={entry.type} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
