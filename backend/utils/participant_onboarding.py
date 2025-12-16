"""Participant onboarding helpers.

Creates user accounts for booking participants (when they don't exist yet)
and optionally sends an email with credentials.

Design goals:
- Idempotent: same email will never create multiple accounts.
- Safe under concurrent requests: uses a nested transaction (SAVEPOINT) when possible.
- Does not hard-fail booking flows if email delivery is not configured.
"""

from __future__ import annotations

from dataclasses import dataclass
import secrets
import string
from typing import Optional

from sqlalchemy.exc import IntegrityError

from models import db
from models.user import User


@dataclass(frozen=True)
class EnsureUserResult:
    user: Optional[User]
    created: bool
    plain_password: Optional[str]
    error: Optional[str] = None


def _generate_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def _base_username_from_email(email: str) -> str:
    local = (email.split("@", 1)[0] or "user").strip().lower()
    # Keep it simple and URL/username friendly
    safe = "".join(ch for ch in local if ch.isalnum() or ch in "._-")
    return safe[:30] if safe else "user"


def _generate_unique_username(email: str, max_attempts: int = 20) -> str:
    base = _base_username_from_email(email)
    # Try base first, then base + random suffix
    for attempt in range(max_attempts):
        if attempt == 0:
            candidate = base
        else:
            candidate = f"{base}{secrets.randbelow(10_000):04d}"

        if not User.query.filter_by(username=candidate).first():
            return candidate

    # Extremely unlikely fallback
    return f"{base}{secrets.token_hex(3)}"


def ensure_user_for_participant(email: Optional[str], full_name: Optional[str] = None) -> EnsureUserResult:
    """Ensure there's a User for the given participant email.

    Returns:
      - created=True with plain_password when a new user is created.
      - created=False when the user already exists.
      - error set if email is missing/invalid.

    Notes:
      - Uses a nested transaction to avoid rolling back outer work.
    """

    if not email or not isinstance(email, str) or not email.strip():
        return EnsureUserResult(user=None, created=False, plain_password=None, error="missing_email")

    normalized_email = email.strip().lower()

    existing = User.query.filter_by(email=normalized_email).first()
    if existing:
        return EnsureUserResult(user=existing, created=False, plain_password=None)

    plain_password = _generate_password()
    username = _generate_unique_username(normalized_email)

    new_user = User(username=username, email=normalized_email, password=plain_password)
    if full_name:
        new_user.full_name = full_name

    try:
        # Savepoint so we don't nuke the caller's transaction.
        with db.session.begin_nested():
            db.session.add(new_user)
            db.session.flush()

        # Refresh via query to ensure we return a managed instance.
        created_user = User.query.filter_by(email=normalized_email).first()
        return EnsureUserResult(user=created_user, created=True, plain_password=plain_password)

    except IntegrityError:
        # Likely a race: another request created the same email.
        db.session.rollback()
        existing2 = User.query.filter_by(email=normalized_email).first()
        if existing2:
            return EnsureUserResult(user=existing2, created=False, plain_password=None)
        return EnsureUserResult(user=None, created=False, plain_password=None, error="integrity_error")


def try_send_participant_account_email(
    recipient_email: str,
    username: str,
    plain_password: str,
    full_name: Optional[str] = None,
    seller: Optional[User] = None,
) -> tuple[bool, Optional[str]]:
    """Best-effort email sender. Never raises."""
    try:
        from utils.email import send_participant_account_created_email

        result = send_participant_account_created_email(
            recipient_email=recipient_email,
            username=username,
            password=plain_password,
            full_name=full_name,
            seller=seller,
        )

        if isinstance(result, tuple) and len(result) == 2:
            ok, err = result
            return bool(ok), err

        ok = bool(result)
        return ok, None if ok else "send_failed"
    except Exception as e:
        # Includes ImportError for missing Flask-Mail or config issues.
        return False, str(e)


def reset_user_password(user: User, length: int = 12) -> str:
    """Set a new random password for a user and return the plain password."""
    plain_password = _generate_password(length)
    user.set_password(plain_password)
    db.session.add(user)
    return plain_password
