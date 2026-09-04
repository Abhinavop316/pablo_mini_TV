import json
from pathlib import Path
from app.config import settings
from app.models.publish_run import PublishStatus
from app.services.publishing_service import build_catalogue_data, publish_catalog_atomic


def test_language_variants_grouped_into_single_entry(db_session):
    data = build_catalogue_data(db_session)
    # Find cyber show
    cyber_show = next((s for s in data["all_shows"] if "Cyber Odyssey" in s["title"]), None)
    assert cyber_show is not None

    # Season 1 should have 2 grouped episodes (Genesis with 2 languages, Ghost with 1)
    s1 = next((s for s in cyber_show["seasons"] if s["season_number"] == 1), None)
    assert s1 is not None
    assert len(s1["episodes"]) == 2

    # Episode 1 should contain both English and Hindi
    ep1 = s1["episodes"][0]
    assert "English" in ep1["languages"]
    assert "Hindi" in ep1["languages"]


def test_season_0_excluded_from_normal_seasons(db_session):
    data = build_catalogue_data(db_session)
    cyber_show = next((s for s in data["all_shows"] if "Cyber Odyssey" in s["title"]), None)
    assert cyber_show is not None

    season_numbers = [s["season_number"] for s in cyber_show["seasons"]]
    assert 0 not in season_numbers
    assert len(cyber_show["trailers"]) > 0


def test_atomic_publishing_file_generation(db_session):
    run = publish_catalog_atomic(db_session, triggered_by="admin@example.com")
    assert run.status == PublishStatus.SUCCESS

    cat_file = Path(settings.CATALOGUE_PATH)
    assert cat_file.exists()

    with open(cat_file, "r", encoding="utf-8") as f:
        content = json.load(f)
        assert "published_at" in content
        assert "sections" in content
        assert len(content["all_shows"]) > 0
