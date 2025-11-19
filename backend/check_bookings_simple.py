import mysql.connector

# Database connection - adjust these if needed
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '',  # Change if you have a password
    'database': 'viego_blog'
}

print(f"Connecting to database: {db_config['database']} at {db_config['host']}")

try:
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    
    # Check user
    print("\n1. Checking user 'ngocthien':")
    cursor.execute("SELECT id, username, role FROM users WHERE username = 'ngocthien'")
    user = cursor.fetchone()
    if user:
        print(f"   ✅ Found: ID={user['id']}, Username={user['username']}, Role={user['role']}")
        user_id = user['id']
    else:
        print("   ❌ User 'ngocthien' not found!")
        exit(1)
    
    # Check bookings for this user
    print(f"\n2. Checking bookings for user_id={user_id}:")
    cursor.execute("""
        SELECT 
            b.id as booking_id,
            b.user_id,
            b.status,
            b.tour_id,
            t.title as tour_title,
            ta.id as assignment_id
        FROM bookings b
        LEFT JOIN tours t ON b.tour_id = t.id
        LEFT JOIN tour_assignments ta ON b.id = ta.booking_id
        WHERE b.user_id = %s
        ORDER BY b.id DESC
    """, (user_id,))
    
    bookings = cursor.fetchall()
    if bookings:
        print(f"   ✅ Found {len(bookings)} booking(s):")
        for b in bookings:
            assignment_status = "✅ Assigned" if b['assignment_id'] else "⏸️  Not assigned"
            print(f"      - Booking #{b['booking_id']}: {b['tour_title']} | Status: {b['status']} | {assignment_status}")
    else:
        print(f"   ❌ No bookings found for user_id={user_id}")
        
        # Check all bookings to see what's in the database
        print("\n3. Checking ALL bookings in database:")
        cursor.execute("""
            SELECT 
                b.id,
                b.user_id,
                u.username,
                b.status
            FROM bookings b
            LEFT JOIN users u ON b.user_id = u.id
            ORDER BY b.id DESC
            LIMIT 10
        """)
        all_bookings = cursor.fetchall()
        if all_bookings:
            print(f"   Found {len(all_bookings)} booking(s) total (showing first 10):")
            for b in all_bookings:
                print(f"      - Booking #{b['id']}: user_id={b['user_id']} ({b['username']}) | Status: {b['status']}")
        else:
            print("   ⚠️ No bookings at all in database!")
    
    cursor.close()
    conn.close()
    print("\n✅ Check completed!")
    
except mysql.connector.Error as err:
    print(f"❌ Database error: {err}")
except Exception as e:
    print(f"❌ Error: {e}")
