"""
Migration script to add ban fields to users table
Adds account_banned_until, post_banned_until, comment_banned_until columns
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

def add_ban_fields():
    """Add ban fields to users table if they don't exist"""
    db = models.db
    with app.app_context():
        try:
            # Check if columns exist
            result = db.session.execute(text("""
                SELECT COLUMN_NAME 
                FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'users' 
                AND COLUMN_NAME IN ('account_banned_until', 'post_banned_until', 'comment_banned_until')
            """))
            
            existing_columns = {row[0] for row in result}
            
            # Add account_banned_until
            if 'account_banned_until' not in existing_columns:
                print("Adding account_banned_until column to users table...")
                db.session.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN account_banned_until DATETIME NULL 
                    AFTER email_verified
                """))
                db.session.commit()
                print("[OK] Column account_banned_until added successfully!")
            else:
                print("[OK] Column account_banned_until already exists!")
            
            # Add post_banned_until
            if 'post_banned_until' not in existing_columns:
                print("Adding post_banned_until column to users table...")
                db.session.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN post_banned_until DATETIME NULL 
                    AFTER account_banned_until
                """))
                db.session.commit()
                print("[OK] Column post_banned_until added successfully!")
            else:
                print("[OK] Column post_banned_until already exists!")
            
            # Add comment_banned_until
            if 'comment_banned_until' not in existing_columns:
                print("Adding comment_banned_until column to users table...")
                db.session.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN comment_banned_until DATETIME NULL 
                    AFTER post_banned_until
                """))
                db.session.commit()
                print("[OK] Column comment_banned_until added successfully!")
            else:
                print("[OK] Column comment_banned_until already exists!")
                
            print("\n✅ Migration completed successfully!")
            
        except Exception as e:
            db.session.rollback()
            print(f"[ERROR] Error: {str(e)}")
            raise

if __name__ == '__main__':
    add_ban_fields()

