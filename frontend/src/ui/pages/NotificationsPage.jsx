import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fetchNotifications } from "../../lib/api";
import Card from "../components/Card.jsx";
import EmptyState from "../components/EmptyState.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { Skeleton } from "../components/Skeleton.jsx";

function NotificationCards({ notifications }) {
  return (
    <div className="grid gap-4 p-4 md:grid-cols-2 xl:hidden">
      {notifications.map((item) => (
        <div key={item._id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-slate-900">{item.awbNumber}</div>
              <div className="mt-1 text-sm text-slate-500">{item.merchantId}</div>
            </div>
            <StatusBadge value={item.deliveryStatus} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Type</div>
              <div className="mt-1">{item.discrepancyType}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Attempts</div>
              <div className="mt-1">{item.retryCount ?? 0}</div>
            </div>
            <div className="col-span-2">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Last Attempt</div>
              <div className="mt-1">{item.lastAttemptAt ? format(new Date(item.lastAttemptAt), "dd MMM yyyy, hh:mm a") : "-"}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function NotificationsPage() {
  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifications({ limit: 200 }),
    refetchInterval: 30000
  });

  const notifications = notificationsQuery.data ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="Notifications"
        title="Notification delivery monitor"
        description="Watch notification delivery attempts across discrepancy alerts with auto-refresh every 30 seconds."
      />

      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">All notifications</h2>
        </div>

        {notificationsQuery.isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No notifications yet" description="Notification attempts will appear here once discrepancies are enqueued and delivered." />
          </div>
        ) : (
          <>
            <NotificationCards notifications={notifications} />
            <div className="hidden xl:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-5 py-4">AWB</th>
                    <th className="px-5 py-4">Merchant ID</th>
                    <th className="px-5 py-4">Discrepancy Type</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Attempts</th>
                    <th className="px-5 py-4">Last Attempt Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {notifications.map((item) => (
                    <tr key={item._id}>
                      <td className="px-5 py-4 font-medium text-slate-900">{item.awbNumber}</td>
                      <td className="px-5 py-4 text-slate-600">{item.merchantId}</td>
                      <td className="px-5 py-4 text-slate-600">{item.discrepancyType}</td>
                      <td className="px-5 py-4"><StatusBadge value={item.deliveryStatus} /></td>
                      <td className="px-5 py-4 text-slate-600">{item.retryCount ?? 0}</td>
                      <td className="px-5 py-4 text-slate-600">{item.lastAttemptAt ? format(new Date(item.lastAttemptAt), "dd MMM yyyy, hh:mm a") : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
