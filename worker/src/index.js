import { Worker, Queue } from "bullmq";
import { connectMongo } from "./config/mongo.js";
import { env } from "./config/env.js";
import { Notification } from "./models/Notification.js";
import { QUEUES } from "./queues/queueNames.js";
import { redisConnection } from "./queues/connection.js";
import { deliverDiscrepancyJob } from "./services/delivery.js";

const dlq = new Queue(QUEUES.discrepancyDlq, redisConnection());

async function main() {
  await connectMongo();

  // eslint-disable-next-line no-console
  console.log(`worker up (api=${env.notificationApiUrl})`);

  const worker = new Worker(
    QUEUES.discrepancy,
    async (job) => {
      return deliverDiscrepancyJob({
        notificationId: job.data?.notificationId,
        jobData: job.data,
        notificationApiUrl: env.notificationApiUrl
      });
    },
    {
      ...redisConnection(),
      concurrency: 10
    }
  );

  worker.on("failed", async (job, err) => {
    if (!job) return;
    const isFinal = job.attemptsMade >= (job.opts.attempts ?? 1);
    if (!isFinal) return;

    const { notificationId } = job.data ?? {};
    if (notificationId) {
      await Notification.updateOne(
        { _id: notificationId },
        {
          $set: {
            deliveryStatus: "FAILED",
            deadLetteredAt: new Date(),
            error: { message: String(err?.message ?? err) }
          }
        }
      );
    }

    // Dead-letter: push to DLQ with the same payload for later inspection/replay.
    await dlq.add(
      "dead-letter",
      {
        reason: "max_attempts_exceeded",
        notificationId: notificationId ?? null,
        originalJobId: String(job.id ?? ""),
        data: job.data ?? null,
        failedAt: new Date().toISOString(),
        error: String(err?.message ?? err)
      },
      { removeOnComplete: false, removeOnFail: false }
    );
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

