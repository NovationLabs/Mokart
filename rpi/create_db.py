#!/usr/bin/env python3
import sqlite3
import time

DB_PATH = "mokart.db"

db = sqlite3.connect(DB_PATH)
query = db.cursor()

query.executescript("""
    CREATE TABLE IF NOT EXISTS imu_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts REAL,
        ax REAL, ay REAL, az REAL,
        gx REAL, gy REAL, gz REAL,
        roll REAL, pitch REAL, yaw REAL
    );

    CREATE TABLE IF NOT EXISTS gps_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts REAL,
        lat REAL,
        lon REAL,
        alt REAL,
        fix INTEGER,
        speed REAL
    );
""")
db.commit()

query.executemany(
    "INSERT INTO imu_data (ts, ax, ay, az, gx, gy, gz, roll, pitch, yaw) VALUES (?,?,?,?,?,?,?,?,?,?)",
    [(time.time(), 99.99, 99.99, 99.99, 99.99, 99.99, 99.99, 99.99, 99.99, 99.99)]
)

query.executemany(
    "INSERT INTO gps_data (ts, lat, lon, alt, fix, speed) VALUES (?,?,?,?,?,?)",
    [(time.time(), 99.9999, 99.9999, 9999.0, 99, 99.99)]
)

db.commit()

print(f"[mokart] DB créée : {DB_PATH}")
print(f"  imu_data  → {query.execute('SELECT COUNT(*) FROM imu_data').fetchone()[0]} row(s)")
print(f"  gps_data  → {query.execute('SELECT COUNT(*) FROM gps_data').fetchone()[0]} row(s)")

db.close()
