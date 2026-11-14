# 08 — Setup développeur

État vérifié le 14 novembre 2026. Lancer les services avec **Docker Compose**, depuis la racine du dépôt. `start.sh` a été retiré. Les fichiers `.env` restent locaux et ne doivent pas être commités.

```sh
cp .env.example .env
docker compose up -d --build
docker compose ps
```

Le `.env.example` fournit les noms de variables de la base, de l'API, de NocoDB et des sauvegardes. Adapter les valeurs avant le démarrage ; les valeurs d'exemple ne sont pas des secrets utilisables en production. `ai-backend` exige aussi sa configuration LLM (`LLM_API_KEY`, `LLM_MODEL`, `LLM_BASE_URL`) si l'agent doit répondre. Le module GPS `rpi/PON_gps.py` lit séparément `NTRIP_USER` et `NTRIP_PASS`.

| Service local | Adresse |
| --- | --- |
| Vitrine | `http://localhost:8080` |
| App | `http://localhost:8000` |
| API | `http://localhost:8081` |
| Agent | `http://localhost:8002` |
| Interface IA | `http://localhost:8003` |
| NocoDB, après décommentage du service Compose | `http://localhost:8090` |

`docker compose down` arrête les conteneurs ; le volume PostgreSQL persiste. `docker compose down -v` efface aussi les données locales. `api/init.sql` n'est chargé qu'à la création d'un volume vide. Pour les tests de la configuration de production locale, utiliser `docker compose -f docker-compose.prod.yml up -d --build`.

## Données GPS et HUD

`rpi/build_circuit.py` reconstruit un circuit à partir de `rpi/data/gnss_*.csv`. `rpi/ingest_session.py` peut produire du SQL pour insérer une session et ses capteurs. Voir [07-circuit-reconstruction.md](07-circuit-reconstruction.md) pour la commande et l'origine GPS ; utiliser la même origine lors de l'ingestion. Ces opérations ne sont pas automatiques au démarrage de Compose.

## CI et branches

`dev` est la branche par défaut. `build_dev.yml` vérifie les images Docker de développement, `build_prod.yml` une configuration de production, `lint.yml` le lint Python, le typage et le build des deux fronts. Les workflows de sécurité sont dans `.github/workflows/`. Les changements passent par une branche de travail, puis par `dev` avant promotion dans `production`. Les services Railway utilisent leurs Dockerfiles propres ; voir [docs/railway.md](../docs/railway.md).
