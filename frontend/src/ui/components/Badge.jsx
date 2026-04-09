import clsx from "clsx";

const styles = {
  MATCHED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  DISCREPANCY: "bg-rose-50 text-rose-700 ring-rose-200",
  PENDING_REVIEW: "bg-amber-50 text-amber-800 ring-amber-200",
  SENT: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  FAILED: "bg-rose-50 text-rose-700 ring-rose-200",
  RETRIED: "bg-amber-50 text-amber-800 ring-amber-200",
  PENDING: "bg-slate-50 text-slate-700 ring-slate-200"
};

export default function Badge({ value }) {
  const cls = styles[value] ?? "bg-slate-50 text-slate-700 ring-slate-200";
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ring-1 ring-inset",
        cls
      )}
    >
      {String(value ?? "UNKNOWN").replaceAll("_", " ")}
    </span>
  );
}
