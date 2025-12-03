# -*- coding: utf-8 -*-
"""Refresh tour descriptions, itineraries and policies using the generator."""

import argparse
import os
import sys
from typing import Any, Dict, List

# Ensure backend package is importable
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from dotenv import load_dotenv
load_dotenv()

from main import app
from models import db
from models.tour import Tour
from utils.tour_content_generator import build_tour_content


def _has_detailed_itinerary(tour: Tour) -> bool:
    try:
        itinerary = tour.get_itinerary()
        if isinstance(itinerary, list) and itinerary:
            sample = itinerary[0]
            return isinstance(sample, dict) and {
                "day",
                "title",
                "activities",
                "meals",
            }.issubset(sample.keys())
        return False
    except Exception:
        return False


def _apply_content(tour: Tour, content: Dict[str, Any]) -> List[str]:
    changed: List[str] = []

    if tour.description != content["description"]:
        tour.description = content["description"]
        changed.append("description")

    existing_itinerary = tour.get_itinerary()
    if existing_itinerary != content["itinerary"]:
        tour.set_itinerary(content["itinerary"])
        changed.append("itinerary")

    if tour.get_inclusions() != content["inclusions"]:
        tour.set_inclusions(content["inclusions"])
        changed.append("inclusions")

    if tour.get_exclusions() != content["exclusions"]:
        tour.set_exclusions(content["exclusions"])
        changed.append("exclusions")

    if (tour.cancellation_policy or "").strip() != content["policy"]:
        tour.cancellation_policy = content["policy"]
        changed.append("cancellation_policy")

    return changed


def refresh_tours(tour_id: int | None, only_missing: bool, dry_run: bool) -> None:
    with app.app_context():
        query = Tour.query
        if tour_id:
            query = query.filter_by(id=tour_id)
        tours = query.all()

        total = len(tours)
        updated = 0
        skipped = 0

        for tour in tours:
            if only_missing and _has_detailed_itinerary(tour):
                skipped += 1
                continue

            content = build_tour_content(
                location_name=tour.starting_location or tour.title,
                duration_days=tour.duration_days or 1,
                category=tour.category,
                starting_point=tour.starting_location or tour.title,
            )
            changed_fields = _apply_content(tour, content)
            if changed_fields:
                updated += 1
                print(
                    f"[UPDATED] Tour #{tour.id} - {tour.title}: {', '.join(changed_fields)}"
                )
            else:
                skipped += 1

        if dry_run:
            db.session.rollback()
            print(
                f"\n✨ Dry run complete. {updated} / {total} tours would be updated, {skipped} skipped."
            )
        else:
            db.session.commit()
            print(
                f"\n✅ Updated {updated} / {total} tours. {skipped} tours skipped (already up-to-date)."
            )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Regenerate detailed content for VieGo tours"
    )
    parser.add_argument("--tour-id", type=int, help="Only update the specified tour ID")
    parser.add_argument(
        "--only-missing",
        action="store_true",
        help="Skip tours that already have the new detailed itinerary format",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview changes without committing them to the database",
    )

    args = parser.parse_args()
    refresh_tours(args.tour_id, args.only_missing, args.dry_run)
