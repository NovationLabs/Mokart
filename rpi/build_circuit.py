#!/usr/bin/env python3
"""Reconstruit un circuit à partir de positions GPS multi-tours (rpi/data/*.csv).

Chaque session GNSS contient ~5 tours. On détecte les tours (porte = point le
plus rapide, franchi à chaque tour), on rééchantillonne chaque tour par longueur
d'arc, on moyenne tous les tours valides (réduit le bruit GPS) pour obtenir une
ligne centrale lissée, puis on génère les bordures gauche/droite par décalage
normal (± demi-largeur de piste).

Stdlib pure (aucune dépendance) — tourne sur le RPi comme sur un poste.

Sorties :
  - CSV format HELP (trajectoire / bordure_exterieure / bordure_interieure),
    réutilisable avec HELP/point_editor.py
  - preview SVG
  - SQL (--emit-sql) à injecter en base : circuits + circuit_boundaries

Exemples :
  python build_circuit.py data/gnss_*.csv --name "SpeedKart Hyères" --width 8
  python build_circuit.py data/gnss_20260719_160951.csv --emit-sql | \\
      docker compose exec -T db psql -U mokart -d mokart
"""
import argparse
import csv
import glob
import math
import os
import sys
import uuid

R_LAT = 110540.0
R_LON = 111320.0


def load_gnss(path):
    rows = []
    with open(path) as f:
        for r in csv.DictReader(f):
            try:
                lat = float(r["lat"]); lon = float(r["lon"])
            except (ValueError, KeyError):
                continue
            spd = r.get("speed_kmh")
            try:
                spd = float(spd)
            except (TypeError, ValueError):
                spd = float("nan")
            rows.append((lat, lon, spd))
    return rows


def detect_laps(pts, spd):
    """Retourne la liste des tours [ (start_idx, end_idx) ] via porte vitesse-max."""
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    diag = math.hypot(max(xs) - min(xs), max(ys) - min(ys))
    thr = diag * 0.05
    # Porte = point le plus rapide (sur une ligne droite → franchi chaque tour)
    gi = max(range(len(pts)), key=lambda i: (spd[i] if spd[i] == spd[i] else -1.0))
    gx, gy = pts[gi]
    cross = []
    armed = True
    for i, (x, y) in enumerate(pts):
        d = math.hypot(x - gx, y - gy)
        if d > thr * 1.6:
            armed = True
        elif armed and d < thr and (not cross or i - cross[-1] > 50):
            cross.append(i); armed = False
    return [(cross[i], cross[i + 1]) for i in range(len(cross) - 1)]


def resample_loop(loop, k):
    """Rééchantillonne une polyligne en k points équidistants (longueur d'arc)."""
    seg = [0.0]
    for i in range(1, len(loop)):
        seg.append(seg[-1] + math.hypot(loop[i][0] - loop[i - 1][0], loop[i][1] - loop[i - 1][1]))
    total = seg[-1]
    if total == 0:
        return [loop[0]] * k
    out = []
    j = 0
    for m in range(k):
        target = total * m / k
        while j < len(seg) - 2 and seg[j + 1] < target:
            j += 1
        span = seg[j + 1] - seg[j]
        f = (target - seg[j]) / span if span > 0 else 0.0
        x = loop[j][0] + f * (loop[j + 1][0] - loop[j][0])
        y = loop[j][1] + f * (loop[j + 1][1] - loop[j][1])
        out.append((x, y))
    return out


def smooth_closed(loop, win=5):
    n = len(loop); h = win // 2
    out = []
    for i in range(n):
        sx = sy = 0.0
        for d in range(-h, h + 1):
            p = loop[(i + d) % n]
            sx += p[0]; sy += p[1]
        out.append((sx / win, sy / win))
    return out


def offset_boundaries(center, half_w):
    """Bordures gauche/droite = centerline décalée de ±half_w le long de la normale."""
    n = len(center)
    left = []; right = []
    for i in range(n):
        ax, ay = center[(i - 1) % n]
        bx, by = center[(i + 1) % n]
        tx, ty = bx - ax, by - ay
        norm = math.hypot(tx, ty) or 1.0
        nx, ny = -ty / norm, tx / norm  # normale unitaire
        cx, cy = center[i]
        left.append((cx + nx * half_w, cy + ny * half_w))
        right.append((cx - nx * half_w, cy - ny * half_w))
    return left, right


