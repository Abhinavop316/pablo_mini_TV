import pytest
from app.models.artwork import ArtworkType
from app.services.artwork_validator import validate_artwork_image
from tests.conftest import create_test_image


def test_valid_poster_validation():
    img_bytes = create_test_image(600, 900)
    w, h, ratio = validate_artwork_image(img_bytes, ArtworkType.POSTER)
    assert w == 600
    assert h == 900
    assert abs(ratio - (2 / 3)) < 0.05


def test_invalid_poster_aspect_ratio():
    img_bytes = create_test_image(1280, 720)  # 16:9 instead of 2:3
    with pytest.raises(Exception) as exc_info:
        validate_artwork_image(img_bytes, ArtworkType.POSTER)
    assert "INVALID_ARTWORK_DIMENSIONS" in str(exc_info.value.detail)


def test_poster_dimensions_too_small():
    img_bytes = create_test_image(100, 150)
    with pytest.raises(Exception) as exc_info:
        validate_artwork_image(img_bytes, ArtworkType.POSTER)
    assert "IMAGE_TOO_SMALL" in str(exc_info.value.detail)


def test_file_exceeds_max_size():
    # 250 KB dummy image
    img_bytes = b"0" * (250 * 1024)
    with pytest.raises(Exception) as exc_info:
        validate_artwork_image(img_bytes, ArtworkType.POSTER)
    assert "FILE_TOO_LARGE" in str(exc_info.value.detail)


def test_valid_banner_validation():
    img_bytes = create_test_image(1280, 720)
    w, h, ratio = validate_artwork_image(img_bytes, ArtworkType.BANNER)
    assert w == 1280
    assert h == 720
    assert abs(ratio - (16 / 9)) < 0.05


def test_valid_thumbnail_validation():
    img_bytes = create_test_image(640, 360)
    w, h, ratio = validate_artwork_image(img_bytes, ArtworkType.THUMBNAIL)
    assert w == 640
    assert h == 360
    assert abs(ratio - (16 / 9)) < 0.05


def test_upload_artwork_endpoint_validate_and_save(client, editor_token, db_session):
    from app.models.show import Show
    show = db_session.query(Show).first()
    assert show is not None

    img_bytes = create_test_image(600, 900)
    files = {"file": ("poster.jpg", img_bytes, "image/jpeg")}
    data = {"artwork_type": "POSTER", "show_id": show.id}

    response = client.post(
        "/admin/artwork/validate-and-save",
        files=files,
        data=data,
        headers={"Authorization": f"Bearer {editor_token}"},
    )
    assert response.status_code == 201
    res_data = response.json()
    assert res_data["type"] == "POSTER"
    assert res_data["show_id"] == show.id


