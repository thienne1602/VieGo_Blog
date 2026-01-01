"""
Migration: Create AI Analytics Tables
Tạo các bảng cho hệ thống phân tích AI và gửi email khuyến mãi
"""
import os
import sys

# Add backend directory to path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)


def run_migration():
    """Chạy migration tạo bảng"""
    from flask import Flask
    from flask_sqlalchemy import SQLAlchemy
    from dotenv import load_dotenv
    import pymysql
    
    pymysql.install_as_MySQLdb()
    
    # Load environment
    dotenv_path = os.path.join(backend_dir, '.env')
    load_dotenv(dotenv_path)
    
    # Create Flask app
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = (
        f"mysql://{os.getenv('DB_USER', 'root')}:"
        f"{os.getenv('DB_PASSWORD', '')}@"
        f"{os.getenv('DB_HOST', 'localhost')}:"
        f"{os.getenv('DB_PORT', '3306')}/"
        f"{os.getenv('DB_NAME', 'viego_blog')}"
        f"?charset=utf8mb4"
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db = SQLAlchemy(app)
    
    # SQL statements
    sql_statements = [
        # Table: user_behaviors
        """
        CREATE TABLE IF NOT EXISTS user_behaviors (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            action_type ENUM(
                'view_tour', 'search_tour', 'book_tour', 'wishlist_tour',
                'share_tour', 'review_tour', 'view_category', 'view_location',
                'click_promotion', 'open_email', 'click_email_link',
                'complete_booking', 'cancel_booking'
            ) NOT NULL,
            target_id INT,
            target_type VARCHAR(50),
            metadata TEXT,
            session_id VARCHAR(100),
            device_type ENUM('desktop', 'mobile', 'tablet') DEFAULT 'desktop',
            browser VARCHAR(50),
            ip_address VARCHAR(50),
            referrer VARCHAR(500),
            duration_seconds INT DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id),
            INDEX idx_action_type (action_type),
            INDEX idx_target_id (target_id),
            INDEX idx_session_id (session_id),
            INDEX idx_created_at (created_at),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """,
        
        # Table: user_interest_profiles
        """
        CREATE TABLE IF NOT EXISTS user_interest_profiles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL UNIQUE,
            adventure_score FLOAT DEFAULT 0.0,
            cultural_score FLOAT DEFAULT 0.0,
            food_score FLOAT DEFAULT 0.0,
            nature_score FLOAT DEFAULT 0.0,
            urban_score FLOAT DEFAULT 0.0,
            spiritual_score FLOAT DEFAULT 0.0,
            preferred_price_min FLOAT DEFAULT 0.0,
            preferred_price_max FLOAT DEFAULT 10000000.0,
            price_sensitivity FLOAT DEFAULT 0.5,
            preferred_duration_min INT DEFAULT 1,
            preferred_duration_max INT DEFAULT 7,
            preferred_locations TEXT,
            preferred_provinces TEXT,
            preferred_difficulty ENUM('easy', 'moderate', 'hard', 'any') DEFAULT 'any',
            favorite_tags TEXT,
            engagement_level ENUM('low', 'medium', 'high', 'very_high') DEFAULT 'medium',
            avg_session_duration FLOAT DEFAULT 0.0,
            total_views INT DEFAULT 0,
            total_bookings INT DEFAULT 0,
            total_spent FLOAT DEFAULT 0.0,
            email_open_rate FLOAT DEFAULT 0.0,
            email_click_rate FLOAT DEFAULT 0.0,
            last_email_opened_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            last_analyzed_at DATETIME,
            INDEX idx_user_id (user_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """,
        
        # Table: promotional_campaigns
        """
        CREATE TABLE IF NOT EXISTS promotional_campaigns (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            campaign_type ENUM(
                'weekly_personalized', 'flash_sale', 'seasonal',
                'holiday', 'new_tours', 'abandoned_cart', 're_engagement'
            ) DEFAULT 'weekly_personalized',
            email_subject_template VARCHAR(255),
            email_body_template TEXT,
            target_segments TEXT,
            min_engagement_level ENUM('low', 'medium', 'high', 'very_high'),
            target_categories TEXT,
            schedule_type ENUM('once', 'daily', 'weekly', 'monthly') DEFAULT 'weekly',
            schedule_day INT,
            schedule_time TIME,
            next_run_at DATETIME,
            last_run_at DATETIME,
            total_sent INT DEFAULT 0,
            total_opened INT DEFAULT 0,
            total_clicked INT DEFAULT 0,
            total_conversions INT DEFAULT 0,
            status ENUM('draft', 'active', 'paused', 'completed') DEFAULT 'draft',
            created_by INT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_status (status),
            INDEX idx_campaign_type (campaign_type),
            INDEX idx_next_run (next_run_at),
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """,
        
        # Table: email_logs
        """
        CREATE TABLE IF NOT EXISTS email_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            campaign_id INT,
            user_id INT NOT NULL,
            email_address VARCHAR(255) NOT NULL,
            subject VARCHAR(255),
            recommended_tours TEXT,
            tracking_id VARCHAR(100) UNIQUE,
            status ENUM('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed') DEFAULT 'pending',
            sent_at DATETIME,
            opened_at DATETIME,
            clicked_at DATETIME,
            error_message TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_campaign_id (campaign_id),
            INDEX idx_user_id (user_id),
            INDEX idx_tracking_id (tracking_id),
            INDEX idx_status (status),
            FOREIGN KEY (campaign_id) REFERENCES promotional_campaigns(id) ON DELETE SET NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """
    ]
    
    with app.app_context():
        # Execute each SQL statement
        for i, sql in enumerate(sql_statements):
            try:
                db.session.execute(db.text(sql))
                db.session.commit()
                table_name = sql.split('CREATE TABLE IF NOT EXISTS ')[1].split(' ')[0]
                print(f"[OK] Created table: {table_name}")
            except Exception as e:
                db.session.rollback()
                print(f"[ERROR] Statement {i+1}: {e}")
    
    print("\n" + "="*50)
    print("Migration completed!")
    print("="*50)


def check_tables():
    """Kiểm tra các bảng đã tạo"""
    from flask import Flask
    from flask_sqlalchemy import SQLAlchemy
    from dotenv import load_dotenv
    import pymysql
    
    pymysql.install_as_MySQLdb()
    
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dotenv_path = os.path.join(backend_dir, '.env')
    load_dotenv(dotenv_path)
    
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = (
        f"mysql://{os.getenv('DB_USER', 'root')}:"
        f"{os.getenv('DB_PASSWORD', '')}@"
        f"{os.getenv('DB_HOST', 'localhost')}:"
        f"{os.getenv('DB_PORT', '3306')}/"
        f"{os.getenv('DB_NAME', 'viego_blog')}"
        f"?charset=utf8mb4"
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db = SQLAlchemy(app)
    
    tables_to_check = [
        'user_behaviors',
        'user_interest_profiles',
        'promotional_campaigns',
        'email_logs'
    ]
    
    with app.app_context():
        print("\nChecking tables:")
        print("-" * 40)
        
        for table in tables_to_check:
            try:
                result = db.session.execute(
                    db.text(f"SELECT COUNT(*) FROM {table}")
                ).fetchone()
                print(f"[OK] {table}: {result[0]} rows")
            except Exception as e:
                print(f"[MISSING] {table}: {e}")


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='AI Analytics Migration')
    parser.add_argument('--check', action='store_true', help='Check existing tables')
    args = parser.parse_args()
    
    if args.check:
        check_tables()
    else:
        run_migration()
        check_tables()
