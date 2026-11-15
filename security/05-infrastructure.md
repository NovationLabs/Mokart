# Infrastructure

## Le problème

Le CORS de l'API acceptait toutes les origines, avec les identifiants en plus. Le CORS, c'est la règle qui dit au navigateur quels sites ont le droit d'appeler notre API. Tout ouvrir veut dire qu'un site piégé peut faire des appels à la place d'un utilisateur connecté. Avec FastAPI, cette combinaison renvoie au navigateur l'origine de l'appelant telle quelle. N'importe quel site est donc accepté comme s'il était le nôtre.

La configuration de production Docker publiait PostgreSQL sur le port 5432 de la machine. Sur un VPS, ça veut dire une base de données joignable depuis internet. Docker contourne en plus le pare-feu UFW, donc même un pare-feu bien réglé ne la protégeait pas. Les robots qui scannent internet testent ce port en permanence.

Toujours en production, l'API tournait avec l'option reload et le code monté en volume. Ce mode est fait pour le développement. Il surveille les fichiers et redémarre au moindre changement. Si quelqu'un arrive à écrire un fichier dans le dossier, son code tourne aussitôt.

La documentation Swagger de l'API était ouverte sur /docs. Elle donne la carte complète des routes à n'importe qui.

Les serveurs nginx n'envoyaient aucun en-tête de sécurité. Les images Docker du front utilisaient Node 18, qui n'a plus de mises à jour de sécurité depuis avril 2025.

## Ce qu'on a changé

Le CORS accepte maintenant une liste précise d'origines. Par défaut, ce sont les ports locaux de développement et les domaines app de Mokart. On peut la changer avec la variable ALLOWED_ORIGINS, en séparant les adresses par des virgules. Pour tester depuis un téléphone sur le réseau local, il suffit d'ajouter son adresse dans cette variable sur sa machine. Les identifiants passent par l'en-tête Authorization, donc plus besoin d'autoriser les cookies.

Le Postgres de production n'est plus publié sur la machine. L'API le joint par le réseau interne de Docker, comme avant. En développement, le port reste ouvert pour nos outils, mais seulement sur 127.0.0.1.

L'API de production utilise maintenant Dockerfile.railway, sans reload et sans volume. C'est déjà ce qui tourne sur Railway, donc on aligne simplement les deux.

La documentation Swagger est coupée par défaut. Elle revient avec API_DOCS=true, ce qu'on a mis dans le docker-compose de développement.

L'API et les trois nginx envoient maintenant les en-têtes de base. Ils empêchent le navigateur de deviner le type d'un fichier, d'afficher le site dans une iframe pirate, de fuiter l'URL complète vers d'autres sites, et ils forcent le HTTPS. nginx ne donne plus sa version. Les images du front passent sur Node 22, qui est maintenu.

## Ce qu'il nous reste à faire

On n'a pas mis de politique CSP complète sur les scripts. Elle bloquerait sûrement Three.js ou les styles en ligne, et il faut la tester page par page. C'est la prochaine étape logique pour se protéger des failles XSS.

Sur Railway, il faut vérifier que db et ai-backend n'ont bien aucun domaine public. Notre doc le dit, c'est juste à contrôler dans l'interface.
