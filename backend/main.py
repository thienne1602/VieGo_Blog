import os
import sys
from flask import Flask, jsonify, request, session, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from flask_babel import Babel
from flask_compress import Compress
from dotenv import load_dotenv
import pymysql

# Add backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Install PyMySQL as MySQLdb
pymysql.install_as_MySQLdb()

# Load environment variables
# Load backend/.env reliably even if the server is started from a different CWD.
dotenv_path = os.path.join(backend_dir, '.env')
load_dotenv(dotenv_path)
# Also load a .env from the current working directory if present.
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Disable strict slashes to prevent 308 redirects
app.url_map.strict_slashes = False

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'viego-default-secret')
# JWT configuration
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-this')
# Set token expiry to 7 days (604800 seconds)
from datetime import timedelta
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)

# Database configuration for WAMP Server
app.config['SQLALCHEMY_DATABASE_URI'] = (
    f"mysql://{os.getenv('DB_USER', 'root')}:"
    f"{os.getenv('DB_PASSWORD', '')}@"
    f"{os.getenv('DB_HOST', 'localhost')}:"
    f"{os.getenv('DB_PORT', '3306')}/"
    f"{os.getenv('DB_NAME', 'viego_blog')}"
    f"?charset=utf8mb4"
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_size': 10,
    'pool_timeout': 30,
    'pool_recycle': 3600,
    'max_overflow': 20
}

# File upload configuration
app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER', 'uploads')
app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_CONTENT_LENGTH', 16777216))

# Initialize extensions
# Initialize db through models package to avoid circular imports
import models
db = models.init_db(app)
jwt = JWTManager(app)

# Initialize email
try:
    from utils.email import init_email
    init_email(app)
    print("[OK] Email system initialized")
except Exception as e:
    print(f"[WARNING] Email system not available: {e}")
# Initialize Socket.IO
socketio = SocketIO(
    app,
    cors_allowed_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001",
                          "http://localhost:3002", "http://127.0.0.1:3002", "http://localhost:3003", "http://127.0.0.1:3003",
                          "http://localhost:3004", "http://127.0.0.1:3004", "http://localhost:3005", "http://127.0.0.1:3005",
                          "http://localhost:3006", "http://127.0.0.1:3006", "http://localhost:3007", "http://127.0.0.1:3007",
                          "http://localhost:3008", "http://127.0.0.1:3008", "http://localhost:3009", "http://127.0.0.1:3009",
                          "http://localhost:3010", "http://127.0.0.1:3010"],
    async_mode='threading',
    logger=True,
    engineio_logger=False
)
print("[OK] Socket.IO initialized")

# Initialize Socket.IO utilities for routes (must be after socketio initialization)
from utils.socket_utils import init_socket_utils
init_socket_utils(socketio)
print("[OK] Socket.IO utilities initialized")

# Configure CORS with comprehensive settings
CORS(app,
     origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001",
              "http://localhost:3002", "http://127.0.0.1:3002", "http://localhost:3003", "http://127.0.0.1:3003",
              "http://localhost:3004", "http://127.0.0.1:3004", "http://localhost:3005", "http://127.0.0.1:3005",
              "http://localhost:3006", "http://127.0.0.1:3006", "http://localhost:3007", "http://127.0.0.1:3007",
              "http://localhost:3008", "http://127.0.0.1:3008", "http://localhost:3009", "http://127.0.0.1:3009",
              "http://localhost:3010", "http://127.0.0.1:3010"],
     allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept", "Cache-Control", "Pragma", "Expires"],
     methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
     supports_credentials=True,
     max_age=3600,
     expose_headers=["Content-Type", "Authorization"],
     vary_header=True)

babel = Babel(app)

# Initialize compression
compress = Compress(app)
compress.init_app(app)

