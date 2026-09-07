# 🍿 PeBlo TV Mini — Viewer Streaming App

<p align="center">
  <img src="public/logo.png" alt="PeBlo Logo" width="160" />
</p>

<p align="center">
  <strong>A playful, Netflix-style kids video streaming web application for PeBlo TV Mini</strong>
</p>

<p align="center">
  <a href="https://pablo-mini-tv-psi.vercel.app/"><img src="https://img.shields.io/badge/Live%20Viewer%20App-pablo--mini--tv--psi.vercel.app-ff007f?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Viewer App" /></a>
  <img src="https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
</p>

---

### 🌐 Live Production Deployment
- **URL**: [https://pablo-mini-tv-psi.vercel.app/](https://pablo-mini-tv-psi.vercel.app/)

---

## 🚀 Key Features

- 🎬 **Hero Feature Carousel**: High-impact, responsive 16:9 banner showcase with metadata badges and instant play action.
- 🗂️ **Categorized Section Rows**: Smooth horizontal scrolling rails for *Featured*, *Series*, *Minisodes*, and *Songs* with vertical 2:3 card artwork.
- 🔍 **Instant Search & Category Filtering**: Real-time multi-filter combining keywords, 15+ category chips (Adventure, Folk, Learning, Maths, etc.), and audio languages.
- 📺 **Interactive Show Details Modal**:
  - Full synopsis, section tags, and genre indicators.
  - Multi-season navigation with 16:9 episode thumbnails.
  - **Language Variant Switcher**: Toggle seamlessly between English (`en`) and Hindi (`hi`) tracks for grouped episode variants (`content_group`).
  - **Trailers & Teasers (Season 0)**: Season 0 content automatically isolated into an exclusive trailer showcase carousel.
- 🎈 **Playful Kids Design**: Rich pastel animations, bouncy interactive cards, custom-styled media controls, and accessible responsive UI.

---

## 🛠️ Local Development

### Prerequisites
- Node.js 18+ & npm

### Setup & Run
```bash
# Install dependencies
npm install

# Start local development server (port 5174)
npm run dev -- --port 5174

# Build for production
npm run build
```

---

## 📁 Project Structure
```
src/
├── components/     # HeroBanner, ShowRail, ShowCard, EpisodeModal, Navbar, Footer
├── pages/          # Home, Explore / Search, Watch
├── services/       # Catalog API fetching & caching service
├── types/          # Catalogue and Show data models
└── App.tsx         # Routing & Main layout
```
