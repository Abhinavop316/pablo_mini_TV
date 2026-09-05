import uuid
from app.models.artwork import Artwork, ArtworkType
from app.models.episode import Episode
from app.models.season import Season
from app.models.show import ItemStatus, Show


def test_batch_delete_shows_success(client, editor_token, db_session):
    # Create 3 shows
    show1 = Show(title=f"Batch Show 1 {uuid.uuid4().hex[:6]}", section="Drama", category="Drama", status=ItemStatus.DRAFT)
    show2 = Show(title=f"Batch Show 2 {uuid.uuid4().hex[:6]}", section="Drama", category="Drama", status=ItemStatus.DRAFT)
    show3 = Show(title=f"Batch Show 3 {uuid.uuid4().hex[:6]}", section="Drama", category="Drama", status=ItemStatus.DRAFT)
    db_session.add_all([show1, show2, show3])
    db_session.commit()

    # Batch delete show1 and show2
    resp = client.post(
        "/admin/shows/batch-delete",
        headers={"Authorization": f"Bearer {editor_token}"},
        json={"ids": [show1.id, show2.id]},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["deleted_count"] == 2
    assert show1.id in data["deleted_ids"]
    assert show2.id in data["deleted_ids"]

    # Verify database state
    remaining = db_session.query(Show).filter(Show.id.in_([show1.id, show2.id, show3.id])).all()
    assert len(remaining) == 1
    assert remaining[0].id == show3.id


def test_batch_delete_shows_empty_list_rejected(client, editor_token):
    resp = client.post(
        "/admin/shows/batch-delete",
        headers={"Authorization": f"Bearer {editor_token}"},
        json={"ids": []},
    )
    assert resp.status_code == 422  # validation error from pydantic Field(min_length=1)


def test_batch_delete_shows_nonexistent_ids(client, editor_token):
    resp = client.post(
        "/admin/shows/batch-delete",
        headers={"Authorization": f"Bearer {editor_token}"},
        json={"ids": [999991, 999992]},
    )
    assert resp.status_code == 404
    assert resp.json()["detail"]["code"] == "SHOWS_NOT_FOUND"
