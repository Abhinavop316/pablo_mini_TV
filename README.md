# Peblo TV Mini — Streaming Platform & Catalogue CMS

A production-grade, full-stack streaming media catalogue publishing platform and kids browsing experience built with **FastAPI**, **PostgreSQL**, **SQLAlchemy 2.x**, **Alembic**, and **React (TypeScript)**.

---

## 📑 Table of Contents
1. [Executive Summary & System Architecture](#1-executive-summary--system-architecture)
2. [Quickstart: One-Command Docker Setup](#2-quickstart-one-command-docker-setup)
3. [Manual Local Development Setup](#3-manual-local-development-setup)
4. [Conventions & Seed Data Integrity](#4-conventions--seed-data-integrity)
5. [Part A — Backend Architecture & API Design](#5-part-a--backend-architecture--api-design)
6. [Part B — Internal CMS (Admin & Editor Console)](#6-part-b--internal-cms-admin--editor-console)
7. [Part C — Viewer UI (Netflix-Style Kids Streaming)](#7-part-c--viewer-ui-netflix-style-kids-streaming)
8. [Part D — Pipeline, Docker & Operability](#8-part-d--pipeline-docker--operability)
9. [Part E — Written Engineering Analysis & Trade-Offs](#9-part-e--written-engineering-analysis--trade-offs)
10. [Optional Stretch Features Implemented](#10-optional-stretch-features-implemented)
11. [Automated Test Suite](#11-automated-test-suite)
12. [Time Spent Breakdown](#12-time-spent-breakdown)

---

## 1. Executive Summary & System Architecture

Peblo TV Mini isolates the **internal editorial CMS** from the **public viewer streaming experience** through an atomic, high-performance publishing pipeline:

```
+--------------------------------------------------------------------+
|                         INTERNAL CMS                               |
|        Admin & Editor Console (React 18 + TypeScript + Vite)       |
|              http://localhost:5173                                 |
+---------------------------------+----------------------------------+
                                  |
                   JWT Bearer Auth & Role Enforcement
                                  |
                                  v
+--------------------------------------------------------------------+
|                         FASTAPI BACKEND                            |
|             REST API Server (http://localhost:8000)                |
|                                                                    |
|  - Auth & RBAC (/auth/*)                                           |
|  - Shows, Seasons, Episodes CRUD (/admin/shows, /admin/episodes)   |
|  - Artwork Validation (Pillow 2:3, 16:9, <=200KB) (/admin/artwork) |
|  - Publication Readiness Engine (/admin/validation-report)         |
|  - Atomic Publisher (/admin/catalog/publish) [ADMIN ONLY]          |
|  - Public Streaming Endpoints (/catalog, /catalog/search)          |
+-------------------+----------------------------+-------------------+
                    |                            |
       Read/Write Relational State      Atomic File Generation
                    |                            |
                    v                            v
      +----------------------------+   +-----------------------------+
      |    POSTGRESQL DATABASE     |   |   LIVE CATALOGUE STORAGE    |
      |          pablo_db          |   |       catalogue.json        |
      | - users        - artwork   |   +--------------+--------------+
      | - shows        - episodes  |                  |
      | - seasons      - publish_runs                 | Public Read Access
      +----------------------------+                  v
                                       +-----------------------------+
                                       |      VIEWER FRONTEND        |
                                       |  Netflix-Style Streaming UI |
                                       |    http://localhost:5174    |
                                       +-----------------------------+
```

---

## 2. Quickstart: One-Command Docker Setup

The entire multi-container architecture (PostgreSQL, Backend API with automatic migrations & seeding, CMS UI, and Viewer UI) can be launched with a single command:

```bash
docker-compose up --build
```

### Services & Port Mapping
| Service | URL | Description |
|---|---|---|
| **CMS Frontend** | `http://localhost:5173` | Internal editorial console for Admins & Editors |
| **Viewer Frontend** | `http://localhost:5174` | Public Netflix-style kids browsing surface |
| **FastAPI Backend** | `http://localhost:8000` | REST API, OpenAPI docs at `/docs` |
| **Health Check** | `http://localhost:8000/health` | Live database connectivity probe |
| **PostgreSQL** | `localhost:5432` | Relational database (`pablo_db`) |

#### Default Seed Credentials
| Role | Email | Password | Access Level |
|---|---|---|---|
| **Admin** | `admin@example.com` | `Admin@123` | Full CRUD + Catalogue Publish + User Management |
| **Editor** | `editor@example.com` | `Editor@123` | Full CRUD (Cannot trigger live catalogue publication) |

---

## 3. Manual Local Development Setup

### Prerequisites
- **Python 3.12+**
- **Node.js 18+** & **npm**
- **PostgreSQL 14+** running on port `5432` with database `pablo_db`

### 1. Backend Setup
```powershell
cd backend
python -m venv pabloEnv
.\pabloEnv\Scripts\activate
pip install -r requirements.txt

# Run migrations & seed data
alembic upgrade head
python -m app.seed

# Start FastAPI server
python server.py
```

### 2. CMS Frontend Setup
```powershell
cd adminAndEditor
npm install
npm run dev
```

### 3. Viewer Frontend Setup
```powershell
cd Viewer
npm install
npm run dev -- --port 5174
```

---

## 4. Conventions & Seed Data Integrity

The system strictly enforces the core business conventions defined in `reference.json`:

1. **Season 0 is Reserved for Trailers**:
   - Episodes attached to Season 0 are excluded from regular episode listings in the Viewer UI.
   - They are grouped and exposed as a dedicated **Trailers & Teasers carousel** on the show details screen.
2. **Language Variant Collapsing (`content_group`)**:
   - Multiple episodes sharing the same `content_group` (e.g. `ep_moti_1`) represent localized audio variants (English, Hindi).
   - The publisher automatically collapses them into **one catalog entry** with `languages: ["en", "hi"]`, enabling smooth in-player language switching without duplicate card clutter.
3. **Handling Imperfect Seed Data**:
   - The raw seed data contains incomplete artwork links, missing durations, and draft items.
   - The **Publication Readiness Engine** (`GET /admin/validation-report`) detects and isolates all non-compliant records so editors can resolve them before publishing.

---

## 5. Part A — Backend Architecture & API Design

### Relational Schema (`PostgreSQL`)
- **`shows`**: `id`, `title`, `synopsis`, `section` (`featured`, `series`, `minisodes`, `songs`), `category` (15 taxonomies), `status` (`DRAFT`, `PUBLISHED`), timestamps.
- **`seasons`**: `id`, `show_id` (FK), `season_number`, `title`, timestamps.
- **`episodes`**: `id`, `season_id` (FK), `episode_number`, `title`, `description`, `duration`, `language` (`en`, `hi`), `content_group`, `status`, timestamps.
  - Unique Constraint: `UniqueConstraint('content_group', 'language')` to prevent duplicate locale variants.
- **`artworks`**: `id`, `entity_type` (`show`, `episode`), `entity_id`, `artwork_type` (`poster`, `banner`, `thumbnail`), `file_path`, `width`, `height`, `file_size_kb`.
- **`publish_runs`**: `id`, `user_id` (FK), `status` (`SUCCESS`, `FAILED`), `shows_count`, `episodes_count`, `file_size_bytes`, `duration_ms`, `error_message`, `created_at`.
- **`users`**: `id`, `email`, `hashed_password`, `role` (`admin`, `editor`), `is_active`, timestamps.

### Strict Server-Side Artwork Validation (Pillow)
Artwork validation is strictly enforced on the server:
- **Poster**: Aspect Ratio `2:3` (~600×900 px), Max size: `200 KB`.
- **Banner**: Aspect Ratio `16:9` (~1280×720 px), Max size: `200 KB`.
- **Thumbnail**: Aspect Ratio `16:9` (~640×360 px), Max size: `200 KB`.
- **Human-Readable Diagnostics**: If an editor uploads a 1.2 MB or 4:3 image, the API returns clear guidance (e.g., *"Image is 1,240 KB (limit is 200 KB). Aspect ratio is 1.33:1, expected 0.67:1 (2:3)"*).

### API Endpoints Summary
- `POST /auth/login` — JWT token generation with role payload.
- `GET /auth/me` — Current authenticated user context.
- `GET /admin/shows` & `POST /admin/shows` — Paginated show catalogue with multi-filter search.
- `GET /admin/shows/{id}` & `PATCH /admin/shows/{id}` & `DELETE /admin/shows/{id}` — Show management.
- `POST /admin/shows/batch-delete` — Batch deletion of shows.
- `POST /admin/seasons/{season_id}/episodes` — Episode creation with validation.
- `POST /admin/artwork/upload` — Multi-size image validation and storage.
- `GET /admin/validation-report` — System-wide publication readiness audit.
- `POST /admin/catalog/publish` — **[Admin Only]** Full atomic catalog rebuild.
- `POST /admin/shows/{id}/publish` — Per-show validation & publication trigger.
- `GET /catalog` — Edge-ready pre-rendered catalog payload.
- `GET /catalog/search?q=&category=&language=&section=` — Composed multi-facet catalog search.
- `GET /health` — Real-time database ping & health diagnostic.

---

## 6. Part B — Internal CMS (Admin & Editor Console)

Built with **React 18**, **TypeScript**, and **TanStack Query (v5)**:
- **Design System**: Strict White & `#543488` Purple palette with subtle micro-interactions and glassmorphic elevated cards.
- **Custom Select Component (`CustomSelect.tsx`)**: Replaces ugly browser native `<select>` dropdowns with smooth animated popovers (`@keyframes popoverEntrance`), 180° rotating chevrons, spring-bounced checkmarks, and search filtering.
- **Live Artwork Uploader**: Dedicated slots for Poster, Banner, and Thumbnail with aspect ratios, dimension guidelines, live preview, and clear error banners.
- **Role-Based UI Guards**: Editors can edit and inspect validation reports, but the **Publish** button is restricted with clear feedback for Admins.
- **Publication History & Timeline**: Displays past publication runs with item counts, execution durations, and historical change tracking.

---

## 7. Part C — Viewer UI (Netflix-Style Kids Streaming)

Built with **React 18** and **TypeScript**:
- **Hero Banner**: Displays high-resolution 16:9 hero artwork from featured shows with prominent "Watch Now" action.
- **Horizontal Scrolling Section Rows**: Categorized rows for *Featured*, *Series*, *Minisodes*, and *Songs* using 2:3 vertical posters.
- **Multi-Facet Search & Filter**: Real-time compose filters for keywords, category chips (Adventure, Folk, Learning, Maths, etc.), and audio languages (English, Hindi).
- **Show Details Modal**:
  - Full synopsis and category metadata.
  - Season & episode picker with 16:9 thumbnail previews.
  - **Language Variant Switcher**: Allows toggling between English and Hindi audio tracks for grouped episodes.
  - **Trailers Section**: Season 0 content surfaced separately.
- **Resilience & Graceful Image Degradation**: Placeholder fallback gradients and skeleton loaders prevent layout shift during asset loading.

---

## 8. Part D — Pipeline, Docker & Operability

### Multi-Container Docker Compose
The `docker-compose.yml` orchestrates:
1. `postgres`: PostgreSQL 15 Alpine with automated health check probe.
2. `backend`: FastAPI server with automatic Alembic migrations, database seeding, and uploads directory mounting.
3. `cms`: Admin CMS built with Vite and served via high-performance Nginx Alpine.
4. `viewer`: Public Viewer app built with Vite and served via Nginx Alpine.

### GitHub Actions CI/CD (`.github/workflows/ci.yml`)
1. **Backend Test Suite**: Spins up PostgreSQL service container, runs flake8 linting, and executes `pytest -v` across all 32 tests.
2. **Frontend Typecheck & Build**: Runs `tsc --noEmit` and `npm run build` on both `adminAndEditor` and `Viewer`.
3. **Docker Build Verification**: Validates that all three Docker images build without caching issues.
4. **Deploy Step**: Documents staging/production rollout strategy.

### Production Secrets Management
In production environments:
- **Never commit `.env` files**: Use automated secret managers such as **AWS Secrets Manager**, **HashiCorp Vault**, or **Doppler**.
- **Container Injection**: Inject `DATABASE_URL` and `SECRET_KEY` at runtime via Kubernetes Secrets or AWS ECS Task Definition parameter stores.
- **Rotation Policy**: Rotate JWT signing keys periodically using asymmetric RS256 with key ID (`kid`) headers to enable zero-downtime key rotation.

### Health Probing & Alerting Strategy
- **Health Endpoint**: `GET /health` executes `SELECT 1` against PostgreSQL to confirm active connection pooling.
- **Critical Alerting Metric**: **Publish Run Failure Rate (`publish_runs.status == 'FAILED'`)**. If more than 1 publication fails in a 15-minute window, trigger an immediate P1 alert via PagerDuty/Slack.

---

## 9. Part E — Written Engineering Analysis & Trade-Offs

### 1. How We Made Publishing Atomic (and Handling Process Crashes)
To guarantee that viewers **never see a partially written, corrupted, or empty catalogue**, publishing uses an atomic POSIX filesystem swap:
1. The publisher generates the complete catalog JSON payload in memory.
2. It writes the payload to a temporary file in the same filesystem directory: `storage/catalogue.json.tmp`.
3. It calls `os.fsync(f.fileno())` to ensure all bytes are physically flushed from OS write buffers to disk storage.
4. It calls `os.replace("storage/catalogue.json.tmp", "storage/catalogue.json")`.

**What happens if the process dies mid-publish?**
- If the server crashes, gets SIGKILLed, or loses power during JSON generation or writing to `.tmp`, the existing live `catalogue.json` remains **100% untouched and fully readable**.
- The partial `.tmp` file is safely overwritten on the next publish run.
- `os.replace` is an atomic inode pointer update at the OS kernel level—there is no intermediate state where the file does not exist or is half-written.

### 2. Storage Abstraction: Moving from Local Disk to Cloudflare R2
All file operations are decoupled behind the `StorageService` abstract base class (`app/storage/service.py`):
```python
class StorageService(ABC):
    @abstractmethod
    def upload(self, file_bytes: bytes, original_filename: str, content_type: str) -> str: ...
    @abstractmethod
    def delete(self, file_url_or_path: str) -> bool: ...
    @abstractmethod
    def get_url(self, filename: str) -> str: ...
```

To switch to **Cloudflare R2** in production:
1. Implement `R2StorageService` using `boto3.client('s3', endpoint_url=f'https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com')`.
2. In `app/storage/__init__.py`, instantiate `R2StorageService` when `STORAGE_TYPE=r2`.
3. **Zero lines of business code** in artwork uploaders, show routers, or publication services need to change.

### 3. Search Architecture, Scaling Limits & Next Steps
- **Current Implementation**:
  - **CMS**: SQL queries with composite indexes and case-insensitive parameterized `ILIKE` across shows, categories, and localized episode content.
  - **Viewer**: In-memory indexed query over the published catalog snapshot supporting composite filtering (keywords + category chips + language).
- **At What Size Does This Stop Working?**
  - **~10,000 to 50,000 shows**: In-memory JSON parsing in the browser becomes memory-heavy, and database `ILIKE` causes sequential table scans.
- **What We Would Do Next**:
  1. **Phase 1 (50k - 500k shows)**: Implement PostgreSQL **Full-Text Search (FTS)** using `tsvector` columns with GIN indexes and trigram fuzzy matching (`pg_trgm`).
  2. **Phase 2 (> 500k shows)**: Introduce dedicated search engine cluster (**Typesense** or **OpenSearch**) with edge CDN faceted caching.

### 4. Pre-Rendered JSON Catalogue vs Database Queries per Request
- **Why Pre-Rendered JSON?**
  - **Sub-Millisecond Edge Latency**: Static JSON files can be cached directly on Cloudflare CDN edge nodes globally, serving millions of simultaneous kids with $<15$ ms response times.
  - **Zero Database Load from Viewers**: A viral surge in streaming traffic puts zero load on PostgreSQL.
  - **Cost Efficiency**: Reading static files from object storage costs fractions of a cent compared to running large database read-replica clusters.
- **Where Does This Choice Bite You?**
  - **Publication Lag**: Changes made in the CMS are not live until a publish run completes (by design in this workflow).
  - **File Size Growth**: At $>100,000$ titles, a single monolithic `catalogue.json` becomes too large for mobile clients. The solution is splitting the pre-rendered catalogue into paginated section files (`catalogue_featured.json`, `catalogue_series.json`).

### 5. What Was Left Out and Why
- **Video Transcoding Pipeline**: Video encoding (HLS/DASH) was skipped as the challenge focuses on metadata catalog publishing and artwork validation.
- **Direct User Registration**: Public user registration was skipped in favor of admin invitation flows to model an enterprise internal CMS.

### 6. AI Usage Disclosure
- **Tooling Used**: Google DeepMind Antigravity AI Pair Programmer.
- **Areas Assisted**: Scaffolding baseline boilerplate, generating comprehensive seed data schemas, and assisting with CSS animation keyframes.
- **Engineering Judgment & Rejections**:
  - *Rejected*: Direct passlib bcrypt wrapper (deprecated in modern Python); replaced with native `bcrypt` library.
  - *Rejected*: In-place file writing for publishing; strictly implemented `os.fsync` + `os.replace` temp-file swapping for crash-proof atomicity.
  - *Rejected*: Browser native `<select>` dropdowns; custom engineered `CustomSelect` with spring physics and keyboard navigation.

---

## 10. Optional Stretch Features Implemented

1. **Per-Show Direct Publishing**: In addition to global catalog publication, editors can publish/unpublish individual shows with instantaneous catalog updates.
2. **Batch Show Deletion**: Multi-select and bulk-delete shows with automated foreign-key cascade cleanup.
3. **Publication History Timeline**: Full audit trail of who published what, timestamps, durations, and byte counts.
4. **Admin User Invitation & Password Setup Token Flow**: Complete user management interface with tokenized onboarding links.

---

## 11. Automated Test Suite

The test suite covers all critical business logic and authorization boundaries:

```powershell
cd backend
.\pabloEnv\Scripts\pytest -v
```

### Test Results:
```
============================== 32 passed in 19.25s ==============================
- tests/test_artwork.py (7 tests: 2:3/16:9 aspect ratios, dimensions, 200KB ceiling, upload endpoints)
- tests/test_auth.py (6 tests: login, tokens, role permissions, Editor 403 forbidden on publish)
- tests/test_episodes.py (2 tests: duration requirement, unique content_group + language)
- tests/test_publishing.py (3 tests: language variant collapse, Season 0 exclusion, atomic file swap)
- tests/test_search.py (6 tests: /health, /catalog, keyword, category, language composition)
- tests/test_shows.py (3 tests: batch delete success, empty list rejection, missing IDs)
- tests/test_users.py (5 tests: user listing, editor RBAC protection, invite tokens, setup emails)
```

---

## 12. Time Spent Breakdown

| Phase | Description | Time Spent |
|---|---|:---:|
| **Architecture & Data Modeling** | PostgreSQL schema, Alembic migrations, Pillow artwork validation, storage abstraction | ~1.5 hours |
| **Backend Core & Publishing Engine** | Atomic file replacement, validation report engine, RBAC, REST endpoints | ~2.0 hours |
| **Internal CMS Frontend** | Shows CRUD, artwork uploaders, custom animated selectors, validation dashboard | ~2.5 hours |
| **Viewer Frontend** | Netflix-style hero/rows, episode modal, language switcher, trailers isolation | ~1.5 hours |
| **Docker & CI/CD Pipeline** | Multi-stage Dockerfiles, Docker Compose orchestration, GitHub Actions | ~1.0 hour |
| **Automated Testing & Documentation** | 32 test cases, README Part E written engineering analysis | ~1.5 hours |
| **Total** | | **~10.0 hours** |
