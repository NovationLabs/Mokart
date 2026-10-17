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
| nocodb | `/`, `nocodb/Dockerfile` | 8080 | protégé par Cloudflare Access |

`app` transmet `/api/` à `api.railway.internal:5000`. Railway isole le réseau privé de
chaque environnement. `db` et `ai-backend` restent sans domaine public.

| Service | Production | Dev |
| --- | --- | --- |
| web | `mokart.fr`, `www.mokart.fr` | `dev.mokart.fr` |
| app | `app.mokart.fr` | `app-dev.mokart.fr` |
| api | `api.mokart.fr` | `api-dev.mokart.fr` |
| ai-frontend | `ai.mokart.fr` | `ai-dev.mokart.fr` |
| nocodb | `db.mokart.fr` | `db-dev.mokart.fr` |

Variables à configurer séparément dans chaque environnement :

- `PORT` sur chaque service HTTP : `80` pour `web` et `app`, `5000` pour `api`,
  `8000` pour `ai-backend`, `4000` pour `ai-frontend`.
- `db` : `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, et
  `PGDATA=/var/lib/postgresql/data/pgdata` pour que PostgreSQL initialise un sous-dossier du volume.
- `api` : `DATABASE_URL`, construit avec les références Railway vers les variables de `db`.
- `ai-backend` : `LLM_API_KEY`, `LLM_MODEL`, `LLM_BASE_URL`.
- `ai-front` : `AGENT_API_URL=http://ai-backend.railway.internal:8000`, `LLM_MODEL`.
- `nocodb` : `PORT=8080`,
  `NC_DB=pg://db.railway.internal:5432?u=${{db.POSTGRES_USER}}&p=${{db.POSTGRES_PASSWORD}}&d=nocodb`,
  `NC_AUTH_JWT_SECRET` (`openssl rand -base64 48`, une valeur par environnement), `NC_ADMIN_EMAIL`,
  `NC_ADMIN_PASSWORD` (8 caractères minimum avec majuscule, chiffre et caractère spécial),
  `NC_PUBLIC_URL` (`https://db.mokart.fr` ou `https://db-dev.mokart.fr`),
  `NC_ALLOW_LOCAL_EXTERNAL_DBS=true`, `NC_DISABLE_TELE=true`.

Le schéma et les données de démonstration de `api/init.sql` sont chargés uniquement à la
création d'un volume PostgreSQL vide. Les déploiements suivants conservent les données ;
une évolution du schéma après le premier démarrage exige une migration explicite.

Pour promouvoir une version, fusionner `dev` dans `production`. Railway reconstruit alors
les services concernés à partir de la branche `production`.

## NocoDB

NocoDB donne une interface d'administration de la base PostgreSQL. Ses métadonnées sont stockées
dans une base `nocodb` séparée, créée automatiquement sur le serveur `db` au premier démarrage :
le schéma de `mokart` n'est jamais modifié. Le compte `NC_ADMIN_EMAIL` est créé au premier
démarrage, et chaque démarrage réserve les inscriptions aux invitations.

Pour afficher les tables Mokart, créer une base dans NocoDB avec une source PostgreSQL externe :
hôte `db.railway.internal` sur Railway ou `db` en local, port `5432`, base, utilisateur et mot de
passe du service `db`, schéma `public`.

L'interface donne un accès complet aux données. Les domaines `db.mokart.fr` et `db-dev.mokart.fr`
doivent être placés derrière une application Cloudflare Access limitée aux membres de l'équipe.
En local, elle est disponible sur `http://localhost:8090`.
