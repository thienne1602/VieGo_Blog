"""
Migration script to add seller email fields to users table
"""
import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

def run_migration():
    """Add seller_email and seller_email_password columns to users table"""
    
    db_config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'user': os.getenv('DB_USER', 'root'),
        'password': os.getenv('DB_PASSWORD', ''),
        'database': os.getenv('DB_NAME', 'viego_blog'),
        'charset': 'utf8mb4'
    }
    
    try:
        conn = pymysql.connect(**db_config)
        cursor = conn.cursor()
        
        print("=" * 70)
        print("[MIGRATION] Adding seller email fields to users table...")
        print("=" * 70)
        
        # Check if columns already exist
        cursor.execute("""
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = %s 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME IN ('seller_email', 'seller_email_password')
        """, (db_config['database'],))
        
        existing_columns = [row[0] for row in cursor.fetchall()]
        
        # Add seller_email if not exists
        if 'seller_email' not in existing_columns:
            cursor.execute("""
                ALTER TABLE users 
                ADD COLUMN seller_email VARCHAR(255) NULL 
                COMMENT 'Email address for seller to send booking confirmation emails'
            """)
            print("[OK] Added seller_email column")
        else:
            print("[INFO] seller_email column already exists")
        
        # Add seller_email_password if not exists
        if 'seller_email_password' not in existing_columns:
            cursor.execute("""
                ALTER TABLE users 
                ADD COLUMN seller_email_password VARCHAR(255) NULL 
                COMMENT 'Encrypted password for seller email (bcrypt hashed)'
            """)
            print("[OK] Added seller_email_password column")
        else:
            print("[INFO] seller_email_password column already exists")
        
        conn.commit()
        print("\n[SUCCESS] Migration completed successfully!")
        print("=" * 70)
        
    except pymysql.Error as e:
        print(f"\n[ERROR] Database error: {e}")
        if conn:
            conn.rollback()
        return False
    except Exception as e:
        print(f"\n[ERROR] Error: {e}")
        if conn:
            conn.rollback()
        return False
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
    
    return True

if __name__ == '__main__':
    run_migration()