def build(files, k, width, min_lap_ratio):
    # Origine partagée = moyenne de tous les points (repère mètres commun)
    all_rows = []
    for path in files:
        all_rows.extend(load_gnss(path))
    if not all_rows:
        sys.exit("Aucun point GPS lisible.")
    lat0 = sum(r[0] for r in all_rows) / len(all_rows)
    lon0 = sum(r[1] for r in all_rows) / len(all_rows)
    klon = math.cos(math.radians(lat0)) * R_LON

    def project(rows):
        return [((lon - lon0) * klon, (lat - lat0) * R_LAT) for lat, lon, _ in rows]

    resampled = []
    total_laps = 0
    for path in files:
        rows = load_gnss(path)
        pts = project(rows); spd = [r[2] for r in rows]
        laps = detect_laps(pts, spd)
        if not laps:
            print(f"⚠️  {os.path.basename(path)} : aucun tour détecté", file=sys.stderr)
            continue
        lengths = sorted(b - a for a, b in laps)
        median = lengths[len(lengths) // 2]
        for a, b in laps:
            if (b - a) < median * min_lap_ratio:
                continue  # rejette out-lap / faux franchissement
            resampled.append(resample_loop(pts[a:b + 1], k))
            total_laps += 1
        print(f"✅ {os.path.basename(path)} : {len(laps)} tours détectés, "
              f"{sum(1 for a,b in laps if (b-a)>=median*min_lap_ratio)} retenus (médiane {median} pts)",
              file=sys.stderr)

    if not resampled:
        sys.exit("Aucun tour valide pour reconstruire le circuit.")

    # Moyenne des tours alignés par index de rééchantillonnage
    center = []
    for m in range(k):
        sx = sum(lap[m][0] for lap in resampled) / len(resampled)
        sy = sum(lap[m][1] for lap in resampled) / len(resampled)
        center.append((sx, sy))
    center = smooth_closed(center, win=5)
    left, right = offset_boundaries(center, width / 2.0)

    print(f"🏁 {total_laps} tours moyennés → centerline {k} pts, largeur {width} m",
          file=sys.stderr)
    return center, left, right, (lat0, lon0)


# ─── Sorties ──────────────────────────────────────────────────────────────────

def write_csv(path, center, left, right):
    with open(path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["# trajectoire"])
        w.writerow(["index", "x", "y"])
        for i, (x, y) in enumerate(center):
            w.writerow([i, round(x, 3), round(y, 3)])
        w.writerow(["# bordure_exterieure"])
        w.writerow(["index", "x", "y"])
        for i, (x, y) in enumerate(left):
            w.writerow([i, round(x, 3), round(y, 3)])
        w.writerow(["# bordure_interieure"])
        w.writerow(["index", "x", "y"])
        for i, (x, y) in enumerate(right):
            w.writerow([i, round(x, 3), round(y, 3)])


def write_svg(path, center, left, right):
    pts = center + left + right
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    minx, maxx, miny, maxy = min(xs), max(xs), min(ys), max(ys)
    pad = max(maxx - minx, maxy - miny) * 0.05
    w = (maxx - minx) + 2 * pad; h = (maxy - miny) + 2 * pad

    def poly(loop, close=True):
        d = " ".join(f"{x:.2f},{y:.2f}" for x, y in loop)
        if close and loop:
            d += f" {loop[0][0]:.2f},{loop[0][1]:.2f}"
        return d

    # flip Y (nord en haut)
    svg = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{minx-pad:.1f} {miny-pad:.1f} {w:.1f} {h:.1f}">',
        f'<rect x="{minx-pad:.1f}" y="{miny-pad:.1f}" width="{w:.1f}" height="{h:.1f}" fill="#0d0f12"/>',
        f'<g transform="matrix(1 0 0 -1 0 {miny+maxy:.2f})">',
        f'<polyline points="{poly(left)}" fill="none" stroke="#ff5c5c" stroke-width="0.6"/>',
        f'<polyline points="{poly(right)}" fill="none" stroke="#22d3ee" stroke-width="0.6"/>',
        f'<polyline points="{poly(center)}" fill="none" stroke="#7bf8ac" stroke-width="0.5" stroke-dasharray="2 2"/>',
        f'<circle cx="{center[0][0]:.2f}" cy="{center[0][1]:.2f}" r="{max(w,h)*0.012:.2f}" fill="#fff"/>',
        '</g></svg>',
    ]
    with open(path, "w") as f:
        f.write("\n".join(svg))


