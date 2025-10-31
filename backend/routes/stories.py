from flask import Blueprint, jsonify, request
from models import db
from models.story import Story
from models.user import User
from sqlalchemy import desc, and_
from datetime import datetime

stories_bp = Blueprint('stories', __name__)

@stories_bp.route('/api/stories', methods=['GET'])
def get_stories():
    """Get active stories (not expired)"""
    try:
        # Get only non-expired stories
        now = datetime.utcnow()
        
        stories = Story.query\
            .filter(Story.expires_at > now)\
            .order_by(desc(Story.created_at))\
            .all()
        
        # Group stories by user
        stories_by_user = {}
        for story in stories:
            user = User.query.get(story.user_id)
            if user:
                if user.id not in stories_by_user:
                    stories_by_user[user.id] = {
                        'user': user.to_dict_public(),
                        'stories': []
                    }
                stories_by_user[user.id]['stories'].append(story.to_dict())
        
        result = list(stories_by_user.values())
        
        return jsonify({
            'success': True,
            'data': result,
            'total': len(stories)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Lỗi lấy stories: {str(e)}'
        }), 500

@stories_bp.route('/api/stories/<int:story_id>', methods=['GET'])
def get_story(story_id):
    """Get a single story by ID"""
    try:
        story = Story.query.get(story_id)
        
        if not story:
            return jsonify({
                'success': False,
                'error': 'Không tìm thấy story'
            }), 404
        
        # Check if expired
        if story.expires_at < datetime.utcnow():
            return jsonify({
                'success': False,
                'error': 'Story đã hết hạn'
            }), 410  # Gone
        
        return jsonify({
            'success': True,
            'data': story.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Lỗi lấy story: {str(e)}'
        }), 500

@stories_bp.route('/api/stories/user/<int:user_id>', methods=['GET'])
def get_user_stories(user_id):
    """Get stories by user ID"""
    try:
        now = datetime.utcnow()
        
        stories = Story.query\
            .filter(and_(
                Story.user_id == user_id,
                Story.expires_at > now
            ))\
            .order_by(desc(Story.created_at))\
            .all()
        
        return jsonify({
            'success': True,
            'data': [story.to_dict() for story in stories]
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Lỗi lấy user stories: {str(e)}'
        }), 500

@stories_bp.route('/api/stories/<int:story_id>/view', methods=['POST'])
def view_story(story_id):
    """Increment story view count"""
    try:
        story = Story.query.get(story_id)
        
        if not story:
            return jsonify({
                'success': False,
                'error': 'Không tìm thấy story'
            }), 404
        
        # Increment view count
        story.view_count += 1
        db.session.commit()
        
        return jsonify({
            'success': True,
            'view_count': story.view_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Lỗi tăng view count: {str(e)}'
        }), 500