# Add performance headers middleware
@app.after_request
def add_performance_headers(response):
    # Flask-CORS will handle CORS headers automatically, but we ensure origin is set correctly
    # for cases where Flask-CORS might not have run (e.g., error responses)
    origin = request.headers.get('Origin')
    allowed_origins = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"]
    
    # Always ensure CORS headers are set correctly for allowed origins
    if origin and origin in allowed_origins:
        # Override if already set incorrectly, or set if not set
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        # Ensure Vary header is set for proper caching
        if 'Vary' not in response.headers:
            response.headers['Vary'] = 'Origin'
        elif 'Origin' not in response.headers.get('Vary', ''):
            response.headers['Vary'] = response.headers.get('Vary', '') + ', Origin'
    
    # Add cache headers for static resources
    if request.path.startswith('/uploads/'):
        response.headers['Cache-Control'] = 'public, max-age=31536000, immutable'
    elif request.path.startswith('/api/'):
        # Cache API responses for GET requests (except auth endpoints)
        if request.method == 'GET' and not request.path.startswith('/api/auth'):
            response.headers['Cache-Control'] = 'public, max-age=300'  # 5 minutes
        else:
            response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    
    # Add performance hints
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    
    return response

# Import cache utilities
try:
    from utils.cache import cache, cached_route
    print("[OK] Cache system initialized")
except ImportError:
    print("[WARNING] Cache system not available")
    cached_route = lambda ttl=300: lambda f: f

# Language configuration
app.config['LANGUAGES'] = {
    'vi': 'Tiếng Việt',
    'en': 'English', 
    'fr': 'Français',
    'zh': '中文'
}

# Locale selector function - will be configured later
def get_locale():
    # 1. Check if language is specified in request args  
    if request and request.args.get('lang'):
        return request.args.get('lang')
    # 2. Check Accept-Language header
    if request and hasattr(request, 'accept_languages'):
        return request.accept_languages.best_match(app.config['LANGUAGES'].keys()) or 'vi'
    return 'vi'

# Import models after db initialization
# Import models after db initialization
try:
    from models.user import User
    from models.post import Post
    from models.location import Location
    from models.comment import Comment
    print("[OK] Models imported successfully")
except ImportError as e:
    print(f"[WARNING] Some models not found: {e}")
    # Create basic models if files don't exist
    pass

# Import routes (only existing ones for now)
try:
    from routes.auth import auth_bp
    from routes.posts import posts_bp
    from routes.test import test_bp
    from routes.admin import admin_bp
    from routes.tours import tours_bp
    from routes.seller import seller_bp
    from routes.bookings import bookings_bp
    from routes.booking_participants import booking_participants_bp
    from routes.tour_assignments import tour_assignments_bp
    from routes.tour_progress import tour_progress_bp
    from routes.itinerary import itinerary_bp  # NEW: tour itinerary with check-ins
    from routes.maps import maps_bp
    from routes.nfts import nfts_bp
    from routes.comments import comments_bp
    from routes.social import social_bp
    from routes.upload import upload_bp
    from routes.locations import locations_bp
    from routes.users import users_bp
    from routes.stories import stories_bp
    from routes.notifications import notifications_bp
    from routes.chat import chat_bp
    from routes.moderator import moderator_bp
    from routes.contact import contact_bp
    from routes.tour_location import tour_location_bp  # NEW: realtime location tracking
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(posts_bp, url_prefix='/api/posts')
    app.register_blueprint(test_bp, url_prefix='/api/test')
    app.register_blueprint(admin_bp)  # admin_bp already has /api/admin prefix
    app.register_blueprint(tours_bp)  # tours_bp already has /api/tours prefix
    app.register_blueprint(seller_bp)  # seller_bp has /api/seller prefix
    app.register_blueprint(bookings_bp)  # bookings_bp already has /api/bookings prefix
    app.register_blueprint(booking_participants_bp)  # NEW: booking participants routes
    app.register_blueprint(tour_assignments_bp)  # NEW: tour assignments routes
    app.register_blueprint(tour_progress_bp)  # NEW: tour progress routes
    app.register_blueprint(itinerary_bp)  # NEW: itinerary with check-ins
    app.register_blueprint(maps_bp)   # maps_bp already has /api/maps prefix
    app.register_blueprint(nfts_bp)   # nfts_bp already has /api/nfts prefix
    app.register_blueprint(comments_bp)  # comments_bp already has /api/comments prefix
    app.register_blueprint(social_bp)  # social_bp already has /api/social prefix
    app.register_blueprint(upload_bp)  # upload_bp already has /api/upload prefix
    app.register_blueprint(locations_bp)  # NEW: locations routes
    app.register_blueprint(users_bp)      # NEW: users routes
    app.register_blueprint(stories_bp)    # NEW: stories routes
    app.register_blueprint(notifications_bp)  # NEW: notifications routes
    app.register_blueprint(chat_bp)       # NEW: chat routes
    app.register_blueprint(moderator_bp)  # NEW: moderator routes
    app.register_blueprint(contact_bp)    # NEW: contact routes
    app.register_blueprint(tour_location_bp)  # NEW: realtime tour location tracking
    print("[OK] Routes registered successfully (including tour features: participants, assignments, progress, itinerary, location tracking)")
