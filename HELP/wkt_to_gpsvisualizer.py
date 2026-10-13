#!/usr/bin/env python3
"""Convertit des CSV WKT QGIS (MULTIPOINT lon lat) en CSV 2 colonnes
latitude,longitude pour https://www.gpsvisualizer.com/elevation
"""

import argparse
import csv
import re
import sys
from pathlib import Path

WKT_PT = re.compile(r"\(\(([-0-9.eE+]+)\s+([-0-9.eE+]+)\)\)")


def load_wkt_lonlat(path):
    pts = []
    with open(path, newline="") as f:
        reader = csv.reader(f)
        next(reader, None)
        for row in reader:
            if not row:
                continue
            m = WKT_PT.search(row[0])
            if not m:
                continue
            lon, lat = float(m.group(1)), float(m.group(2))
            pts.append((lat, lon))
    return pts


def write_gpsvis(path, pts):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["latitude", "longitude"])
        w.writerows(pts)


def default_out(src):
    return src.with_name(src.stem + "_gpsvisualizer.csv")


def main():
    p = argparse.ArgumentParser(
        description="WKT MULTIPOINT → CSV latitude,longitude (GPS Visualizer)"
    )
    p.add_argument(
        "inputs",
        nargs="*",
        type=Path,
        default=[
            Path.home() / "circuit_out_1.csv",
            Path.home() / "circuit_in_1.csv",
        ],
        help="Fichiers WKT (défaut: ~/circuit_out_1.csv ~/circuit_in_1.csv)",
    )
    p.add_argument(
        "-o",
        "--output",
        type=Path,
        help="Un seul CSV de sortie (concatène tous les inputs, 2 colonnes)",
    )
    p.add_argument(
        "-d",
        "--outdir",
        type=Path,
        help="Dossier de sortie (un CSV par fichier d'entrée)",
    )
    args = p.parse_args()

    all_pts = []
    for src in args.inputs:
        if not src.is_file():
            sys.exit(f"Fichier introuvable: {src}")
        pts = load_wkt_lonlat(src)
        if not pts:
            sys.exit(f"Aucun point WKT dans: {src}")
        all_pts.append((src, pts))
        print(f"{src.name}: {len(pts)} points")

    if args.output:
        merged = [pt for _, pts in all_pts for pt in pts]
        write_gpsvis(args.output, merged)
        print(f"Écrit {args.output} ({len(merged)} points)")
        return

    outdir = args.outdir
    for src, pts in all_pts:
        dest = (outdir / default_out(src).name) if outdir else default_out(src)
        write_gpsvis(dest, pts)
        print(f"Écrit {dest}")


if __name__ == "__main__":
    main()
