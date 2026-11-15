# 02 — Architecture

## Services

| Service | Source | Usage |
| --- | --- | --- |
| `web` | `web/` | Vitrine React |
| `app` | `app/` | Tableau de bord React et HUD |
| `api` | `api/` | FastAPI, PostgreSQL et calcul de trajectoire |
| `db` | `db/Dockerfile` sur Railway, `postgres:15-alpine` en Compose | PostgreSQL persistant |
| `ai-backend`, `ai-front` | Dossiers homonymes | Agent et interface de chat |
| `backup` | `backup/` | Export PostgreSQL vers R2, tâche planifiée |
| `nocodb` | `.nocodb/` | Administration optionnelle, désactivée sur Railway |

`docker-compose.yml` sert au développement local. `docker-compose.prod.yml` est utilisé par la CI pour tester une configuration de production locale ; Railway construit chaque service à partir de son Dockerfile. La liste des domaines, Dockerfiles et variables Railway est dans [docs/railway.md](../docs/railway.md).

En local : vitrine `localhost:8080`, app `localhost:8000`, API `localhost:8081`, agent `localhost:8002`, interface IA `localhost:8003`. `db` est lié à `127.0.0.1:5432`. Les blocs NocoDB sont commentés dans les deux fichiers Compose ; après réactivation, son port local est `127.0.0.1:8090`.

## Données et sécurité

`api/init.sql` initialise le schéma et les données de départ uniquement lors de la création d'un volume PostgreSQL vide. Les données insérées ensuite ne sont pas recréées par un redéploiement. La sauvegarde Railway est prévue mercredi et samedi à 02 h UTC, avec deux dumps distincts conservés par base ; la première sauvegarde de production restait à vérifier lors du dernier contrôle.

`/auth/login` et `/auth/register` utilisent des mots de passe hachés ; les JWT expirent après 12 heures. Les routes protégées vérifient le jeton et, selon la route, le rôle ou l'accès à la session. Les permissions détaillées du front ne sont pas toutes appliquées comme scopes dans l'API. Voir [10-roles-permissions.md](10-roles-permissions.md).

## Flux de télémétrie

Les scripts `rpi/` collectent ou transforment les traces GNSS et IMU. `rpi/ingest_session.py` et `rpi/build_circuit.py` peuvent générer du SQL pour remplir une base locale. L'API lit les sessions et calcule des statistiques, trajectoires et frames HUD. Le HUD de `app/` récupère ces frames et les rejoue ; il ne reçoit pas encore un flux temps réel du kart.
