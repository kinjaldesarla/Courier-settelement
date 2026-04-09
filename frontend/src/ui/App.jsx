import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./layout/AppShell.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import SettlementsPage from "./pages/SettlementsPage.jsx";
import JobsPage from "./pages/JobsPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/settlements" element={<SettlementsPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
