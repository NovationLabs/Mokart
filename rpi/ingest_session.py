#!/usr/bin/env python3
"""Ingestion d'une session enregistrée (GNSS + IMU) dans la base Mokart.

Crée une ligne `sessions` et insère les points dans `sensor_data` (uwb_x/uwb_y =
position projetée en mètres, imu_*, steering_angle). La session devient lisible
par le HUD téléphone : /hud/<session_id>.

Fusionne optionnellement un CSV IMU au GNSS via la colonne `heure` (HH:MM:SS.mmm),
pour obtenir de vraies G-force en plus de la position/vitesse GPS.

Stdlib pure (aucune dépendance) — tourne sur le RPi comme sur un poste.
Deux modes : direct (psycopg2) ou --emit-sql (pipe vers psql).

Exemples :
  python ingest_session.py data/gnss_20260719_141853.csv --imu data/imu_20260719_141915.csv \\
      --origin 43.4046596,6.0123885 --kart "Sodi RT8 #7" --emit-sql | \\
      docker compose exec -T db psql -U mokart -d mokart
"""
import argparse
import csv
import math
import os
import sys
import uuid

R_LAT = 110540.0
R_LON = 111320.0


def parse_heure(s):
    """'14:19:11.895' -> secondes depuis minuit (float)."""
    try:
        h, m, rest = s.split(":")
        return int(h) * 3600 + int(m) * 60 + float(rest)
    except Exception:
        return None


def get(row, *names):
    """Première colonne existante parmi names (tolère les unités ex. 'ax(g)')."""
    for n in names:
        if n in row and row[n] not in ("", None):
            return row[n]
    return None


def load_gnss(path):
    rows = []
    with open(path) as f:
        for r in csv.DictReader(f):
            try:
                lat = float(r["lat"]); lon = float(r["lon"])
            except (ValueError, KeyError):
                continue
            spd = get(r, "speed_kmh", "speed")
            rows.append({
                "sec": parse_heure(r.get("heure", "")),
                "lat": lat, "lon": lon,
                "speed": float(spd) if spd else None,
                "heading": (lambda v: float(v) if v else None)(get(r, "heading_deg")),
            })
    return rows


def load_imu(path):
    rows = []
    with open(path) as f:
        for r in csv.DictReader(f):
            sec = parse_heure(r.get("heure", ""))
            if sec is None:
                continue
            def g(*n):
                v = get(r, *n)
                return float(v) if v not in (None, "") else None
            rows.append({
                "sec": sec,
                "ax": g("ax(g)", "ax"), "ay": g("ay(g)", "ay"), "az": g("az(g)", "az"),
                "gx": g("gx(deg/s)", "gx"), "gy": g("gy(deg/s)", "gy"), "gz": g("gz(deg/s)", "gz"),
            })
    rows.sort(key=lambda x: x["sec"])
    return rows


def nearest_imu(imu, sec, tol=0.3):
    """Recherche binaire de la ligne IMU la plus proche en temps (<= tol s)."""
    if not imu or sec is None:
        return None
    lo, hi = 0, len(imu) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if imu[mid]["sec"] < sec:
            lo = mid + 1
        else:
            hi = mid
    best = imu[lo]
    for j in (lo - 1, lo + 1):
        if 0 <= j < len(imu) and abs(imu[j]["sec"] - sec) < abs(best["sec"] - sec):
            best = imu[j]
    return best if abs(best["sec"] - sec) <= tol else None


def build_rows(gnss, imu, origin, rate):
    if origin:
        lat0, lon0 = origin
    else:
        lat0 = sum(r["lat"] for r in gnss) / len(gnss)
        lon0 = sum(r["lon"] for r in gnss) / len(gnss)
    klon = math.cos(math.radians(lat0)) * R_LON

    step_ms = int(1000 / rate)
    base = 1700000000000
    out = []
    matched = 0
    for i, r in enumerate(gnss):
        x = (r["lon"] - lon0) * klon
        y = (r["lat"] - lat0) * R_LAT
        m = nearest_imu(imu, r["sec"]) if imu else None
        if m:
            matched += 1
        ax = m["ax"] if m else None
        ay = m["ay"] if m else None
        az = m["az"] if m else None
        gx = m["gx"] if m else None
        gy = m["gy"] if m else None
        gz = m["gz"] if m else None
        steer = gz  # yaw rate ~ direction
        out.append((base + i * step_ms, x, y, ax, ay, az, gx, gy, gz, steer))
    if imu:
        print(f"🔗 IMU fusionné : {matched}/{len(gnss)} points GNSS appariés", file=sys.stderr)
    return out


