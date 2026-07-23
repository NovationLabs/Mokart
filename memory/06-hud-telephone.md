# 06 — HUD téléphone (feature récente)

**But** : supprimer l'écran TFT du volant et utiliser le **téléphone du pilote** comme afficheur. Un **tag NFC passif** dans le boîtier (NDEF URL) ouvre une **page web plein écran paysage** qui affiche la télémétrie. Plan complet et décisions : `~/.claude/plans/la-place-de-breezy-dusk.md`.

## Décisions cadrées

- **Architecture cloud** (4G/5G captée en continu sur leurs tests) : le RPi calcule localement → pousse au serveur → le serveur sert la page web à la session. En **vision production**.
- **MVP démo** : la brique « RPi live » est remplacée par le **replay de vraies sessions enregistrées** (`rpi/data/`, 10 Hz). On prouve l'expérience téléphone sans dépendre de l'intégration capteurs (rappel : `kart.py` envoie encore des `0.0`).
- **Déclencheur = tag NFC passif** (NTAG213/215, NDEF URI). Aucun code NFC sur le RPi.
- **Contrat de frame unique** partagé MVP ↔ live : le front ne connaît que ce format, l'upgrade live ne touchera pas le rendu.

## Architecture

```
[RPi kart]  IMU + GPS RTK  ─calcul local (vitesse, position, tour, delta)→  push 4G/5G   (← prod, futur)
     │
     ▼
[api.mokart.fr]  ingère + expose la session
     │  HTTP (page web + frames de la session)
     ▼
[Téléphone du pilote]  page web HUD plein écran paysage, ouverte par tag NFC
```

En MVP, la flèche « push 4G » est remplacée par une **ingestion manuelle** (`rpi/ingest_session.py`) + un **replay** côté téléphone.

## Ce qui est construit (MVP, testé 2026-07-22)

### Backend
- **`GET /sessions/{id}/hud-frames`** (`api/sessions/routes.py:273`) → tableau de frames dérivées. Dérivation détaillée dans [03-backend-api.md](03-backend-api.md) (`_build_hud_frames`) : vitesse depuis position/dt (clamp glitch + EMA), G depuis IMU, tours par porte vitesse-max, delta par progression en distance (porté de `prototype_pi.py::LapManager`), best_lap, secteurs.
- Modèles `HudFrame` / `HudSession` (`api/models/session.py:53-80`).
- Params : `dt_s` (défaut 0.1 = 10 Hz), `g_scale` (défaut 1.0), `limit` (20000).

### Front (`app/`)
- **Route PUBLIQUE `/hud/:sessionId`** (`app/src/App.tsx:26`), **hors `AppLayout` et hors gate d'auth** (sœur de `/login`) → pas de sidebar, pas de redirection login.
- **`app/src/pages/HudPage.tsx`** : layout **paysage plein écran**, fond noir, épuré. Zones : gauche = **vitesse** (gros chiffre) + temps au tour ; centre = **tracé du circuit** (SVG néon `TrackMap`, kart animé) + secteurs ; droite = **delta** coloré (vert si négatif) + meilleur tour + **G-force meter**. Overlay « tourne ton téléphone » si portrait (`matchMedia('(orientation: portrait)')`) + bouton plein écran (`requestFullscreen`). Boutons play/pause/restart. Un seul accent `#7bf8ac`. **Pas de sélecteur de rapport** (kart mono-vitesse).
- **`app/src/hooks/useTelemetryFrames.ts`** : `fetch` des frames puis **replay à `dt_s`** (`setInterval`, boucle en `%` sur les frames). Base URL réseau-friendly `REACT_APP_API_URL || http://${window.location.hostname}:8081`. Le contrat `HudFrame`/`HudSession` y est redéclaré en TS.
- **Composants extraits** vers `app/src/components/hud/` : `GForceMeter.tsx` (radar SVG, gx latéral / gy long., traînée) et `SpeedGauge.tsx` (arc néon). Extraits de `LivePage` pour partage Live/HUD. (Note : `HudPage` utilise `GForceMeter` mais affiche la vitesse en gros chiffre, **pas** `SpeedGauge`.)

