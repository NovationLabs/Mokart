# 09 — État réel, écarts docs↔code, bugs, TODO

**À lire avant de faire confiance à la doc marketing ou à `docs/`.** État constaté **2026-07-22** : **prototype avancé, gros écart entre la doc et le code**. La vraie valeur technique est concentrée dans (1) l'algo de trajectoire scipy, (2) l'analyse de télémétrie réelle (`AnalysisPage`), (3) la reconstruction de circuit GPS et le HUD téléphone récents.

## Authentification factice

- **SHA-256 non salé** pour le login/register (`api/auth/routes.py`).
- Tokens `local-token-{id}` / `demo-token` **jamais vérifiés** après émission. Le front **n'envoie jamais** de token en header (`app/src/services/api.ts` ne pose que `Content-Type`).
- Identité via **query param `?user_id=`**, non authentifié.
- **`/admin/users/*` sans contrôle d'accès** : n'importe qui peut lister/créer/supprimer des users.
- **3+ formats de hash coexistent** : SHA-256 (login/register), bcrypt `$2b$12$…` (users `init.sql`), préfixe `hash_…` (`/seed-users`, création admin), littéral `'hash'` (users `pilot`/`expert`). → hors compte démo, quasiment aucun user seedé ne peut se connecter.
- Compte démo hardcodé : `demo@mokart.com` / `demo123456` → user `…440001`, role `admin`.

## Télémétrie pas branchée

- **`rpi/kart.py` envoie des `0.0`** (TODO explicite) pour tous les champs capteurs.
- `imu.py` / `PON_gps.py` / `hr_ble.py` = scripts **autonomes**, non intégrés entre eux.
- **Aucun script `rpi/` ne parle à l'API FastAPI.** La doc annonce WebSockets/MQTT 20–50 Hz : **inexistant**. Il n'y a **aucun WebSocket/SSE** dans tout le repo (une seule mention en commentaire dans `useTelemetryFrames.ts`).
- L'alimentation réelle de la DB se fait par **ingestion manuelle** (`ingest_session.py`, `build_circuit.py`).

## Pages front mockées vs réelles

- **Réelles (API)** : `AnalysisPage` (cœur télémétrie), `UserManagementPage` (CRUD admin), `SettingsPage` (profil), `AuthPage`, `SimulationPage`, `HudPage`, `Home` (via `/dashboard/data`).
- **Mockées / simulées** : `SessionsPage`, `LivePage` (`setInterval` + sinus), `RaceControlPage`, `KartsPage`, `HardwarePage`, `BillingPage`. Voir tableau dans [04-frontends.md](04-frontends.md).
- **Laps / scores / classements : inexistants en base.** Tout est hardcodé (random/fixe) dans `api/dashboard/routes.py` (leaderboard, stats live, météo, highlights).

## Agent IA sans accès aux données

- `ai-backend` = chatbot conversationnel pur (LangGraph `create_react_agent`, **`tools=[]`**, `MemorySaver` par thread). **Aucune connexion DB/API métier.** Le coaching IA est une roadmap V2.

## Bugs connus (vérifiés dans le code)

| Bug | Emplacement | Détail |
|---|---|---|
| `/dashboard/data` sans `else` | `api/dashboard/routes.py:134-245` | rôles `instructor`/`commissaire`/`spectator` (+ défaut `pilot`) → aucune branche → `None` → erreur de validation. Casse `Home` pour ces rôles. |
| Vocabulaires de rôles incohérents | DB (6) / `fix-database` (7) / front `user.ts` (8) / dashboard (`observer`,`commissaire_piste`) | voir tableau dans [02](02-architecture.md) ; `get_user_role` renvoie un défaut `"pilot"` qui n'est valide nulle part |
| `create_session` FK | `api/sessions/routes.py:330` | génère un `user_id` **aléatoire** si absent → violation possible de la FK `sessions.user_id → users.id` |
| `AnalysisPage` redéfinit sa base API | `AnalysisPage.tsx:77` | 3 logiques de base URL différentes dans le front (voir [04](04-frontends.md)) |
| Ports prod README ≠ compose | README / `start.sh` (9980/9981) vs `docker-compose.prod.yml` (8080/8000/8081) | incohérence d'affichage |
| `api/circuits.sql` = **répertoire vide** | `docker-compose*.yml` monte `./api/circuits.sql` en `02-circuits.sql` | artefact de bind-mount Docker → no-op ; seul `init.sql` seed. `api/examples/circuits.sql` n'est **pas** monté |
| `usePermissions` vide tous les listeners | `usePermissions.ts:51` | `permissionListeners.clear()` au démontage supprime les listeners des autres composants |
| Scripts SQL pointant vers un endpoint absent | `api/seed_users.sql`, `api/fix_user_columns.sql` | en-têtes documentent `POST /execute-sql` qui n'existe pas (réels : `/seed-users`, `/fix-database`) |

