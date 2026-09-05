from datetime import datetime, timezone
import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.config import settings
from app.models.artwork import ArtworkType
from app.models.episode import Episode
from app.models.publish_run import PublishRun, PublishStatus
from app.models.season import Season
from app.models.show import ItemStatus, Show
from app.services.validation_service import generate_validation_report


def build_catalogue_data(db: Session) -> Dict[str, Any]:
    """
    Builds the deterministic, language-grouped catalogue JSON structure.
    Only published shows and published episodes are included.
    Season 0 is treated as Trailer and excluded from regular season lists.
    """
    # 1. Fetch published shows ordered deterministically by section, title, id
    shows = (
        db.query(Show)
        .filter(Show.status == ItemStatus.PUBLISHED)
        .order_by(Show.section.asc(), Show.title.asc(), Show.id.asc())
        .all()
    )

    all_catalog_shows = []
    sections_map: Dict[str, List[Dict[str, Any]]] = {}

    for show in shows:
        # Artwork
        poster_url = None
        banner_url = None
        for art in show.artwork:
            if art.type == ArtworkType.POSTER and not poster_url:
                poster_url = art.url
            elif art.type == ArtworkType.BANNER and not banner_url:
                banner_url = art.url

        trailers = []
        regular_seasons = []
        all_show_languages = set()
        total_episodes_count = 0

        # Iterate seasons in order
        for season in show.seasons:
            # Filter only published episodes
            published_eps = [
                ep for ep in season.episodes if ep.status == ItemStatus.PUBLISHED
            ]
            if not published_eps:
                continue

            # Group episodes by content_group
            grouped_eps_map: Dict[str, Dict[str, Any]] = {}
            for ep in published_eps:
                cgroup = ep.content_group.strip()
                all_show_languages.add(ep.language)

                # Thumbnail
                thumb_url = None
                for art in ep.artwork:
                    if art.type == ArtworkType.THUMBNAIL:
                        thumb_url = art.url
                        break

                if cgroup not in grouped_eps_map:
                    grouped_eps_map[cgroup] = {
                        "id": ep.id,
                        "content_group": cgroup,
                        "episode_number": ep.episode_number,
                        "title": ep.title,
                        "description": ep.description or "",
                        "duration": ep.duration,
                        "languages": [ep.language],
                        "artwork": {
                            "thumbnail": thumb_url,
                        },
                        "thumbnail_url": thumb_url,
                    }
                else:
                    if ep.language not in grouped_eps_map[cgroup]["languages"]:
                        grouped_eps_map[cgroup]["languages"].append(ep.language)
                        grouped_eps_map[cgroup]["languages"].sort()
                    # Keep thumbnail if missing
                    if not grouped_eps_map[cgroup]["thumbnail_url"] and thumb_url:
                        grouped_eps_map[cgroup]["thumbnail_url"] = thumb_url
                        if "artwork" not in grouped_eps_map[cgroup] or not grouped_eps_map[cgroup]["artwork"]:
                            grouped_eps_map[cgroup]["artwork"] = {}
                        grouped_eps_map[cgroup]["artwork"]["thumbnail"] = thumb_url

            collapsed_episodes = sorted(
                list(grouped_eps_map.values()),
                key=lambda x: (x["episode_number"], x["title"]),
            )

            if season.season_number == 0:
                # Season 0 is Trailer
                for t in collapsed_episodes:
                    trailers.append(
                        {
                            "id": t["id"],
                            "title": t["title"],
                            "description": t["description"],
                            "duration": t["duration"],
                            "languages": t["languages"],
                            "artwork": {
                                "thumbnail": t.get("thumbnail_url"),
                            },
                            "thumbnail_url": t.get("thumbnail_url"),
                        }
                    )
            else:
                total_episodes_count += len(collapsed_episodes)
                regular_seasons.append(
                    {
                        "id": season.id,
                        "season_number": season.season_number,
                        "title": season.title,
                        "episodes": collapsed_episodes,
                    }
                )

        catalog_show = {
            "id": show.id,
            "title": show.title,
            "synopsis": show.synopsis or "",
            "section": show.section or "General",
            "category": show.category or "General",
            "artwork": {
                "poster": poster_url,
                "banner": banner_url,
            },
            "poster_url": poster_url,
            "banner_url": banner_url,
            "trailers": trailers,
            "seasons": regular_seasons,
            "available_languages": sorted(list(all_show_languages)),
            "total_episodes": total_episodes_count,
        }

        all_catalog_shows.append(catalog_show)

        section_name = show.section or "Featured"
        if section_name not in sections_map:
            sections_map[section_name] = []
        sections_map[section_name].append(catalog_show)

    sections_list = [
        {"name": sec_name, "shows": shows_list}
        for sec_name, shows_list in sorted(sections_map.items())
    ]

    # Select featured show with priority for valid banner
    featured_show = None
    for s in all_catalog_shows:
        if (s.get("section") or "").lower() == "featured" and s.get("artwork", {}).get("banner"):
            featured_show = s
            break
    if not featured_show:
        for s in all_catalog_shows:
            if s.get("artwork", {}).get("banner"):
                featured_show = s
                break
    if not featured_show and all_catalog_shows:
        featured_show = all_catalog_shows[0]

    return {
        "published_at": datetime.now(timezone.utc).isoformat(),
        "sections": sections_list,
        "available_sections": [
            "featured",
            "series",
            "minisodes",
            "songs",
        ],
        "categories": [
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
        ],
        "languages": [
            "en",
            "hi",
        ],
        "featured_show": featured_show,
        "all_shows": all_catalog_shows,
    }


