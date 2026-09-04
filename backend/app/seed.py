import io
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
from app.services.publishing_service import publish_catalog_atomic


def generate_sample_image(width: int, height: int, text: str, bg_color: str, text_color: str = "white") -> bytes:
    img = Image.new("RGB", (width, height), color=bg_color)
    draw = ImageDraw.Draw(img)

    # Draw decorative elements
    draw.rectangle([10, 10, width - 10, height - 10], outline="#c084fc", width=3)
    draw.text((width // 2, height // 2), text, fill=text_color, anchor="mm")

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
    filename = f"seed_{type_.value.lower()}_{show_id or episode_id}_{w}x{h}.jpg"
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


def seed_database():
    print("Starting database seeding...")
    db: Session = SessionLocal()

    try:
        # 1. Clear existing seed data or check if already seeded
        # Seed users
        admin_user = db.query(User).filter(User.email == "admin@example.com").first()
        if not admin_user:
            admin_user = User(
                email="admin@example.com",
                password_hash=hash_password("Admin@123"),
                role=UserRole.ADMIN,
                is_active=True,
            )
            db.add(admin_user)
            print("Created seed Admin user: admin@example.com / Admin@123")

        editor_user = db.query(User).filter(User.email == "editor@example.com").first()
        if not editor_user:
            editor_user = User(
                email="editor@example.com",
                password_hash=hash_password("Editor@123"),
                role=UserRole.EDITOR,
                is_active=True,
            )
            db.add(editor_user)
            print("Created seed Editor user: editor@example.com / Editor@123")

        db.commit()

        # Check if shows exist
        if db.query(Show).count() > 0:
            print("Database already contains shows. Skipping show seeding.")
            return

        print("Seeding demo shows, seasons, episodes, and artwork...")

        # SHOW 1: Cyber Odyssey (Sci-Fi, Trending)
        show1 = Show(
            title="Cyber Odyssey 2099",
            synopsis="In a dystopian neo-metropolis, an AI investigator uncovers a conspiracy that threatens the boundary between synthetic life and human consciousness.",
            section="Trending Now",
            category="Sci-Fi",
            status=ItemStatus.PUBLISHED,
        )
        db.add(show1)
        db.commit()
        db.refresh(show1)

        create_and_save_artwork(db, ArtworkType.POSTER, "CYBER ODYSSEY 2099", "#1e1b4b", show_id=show1.id)
        create_and_save_artwork(db, ArtworkType.BANNER, "CYBER ODYSSEY 2099 - BANNER", "#312e81", show_id=show1.id)

        # Season 0: Trailer
        s1_s0 = Season(show_id=show1.id, season_number=0, title="Official Trailers")
        db.add(s1_s0)
        db.commit()
        db.refresh(s1_s0)

        t1 = Episode(
            season_id=s1_s0.id,
            episode_number=1,
            title="Official Teaser Trailer",
            description="The first look into the dark alleys of Neo-Tokyo 2099.",
            duration=120,
            language="English",
            content_group="cyber_trailer_1",
            status=ItemStatus.PUBLISHED,
        )
        db.add(t1)
        db.commit()
        db.refresh(t1)
        create_and_save_artwork(db, ArtworkType.THUMBNAIL, "Trailer 1", "#4338ca", episode_id=t1.id)

        # Season 1: Regular
        s1_s1 = Season(show_id=show1.id, season_number=1, title="Season 1: Awakening")
        db.add(s1_s1)
        db.commit()
        db.refresh(s1_s1)

        # Episode 1 with English & Hindi language variants (same content_group)
        ep1_en = Episode(
            season_id=s1_s1.id,
            episode_number=1,
            title="Genesis Protocol",
            description="Investigator Kaelen activates a deactivated android holding classified memories.",
            duration=2700,
            language="English",
            content_group="cyber_s1_ep1",
            status=ItemStatus.PUBLISHED,
        )
        db.add(ep1_en)
        db.commit()
        db.refresh(ep1_en)
        create_and_save_artwork(db, ArtworkType.THUMBNAIL, "S1E1: Genesis", "#3730a3", episode_id=ep1_en.id)

        ep1_hi = Episode(
            season_id=s1_s1.id,
            episode_number=1,
            title="Genesis Protocol (Hindi)",
            description="इन्वेस्टिगेटर कैलेन ने एक रहस्यमयी एंड्रॉइड को सक्रिय किया।",
            duration=2700,
            language="Hindi",
            content_group="cyber_s1_ep1",
            status=ItemStatus.PUBLISHED,
        )
        db.add(ep1_hi)
        db.commit()
        db.refresh(ep1_hi)
        create_and_save_artwork(db, ArtworkType.THUMBNAIL, "S1E1: Genesis (Hindi)", "#3730a3", episode_id=ep1_hi.id)

        # Episode 2
        ep2_en = Episode(
            season_id=s1_s1.id,
            episode_number=2,
            title="Ghost in the Circuit",
            description="A rogue mainframe hacks into the city power grid, sparking a digital manhunt.",
            duration=2850,
            language="English",
            content_group="cyber_s1_ep2",
            status=ItemStatus.PUBLISHED,
        )
        db.add(ep2_en)
        db.commit()
        db.refresh(ep2_en)
        create_and_save_artwork(db, ArtworkType.THUMBNAIL, "S1E2: Ghost", "#312e81", episode_id=ep2_en.id)

        # SHOW 2: Realm of the Dragon (Fantasy, Peblo Originals)
        show2 = Show(
            title="Realm of the Dragon",
            synopsis="Ancient kingdoms collide in an epic struggle for the throne as forgotten magical beasts awaken across the frozen northern territories.",
            section="Peblo Originals",
            category="Fantasy",
            status=ItemStatus.PUBLISHED,
        )
        db.add(show2)
        db.commit()
        db.refresh(show2)

        create_and_save_artwork(db, ArtworkType.POSTER, "REALM OF THE DRAGON", "#701a75", show_id=show2.id)
        create_and_save_artwork(db, ArtworkType.BANNER, "REALM OF THE DRAGON - BANNER", "#86198f", show_id=show2.id)

        s2_s1 = Season(show_id=show2.id, season_number=1, title="Season 1: Fire & Frost")
        db.add(s2_s1)
        db.commit()
        db.refresh(s2_s1)

        s2_ep1 = Episode(
            season_id=s2_s1.id,
            episode_number=1,
            title="The Dragon's Ascent",
            description="Princess Valeria discovers an intact dragon egg hidden within the volcanic caves.",
            duration=3300,
            language="English",
            content_group="dragon_s1_ep1",
            status=ItemStatus.PUBLISHED,
        )
        db.add(s2_ep1)
        db.commit()
        db.refresh(s2_ep1)
        create_and_save_artwork(db, ArtworkType.THUMBNAIL, "S1E1: Dragon Ascent", "#a21caf", episode_id=s2_ep1.id)

        s2_ep2 = Episode(
            season_id=s2_s1.id,
            episode_number=2,
            title="Crown of Embers",
            description="The Northern High Lords refuse allegiance, igniting a war of shadows.",
            duration=3100,
            language="English",
            content_group="dragon_s1_ep2",
            status=ItemStatus.PUBLISHED,
        )
        db.add(s2_ep2)
        db.commit()
        db.refresh(s2_ep2)
        create_and_save_artwork(db, ArtworkType.THUMBNAIL, "S1E2: Crown Embers", "#86198f", episode_id=s2_ep2.id)

        # SHOW 3: Little Forest Explorers (Kids, Animation)
        show3 = Show(
            title="Little Forest Explorers",
            synopsis="Join Pip the squirrel and Oliver the owl on fun-filled woodland adventures learning friendship, teamwork, and nature facts.",
            section="Kids & Family",
            category="Animation",
            status=ItemStatus.PUBLISHED,
        )
        db.add(show3)
        db.commit()
        db.refresh(show3)

        create_and_save_artwork(db, ArtworkType.POSTER, "FOREST EXPLORERS", "#064e3b", show_id=show3.id)
        create_and_save_artwork(db, ArtworkType.BANNER, "FOREST EXPLORERS - BANNER", "#065f46", show_id=show3.id)

        s3_s1 = Season(show_id=show3.id, season_number=1, title="Season 1: Autumn Mysteries")
        db.add(s3_s1)
        db.commit()
        db.refresh(s3_s1)

        s3_ep1_en = Episode(
            season_id=s3_s1.id,
            episode_number=1,
            title="The Great Acorn Hunt",
            description="Pip misplaces his golden acorn collection right before the winter festival.",
            duration=650,
            language="English",
            content_group="forest_s1_ep1",
            status=ItemStatus.PUBLISHED,
        )
        db.add(s3_ep1_en)
        db.commit()
        db.refresh(s3_ep1_en)
        create_and_save_artwork(db, ArtworkType.THUMBNAIL, "Acorn Hunt", "#047857", episode_id=s3_ep1_en.id)

        s3_ep1_es = Episode(
            season_id=s3_s1.id,
            episode_number=1,
            title="La Gran Búsqueda de Bellotas",
            description="Pip extravía su colección de bellotas doradas antes del festival de invierno.",
            duration=650,
            language="Spanish",
            content_group="forest_s1_ep1",
            status=ItemStatus.PUBLISHED,
        )
        db.add(s3_ep1_es)
        db.commit()
        db.refresh(s3_ep1_es)
        create_and_save_artwork(db, ArtworkType.THUMBNAIL, "Bellotas", "#047857", episode_id=s3_ep1_es.id)

        # SHOW 4: Draft Show (To test Draft status & CMS filtering)
        show4 = Show(
            title="Shadow Syndicate (Upcoming)",
            synopsis="A gritty noir detective investigation in progress. Under production.",
            section="Crime Thrillers",
            category="Drama",
            status=ItemStatus.DRAFT,
        )
        db.add(show4)
        db.commit()
        db.refresh(show4)
        create_and_save_artwork(db, ArtworkType.POSTER, "SHADOW SYNDICATE", "#1c1917", show_id=show4.id)

        print("Seeding completed successfully!")

        # Perform initial atomic publish
        print("Publishing initial catalogue...")
        publish_catalog_atomic(db=db, triggered_by="admin@example.com")
        print("Catalogue generated and published atomically!")

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
