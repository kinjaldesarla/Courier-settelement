import axios from "axios";
import { API_BASE_URL } from "./env";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000
});

function unwrap(res) {
  const payload = res?.data;
  if (payload?.ok) return payload.data;
  throw new Error(payload?.error?.message ?? "Request failed");
}

export async function fetchStats() {
  return unwrap(await api.get("/stats"));
}

export async function fetchSettlements({ status = "ALL", limit = 100 } = {}) {
  const params = { limit };
  if (status && status !== "ALL") params.status = status;
  return unwrap(await api.get("/settlements", { params })).items;
}

export async function uploadSettlements({ file, batchId }) {
  const name = file?.name?.toLowerCase?.() ?? "";
  if (name.endsWith(".csv")) {
    const fd = new FormData();
    fd.append("file", file);
    if (batchId) fd.append("batchId", batchId);
    return unwrap(
      await api.post("/settlements/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      })
    );
  }

  if (name.endsWith(".json")) {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const rows = Array.isArray(parsed) ? parsed : parsed?.rows;
    if (!Array.isArray(rows)) throw new Error("JSON must be an array or { rows: [...] }");
    return unwrap(await api.post("/settlements/upload", { batchId, rows }));
  }

  throw new Error("Only CSV or JSON files are supported");
}

export async function fetchJobs({ limit = 10 } = {}) {
  return unwrap(await api.get("/jobs", { params: { limit } })).items;
}

export async function triggerJobsNow() {
  return unwrap(await api.post("/jobs/trigger")).result;
}

export async function fetchNotifications({ limit = 100, status } = {}) {
  const params = { limit };
  if (status) params.status = status;
  return unwrap(await api.get("/notifications", { params })).items;
}
