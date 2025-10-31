#!/usr/bin/env python3
"""
Add missing columns to comments table if they don't exist.
Idempotent and safe for development environments.
"""
import pymysql
import os

DB_CONFIG = {
    'host': os.environ.get('DB_HOST', 'localhost'),
    'user': os.environ.get('DB_USER', 'root'),
    'password': os.environ.get('DB_PASSWORD', ''),
    'database': os.environ.get('DB_NAME', 'viego_blog'),
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

ADDITIONS = [
    ("level", "INT DEFAULT 0"),
    ("likes_count", "INT DEFAULT 0"),
    ("replies_count", "INT DEFAULT 0"),
    ("flagged", "BOOLEAN DEFAULT FALSE"),
    ("flag_reason", "VARCHAR(255)"),
    ("translated_content", "TEXT"),
    ("language", "VARCHAR(10) DEFAULT 'vi'")
]


def column_exists(cursor, table, column):
    cursor.execute("SHOW COLUMNS FROM `{}` LIKE %s".format(table), (column,))
    return cursor.fetchone() is not None


def main():
    conn = pymysql.connect(**DB_CONFIG)
    try:
        with conn.cursor() as cursor:
            for col, definition in ADDITIONS:
                if column_exists(cursor, 'comments', col):
                    print(f"Column '{col}' already exists in comments")
                else:
                    sql = f"ALTER TABLE comments ADD COLUMN `{col}` {definition};"
                    print(f"Adding column: {col} -> {definition}")
                    cursor.execute(sql)
            conn.commit()
            print("✅ Comments table updated successfully")
    except Exception as e:
        print(f"❌ Error updating comments table: {e}")
    finally:
        conn.close()


if __name__ == '__main__':
    main()