def emit_sql(circuit_id, name, center, left, right):
    def esc(s): return s.replace("'", "''")
    out = []
    out.append(f"DELETE FROM circuits WHERE name = '{esc(name)}';")
    out.append("INSERT INTO circuits (id, name, description) VALUES "
               f"('{circuit_id}', '{esc(name)}', 'Reconstruit depuis GPS multi-tours');")
    vals = []
    for i, (x, y) in enumerate(left):
        vals.append(f"('{circuit_id}', 'left', {i}, {x:.3f}, {y:.3f})")
    for i, (x, y) in enumerate(right):
        vals.append(f"('{circuit_id}', 'right', {i}, {x:.3f}, {y:.3f})")
    out.append("INSERT INTO circuit_boundaries (circuit_id, side, point_order, x, y) VALUES\n"
               + ",\n".join(vals) + ";")
    # centerline stockée comme trajectoire optimale de départ (l'algo scipy peut la recalculer)
    tvals = [f"('{circuit_id}', {i}, {x:.3f}, {y:.3f})" for i, (x, y) in enumerate(center)]
    out.append("INSERT INTO optimal_trajectories (circuit_id, point_order, x, y) VALUES\n"
               + ",\n".join(tvals) + ";")
    return "\n".join(out)


def main():
    p = argparse.ArgumentParser(description="Reconstruit un circuit depuis des positions GPS multi-tours.")
    p.add_argument("files", nargs="+", help="CSV GNSS (glob accepté)")
    p.add_argument("--name", default="SpeedKart Hyères (GPS)", help="Nom du circuit")
    p.add_argument("--points", type=int, default=200, help="Nb de points de la centerline")
    p.add_argument("--width", type=float, default=8.0, help="Largeur de piste (m) pour les bordures")
    p.add_argument("--min-lap-ratio", type=float, default=0.6, help="Rejette les tours < ratio×médiane")
    p.add_argument("--out-csv", default=None, help="Chemin CSV de sortie (format HELP)")
    p.add_argument("--out-svg", default=None, help="Chemin SVG preview")
    p.add_argument("--circuit-id", default=None, help="UUID circuit (défaut: généré)")
    p.add_argument("--emit-sql", action="store_true", help="Écrit le SQL sur stdout")
    args = p.parse_args()

    files = []
    for pat in args.files:
        files.extend(sorted(glob.glob(pat)) or [pat])

    center, left, right, origin = build(files, args.points, args.width, args.min_lap_ratio)

    base = os.path.dirname(files[0]) or "."
    out_csv = args.out_csv or os.path.join(base, "circuit_reconstructed.csv")
    out_svg = args.out_svg or os.path.join(base, "circuit_reconstructed.svg")
    write_csv(out_csv, center, left, right)
    write_svg(out_svg, center, left, right)
    print(f"📄 CSV  : {out_csv}", file=sys.stderr)
    print(f"🖼️  SVG  : {out_svg}", file=sys.stderr)
    print(f"📍 origine (lat,lon) = {origin[0]:.7f},{origin[1]:.7f}", file=sys.stderr)

    circuit_id = args.circuit_id or str(uuid.uuid4())
    if args.emit_sql:
        print(emit_sql(circuit_id, args.name, center, left, right))
    print(f"🆔 circuit_id = {circuit_id}", file=sys.stderr)


if __name__ == "__main__":
    main()
