# Déploiement Railway

Le projet Railway `Mokart` a deux environnements persistants : `dev` et `production`.
Chaque service suit la branche Git de même nom que son environnement. Les branches de travail
suivent la convention `feature/nom` et sont fusionnées dans `dev` avant promotion dans `production`.

| Service | Source | Port | Accès |
| --- | --- | --- | --- |
| web | `/web`, `Dockerfile.prod` | 80 | public |
| app | `/app`, `Dockerfile.railway` | 80 | public |
| api | `/api`, `Dockerfile.railway` | 5000 | privé, via le proxy `/api` de `app` |
| db | `/`, `db/Dockerfile` | 5432 | privé, volume `/var/lib/postgresql/data` |
| ai-backend | `/ai-backend`, `Dockerfile` | 8000 | privé |
| ai-frontend | `/ai-front`, `Dockerfile` | 4000 | public |

`app` transmet `/api/` à `api.railway.internal:5000`. Les services privés ne doivent pas
recevoir de domaine public. Railway isole le réseau privé de chaque environnement.

Variables à configurer séparément dans chaque environnement :

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
