import io
from typing import Tuple
from fastapi import HTTPException, status
from PIL import Image
from app.models.artwork import ArtworkType

MAX_FILE_SIZE = 200 * 1024  # 200 KB in bytes
ALLOWED_FORMATS = {"JPEG", "JPG", "PNG", "WEBP"}

SPECS = {
    ArtworkType.POSTER: {
        "name": "Poster",
        "target_aspect": 2 / 3,
        "ratio_desc": "2:3",
        "approx_dims": "600x900",
        "min_width": 300,
        "min_height": 450,
        "tolerance": 0.12,  # aspect ratio tolerance
    },
    ArtworkType.BANNER: {
        "name": "Banner",
        "target_aspect": 16 / 9,
        "ratio_desc": "16:9",
        "approx_dims": "1280x720",
        "min_width": 640,
        "min_height": 360,
        "tolerance": 0.10,
    },
    ArtworkType.THUMBNAIL: {
        "name": "Thumbnail",
        "target_aspect": 16 / 9,
        "ratio_desc": "16:9",
        "approx_dims": "640x360",
        "min_width": 320,
        "min_height": 180,
        "tolerance": 0.10,
    },
}


def validate_artwork_image(file_bytes: bytes, artwork_type: ArtworkType) -> Tuple[int, int, float]:
    """
    Validates uploaded artwork image bytes according to business rules.
    Returns (width, height, aspect_ratio).
    Raises HTTPException with structured error code and editor-friendly message on failure.
    """
    file_size = len(file_bytes)

    # 1. Size check
    if file_size > MAX_FILE_SIZE:
        size_kb = round(file_size / 1024, 1)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "FILE_TOO_LARGE",
                "message": f"Image size ({size_kb} KB) exceeds the maximum allowed limit of 200 KB.",
            },
        )

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "EMPTY_FILE", "message": "The uploaded file is empty."},
        )

    # 2. Image decoding & format check
    try:
        image = Image.open(io.BytesIO(file_bytes))
        image.verify()
        # Re-open because verify() closes or alters image state
        image = Image.open(io.BytesIO(file_bytes))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_IMAGE_FORMAT",
                "message": "The uploaded file is not a valid image. Please upload a JPG, PNG, or WEBP file.",
            },
        )

    image_format = (image.format or "").upper()
    if image_format not in ALLOWED_FORMATS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "UNSUPPORTED_IMAGE_TYPE",
                "message": f"Image format '{image_format}' is not supported. Please upload a JPG, PNG, or WEBP file.",
            },
        )

    width, height = image.size
    if width <= 0 or height <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_DIMENSIONS", "message": "Image dimensions are invalid."},
        )

    spec = SPECS.get(artwork_type)
    if not spec:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_ARTWORK_TYPE", "message": f"Unknown artwork type '{artwork_type}'."},
        )

    aspect_ratio = width / height
    target_aspect = spec["target_aspect"]
    tolerance = spec["tolerance"]

    # 3. Minimum resolution check
    if width < spec["min_width"] or height < spec["min_height"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "IMAGE_TOO_SMALL",
                "message": f"{spec['name']} resolution ({width}x{height}) is too low. Recommended dimensions are close to {spec['approx_dims']}.",
            },
        )

    # 4. Aspect ratio validation
    if abs(aspect_ratio - target_aspect) > tolerance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_ARTWORK_DIMENSIONS",
                "message": f"This image aspect ratio ({round(aspect_ratio, 2)}) does not match the required {spec['ratio_desc']} ratio. Please upload an image close to {spec['approx_dims']}.",
            },
        )

    return width, height, aspect_ratio
