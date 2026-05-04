# Liste des Fonctionnalités MoKart

**Auteur :** Équipe MoKart
**Statut :** À jour
**Date :** Mai 2026
**Version :** 1.0

Ce document présente l'ensemble des fonctionnalités disponibles dans la plateforme MoKart, organisées par catégorie et par page de l'application.

---

## 🏠 Dashboard Principal

### Home.tsx - Vue d'ensemble
- **Statistiques en temps réel**
  - Nombre de karts actifs
  - Nombre de pilotes attachés au circuit/centre de pilotage
  - Sessions en cours
  - Utilisateurs connectés
  - État du système
- **Graphiques d'évolution**
  - Performances pilotes
  - Tendances d'utilisation
  - Métriques système
- **Accès rapides**
  - Raccourcis vers fonctionnalités principales
  - Notifications et alertes
  - État des connexions hardware

---

## 🏎️ Gestion de Course

### RaceControlPage.tsx - Contrôle de course
- **Contrôle temps réel**
  - Démarrage/arrêt des courses
  - Gestion des drapeaux (vert, jaune, rouge, bleu)
  - Limitations de vitesse par kart
  - Mode sécurité d'urgence
- **Interface de direction**
  - Carte du circuit avec positions
  - Ordre de course en direct
  - Temps au tour et écarts
- **Actions de sécurité**
  - Arrêt d'urgence global
  - Limitations individuelles
  - Alertes pilotes
- **🆕 Gestion des Stints (Relais)**
  - Suivi temps de roulage par pilote
  - Calcul automatique des durées
  - Alertes temps limite approché
  - Validation des changements pilote
- **🆕 Pit Stop Management**
  - Temps minimum stands obligatoire
  - Détection entrées/sorties pits
  - Chronométrage précis pit stops
  - Historique des arrêts par kart
- **🆕 Système de Pénalités**
  - Stop & Go automatique
  - Dépassement temps stint → pénalité
  - Pit stop trop court → pénalité
  - Notifications pilotes et commissaires
- **🆕 Log des Incidents Digitalisé**
  - Détection automatique chocs (IMU G-force spike)
  - Création incident back-office via RPi
  - Télémétrie instant T conservée
  - Interface revue commissaires
  - Application pénalités via WebSockets

### SessionsPage.tsx - Historique des sessions
- **Gestion des sessions**
  - Liste complète des sessions passées
  - Filtres par période/pilote/kart
  - Statistiques détaillées par session
- **Analyse post-course**
  - Meilleurs temps au tour
  - Comparaisons entre pilotes
  - Évolution des performances
- **Export de données**
  - CSV pour analyse externe
  - Rapports PDF personnalisés

### LivePage.tsx - Visualisation en direct
- **Tracking temps réel**
  - Positions des karts sur circuit
  - Vitesse et accélération
  - Données télémétrie 20Hz
- **Interface HUD**
  - Style embarqué kart
  - Informations essentielles
  - Mode plein écran
- **Mode spectateur**
  - Leaderboard public
  - Classements en direct

### 🆕 PublicLeaderboard.tsx - Affichage public stands
- **Vue épurée contrastée**
  - Fond noir, texte jaune/blanc
  - Interface non-interactive
  - Optimisée écrans suspendus
- **Classement temps réel**
  - Positions en direct via WebSockets
  - Écarts et gaps
  - Nombre de tours
- **Sectors Analytics**
  - Purple Sectors (meilleurs secteurs absolus)
  - Green Sectors (meilleurs personnels)
  - Comparaison temps secteur par secteur
- **Statuts course**
  - Drapeaux (vert, jaune, rouge, bleu)
  - Full Course Yellow
  - Safety Car/Virtual SC
  - Conditions piste
- **Alimentation WebSockets**
  - Mise à jour 20Hz
  - Pas de rechargement manuel
  - Sync multi-écrans automatique

### SimulationPage.tsx - Mode simulation
- **Entraînement virtuel**
  - Trajectoires optimales
  - Mode replay des sessions
  - Comparaison avec ghost laps
- **Analyse prédictive**
  - Simulation de performances
  - Tests de stratégies
  - Optimisation trajectoires
- **Mode apprentissage**
  - Tutoriels intégrés
  - Aide à la conduite
  - Analyse des erreurs
  - Score global/secteur de précision de conduite

---

## 🔧 Gestion Technique

### KartsPage.tsx - Gestion de la flotte
- **Inventaire des karts**
  - Liste complète avec statuts
  - Informations techniques (firmware, batterie)
  - Historique de maintenance
