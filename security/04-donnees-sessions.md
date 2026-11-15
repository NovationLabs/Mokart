# Données de roulage

## Le problème

Une session Mokart, c'est la trace GPS d'un pilote sur la piste, seconde par seconde, avec l'accéléromètre et l'angle du volant. Elle est liée à un compte, donc à une personne. Pour le RGPD, une position liée à une personne est une donnée personnelle. La CNIL la range parmi les données à caractère hautement personnel, parce qu'elle révèle où était quelqu'un et à quelle heure.

Avant, toutes les routes /sessions et /circuits étaient ouvertes. GET /sessions renvoyait toutes les sessions de tout le monde avec l'identifiant du pilote. Ensuite, avec l'identifiant d'une session, on récupérait sa trajectoire complète. On pouvait aussi créer une session au nom de n'importe qui, ou injecter de fausses données de capteur dans une vraie session.

Le calcul de trajectoire optimale prend plusieurs secondes de processeur. Il était déclenchable sans compte, en boucle. C'est une façon simple de mettre l'API à genoux.

Enfin, des paramètres comme limit ou dt_s n'avaient pas de bornes. Un dt_s à zéro faisait planter le calcul. Un limit énorme chargeait toute la table en mémoire.

## Ce qu'on a changé

Toutes les routes /sessions et /circuits demandent maintenant d'être connecté.

Un pilote ne voit que ses propres sessions. Le personnel du circuit voit tout, c'est à dire les rôles admin, gérant, commissaire, mécanicien et instructeur. Si un pilote demande la session d'un autre, l'API répond qu'elle n'existe pas. On ne dit pas qu'elle existe mais qu'il n'a pas le droit, pour ne rien laisser deviner.

Créer une session l'attribue toujours au compte connecté. Seuls le personnel et les karts peuvent créer une session pour quelqu'un d'autre. L'identifiant de session est maintenant toujours généré par le serveur. Ajouter des données de capteur est réservé aux rôles admin et device_kart, comme le prévoit notre propre matrice de rôles.

Le calcul de trajectoire optimale est limité à dix lancements par heure pour un pilote. Le personnel n'a pas de limite.

Les paramètres numériques ont maintenant des bornes. FastAPI renvoie une erreur 422 propre si on sort des clous.

## Le cas particulier du HUD

La page /hud du téléphone s'ouvre en scannant un tag NFC, sans se connecter. Si on avait protégé la route hud-frames, le HUD aurait arrêté de marcher. On l'a donc laissée publique.

Ce qui la protège, c'est que l'identifiant de session est un UUID aléatoire. Il est impossible à deviner. Avant, la liste publique des sessions donnait tous ces identifiants. Maintenant que la liste est protégée, connaître l'identifiant revient à avoir le lien. C'est le même principe qu'un lien de partage Google Drive.

Si un jour le tag NFC est collé en permanence sur un kart de location, n'importe quel client suivant pourrait rejouer la session du précédent. Dans ce cas il faudra passer à un lien signé qui expire au bout de quelques heures.
