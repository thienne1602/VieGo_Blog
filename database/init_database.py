#!/usr/bin/env python3
"""
Database initialization script for VieGo Blog
Tạo database và các bảng cần thiết
"""

import pymysql
import sys
import os
from datetime import datetime

def create_database_connection(database=None):
    """Tạo kết nối database"""
    # Use environment variables or defaults
    host = os.getenv('DB_HOST', 'localhost')
    user = os.getenv('DB_USER', 'root')
    password = os.getenv('DB_PASSWORD', '')
    port = int(os.getenv('DB_PORT', 3306))
    
    config = {
        'host': host,
        'user': user,
        'password': password,
        'port': port,
        'charset': 'utf8mb4',
        'cursorclass': pymysql.cursors.DictCursor
    }
    
    if database:
        config['database'] = database
        
    return pymysql.connect(**config)

def create_database():
    """Tạo database VieGo Blog"""
    connection = create_database_connection()
    
    try:
        with connection.cursor() as cursor:
            # Tạo database
            cursor.execute("CREATE DATABASE IF NOT EXISTS viego_blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            print("✅ Database 'viego_blog' created successfully")
            
        connection.commit()
        
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        return False
        
    finally:
        connection.close()
    
    return True

def create_tables():
    """Tạo các bảng cần thiết"""
    connection = create_database_connection('viego_blog')
    
    tables = {
        'users': """
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(100),
                avatar_url VARCHAR(255),
                role ENUM('user', 'admin', 'moderator') DEFAULT 'user',
                points INT DEFAULT 0,
                level INT DEFAULT 1,
                badges JSON,
                bio TEXT,
                location VARCHAR(100),
                website VARCHAR(255),
                social_links JSON,
                email_verified BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_username (username),
                INDEX idx_email (email),
                INDEX idx_role (role)
            )
        """,
        
        'categories': """
            CREATE TABLE IF NOT EXISTS categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) UNIQUE NOT NULL,
                slug VARCHAR(50) UNIQUE NOT NULL,
                description TEXT,
                color VARCHAR(7) DEFAULT '#667eea',
                icon VARCHAR(50),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                INDEX idx_slug (slug)
            )
        """,
        
        'locations': """
            CREATE TABLE IF NOT EXISTS locations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                slug VARCHAR(100) UNIQUE NOT NULL,
                type ENUM('attraction', 'restaurant', 'hotel', 'culture', 'nature', 'beach', 'city') NOT NULL,
                description TEXT,
                address TEXT,
                latitude DECIMAL(10, 8),
                longitude DECIMAL(11, 8),
                province VARCHAR(50),
                country VARCHAR(50) DEFAULT 'Vietnam',
                rating DECIMAL(2,1) DEFAULT 0.0,
                review_count INT DEFAULT 0,
                images JSON,
                contact_info JSON,
                opening_hours JSON,
                price_range ENUM('budget', 'mid-range', 'luxury') DEFAULT 'mid-range',
                features JSON,
                is_featured BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_slug (slug),
                INDEX idx_type (type),
                INDEX idx_province (province),
                INDEX idx_rating (rating)
            )
        """,
        
        'posts': """
            CREATE TABLE IF NOT EXISTS posts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                slug VARCHAR(200) UNIQUE NOT NULL,
                excerpt TEXT,
                content LONGTEXT NOT NULL,
                featured_image VARCHAR(255),
                author_id INT NOT NULL,
                category_id INT,
                location_id INT,
                status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
                visibility ENUM('public', 'private', 'members') DEFAULT 'public',
                tags JSON,
                meta_description TEXT,
                read_time INT DEFAULT 0,
                view_count INT DEFAULT 0,
                like_count INT DEFAULT 0,
                comment_count INT DEFAULT 0,
                is_featured BOOLEAN DEFAULT FALSE,
                published_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
                FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL,
                
                INDEX idx_slug (slug),
                INDEX idx_author (author_id),
                INDEX idx_category (category_id),
                INDEX idx_location (location_id),
                INDEX idx_status (status),
                INDEX idx_published_at (published_at),
                INDEX idx_featured (is_featured)
            )
        """,
        
        'comments': """
            CREATE TABLE IF NOT EXISTS comments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                post_id INT NOT NULL,
                author_id INT NOT NULL,
                parent_id INT NULL,
                content TEXT NOT NULL,
                level INT DEFAULT 0,
                likes_count INT DEFAULT 0,
                replies_count INT DEFAULT 0,
                status ENUM('pending', 'approved', 'rejected', 'spam') DEFAULT 'pending',
                flagged BOOLEAN DEFAULT FALSE,
                flag_reason VARCHAR(255),
                translated_content TEXT,
                language VARCHAR(10) DEFAULT 'vi',
                is_pinned BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
                
                INDEX idx_post (post_id),
                INDEX idx_author (author_id),
                INDEX idx_parent (parent_id),
                INDEX idx_status (status)
            )
        """,
        
        'post_likes': """
            CREATE TABLE IF NOT EXISTS post_likes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                post_id INT NOT NULL,
                user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                
                UNIQUE KEY unique_like (post_id, user_id),
                INDEX idx_post (post_id),
                INDEX idx_user (user_id)
            )
        """,
        
        'tours': """
            CREATE TABLE IF NOT EXISTS tours (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                slug VARCHAR(200) UNIQUE NOT NULL,
                description TEXT,
                short_description VARCHAR(500),
                location_id INT,
                duration_days INT NOT NULL,
                difficulty ENUM('easy', 'moderate', 'hard') DEFAULT 'easy',
                category ENUM('food', 'adventure', 'nature', 'cultural', 'luxury', 'beach') NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                max_participants INT DEFAULT 10,
                min_participants INT DEFAULT 1,
                includes JSON,
                excludes JSON,
                itinerary JSON,
                images JSON,
                rating DECIMAL(2,1) DEFAULT 0.0,
                review_count INT DEFAULT 0,
                booking_count INT DEFAULT 0,
                guide_id INT,
                is_featured BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL,
                FOREIGN KEY (guide_id) REFERENCES users(id) ON DELETE SET NULL,
                
                INDEX idx_slug (slug),
                INDEX idx_location (location_id),
                INDEX idx_category (category),
                INDEX idx_price (price),
                INDEX idx_rating (rating)
            )
        """,
        
        'user_sessions': """
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                token_jti VARCHAR(100) NOT NULL UNIQUE,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                ip_address VARCHAR(45),
                user_agent TEXT,
                is_revoked BOOLEAN DEFAULT FALSE,
                
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                
                INDEX idx_user (user_id),
                INDEX idx_token (token_jti),
                INDEX idx_expires_at (expires_at)
            )
        """
    }
    
    try:
        with connection.cursor() as cursor:
            for table_name, table_sql in tables.items():
                cursor.execute(table_sql)
                print(f"✅ Table '{table_name}' created successfully")
                
        connection.commit()
        return True
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return False
        
    finally:
        connection.close()

def insert_sample_data():
    """Chèn dữ liệu mẫu"""
    connection = create_database_connection('viego_blog')
    
    try:
        with connection.cursor() as cursor:
            # Categories
            categories = [
                ('Du lịch', 'travel', 'Các bài viết về địa điểm du lịch', '#3B82F6', '🏔️'),
                ('Ẩm thực', 'food', 'Khám phá ẩm thực Việt Nam', '#F59E0B', '🍜'),
                ('Văn hóa', 'culture', 'Văn hóa và truyền thống', '#8B5CF6', '🏛️'),
                ('Tips', 'tips', 'Mẹo du lịch hữu ích', '#10B981', '💡'),
                ('Review', 'review', 'Đánh giá địa điểm', '#EF4444', '⭐')
            ]
            
            cursor.execute("DELETE FROM categories")  # Clear existing data
            for category in categories:
                cursor.execute("""
                    INSERT INTO categories (name, slug, description, color, icon) 
                    VALUES (%s, %s, %s, %s, %s)
                """, category)
            print("✅ Categories data inserted")
            
            # Locations
            locations = [
                ('Vịnh Hạ Long', 'vinh-ha-long', 'attraction', 'Di sản thiên nhiên thế giới với những hang động tuyệt đẹp', 
                 'Vịnh Hạ Long, Quảng Ninh', 20.9101, 107.1839, 'Quảng Ninh', 4.8),
                ('Phố cổ Hội An', 'pho-co-hoi-an', 'culture', 'Khu phố cổ được UNESCO công nhận', 
                 'Hội An, Quảng Nam', 15.8801, 108.3380, 'Quảng Nam', 4.7),
                ('Ruộng bậc thang Sapa', 'ruong-bac-thang-sapa', 'nature', 'Ruộng bậc thang tuyệt đẹp', 
                 'Sapa, Lào Cai', 22.3380, 103.8442, 'Lào Cai', 4.6),
                ('Chợ Bến Thành', 'cho-ben-thanh', 'attraction', 'Chợ truyền thống nổi tiếng Sài Gòn', 
                 'Quận 1, TP.HCM', 10.7720, 106.6980, 'TP.HCM', 4.3),
                ('Đảo Phú Quốc', 'dao-phu-quoc', 'beach', 'Đảo ngọc với bãi biển tuyệt đẹp', 
                 'Phú Quốc, Kiên Giang', 10.2899, 103.9840, 'Kiên Giang', 4.5)
            ]
            
            cursor.execute("DELETE FROM locations")  # Clear existing data
            for location in locations:
                cursor.execute("""
                    INSERT INTO locations (name, slug, type, description, address, latitude, longitude, province, rating) 
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, location)
            print("✅ Locations data inserted")
            
            # Admin user (password: admin123)
            users = [
                ('admin', 'admin@viego.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeW.WFEmoLbtsnmT6', 
                 'VieGo Admin', 'admin', 1000, 10, '["Admin", "Founder"]'),
                ('demo_user', 'demo@viego.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeW.WFEmoLbtsnmT6', 
                 'Demo User', 'user', 150, 2, '["New Member"]')
            ]
            
            cursor.execute("DELETE FROM users")  # Clear existing data
            for user in users:
                cursor.execute("""
                    INSERT INTO users (username, email, password_hash, full_name, role, points, level, badges) 
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, user)
            print("✅ Users data inserted")
            
            # Sample posts
            posts = [
                ('Khám phá vẻ đẹp vịnh Hạ Long', 'kham-pha-ve-dep-vinh-ha-long', 
                 'Khám phá vẻ đẹp kỳ bí của vịnh Hạ Long với những hang động tuyệt đẹp.',
                 '<h2>Vịnh Hạ Long - Kỳ quan thiên nhiên thế giới</h2><p>Vịnh Hạ Long là một trong những điểm đến không thể bỏ qua...</p>',
                 '/images/posts/halong-bay.svg', 1, 1, 1, 'published', '["vịnh hạ long", "du lịch"]', 8, 1250, 156, 23, True, '2025-09-25 10:00:00'),
                
                ('Phở Hà Nội - Hương vị đậm đà', 'pho-ha-noi-huong-vi-dam-da',
                 'Tìm hiểu về lịch sử và cách làm phở Hà Nội authentic.',
                 '<h2>Phở - Linh hồn ẩm thực Việt Nam</h2><p>Phở là món ăn đặc trưng...</p>',
                 '/images/posts/pho-hanoi.svg', 1, 2, None, 'published', '["phở", "ẩm thực"]', 5, 890, 89, 15, False, '2025-09-24 09:30:00')
            ]
            
            cursor.execute("DELETE FROM posts")  # Clear existing data
            for post in posts:
                cursor.execute("""
                    INSERT INTO posts (title, slug, excerpt, content, featured_image, author_id, category_id, 
                                     location_id, status, tags, read_time, view_count, like_count, comment_count, 
                                     is_featured, published_at) 
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, post)
            print("✅ Posts data inserted")
            
        connection.commit()
        return True
        
    except Exception as e:
        print(f"❌ Error inserting sample data: {e}")
        return False
        
    finally:
        connection.close()

def main():
    """Main function"""
    print("🚀 VieGo Blog Database Initialization")
    print("=====================================")
    
    # Step 1: Create database
    print("\n1. Creating database...")
    if not create_database():
        sys.exit(1)
    
    # Step 2: Create tables
    print("\n2. Creating tables...")
    if not create_tables():
        sys.exit(1)
    
    # Step 3: Insert sample data
    print("\n3. Inserting sample data...")
    if not insert_sample_data():
        sys.exit(1)
    
    print("\n🎉 Database initialization completed successfully!")
    print("📊 You can now connect to the VieGo Blog database")
    print("\nDatabase details:")
    print("- Host: localhost")
    print("- Database: viego_blog")
    print("- User: root")
    print("- Password: (empty)")
    print("\nAdmin account:")
    print("- Username: admin")
    print("- Email: admin@viego.com")
    print("- Password: admin123")

if __name__ == "__main__":
    main()