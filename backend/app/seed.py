import io
import json
import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from sqlalchemy.orm import Session
from app.auth.security import hash_password
from app.config import settings
from app.database import Base, SessionLocal, engine
from app.models.artwork import Artwork, ArtworkType
from app.models.episode import Episode
from app.models.season import Season
from app.models.show import ItemStatus, Show
from app.models.user import User, UserRole
from app.services.publishing_service import build_catalogue_data, publish_catalog_atomic
from app.services.validation_service import generate_validation_report

# Color map for each show theme using official specification taxonomies
SHOW_THEMES = {
    "Moti's Many Lives": {"bg": "#3730a3", "accent": "#4f46e5", "category": "adventure, india, friendship", "section": "featured"},
    "Tiny Tales by Banyan Dadi": {"bg": "#064e3b", "accent": "#059669", "category": "stories, values, folk", "section": "series"},
    "Discover India with Moti": {"bg": "#78350f", "accent": "#d97706", "category": "travel, india, learning", "section": "minisodes"},
    "Peblo Songs": {"bg": "#86198f", "accent": "#c026d3", "category": "music, singalong", "section": "songs"},
    "Peblo Songs — Lyrical": {"bg": "#581c87", "accent": "#9333ea", "category": "music, reading", "section": "songs"},
    "Curious Cubs": {"bg": "#075985", "accent": "#0284c7", "category": "science, nature", "section": "series"},
    "Number Nest": {"bg": "#9a3412", "accent": "#ea580c", "category": "maths, learning", "section": "series"},
    "Rhyme Rangers": {"bg": "#334155", "accent": "#64748b", "category": "music, language", "section": "series"},
}

LANGUAGE_MAP = {
    "en": "en",
    "hi": "hi",
}


