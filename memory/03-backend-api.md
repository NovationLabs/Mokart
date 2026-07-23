# 03 — Backend API (FastAPI)

Entrée : `api/app.py`. Routers inclus : `auth`, `sessions`, `circuits`, `users` (+ `admin_router`), `dashboard`. Middleware : **timeout global 30 s** (`api/app.py:20-29`) et **CORS `*`** (`api/app.py:40-47`).

> ⚠️ **Aucun endpoint n'applique de contrôle d'accès.** La colonne « Accès » ci-dessous décrit l'intention/rôle logique, pas une vérification réelle. L'identité, quand elle est utilisée, passe par un query param `?user_id=` non authentifié.

## Endpoints — récapitulatif

### Racine (`api/app.py`)
| Méthode | Chemin | Rôle | Notes |
|---|---|---|---|
| GET | `/` | public | `{message, status}` |
| GET | `/health` | public | teste `SELECT 1` sur la DB |
| POST | `/seed-users` | (admin) | insère ~18 users factices (hash `hash_password123`) |
| POST | `/fix-database` | (admin) | migration à chaud : ajoute colonnes `role/is_active/…`, CHECK 7 rôles |

### `/auth` (`api/auth/routes.py`)
| Méthode | Chemin | Notes |
|---|---|---|
| POST | `/auth/login` | démo hardcodée `demo@mokart.com`/`demo123456` ; sinon SHA-256 vs DB. Renvoie `{user, session{access_token}, message}` |
| POST | `/auth/register` | crée un user (SHA-256), username auto depuis l'email |

### `/sessions` (`api/sessions/routes.py`)
| Méthode | Chemin | Notes |
|---|---|---|
| GET | `/sessions/` | liste toutes les sessions |
| GET | `/sessions/{id}/stats` | total points, durée, **coverage** (uwb/imu/steering %), **bounds** min/max x/y. `limit=10000` |
| GET | `/sessions/{id}/trajectory` | points `{x,y,timestamp,steering_angle}` où uwb non-null |
| GET | `/sessions/{id}/hud-frames` | **frames HUD dérivées** (voir détail plus bas) |
| POST | `/sessions/` | crée une session (⚠️ `user_id` aléatoire si absent → risque violation FK) |
| GET | `/sessions/{id}/sensor-data` | points bruts paginés (`limit=5000`, `offset`) |
| POST | `/sessions/{id}/sensor-data` | ajoute **un** point de capteur (ingestion 1-par-1) |

### `/circuits` (`api/circuits/routes.py`)
| Méthode | Chemin | Notes |
|---|---|---|
| GET | `/circuits/` | liste des circuits |
| GET | `/circuits/{id}/boundaries` | bordures triées (side, point_order) |
| POST | `/circuits/{id}/optimal-trajectory` | **calcule** la ligne optimale (scipy, thread séparé) et la persiste |
| GET | `/circuits/{id}/optimal-trajectory` | récupère la ligne optimale sauvegardée |
| GET | `/circuits/{circuit_id}/trajectory-comparison/{session_id}` | déviation réelle vs optimale (Fréchet approché) |
| GET | `/circuits/week-circuit/simulation-data` | cherche le circuit **nommé « Week Circuit »** ; renvoie bordures + optimale (la calcule si absente). Consommé par `SimulationPage.tsx` |

### `/users` + `/admin/users` (`api/users/routes.py`)
| Méthode | Chemin | Notes |
|---|---|---|
| GET | `/users/profile?user_id=` | profil ; 401 si `user_id` vide |
| PUT | `/users/profile?user_id=` | maj profil (SQL dynamique) |
| GET | `/users/notifications?user_id=&unread_only=` | notifications de l'user |
| PUT | `/users/notifications/{id}/read` | marque lue |
| PUT | `/users/notifications/read-all` | marque tout lu |
| GET | `/admin/users` (et `/`) | **liste tous les users — aucun contrôle admin** |
| GET | `/admin/users/stats` | total/actifs/inactifs + `by_role` |
| GET | `/admin/users/{id}` | détail |
| POST | `/admin/users` (et `/`) | crée (hash = `f"hash_{password}"`, TODO bcrypt) |
| PUT | `/admin/users/{id}` | maj (SQL dynamique) |
| PUT | `/admin/users/{id}/toggle-status` | active/désactive |
| DELETE | `/admin/users/{id}` | supprime user + ses sessions + notifications |

### `/dashboard` (`api/dashboard/routes.py`)
| Méthode | Chemin | Notes |
|---|---|---|
| GET | `/dashboard/data?user_id=&role=` | **un seul endpoint** ; renvoie des données **factices** (random) selon le rôle |

⚠️ **Bug `/dashboard/data`** : le corps ne gère que `admin`, `driver`, `mechanic`, `observer`, `commissaire_piste` et **n'a pas de branche `else`** (`api/dashboard/routes.py:134-245`). Les rôles `instructor`, `commissaire`, `spectator` (et le défaut `pilot`) tombent sur `None` → erreur de validation Pydantic. Le `circuit_info` est en dur (`name="SPEEDKART Hyères"`) ; leaderboard/stats/météo sont hardcodés dans la branche `observer`.

## Détail : `GET /sessions/{id}/hud-frames` (feature HUD téléphone)

Fichier : `api/sessions/routes.py:273-313` ; logique de dérivation : `_build_hud_frames` (`:49-169`). Modèles Pydantic : `HudFrame` / `HudSession` (`api/models/session.py:53-80`).

