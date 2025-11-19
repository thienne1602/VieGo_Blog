import mysql.connector

# Database connection
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'viego_blog'
}

try:
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    
    # Check bookings table structure
    print("Checking 'bookings' table structure:")
    cursor.execute("DESCRIBE bookings")
    columns = cursor.fetchall()
    
    print("\nColumn names in 'bookings' table:")
    for col in columns:
        print(f"   - {col[0]} ({col[1]})")
    
    # Check if we have booking_date or date column
    column_names = [col[0] for col in columns]
    if 'booking_date' in column_names:
        print("\n✅ Table uses 'booking_date' column")
    elif 'date' in column_names:
        print("\n✅ Table uses 'date' column")
    else:
        print("\n⚠️ No 'booking_date' or 'date' column found!")
    
    # Check actual data in booking #26
    print("\n\nActual data for Booking #26:")
    cursor.execute("SELECT * FROM bookings WHERE id = 26")
    booking = cursor.fetchone()
    
    if booking:
        col_names = [desc[0] for desc in cursor.description]
        print("\nBooking #26 fields:")
        for i, col_name in enumerate(col_names):
            print(f"   {col_name}: {booking[i]}")
    else:
        print("   ❌ Booking #26 not found!")
    
    cursor.close()
    conn.close()
    
except mysql.connector.Error as err:
    print(f"❌ Database error: {err}")
