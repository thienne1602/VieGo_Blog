"""
Migration script to add tour features:
- Add tour_guide role
- Create booking_participants table
- Create tour_assignments table  
- Create tour_progress table
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
        
        print("✓ Connected successfully")
        
        # Read SQL migration file
        migration_file = os.path.join(os.path.dirname(__file__), 'migrate_tour_features.sql')
        
        if not os.path.exists(migration_file):
            print(f"✗ Migration file not found: {migration_file}")
            return False
        
        print(f"Reading migration file: {migration_file}")
        
        with open(migration_file, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        # Remove comments (lines starting with --)
        lines = sql_content.split('\n')
        cleaned_lines = []
        for line in lines:
            # Remove inline comments
            if '--' in line:
                line = line[:line.index('--')]
            line = line.strip()
            if line:
                cleaned_lines.append(line)
        
        cleaned_sql = ' '.join(cleaned_lines)
        
        # Split by semicolon to get statements
        statements = [s.strip() for s in cleaned_sql.split(';') if s.strip()]
        
        # Filter out SHOW statements - they cause issues with unread results
        statements = [s for s in statements if not s.upper().startswith('SHOW')]
        
        print(f"Found {len(statements)} SQL statements to execute")
        
        # Execute each statement
        for i, statement in enumerate(statements, 1):
            print(f"\n[{i}/{len(statements)}] Executing statement...")
            
            # Show first part of statement
            preview = statement.replace('\n', ' ')[:80]
            print(f"  {preview}...")
            
            try:
                cursor.execute(statement)
                connection.commit()
                print(f"  ✓ Success")
            except Error as e:
                # Check if error is about table already existing
                error_msg = str(e).lower()
                if 'already exists' in error_msg or 'duplicate' in error_msg:
                    print(f"  ⚠ Warning: {str(e)} (continuing...)")
                else:
                    print(f"  ✗ Error: {str(e)}")
                    raise
        
        print("\n" + "="*60)
        print("✓ Migration completed successfully!")
        print("="*60)
        
        # Verify tables
        print("\nVerifying tables...")
        
        cursor.execute("SHOW TABLES LIKE 'booking_participants'")
        result = cursor.fetchone()
        print(f"  booking_participants: {'✓ exists' if result else '✗ not found'}")
        
        cursor.execute("SHOW TABLES LIKE 'tour_assignments'")
        result = cursor.fetchone()
        print(f"  tour_assignments: {'✓ exists' if result else '✗ not found'}")
        
        cursor.execute("SHOW TABLES LIKE 'tour_progress'")
        result = cursor.fetchone()
        print(f"  tour_progress: {'✓ exists' if result else '✗ not found'}")
        
        cursor.close()
        connection.close()
        
        return True
        
    except Error as e:
        print(f"\n✗ Database error: {str(e)}")
        return False
    except Exception as e:
        print(f"\n✗ Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    print("="*60)
    print("Tour Features Migration")
    print("="*60)
    
    success = run_migration()
    
    if success:
        print("\n✓ All done! You can now use the new tour features.")
        sys.exit(0)
    else:
        print("\n✗ Migration failed. Please check the errors above.")
        sys.exit(1)
