"""
Migration script to create tour member location tracking tables
Run this script to add the necessary tables for realtime location tracking
"""

import sys
import os

# Add backend directory to path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, '.env'))

import pymysql
pymysql.install_as_MySQLdb()

from flask import Flask
from flask_sqlalchemy import SQLAlchemy

# Create Flask app
app = Flask(__name__)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = (
    f"mysql://{os.getenv('DB_USER', 'root')}:"
    f"{os.getenv('DB_PASSWORD', '')}@"
    f"{os.getenv('DB_HOST', 'localhost')}:"
    f"{os.getenv('DB_PORT', '3306')}/"
    f"{os.getenv('DB_NAME', 'viego_blog')}"
    f"?charset=utf8mb4"
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)


def migrate():
    """Create tour member location tracking tables"""
    
    # SQL statements for creating tables
    sql_statements = [
        # Tour Member Locations table - stores current location of each member
        """
        CREATE TABLE IF NOT EXISTS tour_member_locations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            booking_id INT NOT NULL,
            user_id INT NULL,
            participant_id INT NULL,
            member_type ENUM('tour_guide', 'participant', 'leader') DEFAULT 'participant',
            member_name VARCHAR(255) NOT NULL,
            
            -- Location data
            latitude DOUBLE NOT NULL,
            longitude DOUBLE NOT NULL,
            accuracy FLOAT NULL COMMENT 'GPS accuracy in meters',
            altitude FLOAT NULL COMMENT 'Altitude in meters',
            heading FLOAT NULL COMMENT 'Direction 0-360 degrees',
            speed FLOAT NULL COMMENT 'Speed in m/s',
            
            -- Metadata
            location_source ENUM('gps', 'network', 'manual') DEFAULT 'gps',
            battery_level TINYINT UNSIGNED NULL COMMENT 'Battery percentage 0-100',
            
            -- Status
            is_active BOOLEAN DEFAULT TRUE,
            is_sos BOOLEAN DEFAULT FALSE COMMENT 'Emergency SOS flag',
            sos_message TEXT NULL,
            
            -- Timestamps
            location_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'When captured on device',
            server_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'When received by server',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            
            -- Foreign keys
            CONSTRAINT fk_member_loc_booking FOREIGN KEY (booking_id) 
                REFERENCES bookings(id) ON DELETE CASCADE,
            CONSTRAINT fk_member_loc_user FOREIGN KEY (user_id) 
                REFERENCES users(id) ON DELETE CASCADE,
            CONSTRAINT fk_member_loc_participant FOREIGN KEY (participant_id) 
                REFERENCES booking_participants(id) ON DELETE CASCADE,
            
            -- Indexes
            INDEX idx_booking_active (booking_id, is_active),
            INDEX idx_user_booking (user_id, booking_id),
            INDEX idx_location_time (booking_id, location_timestamp),
            INDEX idx_sos (booking_id, is_sos)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        COMMENT='Realtime location tracking for tour members';
        """,
        
        # Tour Location History table - stores historical location data
        """
        CREATE TABLE IF NOT EXISTS tour_location_history (
            id INT AUTO_INCREMENT PRIMARY KEY,
            member_location_id INT NOT NULL,
            booking_id INT NOT NULL,
            
            -- Member identification (denormalized)
            user_id INT NULL,
            participant_id INT NULL,
            member_type VARCHAR(20) NOT NULL,
            
            -- Location data
            latitude DOUBLE NOT NULL,
            longitude DOUBLE NOT NULL,
            accuracy FLOAT NULL,
            altitude FLOAT NULL,
            heading FLOAT NULL,
            speed FLOAT NULL,
            
            -- Timestamp
            recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            
            -- Foreign keys
            CONSTRAINT fk_history_member_loc FOREIGN KEY (member_location_id) 
                REFERENCES tour_member_locations(id) ON DELETE CASCADE,
            CONSTRAINT fk_history_booking FOREIGN KEY (booking_id) 
                REFERENCES bookings(id) ON DELETE CASCADE,
            
            -- Indexes
            INDEX idx_history_booking_time (booking_id, recorded_at),
            INDEX idx_history_member_time (member_location_id, recorded_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        COMMENT='Historical location data for route tracking';
        """,
        
        # Tour Geofences table - defines safety zones and checkpoints
        """
        CREATE TABLE IF NOT EXISTS tour_geofences (
            id INT AUTO_INCREMENT PRIMARY KEY,
            booking_id INT NOT NULL,
            
            -- Geofence details
            name VARCHAR(255) NOT NULL,
            description TEXT NULL,
            
            -- Center point
            center_latitude DOUBLE NOT NULL,
            center_longitude DOUBLE NOT NULL,
            
            -- Radius in meters
            radius FLOAT NOT NULL DEFAULT 500,
            
            -- Type
            fence_type ENUM('checkpoint', 'safety_zone', 'restricted', 'meeting_point') DEFAULT 'safety_zone',
            
            -- Status and alerts
            is_active BOOLEAN DEFAULT TRUE,
            alert_on_exit BOOLEAN DEFAULT TRUE,
            alert_on_enter BOOLEAN DEFAULT FALSE,
            
            -- Time constraints
            start_time DATETIME NULL,
            end_time DATETIME NULL,
            
            -- Metadata
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_by INT NULL,
            
            -- Foreign keys
            CONSTRAINT fk_geofence_booking FOREIGN KEY (booking_id) 
                REFERENCES bookings(id) ON DELETE CASCADE,
            CONSTRAINT fk_geofence_creator FOREIGN KEY (created_by) 
                REFERENCES users(id) ON DELETE SET NULL,
            
            -- Indexes
            INDEX idx_geofence_booking (booking_id, is_active),
            INDEX idx_geofence_time (booking_id, start_time, end_time)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        COMMENT='Geofence areas for tour safety monitoring';
        """,
        
        # Tour Location Alerts table - stores alerts for geofence violations and SOS
        """
        CREATE TABLE IF NOT EXISTS tour_location_alerts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            booking_id INT NOT NULL,
            member_location_id INT NULL,
            geofence_id INT NULL,
            
            -- Alert details
            alert_type ENUM('geofence_exit', 'geofence_enter', 'sos', 'low_battery', 'inactive', 'stale_location') NOT NULL,
            severity ENUM('info', 'warning', 'danger', 'critical') DEFAULT 'warning',
            message TEXT NOT NULL,
            
            -- Location at time of alert
            latitude DOUBLE NULL,
            longitude DOUBLE NULL,
            
            -- Status
            is_acknowledged BOOLEAN DEFAULT FALSE,
            acknowledged_by INT NULL,
            acknowledged_at DATETIME NULL,
            is_resolved BOOLEAN DEFAULT FALSE,
            resolved_by INT NULL,
            resolved_at DATETIME NULL,
            resolution_notes TEXT NULL,
            
            -- Timestamps
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            
            -- Foreign keys
            CONSTRAINT fk_alert_booking FOREIGN KEY (booking_id) 
                REFERENCES bookings(id) ON DELETE CASCADE,
            CONSTRAINT fk_alert_member_loc FOREIGN KEY (member_location_id) 
                REFERENCES tour_member_locations(id) ON DELETE SET NULL,
            CONSTRAINT fk_alert_geofence FOREIGN KEY (geofence_id) 
                REFERENCES tour_geofences(id) ON DELETE SET NULL,
            CONSTRAINT fk_alert_ack_by FOREIGN KEY (acknowledged_by) 
                REFERENCES users(id) ON DELETE SET NULL,
            CONSTRAINT fk_alert_resolved_by FOREIGN KEY (resolved_by) 
                REFERENCES users(id) ON DELETE SET NULL,
            
            -- Indexes
            INDEX idx_alert_booking (booking_id, is_resolved),
            INDEX idx_alert_type (booking_id, alert_type),
            INDEX idx_alert_time (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        COMMENT='Alerts for location-related events';
        """
    ]
    
    with app.app_context():
        connection = db.engine.raw_connection()
        cursor = connection.cursor()
        
        try:
            for sql in sql_statements:
                # Clean up the SQL statement
                sql = sql.strip()
                if sql:
                    print(f"Executing: {sql[:80]}...")
                    cursor.execute(sql)
            
            connection.commit()
            print("\n[OK] Successfully created tour location tracking tables!")
            print("Tables created:")
            print("  - tour_member_locations (current location of each member)")
            print("  - tour_location_history (historical location data)")
            print("  - tour_geofences (safety zones and checkpoints)")
            print("  - tour_location_alerts (alerts for violations and SOS)")
            
        except Exception as e:
            connection.rollback()
            print(f"\n[ERROR] Migration failed: {str(e)}")
            raise
        finally:
            cursor.close()
            connection.close()


def rollback():
    """Remove tour location tracking tables"""
    
    sql_statements = [
        "DROP TABLE IF EXISTS tour_location_alerts;",
        "DROP TABLE IF EXISTS tour_location_history;",
        "DROP TABLE IF EXISTS tour_geofences;",
        "DROP TABLE IF EXISTS tour_member_locations;"
    ]
    
    with app.app_context():
        connection = db.engine.raw_connection()
        cursor = connection.cursor()
        
        try:
            for sql in sql_statements:
                print(f"Executing: {sql}")
                cursor.execute(sql)
            
            connection.commit()
            print("\n[OK] Successfully rolled back tour location tracking tables!")
            
        except Exception as e:
            connection.rollback()
            print(f"\n[ERROR] Rollback failed: {str(e)}")
            raise
        finally:
            cursor.close()
            connection.close()


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Migrate tour location tracking tables')
    parser.add_argument('--rollback', action='store_true', help='Rollback migration')
    args = parser.parse_args()
    
    if args.rollback:
        rollback()
    else:
        migrate()
