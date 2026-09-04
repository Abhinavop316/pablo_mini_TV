import uuid
from app.models.artwork import ArtworkType
from app.models.episode import Episode
from app.models.season import Season
from app.models.show import ItemStatus, Show


def test_duplicate_content_group_and_language_rejected(client, editor_token, db_session):
    show = Show(title="Test Dup Show", section="Drama", category="Drama", status=ItemStatus.DRAFT)
    db_session.add(show)
    db_session.commit()

    season = Season(show_id=show.id, season_number=1, title="Season 1")
    db_session.add(season)
    db_session.commit()

    unique_group = f"group_{uuid.uuid4().hex[:8]}"

    # Create first episode
    resp1 = client.post(
        f"/admin/seasons/{season.id}/episodes",
        headers={"Authorization": f"Bearer {editor_token}"},
        json={
            "episode_number": 1,
            "title": "Ep 1",
            "content_group": unique_group,
            "language": "English",
            "status": "DRAFT",
        },
    )
    assert resp1.status_code == 201

    # Attempt to create duplicate (content_group, language)
    resp2 = client.post(
        f"/admin/seasons/{season.id}/episodes",
        headers={"Authorization": f"Bearer {editor_token}"},
        json={
            "episode_number": 2,
            "title": "Ep 2 Dup",
            "content_group": unique_group,
            "language": "English",
            "status": "DRAFT",
        },
    )
    assert resp2.status_code == 409
    assert resp2.json()["detail"]["code"] == "DUPLICATE_CONTENT_GROUP_LANGUAGE"


def test_published_episode_requires_duration(client, editor_token, db_session):
    show = Show(title="Test Dur Show", section="Drama", category="Drama", status=ItemStatus.DRAFT)
    db_session.add(show)
    db_session.commit()

    season = Season(show_id=show.id, season_number=1, title="Season 1")
    db_session.add(season)
    db_session.commit()

    unique_group = f"dur_{uuid.uuid4().hex[:8]}"

    # Attempt to create published episode without duration
    resp = client.post(
        f"/admin/seasons/{season.id}/episodes",
        headers={"Authorization": f"Bearer {editor_token}"},
        json={
            "episode_number": 1,
            "title": "Ep No Dur",
            "content_group": unique_group,
            "language": "English",
            "duration": None,
            "status": "PUBLISHED",
        },
    )
    assert resp.status_code == 422
