from app.routers.auth import router as auth_router
from app.routers.admin_shows import router as admin_shows_router
from app.routers.admin_seasons import router as admin_seasons_router
from app.routers.admin_episodes import router as admin_episodes_router
from app.routers.admin_artwork import router as admin_artwork_router
from app.routers.admin_validation import router as admin_validation_router
from app.routers.admin_publish import router as admin_publish_router
from app.routers.admin_users import router as admin_users_router
from app.routers.viewer_catalog import router as viewer_catalog_router
from app.routers.health import router as health_router

__all__ = [
    "auth_router",
    "admin_shows_router",
    "admin_seasons_router",
    "admin_episodes_router",
    "admin_artwork_router",
    "admin_validation_router",
    "admin_publish_router",
    "admin_users_router",
    "viewer_catalog_router",
    "health_router",
]