except ImportError as e:
    print(f"[WARNING] Some routes not found: {e}")

# Socket.IO event handlers will be registered before running

# Handle OPTIONS requests for CORS preflight
# Note: Flask-CORS already handles this, but we keep this for explicit control
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        # Get origin from request
        origin = request.headers.get('Origin')
        # List of allowed origins
        allowed_origins = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"]
        
        # Check if origin is allowed
        if origin in allowed_origins:
            response = jsonify({'status': 'ok'})
            response.headers.add("Access-Control-Allow-Origin", origin)
            response.headers.add('Access-Control-Allow-Headers', "Content-Type,Authorization,X-Requested-With,Accept,Cache-Control,Pragma,Expires")
            response.headers.add('Access-Control-Allow-Methods', "GET,POST,PUT,DELETE,PATCH,OPTIONS")
            response.headers.add('Access-Control-Allow-Credentials', "true")
            response.headers.add('Access-Control-Max-Age', "3600")
            return response, 200
        else:
            # Origin not allowed
            return jsonify({'error': 'Origin not allowed'}), 403

# Health check endpoint
@app.route('/api/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'VieGo Blog API is running!',
        'version': '1.0.0'
    })

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    print(f"[JWT] Expired token: {jwt_payload}")
    return jsonify({'error': 'Token has expired'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    print(f"[JWT] Invalid token error: {error}")
    return jsonify({'error': 'Invalid token'}), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    print(f"[JWT] Missing token error: {error}")
    print(f"[JWT] Request path: {request.path}")
    print(f"[JWT] Request method: {request.method}")
    print(f"[JWT] Request headers: {dict(request.headers)}")
    return jsonify({'error': 'Authorization token is required'}), 401

# Serve uploaded files
@app.route('/uploads/<path:filename>')
def serve_uploads(filename):
    """Serve uploaded files from subdirectories (images/, avatars/, etc.)"""
    import os
    from flask import abort
    
    upload_folder = app.config['UPLOAD_FOLDER']
    # Construct full file path - filename already contains subdirectory (e.g., images/filename.jpg)
    file_path = os.path.join(upload_folder, filename)
    
    # Security: ensure file is within upload folder (prevent directory traversal)
    upload_folder_abs = os.path.abspath(upload_folder)
    file_path_abs = os.path.abspath(file_path)
    if not file_path_abs.startswith(upload_folder_abs):
        abort(403)
    
    # Check if file exists
    if not os.path.exists(file_path):
        abort(404)
    
    # Determine directory and filename for send_from_directory
    directory = os.path.dirname(file_path)
    filename_only = os.path.basename(file_path)
    
    return send_from_directory(directory, filename_only)

# Create tables
def create_tables():
    """Create database tables if they don't exist"""
    try:
        db.create_all()
        print("[OK] Database tables created successfully!")
    except Exception as e:
        print(f"[ERROR] Error creating tables: {str(e)}")

if __name__ == '__main__':
    # Create upload directory if it doesn't exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Create database tables 
    with app.app_context():
        create_tables()
    
    # Run the application
    print("[START] Starting VieGo Blog API...")
    print(f"[INFO] Environment: {os.getenv('FLASK_ENV', 'development')}")
    print(f"[DB] Database: {app.config['SQLALCHEMY_DATABASE_URI']}")
    
    # Socket.IO handlers (socket_utils already initialized above)
    from socket_handlers import register_socket_handlers
    register_socket_handlers(socketio)
    
    # Run the application with Socket.IO
    socketio.run(
        app,
        debug=os.getenv('FLASK_DEBUG', 'True') == 'True',
        host='0.0.0.0',
        port=5000
    )