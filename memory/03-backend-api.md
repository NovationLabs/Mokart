# 03 — Backend API

L'application FastAPI est dans `api/app.py`. `GET /health` vérifie PostgreSQL. La documentation interactive n'est exposée que si `API_DOCS=true`.

| Préfixe | Fichier | Fonctions principales |
| --- | --- | --- |
| `/auth` | `api/auth/routes.py` | Inscription, connexion, JWT |
| `/sessions` | `api/sessions/routes.py` | Sessions, capteurs, statistiques, trajectoire, frames HUD |
| `/circuits` | `api/circuits/routes.py` | Circuits, bordures, optimisation et comparaison |
| `/users` | `api/users/routes.py` | Profil et notifications |
| `/admin/users` | `api/users/routes.py` | Gestion des comptes réservée à l'admin |
| `/dashboard` | `api/dashboard/routes.py` | Données encore synthétiques |

## Authentification

`api/auth/passwords.py` gère le hachage ; `tokens.py` signe les JWT ; `dependencies.py` charge l'utilisateur et contrôle des rôles. `SECRET_KEY` doit être stable et forte sur Railway : sinon une clé temporaire est générée à chaque démarrage. Le compte démo (`demo@mokart.com`) dépend de `DEMO_MODE`. Le limiteur de tentatives est en mémoire du processus.

Les routes de sessions vérifient l'accès aux données d'un utilisateur. L'envoi de données capteurs exige `admin` ou `device_kart`. Les routes de circuits demandent un JWT ; `/admin/users` demande le rôle `admin`. Exception à traiter : `GET /sessions/{id}/hud-frames` ne vérifie actuellement ni JWT ni propriété de la session, car le HUD téléphone est public.

## Calcul et SQL

`api/circuits/trajectory_algorithm.py` optimise une trajectoire avec NumPy et SciPy. `api/sessions/routes.py` dérive les frames HUD depuis des données enregistrées ; aucun flux direct du RPi n'est branché.

`api/examples/*.sql`, `api/seed_users.sql` et `api/fix_user_columns.sql` ne sont pas montés par Compose. Les deux derniers citent `/execute-sql` dans leur en-tête, alors que cette route n'existe pas ; ils doivent être revus avant usage. `api/init.sql` est le fichier chargé à l'initialisation d'une base vide.
