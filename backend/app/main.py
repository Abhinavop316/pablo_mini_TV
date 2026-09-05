import os
from pathlib import Path
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.routers import (
    admin_artwork_router,
    admin_episodes_router,
    admin_publish_router,
    admin_seasons_router,
    admin_shows_router,
    admin_users_router,
    admin_validation_router,
    auth_router,
    health_router,
    viewer_catalog_router,
)

app = FastAPI(
    title="Peblo TV Mini API",
    description="FastAPI Backend for Peblo TV Mini Catalogue CMS & Streaming Application",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS for local frontend dev servers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload directory exists and mount static files
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include all routers
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(admin_shows_router)
app.include_router(admin_seasons_router)
app.include_router(admin_episodes_router)
app.include_router(admin_artwork_router)
app.include_router(admin_validation_router)
app.include_router(admin_publish_router)
app.include_router(admin_users_router)
app.include_router(viewer_catalog_router)



@app.get("/")
def root():
    return {
        "app": "Peblo TV Mini API",
        "status": "running",
        "docs": "/docs",
        "health": "/health",
        "catalog": "/catalog",
    }