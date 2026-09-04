from typing import Dict, List, Tuple
from sqlalchemy.orm import Session
from app.models.artwork import Artwork, ArtworkType
from app.models.episode import Episode
from app.models.season import Season
from app.models.show import ItemStatus, Show
from app.schemas.validation import ValidationErrorItem, ValidationReportResponse, ValidationWarningItem


def generate_validation_report(db: Session) -> ValidationReportResponse:
    errors: List[ValidationErrorItem] = []
    warnings: List[ValidationWarningItem] = []

    # 1. Fetch all published shows
    published_shows = db.query(Show).filter(Show.status == ItemStatus.PUBLISHED).all()

    for show in published_shows:
        # Check: Published show must have a section
        if not show.section or not show.section.strip():
            errors.append(
                ValidationErrorItem(
                    entity_type="show",
                    entity_id=show.id,
                    title=show.title,
                    reason=f"Published show '{show.title}' is missing a section.",
                    show_id=show.id,
                    show_title=show.title,
                )
            )

        # Check: Published show should have a Poster artwork
        has_poster = any(art.type == ArtworkType.POSTER for art in show.artwork)
        if not has_poster:
            errors.append(
                ValidationErrorItem(
                    entity_type="show",
                    entity_id=show.id,
                    title=show.title,
                    reason=f"Published show '{show.title}' is missing a Poster image.",
                    show_id=show.id,
                    show_title=show.title,
                )
            )

        # Check: Published show should have a Banner artwork (warning if missing)
        has_banner = any(art.type == ArtworkType.BANNER for art in show.artwork)
        if not has_banner:
            warnings.append(
                ValidationWarningItem(
                    entity_type="show",
                    entity_id=show.id,
                    title=show.title,
                    reason=f"Show '{show.title}' has no Banner image. A default banner will be used if featured.",
                )
            )

    # 2. Check all published episodes
    published_episodes = (
        db.query(Episode)
        .join(Season, Episode.season_id == Season.id)
        .join(Show, Season.show_id == Show.id)
        .filter(Episode.status == ItemStatus.PUBLISHED)
        .all()
    )

    for ep in published_episodes:
        show_obj = ep.season.show if ep.season else None
        show_id = show_obj.id if show_obj else None
        show_title = show_obj.title if show_obj else ""

        # Check: Published episode must have duration > 0
        if ep.duration is None or ep.duration <= 0:
            errors.append(
                ValidationErrorItem(
                    entity_type="episode",
                    entity_id=ep.id,
                    title=ep.title,
                    reason=f"Published episode '{ep.title}' is missing a valid duration.",
                    show_id=show_id,
                    show_title=show_title,
                )
            )

        # Check: Published episode must have thumbnail artwork
        has_thumbnail = any(art.type == ArtworkType.THUMBNAIL for art in ep.artwork)
        if not has_thumbnail:
            errors.append(
                ValidationErrorItem(
                    entity_type="episode",
                    entity_id=ep.id,
                    title=ep.title,
                    reason=f"Published episode '{ep.title}' is missing thumbnail artwork.",
                    show_id=show_id,
                    show_title=show_title,
                )
            )

    # 3. Check for any duplicate (content_group, language) combinations among published episodes
    seen_groups: Dict[Tuple[str, str], List[Episode]] = {}
    for ep in published_episodes:
        key = (ep.content_group.strip().lower(), ep.language.strip().lower())
        if key not in seen_groups:
            seen_groups[key] = []
        seen_groups[key].append(ep)

    for (cgroup, lang), eps in seen_groups.items():
        if len(eps) > 1:
            for duplicate in eps:
                show_obj = duplicate.season.show if duplicate.season else None
                errors.append(
                    ValidationErrorItem(
                        entity_type="episode",
                        entity_id=duplicate.id,
                        title=duplicate.title,
                        reason=f"Duplicate content group '{cgroup}' for language '{lang}'. Found on multiple episodes.",
                        show_id=show_obj.id if show_obj else None,
                        show_title=show_obj.title if show_obj else "",
                    )
                )

    can_publish = len(errors) == 0

    return ValidationReportResponse(
        can_publish=can_publish,
        errors_count=len(errors),
        warnings_count=len(warnings),
        errors=errors,
        warnings=warnings,
    )
