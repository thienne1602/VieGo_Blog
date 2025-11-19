"""
Script to verify the tour features migration
"""
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

def verify_migration():
    """Verify that all tables and columns were created correctly"""
    try:
        # Connect to database
        conn = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', ''),
            database=os.getenv('DB_NAME', 'viego_blog')
        )
        cursor = conn.cursor()
        
        print("="*60)
        print("VERIFYING TOUR FEATURES MIGRATION")
        print("="*60)
        
        # Check tables exist
        print("\n1. Checking if tables exist...")
        tables_to_check = ['booking_participants', 'tour_assignments', 'tour_progress']
        
        for table in tables_to_check:
            cursor.execute(f"SHOW TABLES LIKE '{table}'")
            result = cursor.fetchone()
            if result:
                print(f"   ✓ {table}: EXISTS")
            else:
                print(f"   ✗ {table}: NOT FOUND")
        
        # Check booking_participants structure
        print("\n2. Checking booking_participants structure...")
        cursor.execute("DESC booking_participants")
        columns = cursor.fetchall()
        expected_cols = ['full_name', 'gender', 'date_of_birth', 'participant_type', 
                        'phone', 'email', 'emergency_contact_name']
        
        col_names = [col[0] for col in columns]
        for exp_col in expected_cols:
            if exp_col in col_names:
                print(f"   ✓ Column '{exp_col}': exists")
            else:
                print(f"   ✗ Column '{exp_col}': missing")
        
        # Check tour_assignments structure
        print("\n3. Checking tour_assignments structure...")
        cursor.execute("DESC tour_assignments")
        columns = cursor.fetchall()
        expected_cols = ['booking_id', 'tour_guide_id', 'assigned_by', 'status', 'notes']
        
        col_names = [col[0] for col in columns]
        for exp_col in expected_cols:
            if exp_col in col_names:
                print(f"   ✓ Column '{exp_col}': exists")
            else:
                print(f"   ✗ Column '{exp_col}': missing")
        
        # Check tour_progress structure
        print("\n4. Checking tour_progress structure...")
        cursor.execute("DESC tour_progress")
        columns = cursor.fetchall()
        expected_cols = ['booking_id', 'checkpoint_name', 'checkpoint_order', 
                        'status', 'latitude', 'longitude']
        
        col_names = [col[0] for col in columns]
        for exp_col in expected_cols:
            if exp_col in col_names:
                print(f"   ✓ Column '{exp_col}': exists")
            else:
                print(f"   ✗ Column '{exp_col}': missing")
        
        # Check users table for tour_guide role
        print("\n5. Checking users role enum...")
        cursor.execute("SHOW COLUMNS FROM users LIKE 'role'")
        role_col = cursor.fetchone()
        if role_col and 'tour_guide' in str(role_col[1]):
            print(f"   ✓ Role 'tour_guide': added to enum")
        else:
            print(f"   ✗ Role 'tour_guide': NOT in enum")
            print(f"   Current enum: {role_col[1] if role_col else 'N/A'}")
        
        # Count existing data
        print("\n6. Checking existing data...")
        cursor.execute("SELECT COUNT(*) FROM booking_participants")
        count = cursor.fetchone()[0]
        print(f"   booking_participants: {count} records")
        
        cursor.execute("SELECT COUNT(*) FROM tour_assignments")
        count = cursor.fetchone()[0]
        print(f"   tour_assignments: {count} records")
        
        cursor.execute("SELECT COUNT(*) FROM tour_progress")
        count = cursor.fetchone()[0]
        print(f"   tour_progress: {count} records")
        
        cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'tour_guide'")
        count = cursor.fetchone()[0]
        print(f"   tour_guide users: {count} users")
        
        print("\n" + "="*60)
        print("✓ VERIFICATION COMPLETED")
        print("="*60)
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"\n✗ Error during verification: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    verify_migration()
