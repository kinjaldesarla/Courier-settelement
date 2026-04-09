import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import Badge from "../components/Badge.jsx";
import { Skeleton } from "../components/Skeleton.jsx";

function formatDate(value) {
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return "-";
  }
}

function formatCurrency(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

export default function SettlementsTable({
  items,
  loading,
  error,
  onSelect,
  onLoadMore,
  canLoadMore
}) {
  const [q, setQ] = useState("");
  const [onlyDiscrepancyRows, setOnlyDiscrepancyRows] = useState(false);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return (items ?? []).filter((settlement) => {
      if (onlyDiscrepancyRows && !(settlement.discrepancyTypes?.length > 0)) return false;
      if (!query) return true;
      return (
        String(settlement.awbNumber ?? "").toLowerCase().includes(query) ||
        String(settlement.batchId ?? "").toLowerCase().includes(query) ||
        String(settlement.reconciliationStatus ?? "").toLowerCase().includes(query) ||
        (settlement.discrepancyTypes ?? []).some((type) => String(type).toLowerCase().includes(query))
      );
    });
  }, [items, q, onlyDiscrepancyRows]);

  return (
    <div>
      <div className="flex flex-col gap-4 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search AWB, batch, status, or discrepancy type"
            className="w-full rounded-full border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 shadow-sm transition focus:border-slate-400 focus:bg-white focus:ring-slate-300"
          />
        </div>
        <label className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 shadow-sm">
          <input
            type="checkbox"
            checked={onlyDiscrepancyRows}
            onChange={(event) => setOnlyDiscrepancyRows(event.target.checked)}
            className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
          />
          Discrepancies only
        </label>
      </div>

      {loading ? (
        <div className="space-y-3 px-5 pb-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-1 gap-3 rounded-[24px] border border-slate-100 bg-slate-50 p-4 md:grid-cols-4 xl:grid-cols-7"
            >
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5 w-4/5" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="px-5 pb-6 text-sm text-rose-700">Failed to load settlements.</div>
      ) : filtered.length === 0 ? (
        <div className="px-5 pb-6">
          <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <div className="text-base font-semibold text-slate-950">No settlements found</div>
            <div className="mt-2 text-sm text-slate-600">Try uploading a batch or widening the current filters.</div>
          </div>
        </div>
      ) : (
        <div className="px-3 pb-4 sm:px-5">
          <div className="hidden overflow-hidden rounded-[28px] border border-slate-200/80 xl:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-5 py-4">AWB</th>
                  <th className="px-5 py-4">Batch</th>
                  <th className="px-5 py-4">Settlement date</th>
                  <th className="px-5 py-4">COD</th>
                  <th className="px-5 py-4">Weight</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Discrepancy tags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map((settlement) => {
                  const isDiscrepancy = (settlement.discrepancyTypes?.length ?? 0) > 0;
                  return (
                    <tr
                      key={settlement._id}
                      onClick={() => onSelect?.(settlement)}
                      className={[
                        "cursor-pointer transition hover:bg-slate-50",
                        isDiscrepancy ? "bg-rose-50/30" : ""
                      ].join(" ")}
                    >
                      <td className="px-5 py-4 font-semibold text-slate-950">{settlement.awbNumber}</td>
                      <td className="px-5 py-4 text-slate-600">{settlement.batchId}</td>
                      <td className="px-5 py-4 text-slate-600">{formatDate(settlement.settlementDate)}</td>
                      <td className="px-5 py-4 text-slate-700">{formatCurrency(settlement.settledCodAmount)}</td>
                      <td className="px-5 py-4 text-slate-700">{settlement.chargedWeight} kg</td>
                      <td className="px-5 py-4">
                        <Badge value={settlement.reconciliationStatus} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          {(settlement.discrepancyTypes ?? []).slice(0, 2).map((type) => (
                            <span
                              key={type}
                              className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600"
                            >
                              {type}
                            </span>
                          ))}
                          {(settlement.discrepancyTypes ?? []).length > 2 ? (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                              +{(settlement.discrepancyTypes ?? []).length - 2}
                            </span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 xl:hidden">
            {filtered.map((settlement) => {
              const isDiscrepancy = (settlement.discrepancyTypes?.length ?? 0) > 0;
              return (
                <button
                  key={settlement._id}
                  onClick={() => onSelect?.(settlement)}
                  className={[
                    "rounded-[26px] border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                    isDiscrepancy ? "border-rose-200 bg-rose-50/50" : "border-slate-200 bg-white"
                  ].join(" ")}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold text-slate-950">{settlement.awbNumber}</div>
                      <div className="mt-1 text-sm text-slate-500">Batch {settlement.batchId}</div>
                    </div>
                    <Badge value={settlement.reconciliationStatus} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Settlement date</div>
                      <div className="mt-1">{formatDate(settlement.settlementDate)}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">COD</div>
                      <div className="mt-1">{formatCurrency(settlement.settledCodAmount)}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Weight</div>
                      <div className="mt-1">{settlement.chargedWeight} kg</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Tags</div>
                      <div className="mt-1">{(settlement.discrepancyTypes ?? []).length || 0}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Showing {filtered.length} rows</div>
        <button
          onClick={onLoadMore}
          disabled={!canLoadMore || loading}
          className="rounded-full border border-slate-200 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Load more
        </button>
      </div>
    </div>
  );
}
