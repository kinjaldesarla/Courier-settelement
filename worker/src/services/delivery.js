import { env } from "../config/env.js";
import { Notification } from "../models/Notification.js";

export function buildPayload(jobData) {
  return {
    merchantId: jobData.merchantId,
    awbNumber: jobData.awbNumber,
    discrepancyType: jobData.discrepancyType,
    expectedValue: jobData.expectedValue ?? null,
    actualValue: jobData.actualValue ?? null,
    suggestedAction: jobData.suggestedAction ?? null,
    occurredAt: new Date().toISOString()
  };
}

export async function postNotification({ url, payload, idempotencyKey }) {
  const headers = { "Content-Type": "application/json" };
  if (env.sendIdempotencyKey && idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  const resp = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });

  const text = await resp.text().catch(() => "");
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  return { ok: resp.ok, status: resp.status, bodyText: text, bodyJson: json };
}

export async function deliverDiscrepancyJob({ notificationId, jobData, notificationApiUrl }) {
  if (!notificationId) throw new Error("Missing notificationId in job payload");

  const notif = await Notification.findById(notificationId);
  if (!notif) return { skipped: true, reason: "notification missing" };
  if (notif.deliveryStatus === "SENT") return { skipped: true, reason: "already sent" };

  const payload = buildPayload(jobData);
  const idempotencyKey = `notif_${notificationId}`;

  await Notification.updateOne({ _id: notificationId }, { $set: { lastAttemptAt: new Date() } });

  const result = await postNotification({
    url: notificationApiUrl,
    payload,
    idempotencyKey
  });

  if (result.ok) {
    await Notification.updateOne(
      { _id: notificationId },
      {
        $set: {
          deliveryStatus: "SENT",
          response: { status: result.status, body: result.bodyJson ?? result.bodyText },
          error: null
        }
      }
    );
    return { sent: true, status: result.status };
  }

  await Notification.updateOne(
    { _id: notificationId },
    {
      $set: {
        deliveryStatus: "RETRIED",
        error: { status: result.status, body: result.bodyJson ?? result.bodyText }
      },
      $inc: { retryCount: 1 }
    }
  );

  throw new Error(`Notification API returned ${result.status}`);
}

