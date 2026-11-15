# Mémoire projet Mokart

État du code vérifié le 14 novembre 2026 sur `92-repository-cleanup` (issue #92). Cette documentation décrit le dépôt ; l'état instantané des services et des secrets se vérifie dans Railway et Cloudflare.

Mokart réunit la vitrine `web/`, le tableau de bord `app/`, l'API FastAPI `api/`, PostgreSQL, l'agent IA (`ai-backend/`, `ai-front/`) et les outils embarqués `rpi/`. Le déploiement utilise Railway, avec les branches `dev` et `production`.

| Fichier | Sujet |
| --- | --- |
| [01-overview.md](01-overview.md) | Produit, équipe, branches et domaines |
| [02-architecture.md](02-architecture.md) | Services, base de données et flux |
| [03-backend-api.md](03-backend-api.md) | Routes API et authentification |
| [04-frontends.md](04-frontends.md) | Vitrine et tableau de bord |
| [05-rpi-embedded.md](05-rpi-embedded.md) | Matériel et scripts Raspberry Pi |
| [06-hud-telephone.md](06-hud-telephone.md) | HUD téléphone et replay |
| [07-circuit-reconstruction.md](07-circuit-reconstruction.md) | Reconstruction GPS du circuit |
| [08-dev-setup.md](08-dev-setup.md) | Démarrage local et CI |
| [09-gaps-todo.md](09-gaps-todo.md) | Limites et travaux ouverts |
| [10-roles-permissions.md](10-roles-permissions.md) | Rôles et autorisations |

L'authentification par mot de passe et JWT existe dans l'API. Plusieurs vues restent des démonstrations ou simulations ; voir [09-gaps-todo.md](09-gaps-todo.md). La configuration de déploiement se trouve dans [docs/railway.md](../docs/railway.md).
