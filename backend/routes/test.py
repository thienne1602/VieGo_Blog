from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, create_access_token
from datetime import datetime, timedelta
import pymysql

# Create test blueprint
test_bp = Blueprint('test', __name__)

def get_db_connection():
    """Get database connection for testing"""
    return pymysql.connect(
        host='localhost',
        user='root',
        password='',
        database='viego_blog',
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )

@test_bp.route('/database', methods=['GET'])
def test_database():
    """Test database connectivity and return sample data"""
    try:
        connection = get_db_connection()
        
        with connection.cursor() as cursor:
            # Get posts with author information
            cursor.execute("""
                SELECT 
                    p.id, p.title, p.slug, p.excerpt, p.featured_image,
                    p.view_count, p.like_count, p.comment_count, p.published_at,
                    u.full_name as author_name,
                    c.name as category_name,
                    c.color as category_color,
                    c.icon as category_icon,
                    l.name as location_name
                FROM posts p
                LEFT JOIN users u ON p.author_id = u.id
                LEFT JOIN categories c ON p.category_id = c.id
                LEFT JOIN locations l ON p.location_id = l.id
                WHERE p.status = 'published'
                ORDER BY p.published_at DESC
                LIMIT 10
            """)
            posts = cursor.fetchall()
            
            # Get categories
            cursor.execute("SELECT * FROM categories WHERE is_active = 1")
            categories = cursor.fetchall()
            
            # Get locations
            cursor.execute("SELECT * FROM locations WHERE is_active = 1 LIMIT 5")
            locations = cursor.fetchall()
            
            # Get user count
            cursor.execute("SELECT COUNT(*) as total_users FROM users WHERE is_active = 1")
            user_stats = cursor.fetchone()
            
            # Format dates for JSON serialization
            for post in posts:
                if post['published_at']:
                    post['published_at'] = post['published_at'].isoformat()
            
            return jsonify({
                'success': True,
                'message': 'Database connected successfully!',
                'data': {
                    'posts': posts,
                    'categories': categories,
                    'locations': locations,
                    'stats': {
                        'total_users': user_stats['total_users'],
                        'total_posts': len(posts)
                    }
                }
            })
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    
    finally:
        if connection:
            connection.close()

@test_bp.route('/auth/test-login', methods=['POST'])
def test_login():
    """Test login with sample credentials"""
    try:
        data = request.get_json()
        username = data.get('username', 'admin')
        password = data.get('password', 'admin123')
        
        connection = get_db_connection()
        
        with connection.cursor() as cursor:
            # Get user by username
            cursor.execute("""
                SELECT id, username, email, full_name, role, points, level, badges
                FROM users 
                WHERE username = %s AND is_active = 1
            """, (username,))
            user = cursor.fetchone()
            
            if not user:
                return jsonify({'success': False, 'error': 'User not found'}), 401
            
            # In real app, check password hash here
            # For demo, accept admin123 for admin user
            if username == 'admin' and password == 'admin123':
                # Create JWT token
                access_token = create_access_token(
                    identity=user['id'],
                    expires_delta=timedelta(hours=24)
                )
                
                return jsonify({
                    'success': True,
                    'message': 'Login successful!',
                    'user': user,
                    'access_token': access_token
                })
            else:
                return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    
    finally:
        if connection:
            connection.close()

@test_bp.route('/posts/create', methods=['POST'])
@jwt_required()
def create_test_post():
    """Create a test post"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        connection = get_db_connection()
        
        with connection.cursor() as cursor:
            # Insert new post
            cursor.execute("""
                INSERT INTO posts (
                    title, slug, excerpt, content, featured_image, 
                    author_id, category_id, status, tags, 
                    read_time, published_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
            """, (
                data.get('title', 'Test Post'),
                data.get('slug', f"test-post-{datetime.now().strftime('%Y%m%d%H%M%S')}"),
                data.get('excerpt', 'This is a test post'),
                data.get('content', '<p>This is test content</p>'),
                data.get('featured_image', '/images/posts/default.svg'),
                user_id,
                data.get('category_id', 1),
                'published',
                '["test", "demo"]',
                5,
                datetime.now()
            ))
            
            post_id = cursor.lastrowid
            connection.commit()
            
            return jsonify({
                'success': True,
                'message': 'Post created successfully!',
                'post_id': post_id
            })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    
    finally:
        if connection:
            connection.close()