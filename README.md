## Courier Settlement Reconciliation & Alert Engine (CleverBooks)

MERN-style project (Node/Express + React + MongoDB) with **Redis + BullMQ** for decoupled discrepancy notifications.

### Architecture (high level)
- **Backend API** (`backend/`): upload settlements, list data, manual reconciliation trigger
- **Reconciliation engine** (`backend/src/services/reconciliationService.js`): computes discrepancies and publishes events
- **Queue / Pub-Sub** (Redis + BullMQ): `discrepancy-events` queue + DLQ
- **Worker** (`worker/`): consumes queue, calls notification API, retries with backoff, writes delivery logs to MongoDB
- **Scheduler** (`scheduler/`): timezone-aware nightly reconciliation at configurable time (default 2:00 AM IST)
- **Frontend** (`frontend/`): responsive dashboard (Tailwind) for uploads, settlements, job logs, notification logs
- **Mock notification API** (`tools/mock-notification-api/`): demo endpoint supporting `Idempotency-Key`

### Why queue/pub-sub decoupling?
Reconciliation can be **CPU/DB heavy** and may produce spikes of notifications. Decoupling via a queue:
- prevents API/reconciliation from blocking on external network calls
- provides **retries + exponential backoff**
- supports **dead-lettering** for permanent failures
- makes delivery independently scalable and more resilient

### Assumptions / matching logic
- `Order` is matched to `Settlement` by **`awbNumber`**.
- If a settlement has no matching order, it is flagged as `MISSING_ORDER` and marked **`PENDING_REVIEW`**.
- **Overdue remittance** is detected from orders with `deliveryDate < now-14d` that have **no settlement record**.

### Reconciliation rules implemented
Statuses: `MATCHED`, `DISCREPANCY`, `PENDING_REVIEW`

Rules:
1. **COD short-remittance**: `settledCodAmount < codAmount - tolerance` where `tolerance = min(2% of codAmount, ₹10)`
2. **Weight dispute**: `chargedWeight > declaredWeight * 1.10`
3. **Phantom RTO charge**: `rtoCharge > 0` while `orderStatus = DELIVERED`
4. **Overdue remittance**: delivery more than 14 days ago and no settlement exists
5. **Duplicate settlement**: same `awbNumber` appears in more than one `batchId`

### Local setup (recommended: Docker)
Prereqs: Docker Desktop + Docker Compose.

Start everything:

```bash
docker-compose up --build
```

Services:
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:4000/health`
- **Mock notification API**: `http://localhost:5050/health`

### Seed data
Backend has a dev-safe seed script that resets collections and inserts:
- **60 orders** (mix of `DELIVERED`, `RTO`, `IN_TRANSIT`, `LOST`)
- **1 settlement batch (30 rows)** with intentional mismatches

Run seed locally (non-docker):

```bash
cd backend
npm install
node src/seed/seed.js
```

### Demo steps (end-to-end)
1. `docker-compose up --build`
2. Open dashboard `http://localhost:5173`
3. Click **Run reconciliation**
   - creates a `JobRun`
   - updates settlement reconciliation status + discrepancy details
   - publishes discrepancy events to Redis/BullMQ
4. Worker consumes events and calls the notification API
   - observe notification statuses in the dashboard (**SENT / RETRIED / FAILED**)
5. Upload a new settlement batch (CSV/JSON)
   - re-uploading the same batch is idempotent and won’t double-process

### Environment variables (examples)
Backend: `backend/.env.example`
Worker: `worker/.env.example`
Scheduler: `scheduler/.env.example`
Frontend: `frontend/.env.example`

Key vars:
- `MONGO_URI`
- `REDIS_URL`
- `NOTIFICATION_API_URL`
- `RECONCILIATION_CRON` (default `0 2 * * *`)
- `RECONCILIATION_TZ` (default `Asia/Kolkata`)

### Tests
Backend tests include upload + reconciliation + queue publish behavior (queue is mocked).

```bash
cd backend
npm test
```

Worker tests include delivery success/failure transitions using a mocked `fetch`.

```bash
cd worker
npm test
```

### Design decisions
- **Idempotent uploads**
  - `UploadBatch` has unique `batchId`
  - `Settlement` has unique compound index `(batchId, awbNumber)`
  - If `batchId` is omitted, backend derives one from payload hash (`hash_<sha256 prefix>`)
- **Notification delivery logging**
  - Stored in MongoDB `notifications` collection with statuses and retry metadata
- **Manual + scheduled reconciliation**
  - Manual trigger: `POST /api/reconciliation/run`
  - Scheduler runs independently using timezone-aware cron

