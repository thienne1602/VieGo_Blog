"""
Migration: Add visibility columns to posts table
Run this script to add visibility and allowed_viewers columns
"""

import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from flask import Flask
from dotenv import load_dotenv
import pymysql

pymysql.install_as_MySQLdb()

# Load environment
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'viego-default-secret')
app.config['SQLALCHEMY_DATABASE_URI'] = (
    f"mysql://{os.getenv('DB_USER', 'root')}:"
    f"{os.getenv('DB_PASSWORD', '')}@"
    f"{os.getenv('DB_HOST', 'localhost')}:"
    f"{os.getenv('DB_PORT', '3306')}/"
    f"{os.getenv('DB_NAME', 'viego_blog')}"
    f"?charset=utf8mb4"
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

import models
db = models.init_db(app)

def migrate():
    """Add visibility columns to posts table"""
    with app.app_context():
        try:
            # Check if columns exist
            result = db.session.execute(db.text("""
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = :db_name 
                AND TABLE_NAME = 'posts' 
                AND COLUMN_NAME IN ('visibility', 'allowed_viewers')
            """), {'db_name': os.getenv('DB_NAME', 'viego_blog')})
            existing_columns = [row[0] for row in result.fetchall()]
            
            # Add visibility column if not exists
            if 'visibility' not in existing_columns:
                db.session.execute(db.text("""
                    ALTER TABLE posts 
                    ADD COLUMN visibility ENUM('public', 'private', 'friends') DEFAULT 'public'
                """))
                print("[OK] Added 'visibility' column to posts table")
            else:
                print("[SKIP] Column 'visibility' already exists")
            
            # Add allowed_viewers column if not exists
            if 'allowed_viewers' not in existing_columns:
                db.session.execute(db.text("""
                    ALTER TABLE posts 
                    ADD COLUMN allowed_viewers TEXT
                """))
                print("[OK] Added 'allowed_viewers' column to posts table")
            else:
                print("[SKIP] Column 'allowed_viewers' already exists")
            
            db.session.commit()
            print("\n[SUCCESS] Migration completed!")
            
        except Exception as e:
            db.session.rollback()
            print(f"[ERROR] Migration failed: {e}")
            raise

if __name__ == '__main__':
    migrate()
