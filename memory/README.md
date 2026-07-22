# Mémoire projet Mokart

Documentation dense et vérifiée du monorepo **Mokart**, destinée aux contributeurs et aux agents IA. Chaque fichier est autonome, scannable, et relié aux autres. Les faits sont vérifiés contre le code réel du repo (état constaté **2026-07-22**) ; les chemins sont donnés en `fichier:ligne` quand c'est utile.

## Résumé en 5 lignes

Mokart est un système de **télémétrie pour karting de location** : un boîtier embarqué (Raspberry Pi Zero 2 W dans un volant imprimé en 3D) capte IMU + GPS RTK (partenaire Point One Navigation), et une plateforme web SaaS affiche analyse de trajectoire, HUD et leaderboards. Pitch : « Race Data. Decimeter Precision. » (RTK ~10 cm). Le repo est un **monorepo Docker Compose** : API FastAPI + PostgreSQL, deux fronts React (landing `web/`, dashboard `app/`), un agent IA LangGraph, et des scripts embarqués `rpi/`. **État réel = prototype avancé** : la vraie brique algorithmique (trajectoire optimale scipy) et l'analyse de télémétrie fonctionnent ; mais l'auth est factice, beaucoup de pages sont mockées, et la télémétrie live n'est pas branchée. La feature récente est le **HUD téléphone** (remplacer l'écran TFT du volant par le téléphone du pilote via un tag NFC).

## Comment lire cette doc

Ordre de lecture recommandé pour un nouvel arrivant : `01` → `02` → `09` (pour cadrer les attentes), puis les fichiers thématiques selon le besoin.

| Fichier | Contenu |
|---|---|
| [01-overview.md](01-overview.md) | Produit, équipe NovationLabs, URLs prod, partenaires, roadmap |
| [02-architecture.md](02-architecture.md) | Services Docker, ports, stack, flux de données, schéma DB (7 tables), auth, diagramme |
| [03-backend-api.md](03-backend-api.md) | FastAPI : tous les routers et endpoints, l'endpoint `hud-frames` en détail, algo trajectoire scipy |
| [04-frontends.md](04-frontends.md) | `web/` (landing) + `app/` (dashboard, pages, RBAC front, mocké vs réel) |
| [05-rpi-embedded.md](05-rpi-embedded.md) | RPi Zero 2 W, capteurs (IMU/GPS RTK/cardio BLE), flux UDP, volant 3D, tous les scripts |
| [06-hud-telephone.md](06-hud-telephone.md) | La feature HUD téléphone : archi cloud, route `/hud`, contrat de frame, test sur téléphone, upgrade live |
| [07-circuit-reconstruction.md](07-circuit-reconstruction.md) | `build_circuit.py` : reconstruction du circuit depuis GPS multi-tours, format `rpi/data/` |
| [08-dev-setup.md](08-dev-setup.md) | Lancer le projet, `.env`, ports, ingérer une session, reconstruire un circuit |
| [09-gaps-todo.md](09-gaps-todo.md) | **État réel, écarts docs↔code, bugs connus, roadmap** — à lire absolument |
| [10-roles-permissions.md](10-roles-permissions.md) | 8 rôles RBAC + scopes (spec `docs/`) vs implémentation réelle |

## Conventions

- **Repo** : `/Users/clerctom/Desktop/Mokart`, org GitHub `NovationLabs`, repo `NovationLabs/Mokart`, branche `main`.
- Aucun secret réel n'est présent ici. Les identifiants `.env` de dev (`mokart` / `mokart` / `mokart`) sont des **placeholders de développement local** cités comme tels.
- Quand la doc dit « mocké », « factice » ou « placeholder », c'est un fait vérifié dans le code, pas un jugement.
