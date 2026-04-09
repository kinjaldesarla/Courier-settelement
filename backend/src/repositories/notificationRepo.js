import { Notification } from "../models/Notification.js";

export const notificationRepo = {
  async list({ merchantId, status, limit }) {
    const lim = Math.min(Math.max(Number(limit ?? 50), 1), 200);
    const q = {};
    if (merchantId) q.merchantId = String(merchantId);
    if (status) q.deliveryStatus = String(status);
    return Notification.find(q).sort({ createdAt: -1, _id: -1 }).limit(lim).lean();
  }
};

