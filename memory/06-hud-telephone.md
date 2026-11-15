# 06 — HUD téléphone

État du code au 14 novembre 2026 : le HUD est un **replay de session enregistrée**, pas un flux direct du kart. La route React `/hud/:sessionId` est accessible sans connexion dans `app/src/App.tsx` ; `app/src/pages/HudPage.tsx` rend la vitesse, les temps, le tracé, le delta et les G.

## Flux actuel

1. `rpi/ingest_session.py` peut insérer une trace GNSS et, en option, une trace IMU dans PostgreSQL. L'origine passée par `--origin` doit correspondre à celle du circuit pour aligner les coordonnées.
2. `GET /sessions/{session_id}/hud-frames` dans `api/sessions/routes.py` dérive les frames depuis `sensor_data`. Paramètres : `dt_s` (0,1 s par défaut), `g_scale` et `limit` (20 000 au maximum).
3. `app/src/hooks/useTelemetryFrames.ts` télécharge ces frames, puis les rejoue avec un intervalle. Le front ne reçoit pas de données en direct.

Le format d'une frame contient notamment `t`, `speed`, `gx`, `gy`, `delta`, `lap`, `lap_time`, `sector`, `x` et `y`. `delta` peut être nul sur le premier tour. Le rendu mobile et les boutons de lecture se trouvent dans `HudPage.tsx`.

## Accès et limites

La route React et l'endpoint API des frames sont publics. Un UUID de session connu permet donc de consulter ces données : ajouter une autorisation ou un lien à durée limitée avant d'y placer des données privées. Les autres routes de session utilisent des contrôles d'accès ; ne pas en déduire que le HUD en bénéficie.

Les identifiants de la session réelle mentionnés dans les anciennes notes correspondaient à un **volume local non versionné**. Un nouveau volume PostgreSQL ne la contient pas : il faut rejouer l'ingestion. Les deux fichiers CSV source sont dans `rpi/data/`.

Un tag NFC pourrait ouvrir `https://app.mokart.fr/hud/<sessionId>`, mais la configuration du tag et le push 4G/5G du RPi ne sont pas implémentés dans ce dépôt. Pour un vrai HUD live, il faudrait connecter les capteurs de `rpi/kart.py`, créer une ingestion authentifiée et un canal de diffusion, puis remplacer le replay côté front.

Voir [03-backend-api.md](03-backend-api.md), [07-circuit-reconstruction.md](07-circuit-reconstruction.md) et [08-dev-setup.md](08-dev-setup.md).
