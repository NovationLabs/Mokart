# 01 — Vue d'ensemble

## Le produit

**Mokart** = système de télémétrie « pro » pour le **karting de location** (rental karting). Deux moitiés :

1. **Boîtier embarqué** : un Raspberry Pi Zero 2 W logé dans un **volant imprimé en 3D**, avec IMU, antenne GPS RTK et (optionnel) capteur cardiaque BLE. Voir [05-rpi-embedded.md](05-rpi-embedded.md).
2. **Plateforme web SaaS** : landing publique + dashboard pilote/exploitant (analyse de trajectoire, HUD, leaderboards, gestion de flotte). Voir [04-frontends.md](04-frontends.md).

Pitch marketing : **« Race Data. Decimeter Precision. »** — argument clé = **GPS RTK ~10 cm** via le partenaire **Point One Navigation** (réseau de correction, caster NTRIP `virtualrtk.pointonenav.com`). La fréquence télémétrie est annoncée à 50 Hz dans la doc marketing (voir les nuances dans [09-gaps-todo.md](09-gaps-todo.md)).

Fonctions annoncées : live delta au volant, analyse de trajectoire (ligne optimale), leaderboards, comparaison de tours. Concurrents cités sur la landing : Apex, Sodi, RaceFacer.

## Équipe & organisation

- **Org GitHub** : `NovationLabs`. Repo : `NovationLabs/Mokart`. Branche principale : `main`.
- Projet d'étudiants **Epitech Marseille**. Équipe (README) :
  - Léo GREGORI
  - Clément DORGE
  - Selim BOUASKER
  - Anthony COLOMBANI-GAILLEUR
  - **Tom CLERC** (propriétaire de cette machine ; travaille par ailleurs chez Ramify — Mokart est un projet distinct, étudiant/side)
- Monorepo local : `/Users/clerctom/Desktop/Mokart`.

## URLs de production (derrière Cloudflare)

| URL | Cible | Dossier source |
|---|---|---|
| `https://mokart.fr` | Landing publique | `web/` |
| `https://app.novationlabs.fr` | Dashboard pilote (titre « MoKart App ») | `app/` |
| `https://api.mokart.fr` | API FastAPI | `api/` |

Déploiement : **VPS manuel** via `./start.sh prod` (pas de déploiement automatique). Le CI GitHub ne fait que du build/smoke-test (voir [02-architecture.md](02-architecture.md) et [08-dev-setup.md](08-dev-setup.md)).

## Partenaires (assets présents dans `web/public/`)

- **Point One Navigation** — GPS RTK (logo `trusted_by/point_one.png`, `logo/point_one.png`).
- **Epitech** — école (logo `logo/epitech.png`).
- **SpeedKart Hyères** — circuit de test réel à Hyères (logo `trusted_by/speedkart.png`). **Partenariat marqué « en pause »** dans le code de la landing (blocs commentés dans `web/src/pages/Home.tsx`, `About.tsx`, `TermsOfService.tsx`). C'est le circuit d'où viennent les vraies données GPS de `rpi/data/`.

## Roadmap (doc `docs/Features_List.md`)

- **V2.0 (Q3 2026)** : mode multijoueur, IA d'analyse (coaching, prédictions).
- **V3.0 (Q1 2027)** : réseau multi-sites, applications mobiles natives.

> ⚠️ `docs/Features_List.md` décrit une plateforme beaucoup plus complète que le code réel (14 pages annoncées, WebSockets/MQTT 50 Hz, Redis, GPIO…). Traiter ce document comme une **cible produit**, pas comme un état des lieux. Détails dans [09-gaps-todo.md](09-gaps-todo.md).

Voir ensuite : [02-architecture.md](02-architecture.md), [09-gaps-todo.md](09-gaps-todo.md).
