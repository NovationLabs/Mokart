# 02 — Architecture

Monorepo orchestré par **Docker Compose**. `docker-compose.yml` (dev), `docker-compose.prod.yml` (prod), `docker-compose.override.yml` (override dev pour le HUD téléphone, voir [06](06-hud-telephone.md)).

## Services (dev — `docker-compose.yml`)

| Service | Conteneur | Port hôte → conteneur | Stack | Rôle |
|---|---|---|---|---|
| `app` | `mokart-app` | **8000** → 3000 | CRA React 18 + TS + Tailwind + react-router-dom v6 + Recharts 2.15 | Dashboard pilote/exploitant |
| `web` | `mokart-web` | **8080** → 3000 | CRA React 18 + TS + Tailwind | Landing publique |
| `api` | `mokart-api` | **8081** → 5000 | FastAPI + SQLAlchemy 2 + uvicorn (`--reload`) | Backend REST |
| `db` | `mokart-db` | **5432** → 5432 | `postgres:15-alpine` | Base de données |
| `ai-backend` | `mokart-ai-backend` | **8002** → 8000 | FastAPI + LangGraph | Agent IA (API compat OpenAI) |
| `ai-front` | `mokart-ai-front` | **8003** → 4000 | FastAPI + Jinja2 + httpx | Chat UI (proxy streaming) |

