# 10 — Rôles et permissions

État vérifié le 14 novembre 2026. La spécification de produit est dans `docs/Roles_and_permissions.md` ; le code du front est dans `app/src/types/user.ts` et `app/src/hooks/usePermissions.ts` ; les contrôles API sont dans `api/auth/dependencies.py` et les routes concernées.

## Rôles

Le front définit huit rôles : `admin`, `track_manager`, `commissaire`, `mechanic`, `instructor`, `driver`, `spectator` et `device_kart`. L'API connaît aussi `commissaire_piste` dans `ALL_ROLES`. `DB_ROLES` limite la création de comptes humains via l'admin à six rôles : `admin`, `commissaire`, `mechanic`, `instructor`, `driver`, `spectator`. Ces ensembles ne sont donc pas parfaitement alignés.

## Contrôles effectifs

- `/auth/login` et `/auth/register` vérifient les identifiants et signent un JWT. Le mode démo est conditionné par `DEMO_MODE`.
- `get_current_user` valide le JWT et vérifie que le compte en base est actif. `require_roles` renvoie 403 si le rôle ne convient pas.
- `/admin/users` utilise `require_admin` ; l'envoi de capteurs est limité à `admin` et `device_kart` ; les routes de circuits demandent un JWT. Les routes de sessions contrôlent généralement l'accès à la session.
- `GET /sessions/{id}/hud-frames` n'utilise pas `get_current_user`. Le HUD et cet endpoint restent publics.
- La sidebar et certaines pages utilisent `ROLE_PERMISSIONS` pour filtrer l'interface. Cette matrice complète n'est pas appliquée comme système de scopes FastAPI : la visibilité d'un bouton ne constitue pas une autorisation serveur.

Le tableau de bord `/dashboard/data` renvoie encore des données de démonstration selon le rôle. La spécification dans `docs/` contient des droits et intégrations matériels non implémentés : la lire comme une cible, puis vérifier chaque route avant d'annoncer une permission opérationnelle.
