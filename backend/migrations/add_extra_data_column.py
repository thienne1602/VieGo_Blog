"""
Migration script to add extra_data column to notifications table
Run this script to fix the database schema issue
"""
import os
import sys

# Add backend directory to Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app
import models
from sqlalchemy import text

def add_extra_data_column():
    """Add extra_data column to notifications table if it doesn't exist"""
    db = models.db
    with app.app_context():
        try:
            # Check if column exists
            result = db.session.execute(text("""
                SELECT COUNT(*) 
                FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'notifications' 
                AND COLUMN_NAME = 'extra_data'
            """))
            
            column_exists = result.scalar() > 0
            
            if not column_exists:
                print("Adding extra_data column to notifications table...")
                db.session.execute(text("""
                    ALTER TABLE notifications 
                    ADD COLUMN extra_data TEXT AFTER action_url
                """))
                db.session.commit()
                print("[OK] Column extra_data added successfully!")
            else:
                print("[OK] Column extra_data already exists!")
        except Exception as e:
            db.session.rollback()
            print(f"[ERROR] Error: {str(e)}")
            raise

if __name__ == '__main__':
    add_extra_data_column()