Le service `db` monte deux fichiers dans `/docker-entrypoint-initdb.d/` : `api/init.sql` → `01-init.sql` (le vrai schéma + seed) et `api/circuits.sql` → `02-circuits.sql`. ⚠️ **`api/circuits.sql` est un répertoire vide** (artefact de bind-mount Docker), donc `02-circuits.sql` est un no-op : seul `init.sql` seed réellement la base. (Le fichier `api/examples/circuits.sql` existe mais **n'est pas monté**.) Détail dans [09-gaps-todo.md](09-gaps-todo.md).

Un service `pgadmin` est présent mais **commenté** dans `docker-compose.yml`.

## Ports (dev vs prod)

| | Landing (`web`) | Dashboard (`app`) | API |
|---|---|---|---|
| **Dev** (`docker-compose.yml`) | 8080 | 8000 | 8081 |
| **Prod** (`docker-compose.prod.yml`) | 8080 | 8000 | 8081 |
| **README / `start.sh prod` (texte)** | 9980 | — | 9981 |

⚠️ Le README et les `echo` de `start.sh prod` annoncent **9980/9981**, mais `docker-compose.prod.yml` mappe en réalité **8080/8000/8081**. Incohérence connue (le reverse-proxy Cloudflare/hôte gère le vrai routage vers `mokart.fr` / `app.novationlabs.fr` / `api.mokart.fr`).

## Serving prod (nginx)

- `app/Dockerfile.prod` : build CRA avec **`ENV REACT_APP_API_URL=/api` baké au build**, puis `nginx:alpine` sert le SPA. `app/nginx.conf` proxifie `location /api/` → `http://mokart-api-prod:5000/`.
- `web/Dockerfile.prod` : build CRA → `nginx:alpine`. `web/nginx.conf` sert le statique uniquement (pas de proxy API).
- ⚠️ Conséquence : l'env runtime `REACT_APP_API_URL=https://api.mokart.fr` du `docker-compose.prod.yml` **n'a aucun effet** — CRA fige la variable au build. En prod, le front `app` appelle donc `/api` (proxy nginx local).

## Stack backend

- **FastAPI** (`api/app.py`) sur uvicorn port 5000. Middleware **timeout global 30 s** (`api/app.py:20-29`) — piège pour tout streaming futur (voir [06](06-hud-telephone.md)). **CORS `allow_origins=["*"]`** (`api/app.py:40-47`) → accès depuis un téléphone / IP LAN OK.
- **SQLAlchemy 2** ORM (`api/models/sql_models.py`) + requêtes SQL brutes `text()` par endroits (users/dashboard).
- **PostgreSQL 15**. Connexion via `DATABASE_URL` (`api/config/database.py`), construite depuis `DB_USER/DB_PASSWORD/DB_NAME` + host `db`.
- Dépendances (`api/requirements.txt`) : `fastapi==0.129.0`, `sqlalchemy==2.0.23`, `psycopg2-binary`, **`numpy`, `scipy`, `pandas`, `matplotlib`** (scipy = brique trajectoire).

## Schéma DB — 7 tables (`api/init.sql`)

```
circuits ──1:N── circuit_boundaries        (side ∈ left|right, point_order)
   │  1:N── optimal_trajectories           (point_order)
   │  1:N── sessions ──1:N── sensor_data    (PK composite: session_id + timestamp)
users ──1:N── sessions
users ──1:N── notifications
```

| Table | Colonnes clés | Notes |
|---|---|---|
| `users` | id (UUID), username, email, password_hash, role, is_active, license_*, kart | `role` **CHECK à 6 valeurs** : `admin, commissaire, mechanic, instructor, driver, spectator` (`init.sql:41`). Voir divergence rôles ci-dessous. |
| `notifications` | user_id, title, message, type, read, read_at | |
| `sessions` | id, user_id (FK), circuit_id (FK), kart, created_at | |
| `sensor_data` | **PK (session_id, timestamp)**, `uwb_x/y/z`, `imu_ax..az`, `imu_gx..gz`, `steering_angle` | timestamp = BIGINT. **Aucune colonne GPS lat/lon ni cardio** : la position est stockée dans `uwb_x/uwb_y` (mètres locaux). |
| `circuits` | id, name (UNIQUE), description | |
| `circuit_boundaries` | circuit_id, side, point_order, x, y | UNIQUE(circuit_id, side, point_order) |
| `optimal_trajectories` | circuit_id, point_order, x, y | trajectoire idéale calculée par scipy |

Le nom `uwb_*` (Ultra-Wideband) est un vestige : en pratique la position vient du **GPS RTK** projeté en mètres, pas d'UWB. Voir [07-circuit-reconstruction.md](07-circuit-reconstruction.md).

### Données seedées par `init.sql` (2040 lignes)

- **5 circuits** : `Karting International de Paris` (…440010, cercle), `Circuit Weekend` (…440011, 64+64 pts), `Week Circuit` (…440012, 129 pts), `Circuit CSV v1` (…440016, 241 pts), `Circuit CSV v2` (…440017, 350 pts).
- **5 sessions** : …440000 (cercle), …440001 (ovale/Circuit Weekend), …440004/…440006/…440007 (Week Circuit & CSV).
- **~7 users** de test (`pilot`, `admin`, `commissaire`, `mechanic`, `instructor`, `spectator`, `expert`).

> ⚠️ Le circuit reconstruit **« SpeedKart Hyères (GPS) »** (id `3d01d5ed-…`) et la **session réelle ingérée** (id `11111111-…`) ne sont **PAS** dans `init.sql` : ils ont été insérés à l'exécution (SQL généré par les scripts `rpi/`) et n'existent que dans le **volume Docker local**. Non reproductibles depuis un `docker compose up` frais. Voir [07](07-circuit-reconstruction.md) et [09](09-gaps-todo.md).

## Authentification (factice)

Résumé (détails dans [03-backend-api.md](03-backend-api.md) et [09-gaps-todo.md](09-gaps-todo.md)) :

- **Compte démo** hardcodé : `demo@mokart.com` / `demo123456` → renvoie l'user `…440001` (role `admin`), token `demo-token`. Chemin en dur dans `api/auth/routes.py`, ne touche pas la DB.
- Login normal : compare un **SHA-256 non salé** (`hash_password`). Tokens `local-token-{id}` / `demo-token` **jamais vérifiés** ensuite.
- Identité transmise par **query param `?user_id=`** (pas de header d'auth). Le front n'envoie **jamais** de token en header (`app/src/services/api.ts` ne pose que `Content-Type`).
- Routes `/admin/users/*` **sans aucun contrôle d'accès**.
- **3+ formats de hash coexistent** en base : SHA-256 (login/register), bcrypt `$2b$12$…` (users seedés dans `init.sql`), préfixe `hash_…` (endpoint `/seed-users` et création admin), et littéral `'hash'` (users `pilot`/`expert`). Conséquence : hors démo, quasiment aucun user seedé ne peut se connecter.

## Divergence des vocabulaires de rôles (3 endroits)

| Source | Valeurs |
|---|---|
| DB `init.sql:41` (CHECK) | `admin, commissaire, mechanic, instructor, driver, spectator` (6) |
| `api/app.py` `/fix-database` (CHECK) | idem + `commissaire_piste` (7) |
| Front `app/src/types/user.ts` | `admin, track_manager, commissaire, mechanic, instructor, driver, spectator, device_kart` (8) |
| Backend `api/dashboard/routes.py` | branche sur `admin, driver, mechanic, observer, commissaire_piste` |

Ces vocabulaires ne coïncident pas → source de bugs (voir [09](09-gaps-todo.md) et [10](10-roles-permissions.md)).

## Flux de données (état réel)

```
┌─────────────────────────────────────────────────────────────────┐
│  EMBARQUÉ (rpi/) — scripts autonomes, NON branchés à l'API       │
│  imu.py (WitMotion 0x55)   PON_gps.py (NTRIP RTK)   hr_ble.py    │
│  kart.py → UDP JSON 30 Hz → server.py (écran TFT)  [x,y,...=0.0] │
└─────────────────────────────────────────────────────────────────┘
        ⇣  (pas de lien automatique — ingestion MANUELLE via scripts)
   rpi/ingest_session.py  /  rpi/build_circuit.py  → SQL → psql
        ⇣
┌───────────────┐   REST/JSON    ┌──────────────────┐   SQL   ┌──────────┐
│  app (React)  │ ─────────────▶ │  api (FastAPI)   │ ──────▶ │ Postgres │
│  web (React)  │                │  :5000 (/8081)   │         │  :5432   │
└───────────────┘                └──────────────────┘         └──────────┘
        ▲                                                   
        │  /hud/:sessionId (public) rejoue GET /sessions/{id}/hud-frames
        └── Téléphone du pilote (HUD, ouvert par tag NFC)   

┌───────────────┐   SSE compat OpenAI   ┌──────────────┐
│  ai-front     │ ────────────────────▶ │  ai-backend  │ → LLM (LLM_BASE_URL)
│  :4000/8003   │                       │  :8000/8002  │   (Ollama en dev)
└───────────────┘                       └──────────────┘
```

- **Il n'y a AUCUN temps réel** (WebSocket/SSE) dans le repo côté API/front (une seule mention en commentaire dans `app/src/hooks/useTelemetryFrames.ts`). La télémétrie « live » du dashboard est simulée.
- L'agent IA est **isolé** : aucune connexion à la DB ni à l'API métier.

## `start.sh`

Orchestrateur bash (`start.sh`) : sans argument = `docker-compose up -d` ; `build` / `rebuild` / `prod` / `stop` / `clean`. En mode dev, la touche **`r`** dans la boucle interactive supprime le volume `mokart_postgres_data` (reset DB). Détails d'usage dans [08-dev-setup.md](08-dev-setup.md).

Voir aussi : [03-backend-api.md](03-backend-api.md), [04-frontends.md](04-frontends.md), [09-gaps-todo.md](09-gaps-todo.md).
