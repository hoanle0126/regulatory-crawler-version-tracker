# RegTracker: Regulatory Crawler & Version Tracking System

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.0-E0234E.svg)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15.1-black.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D.svg)](https://redis.io/)
[![BullMQ](https://img.shields.io/badge/BullMQ-5.0-orange.svg)](https://bullmq.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **A production-quality legal document monitoring, version control, and structural change detection system with first-class Vietnamese legal hierarchy parsing and downstream Legal RAG integration.**

---

## 1. Overview & Problem Statement

Modern compliance teams, legal counsels, and legal tech applications struggle to monitor fast-moving regulatory frameworks. Typical scraping tools treat legal documents as unstructured strings of text or raw HTML blobs, which results in:
1. **Massive false positive alerts:** Any minor website reformat, line-wrap change, or CMS header update triggers a false "document modified" warning.
2. **Loss of structural context:** Standard diff tools highlight multi-page text blocks without indicating whether an amendment applies to a Chapter, Section, Article, Clause, or Sub-clause.
3. **Impaired Legal AI / RAG performance:** RAG systems re-embed entire 50-page gazettes on minor updates, ballooning vector storage costs and corrupting retrieval relevance.

**RegTracker** solves this by treating legal documents as **versioned, hierarchical semantic trees** (*Phần, Chương, Mục, Điều, Khoản, Điểm*). It captures immutable raw snapshots, computes dual SHA-256 checksums to eliminate noise, tracks legal effectivity lifecycles, computes word-level structural diffs, and propagates HMAC-signed change events to downstream Legal RAG systems.

---

## 2. Core Architecture

```mermaid
graph TD
    subgraph Regulatory Sources
        EXT[Public Legal Gazettes]
        DEMO[apps/demo-source :5101]
    end

    subgraph Crawler & Security Engine
        SCHED[BullMQ Cron Scheduler]
        QUEUE[BullMQ Redis Queue :6381]
        WORKER[Crawl Worker Service]
        SSRF[SsrfGuard DNS/IP Layer]
        SAFE[SafeFetcher Stream & Caps]
        ADAPTER[Source Adapter Engine]
    end

    subgraph Analytical Core
        SNAP[RawSnapshot Storage]
        HASH[Dual SHA-256 Engine]
        NORM[Legal Text Normalizer]
        TREE[Hierarchy Tree Stack Parser]
        DIFF[Structural Diff Engine]
    end

    subgraph Presentation & Integration
        DB[(PostgreSQL :55432)]
        API[NestJS REST API :4101]
        WEB[Next.js Legal-Tech UI :3101]
        HOOK[HMAC Webhook Dispatcher]
        RAG[Downstream Legal RAG Systems]
    end

    SCHED --> QUEUE
    QUEUE --> WORKER
    WORKER --> ADAPTER
    ADAPTER --> SSRF
    SSRF --> SAFE
    SAFE --> EXT
    SAFE --> DEMO
    SAFE --> SNAP
    SNAP --> DB
    SNAP --> HASH
    HASH --> NORM
    NORM --> TREE
    TREE --> DB
    TREE --> DIFF
    DIFF --> DB
    DIFF --> HOOK
    HOOK --> RAG
    API --> DB
    API --> QUEUE
    WEB --> API
```

---

## 3. Technology Stack

- **Monorepo Architecture:** PNPM Workspaces (`apps/*`, `packages/*`).
- **Backend API:** NestJS, TypeScript, Swagger/OpenAPI (`/api/docs`), Class-Validator.
- **Frontend Dashboard:** Next.js 15 (App Router), Tailwind CSS, Lucide Icons, Enterprise Legal-Tech Dark Theme.
- **Database & ORM:** PostgreSQL 16, Prisma ORM (Strict relational schemas, indexes, and transactions).
- **Queue & Scheduling:** Redis 7, BullMQ (exponential backoff, concurrency controls, job retries).
- **Crawler & Normalization:** Native Undici stream fetcher with `AbortController`, Cheerio for DOM parsing, pdf-parse for PDF streams.
- **Testing:** Vitest, Supertest (100% passing across unit, integration, and E2E security suites).
- **Infrastructure:** Docker Compose with isolated project names and custom ports.

---

## 4. Port Isolation & Parallel Execution

This system is configured to run in complete isolation and will **never** collide with other local processes:

| Service | Port | Environment Variable |
| :--- | :--- | :--- |
| **Frontend Web Dashboard** | `3101` | `WEB_URL=http://localhost:3101` |
| **Backend REST API** | `4101` | `PORT=4101`, `API_URL=http://localhost:4101` |
| **Local Demo Fixture Server** | `5101` | `DEMO_SOURCE_PORT=5101` |
| **PostgreSQL Database** | `55432` | `DATABASE_URL=postgresql://regtracker:regtracker_secret@127.0.0.1:55432/regtracker_db` |
| **Redis Queue & Cache** | `6381` | `REDIS_URL=redis://127.0.0.1:6381` |
| **Docker Compose Project** | - | `COMPOSE_PROJECT_NAME=regtracker` |

---

## 5. Key Highlights & Engineering Features

### 5.1. Vietnamese Legal Hierarchy Parser (`packages/legal-parser`)
Parses legal text into a deterministic, ordered tree preserving original punctuation and preambles:
- **Phần** (`PART`)
- **Chương** (`CHAPTER`)
- **Mục** (`SECTION`)
- **Điều** (`ARTICLE`)
- **Khoản** (`CLAUSE`)
- **Điểm** (`POINT`)

### 5.2. Structural Diff Engine (`packages/diff-engine`)
- **Dual Checksum Filtering:** Distinguishes between identical fetches, format-only changes, and substantive legal changes.
- **Hierarchical Identity Matching:** Matches nodes by coordinates (`Chương I > Điều 5 > Khoản 2`) rather than raw line numbers.
- **Jaccard Similarity Fallback:** Prevents false `REMOVED` + `ADDED` flags on renamed or unnumbered provisions.
- **Word-Level Tokenizer:** Highlights exact insertions and deletions inside modified clauses for instant legal review.
- **Deterministic Summaries:** Generates exact tallies (*e.g., "Version 2 introduces 2 modified clauses, 1 added clause, 0 removed clauses"*) without reliance on external LLM APIs.

### 5.3. SSRF & Crawler Security (`packages/crawler-core`)
- Protocol whitelist (`http:`, `https:` only).
- Pre-resolution DNS lookup blocking private ranges (`127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254`, `::1`, `fc00::/7`).
- Manual redirect trapping with per-hop SSRF validation to prevent redirect-based attacks.
- Strict response size caps (10 MB HTML / 25 MB PDF) and request timeouts (15s).

### 5.4. Downstream Legal RAG Integration (`docs/RAG_INTEGRATION.md`)
- `GET /api/documents/:id/export`: Exports clean JSON chunks mapped to legal coordinates for direct vector database ingestion.
- `POST /api/integrations/rag/reindex`: Queues bulk re-embedding requests for vector stores.
- HMAC-SHA256 signed webhook events (`document.changed`, `document.version.created`).

---

## 6. Local Setup & Quickstart

### Step 1: Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/your-username/regulatory-crawler-version-tracker.git
cd regulatory-crawler-version-tracker

# Install dependencies (PNPM ONLY)
pnpm install
```

### Step 2: Configure Environment
```bash
cp .env.example .env
```

### Step 3: Start Infrastructure (PostgreSQL & Redis)
```bash
docker compose up -d
```

### Step 4: Run Migrations & Seed Database
```bash
pnpm db:migrate
pnpm db:seed
```
*Creates initial administrator (`admin@regtracker.local`), viewer (`viewer@regtracker.local`), and deterministic demo sources.*

### Step 5: Start Applications
Open three separate terminals or run in background:

```bash
# Terminal 1: Start Demo Fixture Server (:5101)
pnpm --filter=@regtracker/demo-source start

# Terminal 2: Start NestJS Backend API (:4101)
pnpm --filter=@regtracker/api start:dev

# Terminal 3: Start Next.js Frontend Dashboard (:3101)
pnpm --filter=@regtracker/web dev
```

Visit the dashboard at `http://localhost:3101` and the Swagger API at `http://localhost:4101/api/docs`.

---

## 7. Demo Credentials

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@regtracker.local` | `AdminPassword123!` | Full control (Crawl, Sources, Webhooks, Diff Review) |
| **Viewer** | `viewer@regtracker.local` | `ViewerPassword123!` | Read-only access (Audit Logs, Diff Inspection) |

---

## 8. Verification & Test Commands

Every component has automated test coverage:

```bash
# Run linting across all workspaces
pnpm lint

# Run strict TypeScript typecheck across all workspaces
pnpm typecheck

# Run all automated tests (Unit, Integration, E2E Security)
pnpm test

# Build production bundles for all packages and apps
pnpm build
```

---

## 9. Detailed Documentation Index

- [Architecture & Ingestion Pipeline](docs/ARCHITECTURE.md)
- [Security Controls & SSRF Defense](docs/SECURITY.md)
- [Structural Diff Engine & Test Cases](docs/DIFF_ENGINE.md)
- [Legal RAG Integration Contract](docs/RAG_INTEGRATION.md)
- [3-5 Minute Portfolio Demo Script](docs/DEMO.md)

---

## 10. Known Limitations & Roadmap

- **Known Limitations:**
  - `braces <=3.0.3` vulnerability warning flagged in devDependency of `tailwindcss` v3 build tools (unpatched by upstream maintainer, does not impact production server runtime).
  - OCR for non-searchable scanned image PDFs is currently out-of-scope; text extraction targets electronic searchable PDFs and HTML portals.
- **Future Improvements:**
  - Automated citation cross-referencing between related Circulars and Decrees.
  - Multi-jurisdiction legal tokenizers (e.g., US Code Title/Section, EU Directives).
