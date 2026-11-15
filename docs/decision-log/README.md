# Decision Log

## Mokart

> Registre officiel des décisions prises par l'équipe dans le cadre du projet EIP EPITECH.

## 1. Présentation

Ce répertoire centralise l'ensemble des décisions importantes prises au cours du développement du projet.

Il a pour objectif d'assurer la traçabilité des choix effectués par l'équipe, de conserver leur contexte et leur justification, et de faciliter la compréhension des orientations techniques, fonctionnelles et organisationnelles du projet.

Chaque décision est documentée afin de comprendre :

- le problème ou le besoin initial ;
- les différentes solutions envisagées ;
- les critères ayant motivé le choix final ;
- les conséquences et compromis associés ;
- les personnes impliquées dans la décision.

Ce journal constitue une référence commune pour l'ensemble des membres de l'équipe.

## 2. Informations sur le projet

| Information | Valeur |
| --- | --- |
| Projet | Mokart |
| Établissement | EPITECH |
| Promotion | PGE 2028 |
| Équipe | Mokart |
| Membres | COLOMBANI-GAILLEUR Anthony, BOUASKER Selim, GREGORI Léo, DORGE Clément |
| Date de début | 10/03/2026 |
| Dernière mise à jour | 14/11/2026 |

## 3. Organisation du répertoire

Les décisions sont enregistrées individuellement dans des fichiers
Markdown afin de faciliter leur consultation et leur maintenance.

```text
decision-log/
├── README.md
└── DEC-006-boitiers-kartings.md
```

Chaque fichier correspond à une décision et possède un identifiant
unique.

## 4. Index des décisions

Cette section répertorie l'ensemble des décisions documentées dans le projet.

| ID | Décision | Catégorie | Statut | Date |
| --- | --- | --- | --- | --- |
| [DEC-006](DEC-006-boitiers-kartings.md) | Architecture des boitiers pour les kartings | Architecture | Accepted | 12/11/2026 |

Les identifiants DEC-001 à DEC-005 n'ont pas de fichier dans ce dépôt. Ils ne sont pas présentés ici comme des décisions documentées ; conserver la numérotation existante lors des prochaines entrées.

**Statuts possibles :**

- `Proposed` : décision en cours de discussion.
- `Accepted` : décision validée par l'équipe.
- `Rejected` : proposition étudiée mais non retenue.
- `Deprecated` : décision qui n'est plus applicable.
- `Superseded` : décision remplacée par une nouvelle décision.

## 5. Catégories de décisions

Les décisions sont classées selon leur domaine d'application.

| Catégorie | Description | Exemples |
| --- | --- | --- |
| Architecture | Organisation générale du système | Monolithe, microservices, architecture hexagonale |
| Technique | Choix des technologies | Langages, frameworks, bibliothèques |
| Infrastructure | Hébergement et déploiement | Docker, CI/CD, cloud |
| Fonctionnelle | Comportement et fonctionnalités du produit | Périmètre, priorisation, règles métier |
| Organisationnelle | Fonctionnement de l'équipe | Méthodologie, répartition des tâches |
| Sécurité | Protection du système et des données | Authentification, permissions, chiffrement |

## 6. Règles de documentation

Toute décision ayant un impact significatif sur le projet doit être documentée.

Une décision doit notamment être enregistrée lorsqu'elle :

- modifie l'architecture ou la structure du projet ;
- introduit ou supprime une technologie ;
- modifie une règle métier ou une fonctionnalité importante ;
- impacte les performances, la sécurité ou la maintenabilité ;
- modifie l'organisation ou les responsabilités de l'équipe ;
- entraîne un changement significatif dans la direction du projet.

Les décisions mineures liées à l'implémentation quotidienne ne nécessitent pas systématiquement une entrée.

### Principes à respecter

1. **Traçabilité :** chaque décision possède un identifiant unique.
2. **Transparence :** le contexte et les raisons du choix doivent être explicités.
3. **Objectivité :** les alternatives doivent être présentées de manière honnête.
4. **Responsabilité :** les personnes impliquées dans la décision doivent être identifiées.
5. **Historique :** une décision validée ne doit jamais être supprimée silencieusement.
6. **Actualisation :** toute évolution importante doit être documentée.

## 7. Processus de prise de décision

Le processus de documentation suit les étapes suivantes :

1. **Identification :** un problème ou un besoin nécessitant un arbitrage est identifié.
2. **Analyse :** les différentes solutions possibles sont étudiées.
3. **Discussion :** les membres concernés échangent sur les avantages et inconvénients.
4. **Décision :** une solution est retenue collectivement ou selon les modalités de décision de l'équipe.
5. **Documentation :** une entrée est créée dans le journal.
6. **Validation :** le statut de la décision passe à `Accepted`.
7. **Suivi :** les conséquences de la décision sont évaluées au fil du projet.

## 8. Convention de nommage

Chaque décision doit respecter le format suivant :

`DEC-[NUMÉRO]-[DESCRIPTION].md`

Exemple existant : `DEC-006-boitiers-kartings.md`.

Les identifiants sont incrémentaux et ne sont jamais réutilisés, même lorsqu'une décision est rejetée ou remplacée.

## 9. Révision des décisions

Une décision acceptée peut être réévaluée si :

- les contraintes initiales évoluent ;
- une nouvelle information remet en question le choix effectué ;
- des problèmes apparaissent lors de l'implémentation ;
- une solution alternative devient plus pertinente.

Dans ce cas, une nouvelle décision doit être créée et faire référence à la décision précédente.

L'historique doit rester consultable afin de conserver la compréhension de l'évolution du projet.

## 10. Contribution

Tous les membres de l'équipe peuvent proposer une nouvelle décision.

Avant d'ajouter une entrée :

- vérifier qu'une décision similaire n'existe pas déjà ;
- utiliser le template de décision défini par l'équipe ;
- attribuer un nouvel identifiant ;
- renseigner le contexte, les alternatives et la justification ;
- faire relire et valider la décision par les membres concernés.

Toute modification du journal doit être effectuée via une Pull Request afin de conserver une trace des changements.

---

**Document maintenu par :** COLOMBANI-GAILLEUR Anthony

**Dernière mise à jour :** 14/11/2026

**MOKART --- EPITECH**
