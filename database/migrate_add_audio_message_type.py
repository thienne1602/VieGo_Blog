"""
Migration script to add 'audio' to message_type ENUM in chats table
Run this script to update the database schema
"""

import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

def migrate():
    """Add 'audio' to message_type ENUM"""
    try:
        # Connect to database
        connection = pymysql.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', ''),
            database=os.getenv('DB_NAME', 'viego_blog'),
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        
        with connection.cursor() as cursor:
            print("Checking current message_type column...")
            
            # Check if 'audio' already exists in ENUM
            cursor.execute("""
                SELECT COLUMN_TYPE 
                FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = %s 
                AND TABLE_NAME = 'chats' 
                AND COLUMN_NAME = 'message_type'
            """, (os.getenv('DB_NAME', 'viego_blog'),))
            
            result = cursor.fetchone()
            if result:
                enum_values = result['COLUMN_TYPE']
                print(f"Current ENUM values: {enum_values}")
                
                if "'audio'" in enum_values:
                    print("'audio' already exists in message_type ENUM. Migration not needed.")
                    return
                
                # Step 1: Add new column with updated ENUM
                print("Step 1: Adding new column with updated ENUM...")
                cursor.execute("""
                    ALTER TABLE chats 
                    ADD COLUMN message_type_new ENUM('text', 'image', 'audio', 'file', 'location', 'system') DEFAULT 'text' AFTER message
                """)
                
                # Step 2: Copy data from old column to new column
                print("Step 2: Copying data from old column to new column...")
                cursor.execute("""
                    UPDATE chats 
                    SET message_type_new = message_type
                """)
                
                # Step 3: Drop old column
                print("Step 3: Dropping old column...")
                cursor.execute("ALTER TABLE chats DROP COLUMN message_type")
                
                # Step 4: Rename new column to original name
                print("Step 4: Renaming new column to original name...")
                cursor.execute("""
                    ALTER TABLE chats 
                    CHANGE COLUMN message_type_new message_type ENUM('text', 'image', 'audio', 'file', 'location', 'system') DEFAULT 'text'
                """)
                
                connection.commit()
                print("✅ Migration completed successfully! 'audio' has been added to message_type ENUM.")
            else:
                print("❌ Column 'message_type' not found in chats table.")
        
        connection.close()
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        raise

if __name__ == "__main__":
    migrate()

