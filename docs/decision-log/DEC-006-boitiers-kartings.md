# DEC-006 — Architecture des boitiers pour les kartings

## 1. Résumé

Cette décision définit l'architecture matérielle retenue pour le système embarqué des kartings. L'équipe a choisi d'utiliser deux boitiers distincts :

- un boîtier dédié à l'acquisition de données ;
- un boîtier dédié à l'affichage pour le pilote.

Cette solution a été validée collectivement et est désormais considérée comme la référence pour le projet.

## 2. Contexte

Le système embarqué doit permettre à la fois :

- la collecte des données de pilotage et de performance ;
- l'affichage des informations utiles au pilote en temps réel ;
- une installation simple et fiable sur le kart ;
- un bon compromis entre performances, poids, autonomie et lisibilité.

Différentes architectures ont été étudiées afin de répondre à ces contraintes sans compromettre les objectifs techniques du projet.

## 3. Options considérées

### Option 1 — Un unique boîtier sur le volant

**Description :**
Le boîtier unique regroupe l'affichage pilote et les acquisitions de données dans un seul ordinateur embarqué intégré au volant.

**Avantages :**
- tout est centralisé sur un seul système ;
- installation simplifiée côté logique ;
- un seul dispositif à superviser.

**Inconvénients :**
- boîtier lourd et volumineux ;
- autonomie réduite en raison du nombre important de fonctionnalités intégrées ;
- rotation du volant plus complexe à intégrer avec les acquisitions de données, notamment au niveau du module IMU.

### Option 2 — Un seul boîtier d'acquisition uniquement

**Description :**
Le boîtier embarqué ne sert qu'à recueillir les données, sans écran pour le pilote.

**Avantages :**
- boîtier très léger ;
- installation simple et compacte ;
- faible encombrement sur le kart.

**Inconvénients :**
- aucun affichage pilote en temps réel ;
- les données ne sont exploitable qu'à la fin de la session ;
- moins de feedback direct pour l'utilisateur.

### Option 3 — Deux boîtiers distincts

**Description :**
Un boîtier est dédié à l'acquisition des données, tandis qu'un second est dédié à l'affichage pour le pilote.

**Avantages :**
- deux boîtiers de taille raisonnable, ce qui limite le poids et l'encombrement ;
- affichage temps réel pour le pilote ;
- meilleure modularité et flexibilité de conception ;
- répartition plus claire des tâches entre acquisition et interface utilisateur.

**Inconvénients :**
- nécessité d'une liaison entre les deux boîtiers ;
- la technologie de communication n'est pas encore définie de manière définitive (USB, Bluetooth, etc.) ;
- coût matériel supplémentaire du fait de la duplication du matériel.

## 4. Décision retenue

Nous avons choisi la troisième option : deux boîtiers séparés.

Cette décision a été prise collectivement et acceptée par l'ensemble des membres de l'équipe.

## 5. Justification

Cette architecture offre le meilleur compromis entre :

- la performance technique ;
- le confort d'utilisation du pilote ;
- le poids et la taille du système ;
- la modularité du matériel ;
- la flexibilité de développement.

Elle permet de maintenir un boîtier léger et facilement intégrable pour les acquisitions, tout en conservant un affichage en temps réel pour le pilote. Ce choix évite également les limites de l'architecture à boîtier unique, notamment en termes de poids, de volume et de gestion du module IMU.

Bien que la liaison entre les deux boîtiers soit encore à préciser, les avantages de cette solution surpassent les contraintes associées à cette étape de conception.

## 6. Conséquences

### Avantages attendus

- meilleure ergonomie et meilleure lisibilité des informations pour le pilote ;
- réduction du volume et du poids par rapport à un boîtier unique ;
- segmentation claire des responsabilités entre acquisition et affichage ;
- adaptation plus facile aux contraintes physiques du kart.

### Contraintes à gérer

- définition et mise en place de la liaison inter-boîtiers ;
- validation de la solution de communication choisie ;
- coût matériel supérieur à une architecture mono-boîtier ;
- coordination logicielle entre les deux unités.

## 7. Participants et validation

**Statut :** Accepted  
**Décision prise par :** toute l'équipe projet  
**Date :** 12/11/2026

Les membres de l'équipe ont exprimé un accord commun sur cette architecture, qui est désormais la base de conception retenue pour le développement du système embarqué sur les kartings.

## 8. Référence

Cette décision remplace les hypothèses précédemment discutées sur un système unique embarqué, et apporte une base structurée pour la suite du développement matériel et logiciel.
