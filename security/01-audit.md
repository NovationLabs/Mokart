# Audit de sécurité Mokart

## Pourquoi ce dossier

Ce dossier fait le point sur la sécurité de Mokart. On a relu tout le code de la branche dev. Il explique ce qu'on a trouvé, ce qu'on a corrigé et pourquoi. Chaque fichier traite un sujet. On a écrit pour que tout le monde suive, même sans être dans la cyber.

## Le constat en une phrase

Aujourd'hui, n'importe qui sur internet peut devenir administrateur de Mokart en moins d'une minute.

Ce n'est pas une critique. C'est très courant sur un projet qui a commencé en prototype. Le front cache les boutons selon le rôle, mais l'API ne vérifie rien. Or un attaquant ne passe pas par le front. Il appelle l'API directement.

## Comment on a classé les problèmes

On a utilisé trois niveaux. Critique veut dire exploitable tout de suite, sans compte, avec des dégâts graves. Élevé veut dire exploitable avec un peu d'effort ou qui expose des données personnelles. Moyen veut dire un risque réel mais qui demande une autre faille pour faire mal.

## Les failles critiques

La première concerne les routes /admin/users. Elles n'ont aucune protection. Un simple appel permet de lister tous les comptes avec emails et téléphones. Un autre permet de créer un compte admin. Un troisième permet de supprimer n'importe qui. L'API est publique sur api.mokart.fr, donc c'est ouvert à tout le monde.

La deuxième concerne les jetons de connexion. Après le login, l'API renvoie un jeton de la forme local-token suivi de l'identifiant du compte. Il n'est pas signé. En plus, aucune route ne le vérifie. Les routes de profil prennent l'identifiant dans l'URL. Il suffit donc de changer cet identifiant pour lire ou modifier le profil d'un autre, y compris son email. Changer l'email d'une victime, c'est voler son compte.

La troisième concerne le compte démo. L'email et le mot de passe sont écrits dans le code, et le dépôt est public. Ce compte se connecte avec le rôle admin.

La quatrième concerne le tableau de bord. La route /dashboard/data accepte un paramètre role. Mettre role=admin dans l'URL suffit pour voir la vue administrateur.

## Les failles élevées

Les mots de passe sont hachés en SHA-256 sans sel. Ce hachage se casse très vite avec une carte graphique. Pire, les comptes créés depuis l'écran admin sont stockés sous la forme hash_ suivi du mot de passe. C'est du texte en clair.

Les sessions de roulage et la télémétrie sont lisibles sans compte. Ce sont des positions GPS liées à des pilotes identifiés. Au sens du RGPD, c'est une donnée personnelle de localisation. N'importe qui peut aussi écrire de fausses données dans une session.

L'agent IA garde une mémoire par conversation. Cette mémoire est rangée sous une clé calculée à partir du premier message. Deux personnes qui commencent par le même bonjour partagent donc la même mémoire. L'une peut lire ce que l'autre a raconté. L'agent est aussi ouvert à tous, sans limite, alors que chaque requête coûte de l'argent sur la clé LLM.

Enfin, beaucoup de routes renvoient le texte brut des exceptions. Ça donne à un attaquant les noms de tables, de colonnes et parfois des bouts de requêtes SQL.

## Les failles moyennes

Le CORS autorise toutes les origines avec les cookies. La configuration de production Docker publie PostgreSQL sur le port 5432 de la machine et lance l'API en mode rechargement automatique. Le login dit si un compte existe ou pas, et ne limite pas le nombre d'essais. Le front de l'agent charge des scripts depuis un CDN sans version figée. Les serveurs nginx n'envoient aucun en-tête de sécurité.

## Ce qu'on corrige et dans quel ordre

On corrige d'abord l'authentification, parce que tout le reste en dépend. Ensuite les droits d'accès, puis les données de sessions, puis l'infrastructure, puis l'agent IA. Chaque correction a son fichier dans ce dossier.

Après ça, on ajoute trois outils pour que ça ne revienne pas. Un score de conformité calculé automatiquement. Une CI qui bloque les failles avant le merge. Une CD qui vérifie ce qui est réellement en ligne après chaque déploiement.

On n'a rien testé contre la production. Tout ce qui est écrit ici vient de la lecture du code.
