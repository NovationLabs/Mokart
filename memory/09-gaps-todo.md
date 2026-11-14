# 09 — Limites et travaux ouverts

État du code vérifié le 14 novembre 2026. Cette liste distingue les fonctionnalités présentes des décisions produit encore à prendre.

## Données et produit

- `rpi/kart.py` n'envoie pas encore les mesures réelles des capteurs à l'API ; la chaîne RPi → réseau → session live reste à construire.
- Le HUD téléphone rejoue des frames issues d'une session stockée. Aucun flux live n'alimente `useTelemetryFrames.ts`.
- `api/dashboard/routes.py` génère encore des données synthétiques ; `SessionsPage` lit `app/src/data/mock.ts`. Les autres pages doivent être évaluées par source de données avant d'être déclarées intégrées.
- L'agent IA est un chat séparé ; aucun accès métier aux sessions PostgreSQL n'est configuré dans son code.
- Le circuit GPS reconstruit et la session d'essai ingérée ne sont pas dans `api/init.sql`. Leur présence dans un volume existant ne garantit pas leur présence ailleurs.

## Sécurité et exploitation

- L'authentification par mot de passe haché et JWT est en place. Les routes `/admin/users` sont réservées à l'admin, et les principales routes de sessions vérifient le compte ou le rôle. **Exception :** `GET /sessions/{id}/hud-frames` est public et ne contrôle pas le propriétaire de la session.
- `app/src/App.tsx` vérifie seulement la présence d'une session locale pour afficher le tableau de bord ; l'API reste l'autorité. Les permissions détaillées du front ne sont pas toutes des scopes backend.
- NocoDB est désactivé sur Railway en dev et en production ; son code reste dans `.nocodb/`. Vérifier l'accès Cloudflare et le chemin du Dockerfile avant réactivation.
- Les sauvegardes R2 sont planifiées mercredi et samedi à 02 h UTC et conservent deux dumps distincts par base. Une sauvegarde dev existait au dernier contrôle, mais la production n'avait pas encore produit de fichier ; vérifier le prochain passage avant de considérer la protection opérationnelle.

## Nettoyage du dépôt

- `api/seed_users.sql` et `api/fix_user_columns.sql` citent l'ancien endpoint `/execute-sql` ; ces scripts ne sont pas chargés par Compose.
- `web/src/components/home/`, des hooks et la vidéo prototype correspondent à l'ancienne vitrine. Vérifier les imports et les références avant retrait (issue #92).
- `docs/Features_List.md` et `docs/Roles_and_permissions.md` décrivent en partie une cible produit, pas l'état complet du code. Comparer leurs propositions à l'API et à l'interface avant implémentation.

Priorités suggérées : protéger l'accès aux frames HUD, valider les sauvegardes de production, brancher la télémétrie réelle, puis traiter les fichiers inutilisés dans une PR dédiée.