- **Actions de maintenance**
  - Reboot à distance
  - Mises à jour firmware OTA
  - Configuration des paramètres
- **Gestion des restrictions**
  - Limitations de vitesse
  - Modes de conduite
  - Accès par pilote

### HardwarePage.tsx - Diagnostic hardware
- **Modules techniques**
  - État des batteries (BMS)
  - Qualité signal RTK/UWB
  - Températures système
  - Logs de diagnostic
- **Calibration et réglages**
  - Calibration IMU (I2C)
  - Reset des offsets
  - Tests de communication
- **Maintenance prédictive**
  - Alertes de maintenance
  - Suivi des cycles batterie
  - Historique des pannes

### 🆕 MaintenanceLogPage.tsx - Journal de maintenance
- **Checklists de sécurité**
  - Validation freins, direction, pneus
  - Contrôle protections et serrage
  - Inspection visuelle complète
- **Signature numérique**
  - Validation biométrique mécanicien
  - Horodatage certifié
  - Traçabilité blockchain
- **Blocage sécurité**
  - API FastAPI bloque démarrage kart
  - Contrôle via Raspberry Pi
  - Validation obligatoire quotidienne
- **Historique maintenance**
  - Logs complets par kart
  - Photos pièces changées
  - Rapports d'intervention
- **Alertes et rappels**
  - Maintenance préventive
  - Pièces à remplacer
  - Calendrier inspections

---

## 📊 Analyse Performance

### AnalysisPage.tsx - Analyse avancée
- **Télémétrie détaillée**
  - Courbes de vitesse/accélération
  - Données G-Force
  - Trajectoires GPS/RTK
  - Données capteurs 50Hz
- **Comparaisons multi-sessions**
  - Overlay trajectoires
  - Delta temps au tour
  - Points de freinage/accélération
- **Outils d'analyse**
  - Zoom et navigation
  - Filtres temporels
  - Export CSV/PDF
- **Analyse des performances**
  - Secteurs critique
  - Consistance pilote
  - Optimisation trajectoire

---

## 👥 Gestion Utilisateurs

### UserManagementPage.tsx - Administration
- **Gestion des comptes**
  - CRUD utilisateurs complets
  - Attribution des rôles et permissions
  - Gestion des licences pilotes
- **Profils pilotes**
  - Informations personnelles
  - Historique des sessions
  - Statistiques individuelles
- **Permissions RBAC**
  - 8 rôles prédéfinis
  - Matrice de permissions granulaire
  - Gestion des accès

### SettingsPage.tsx - Paramètres personnels
- **Profil utilisateur**
  - Informations personnelles
  - Photo de profil
  - Coordonnées contact
- **Préférences**
  - Langue et thème
  - Notifications
  - Unités de mesure
- **Sécurité**
  - Changement mot de passe
  - Connexions actives
  - 2FA si activé

---

## 💼 Business

### BillingPage.tsx - Facturation
- **Gestion des factures**
  - Création et édition
  - Suivi des paiements
  - Export comptable
- **Statistiques financières**
  - Chiffre d'affaires
  - Répartition par service
  - Tendances mensuelles
- **Clients et prestations**
  - Gestion des clients
  - Types de prestations
  - Tarification

---

## 🔐 Authentification

### AuthPage.tsx - Accès système
- **Connexion sécurisée**
  - Authentification email/mot de passe
  - Tokens JWT avec scopes
  - Session persistante
- **Inscription**
  - Création de compte
  - Validation email
  - Attribution rôle par défaut
- **Récupération**
  - Mot de passe oublié
  - Réinitialisation sécurisée

---

## 🎯 Fonctionnalités Transversales

### Permissions et Sécurité
- **RBAC avancé**
  - 8 rôles avec permissions granulaires
  - Scopes JWT pour sécurité IoT
  - Contrôle d'accès par fonctionnalité
- **Sécurité hardware**
  - Isolation des accès matériels
  - Validation des commandes GPIO/I2C
  - Logs d'audit complets

### Communication Temps Réel
- **WebSockets**
  - Télémétrie 50Hz
  - Positions karts
  - État système
- **MQTT**
  - Commandes hardware
  - Notifications
  - Sync multi-clients

### Data & Analytics
- **Stockage**
  - Redis pour temps réel
  - PostgreSQL pour historique
  - Backup automatisé
- **Export**
  - CSV pour analyse
  - PDF pour rapports
  - API pour intégrations

