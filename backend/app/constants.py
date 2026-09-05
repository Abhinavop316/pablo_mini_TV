"""
Peblo mini TV Taxonomies and Specifications
"""
from typing import Any, Dict, List

# Official Sections specification
SECTIONS: List[str] = [
    "featured",
    "series",
    "minisodes",
    "songs",
]

# Official Categories specification
CATEGORIES: List[str] = [
    "adventure",
    "folk",
    "friendship",
    "india",
    "language",
    "learning",
    "maths",
    "music",
    "nature",
    "reading",
    "science",
    "singalong",
    "stories",
    "travel",
    "values",
]

# Supported Languages specification
LANGUAGES: List[str] = [
    "en",
    "hi",
]

LANGUAGE_NAMES: Dict[str, str] = {
    "en": "English",
    "hi": "Hindi",
}

# Artwork Specifications
ARTWORK_SPECS: Dict[str, Any] = {
    "poster": {
        "aspect": "2:3",
        "target_aspect": 2 / 3,
        "target_px": [600, 900],
        "approx_dims": "600x900",
        "min_width": 300,
        "min_height": 450,
        "max_kb": 200,
        "tolerance": 0.12,
    },
    "banner": {
        "aspect": "16:9",
        "target_aspect": 16 / 9,
        "target_px": [1280, 720],
        "approx_dims": "1280x720",
        "min_width": 640,
        "min_height": 360,
        "max_kb": 200,
        "tolerance": 0.10,
    },
    "thumbnail": {
        "aspect": "16:9",
        "target_aspect": 16 / 9,
        "target_px": [640, 360],
        "approx_dims": "640x360",
        "min_width": 320,
        "min_height": 180,
        "max_kb": 200,
        "tolerance": 0.10,
    },
}

# Conventions
CONVENTIONS: Dict[str, str] = {
    "season_zero": "Season 0 is reserved for trailers",
    "content_group": "episodes sharing a content_group are language variants of the same episode and must collapse into ONE catalogue entry",
}
