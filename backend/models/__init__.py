# Models package initialization
from flask_sqlalchemy import SQLAlchemy

# Initialize SQLAlchemy instance
db = SQLAlchemy()

def init_db(app):
    """Initialize database with Flask app"""
    db.init_app(app)
    return db

# Import models so they are registered with SQLAlchemy when package is imported
try:
    from .user import User  # noqa: F401
    from .tour import Tour  # noqa: F401
    from .booking import Booking  # noqa: F401
except Exception:
    pass