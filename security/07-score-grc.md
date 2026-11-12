# Score de cyber-conformité

## À quoi ça sert

Corriger des failles une fois, c'est bien. Savoir dans six mois si on est toujours bon, c'est mieux. On a donc écrit un petit outil qui calcule un score de conformité sur cent à partir du dépôt. Il tourne en local et dans la CI. Il ne dépend de rien d'autre que Python.

Pour le lancer, depuis la racine du dépôt :

```
python3 security/grc/mokart_grc.py
```

Il existe aussi un format markdown pour la CI et un format json pour brancher un tableau de bord plus tard.

## Dans quelle case est Mokart

Avant de noter quoi que ce soit, il fallait savoir quelles règles s'appliquent à nous. On a lu le projet pour ça.

Mokart traite des données personnelles. Il y a les comptes des pilotes, avec nom, email, téléphone et numéro de licence. Il y a surtout les traces GPS horodatées de chaque pilote. Et le code du Raspberry contient déjà la lecture d'un capteur cardiaque en Bluetooth. Une fréquence cardiaque liée à une personne est une donnée de santé. Le RGPD s'applique donc, avec une attention particulière sur la localisation et la santé.

L'agent IA discute avec des gens. Pour l'AI Act européen, c'est un système à risque limité. La seule obligation est de prévenir l'utilisateur qu'il parle à une machine. Elle s'applique depuis le 2 août 2026.

Le volant connecté est un produit physique avec du logiciel dedans. Le jour où on le vend ou on le loue à un circuit, il entre dans le Cyber Resilience Act. Ce texte demande de signaler les failles activement exploitées dès le 11 septembre 2026, et toutes les exigences de sécurité du produit à partir du 11 décembre 2027. Tant que c'est un prototype d'école, on n'est pas encore concernés, mais autant être prêts.

NIS2 et DORA ne nous concernent pas. Le karting de loisir n'est pas un secteur visé par NIS2, et on est bien sous les seuils de taille. DORA ne vise que la finance.

Pour la partie technique, on s'appuie sur l'OWASP Top 10 et l'ASVS niveau 1. C'est la référence de base pour toute application web exposée.

Tout ce raisonnement est écrit dans le bloc profil de security/grc/referentiel.json. L'outil l'affiche à côté du score.

## Comment le score est calculé

Le référentiel contient quarante trois contrôles. Chacun a une gravité. Un contrôle critique pèse cinq points, un élevé trois, un moyen deux et un faible un. Le score est la part des points obtenus sur le total. On calcule aussi un score par domaine et un score par cadre réglementaire.

Trente contrôles sont automatiques. L'outil lit le code et vérifie par exemple que les routes admin exigent le rôle admin, qu'aucun mot de passe n'est stocké en clair, ou que la CI cherche bien les secrets. Si quelqu'un réintroduit une faille, le contrôle repasse au rouge tout seul.

Treize contrôles sont déclaratifs. Un outil ne peut pas savoir si on a un registre RGPD ou si on a testé une restauration de la base. C'est à nous de le dire dans security/grc/declarations.json. Pour qu'un contrôle déclaratif compte, il faut mettre fait à true, écrire une preuve, comme un lien vers le document, et une date de revue. Une déclaration sans preuve ne compte pas. Une déclaration de plus d'un an non plus. On ne veut pas d'un score qui se gonfle tout seul.

La note va de A à E. A à partir de 90, B à partir de 75, C à partir de 60, D à partir de 40.

## Où on en est

Sur la branche dev d'origine, le score était de 7,8 sur 100, note E. Presque tous les contrôles critiques étaient au rouge.

Avec les corrections de cette branche, il monte à 64,3 sur 100 avant même d'ajouter la CI. Les contrôles automatiques sont à 85,6. Le reste vient de la chaîne logicielle, que la CI va couvrir, et de la gouvernance, qui dépend de nous.

## Faire évoluer l'outil

Pour ajouter un contrôle, il suffit d'ajouter une entrée dans referentiel.json. Il existe cinq types de vérification. fichier_present vérifie qu'un fichier existe. motif_present et motif_absent cherchent une expression régulière dans une liste de fichiers. actions_epinglees vérifie les workflows GitHub. declaration lit le fichier de déclarations. Un contrôle peut combiner plusieurs vérifications, il faut alors qu'elles passent toutes.
