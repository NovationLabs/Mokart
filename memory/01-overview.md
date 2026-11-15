# 01 — Vue d'ensemble

Mokart est un prototype de télémétrie pour le karting : position GNSS, mouvements IMU, temps au tour, trajectoire et analyse de session. `rpi/` contient les outils de collecte et d'ingestion ; `web/` présente le projet ; `app/` affiche le tableau de bord et le HUD ; `api/` sert les données.

## Équipe et branches

Le dépôt est `NovationLabs/Mokart`. `dev` est la branche GitHub par défaut et l'environnement Railway de développement ; `production` pilote la production. Les changements passent par une branche de travail, puis par `dev` avant promotion dans `production`.

L'équipe présentée dans le README : Léo Gregori, Clément Dorge, Selim Bouasker, Anthony Colombani-Gailleur et Tom Clerc. Les quatre profils de la page About renvoient à LinkedIn.

## Domaines

| Service | Production | Développement |
| --- | --- | --- |
| Vitrine | `mokart.fr`, `www.mokart.fr` | `dev.mokart.fr` |
| Tableau de bord | `app.mokart.fr` | `app-dev.mokart.fr` |
| API | `api.mokart.fr` | `api-dev.mokart.fr` |
| Interface IA | `ai.mokart.fr` | `ai-dev.mokart.fr` |
| NocoDB | `db.mokart.fr` | `db-dev.mokart.fr` |

NocoDB est conservé dans `.nocodb/`, mais son service Railway est désactivé dans les deux environnements. Ses domaines doivent rester derrière Cloudflare Access lors d'une réactivation. Voir [docs/railway.md](../docs/railway.md).

## État du produit

L'authentification et certaines routes de données sont réelles. Le tableau de bord combine données API, données synthétiques et simulations. Le HUD téléphone rejoue une session enregistrée ; la chaîne d'ingestion en direct depuis le kart n'est pas encore complète.