**Paramètres** : `dt_s` (défaut `0.1` = 10 Hz), `g_scale` (défaut `1.0`), `limit` (défaut `20000`).

**Réponse** `HudSession` :
```json
{ "session_id","kart","circuit_id","dt_s","bounds":{min_x,max_x,min_y,max_y},
  "best_lap": <s|null>, "track": [[x,y],…], "frames": [ <HudFrame>… ] }
```
`HudFrame` = `{ t, speed, gx, gy, delta|null, lap, lap_time, sector, x, y }` — c'est le **contrat de frame unique** partagé avec le futur live (voir [06](06-hud-telephone.md)).

**Dérivations** (tout à la volée, aucune migration de schéma) :

1. **Position** : `uwb_x/uwb_y` (mètres) ; les trous sont comblés par la dernière valeur connue.
2. **Vitesse** (`speed`, km/h) : `distance(pos[i], pos[i-1]) / dt_s * 3.6`, avec **clamp anti-glitch GPS** (`SPEED_MAX_KMH = 120` → au-delà on garde la vitesse précédente) et **lissage EMA** (`SPEED_EMA = 0.35`).
3. **G-force** : `gx = imu_ay` (latéral), `gy = imu_ax` (longitudinal), × `g_scale`. (Les données réelles étant déjà en `g`, `g_scale=1.0` convient ; passer ~`0.102` seulement si l'IMU est en m/s².)
4. **Tours** (`lap`) : détection par **porte = frame la plus rapide** (sur une ligne droite, franchie à chaque tour) — même méthode robuste que `rpi/build_circuit.py`, insensible au point de départ (out-lap/paddock). Filtre les segments trop courts (< 0.6 × médiane).
5. **Delta** (`delta`, s) : porté de `rpi/prototype_pi.py::LapManager`. Basé sur la **progression en distance** (`cumdist/ref_dist`) vs le **tour complet le plus rapide** (exclut le 1er segment partiel = out-lap). `None` au 1er tour.
6. **best_lap** : min des tours complets détectés.
7. **sector** : 1/2/3 selon la progression en distance.

8. **track** (`HudSession.track`) : **tracé unique lissé** du circuit renvoyé au HUD. `_build_hud_frames` rééchantillonne chaque tour complet par longueur d'arc (`_resample_loop`, `TRACK_POINTS=180`), **moyenne** les tours (élimine le bruit GPS et la superposition des ~5 passages) puis lisse en boucle (`_smooth_closed`). Les `bounds` sont recalculés serrés sur ce tracé. Le front (`HudPage.tsx::TrackMap`) dessine `meta.track` (ligne néon épaisse + casing), pas les frames brutes.

## Algorithme de trajectoire (`api/circuits/trajectory_algorithm.py`)

Classe `TrajectoryOptimizer`. C'est **la vraie brique technique du projet** (le reste du dashboard est en grande partie mocké).

- **Méthode principale = Minimum Curvature Path** : minimise la somme des courbures² le long du circuit via **scipy `minimize` (L-BFGS-B)** sur un vecteur `alpha ∈ [margin, 1-margin]` (une variable latérale par point).
- **Astuce clé** : on optimise/lisse **alpha** (position latérale entre bordure gauche/droite), pas les XY → garantit mathématiquement que chaque point reste **dans le couloir de piste** (`_smooth_alpha`, noyau gaussien, padding circulaire, clamp).
- **Courbure de Menger** (`_compute_curvature`) : `κ = 4·Aire / (a·b·c)` sur 3 points consécutifs, bouclage circulaire (circuit fermé).
- **Bordures** : triées par `point_order`, rééchantillonnées par longueur d'arc via **spline cubique** (`_resample_polyline`, `CubicSpline`) sur un nombre de points commun.
- **Variante `calculate_racing_line`** : même coût + terme encourageant l'usage de toute la largeur (apex).
- **Déviation** (`calculate_deviation`) : distance réelle→optimale la plus proche via `scipy.spatial.distance.cdist` → `{mean, max, min, std}`.
- **Contraintes physiques du kart commentées** (masse 160 kg, grip µ=1.4, puissance ~9 kW, vitesse max 25 m/s ≈ 90 km/h, décel 12 m/s²) : présentes mais **désactivées** → l'optimisation est **purement géométrique** aujourd'hui. Prêtes à réactiver (blocs de code commentés `_apply_dynamic_constraints`, terme de vitesse).

## Modèles

- ORM : `api/models/sql_models.py` (User, Session, SensorData, Circuit, CircuitBoundary, OptimalTrajectory). Note : `User.role` a un commentaire listant 8 rôles alors que le CHECK DB n'en autorise que 6 (voir [02](02-architecture.md)).
- Pydantic : `api/models/session.py` (Session, SensorData, TrajectoryPoint, **HudFrame**, **HudSession**), `api/models/auth.py` (LoginRequest, RegisterRequest, AuthResponse), `api/models/dashboard.py` (DashboardData & co).

## Fichiers SQL annexes (non montés au démarrage)

- `api/seed_users.sql`, `api/fix_user_columns.sql` : scripts manuels. Leurs en-têtes documentent un endpoint `POST /execute-sql` qui **n'existe pas** (les vrais sont `/seed-users` et `/fix-database`).
- `api/examples/circuits.sql`, `api/examples/circle_trajectory_example.sql` : exemples de référence, **non chargés** par Docker.

Voir aussi : [02-architecture.md](02-architecture.md), [06-hud-telephone.md](06-hud-telephone.md), [09-gaps-todo.md](09-gaps-todo.md).
