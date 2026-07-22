# 04 — Frontends (`web/` landing + `app/` dashboard)

Deux applications React distinctes, chacune son Docker/Dockerfile/nginx. Voir ports dans [02-architecture.md](02-architecture.md).

## `web/` — landing publique (`mokart.fr`)

- CRA React 18 + TS + Tailwind. **Routing maison** par `window.location.pathname` dans un `switch` (`web/src/App.tsx`) — **pas de react-router**.
- Pages (`web/src/pages/`) : `Home.tsx` (gros, ~1244 lignes), `About.tsx`, `Soon.tsx`, `PrivacyPolicy.tsx`, `TermsOfService.tsx`, `StyleGuide.tsx`.
- Chemins servis : `/about`, `/soon`, `/privacy-policy`, `/terms-of-service`, `/style-guide`, sinon `Home`.
- Identité visuelle : accent **lime `#A3E635`** (distincte de l'app). Assets partenaires/équipe dans `web/public/` (team `leo/clement/selim/anthony.png`, `trusted_by/`, `prototype/mokart_prototype.*`).
- Contenu = marketing statique (features, comparatif concurrents, équipe, partenaire Point One, SpeedKart « en pause »). Aucune donnée dynamique.

## `app/` — dashboard (`app.novationlabs.fr`, titre « MoKart App »)

- CRA React 18 + TS + Tailwind + **react-router-dom v6** + **Recharts 2.15** + `lucide-react`.
- Identité : brand **néon `#7bf8ac`**, polices Inter / JetBrains Mono (`font-data`). Accents bleus dans Sidebar/Header, et un `theme.css` cyan « legacy » résiduel → identité un peu éclatée.
- Layout : `AppLayout.tsx` = `<Sidebar/>` + `<Outlet/>`. `App.tsx` gère le routage et le gate d'auth.

### Routage & gate d'auth (`app/src/App.tsx`)

`isAuthenticated = !!localStorage.getItem('mokart_session')`.

- **Routes publiques (hors AppLayout, hors auth)** :
  - `/hud/:sessionId` → `HudPage` (le HUD téléphone, voir [06](06-hud-telephone.md))
  - `/login` → `AuthPage`
- **Routes authentifiées (sous `AppLayout`)** : `/` `/sessions` `/analysis` `/live` `/simulation` `/settings` `/users` `/race-control` `/karts` `/hardware` `/billing`.
- Non authentifié → tout redirige vers `/login`.

> Correction vs anciennes notes : la route **`/live` EST bien déclarée** (`App.tsx:33`). En revanche elle **n'apparaît pas dans la Sidebar** (voir NAV ci-dessous) → `LivePage` n'est atteignable que par URL directe.

### Pages (`app/src/pages/`) — mocké vs réel

| Page | Route | Source de données | État |
|---|---|---|---|
| `Home.tsx` | `/` | `dashboardService` → `GET /dashboard/data` | **réel** (mais casse pour instructor/commissaire/spectator, cf. bug dashboard) |
| `AnalysisPage.tsx` | `/analysis` | API réelle (sessions, trajectory, sensor-data, stats, boundaries, optimal-trajectory, comparison) | **réel — cœur télémétrie** : zoom/pan, couleur par vitesse **ou** précision, popup point (IMU, vitesse, accel), calcul ligne optimale |
| `SimulationPage.tsx` | `/simulation` | `GET /circuits/week-circuit/simulation-data` | **réel** |
| `UserManagementPage.tsx` | `/users` | `api.users.*` (CRUD + stats) | **réel** (admin) |
| `SettingsPage.tsx` | `/settings` | profil via `/users` | **réel** (profil) |
| `AuthPage.tsx` | `/login` | `POST /auth/login` `/auth/register` | **réel** |
| `HudPage.tsx` | `/hud/:id` | `GET /sessions/{id}/hud-frames` | **réel** (feature récente, voir [06](06-hud-telephone.md)) |
| `SessionsPage.tsx` | `/sessions` | `data/mock.ts` (`MOCK_SESSIONS`, `MOCK_DRIVER`) | **mocké** |
| `LivePage.tsx` | `/live` | `setInterval` + fonctions sinus + `MOCK_DRIVER` | **simulé** (20 Hz local) |
| `RaceControlPage.tsx` | `/race-control` | état local hardcodé | **mocké** |
| `KartsPage.tsx` | `/karts` | état local hardcodé | **mocké** |
| `HardwarePage.tsx` | `/hardware` | état local hardcodé | **mocké** |
| `BillingPage.tsx` | `/billing` | état local hardcodé | **mocké** |

`app/src/data/mock.ts` : données **100 % synthétiques** (assumé en commentaire), pilote fictif « Leo GREGORI », sessions « SpeedKart Hyères », et `TRACK_CONTROL_POINTS` (les 22 points du circuit repris de `rpi/prototype.py`, aussi utilisés par `LivePage`).

### Base URL API côté front (3 logiques différentes)

| Fichier | Logique |
|---|---|
| `app/src/services/api.ts` | `REACT_APP_API_URL` \|\| (`prod` ? `/api` : `http://localhost:8081`) |
| `app/src/pages/AnalysisPage.tsx:77` | `REACT_APP_API_URL` \|\| `http://${window.location.hostname}:8081` |
| `app/src/hooks/useTelemetryFrames.ts:11` | idem AnalysisPage (`window.location.hostname:8081`) |

La logique `window.location.hostname` est **« réseau-friendly »** : elle permet à un **téléphone sur le même WiFi** d'atteindre l'API sur l'IP du Mac (pas son propre localhost). C'est ce qui rend le test HUD possible (voir [06](06-hud-telephone.md)). `services/api.ts` utilise `localhost` → non adapté au test téléphone.

## RBAC côté front (démo, non sécurisé)

- **`app/src/types/user.ts`** : enum `UserRole` **8 rôles** + matrice `ROLE_PERMISSIONS` (scopes par rôle) + `ROLE_LABELS` + `ROLE_DESCRIPTIONS`. Voir la matrice complète dans [10-roles-permissions.md](10-roles-permissions.md).
- **`app/src/hooks/usePermissions.ts`** : store **module-level global** (`globalPermissions`, `globalRole`) + set de listeners + écoute l'event window `userRoleChanged`. Expose `hasPermission`, `hasAnyPermission`, et ~20 helpers (`canControlRace`, `canManageHardware`, `canAccessUsers`…). Le rôle est lu depuis `localStorage.mokart_user`. (Bug mineur : `permissionListeners.clear()` au démontage vide **tous** les listeners.)
- **`app/src/components/Sidebar.tsx`** : `NAV` de **10 liens** filtrés par permission (`filteredNav = NAV.filter(i => !i.permission || hasPermission(i.permission))`) : Vue d'ensemble, Historique Sessions, Télémétrie Avancée, Mode Simulateur, Leaderboard Global (`/race-control`), Karts, Hardware, Billing, Utilisateurs, Settings. **`/live` n'y figure pas.**
- **`app/src/components/Header.tsx`** : **role-switcher de démo** — change `localStorage.mokart_user.role` et dispatch `userRoleChanged` ; crée un user par défaut (`…440001`, role `admin`) si absent. C'est ce qui pilote quelle branche de `/dashboard/data` est appelée (via `dashboardService`, qui envoie `user_id` **et** `role`).

Comme le token n'est jamais vérifié et que le rôle est purement local, le RBAC front est **cosmétique** (démo), pas une sécurité.

Voir aussi : [03-backend-api.md](03-backend-api.md), [06-hud-telephone.md](06-hud-telephone.md), [10-roles-permissions.md](10-roles-permissions.md), [09-gaps-todo.md](09-gaps-todo.md).
