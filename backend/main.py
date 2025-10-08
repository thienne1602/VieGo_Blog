import os
from flask import Flask, jsonify, request, session
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
# from flask_socketio import SocketIO  # Disabled for now
from flask_cors import CORS
from flask_babel import Babel
from dotenv import load_dotenv
import pymysql

# Install PyMySQL as MySQLdb
pymysql.install_as_MySQLdb()

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'viego-default-secret')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret')

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
# Disable SocketIO for now to avoid conflicts
socketio = None
print("ℹ️ SocketIO disabled - using standard Flask server")
cors = CORS(app, origins=os.getenv('CORS_ORIGINS', '*').split(','))
babel = Babel(app)

# Import cache utilities
try:
    from utils.cache import cache, cached_route
    print("✅ Cache system initialized")
except ImportError:
    print("⚠️  Cache system not available")
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
    print("✅ Models imported successfully")
except ImportError as e:
    print(f"⚠️  Some models not found: {e}")
    # Create basic models if files don't exist
    pass

# Import routes (only existing ones for now)
try:
    from routes.auth import auth_bp
    from routes.posts import posts_bp
    from routes.test import test_bp
    from routes.admin import admin_bp
    from routes.tours import tours_bp
    from routes.maps import maps_bp
    from routes.nfts import nfts_bp
    from routes.comments import comments_bp
    from routes.social import social_bp
    from routes.upload import upload_bp
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(posts_bp, url_prefix='/api/posts')
    app.register_blueprint(test_bp, url_prefix='/api/test')
    app.register_blueprint(admin_bp)  # admin_bp already has /api/admin prefix
    app.register_blueprint(tours_bp)  # tours_bp already has /api/tours prefix
    app.register_blueprint(maps_bp)   # maps_bp already has /api/maps prefix
    app.register_blueprint(nfts_bp)   # nfts_bp already has /api/nfts prefix
    app.register_blueprint(comments_bp)  # comments_bp already has /api/comments prefix
    app.register_blueprint(social_bp)  # social_bp already has /api/social prefix
    app.register_blueprint(upload_bp)  # upload_bp already has /api/upload prefix
    print("✅ Routes registered successfully (auth, posts, test, admin, tours, maps, nfts, comments, social, upload)")
except ImportError as e:
    print(f"⚠️  Some routes not found: {e}")

# Socket.IO event handlers (only if socketio is available)
if socketio:
    from socket_handlers import register_socket_handlers
    register_socket_handlers(socketio)

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
    return jsonify({'error': 'Token has expired'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({'error': 'Invalid token'}), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({'error': 'Authorization token is required'}), 401

# Create tables
def create_tables():
    """Create database tables if they don't exist"""
    try:
        db.create_all()
        print("✅ Database tables created successfully!")
    except Exception as e:
        print(f"❌ Error creating tables: {str(e)}")

if __name__ == '__main__':
    # Create upload directory if it doesn't exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Create database tables 
    with app.app_context():
        create_tables()
    
    # Run the application
    print("🚀 Starting VieGo Blog API...")
    print(f"📊 Environment: {os.getenv('FLASK_ENV', 'development')}")
    print(f"🗄️  Database: {app.config['SQLALCHEMY_DATABASE_URI']}")
    
    if socketio:
        socketio.run(
            app,
            debug=os.getenv('FLASK_DEBUG', 'True') == 'True',
            host='0.0.0.0',
            port=5000
        )
    else:
        app.run(
            debug=os.getenv('FLASK_DEBUG', 'True') == 'True',
            host='0.0.0.0',
            port=5000
        )