def publish_catalog_atomic(db: Session, triggered_by: str) -> PublishRun:
    """
    Validates, generates, and atomically writes the live catalogue.json file.
    Logs run in publish_runs table.
    """
    # 1. Create running publish record
    publish_run = PublishRun(
        triggered_by=triggered_by,
        status=PublishStatus.RUNNING,
        started_at=datetime.now(timezone.utc),
    )
    db.add(publish_run)
    db.commit()
    db.refresh(publish_run)

    try:
        # 2. Validation check
        validation_report = generate_validation_report(db)
        if not validation_report.can_publish:
            error_msg = f"Catalogue publication aborted: {validation_report.errors_count} blocking validation errors found."
            publish_run.status = PublishStatus.FAILED
            publish_run.completed_at = datetime.now(timezone.utc)
            publish_run.error_message = error_msg
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "PUBLISH_VALIDATION_FAILED",
                    "message": error_msg,
                    "errors": [err.model_dump() for err in validation_report.errors],
                },
            )

        # 3. Build catalogue data
        catalog_dict = build_catalogue_data(db)
        shows_count = len(catalog_dict.get("all_shows", []))
        episodes_count = sum(s.get("total_episodes", 0) for s in catalog_dict.get("all_shows", []))

        # 4. Atomic file write: write to temp file then replace atomically
        catalog_path = Path(settings.CATALOGUE_PATH)
        catalog_path.parent.mkdir(parents=True, exist_ok=True)
        temp_path = catalog_path.with_suffix(".json.tmp")

        json_bytes = json.dumps(catalog_dict, indent=2, ensure_ascii=False).encode("utf-8")
        with open(temp_path, "wb") as f:
            f.write(json_bytes)
            f.flush()
            os.fsync(f.fileno())

        # Atomic replace to primary CATALOGUE_PATH
        os.replace(temp_path, catalog_path)

        # Also sync to workspace root and backend storage locations
        storage_targets = [
            Path(__file__).resolve().parents[3] / "storage" / "catalogue.json",  # workspace root
            Path(__file__).resolve().parents[2] / "storage" / "catalogue.json",  # backend root
            Path(__file__).resolve().parents[1] / "storage" / "catalogue.json",  # app dir
        ]
        for target in storage_targets:
            try:
                target.parent.mkdir(parents=True, exist_ok=True)
                tmp = target.with_suffix(".json.tmp")
                with open(tmp, "wb") as rf:
                    rf.write(json_bytes)
                    rf.flush()
                    os.fsync(rf.fileno())
                os.replace(tmp, target)
            except Exception:
                pass

        # 5. Complete publish run
        publish_run.status = PublishStatus.SUCCESS
        publish_run.completed_at = datetime.now(timezone.utc)
        publish_run.shows_count = shows_count
        publish_run.episodes_count = episodes_count
        publish_run.catalogue_size = len(json_bytes)
        publish_run.error_message = None
        db.commit()
        db.refresh(publish_run)

        return publish_run

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        publish_run.status = PublishStatus.FAILED
        publish_run.completed_at = datetime.now(timezone.utc)
        publish_run.error_message = str(e)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "PUBLISH_ERROR", "message": f"Publishing failed: {str(e)}"},
        )


def read_published_catalogue() -> Dict[str, Any]:
    """
    Reads the live published catalogue.json file.
    If no catalogue has been published yet, returns an empty structure.
    """
    catalog_path = Path(settings.CATALOGUE_PATH)
    if not catalog_path.exists():
        return {
            "published_at": "",
            "sections": [],
            "featured_show": None,
            "all_shows": [],
        }

    try:
        with open(catalog_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {
            "published_at": "",
            "sections": [],
            "featured_show": None,
            "all_shows": [],
        }
