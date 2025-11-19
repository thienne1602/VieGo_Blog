"""Kiểm tra schema của bảng locations và tours"""
import pymysql

conn = pymysql.connect(
    host='localhost',
    user='root',
    password='',
    database='viego_blog',
    charset='utf8mb4',
    cursorclass=pymysql.cursors.DictCursor
)

cursor = conn.cursor()

print("=== LOCATIONS TABLE ===")
cursor.execute("DESCRIBE locations")
for col in cursor.fetchall():
    print(f"  {col['Field']}: {col['Type']}")

print("\n=== TOURS TABLE ===")
cursor.execute("DESCRIBE tours")
for col in cursor.fetchall():
    print(f"  {col['Field']}: {col['Type']}")

conn.close()

