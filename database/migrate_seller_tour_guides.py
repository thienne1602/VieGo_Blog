"""
Migration script to create seller_tour_guides table
"""
import os
import sys
import mysql.connector
from mysql.connector import Error

def run_migration():
    """Run the migration SQL script"""
    try:
        # Database connection configuration
        db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'user': os.getenv('DB_USER', 'root'),
            'password': os.getenv('DB_PASSWORD', ''),
            'database': os.getenv('DB_NAME', 'viego_blog'),
            'charset': 'utf8mb4',
            'collation': 'utf8mb4_unicode_ci'
        }
        
        print(f"Connecting to database: {db_config['database']} at {db_config['host']}...")
        
        # Connect to database
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor()
        
        print("[OK] Connected successfully")
        
        # SQL to create seller_tour_guides table
        sql = """
        CREATE TABLE IF NOT EXISTS seller_tour_guides (
            id INT AUTO_INCREMENT PRIMARY KEY,
            seller_id INT NOT NULL,
            tour_guide_id INT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (tour_guide_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_seller_tour_guide (seller_id, tour_guide_id),
            INDEX idx_seller_id (seller_id),
            INDEX idx_tour_guide_id (tour_guide_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """
        
        print("Creating seller_tour_guides table...")
        cursor.execute(sql)
        connection.commit()
        
        print("[OK] Migration completed successfully")
        cursor.close()
        connection.close()
        return True
        
    except Error as e:
        print(f"[ERROR] Error during migration: {e}")
        return False
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")
        return False

if __name__ == '__main__':
    success = run_migration()
    sys.exit(0 if success else 1)

