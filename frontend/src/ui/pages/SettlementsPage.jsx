import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Download } from "lucide-react";
import toast from "react-hot-toast";
import { fetchSettlements, uploadSettlements } from "../../lib/api";
import Card from "../components/Card.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Modal from "../components/Modal.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { Skeleton } from "../components/Skeleton.jsx";
import UploadPanel from "../features/UploadPanel.jsx";

const FILTERS = ["ALL", "MATCHED", "DISCREPANCY", "PENDING_REVIEW"];

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value ?? 0);
}

function downloadCsv(rows) {
  const headers = [
    "awbNumber",
    "merchantId",
    "courierPartner",
    "reconciliationStatus",
    "settledCodAmount",
    "discrepancyTypes",
    "settlementDate"
  ];
  const csv = [headers.join(",")]
    .concat(
      rows.map((row) =>
        [
          row.awbNumber,
          row.merchantId ?? "",
          row.courierPartner ?? "",
          row.reconciliationStatus ?? "",
          row.settledCodAmount ?? 0,
          (row.discrepancyTypes ?? []).join("|"),
          row.settlementDate ? format(new Date(row.settlementDate), "yyyy-MM-dd") : ""
        ]
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(",")
      )
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "settlements.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function SettlementCards({ rows, onSelect }) {
  return (
    <div className="grid gap-4 p-4 md:grid-cols-2 xl:hidden">
      {rows.map((row) => (
        <div key={row._id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-slate-900">{row.awbNumber}</div>
              <div className="mt-1 text-sm text-slate-500">{row.courierPartner ?? "Unknown courier"}</div>
            </div>
            <StatusBadge value={row.reconciliationStatus} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Merchant</div>
              <div className="mt-1">{row.merchantId ?? "-"}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">COD</div>
              <div className="mt-1">{formatCurrency(row.settledCodAmount)}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Settlement date</div>
              <div className="mt-1">{row.settlementDate ? format(new Date(row.settlementDate), "dd MMM yyyy") : "-"}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Discrepancies</div>
              <div className="mt-1">{(row.discrepancyTypes ?? []).join(", ") || "-"}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelect(row)}
            className="mt-4 w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700"
          >
            View details
          </button>
        </div>
      ))}
    </div>
  );
}

export default function SettlementsPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("ALL");
  const [file, setFile] = useState(null);
  const [batchId, setBatchId] = useState("");
  const [selected, setSelected] = useState(null);

  const settlementsQuery = useQuery({
    queryKey: ["settlements", status],
    queryFn: () => fetchSettlements({ status, limit: 200 })
  });

  const uploadMutation = useMutation({
    mutationFn: () => uploadSettlements({ file, batchId: batchId.trim() || null }),
    onSuccess: () => {
      toast.success("Settlement file uploaded successfully");
      setFile(null);
      setBatchId("");
      qc.invalidateQueries({ queryKey: ["settlements"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (error) => {
      toast.error(error?.message ?? "Upload failed");
    }
  });

  const settlements = settlementsQuery.data ?? [];
  const filtered = useMemo(() => settlements, [settlements]);

  return (
    <div>
      <PageHeader
        eyebrow="Settlements"
        title="Settlement upload and discrepancy review"
        description="Ingest courier settlement files, filter reconciled records, and inspect discrepancy details at row level."
        actions={
          <button
            type="button"
            onClick={() => downloadCsv(filtered)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        }
      />

      <UploadPanel
        file={file}
        setFile={setFile}
        batchId={batchId}
        setBatchId={setBatchId}
        uploading={uploadMutation.isPending}
        onUpload={() => uploadMutation.mutate()}
      />

      <Card className="mt-6 overflow-hidden">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 px-5 py-4">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatus(filter)}
              className={[
                "rounded-full px-4 py-2 text-xs font-semibold transition",
                status === filter ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              ].join(" ")}
            >
              {filter.replaceAll("_", " ")}
            </button>
          ))}
        </div>

        {settlementsQuery.isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No settlements found"
              description="Upload a settlement file or switch filters to view available rows."
            />
          </div>
        ) : (
          <>
            <SettlementCards rows={filtered} onSelect={setSelected} />
            <div className="hidden xl:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-5 py-4">AWB Number</th>
                    <th className="px-5 py-4">Merchant ID</th>
                    <th className="px-5 py-4">Courier</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">COD Amount</th>
                    <th className="px-5 py-4">Discrepancy Type</th>
                    <th className="px-5 py-4">Settlement Date</th>
                    <th className="px-5 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filtered.map((row) => (
                    <tr key={row._id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-medium text-slate-900">{row.awbNumber}</td>
                      <td className="px-5 py-4 text-slate-600">{row.merchantId ?? "-"}</td>
                      <td className="px-5 py-4 text-slate-600">{row.courierPartner ?? "-"}</td>
                      <td className="px-5 py-4"><StatusBadge value={row.reconciliationStatus} /></td>
                      <td className="px-5 py-4 text-slate-600">{formatCurrency(row.settledCodAmount)}</td>
                      <td className="px-5 py-4 text-slate-600">{(row.discrepancyTypes ?? []).join(", ") || "-"}</td>
                      <td className="px-5 py-4 text-slate-600">{row.settlementDate ? format(new Date(row.settlementDate), "dd MMM yyyy") : "-"}</td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => setSelected(row)}
                          className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                        >
                          View details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      <Modal open={!!selected} title={selected ? `Discrepancy detail for ${selected.awbNumber}` : "Discrepancy detail"} onClose={() => setSelected(null)}>
        {!selected ? null : (
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="p-5">
                <h3 className="text-lg font-semibold text-slate-900">Order details</h3>
                <div className="mt-4 grid gap-3 text-sm text-slate-600">
                  <div><span className="font-medium text-slate-900">Merchant:</span> {selected.merchantId ?? "-"}</div>
                  <div><span className="font-medium text-slate-900">Courier:</span> {selected.courierPartner ?? "-"}</div>
                  <div><span className="font-medium text-slate-900">Order COD:</span> {formatCurrency(selected.orderCodAmount)}</div>
                  <div><span className="font-medium text-slate-900">Declared Weight:</span> {selected.declaredWeight ?? "-"} kg</div>
                  <div><span className="font-medium text-slate-900">Order Status:</span> {selected.orderStatus ?? "-"}</div>
                </div>
              </Card>
              <Card className="p-5">
                <h3 className="text-lg font-semibold text-slate-900">Settlement details</h3>
                <div className="mt-4 grid gap-3 text-sm text-slate-600">
                  <div><span className="font-medium text-slate-900">Settlement COD:</span> {formatCurrency(selected.settledCodAmount)}</div>
                  <div><span className="font-medium text-slate-900">Charged Weight:</span> {selected.chargedWeight ?? "-"} kg</div>
                  <div><span className="font-medium text-slate-900">Forward Charge:</span> {formatCurrency(selected.forwardCharge)}</div>
                  <div><span className="font-medium text-slate-900">RTO Charge:</span> {formatCurrency(selected.rtoCharge)}</div>
                  <div><span className="font-medium text-slate-900">COD Handling Fee:</span> {formatCurrency(selected.codHandlingFee)}</div>
                </div>
              </Card>
            </div>

            <Card className="p-5">
              <h3 className="text-lg font-semibold text-slate-900">Triggered discrepancy rules</h3>
              <div className="mt-4 space-y-4">
                {(selected.discrepancies ?? []).length ? (
                  selected.discrepancies.map((item, index) => (
                    <div key={`${item.type}-${index}`} className="rounded-2xl bg-slate-50 p-4">
                      <div className="text-sm font-semibold text-slate-900">{item.type}</div>
                      <div className="mt-3 grid gap-3 md:grid-cols-3 text-sm text-slate-600">
                        <div><span className="font-medium text-slate-900">Expected:</span> {JSON.stringify(item.expectedValue)}</div>
                        <div><span className="font-medium text-slate-900">Actual:</span> {JSON.stringify(item.actualValue)}</div>
                        <div><span className="font-medium text-slate-900">Difference:</span> {JSON.stringify(item.difference)}</div>
                      </div>
                      <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        Suggested action: Review with courier and raise dispute if source system values are confirmed.
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState title="No discrepancy rules" description="This record does not have any discrepancy breakdown attached yet." />
                )}
              </div>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
}
