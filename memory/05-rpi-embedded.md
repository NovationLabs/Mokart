# 05 — Embarqué (RPi, capteurs, volant 3D)

Le boîtier embarqué. **Aucun script `rpi/` n'est dockerisé** ni branché à l'API FastAPI : ce sont des scripts autonomes (capteurs, écran TFT, outillage). L'alimentation de la plateforme se fait par **ingestion manuelle** (voir [07](07-circuit-reconstruction.md) et [08](08-dev-setup.md)).

## Matériel

- **Raspberry Pi Zero 2 W** + **écran TFT 3.5" 480×320** (framebuffer `/dev/fb1`, RGB565) + batterie **PiSugar**.
- Logé dans un **volant imprimé en 3D** : OpenSCAD `docs/3D Wheel/RenduV2.scad` (+ `RenduV1*.scad`), avec exports `.stl`/`.3mf` (base + couvercle). Entraxe compatible Sodi.
- Connectivité : **WiFi** + **Tailscale** (VPN maillé ; `rpi/rpi_install.md` configure une keepalive cron + désactive le power-save WiFi).
- Conso : benchmarks dans le README (RPi Zero 2W ~60–860 mWh selon services/écran). `rpi/power_optimize.sh` = TUI d'optimisation conso (menu à flèches).

## Scripts capteurs & runtime (`rpi/`)

| Script | Rôle | Détails |
|---|---|---|
| `kart.py` | Client par kart | **UDP JSON ~30 Hz** (`time.sleep(0.033)`) vers `mokart-test.local:5005` ; reçoit le broadcast de l'état des **autres** karts (port 5006). ⚠️ **Champs capteurs = `0.0` en dur** (`x,y,speed,steering,imu_*`), commentaire `TODO: remplacer par les vraies donnees capteurs` (`kart.py:105-115`). Seules les stats système (CPU/mém/temp) sont réelles. |
| `server.py` | Serveur central `mokart-test` | Reçoit l'UDP des karts, affiche un dashboard multi-kart sur l'**écran TFT**, rebroadcast l'état global (chaque kart voit les autres). |
| `imu.py` | Driver IMU série | WitMotion/Hiwonder, **protocole 0x55** (paquets 11 octets : 0x51 accel, 0x52 gyro, 0x53 angle, 0x54 magnéto ; checksum). Calibration, dashboard matplotlib, log CSV. |
| `PON_gps.py` | GPS RTK Point One | Client **NTRIP** (`virtualrtk.pointonenav.com:2101`, mountpoint `AUTO`), creds via env **`NTRIP_USER`/`NTRIP_PASS`**. Injecte les corrections **RTCM3** sur le port série, parse le **NMEA** en retour. Qualité de fix : 0 = no fix, 1 = GPS, 4 = RTK Fixed (<10 cm), 5 = RTK Float. |
| `hr_ble.py` | Capteur cardiaque BLE | `bleak`, service **0x180D** (HR), caractéristique 0x2A37, batterie 0x2A19. **Standalone, intégré nulle part ailleurs** (la fréquence cardiaque n'existe ni en DB ni dans le front). |
| `prototype.py` | Dashboard pilote (Pygame) | Version desktop du HUD (G-force meter, delta, chronos). Circuit **« SpeedKart »** 22 points Catmull-Rom. Données **simulées**. |
| `prototype_pi.py` | Dashboard pilote (TFT) | Version framebuffer. Contient **`LapManager`** (`:162`) : détection de tour (`prev_idx > 0.85·len && idx < 0.15·len`) + `live_delta(idx)` = `lap_time − reference_lap·progress`. **Cette logique de delta a été portée dans l'endpoint `hud-frames`** (voir [03](03-backend-api.md), [06](06-hud-telephone.md)). G-force simulée (`get_mock_gforce`). |
| `parse_csv_data.py` | Pont CSV IMU → télémétrie | `load_imu_data` (pandas) ; calcule un **score de fluidité** = `max(0, 100 − (jerk_rms/10)·100)` (jerk = dérivée de l'accélération). ⚠️ attend des colonnes `ax`/`ay` (pas `ax(g)`) → mapping à adapter selon la source. |
| `generate_mock_data.py` | Générateur IMU synthétique | 100 Hz, 60 s, profils de pilote réalistes. |
| `score_visualisation_from_csv.py` | Analyse offline | Utilise `parse_csv_data`, matplotlib, diagramme G-G, score de fluidité. |
| `build_circuit.py` | **Reconstruction circuit depuis GPS** | Récent. Détaillé dans [07-circuit-reconstruction.md](07-circuit-reconstruction.md). |
| `ingest_session.py` | **Ingestion session GNSS+IMU → DB** | Récent. Détaillé dans [06](06-hud-telephone.md) et [08](08-dev-setup.md). |

## Données réelles enregistrées (`rpi/data/`)

Traces GPS + IMU d'une session réelle à **SpeedKart Hyères** (19/07/2026, 10 Hz) :

| Fichier | ~Lignes | Colonnes |
|---|---|---|
| `gnss_20260719_141853.csv` | ~4169 | `heure,timestamp,lat,lon,alt_m,quality,nb_sats,hdop,speed_kmh,heading_deg` |
| `gnss_20260719_160951.csv` | ~8395 | idem |
| `imu_20260719_141915.csv` | ~5200 | `heure,timestamp,ax(g),ay(g),az(g),gx(deg/s),gy(deg/s),gz(deg/s),roll(deg),pitch(deg),yaw(deg)` |
| `circuit_reconstructed.csv` / `.svg` | — | Sortie de `build_circuit.py` (format HELP : trajectoire / bordure_exterieure / bordure_interieure) |

Notes factuelles :
- L'IMU se synchronise au GNSS via la colonne **`heure`** (HH:MM:SS.mmm) — c'est ce que fait `ingest_session.py`.
- Dans ces traces, **`quality = 1`** (fix GPS standard), pas 4 (RTK Fixed). L'accéléro est en **g**, le gyro en **deg/s**. Les toutes premières lignes IMU sont à `0.0000` (échauffement).
- Track réel ~350×150 m, périmètre ~583 m. Origine de projection utilisée : **`43.4046596, 6.0123885`**.

## Outillage circuits (`HELP/`)

Chaîne pour dessiner/éditer des circuits manuellement (indépendante de `build_circuit.py`) :

- `debug_points.py` : dessin du circuit à la souris → CSV 3 sections (trajectoire / bordure_ext / bordure_int).
- `point_editor.py` : édition fine du CSV.
- `integrate_circuit.py` : CSV → `INSERT` dans `api/init.sql`.
- `visualize_points.py` : vérification via l'API.
- `circuit_week.csv`, `circuit_weekend.csv` : jeux de points. `keybinds.md` : raccourcis. `test dashboard pilote/` : maquettes HTML.

## Contrôle de flux (résumé)

`kart.py → UDP → server.py → TFT` en local, plus les scripts capteurs autonomes. **Rien ne remonte automatiquement vers `api.mokart.fr`** aujourd'hui. La feature HUD téléphone ([06](06-hud-telephone.md)) contourne cela pour le MVP en **rejouant** des sessions ingérées manuellement, et prévoit à terme un push 4G/5G depuis le RPi.

Voir aussi : [06-hud-telephone.md](06-hud-telephone.md), [07-circuit-reconstruction.md](07-circuit-reconstruction.md), [09-gaps-todo.md](09-gaps-todo.md).
