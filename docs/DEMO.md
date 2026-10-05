# RegTracker Portfolio Demonstration Script (3-5 Minutes)

This script provides an exact, step-by-step walkthrough to demonstrate the core capabilities of **RegTracker** to an engineering lead, technical recruiter, or enterprise client.

---

## 0. Prerequisites & Environment Start

1. Start database and cache services:
   ```bash
   docker compose up -d
   ```
2. Start the Demo Source fixture server:
   ```bash
   pnpm --filter=@regtracker/demo-source start
   # Listening on http://127.0.0.1:5101
   ```
3. Start the Backend API:
   ```bash
   pnpm --filter=@regtracker/api start:dev
   # Listening on http://127.0.0.1:4101 (Swagger at /api/docs)
   ```
4. Start the Web Dashboard:
   ```bash
   pnpm --filter=@regtracker/web dev
   # Accessible at http://localhost:3101
   ```

---

## Step 1: Sign in with Enterprise RBAC (0:00 - 0:30)

1. Open your browser at `http://localhost:3101`.
2. Click **"Autofill Admin Credentials"**:
   - Email: `admin@regtracker.local`
   - Password: `AdminPassword123!`
3. Click **"Sign In to RegTracker"**.
4. Observe the Overview Dashboard:
   - Live health indicator in the header (**API ONLINE**).
   - Prominent amber banner: *"SYNTHETIC DEMO ENVIRONMENT - ALL DISPLAYED REGULATIONS ARE FICTIONAL FIXTURES FOR PORTFOLIO DEMONSTRATION"*.
   - Key operational metrics: Monitored Sources, Total Documents, Versions Detected, Regulatory Changes, and Crawl Success Rate.

---

## Step 2: Source Management & Pre-Flight SSRF Testing (0:30 - 1:15)

1. Navigate to **Sources** (`/sources`).
2. Show the monitored source: `Cổng Thông Tin Pháp Luật DEMO (Bộ Tài Chính)`.
3. Click **"Test Source"**:
   - Observe real-time validation: URL connectivity, MIME detection (`text/html`), adapter compatibility, and SSL/DNS check.
4. Demonstrate **SSRF Security Protection**:
   - Try to test an internal endpoint such as `http://169.254.169.254/latest/meta-data/` or `http://192.168.1.1`.
   - The system immediately blocks the request with: `UNSAFE_DESTINATION_IP: Private or link-local address blocked`.

---

## Step 3: Trigger Crawl & Ingest Initial Version 1 (1:15 - 2:00)

1. On the Source row, click **"Crawl Now"**.
2. Navigate to **Crawl Jobs** (`/jobs`):
   - Watch the crawl job transition: `RUNNING` -> `COMPLETED`.
   - Inspect job statistics: 1 document discovered, 1 snapshot created, duration in milliseconds.
3. Navigate to **Documents** (`/documents`):
   - Notice the ingested document: `Thông tư 01/2026/TT-DEMO`.
   - Click the document to view **Document Detail** (`/documents/[id]`):
     - Official metadata: Document number, issuing authority, effective date, status (`EFFECTIVE`).
     - **Legal Hierarchy Tree**: Click through *Chương I* -> *Điều 5* -> *Khoản 1* & *Khoản 2*.
     - **Version Timeline**: Currently showing `Version 1` with SHA-256 checksum and raw snapshot traceability.

---

## Step 4: Simulate Regulatory Update (V1 -> V2) (2:00 - 3:15)

1. Open a terminal or use the API to switch the demo source fixture to Version 2:
   ```bash
   curl -X POST http://127.0.0.1:5101/api/scenario/switch-v2
   # Responds: { "activeVersion": "v2", "message": "Demo source is now serving Version 2 of Circular 01" }
   ```
2. Return to the dashboard and click **"Crawl Now"** on the source.
3. Within seconds, the crawler detects the substantive regulatory change and:
   - Archives a new raw snapshot.
   - Parses the new legal structure.
   - Computes the structural diff.
   - Creates `Version 2`.
   - Dispatches a webhook notification to registered endpoints.

---

## Step 5: Flagship Experience: Structural Diff & Changes Feed (3:15 - 4:30)

1. Navigate to **Changes Feed** (`/changes`):
   - A new change card appears: *"Thông tư 01/2026/TT-DEMO (v1 -> v2)"*.
   - Quantitative summary: *"Version 2 introduces: 2 modified clauses, 1 added clause, 0 removed clauses"*.
2. Click **"Inspect Diff"** (navigating to `/documents/[id]/compare?from=v1&to=v2`):
   - Toggle between **Side-by-Side** and **Unified** views.
   - **Khoản 1 (Điều 5):** Observe fine-grained word-level highlighting showing that paper submission was replaced with electronic declaration + C/O certificate.
   - **Khoản 2 (Điều 5):** Observe that the processing timeframe was reduced from 10 days to 03 days.
   - **Khoản 3 (Điều 5):** Observe the new statutory retention clause highlighted in bright green as **ADDED**.
3. Click **"Copy for RAG"**:
   - Copies the exact JSON chunk structure for direct upsert into vector databases.

---

## Step 6: Webhooks, Downstream RAG & Audit Trail (4:30 - 5:00)

1. Navigate to **Webhooks** (`/webhooks`):
   - Inspect the registered endpoint `https://rag-assistant.internal/webhooks/regtracker`.
   - Click **"Test Webhook Ping"** to demonstrate HMAC-SHA256 signature calculation in header `X-RegTracker-Signature`.
2. Navigate to **Audit Logs** (`/audit-logs`):
   - Show immutable administrative history tracking: `SOURCE_CRAWL_TRIGGERED`, `VERSION_CREATED`, `CHANGESET_GENERATED`.
   - Shows actor, action, timestamp, and entity references with sensitive credentials masked.
