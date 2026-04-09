import dotenv from "dotenv";
import { CronJob } from "cron";

dotenv.config();

// Reuse backend reconciliation implementation so scheduler can run without API.
import { connectMongo } from "../../backend/src/config/mongo.js";
import { runReconciliation } from "../../backend/src/services/reconciliationService.js";

const RECONCILIATION_CRON = process.env.RECONCILIATION_CRON ?? "0 2 * * *"; // 2:00 AM
const RECONCILIATION_TZ = process.env.RECONCILIATION_TZ ?? "Asia/Kolkata";

async function tick() {
  await connectMongo();
  const result = await runReconciliation({ jobType: "RECONCILIATION_NIGHTLY" });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ ok: true, ranAt: new Date().toISOString(), result }, null, 2));
}

async function main() {
  // eslint-disable-next-line no-console
  console.log(`scheduler up (cron="${RECONCILIATION_CRON}" tz="${RECONCILIATION_TZ}")`);

  const job = new CronJob(
    RECONCILIATION_CRON,
    () => {
      tick().catch((err) => {
        // eslint-disable-next-line no-console
        console.error("scheduler tick failed", err);
      });
    },
    null,
    true,
    RECONCILIATION_TZ
  );

  job.start();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

