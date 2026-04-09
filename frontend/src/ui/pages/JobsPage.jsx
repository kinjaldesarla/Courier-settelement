import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceStrict } from "date-fns";
import toast from "react-hot-toast";
import { fetchJobs, fetchStats, triggerJobsNow } from "../../lib/api";
import Card from "../components/Card.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Modal from "../components/Modal.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { Skeleton } from "../components/Skeleton.jsx";

function formatDuration(startTime, endTime) {
  if (!startTime || !endTime) return "-";
  return formatDistanceStrict(new Date(startTime), new Date(endTime));
}

export default function JobsPage() {
  const qc = useQueryClient();
  const [previewOpen, setPreviewOpen] = useState(false);

  const jobsQuery = useQuery({
    queryKey: ["jobs"],
    queryFn: () => fetchJobs({ limit: 10 })
  });

  const statsQuery = useQuery({
    queryKey: ["stats"],
    queryFn: fetchStats
  });

  const triggerMutation = useMutation({
    mutationFn: triggerJobsNow,
    onSuccess: (result) => {
      toast.success(`Reconciliation complete. ${result.reconciledSettlements} settlements processed.`);
      setPreviewOpen(false);
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["settlements"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      toast.error(error?.message ?? "Failed to trigger reconciliation");
    }
  });

  const jobs = jobsQuery.data ?? [];
  const pendingCount = useMemo(() => statsQuery.data?.pendingReviewCount ?? 0, [statsQuery.data]);

  return (
    <div>
      <PageHeader
        eyebrow="Jobs"
        title="Reconciliation job monitor"
        description="Review recent job executions, inspect processing outcomes, and trigger manual reconciliations with a notification preview."
        actions={
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white"
          >
            Trigger Reconciliation Now
          </button>
        }
      />

      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Last 10 reconciliation runs</h2>
        </div>
        {jobsQuery.isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No job history yet" description="Trigger a manual reconciliation to populate the job monitor." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-5 py-4">Run Time</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Records Processed</th>
                  <th className="px-5 py-4">Discrepancies Found</th>
                  <th className="px-5 py-4">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {jobs.map((job) => (
                  <tr key={job._id}>
                    <td className="px-5 py-4 text-slate-600">{job.startTime ? new Date(job.startTime).toLocaleString() : "-"}</td>
                    <td className="px-5 py-4"><StatusBadge value={job.status} /></td>
                    <td className="px-5 py-4 text-slate-600">{job.recordsProcessed ?? 0}</td>
                    <td className="px-5 py-4 text-slate-600">{job.discrepanciesFound ?? 0}</td>
                    <td className="px-5 py-4 text-slate-600">{formatDuration(job.startTime, job.endTime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={previewOpen}
        title="Notification preview"
        onClose={() => setPreviewOpen(false)}
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => triggerMutation.mutate()}
              disabled={triggerMutation.isPending}
              className="rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {triggerMutation.isPending ? "Running..." : "Confirm trigger"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <Card className="p-5 bg-indigo-50 border-indigo-100">
            <div className="text-sm text-indigo-700">Pending discrepancies that may generate notifications</div>
            <div className="mt-3 text-4xl font-semibold text-indigo-900">{pendingCount}</div>
          </Card>
          <p className="text-sm leading-6 text-slate-600">
            The system will process unreconciled settlements, compute discrepancy rules, and enqueue relevant notifications for courier settlement mismatches.
          </p>
        </div>
      </Modal>
    </div>
  );
}