---

## 🎨 Fonctionnalités Visuelles - Dash Raspberry Pi

L'interface tourne localement sur le Raspberry Pi avec un design minimaliste et très contrasté (fond noir, typographie grasse blanche/jaune/rouge/verte).

### A. Mode "Race" (Télémétrie & Performance)
Vue principale en roulage avec zéro distraction.

- **Live Delta (Critique)**
  - Élément central de l'interface
  - Fond vert si pilote en avance sur Best Lap (-0.24s)
  - Fond rouge si en retard (+0.12s)
  - Mise à jour en temps réel 20Hz

- **Chronomètre / Lap Time**
  - Temps au tour actuel en direct
  - Affichage tour précédent
  - Format MM:SS.mmm précis

- **Vitesse (Speed)**
  - En km/h via puce RTK (précision 10cm)
  - Calcul GPS haute précision
  - Affichage numérique prominent

- **Jauge RPM (Shift Lights)**
  - Barre horizontale dynamique
  - Vert → Jaune → Rouge → Clignotant
  - Détection régime par induction HT

- **Indicateur de Secteurs**
  - Trois carrés visuels par secteur
  - Violet = Record absolu
  - Vert = Amélioration personnelle
  - Jaune = Plus lent

- **Position et Séance**
  - Position actuelle dans la séance
  - Nombre de tours restants (course)
  - Delta temps réel et meilleur tour

- **Alerte Proximité**
  - Avertissement adversaire proche derrière
  - Indicateur visuel de distance
  - Priorité basse (non distractive)

- **Personnalisation**
  - Choix des éléments à afficher
  - Positionnement des éléments
  - Taille des polices et couleurs
  - Mode restreint/compétition

### B. Mode "Race Control & Safety" (Priorité Absolue)
Override direction course pour sécurité.

- **Drapeaux Numériques Plein Écran**
  - Remplacement immédiat du Dash
  - Fond clignotant correspondant au drapeau
  - **Drapeau Jaune** : Danger, ralentir
  - **Drapeau Rouge** : Interruption course, arrêt
  - **Drapeau Bleu** : Céder le passage

- **Alerte "Pit Limiter"**
  - Bandeau "PIT LANE - 30 KM/H"
  - Déclenchement Geofencing RTK
  - Coupure accélération (commande REMOTE)

### C. Mode "Diagnostic & Hardware Status" (HUD Technique)
Vue technique pour mécaniciens stands.

- **Statut IMU**
  - Icône stabilisation
  - Bouton auto ou manuel

- **Statut RTK**
  - Icône GPS colorée
  - Vert = Fix RTK 10cm
  - Orange = Float
  - Rouge = No Fix

- **Niveau de Batterie (BMS)**
  - Jauge des batteries
  - Alertes seuil critique

- **Connectivité**
  - Force signal Wi-Fi/4G
  - Status envoi télémétrie
  - Indicateur qualité liaison

---

## 🎨 Interface Utilisateur

### Design & UX
- **Responsive**
  - Mobile first
  - Adaptation tablette/desktop
  - Interface tactile optimisée
- **Thème**
  - Mode sombre par défaut
  - Interface racing moderne
  - Animations fluides
- **Accessibilité**
  - Navigation clavier
  - Lecteur écran compatible
  - Contrastes élevés

### Performance
- **Optimisation**
  - Lazy loading
  - Cache intelligent
  - Bundle splitting
- **Monitoring**
  - Métriques usage
  - Performance tracking
  - Error logging

---

## 🚀 Fonctionnalités Futures (Roadmap)

### V2.0 - Prévu Q3 2026
- **Mode multijoueur**
  - Courses en ligne
  - Classements globaux
  - Tournois
- **IA d'analyse**
  - Prédictions performance
  - Conseils conduite
  - Détection anomalies

### V3.0 - Prévu Q1 2027
- **Réseau de circuits**
  - Multi-sites
  - Partage données
  - Compétitions inter-circuits
- **Applications mobiles**
  - iOS/Android natifs
  - Notifications push
  - Mode offline limité

---

## 📊 Métriques Actuelles

- **14 pages** principales (+2 MaintenanceLogPage, PublicLeaderboard)
- **8 rôles** utilisateurs
- **50+ permissions** granulaires
- **20Hz** fréquence télémétrie
- **Real-time** tracking
- **Multi-device** support

---

*Ce document est mis à jour à chaque nouvelle fonctionnalité ajoutée à la plateforme.*
