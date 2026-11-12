# Authentification

## Le problème

Avant, se connecter renvoyait un jeton du type local-token suivi de l'identifiant du compte. Ce jeton n'avait aucune signature. N'importe qui pouvait l'écrire à la main. Et de toute façon, aucune route ne le lisait.

Les mots de passe étaient hachés en SHA-256 sans sel. Un hachage rapide, c'est l'inverse de ce qu'on veut pour un mot de passe. Une carte graphique en teste des milliards par seconde. Sans sel, deux comptes avec le même mot de passe ont aussi le même hash, ce qui accélère encore l'attaque.

Le compte démo était écrit dans le code avec le rôle admin. Le dépôt est public, donc ce mot de passe est public.

Enfin, le login répondait ce compte n'existe pas quand l'email était inconnu. Ça permet de tester une liste d'emails et de savoir qui est client chez Mokart. Et rien ne limitait le nombre d'essais.

## Ce qu'on a changé

Le login renvoie maintenant un vrai jeton JWT signé avec une clé secrète. Le jeton contient l'identifiant, le rôle et une date d'expiration de douze heures. Si quelqu'un modifie une seule lettre du jeton, la signature ne colle plus et l'API le refuse.

La clé secrète se règle avec la variable SECRET_KEY. Il faut une valeur longue et aléatoire, générée avec openssl rand -base64 48. Une clé différente par environnement. Si la variable manque, l'API génère une clé temporaire au démarrage et l'écrit dans les logs. Rien ne casse, mais tout le monde est déconnecté à chaque redémarrage. C'est fait exprès pour qu'on le remarque tout de suite.

Les mots de passe sont maintenant hachés avec scrypt. C'est un algorithme lent et gourmand en mémoire, conçu pour ça. Chaque mot de passe a son propre sel aléatoire. C'est dans la bibliothèque standard de Python, donc aucune dépendance en plus.

Les anciens comptes ne sont pas perdus. Au login, si le hash est encore en SHA-256 et que le mot de passe est bon, l'API le remplace aussitôt par un hash scrypt. La migration se fait toute seule, compte par compte. Les comptes créés depuis l'écran admin avec le format hash_ ne peuvent plus se connecter. Ce format était du texte en clair et ne doit pas être accepté. Il faudra leur redéfinir un mot de passe.

Le compte démo n'existe plus par défaut. Il revient seulement si DEMO_MODE vaut true. Dans ce cas il se connecte comme simple pilote, jamais comme admin.

Le login répond maintenant la même chose pour un email inconnu et pour un mauvais mot de passe. Après cinq échecs sur le même email en quinze minutes, l'API bloque ce compte un moment. Il y a aussi une limite par adresse IP. L'inscription est limitée de la même façon et demande un mot de passe d'au moins dix caractères. Un compte désactivé ne peut plus se connecter.

## Ce qu'il nous reste à faire

Ajouter SECRET_KEY dans les variables Railway du service api, sur dev et sur production, avec deux valeurs différentes. Laisser DEMO_MODE à false en production.

La limite d'essais est gardée en mémoire. Elle repart à zéro si l'API redémarre et elle ne se partage pas entre plusieurs instances. Pour un seul conteneur comme aujourd'hui, ça suffit. Si un jour on passe à plusieurs instances, il faudra la stocker dans Redis.
