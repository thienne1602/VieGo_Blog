"""Helpers to resolve which users should receive booking/tour notifications."""

from __future__ import annotations

from typing import Iterable, Set

from models.booking import Booking
from models.booking_participant import BookingParticipant
from models.user import User


def get_user_ids_for_booking(booking_id: int) -> Set[int]:
    """Users to notify for a booking: booker + participant accounts (by participant email)."""
    user_ids: Set[int] = set()

    booking = Booking.query.get(booking_id)
    if not booking:
        return user_ids

    if booking.user_id:
        user_ids.add(int(booking.user_id))

    participants = BookingParticipant.query.filter_by(booking_id=booking_id).all()
    emails = {p.email.strip().lower() for p in participants if p.email and isinstance(p.email, str) and p.email.strip()}

    if emails:
        users = User.query.filter(User.email.in_(list(emails))).all()
        for u in users:
            if u and u.id:
                user_ids.add(int(u.id))

    return user_ids


def get_user_ids_for_tour_bookings(tour_id: int, statuses: Iterable[str] = ("confirmed",)) -> Set[int]:
    """Users to notify for all bookings of a tour (default: confirmed)."""
    user_ids: Set[int] = set()

    bookings = Booking.query.filter(Booking.tour_id == tour_id, Booking.status.in_(list(statuses))).all()
    for b in bookings:
        user_ids |= get_user_ids_for_booking(int(b.id))

    return user_ids
