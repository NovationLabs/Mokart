# Plan d'action

## Où on en est

Les failles critiques du code sont corrigées sur cette branche. Le score de conformité passe de 7,8 à 75,2 sur 100, de la note E à la note B. Tous les contrôles automatiques sont au vert. Ce qui manque maintenant ne se règle pas dans le code. Ça se règle dans Railway, dans GitHub et dans nos documents.

On a tout testé sur une copie locale avec une vraie base PostgreSQL. Connexion, inscription, migration des anciens mots de passe, écrans admin, sessions, calcul de trajectoire, HUD et agent IA. Rien n'a été lancé contre la production.

## Avant de merger

Il faut ajouter la variable SECRET_KEY au service api dans Railway, sur dev et sur production, avec deux valeurs différentes générées par openssl rand -base64 48. Si on oublie, rien ne casse, mais tout le monde est déconnecté à chaque redémarrage de l'API.

DEMO_MODE doit rester à false en production. Pour garder le bouton démo sur dev et montrer le projet, on met DEMO_MODE=true seulement là.

Tout le monde sera déconnecté une fois après le déploiement. Les comptes créés depuis l'écran admin avant ce changement ne pourront plus se connecter, parce que leur mot de passe était stocké en clair. Un admin devra leur en redéfinir un depuis l'écran Utilisateurs.

## Juste après le merge

Dans GitHub, il faut protéger les branches dev et production, exiger une pull request et cocher les checks de Security CI comme obligatoires. Il faut aussi activer le secret scanning et la push protection dans l'onglet Security.

Dans Railway, il faut activer Wait for CI sur chaque service. C'est ce qui transforme la porte de la CD en vrai blocage.

Ensuite, on promeut dev vers production. Tant que ce n'est pas fait, la production reste ouverte et la vérification du matin ouvrira une issue chaque jour pour le rappeler.

## Dans le mois

On remplit security/grc/declarations.json au fur et à mesure. Chaque ligne demande une preuve et une date. Les plus importantes sont le registre des traitements RGPD, la politique de confidentialité sur mokart.fr, les contrats de sous-traitance avec Railway, Cloudflare et notre fournisseur LLM, et la procédure en cas de fuite de données. Ce sont quatre documents courts, on peut les écrire ensemble.

Il faut mettre un plafond de dépense mensuel chez notre fournisseur LLM, et fixer une durée de conservation des traces GPS, par exemple un an après la dernière session, puis supprimer ce qui dépasse.

On ne branche pas le capteur cardiaque en production sans avoir fait une analyse d'impact. Une fréquence cardiaque, c'est une donnée de santé. Le RGPD l'interdit par défaut, sauf consentement explicite et mesures renforcées.

## Plus tard

Quitter react-scripts pour Vite, ce qui fera tomber les soixante trois failles npm. Ajouter une vraie politique CSP sur les scripts. Aligner les rôles track_manager et device_kart entre le front et la base. Retirer le sélecteur de rôle de démo du Header en production. Passer le lien du HUD sur un lien signé qui expire, avant que les tags NFC soient collés pour de bon sur des karts de location.

Avant de vendre ou de louer le volant à un circuit, il faudra préparer le Cyber Resilience Act. Il faudra publier une adresse pour signaler les failles, savoir prévenir l'ENISA sous vingt quatre heures en cas de faille exploitée, et prévoir comment mettre à jour le logiciel des boîtiers déjà installés.
