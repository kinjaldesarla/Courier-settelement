import Card from "./Card.jsx";
import { Skeleton } from "./Skeleton.jsx";

export default function SummaryCard({ label, value, helper, loading }) {
  return (
    <Card className="p-5">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      {loading ? <Skeleton className="mt-4 h-9 w-28" /> : <div className="mt-3 text-3xl font-semibold text-slate-900">{value}</div>}
      {helper ? <div className="mt-2 text-xs text-slate-500">{helper}</div> : null}
    </Card>
  );
}
