# 🎨 PeBlo TV Mini — Studio CMS (Admin & Editor Console)

<p align="center">
  <img src="public/logo.png" alt="PeBlo Logo" width="160" />
</p>

<p align="center">
  <strong>Internal editorial and catalogue management studio for PeBlo TV Mini</strong>
</p>

<p align="center">
  <a href="https://pebloadmineditor.vercel.app/"><img src="https://img.shields.io/badge/Live%20CMS%20Studio-pebloadmineditor.vercel.app-543488?style=for-the-badge&logo=vercel&logoColor=white" alt="Live CMS Studio" /></a>
  <img src="https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
</p>

---

### 🌐 Live Production Deployment
- **URL**: [https://pebloadmineditor.vercel.app/](https://pebloadmineditor.vercel.app/)

---

## 🚀 Key Features

- 🔐 **Role-Based Access Control (RBAC)**: Distinct workflows for Administrators and Content Editors with JWT authentication.
- ⚡ **1-Click Auto-Fill Shortcut Buttons**: Instant credentials fill on the login screen for seamless review and evaluation.
- 📺 **Comprehensive Catalogue CRUD**: Full management of Shows, Seasons, and Episodes.
- 🖼️ **Client & Server-Side Artwork Validation**: Dedicated upload slots for Poster (`2:3`), Banner (`16:9`), and Thumbnail (`16:9`) with real-time aspect ratio, dimensions, and <=200 KB size enforcement.
- 📊 **Publication Readiness Audit**: Live inspection of catalogue validation errors before publishing.
- 🚀 **Atomic Live Catalogue Publishing**: Single-click atomic catalog publishing (restricted to Administrators).
- 📜 **Publication History & Timeline**: Audit trail of previous publication runs, counts, durations, and status logs.
- ✨ **Custom Design System**: PeBlo `#543488` purple palette with custom spring-animated dropdown selectors and responsive micro-interactions.

---

## 🛠️ Local Development

### Prerequisites
- Node.js 18+ & npm

### Setup & Run
```bash
# Install dependencies
npm install

# Start local development server (defaults to port 5173)
npm run dev

# Build for production
npm run build
```

---

## 📁 Project Structure
```
src/
├── api/            # TanStack Query hooks & Axios API client
├── components/     # Reusable UI components (CustomSelect, ArtworkUploader, Modals)
├── context/        # Auth & Role state context
├── pages/          # Login, Shows, Episodes, Validation, Publication History
├── types/          # TypeScript interfaces & types
└── App.tsx         # Route configuration & Navigation shell
```
