# 10 — Rôles & permissions (RBAC)

Deux sources : la **spec** `docs/Roles_and_permissions.md` (« Définitif », avril 2026) et l'**implémentation front** `app/src/types/user.ts` (`ROLE_PERMISSIONS`). ⚠️ **Rien n'est appliqué côté backend** (aucune vérification de scope/rôle sur les endpoints, voir [03](03-backend-api.md) et [09](09-gaps-todo.md)) — ce RBAC est aujourd'hui **cosmétique** (filtrage de la Sidebar, role-switcher de démo).

## Les 8 rôles

| Rôle (enum front) | Label FR | Vocation | Scopes clés (spec `docs/`) |
|---|---|---|---|
| `admin` | Administrateur | Super-admin / support, tous droits | `*` |
| `track_manager` | Gérant de circuit | Flotte, facturation, employés | `users.*`, `sessions.*`, `circuits.read`, `hardware.status.read` |
| `commissaire` | Commissaire de piste | Contrôle course, drapeaux, sécurité | `sessions.read/update`, `race.control`, `hardware.status.read` |
| `mechanic` | Mécanicien | Diagnostic & calibration hardware | `sessions.read`, `hardware.status.read`, `hardware.write`, `hardware.calibrate` |
| `instructor` | Instructeur | Coaching, analyse | `sessions.read`, `analysis.read/export` |
| `driver` | Pilote | Ses sessions & perfs | `sessions.read (self)`, `sessions.join`, `analysis.read (self)` |
| `spectator` | Spectateur | Public, live tracking | `sessions.read.live` |
| `device_kart` | Kart (Device / RPi) | Producteur de télémétrie | `telemetry.write`, `hardware.status.write` |

La spec structure les scopes en **logiciels** (`users.*`, `sessions.*`, `analysis.read/export`, `system.manage`) et **matériels/IoT** (`telemetry.write` [machine only], `hardware.status.read/write`, `hardware.write` = reboot/OTA, `hardware.calibrate` = I2C/SPI, `race.control` = sécurité piste GPIO). Elle prévoit des **JWT `SecurityScopes`** FastAPI — **non implémentés**.

## Matrice réelle (front `app/src/types/user.ts` → `ROLE_PERMISSIONS`)

C'est ce que le front utilise réellement (via `usePermissions`) pour filtrer l'UI :

| Rôle | Permissions (scopes) |
|---|---|
| **admin** | `users.*`, `sessions.*`, `circuits.*`, `karts.*`, `hardware.calibrate/reboot/ota_update`, `race.control`, `karts.restrict`, `telemetry.write`, `hardware.status.write`, `analysis.read/export`, `system.manage/monitor`, `billing.read/manage` |
| **track_manager** | `users.create/read/update`, `sessions.*`, `circuits.read/update`, `karts.*`, `hardware.reboot/ota_update`, `race.control`, `karts.restrict`, `analysis.read/export`, `billing.read/manage`, `employees.read/create/update` |
| **commissaire** | `sessions.read/update`, `circuits.read`, `karts.read`, `race.control`, `karts.restrict`, `analysis.read/export`, `users.read/update` |
| **mechanic** | `sessions.read`, `karts.read`, `hardware.calibrate/reboot/ota_update`, `telemetry.read`, `hardware.status.read`, `analysis.read` |
| **instructor** | `sessions.read/create`, `circuits.read`, `karts.read`, `analysis.read/export`, `users.read` |
| **driver** | `sessions.read/join`, `karts.read`, `telemetry.read`, `analysis.read` |
| **spectator** | `sessions.read`, `circuits.read`, `analysis.read` |
| **device_kart** | `telemetry.write`, `hardware.status.write`, `sessions.update`, `karts.update` |

`ROLE_LABELS` et `ROLE_DESCRIPTIONS` (mêmes fichiers) fournissent libellés et descriptions FR par rôle.

## Où c'est utilisé côté front

- `usePermissions` (`app/src/hooks/usePermissions.ts`) : `hasPermission`, `hasAnyPermission`, `hasAllPermissions` + helpers (`canControlRace`, `canManageHardware`, `canAccessUsers`, …). Rôle lu dans `localStorage.mokart_user`, changé via l'event `userRoleChanged`.
- `Sidebar.tsx` : chaque lien porte une `permission` ; `NAV.filter(i => !i.permission || hasPermission(i.permission))`.
- `Header.tsx` : role-switcher de **démo** (change le rôle local, ré-évalue les permissions).

## Divergences à connaître

- **Backend ≠ front** : la DB n'autorise que **6 rôles** (`admin, commissaire, mechanic, instructor, driver, spectator`), `api/app.py` `/fix-database` en ajoute un 7ᵉ (`commissaire_piste`), et `api/dashboard/routes.py` branche sur `admin, driver, mechanic, observer, commissaire_piste`. Les rôles front `track_manager` et `device_kart` **n'existent pas** côté DB/CHECK. Voir [02](02-architecture.md) et le bug dashboard dans [09](09-gaps-todo.md).
- **Noms de scopes** : la spec `docs/` (`hardware.write`, `sessions.write`, `sessions.read.live`) et le front (`hardware.reboot/ota_update`, `sessions.update`, `sessions.read`) ne coïncident pas exactement.
- **Aucune application backend** : les scopes ne protègent aucun endpoint. La sécurité réelle est nulle aujourd'hui (voir [09](09-gaps-todo.md)).

Voir aussi : [04-frontends.md](04-frontends.md), [03-backend-api.md](03-backend-api.md), [09-gaps-todo.md](09-gaps-todo.md).