### Ingestion
- **`rpi/ingest_session.py`** (stdlib pure) : CSV GNSS (+IMU optionnel) → `sessions` + `sensor_data`. Projette lat/lon en mètres (`uwb_x/uwb_y`), fusionne l'IMU par la colonne `heure`, mappe `ax(g)→imu_ax`, `gz→steering_angle`, etc. Deux modes : direct `psycopg2` ou `--emit-sql | psql`. Option `--origin lat,lon` pour **aligner avec le circuit reconstruit**. Détails d'usage dans [08-dev-setup.md](08-dev-setup.md).

## Contrat de frame (partagé MVP ↔ live)

```json
{ "t": 12.3, "speed": 62, "gx": 0.4, "gy": -0.2,
  "delta": -0.15, "lap": 3, "lap_time": 41.2, "sector": 2,
  "x": 123.4, "y": 56.7 }
```
`delta` peut être `null` (1er tour). Le front rejoue ces frames ; en live, une source `EventSource` produira le même format.

## État vérifié

- Endpoint OK sur les sessions seedées (ex. cercle `…440000` → ~108 km/h + tours détectés ; ovale `…440001`). Build prod du front `app` : compile TS sans erreur. La route `/hud` sert bien le SPA.
- **Session réelle ingérée** (dans le volume local uniquement) : id `11111111-1111-1111-1111-111111111111` (« Sodi RT8 — Hyères »), issue de `gnss_20260719_141853.csv` + `imu_20260719_141915.csv` (IMU fusionné par `heure`, ~3966/4169 appariés), origine `43.4046596,6.0123885`, liée au circuit reconstruit. hud-frames : best_lap ~72,2 s, 5 tours, vitesse 0–80 km/h, G réelles (lat ~1.73 / long ~1.25).

> ⚠️ Cette session et le circuit reconstruit **ne sont pas dans `init.sql`** : ils vivent dans le volume Docker. Un reset DB (`start.sh` touche `r`) les efface → il faut re-jouer `ingest_session.py` / `build_circuit.py`. Voir [09-gaps-todo.md](09-gaps-todo.md).

## Tester sur un téléphone (dev, même WiFi)

1. Mac + téléphone sur le **même réseau WiFi**.
2. Récupérer l'IP LAN du Mac : `ipconfig getifaddr en0` (DHCP, à re-vérifier ; ex. `192.168.1.208`).
3. Lancer la stack avec l'**override** : `docker compose up -d` prend automatiquement `docker-compose.override.yml`, qui **vide `REACT_APP_API_URL`** pour le service `app`. Le front retombe alors sur `http://<hôte-qui-sert-la-page>:8081` (via `window.location.hostname`) → le téléphone appelle l'API sur l'IP du **Mac**, pas sur son propre localhost.
4. Sur le téléphone : `http://<IP-du-Mac>:8000/hud/<sessionId>` en **paysage**.

Pour revenir au comportement normal : supprimer/vider `docker-compose.override.yml`.

## Upgrade live (post-MVP, quand les capteurs seront câblés)

- `rpi/kart.py` : brancher les vrais capteurs (via `parse_csv_data.send_imu_data`) et **pousser en 4G** vers un nouvel ingest cloud (POST 10 Hz ou batch), au lieu de l'UDP local.
- Serveur : buffer live en mémoire par session + **flux SSE `GET /sessions/{id}/stream`** (`text/event-stream`, générateur async) consommé par `EventSource`. ⚠️ **Exempter cette route du middleware timeout 30 s** (`api/app.py:20-29`), sinon le flux est coupé.
- Front : remplacer le hook replay par un hook `EventSource` (même contrat → **aucun changement visuel**).
- Sécurité : aujourd'hui la route HUD est publique (UUID opaque = accès), acceptable en démo. À durcir : URL NFC fixe par kart portant un **token** résolu côté serveur vers la session live en cours.

## Reste à faire (côté produit)

- Ingérer les 2 sessions GNSS pour le HUD (`--lat-col`/`--lon-col`, **même origine `43.4046596,6.0123885`** pour l'alignement circuit).
- Programmer le tag NFC (NDEF URI vers `https://app.novationlabs.fr/hud/<id>`).
- Berceau téléphone paysage dans le boîtier (`docs/3D Wheel/RenduV2.scad`), qui remplace la cavité écran (bonus : supprime le rendu framebuffer → gain CPU/conso).

Voir aussi : [03-backend-api.md](03-backend-api.md), [05-rpi-embedded.md](05-rpi-embedded.md), [07-circuit-reconstruction.md](07-circuit-reconstruction.md), [08-dev-setup.md](08-dev-setup.md).
