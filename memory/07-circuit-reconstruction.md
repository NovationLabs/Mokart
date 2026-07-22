# 07 — Reconstruction de circuit depuis le GPS

Script : **`rpi/build_circuit.py`** (stdlib pure, aucune dépendance — tourne sur le RPi comme sur un poste). Reconstruit la géométrie d'un circuit à partir de **positions GPS multi-tours** enregistrées (`rpi/data/gnss_*.csv`).

## Pipeline

1. **Chargement & projection** (`load_gnss`, `project`) : lit `lat,lon,speed_kmh`. Origine commune = **moyenne de tous les points** de tous les fichiers. Projection locale équirectangulaire en mètres : `x = (lon−lon0)·cos(lat0)·R_LON`, `y = (lat−lat0)·R_LAT` (`R_LAT=110540`, `R_LON=111320`).
2. **Détection des tours** (`detect_laps`) : **porte = point le plus rapide** (`speed_kmh` max). Sur une ligne droite, ce point est franchi une fois par tour. Machine à états « armed » : on ré-arme quand on s'éloigne (> 1.6·seuil) et on compte un franchissement quand on repasse près (< seuil, seuil = 5 % de la diagonale) avec au moins 50 échantillons d'écart. **Robuste, insensible au point de départ** (out-lap/paddock). *(C'est exactement la même méthode que la détection de tours dans `hud-frames`, voir [03](03-backend-api.md).)*
3. **Rééchantillonnage par longueur d'arc** (`resample_loop`) : chaque tour → `k` points équidistants (défaut `k=200`).
4. **Filtre des tours invalides** : rejette les tours dont la longueur < `min_lap_ratio × médiane` (défaut 0.6) — élimine out-laps et faux franchissements.
5. **Moyenne des tours** : la centerline = moyenne, index par index, de tous les tours valides retenus (réduit le bruit GPS), puis **lissage circulaire** (`smooth_closed`, fenêtre 5).
6. **Bordures par offset normal** (`offset_boundaries`) : gauche/droite = centerline décalée de ±`width/2` le long de la **normale unitaire** (défaut `width=8 m`).

## Sorties

- **CSV format HELP** (`circuit_reconstructed.csv`) : 3 sections `# trajectoire` / `# bordure_exterieure` / `# bordure_interieure`, chacune `index,x,y`. Réutilisable avec `HELP/point_editor.py`.
- **SVG preview** (`circuit_reconstructed.svg`) : bordures rouge/cyan, centerline verte pointillée, point de départ (flip Y = nord en haut).
- **SQL** (`--emit-sql`) : `DELETE` du circuit homonyme puis `INSERT` dans `circuits` + `circuit_boundaries` (left/right) + `optimal_trajectories` (la centerline sert de trajectoire de départ, que l'algo scipy peut recalculer).
- Sur stderr : nombre de tours détectés/retenus, origine `(lat,lon)`, `circuit_id`.

## Arguments

`files` (glob accepté) · `--name` (défaut « SpeedKart Hyères (GPS) ») · `--points` (200) · `--width` (8.0) · `--min-lap-ratio` (0.6) · `--out-csv` · `--out-svg` · `--circuit-id` (sinon UUID généré) · `--emit-sql`.

Exemple :
```bash
cd rpi
python build_circuit.py data/gnss_*.csv --name "SpeedKart Hyères" --width 8 --emit-sql \
  | docker compose exec -T db psql -U mokart -d mokart
```

## Circuit reconstruit (résultat constaté)

- Inséré en base : circuit **« SpeedKart Hyères (GPS) »**, id `3d01d5ed-ddc0-4409-9928-c89f54ecc66e` (400 bordures + centerline/trajectoire). Origine de projection = **`43.4046596, 6.0123885`**.
- Forme cohérente (épingle + longue courbe). L'algo scipy `optimal-trajectory` ([03](03-backend-api.md)) tourne dessus (~200 pts). Artefact mineur connu : croisement des bordures à l'épingle (offset > rayon local).

> ⚠️ Ce circuit **n'est pas dans `init.sql`** : il a été inséré à l'exécution via le SQL généré par `build_circuit.py`. Il n'existe que dans le **volume Docker local** → un reset DB l'efface (re-jouer le script). Même remarque pour la session réelle ingérée (voir [06](06-hud-telephone.md), [09](09-gaps-todo.md)).

## Format des données `rpi/data/`

Rappel (détails dans [05-rpi-embedded.md](05-rpi-embedded.md)) :
- GNSS : `heure,timestamp,lat,lon,alt_m,quality,nb_sats,hdop,speed_kmh,heading_deg` (10 Hz). `quality=1` dans les traces actuelles.
- IMU : `heure,timestamp,ax(g),ay(g),az(g),gx(deg/s),gy(deg/s),gz(deg/s),roll(deg),pitch(deg),yaw(deg)`.

## À retenir (cohérence d'origine)

Pour que la **trajectoire d'une session** (ingérée par `ingest_session.py`) s'aligne avec le **circuit reconstruit**, il faut utiliser **la même origine de projection** `43.4046596,6.0123885` (passer `--origin 43.4046596,6.0123885` à `ingest_session.py`). Sinon les repères mètres locaux ne coïncident pas.

Voir aussi : [03-backend-api.md](03-backend-api.md), [05-rpi-embedded.md](05-rpi-embedded.md), [06-hud-telephone.md](06-hud-telephone.md), [08-dev-setup.md](08-dev-setup.md).
