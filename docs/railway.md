# Déploiement Railway

Le projet Railway `Mokart` a deux environnements persistants : `dev` et `production`.
Chaque service suit la branche Git de même nom que son environnement. Les branches de travail
suivent les conventions `feature/nom` et `fix/nom`, puis sont fusionnées dans `dev`
avant promotion dans `production`. La branche GitHub par défaut est `dev`.

| Service | Source | Port | Accès |
| --- | --- | --- | --- |
| web | `/web`, `Dockerfile.prod` | 80 | public |
| app | `/app`, `Dockerfile.railway` | 80 | public |
| api | `/api`, `Dockerfile.railway` | 5000 | public, et via le proxy `/api` de `app` |
| db | `/`, `db/Dockerfile` | 5432 | privé, volume `/var/lib/postgresql/data` |
| ai-backend | `/ai-backend`, `Dockerfile` | 8000 | privé |
| ai-frontend | `/ai-front`, `Dockerfile` | 4000 | public |
| backup | `/`, `backup/Dockerfile` | aucun | privé, tâche cron |

`app` transmet `/api/` à `api.railway.internal:5000`. Railway isole le réseau privé de
chaque environnement. `db` et `ai-backend` restent sans domaine public.

| Service | Production | Dev |
| --- | --- | --- |
| web | `mokart.fr`, `www.mokart.fr` | `dev.mokart.fr` |
| app | `app.mokart.fr` | `app-dev.mokart.fr` |
| api | `api.mokart.fr` | `api-dev.mokart.fr` |
| ai-frontend | `ai.mokart.fr` | `ai-dev.mokart.fr` |

Variables à configurer séparément dans chaque environnement :

- `PORT` sur chaque service HTTP : `80` pour `web` et `app`, `5000` pour `api`,
  `8000` pour `ai-backend`, `4000` pour `ai-frontend`.
- `db` : `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, et
  `PGDATA=/var/lib/postgresql/data/pgdata` pour que PostgreSQL initialise un sous-dossier du volume.
- `api` : `DATABASE_URL`, construit avec les références Railway vers les variables de `db`.
- `ai-backend` : `LLM_API_KEY`, `LLM_MODEL`, `LLM_BASE_URL`.
- `ai-front` : `AGENT_API_URL=http://ai-backend.railway.internal:8000`, `LLM_MODEL`.

Le schéma et les données de démonstration de `api/init.sql` sont chargés uniquement à la
création d'un volume PostgreSQL vide. Les déploiements suivants conservent les données ;
une évolution du schéma après le premier démarrage exige une migration explicite.

Pour promouvoir une version, fusionner `dev` dans `production`. Railway reconstruit alors
les services concernés à partir de la branche `production`.

## Sauvegardes PostgreSQL

Le service `backup` lance `pg_dump` sur chaque base listée, vérifie le fichier avec
`pg_restore --list`, l'envoie sur un stockage compatible S3 (Cloudflare R2), puis supprime
les sauvegardes plus anciennes que `BACKUP_RETENTION_DAYS`. Il s'arrête à la fin, Railway
le relance selon sa planification. Un échec de dump ou d'envoi termine le service en erreur.

Réglages Railway du service `backup`, dans chaque environnement :

- Settings, Cron Schedule : `0 2 * * *` (tous les jours à 2h UTC).
- Settings, Restart Policy : `Never`.
- Aucun domaine public.

Variables :

- `PGHOST=db.railway.internal`, `PGPORT=5432`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`,
  construits avec les références Railway vers les variables de `db`.
- `BACKUP_DATABASES` : bases à sauvegarder séparées par des espaces, par défaut `PGDATABASE`.
  Mettre `mokart nocodb` (avec le nom réel de la base) quand NocoDB est déployé.
- `S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com`, `S3_BUCKET`.
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` : jeton API R2 limité au bucket, en
  lecture et écriture.
- `BACKUP_RETENTION_DAYS` : `30` par défaut, `0` pour tout conserver.

Les fichiers sont rangés sous `<environnement>/<base>/<base>-<date UTC>.dump`.
`RAILWAY_ENVIRONMENT_NAME` sépare `dev` et `production` dans le même bucket ;
`BACKUP_PREFIX` permet de forcer un autre préfixe.

Restaurer la dernière sauvegarde d'une base, depuis le shell du service `backup` :

```sh
mokart-restore mokart
```

Restaurer une sauvegarde précise :

```sh
mokart-restore mokart mokart-20261017T020000Z.dump
```

La restauration remplace les tables existantes de la base ciblée. En local, lancer
`docker compose run --rm backup` pour une sauvegarde et
`docker compose run --rm backup mokart-restore <base>` pour une restauration, avec les
variables `S3_*` du fichier `.env`.
