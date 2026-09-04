# Peblo TV Mini — Streaming Platform & Catalogue CMS

A production-grade, full-stack video catalogue publishing and streaming platform built with **FastAPI**, **PostgreSQL**, **SQLAlchemy 2.x**, **Alembic**, and **React (TypeScript)**.

---

## 📑 Table of Contents
1. [Overview & Architecture](#overview--architecture)
2. [Quickstart & Setup](#quickstart--setup)
3. [Authentication & Role-Based Access Control (RBAC)](#authentication--role-based-access-control-rbac)
4. [Atomic Catalogue Publishing Pipeline](#atomic-catalogue-publishing-pipeline)
5. [Storage Abstraction (Local to Cloudflare R2)](#storage-abstraction-local-to-cloudflare-r2)
6. [Search & Filter Design](#search--filter-design)
7. [Running Automated Tests](#running-automated-tests)
8. [Architectural Trade-Offs](#architectural-trade-offs)
9. [AI Usage Disclosure](#ai-usage-disclosure)

---

## Overview & Architecture

Peblo TV Mini isolates the **internal editorial CMS** from the **public viewer streaming experience** through an atomic publishing pipeline.

```
+--------------------------------------------------------------------+
|                         INTERNAL CMS                               |
|        Admin & Editor Console (React + TypeScript)                 |
|              http://localhost:5173                                 |
+---------------------------------+----------------------------------+
                                  |
                   JWT Bearer Auth & Role Checks
                                  |
                                  v
+--------------------------------------------------------------------+
|                         FASTAPI BACKEND                            |
|             REST API Server (http://127.0.0.1:8000)                |
|                                                                    |
|  - Auth & Security (/auth/*)                                       |
|  - CMS Shows & Episodes CRUD (/admin/shows, /admin/episodes)       |
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

## Quickstart & Setup

### Prerequisites
- **Python 3.12+**
- **Node.js 18+** & **npm**
- **PostgreSQL 14+** running locally on port `5432` with database `pablo_db`

---

### 1. Backend Setup

```powershell
cd backend

# Create & activate virtual environment (if not already present)
python -m venv pabloEnv
.\pabloEnv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run Alembic database migrations
alembic upgrade head

# Seed demo content, initial admin/editor users, sample artwork, and published catalogue
python -m app.seed

# Start FastAPI server on http://127.0.0.1:8000
python server.py
```

FastAPI interactive OpenAPI documentation is available at:
- Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- Health Check: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

#### Default Seed Credentials
| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@example.com` | `Admin@123` |
| **Editor** | `editor@example.com` | `Editor@123` |

---

### 2. Admin & Editor CMS Frontend

```powershell
cd adminAndEditor
npm install
npm run dev
```
Accessible at: **`http://localhost:5173`** (or Vite assigned port).

---

### 3. Public Viewer Frontend

```powershell
cd Viewer
npm install
npm run dev -- --port 5174
```
Accessible at: **`http://localhost:5174`**.

---

## Authentication & Role-Based Access Control (RBAC)

Peblo TV implements strict backend authorization boundaries using JWT Bearer authentication and native bcrypt hashing.

### Role Matrix

| Action / Capability | Editor | Admin | Viewer (Public) |
|---|:---:|:---:|:---:|
| Browse live public catalogue (`/catalog`) | ✅ | ✅ | ✅ |
| Public catalogue search (`/catalog/search`) | ✅ | ✅ | ✅ |
| View CMS Dashboard & Shows list | ✅ | ✅ | ❌ |
| Create, Edit, Delete Shows & Seasons | ✅ | ✅ | ❌ |
| Create, Edit, Delete Episodes | ✅ | ✅ | ❌ |
| Upload & Validate Artwork (Poster, Banner, Thumbnail) | ✅ | ✅ | ❌ |
| Inspect Validation Report (`/admin/validation-report`) | ✅ | ✅ | ❌ |
| View Publish Audit History (`/admin/catalog/publish-runs`) | ✅ | ✅ | ❌ |
| **Trigger Live Catalogue Publication (`/admin/catalog/publish`)** | ❌ **(403 Forbidden)** | ✅ | ❌ |

---

## Atomic Catalogue Publishing Pipeline

To ensure that viewers **never see a partially written or corrupted catalogue**, publishing uses an atomic file replacement strategy:

1. **Dataset Integrity Verification**: The publishing service evaluates the entire catalogue against business validation rules (`missing artwork`, `missing duration`, `missing sections`, `duplicate language groups`). If any blocking errors are found, the publish run is halted immediately and logged as `FAILED`.
2. **Deterministic Data Assembly**:
   - Only `PUBLISHED` shows and episodes are selected.
   - **Language variants** sharing the same `content_group` are collapsed into a single episode entry with `languages: ["English", "Hindi"]`.
   - **Season 0 (Trailers)** is separated from the regular seasons list into a dedicated `trailers` structure.
3. **Atomic File Write**:
   ```
   Generate Catalogue JSON
             ↓
   Write to temp file (catalogue.json.tmp)
             ↓
   Flush & sync to disk (os.fsync)
             ↓
   Atomic file swap (os.replace)
             ↓
   Live catalogue.json
   ```
4. **Audit Logging**: Every execution records a `PublishRun` timestamp, initiator email, show/episode counts, and exact catalogue payload size.

---

## Storage Abstraction (Local to Cloudflare R2)

Artwork assets are decoupled from the physical filesystem using a uniform `StorageService` interface:

```python
class StorageService(ABC):
    @abstractmethod
    def upload(self, file_bytes: bytes, original_filename: str, content_type: str) -> str: ...
    @abstractmethod
    def delete(self, file_url_or_path: str) -> bool: ...
    @abstractmethod
    def get_url(self, filename: str) -> str: ...
    @abstractmethod
    def exists(self, filename: str) -> bool: ...
```

- **Local Development**: `LocalStorage` saves files to `backend/uploads/` and serves them statically via FastAPI mounted `/uploads`.
- **Production Extension**: Switching to Cloudflare R2 / AWS S3 requires adding an `R2Storage` implementation in `app/storage/service.py` without modifying any route or business validation logic.

### Artwork Backend Validation Rules
Artwork uploads are validated server-side using **Pillow**:
- **Poster**: 2:3 Aspect ratio (~600x900 px), Max size: 200 KB.
- **Banner**: 16:9 Aspect ratio (~1280x720 px), Max size: 200 KB.
- **Thumbnail**: 16:9 Aspect ratio (~640x360 px), Max size: 200 KB.
- Format: JPG, PNG, WEBP.

---

## Search & Filter Design

1. **CMS Internal Search**: Server-side SQL query with parameterized `ILIKE` across title, synopsis, section, category, and joined episode languages, with server-side pagination.
2. **Viewer Public Search**: In-memory indexed query over the published catalogue structure supporting simultaneous composition of keywords, category chips, audio languages, and catalogue sections with empty-state handling.

---

## Running Automated Tests

A comprehensive `pytest` test suite validates all critical business rules:

```powershell
cd backend
.\pabloEnv\Scripts\pytest -v
```

### Test Coverage Highlights:
- **Authentication**: Valid login, invalid credentials, token decoding, Editor forbidden from publishing (`403`), Admin publication permission.
- **Artwork Validation**: Correct aspect ratios, rejected bad ratios, resolution minimums, oversized file rejection (>200 KB).
- **Episode Integrity**: Duration required for publication, thumbnail required for publication, unique constraint on `(content_group, language)`.
- **Publishing Engine**: Atomic file rename, exclusion of Draft items, exclusion of Season 0 from regular seasons, language variant grouping.
- **Public Endpoints**: `/health` database check, `/catalog` output, `/catalog/search` composition.

---

## Architectural Trade-Offs

1. **Relational Database vs NoSQL**: PostgreSQL was selected for strict relational constraints (such as `UniqueConstraint("content_group", "language")`, foreign keys, cascade deletes) to guarantee dataset integrity before publishing.
2. **Pre-rendered JSON Catalogue vs Dynamic Querying**: The viewer consumes pre-computed, atomically generated JSON snapshots. This yields sub-millisecond response times, simplifies caching behind CDNs, and completely shields the PostgreSQL database from viewer traffic spikes.
3. **Native Bcrypt over Passlib**: Direct `bcrypt.hashpw` and `bcrypt.checkpw` were chosen to eliminate deprecated library wrapper warnings while maintaining password hashing standards.

---

## AI Usage Disclosure
- **Tooling Used**: Google DeepMind Antigravity AI Pair Programmer.
- **Components Assisted**: Generation of project scaffolding, boilerplate schemas, initial test suite, and UI layout components.
- **Review & Verification**: All SQL queries, RBAC dependencies, Pillow image validations, atomic file swap logic, and TypeScript compilation were manually verified and executed with end-to-end unit tests.