### Corrections vs anciennes notes (à jour au 2026-07-22)

- ✅ Le circuit **« Week Circuit »** existe bien dans `init.sql` (id `…440012`, ligne 402), en plus de « Circuit Weekend » (`…440011`). Donc `/circuits/week-circuit/simulation-data` (qui cherche le nom « Week Circuit ») **trouve** son circuit — ce n'est **pas** un bug de nommage. (Ancienne note erronée.)
- ✅ La route **`/live` EST déclarée** dans `app/src/App.tsx:33`. Elle est seulement **absente de la Sidebar** (10 liens, pas de `/live`).
- ➕ La DB seed en réalité **5 circuits** (+ « Circuit CSV v1/v2 ») et **5 sessions**, pas 3.

## Données non reproductibles (piège)

Le circuit reconstruit **« SpeedKart Hyères (GPS) »** (`3d01d5ed-…`) et la **session réelle ingérée** (`11111111-…`) **ne sont pas versionnés dans `init.sql`** : insérés à l'exécution, ils vivent uniquement dans le **volume Docker local**. Un reset DB (`start.sh` touche `r`, ou `clean`) les efface. → Pour les retrouver : re-jouer `build_circuit.py` puis `ingest_session.py` (voir [07](07-circuit-reconstruction.md), [08](08-dev-setup.md)). **TODO** : les figer en SQL de seed si on veut un environnement reproductible.

## Écart doc `docs/` ↔ réalité

`docs/Features_List.md` et `docs/Roles_and_permissions.md` décrivent une **cible produit** très en avance sur le code :
- 14 pages annoncées, dont `MaintenanceLogPage` et `PublicLeaderboard` qui **n'existent pas**.
- WebSockets/MQTT 50 Hz, **Redis**, JWT `SecurityScopes`, GPIO/I2C, geofencing, blockchain, signature biométrique : **non implémentés**.
- « 50+ permissions granulaires » : la matrice front (`user.ts`) est réelle mais **non appliquée** côté backend.
- Traiter ces docs comme des specs/roadmap, pas comme un état des lieux. Voir [10-roles-permissions.md](10-roles-permissions.md).

## Divers

- **Fréquence cardiaque** absente de tout le backend/front (seulement `rpi/hr_ble.py`).
- Traces GPS réelles en **`quality=1`** (fix GPS standard), pas RTK-4 — la précision 10 cm est la **capacité** annoncée du matériel Point One, pas ce que montrent ces logs de test.
- Identité visuelle éclatée : landing lime `#A3E635` vs app néon `#7bf8ac` vs accents bleus Sidebar/Header vs `theme.css` cyan legacy.
- `parse_csv_data.py` attend des colonnes `ax`/`ay` alors que l'IMU réel est en `ax(g)`/`ay(g)` — `ingest_session.py` gère les deux, mais pas `parse_csv_data`/`score_visualisation_from_csv`.

## TODO prioritaires (synthèse)

1. Sécuriser l'auth (bcrypt partout, vérifier le token en header, protéger `/admin/*`, dépendance FastAPI d'auth).
2. Corriger `/dashboard/data` (branche `else` + unifier le vocabulaire de rôles sur les 8 de `user.ts`).
3. Brancher la vraie télémétrie (`kart.py` → capteurs → push cloud) et introduire le canal live SSE prévu ([06](06-hud-telephone.md)).
4. Figer circuit reconstruit + session HUD en seed SQL (reproductibilité).
5. Nettoyer le bind-mount `api/circuits.sql` (répertoire vide) et compléter `.env.example`.

Voir aussi : [02-architecture.md](02-architecture.md), [03-backend-api.md](03-backend-api.md), [04-frontends.md](04-frontends.md), [10-roles-permissions.md](10-roles-permissions.md).