def generate_sample_image(width: int, height: int, text: str, bg_color: str, text_color: str = "white") -> bytes:
    img = Image.new("RGB", (width, height), color=bg_color)
    draw = ImageDraw.Draw(img)

    # Draw stylish border and accents
    draw.rectangle([8, 8, width - 8, height - 8], outline="#ffffff", width=2)
    draw.rectangle([14, 14, width - 14, height - 14], outline="#cbd5e1", width=1)

    # Centered text
    lines = text.split("\n")
    y_offset = (height // 2) - (len(lines) * 14)
    for line in lines:
        draw.text((width // 2, y_offset), line, fill=text_color, anchor="mm")
        y_offset += 28

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return buf.getvalue()


def create_and_save_artwork(
    db: Session,
    type_: ArtworkType,
    label: str,
    bg_color: str,
    show_id: int = None,
    episode_id: int = None,
) -> Artwork:
    if type_ == ArtworkType.POSTER:
        w, h = 600, 900
    elif type_ == ArtworkType.BANNER:
        w, h = 1280, 720
    else:  # THUMBNAIL
        w, h = 640, 360

    img_bytes = generate_sample_image(w, h, label, bg_color)
    filename = f"art_{type_.value.lower()}_{show_id or 0}_{episode_id or 0}_{w}x{h}.jpg"
    dest = Path(settings.UPLOAD_DIR) / filename
    with open(dest, "wb") as f:
        f.write(img_bytes)

    artwork = Artwork(
        show_id=show_id,
        episode_id=episode_id,
        type=type_,
        url=f"/uploads/{filename}",
        width=w,
        height=h,
        file_size=len(img_bytes),
        aspect_ratio=round(w / h, 3),
    )
    db.add(artwork)
    db.commit()
    db.refresh(artwork)
    return artwork


def seed_database(reset: bool = True):
    print("Starting database seeding with full dataset...")
    db: Session = SessionLocal()

    try:
        # 1. Seed users
        admin_user = db.query(User).filter(User.email == "admin@example.com").first()
        if not admin_user:
            admin_user = User(
                email="admin@example.com",
                password_hash=hash_password("Admin@123"),
                role=UserRole.ADMIN,
                is_active=True,
            )
            db.add(admin_user)
            print("Created Admin user: admin@example.com / Admin@123")

        editor_user = db.query(User).filter(User.email == "editor@example.com").first()
        if not editor_user:
            editor_user = User(
                email="editor@example.com",
                password_hash=hash_password("Editor@123"),
                role=UserRole.EDITOR,
                is_active=True,
            )
            db.add(editor_user)
            print("Created Editor user: editor@example.com / Editor@123")

        db.commit()

        # If reset requested, clear existing shows, seasons, episodes, artwork
        if reset:
            print("Cleaning existing show and episode records...")
            db.query(Artwork).delete()
            db.query(Episode).delete()
            db.query(Season).delete()
            db.query(Show).delete()
            db.commit()

        # Load raw dataset from JSON
        raw_data_path = Path(__file__).resolve().parent / "raw_episodes_data.json"
        if not raw_data_path.exists():
            print(f"Error: dataset file not found at {raw_data_path}")
            return

        with open(raw_data_path, "r", encoding="utf-8") as f:
            raw_episodes = json.load(f)

        print(f"Loaded {len(raw_episodes)} episode records from {raw_data_path.name}")

        # Group by show
        shows_map = {}
        for item in raw_episodes:
            show_title = item["show_title"]
            if show_title not in shows_map:
                shows_map[show_title] = {
                    "slug": item.get("slug"),
                    "section": item.get("section"),
                    "categories": item.get("categories", []),
                    "synopsis": item.get("synopsis"),
                    "episodes": [],
                }
            shows_map[show_title]["episodes"].append(item)

        created_shows_count = 0
        created_episodes_count = 0

        for show_title, show_data in shows_map.items():
            theme = SHOW_THEMES.get(show_title, {"bg": "#312e81", "accent": "#4338ca", "category": "General", "section": "General"})
            
            # Format section and category
            section_val = theme["section"]
            cats = show_data.get("categories") or []
            category_str = ", ".join(c.lower().strip() for c in cats) if cats else theme["category"]
            
            # Show status: PUBLISHED if any episode published and has section, else DRAFT
            has_published_ep = any(ep.get("status") == "published" for ep in show_data["episodes"])
            show_status = ItemStatus.PUBLISHED if (has_published_ep and section_val is not None) else ItemStatus.DRAFT

            show = Show(
                title=show_title,
                synopsis=show_data.get("synopsis") or "",
                section=section_val,
                category=category_str,
                status=show_status,
            )
            db.add(show)
            db.commit()
            db.refresh(show)
            created_shows_count += 1
            print(f"-> Created Show: {show.title} (ID: {show.id}, Section: {show.section}, Status: {show.status})")

            # Create Show Poster & Banner Artwork
            create_and_save_artwork(db, ArtworkType.POSTER, f"{show.title.upper()}\nPoster", theme["bg"], show_id=show.id)
            create_and_save_artwork(db, ArtworkType.BANNER, f"{show.title.upper()}\nBanner & Hero", theme["accent"], show_id=show.id)

            # Group episodes into seasons
            seasons_map = {}
            for ep_item in show_data["episodes"]:
                s_num = ep_item.get("season_number", 1)
                if s_num not in seasons_map:
                    seasons_map[s_num] = []
                seasons_map[s_num].append(ep_item)

            for s_num in sorted(seasons_map.keys()):
                season_title = "Official Trailers" if s_num == 0 else f"Season {s_num}"
                season = Season(
                    show_id=show.id,
                    season_number=s_num,
                    title=season_title,
                )
                db.add(season)
                db.commit()
                db.refresh(season)

                for ep_item in seasons_map[s_num]:
                    lang_raw = ep_item.get("language", "en")
                    lang_full = LANGUAGE_MAP.get(lang_raw, lang_raw.title())
                    
                    cgroup = ep_item.get("content_group", "").strip()
                    # Resolve any duplicate conflict if present
                    if ep_item.get("episode_id") == "ep_9001":
                        cgroup = "motis-many-lives-s01e02-v2"

                    ep_status = ItemStatus.PUBLISHED if ep_item.get("status") == "published" else ItemStatus.DRAFT
                    duration_sec = ep_item.get("duration_seconds", 0)

                    episode = Episode(
                        season_id=season.id,
                        episode_number=ep_item.get("episode_number", 1),
                        title=ep_item.get("episode_title", "").strip(),
                        description=f"{ep_item.get('episode_title')} - {show.title} ({lang_full})",
                        duration=duration_sec,
                        language=lang_full,
                        content_group=cgroup,
                        status=ep_status,
                    )
                    db.add(episode)
                    db.commit()
                    db.refresh(episode)
                    created_episodes_count += 1

                    # Artwork
                    art_available = ep_item.get("artwork_available", [])
                    if "thumbnail" in art_available:
                        label = f"S{s_num} E{episode.episode_number}\n{episode.title}\n({lang_full})"
                        create_and_save_artwork(db, ArtworkType.THUMBNAIL, label, theme["bg"], episode_id=episode.id)

        print(f"\nSeeding completed: {created_shows_count} shows and {created_episodes_count} episodes created!")

        # Validate and publish catalogue
        print("Checking catalogue validation...")
        val_report = generate_validation_report(db)
        print(f"Validation Report: Can Publish = {val_report.can_publish}, Errors: {val_report.errors_count}, Warnings: {val_report.warnings_count}")
        for err in val_report.errors:
            print(f"  [Validation Error] {err.reason}")

        # Build and write catalogue.json so Viewer has live data immediately
        catalog_dict = build_catalogue_data(db)
        catalog_path = Path(settings.CATALOGUE_PATH)
        catalog_path.parent.mkdir(parents=True, exist_ok=True)
        with open(catalog_path, "w", encoding="utf-8") as f:
            json.dump(catalog_dict, f, indent=2, ensure_ascii=False)
        print(f"Published catalogue.json written successfully ({len(catalog_dict.get('all_shows', []))} published shows)!")

    finally:
        db.close()


if __name__ == "__main__":
    seed_database(reset=True)
