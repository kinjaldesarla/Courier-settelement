import express from "express";

const app = express();
app.use(express.json({ limit: "1mb" }));

// Simple in-memory idempotency store for demo purposes
const seen = new Map();

app.get("/health", (req, res) => res.json({ ok: true }));

app.post("/notify", (req, res) => {
  const idem = req.header("Idempotency-Key");
  if (idem && seen.has(idem)) {
    return res.status(200).json({ ok: true, idempotent: true, previous: seen.get(idem) });
  }

  const payload = req.body ?? {};
  const record = {
    receivedAt: new Date().toISOString(),
    idempotencyKey: idem ?? null,
    merchantId: payload.merchantId ?? null,
    awbNumber: payload.awbNumber ?? null,
    discrepancyType: payload.discrepancyType ?? null
  };

  // Simulate an occasional failure if caller sets ?fail=1
  if (String(req.query.fail ?? "") === "1") {
    return res.status(500).json({ ok: false, error: "forced failure" });
  }

  if (idem) seen.set(idem, record);
  return res.status(200).json({ ok: true, accepted: true, record });
});

const port = Number(process.env.PORT ?? 5050);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`mock notification api listening on :${port}`);
});