def emit_sql(session_id, args, rows):
    def num(v):
        return "NULL" if v is None or (isinstance(v, float) and math.isnan(v)) else f"{v:.4f}"
    cid = f"'{args.circuit_id}'" if args.circuit_id else "NULL"
    print(f"INSERT INTO sessions (id, user_id, circuit_id, kart, created_at) "
          f"VALUES ('{session_id}', '{args.user_id}', {cid}, '{args.kart.replace(chr(39), chr(39)*2)}', NOW()) "
          f"ON CONFLICT DO NOTHING;")
    print("INSERT INTO sensor_data (session_id, timestamp, uwb_x, uwb_y, imu_ax, imu_ay, imu_az, imu_gx, imu_gy, imu_gz, steering_angle) VALUES")
    vals = [f"('{session_id}', {int(ts)}, {num(x)}, {num(y)}, {num(ax)}, {num(ay)}, {num(az)}, {num(gx)}, {num(gy)}, {num(gz)}, {num(st)})"
            for (ts, x, y, ax, ay, az, gx, gy, gz, st) in rows]
    print(",\n".join(vals) + "\nON CONFLICT DO NOTHING;")


def insert_db(session_id, args, rows):
    try:
        import psycopg2
        from psycopg2.extras import execute_values
    except ImportError:
        sys.exit("psycopg2 requis pour le mode direct — `pip install psycopg2-binary` ou --emit-sql")
    db = args.db or f"postgresql://{os.environ.get('DB_USER','user')}:{os.environ.get('DB_PASSWORD','password')}@{os.environ.get('DB_HOST','localhost')}:5432/{os.environ.get('DB_NAME','name')}"
    conn = psycopg2.connect(db)
    try:
        cur = conn.cursor()
        cur.execute("INSERT INTO sessions (id, user_id, circuit_id, kart, created_at) VALUES (%s,%s,%s,%s,NOW()) ON CONFLICT DO NOTHING",
                    (session_id, args.user_id, args.circuit_id, args.kart))
        clean = [(session_id, int(ts), x, y, ax, ay, az, gx, gy, gz, st)
                 for (ts, x, y, ax, ay, az, gx, gy, gz, st) in rows]
        execute_values(cur,
            "INSERT INTO sensor_data (session_id, timestamp, uwb_x, uwb_y, imu_ax, imu_ay, imu_az, imu_gx, imu_gy, imu_gz, steering_angle) VALUES %s ON CONFLICT DO NOTHING",
            clean)
        conn.commit()
    finally:
        conn.close()


def main():
    p = argparse.ArgumentParser(description="Ingestion GNSS(+IMU) d'une session dans Mokart.")
    p.add_argument("csv", help="CSV GNSS (lat, lon, speed_kmh, heure)")
    p.add_argument("--imu", default=None, help="CSV IMU à fusionner (ax(g), gz(deg/s), heure)")
    p.add_argument("--session-id", default=None)
    p.add_argument("--circuit-id", default=None)
    p.add_argument("--user-id", default="550e8400-e29b-41d4-a716-446655440001")
    p.add_argument("--kart", default="Session GPS")
    p.add_argument("--rate", type=float, default=10.0)
    p.add_argument("--origin", default=None, help="lat,lon origine projection (aligne avec le circuit)")
    p.add_argument("--emit-sql", action="store_true")
    p.add_argument("--db", default=os.environ.get("DATABASE_URL"))
    args = p.parse_args()

    gnss = load_gnss(args.csv)
    if not gnss:
        sys.exit("Aucun point GNSS lisible.")
    imu = load_imu(args.imu) if args.imu else None
    origin = None
    if args.origin:
        lat0, lon0 = (float(v) for v in args.origin.split(","))
        origin = (lat0, lon0)

    session_id = args.session_id or str(uuid.uuid4())
    rows = build_rows(gnss, imu, origin, args.rate)
    print(f"📄 {os.path.basename(args.csv)} : {len(rows)} points", file=sys.stderr)

    if args.emit_sql:
        emit_sql(session_id, args, rows)
    else:
        insert_db(session_id, args, rows)

    print(f"✅ Session {session_id} — {len(rows)} points", file=sys.stderr)
    print(f"🔗 HUD : /hud/{session_id}", file=sys.stderr)


if __name__ == "__main__":
    main()
