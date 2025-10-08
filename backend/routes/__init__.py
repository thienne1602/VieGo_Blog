"""
Routes package for VieGo Blog API
Contains all API endpoint blueprints
"""

# Import all blueprints
from routes.auth import auth_bp
from routes.posts import posts_bp
from routes.admin import admin_bp
from routes.test import test_bp
from routes.tours import tours_bp
from routes.maps import maps_bp
from routes.nfts import nfts_bp

# Placeholder for chat and collaboration (to be implemented)
from flask import Blueprint

chat_bp = Blueprint('chat', __name__, url_prefix='/api/chat')
@chat_bp.route('/messages', methods=['GET'])
def get_messages():
    return {'message': 'Chat API - Coming soon'}, 200

collaboration_bp = Blueprint('collaboration', __name__, url_prefix='/api/collaboration')
@collaboration_bp.route('/sessions', methods=['GET'])
def get_collaboration_sessions():
    return {'message': 'Collaboration API - Coming soon'}, 200

# List all available blueprints
__all__ = [
    'auth_bp',
    'posts_bp',
    'admin_bp',
    'test_bp',
    'tours_bp',
    'maps_bp',
    'nfts_bp',
    'chat_bp',
    'collaboration_bp'
]
