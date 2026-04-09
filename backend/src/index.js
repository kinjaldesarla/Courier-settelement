import { connectMongo } from "./config/mongo.js";
import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { settlementRepo } from "./repositories/settlementRepo.js";
import { triggerManualReconciliation } from "./services/reconciliationService.js";

async function main() {
  await connectMongo();

  if (env.seedOnStart && env.nodeEnv !== "production") {
    // Seed is safe to rerun in development (resets collections).
    await import("./seed/seed.js");
  }

  if (env.autoReconcileOnStart) {
    const unreconciled = await settlementRepo.listUnreconciled({ limit: 1 });
    if (unreconciled.length > 0) {
      await triggerManualReconciliation();
    }
  }

  const app = createApp();
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`backend listening on :${env.port}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

