# 📺 PeBlo TV Mini — Cloud Streaming Platform & Studio CMS

<p align="center">
  <img src="adminAndEditor/public/logo.png" alt="PeBlo Logo" width="180" />
</p>

<p align="center">
  <strong>A production-grade, full-stack media catalogue publisher & Netflix-style kids streaming platform</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>

---

> [!TIP]
> ### 💡 Recruiter & Reviewer Note: 1-Click Fast Login
> I implemented secure **JWT Authentication and Role-Based Access Control (RBAC)** separating the **Administrator** and **Editor** roles with password hashing (`bcrypt`), token validation, and endpoint authorization.
> 
> **To make review evaluation as seamless and convenient as possible for the recruiter**, I added **1-Click Auto-Fill Shortcut Buttons** on the login screen (with PeBlo's signature playful irregular border) that auto-fill the credentials for both Admin and Editor. If needed, standard manual-only authentication or dynamic user registration can be enabled anytime — *I HAVE THAT MUCH OF SKILL LOL!* 😎🚀

---

## 📑 Table of Contents
1. [🌟 Architecture Overview](#-1-architecture-overview)
2. [🚀 Quickstart: One-Command Docker Setup](#-2-quickstart-one-command-docker-setup)
3. [🔑 Accounts & Access Credentials](#-3-accounts--access-credentials)
4. [🛠️ Manual Local Development Setup](#-4-manual-local-development-setup)
5. [🎯 Core Conventions & Data Integrity](#-5-core-conventions--data-integrity)
6. [⚡ Part A — Backend Architecture & API Design](#-6-part-a--backend-architecture--api-design)
7. [🎨 Part B — Studio CMS (Admin & Editor Console)](#-7-part-b--studio-cms-admin--editor-console)
8. [🍿 Part C — Viewer UI (Netflix-Style Kids Streaming)](#-8-part-c--viewer-ui-netflix-style-kids-streaming)
9. [🚢 Part D — Docker, CI/CD & Deployment](#-9-part-d--docker-cicd--deployment)
10. [🧠 Part E — Written Engineering Analysis & Trade-Offs](#-10-part-e--written-engineering-analysis--trade-offs)
11. [🧪 Automated Test Suite](#-11-automated-test-suite)
12. [⏱️ Time Spent Breakdown](#-12-time-spent-breakdown)

---

## 🌟 1. Architecture Overview

PeBlo TV Mini decouples the **internal editorial CMS** from the **public viewer streaming experience** through an atomic, crash-proof publishing pipeline:

```
┌────────────────────────────────────────────────────────────────────┐
│                         INTERNAL STUDIO CMS                        │
│        Admin & Editor Console (React 18 + TypeScript + Vite)       │
│              http://localhost:5173                                 │
└─────────────────────────────────┬──────────────────────────────────┘
                                  │
                   JWT Bearer Auth & RBAC Enforcement
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────┐
│                         FASTAPI BACKEND                            │
│             REST API Server (http://localhost:8000)                │
│                                                                    │
│  • Auth & RBAC (/auth/*)                                           │
│  • Shows, Seasons, Episodes CRUD (/admin/shows, /admin/episodes)   │
│  • Artwork Validation (Pillow 2:3, 16:9, <=200KB) (/admin/artwork) │
│  • Publication Readiness Engine (/admin/validation-report)         │
│  • Atomic Publisher (/admin/catalog/publish) [ADMIN ONLY]          │
│  • Public Streaming Endpoints (/catalog, /catalog/search)          │
└───────────────────┬────────────────────────────┬───────────────────┘
                    │                            │
       Read/Write Relational State      Atomic File Generation
                    │                            │
                    ▼                            ▼
      ┌────────────────────────────┐   ┌─────────────────────────────┐
      │    POSTGRESQL DATABASE     │   │   LIVE CATALOGUE STORAGE    │
      │          pablo_db          │   │       catalogue.json        │
      │ • users        • artwork   │   └──────────────┬──────────────┘
      │ • shows        • episodes  │                  │
      │ • seasons      • publish_runs                 │ Public Read Access
      └────────────────────────────┘                  ▼
                                       ┌─────────────────────────────┐
                                       │      VIEWER FRONTEND        │
                                       │  Netflix-Style Streaming UI │
                                       │    http://localhost:5174    │
                                       └─────────────────────────────┘
```

---

## 🚀 2. Quickstart: One-Command Docker Setup

The entire multi-container architecture (PostgreSQL, Backend API with automatic migrations & seeding, CMS UI, and Viewer UI) can be launched with a single command:

```bash
docker-compose up --build
```

### 🌐 Services & Port Mapping
| Service | Local URL | Description |
|---|---|---|
| **CMS Studio Frontend** | `http://localhost:5173` | Internal editorial console for Admins & Editors |
| **Viewer Streaming App** | `http://localhost:5174` | Public Netflix-style kids browsing surface |
| **FastAPI Backend** | `http://localhost:8000` | REST API, OpenAPI interactive docs at `/docs` |
| **Health Check** | `http://localhost:8000/health` | Live database connectivity probe |
| **PostgreSQL** | `localhost:5432` | Relational database (`pablo_db`) |

---

## 🔑 3. Accounts & Access Credentials

The system operates with **2 fixed production roles** configured via environment variables:

| Role | Username / Email | Password | Permissions & Capabilities |
|---|---|---|---|
| **Administrator** 👑 | `@peblo_admin`<br>`admin@peblo.tv` | `Admin@123` | • Full Shows, Seasons & Episodes CRUD<br>• Artwork Upload & Validation<br>• **Atomic Live Catalogue Publishing**<br>• System Role Directory Access |
| **Content Editor** ✍️ | `@peblo_editor`<br>`editor@peblo.tv` | `Editor@123` | • Full Shows, Seasons & Episodes CRUD<br>• Artwork Upload & Validation<br>• Publication Readiness Audit<br>• *(Restricted: Cannot trigger live publication)* |

> [!NOTE]
> On the login page (`http://localhost:5173/login`), click the **Admin** or **Editor** shortcut buttons to auto-populate credentials instantly.

---

## 🛠️ 4. Manual Local Development Setup

### Prerequisites
- **Python 3.12+**
- **Node.js 18+** & **npm**
- **PostgreSQL 14+** running on port `5432` with database `pablo_db`

### 1️⃣ Backend Setup
```powershell
cd backend
python -m venv pabloEnv
.\pabloEnv\Scripts\activate
pip install -r requirements.txt

# Run migrations & seed data
alembic upgrade head
python -c "from app.seed import seed_database; seed_database(reset=False)"

# Start FastAPI server
python server.py
```

### 2️⃣ CMS Frontend Setup
```powershell
cd adminAndEditor
npm install
npm run dev
```

### 3️⃣ Viewer Frontend Setup
```powershell
cd Viewer
npm install
npm run dev -- --port 5174
```

---

## 🎯 5. Core Conventions & Data Integrity

The system strictly enforces the business specifications defined in `reference.json`:

1. **Season 0 is Reserved for Trailers**:
   - Episodes attached to Season 0 are excluded from regular episode listings in the Viewer UI.
   - They are grouped and exposed as a dedicated **Trailers & Teasers carousel** on the show details modal.
2. **Language Variant Collapsing (`content_group`)**:
   - Multiple episodes sharing the same `content_group` (e.g. `motis-many-lives-s01e01`) represent localized audio variants (English, Hindi).
   - The publisher automatically collapses them into **one catalog entry** with `languages: ["en", "hi"]`, enabling smooth in-player language switching without duplicate card clutter.
3. **Publication Readiness Engine (`GET /admin/validation-report`)**:
   - Scans all shows and episodes for missing artwork, incomplete durations, missing sections, and orphaned records before allowing publication.

---

## ⚡ 6. Part A — Backend Architecture & API Design

### Relational Schema (`PostgreSQL`)
- **`shows`**: `id`, `title`, `synopsis`, `section` (`featured`, `series`, `minisodes`, `songs`), `category` (15 taxonomies), `status` (`DRAFT`, `PUBLISHED`), timestamps.
- **`seasons`**: `id`, `show_id` (FK), `season_number`, `title`, timestamps.
- **`episodes`**: `id`, `season_id` (FK), `episode_number`, `title`, `description`, `duration`, `language` (`en`, `hi`), `content_group`, `status`, timestamps.
  - Unique Constraint: `UniqueConstraint('content_group', 'language')` to prevent duplicate locale variants.
- **`artworks`**: `id`, `show_id` (FK), `episode_id` (FK), `type` (`POSTER`, `BANNER`, `THUMBNAIL`), `url`, `width`, `height`, `file_size`, `aspect_ratio`, `created_at`.
- **`publish_runs`**: `id`, `triggered_by`, `status` (`SUCCESS`, `FAILED`), `shows_count`, `episodes_count`, `catalogue_size`, `duration_ms`, `error_message`, `started_at`, `completed_at`.
- **`users`**: `id`, `username`, `email`, `password_hash`, `role` (`ADMIN`, `EDITOR`), `is_active`, `is_verified`, timestamps.

### 🖼️ Server-Side Artwork Validation (Pillow)
Artwork validation is strictly enforced on the server:
- **Poster**: Aspect Ratio `2:3` (`600 × 900 px`), Max size: `200 KB`.
- **Banner**: Aspect Ratio `16:9` (`1280 × 720 px`), Max size: `200 KB`.
- **Thumbnail**: Aspect Ratio `16:9` (`640 × 360 px`), Max size: `200 KB`.

### 📡 API Endpoints Summary
- `POST /auth/login` — JWT token generation with role claims.
- `GET /auth/me` — Current authenticated user profile.
- `GET /admin/shows` & `POST /admin/shows` — Paginated show catalogue with multi-filter search.
- `GET /admin/shows/{id}` & `PATCH /admin/shows/{id}` & `DELETE /admin/shows/{id}` — Show management.
- `POST /admin/shows/batch-delete` — Batch deletion of shows.
- `POST /admin/seasons/{season_id}/episodes` — Episode creation with validation.
- `POST /admin/artwork/validate-and-save` — Multi-size image validation and storage.
- `GET /admin/validation-report` — System-wide publication readiness audit.
- `POST /admin/catalog/publish` — **[Admin Only]** Full atomic catalog rebuild.
- `POST /admin/shows/{id}/publish` — Per-show validation & publication trigger.
- `GET /catalog` — Edge-ready pre-rendered catalog payload.
- `GET /catalog/search?q=&category=&language=&section=` — Composed multi-facet catalog search.
- `GET /health` — Real-time database ping & health diagnostic.

---

## 🎨 7. Part B — Studio CMS (Admin & Editor Console)

Built with **React 18**, **TypeScript**, and **TanStack Query (v5)**:
- **Design System**: Strict White & `#543488` Purple palette with micro-interactions and elevated cards.
- **Custom Select Component (`CustomSelect.tsx`)**: Replaces browser native select elements with animated popovers, rotating chevrons, and spring-bounced checkmarks.
- **Live Artwork Uploader**: Dedicated slots for Poster, Banner, and Thumbnail with aspect ratios, dimension guidelines, live preview, and clear error banners.
- **Role-Based UI Guards**: Editors can edit and inspect validation reports, but the **Publish** action is restricted to Admins.
- **Publication History & Timeline**: Displays past publication runs with item counts, execution durations, and historical change tracking.

---

## 🍿 8. Part C — Viewer UI (Netflix-Style Kids Streaming)

Built with **React 18** and **TypeScript**:
- **Hero Banner**: Displays high-resolution 16:9 hero artwork from featured shows with prominent "Watch Now" action.
- **Horizontal Scrolling Section Rows**: Categorized rows for *Featured*, *Series*, *Minisodes*, and *Songs* using 2:3 vertical posters.
- **Multi-Facet Search & Filter**: Real-time filters for keywords, category chips (Adventure, Folk, Learning, Maths, etc.), and audio languages (English, Hindi).
- **Show Details Modal**:
  - Full synopsis and category metadata.
  - Season & episode picker with 16:9 thumbnail previews.
  - **Language Variant Switcher**: Allows toggling between English and Hindi audio tracks for grouped episodes.
  - **Trailers Section**: Season 0 content surfaced separately.

---

## 🚢 9. Part D — Docker, CI/CD & Deployment

### 🐳 Multi-Container Docker Compose
The `docker-compose.yml` orchestrates:
1. `postgres`: PostgreSQL 15 Alpine with automated health check probe.
2. `backend`: FastAPI server with automatic Alembic migrations, database seeding, and uploads directory mounting.
3. `cms`: Admin CMS built with Vite and served via high-performance Nginx Alpine.
4. `viewer`: Public Viewer app built with Vite and served via Nginx Alpine.

### 🔄 Vercel SPA Routing Configuration
Both `adminAndEditor` and `Viewer` include `vercel.json` rewrite rules to prevent 404 errors upon client-side page refreshes:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 🧠 10. Part E — Written Engineering Analysis & Trade-Offs

### 1. How We Made Publishing Atomic (and Handling Process Crashes)
To guarantee that viewers **never see a partially written, corrupted, or empty catalogue**, publishing uses an atomic POSIX filesystem swap:
1. The publisher generates the complete catalog JSON payload in memory.
2. It writes the payload to a temporary file: `storage/catalogue.json.tmp`.
3. It calls `os.fsync(f.fileno())` to ensure all bytes are physically flushed from OS write buffers to disk storage.
4. It calls `os.replace("storage/catalogue.json.tmp", "storage/catalogue.json")`.

**What happens if the process dies mid-publish?**
- If the server crashes, gets SIGKILLed, or loses power during JSON generation or writing to `.tmp`, the existing live `catalogue.json` remains **100% untouched and fully readable**.
- `os.replace` is an atomic inode pointer update at the OS kernel level—there is no intermediate state where the file does not exist or is half-written.

### 2. Storage Abstraction: Moving from Local Disk to Cloudflare R2 / AWS S3
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

To switch to **Cloudflare R2** or **AWS S3** in production:
1. Implement `R2StorageService` using `boto3.client('s3', endpoint_url=f'https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com')`.
2. In `app/storage/__init__.py`, instantiate `R2StorageService` when `STORAGE_TYPE=r2`.
3. **Zero lines of business code** in artwork uploaders, show routers, or publication services need to change.

### 3. Search Architecture & Scaling
- **CMS**: SQL queries with composite indexes and case-insensitive parameterized `ILIKE` across shows, categories, and localized episode content.
- **Viewer**: In-memory indexed query over the published catalog snapshot supporting composite filtering (keywords + category chips + language).
- **Scaling Path (>50,000 shows)**:
  1. PostgreSQL Full-Text Search with GIN indexes and `tsvector` trigram matching (`pg_trgm`).
  2. Dedicated search engine cluster (**Typesense** or **OpenSearch**) with edge CDN faceted caching.

---

## 🧪 11. Automated Test Suite

The test suite covers all critical business logic, artwork constraints, and authorization boundaries:

```powershell
cd backend
.\pabloEnv\Scripts\pytest -v
```

### ✅ Test Coverage Breakdown:
```
============================== 31 passed in ~18s ==============================
✔ tests/test_artwork.py    (Aspect ratios 2:3 and 16:9, dimensions, 200KB ceiling, validation endpoint)
✔ tests/test_auth.py       (JWT generation, token decoding, role claims, Editor publish restrictions)
✔ tests/test_episodes.py   (Duration requirements, unique content_group + language constraints)
✔ tests/test_publishing.py (Language variant collapse, Season 0 exclusion, atomic file swap)
✔ tests/test_search.py     (/health check, /catalog, keyword, category, and language filtering)
✔ tests/test_shows.py      (Batch delete success, empty list rejection, missing IDs)
✔ tests/test_users.py      (1 Admin & 1 Editor directory listing, disabled creation/deletion guardrails)
```

---

## ⏱️ 12. Time Spent Breakdown

| Phase | Description | Time Spent |
|---|---|:---:|
| **Architecture & Data Modeling** | PostgreSQL schema, Alembic migrations, Pillow artwork validation, storage abstraction | ~1.5 hours |
| **Backend Core & Publishing Engine** | Atomic file replacement, validation report engine, RBAC, REST endpoints | ~2.0 hours |
| **Internal CMS Frontend** | Shows CRUD, artwork uploaders, custom animated selectors, validation dashboard | ~2.5 hours |
| **Viewer Frontend** | Netflix-style hero/rows, episode modal, language switcher, trailers isolation | ~1.5 hours |
| **Docker & CI/CD Pipeline** | Multi-stage Dockerfiles, Docker Compose orchestration, Vercel SPA rewrites | ~1.0 hour |
| **Automated Testing & Documentation** | 31 test cases, README Part E written engineering analysis | ~1.5 hours |
| **Total** | | **~10.0 hours** |

---

<p align="center">
  <strong>Made with 💜 for PeBlo TV Mini</strong>
</p>
