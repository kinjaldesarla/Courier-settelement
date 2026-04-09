import clsx from "clsx";

const styles = {
  MATCHED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  DISCREPANCY: "bg-rose-50 text-rose-700 ring-rose-200",
  PENDING_REVIEW: "bg-amber-50 text-amber-700 ring-amber-200",
  SENT: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  FAILED: "bg-rose-50 text-rose-700 ring-rose-200",
  RETRIED: "bg-orange-50 text-orange-700 ring-orange-200",
  PENDING: "bg-slate-100 text-slate-700 ring-slate-200",
  SUCCESS: "bg-emerald-50 text-emerald-700 ring-emerald-200"
};

export default function StatusBadge({ value }) {
  const style = styles[value] ?? "bg-slate-100 text-slate-700 ring-slate-200";
  return (
    <span className={clsx("inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset", style)}>
      {String(value ?? "UNKNOWN").replaceAll("_", " ")}
    </span>
  );
}
