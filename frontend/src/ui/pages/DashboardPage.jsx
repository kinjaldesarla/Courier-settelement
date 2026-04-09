import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { fetchStats } from "../../lib/api";
import Card from "../components/Card.jsx";
import EmptyState from "../components/EmptyState.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import SummaryCard from "../components/SummaryCard.jsx";
import { Skeleton } from "../components/Skeleton.jsx";

function inr(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value ?? 0);
}

export default function DashboardPage() {
  const statsQuery = useQuery({
    queryKey: ["stats"],
    queryFn: fetchStats
  });

  const stats = statsQuery.data;
  const chartData = useMemo(() => stats?.courierDisputes ?? [], [stats]);
  const lastJob = stats?.lastJob ?? null;

  return (
    <div>
      <PageHeader
        eyebrow="Dashboard"
        title="Settlement health overview"
        description="Track the reconciliation engine at a glance with topline metrics, courier dispute distribution, and the most recent job run."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Settlements" value={stats?.totalSettlements ?? 0} loading={statsQuery.isLoading} />
        <SummaryCard label="Total Discrepancies" value={stats?.totalDiscrepancies ?? 0} loading={statsQuery.isLoading} />
        <SummaryCard label="Discrepancy Value" value={inr(stats?.totalDiscrepancyValue ?? 0)} loading={statsQuery.isLoading} />
        <SummaryCard label="Pending Review" value={stats?.pendingReviewCount ?? 0} loading={statsQuery.isLoading} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <Card className="p-5">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Courier-wise disputes</h2>
            <p className="text-sm text-slate-500">Dispute-heavy couriers based on current stored settlement state.</p>
          </div>
          {statsQuery.isLoading ? (
            <Skeleton className="h-80 w-full" />
          ) : chartData.length === 0 ? (
            <EmptyState
              title="No dispute data yet"
              description="Once reconciliations are available, courier-wise dispute counts will appear here."
            />
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="courier" tick={{ fill: "#475569", fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: "#475569", fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="disputes" fill="#4f46e5" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Last reconciliation job</h2>
            <p className="text-sm text-slate-500">Most recent job execution snapshot.</p>
          </div>
          {statsQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : !lastJob ? (
            <EmptyState
              title="No jobs available"
              description="Run a reconciliation job to start populating operational job history."
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-500">Status</div>
                  <div className="mt-2"><StatusBadge value={lastJob.status} /></div>
                </div>
                <div className="text-right text-sm text-slate-500">
                  <div>Run time</div>
                  <div className="mt-2 font-semibold text-slate-900">{lastJob.startTime ? format(new Date(lastJob.startTime), "dd MMM yyyy, hh:mm a") : "-"}</div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-sm text-slate-500">Records processed</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">{lastJob.recordsProcessed ?? 0}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-sm text-slate-500">Discrepancies found</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">{lastJob.discrepanciesFound ?? 0}</div>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
                {lastJob.notes ?? "No additional notes provided for this job run."}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
