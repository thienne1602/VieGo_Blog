"""
Migration script to add violation_count column to users table
Adds violation_count column to track number of violations
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

def add_violation_count():
    """Add violation_count column to users table if it doesn't exist"""
    db = models.db
    with app.app_context():
        try:
            # Check if column exists
            result = db.session.execute(text("""
                SELECT COUNT(*) 
                FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'users' 
                AND COLUMN_NAME = 'violation_count'
            """))
            
            column_exists = result.scalar() > 0
            
            if not column_exists:
                print("Adding violation_count column to users table...")
                db.session.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN violation_count INT DEFAULT 0 
                    AFTER comment_banned_until
                """))
                db.session.commit()
                print("[OK] Column violation_count added successfully!")
            else:
                print("[OK] Column violation_count already exists!")
                
            print("\n✅ Migration completed successfully!")
            
        except Exception as e:
            db.session.rollback()
            print(f"[ERROR] Error: {str(e)}")
            raise

if __name__ == '__main__':
    add_violation_count()

