#!/usr/bin/env python3
"""Visualise GNSS (lat/lon → x/y mètres) + bords intérieur/extérieur du circuit."""

import csv
import math
import re
import sys
from pathlib import Path

import pygame

ROOT = Path(__file__).resolve().parent.parent
GNSS_DEFAULT = ROOT / "data_test" / "gnss_20260719_141853.csv"
CIRCUIT_OUT_DEFAULT = Path.home() / "circuit_out_1.csv"
CIRCUIT_IN_DEFAULT = Path.home() / "circuit_in_1.csv"

R_LAT = 110540.0
R_LON = 111320.0
WKT_PT = re.compile(r"\(\(([-0-9.]+)\s+([-0-9.]+)\)\)")

WIDTH, HEIGHT = 1400, 900
MARGIN = 50
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
RED = (255, 60, 60)
ORANGE = (255, 170, 50)
GREEN = (80, 220, 120)
GRAY = (140, 140, 140)


def load_gnss(path):
    pts = []
    with open(path) as f:
        for r in csv.DictReader(f):
            try:
                lat, lon = float(r["lat"]), float(r["lon"])
            except (ValueError, KeyError, TypeError):
                continue
            pts.append((lon, lat))
    return pts


def load_wkt_circuit(path):
    pts = []
    with open(path) as f:
        reader = csv.reader(f)
        next(reader, None)
        for row in reader:
            if not row:
                continue
            m = WKT_PT.search(row[0])
            if m:
                pts.append((float(m.group(1)), float(m.group(2))))
    return pts


def to_xy(lonlat, lat0, lon0):
    klon = math.cos(math.radians(lat0)) * R_LON
    return [((lon - lon0) * klon, (lat - lat0) * R_LAT) for lon, lat in lonlat]


def fit_transform(all_xy):
    xs = [p[0] for p in all_xy]
    ys = [p[1] for p in all_xy]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    dx = max(max_x - min_x, 1e-6)
    dy = max(max_y - min_y, 1e-6)
    scale = min((WIDTH - 2 * MARGIN) / dx, (HEIGHT - 2 * MARGIN) / dy)

    def conv(x, y):
        sx = MARGIN + int((x - min_x) * scale)
        sy = HEIGHT - MARGIN - int((y - min_y) * scale)
        return sx, sy

    return conv


def draw_poly(screen, xy, conv, color, width):
    if len(xy) < 2:
        return
    pts = [conv(x, y) for x, y in xy]
    pygame.draw.lines(screen, color, False, pts, width)


def draw_dots(screen, xy, conv, color, radius=3):
    for x, y in xy:
        pygame.draw.circle(screen, color, conv(x, y), radius)


def main():
    gnss_path = Path(sys.argv[1]) if len(sys.argv) > 1 else GNSS_DEFAULT
    out_path = Path(sys.argv[2]) if len(sys.argv) > 2 else CIRCUIT_OUT_DEFAULT
    in_path = Path(sys.argv[3]) if len(sys.argv) > 3 else CIRCUIT_IN_DEFAULT

    print(f"GNSS         : {gnss_path}")
    print(f"Circuit out  : {out_path}")
    print(f"Circuit in   : {in_path}")

    gnss_ll = load_gnss(gnss_path)
    out_ll = load_wkt_circuit(out_path)
    in_ll = load_wkt_circuit(in_path)
    if not gnss_ll or not out_ll or not in_ll:
        raise SystemExit("Données vides — vérifie les chemins.")

    lat0 = sum(p[1] for p in gnss_ll) / len(gnss_ll)
    lon0 = sum(p[0] for p in gnss_ll) / len(gnss_ll)
    gnss_xy = to_xy(gnss_ll, lat0, lon0)
    out_xy = to_xy(out_ll, lat0, lon0)
    in_xy = to_xy(in_ll, lat0, lon0)
    conv = fit_transform(gnss_xy + out_xy + in_xy)

    print(f"{len(gnss_xy)} pts GNSS, {len(out_xy)} pts extérieur, {len(in_xy)} pts intérieur")
    print(f"Origine locale: lat0={lat0:.6f} lon0={lon0:.6f}")

    pygame.init()
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    pygame.display.set_caption("GNSS x/y + bords de circuit")
    font = pygame.font.Font(None, 24)
    font_small = pygame.font.Font(None, 18)
    clock = pygame.time.Clock()
    show_gnss = True
    show_out = True
    show_in = True
    running = True

    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    running = False
                elif event.key == pygame.K_g:
                    show_gnss = not show_gnss
                elif event.key == pygame.K_o:
                    show_out = not show_out
                elif event.key == pygame.K_i:
                    show_in = not show_in

        screen.fill(BLACK)
        if show_out:
            draw_poly(screen, out_xy, conv, RED, 3)
            draw_dots(screen, out_xy, conv, RED, 3)
        if show_in:
            draw_poly(screen, in_xy, conv, ORANGE, 3)
            draw_dots(screen, in_xy, conv, ORANGE, 3)
        if show_gnss:
            draw_poly(screen, gnss_xy, conv, GREEN, 2)

        screen.blit(font.render("GNSS (x,y m) + bords intérieur / extérieur", True, WHITE), (10, 10))
        for i, line in enumerate([
            "G: GNSS  O: extérieur  I: intérieur  ESC: quitter",
            f"GNSS {'ON' if show_gnss else 'OFF'}  "
            f"out {'ON' if show_out else 'OFF'}  "
            f"in {'ON' if show_in else 'OFF'}",
        ]):
            screen.blit(font_small.render(line, True, GRAY), (10, HEIGHT - 50 + i * 20))

        legend = [("Extérieur", RED), ("Intérieur", ORANGE), ("GNSS", GREEN)]
        for i, (label, color) in enumerate(legend):
            pygame.draw.rect(screen, color, (WIDTH - 160, 10 + i * 30, 20, 20))
            screen.blit(font_small.render(label, True, WHITE), (WIDTH - 130, 12 + i * 30))

        pygame.display.flip()
        clock.tick(60)

    pygame.quit()


if __name__ == "__main__":
    main()
