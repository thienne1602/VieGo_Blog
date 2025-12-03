import os
import sys
from main import app, db

def init_db():
    """Initialize the database tables on the configured database."""
    print("Initializing database...")
    
    # Print the database host we are connecting to (masking password)
    uri = app.config['SQLALCHEMY_DATABASE_URI']
    if '@' in uri:
        print(f"Connecting to: {uri.split('@')[1]}")
    else:
        print(f"Connecting to: {uri}")

    with app.app_context():
        try:
            print("Creating tables...")
            db.create_all()
            print("✅ Tables created successfully!")
        except Exception as e:
            print(f"❌ Error creating tables: {e}")
            sys.exit(1)

if __name__ == "__main__":
    init_db()
