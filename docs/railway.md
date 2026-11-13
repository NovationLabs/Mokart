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
| nocodb | `/`, `nocodb/Dockerfile` | 8080 | privé, publié par Cloudflare Tunnel et Access |

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
  `NC_ALLOW_LOCAL_EXTERNAL_DBS=true`, `NC_DISABLE_TELE=true`,
  `NC_APP_DB_HOST=db.railway.internal`,
  `NC_APP_DB_USER=${{db.POSTGRES_USER}}`,
  `NC_APP_DB_PASSWORD=${{db.POSTGRES_PASSWORD}}`,
  `NC_APP_DB_NAME=${{db.POSTGRES_DB}}`, `CF_TUNNEL_TOKEN` (un tunnel différent par environnement).

Le schéma et les données de démonstration de `api/init.sql` sont chargés uniquement à la
création d'un volume PostgreSQL vide. Les déploiements suivants conservent les données ;
une évolution du schéma après le premier démarrage exige une migration explicite.

Pour promouvoir une version, fusionner `dev` dans `production`. Railway reconstruit alors
les services concernés à partir de la branche `production`.

## Sauvegardes PostgreSQL

Le service `backup` lance `pg_dump` sur chaque base listée et vérifie le fichier avec
`pg_restore --list`. Il compare l'empreinte du contenu SQL avec celle du dernier dump :
si l'export SQL est identique, il ne téléverse pas de nouveau fichier. Sinon, il l'envoie
vers Cloudflare R2. Il conserve les deux derniers dumps distincts par base et par
environnement. Il s'arrête à la fin ; Railway le relance selon sa planification.
Un échec de dump ou d'envoi termine le service en erreur.

Réglages Railway du service `backup`, dans chaque environnement :

- Settings, Cron Schedule : `0 2 * * 3,6` (mercredi et samedi à 2h UTC).
- Settings, Restart Policy : `Never`.
- Aucun domaine public.
- Le processus s'arrête après chaque sauvegarde ; il ne réserve pas de RAM entre deux exécutions.

Créer dans le compte Cloudflare de Mokart deux buckets R2 privés en classe Standard,
un pour `dev` et un pour `production`. Créer une clé d'accès R2 limitée à chaque bucket,
avec les droits de lecture et d'écriture nécessaires à l'envoi, à la liste et à la
suppression des anciennes sauvegardes. Garder les clés uniquement dans les variables
Railway de l'environnement correspondant. Ne pas exposer les buckets publiquement.

Variables :

- `PGHOST=db.railway.internal`, `PGPORT=5432`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`,
  construits avec les références Railway vers les variables de `db`.
- `BACKUP_DATABASES` : bases à sauvegarder séparées par des espaces, par défaut `PGDATABASE`.
  Mettre `mokart nocodb` (avec le nom réel de la base) quand NocoDB est déployé.
- `S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com`, `S3_BUCKET`
  (le bucket de l'environnement).
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` : jeton API R2 limité au bucket, en
  lecture et écriture.
- `BACKUP_KEEP_COUNT=2` dans les deux environnements. L'ancienne variable
  `BACKUP_RETENTION_DAYS` n'est plus utilisée.

Les dumps personnalisés contiennent une date de création et ne sont donc pas comparés
octet par octet. Le service calcule une empreinte SHA-256 de leur sortie SQL répétable
et la stocke dans les métadonnées R2. Pour un ancien dump sans empreinte, il le
télécharge et le compare. Si la base reste inchangée longtemps, le dernier dump est
conservé même s'il a plus de quelques semaines. Un changement d'ordre des lignes dans
un export peut produire une nouvelle empreinte même si les données logiques n'ont pas changé.

Les fichiers sont rangés sous `<environnement>/<base>/<base>-<date UTC>.dump`.
`RAILWAY_ENVIRONMENT_NAME` sépare aussi les sauvegardes par environnement dans les
chemins ; `BACKUP_PREFIX` permet de forcer un autre préfixe. Vérifier un premier
fichier dans R2 et tester une restauration dans une base de test avant de considérer
les sauvegardes comme opérationnelles.

Pour restaurer sur Railway, lancer une tâche ponctuelle avec la même image et les
mêmes variables que `backup`, sans planification, avec la commande de démarrage
correspondante. La tâche doit être arrêtée après la restauration. Restaurer d'abord
dans une base de test et vérifier les données avant toute intervention en production.

Commande pour restaurer la dernière sauvegarde d'une base :

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
## NocoDB

NocoDB donne une interface d'administration de la base PostgreSQL. Ses métadonnées sont stockées
dans une base `nocodb` séparée, créée automatiquement sur le serveur `db` au premier démarrage :
le schéma de `mokart` n'est jamais modifié. Le compte `NC_ADMIN_EMAIL` est créé au premier
démarrage, et chaque démarrage réserve les inscriptions aux invitations.

Le service `nocodb` est actuellement désactivé en dev et en production, avec ses
déploiements automatiques coupés. Avant de le réactiver, retirer la commande de
démarrage qui termine immédiatement et remettre sa politique de redémarrage.
Ne lui attribuer **aucun domaine public Railway** : le conteneur lance
`cloudflared` avec `CF_TUNNEL_TOKEN`. Chaque environnement a son tunnel Cloudflare, dont le
hostname public pointe vers `http://localhost:8080`. Les CNAME Cloudflare proxifiés pointent
vers les tunnels, et Cloudflare Access n'autorise que les adresses de l'équipe. La configuration
du tunnel vérifie aussi le JWT Access avant de transmettre une requête à NocoDB.

Au démarrage, `nocodb/bootstrap.js` crée si nécessaire la base NocoDB `Mokart` et sa source
PostgreSQL externe vers la base applicative, en lecture seule dans NocoDB. Il vérifie leur
présence aux redéploiements sans créer de doublons. Les variables `NC_APP_DB_*` doivent être
configurées dans **dev** et **production** avant le premier déploiement. Si l'initialisation
échoue, le conteneur s'arrête avec une erreur et Railway le redémarre. La lecture seule de
NocoDB n'est pas une restriction PostgreSQL : le compte utilisé conserve les droits de `db`.

L'interface expose les données. Les domaines `db.mokart.fr` et `db-dev.mokart.fr`
doivent être placés derrière une application Cloudflare Access limitée aux membres de l'équipe.
En local, elle est disponible sur `http://localhost:8090`.
