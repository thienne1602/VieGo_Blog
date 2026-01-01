# Models package initialization
from flask_sqlalchemy import SQLAlchemy

# Initialize SQLAlchemy instance
db = SQLAlchemy()

def init_db(app):
    """Initialize database with Flask app"""
    db.init_app(app)
    return db

# Import models so they are registered with SQLAlchemy when package is imported
# These are also re-exported for use by other modules
from .user import User  # noqa: F401
from .user_settings import UserSettings  # noqa: F401
from .user_preferences import UserPreferences  # noqa: F401
from .tour import Tour  # noqa: F401
from .booking import Booking  # noqa: F401
from .booking_participant import BookingParticipant  # noqa: F401
from .tour_assignment import TourAssignment  # noqa: F401
from .tour_progress import TourProgress  # noqa: F401
from .seller_tour_guide import SellerTourGuide  # noqa: F401
from .tour_itinerary import TourItineraryTemplate, TourItineraryDay, ItineraryCheckpoint  # noqa: F401
from .booking_itinerary import BookingItineraryDay, CheckpointCheckin  # noqa: F401
from .tour_member_location import TourMemberLocation, TourLocationHistory, TourGeofence  # noqa: F401
from .chat import Chat  # noqa: F401
from .notification import Notification  # noqa: F401
from .friendship import FriendRequest  # noqa: F401
from .group_chat import GroupChat, GroupMember  # noqa: F401
from .banned_keyword import BannedKeyword  # noqa: F401
from .contact import Contact  # noqa: F401
# AI Analytics models
from .user_behavior import UserBehavior, UserInterestProfile, PromotionalCampaign, EmailLog  # noqa: F401
from .post import Post  # noqa: F401
from .comment import Comment  # noqa: F401