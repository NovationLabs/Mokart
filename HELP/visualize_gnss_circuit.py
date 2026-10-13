#!/usr/bin/env python3
"""Vue 3D interactive (orbite souris) : bords circuit + GNSS avec altitude."""

import csv
import math
from pathlib import Path

import numpy as np
import pyvista as pv

ROOT = Path(__file__).resolve().parent.parent
GNSS_DEFAULT = ROOT / "data_test" / "gnss_20260719_141853.csv"
CIRCUIT_OUT_DEFAULT = ROOT / "data_test" / "circuit_out_final.txt"
CIRCUIT_IN_DEFAULT = ROOT / "data_test" / "circuit_in_final.txt"

R_LAT = 110540.0
R_LON = 111320.0
Z_EXAG_DEFAULT = 12.0


def load_gnss(path):
    pts = []
    with open(path, newline="") as f:
        for r in csv.DictReader(f):
            try:
                lat, lon = float(r["lat"]), float(r["lon"])
                alt = float(r["alt_m"]) if r.get("alt_m") not in (None, "") else 0.0
            except (ValueError, KeyError, TypeError):
                continue
            pts.append((lon, lat, alt))
    return pts


def load_gpsvis(path):
    pts = []
    with open(path, newline="") as f:
        sample = f.read(4096)
        f.seek(0)
        dialect = csv.Sniffer().sniff(sample, delimiters="\t,;")
        reader = csv.DictReader(f, dialect=dialect)
        for r in reader:
            keys = {k.strip().lower(): k for k in r}
            try:
                lat = float(r[keys["latitude"]])
                lon = float(r[keys["longitude"]])
            except (KeyError, ValueError, TypeError):
                continue
            alt_key = next((k for k in keys if "alt" in k), None)
            try:
                alt = float(r[keys[alt_key]]) if alt_key else 0.0
            except (ValueError, TypeError):
                alt = 0.0
            pts.append((lon, lat, alt))
    return pts


def to_xyz(lonlatalt, lat0, lon0, z0):
    klon = math.cos(math.radians(lat0)) * R_LON
    return np.array(
        [
            [(lon - lon0) * klon, (lat - lat0) * R_LAT, alt - z0]
            for lon, lat, alt in lonlatalt
        ],
        dtype=np.float64,
    )


def polyline(xyz):
    poly = pv.lines_from_points(xyz)
    poly["z"] = xyz[:, 2]
    return poly


def main():
    gnss_ll = load_gnss(GNSS_DEFAULT)
    out_ll = load_gpsvis(CIRCUIT_OUT_DEFAULT)
    in_ll = load_gpsvis(CIRCUIT_IN_DEFAULT)
    if not gnss_ll or not out_ll or not in_ll:
        raise SystemExit("Données vides — vérifie les chemins.")

    lat0 = sum(p[1] for p in gnss_ll) / len(gnss_ll)
    lon0 = sum(p[0] for p in gnss_ll) / len(gnss_ll)
    z0 = min(p[2] for p in gnss_ll + out_ll + in_ll)

    gnss = to_xyz(gnss_ll, lat0, lon0, z0)
    out = to_xyz(out_ll, lat0, lon0, z0)
    inn = to_xyz(in_ll, lat0, lon0, z0)

    print(f"GNSS {len(gnss)}  out {len(out)}  in {len(inn)}")
    print(f"origine lat={lat0:.6f} lon={lon0:.6f} z0={z0:.2f} m")
    print(f"Z GNSS [{gnss[:, 2].min():.2f}, {gnss[:, 2].max():.2f}] m rel.")
    print(f"Z out  [{out[:, 2].min():.2f}, {out[:, 2].max():.2f}] m rel.")
    print(f"Z in   [{inn[:, 2].min():.2f}, {inn[:, 2].max():.2f}] m rel.")

    plotter = pv.Plotter()
    plotter.set_background("black")
    plotter.add_axes()
    state = {"exag": Z_EXAG_DEFAULT}

    actors = {
        "out": plotter.add_mesh(
            polyline(out), color="red", line_width=5, label="extérieur"
        ),
        "in": plotter.add_mesh(
            polyline(inn), color="orange", line_width=5, label="intérieur"
        ),
        "gnss": plotter.add_mesh(
            polyline(gnss),
            scalars="z",
            cmap="turbo",
            line_width=3,
            label="GNSS",
            scalar_bar_args={"title": "Z GNSS (m rel.)"},
        ),
    }
    for a in actors.values():
        a.SetScale(1.0, 1.0, state["exag"])

    plotter.add_legend()

    def hud():
        plotter.add_text(
            f"exag Z ×{state['exag']:.0f}  |  clic-gauche orbite  molette zoom  clic-droit pan\n"
            "G GNSS  O extérieur  I intérieur  +/- exag  R reset  Q quitter",
            font_size=10,
            color="white",
            name="hud",
        )

    hud()

    def apply_exag():
        for a in actors.values():
            a.SetScale(1.0, 1.0, state["exag"])
        hud()
        plotter.render()

    def toggle(name):
        a = actors[name]
        a.SetVisibility(not a.GetVisibility())
        plotter.render()

    plotter.add_key_event("g", lambda: toggle("gnss"))
    plotter.add_key_event("o", lambda: toggle("out"))
    plotter.add_key_event("i", lambda: toggle("in"))
    plotter.add_key_event(
        "plus", lambda: (state.update(exag=min(state["exag"] * 1.25, 80)), apply_exag())
    )
    plotter.add_key_event(
        "equal", lambda: (state.update(exag=min(state["exag"] * 1.25, 80)), apply_exag())
    )
    plotter.add_key_event(
        "minus", lambda: (state.update(exag=max(state["exag"] / 1.25, 1)), apply_exag())
    )
    plotter.add_key_event("r", plotter.reset_camera)

    plotter.show_grid(color="gray")
    plotter.reset_camera()
    plotter.show()


if __name__ == "__main__":
    main()
