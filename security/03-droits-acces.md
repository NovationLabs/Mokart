# Droits d'accès

## Le problème

Mokart a huit rôles, de l'admin au spectateur. Le fichier docs/Roles_and_permissions.md les décrit très bien. Sauf que ces rôles n'existaient que dans le front. Le menu cachait la page Utilisateurs aux pilotes, mais l'API répondait à tout le monde.

Concrètement, sans compte, on pouvait appeler GET /admin/users et récupérer la liste de tous les inscrits avec leurs emails et leurs téléphones. On pouvait appeler POST /admin/users et se créer un compte admin. On pouvait supprimer n'importe qui avec DELETE.

Les routes de profil et de notifications prenaient l'identifiant du compte dans l'URL. Il suffisait de mettre l'identifiant de quelqu'un d'autre pour lire son profil ou changer son email. Le tableau de bord acceptait même un paramètre role, donc role=admin donnait la vue admin.

C'est la règle numéro un de l'OWASP en 2021, le contrôle d'accès cassé. Le front ne protège jamais rien. Il sert juste à afficher. C'est le serveur qui doit décider.

## Ce qu'on a changé

On a ajouté api/auth/dependencies.py. Ce fichier lit le jeton envoyé dans l'en-tête Authorization, vérifie sa signature et recharge le compte depuis la base. Si le compte a été désactivé entre temps, le jeton ne marche plus. Le rôle vient toujours de la base, jamais de la requête.

Toutes les routes /admin/users demandent maintenant le rôle admin. Sans jeton, l'API répond 401. Avec un jeton de pilote, elle répond 403.

Les routes de profil et de notifications ignorent l'identifiant passé dans l'URL. Elles utilisent celui du jeton. Un pilote ne peut donc plus voir que son propre profil. Pour les notifications, la mise à jour vérifie aussi que la notification appartient bien au compte.

Le tableau de bord prend le rôle dans le jeton. Le paramètre role ne sert plus à rien. Les rôles qui n'avaient pas de vue, comme instructeur ou spectateur, reçoivent maintenant une vue minimale au lieu d'une erreur.

Côté admin, le rôle envoyé à la création ou à la modification doit faire partie de la liste autorisée par la base. Le mot de passe est haché en scrypt au lieu d'être stocké en clair. Un admin peut maintenant redéfinir le mot de passe d'un compte. Un admin ne peut plus se supprimer ni se désactiver lui-même, pour éviter de se retrouver sans aucun admin.

Les messages d'erreur ne renvoient plus le texte des exceptions SQL. L'erreur complète part dans les logs, et le client reçoit juste un message générique.

## Côté front

On a ajouté authFetch dans app/src/services/api.ts. Il ajoute le jeton à chaque appel. Si l'API répond 401, il vide la session et renvoie vers la page de connexion. Les pages Analyse et Simulation, et le service du tableau de bord, passent maintenant par lui.

Les anciennes sessions stockées dans le navigateur ont un jeton local-token qui n'est plus valide. Les utilisateurs seront donc déconnectés une fois et devront se reconnecter. C'est normal.

## Ce qu'il nous reste à faire

Le sélecteur de rôle de démo dans le Header change toujours le rôle affiché dans le navigateur. Ce n'est plus dangereux, l'API ne le croit plus. Mais c'est trompeur pour un utilisateur. Le mieux est de le retirer ou de le garder seulement en développement.

Les rôles track_manager et device_kart existent dans le front mais pas dans la contrainte de la table users. Il faudra choisir et aligner les deux.
