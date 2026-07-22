# 08 — Setup développeur

## Lancer la stack (dev)

```bash
# à la racine du repo
docker compose up -d --build      # ou: ./start.sh build
```

Puis :
- Landing (`web`) : http://localhost:8080
- Dashboard (`app`) : http://localhost:8000
- API : http://localhost:8081 (docs FastAPI : http://localhost:8081/docs)
- AI chat : http://localhost:8003 · AI backend : http://localhost:8002
- Postgres : localhost:5432

`docker compose up` charge **automatiquement** `docker-compose.override.yml` (présent à la racine), qui vide `REACT_APP_API_URL` pour le service `app` — utile pour le test HUD téléphone ([06](06-hud-telephone.md)), transparent sinon. Pour un comportement dev « pur », vider/supprimer ce fichier.

### `start.sh` (orchestrateur)

| Commande | Effet |
|---|---|
| `./start.sh` | `docker-compose up -d` (services existants) |
| `./start.sh build` | up `--build` (prune si disque < 1 Go) |
| `./start.sh rebuild` | down `--rmi all` puis up `--build --no-cache --force-recreate` |
| `./start.sh prod` | `docker-compose.prod.yml up -d --build` (annonce 9980/9981 mais mappe 8080/8000/8081) |
| `./start.sh stop` | `docker-compose down` |
| `./start.sh clean` | down `--rmi all --volumes` + prune (destructif) |

En mode dev interactif, dans la boucle « appuyez sur une touche » : **`r`** = down + `docker volume rm mokart_postgres_data` + up → **reset complet de la DB** (re-seed via `init.sql`). ⚠️ efface le circuit reconstruit et les sessions ingérées manuellement.

## Fichier `.env` (racine)

Requis par `docker-compose.yml` (`env_file: .env`). Le `.env` de dev présent (git-ignoré) contient des **placeholders de développement local** :

```
DB_USER=mokart
DB_PASSWORD=mokart
DB_NAME=mokart
REACT_APP_API_URL=http://localhost:8081
LLM_MODEL=mokart-agent
LLM_BASE_URL=http://localhost:11434/v1     # Ollama local (dev)
LLM_API_KEY=dev
PGADMIN_EMAIL=admin@mokart.fr
PGADMIN_PASSWORD=admin
```

⚠️ **`.env.example` est incomplet** : il contient `DB_*`, `REACT_APP_API_URL`, `PGADMIN_*`, mais **PAS** `LLM_MODEL`/`LLM_BASE_URL`/`LLM_API_KEY` (requis par `ai-backend`/`ai-front`) ni `NTRIP_USER`/`NTRIP_PASS` (requis par `rpi/PON_gps.py`, non dockerisé). Il faut donc compléter `.env` à la main.

Ces identifiants `mokart/mokart` sont de **pures valeurs de dev local sans valeur** — aucun secret réel n'est versionné (`.env` est dans `.gitignore`).

## Connexion / rôles pour tester le dashboard

- Compte démo : **`demo@mokart.com` / `demo123456`** → user `…440001`, role `admin` (chemin hardcodé, ne touche pas la DB).
- Le **role-switcher de démo** (Header) permet de changer de rôle localement. ⚠️ Choisir `instructor`/`commissaire`/`spectator` **casse** `Home` (bug `/dashboard/data`, voir [09](09-gaps-todo.md)). Rôles qui marchent : `admin`, `driver`, `mechanic`.

## Ingérer une session (pour le HUD)

`rpi/ingest_session.py` (stdlib pure). Deux modes.

```bash
cd rpi
# Mode --emit-sql (pipe vers psql du conteneur) :
python ingest_session.py data/gnss_20260719_141853.csv \
  --imu data/imu_20260719_141915.csv \
  --origin 43.4046596,6.0123885 \
  --session-id 11111111-1111-1111-1111-111111111111 \
  --circuit-id 3d01d5ed-ddc0-4409-9928-c89f54ecc66e \
  --kart "Sodi RT8 #7" --emit-sql \
  | docker compose exec -T db psql -U mokart -d mokart

# Mode direct (nécessite psycopg2 + DATABASE_URL ou DB_* dans l'env) :
python ingest_session.py data/gnss_20260719_141853.csv --imu data/imu_20260719_141915.csv \
  --origin 43.4046596,6.0123885
```

Arguments utiles : `--rate` (10 Hz défaut) · `--user-id` (défaut `…440001`) · `--session-id`/`--circuit-id` (sinon générés). Le script affiche l'URL HUD `/hud/<session_id>` en fin d'exécution. **Utiliser la même origine que le circuit** pour aligner la trajectoire (voir [07](07-circuit-reconstruction.md)).

Ensuite : ouvrir `http://localhost:8000/hud/<session_id>` (ou depuis un téléphone, voir [06](06-hud-telephone.md)).

## Reconstruire un circuit

Voir [07-circuit-reconstruction.md](07-circuit-reconstruction.md) :
```bash
cd rpi
python build_circuit.py data/gnss_*.csv --name "SpeedKart Hyères" --width 8 --emit-sql \
  | docker compose exec -T db psql -U mokart -d mokart
```

## Vérifs rapides

```bash
curl localhost:8081/health                          # {"status":"ok","database":"connected"}
curl localhost:8081/sessions/                        # liste des sessions
curl "localhost:8081/sessions/<id>/hud-frames" | head
```

## CI (`.github/workflows/`)

- `build_dev.yml` : `docker compose build`.
- `build_prod.yml` : `docker compose -f docker-compose.prod.yml up --build -d` + `ps` (smoke test).
- Les deux sont gardés par un job `check-commits` : s'exécutent **sur chaque pull request**, mais sur **push vers `main` seulement si `commit_count % 5 == 0`** (donc ~1 build sur 5). **Aucun déploiement automatique** — la prod est déployée manuellement sur le VPS.

## Environnement machine (Tom)

macOS, réseau avec **Tailscale**. Le DNS local Tailscale (`100.100.100.100`) peut échouer sur des domaines publics → si un `curl` vers `mokart.fr`/`api.mokart.fr` timeout, contourner avec `--resolve <domaine>:443:<IP-Cloudflare>`.

Voir aussi : [02-architecture.md](02-architecture.md), [06-hud-telephone.md](06-hud-telephone.md), [09-gaps-todo.md](09-gaps-todo.md).
