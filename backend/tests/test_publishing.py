import json
from pathlib import Path
from app.config import settings
from app.models.artwork import Artwork, ArtworkType
from app.models.episode import Episode
from app.models.publish_run import PublishStatus
from app.services.publishing_service import build_catalogue_data, publish_catalog_atomic


def test_language_variants_grouped_into_single_entry(db_session):
    data = build_catalogue_data(db_session)
    # Find Moti show
    moti_show = next((s for s in data["all_shows"] if "Moti's Many Lives" in s["title"]), None)
    assert moti_show is not None

    s1 = next((s for s in moti_show["seasons"] if s["season_number"] == 1), None)
    assert s1 is not None

    # Episode 1 should contain both English and Hindi
    ep1 = next((ep for ep in s1["episodes"] if "Lost Kite" in ep["title"]), None)
    assert ep1 is not None
    assert "en" in ep1["languages"] or "English" in ep1["languages"]
    assert "hi" in ep1["languages"] or "Hindi" in ep1["languages"]


def test_season_0_excluded_from_normal_seasons(db_session):
    data = build_catalogue_data(db_session)
    moti_show = next((s for s in data["all_shows"] if "Moti's Many Lives" in s["title"]), None)
    assert moti_show is not None

    season_numbers = [s["season_number"] for s in moti_show["seasons"]]
    assert 0 not in season_numbers
    assert len(moti_show["trailers"]) > 0


def test_atomic_publishing_file_generation(db_session):
    # Ensure any published episode without artwork is given thumbnail so publish succeeds
    missing_eps = (
        db_session.query(Episode)
        .filter(Episode.status == "PUBLISHED", ~Episode.artwork.any(Artwork.type == ArtworkType.THUMBNAIL))
        .all()
    )
    for ep in missing_eps:
        art = Artwork(
            episode_id=ep.id,
            type=ArtworkType.THUMBNAIL,
            url="/uploads/test_thumb.jpg",
            width=640,
            height=360,
            file_size=1000,
            aspect_ratio=1.778,
        )
        db_session.add(art)
    db_session.commit()

    run = publish_catalog_atomic(db_session, triggered_by="admin@example.com")
    assert run.status == PublishStatus.SUCCESS

    cat_file = Path(settings.CATALOGUE_PATH)
    assert cat_file.exists()

    with open(cat_file, "r", encoding="utf-8") as f:
        content = json.load(f)
        assert "published_at" in content
        assert "sections" in content
        assert len(content["all_shows"]) > 0

