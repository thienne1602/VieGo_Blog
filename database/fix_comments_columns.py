#!/usr/bin/env python3
"""
Idempotent fixes for comments table:
- Ensure `status` ENUM('pending','approved','rejected','spam') exists (default 'approved')
- Ensure `author_id` column exists and copy data from `user_id` if present
- Copy `like_count` -> `likes_count` if needed
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


def column_exists(cursor, table, column):
    cursor.execute("SHOW COLUMNS FROM `{}` LIKE %s".format(table), (column,))
    return cursor.fetchone() is not None


def main():
    conn = pymysql.connect(**DB_CONFIG)
    try:
        with conn.cursor() as cursor:
            # 1) Add status if missing
            if not column_exists(cursor, 'comments', 'status'):
                print("Adding 'status' column (ENUM) to comments")
                cursor.execute("ALTER TABLE comments ADD COLUMN status ENUM('pending','approved','rejected','spam') DEFAULT 'approved'")
            else:
                print("Column 'status' already exists")

            # 2) Add author_id if missing and copy from user_id
            if not column_exists(cursor, 'comments', 'author_id'):
                print("Adding 'author_id' column to comments")
                cursor.execute("ALTER TABLE comments ADD COLUMN author_id INT NULL")
                # Copy data from user_id -> author_id if user_id exists
                if column_exists(cursor, 'comments', 'user_id'):
                    print("Copying data from user_id to author_id")
                    cursor.execute("UPDATE comments SET author_id = user_id WHERE user_id IS NOT NULL")
            else:
                print("Column 'author_id' already exists")

            # 3) If likes_count exists and like_count exists, copy values
            has_like_count = column_exists(cursor, 'comments', 'like_count')
            has_likes_count = column_exists(cursor, 'comments', 'likes_count')
            if has_like_count and has_likes_count:
                print("Migrating values from like_count -> likes_count where appropriate")
                cursor.execute("UPDATE comments SET likes_count = like_count WHERE (likes_count IS NULL OR likes_count = 0) AND like_count IS NOT NULL")
            elif has_like_count and not has_likes_count:
                print("Adding likes_count column and copying from like_count")
                cursor.execute("ALTER TABLE comments ADD COLUMN likes_count INT DEFAULT 0")
                cursor.execute("UPDATE comments SET likes_count = like_count WHERE like_count IS NOT NULL")

            conn.commit()
            print("✅ comments table fixes applied")

            # Show final columns
            cursor.execute("SHOW COLUMNS FROM comments")
            cols = cursor.fetchall()
            import json
            print(json.dumps(cols, indent=2, ensure_ascii=False))

    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()


if __name__ == '__main__':
    main()
