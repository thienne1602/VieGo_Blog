"""
Migration: Add user analytics and email campaign columns
Thêm các cột mới cho phân tích người dùng và chiến dịch email
"""
import os
import sys

# Add backend directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
backend_dir = os.path.join(parent_dir, 'backend')

from dotenv import load_dotenv
import pymysql

# Load environment
load_dotenv(os.path.join(backend_dir, '.env'))
load_dotenv()

def get_connection():
    """Get database connection"""
    return pymysql.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        user=os.getenv('DB_USER', 'root'),
        password=os.getenv('DB_PASSWORD', ''),
        database=os.getenv('DB_NAME', 'viego_blog'),
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )

def run_migration():
    """Run database migration for user analytics and email campaigns"""
    print("=" * 60)
    print("🔧 Migration: User Analytics & Email Campaigns")
    print("=" * 60)
    
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Check and add columns to promotional_campaigns table
        print("\n📊 Checking promotional_campaigns table...")
        
        # Check if table exists
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'promotional_campaigns'
        """)
        table_exists = cursor.fetchone()['count'] > 0
        
        if not table_exists:
            print("   ℹ promotional_campaigns table does not exist, skipping...")
        else:
            # Check if columns exist
            cursor.execute("""
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'promotional_campaigns'
            """)
            existing_columns = [row['COLUMN_NAME'] for row in cursor.fetchall()]
            
            columns_to_add = []
            
            if 'target_segment' not in existing_columns:
                columns_to_add.append(("target_segment", "ADD COLUMN target_segment VARCHAR(100)"))
            
            if 'metadata' not in existing_columns:
                columns_to_add.append(("metadata", "ADD COLUMN metadata TEXT"))
            
            if 'scheduled_at' not in existing_columns:
                columns_to_add.append(("scheduled_at", "ADD COLUMN scheduled_at DATETIME"))
            
            if 'sent_at' not in existing_columns:
                columns_to_add.append(("sent_at", "ADD COLUMN sent_at DATETIME"))
            
            if columns_to_add:
                for name, col_sql in columns_to_add:
                    try:
                        cursor.execute(f"ALTER TABLE promotional_campaigns {col_sql}")
                        conn.commit()
                        print(f"   ✓ Added column: {name}")
                    except Exception as e:
                        print(f"   ⚠ Skipped {name}: {e}")
            else:
                print("   ✓ All promotional_campaigns columns already exist")
            
            # Update campaign_type enum if needed
            print("\n📊 Updating campaign_type enum...")
            try:
                cursor.execute("""
                    ALTER TABLE promotional_campaigns 
                    MODIFY COLUMN campaign_type ENUM(
                        'weekly_personalized', 'flash_sale', 'seasonal', 
                        'holiday', 'new_tours', 'abandoned_cart', 're_engagement', 'custom'
                    ) DEFAULT 'weekly_personalized'
                """)
                conn.commit()
                print("   ✓ Updated campaign_type enum")
            except Exception as e:
                print(f"   ⚠ campaign_type update: {e}")
            
            # Update status enum if needed
            print("\n📊 Updating status enum...")
            try:
                cursor.execute("""
                    ALTER TABLE promotional_campaigns 
                    MODIFY COLUMN status ENUM(
                        'draft', 'active', 'paused', 'completed', 'sending', 'sent', 'failed'
                    ) DEFAULT 'draft'
                """)
                conn.commit()
                print("   ✓ Updated status enum")
            except Exception as e:
                print(f"   ⚠ status update: {e}")
        
        # Check and add columns to email_logs table
        print("\n📊 Checking email_logs table...")
        
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'email_logs'
        """)
        table_exists = cursor.fetchone()['count'] > 0
        
        if not table_exists:
            print("   ℹ email_logs table does not exist, skipping...")
        else:
            cursor.execute("""
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'email_logs'
            """)
            existing_columns = [row['COLUMN_NAME'] for row in cursor.fetchall()]
            
            email_columns_to_add = []
            
            if 'opened' not in existing_columns:
                email_columns_to_add.append(("opened", "ADD COLUMN opened BOOLEAN DEFAULT FALSE"))
            
            if 'clicked' not in existing_columns:
                email_columns_to_add.append(("clicked", "ADD COLUMN clicked BOOLEAN DEFAULT FALSE"))
            
            if 'unsubscribed' not in existing_columns:
                email_columns_to_add.append(("unsubscribed", "ADD COLUMN unsubscribed BOOLEAN DEFAULT FALSE"))
            
            if email_columns_to_add:
                for name, col_sql in email_columns_to_add:
                    try:
                        cursor.execute(f"ALTER TABLE email_logs {col_sql}")
                        conn.commit()
                        print(f"   ✓ Added column: {name}")
                    except Exception as e:
                        print(f"   ⚠ Skipped {name}: {e}")
            else:
                print("   ✓ All email_logs columns already exist")
        
        print("\n" + "=" * 60)
        print("✅ Migration completed successfully!")
        print("=" * 60)
        return True
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        cursor.close()
        conn.close()


if __name__ == '__main__':
    run_migration()
