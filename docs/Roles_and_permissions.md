# Architecture RBAC MoKart - Spécifications Techniques

**Auteur :** Tech Lead MoKart
**Statut :** Spécification cible, partiellement implémentée
**Date :** Avril 2026 — statut clarifié en novembre 2026

Ce document définit la cible RBAC de MoKart. Le code actuel émet des JWT et applique des contrôles de rôle et d'accès à certaines routes FastAPI. Il **n'intègre pas** encore les scopes détaillés aux JWT ni les actions physiques Raspberry Pi/GPIO/I2C décrites ci-dessous. La matrice du front est dans `app/src/types/user.ts` ; l'état effectif côté API est résumé dans [la mémoire projet](../memory/10-roles-permissions.md).

---

## 1. Matrice des Scopes (Permissions)

La cible proposée remplace progressivement les contrôles de rôle simples par des scopes. Les listes ci-dessous sont des exigences, pas des autorisations serveur déjà en place.

### 1.1 Scopes Logiciels (Data & Web)
- `users.read` / `users.write` : Gestion des profils utilisateurs.
- `sessions.read` / `sessions.write` : Création, gestion et clôture des courses.
- `analysis.read` / `analysis.export` : Accès aux courbes de télémétrie et export CSV.
- `system.manage` : Configuration globale du serveur et de l'infrastructure.

### 1.2 Scopes Matériels (Hardware & IoT)
- `telemetry.write` : **[Machine Only]** Autorisation de pousser des trames RTK/IMU vers le serveur.
- `hardware.status.read` : Lecture des voltages (BMS), qualité du signal UWB/RTK, températures.
- `hardware.write` : Action physique de niveau OS sur le kart (Reboot RPi, flashage OTA).
- `hardware.calibrate` : Écriture sur le bus (I2C/SPI) pour reset des offsets IMU ou calibration.
- `race.control` : Action de sécurité physique en piste (Drapeaux sur l'écran LCD volant, limitation de vitesse via GPIO/PWM).

---

## 2. Rôles et Attributions

### 👑 ADMIN (Super-Administrateur / Support)
- **Scopes :** `*` (Tous les droits).
- **Accès Web :** Dashboard global, métriques serveurs (Nginx/FastAPI), gestion globale.
- **Impact Hardware :** Mises à jour OTA massives de la flotte de Raspberry Pi via tunnel SSH/MQTT.

### 🏢 TRACK_MANAGER (Gérant du Circuit)
- **Scopes :** `users.*`, `sessions.*`, `circuits.read`, `hardware.status.read`.
- **Accès Web :** Gestion de la flotte du circuit, assignation des pilotes, facturation.
- **Impact Hardware :** Visualisation de l'état des batteries (BMS) pour la gestion de la charge.

### 🚩 COMMISSAIRE (Contrôle de Course)
- **Scopes :** `sessions.read`, `sessions.update`, `race.control`, `hardware.status.read`.
- **Accès Web :** Track Map en temps réel, alertes collision/sortie de piste.
- **Impact Hardware :** Déclenchement de la sécurité. Commande `race.control` envoyée en WS au RPi -> coupure accélération (relais GPIO) + alerte écran volant.

### 🔧 MECHANIC (Technicien Stand)
- **Scopes :** `sessions.read`, `hardware.status.read`, `hardware.write`, `hardware.calibrate`.
- **Accès Web :** Panneau de diagnostic brut (Température CPU RPi, logs RAM, SNR antennes RTK).
- **Impact Hardware :** Exécution de scripts de calibration à distance (IMU MPU6050 via I2C, UWB via SPI).

### 🎓 INSTRUCTOR (Coach Sportif)
- **Scopes :** `sessions.read`, `analysis.read`, `analysis.export`.
- **Accès Web :** Outils d'analyse poussés (deltas, G-Force, trajectoires).
- **Impact Hardware :** Lecture seule des données haute fréquence (20Hz) générées par les capteurs.

### 🏎️ DRIVER (Pilote)
- **Scopes :** `sessions.read` (self), `sessions.join`, `analysis.read` (self).
- **Accès Web :** Statistiques personnelles, Ghost Laps, classements.
- **Impact Hardware :** Scan QR Code sur le volant (`sessions.join`), lecture des données LCD en course.

### 👁️ SPECTATOR (Public)
- **Scopes :** `sessions.read.live`.
- **Accès Web :** Leaderboard public, Live Tracking.
- **Impact Hardware :** Aucun. Lecture depuis le cache Redis uniquement.

### 🤖 DEVICE_KART (Machine / Raspberry Pi)
- **Scopes :** `telemetry.write`, `hardware.status.write`.
- **Accès Web :** Aucun.
- **Impact Hardware :** Producteur de données. Pousse les trames à 50Hz via WebSockets/MQTT vers l'API.

---

## 3. Implémentation Backend (FastAPI)

L'exemple suivant montre la cible avec `SecurityScopes` ; cette route et ce contrôle ne sont pas présents dans l'API actuelle.

```python
# Exemple de protection d'une route matérielle
from fastapi import FastAPI, Depends, Security
from fastapi.security import SecurityScopes

@app.post("/api/karts/{kart_id}/calibrate")
async def calibrate_kart_imu(
    kart_id: str,
    current_user: User = Security(get_current_user, scopes=["hardware.calibrate"])
):
    """
    Nécessite le scope 'hardware.calibrate' (Mécanicien ou Admin).
    Déclenche l'écriture I2C sur le RPi.
    """
    return {"status": "calibration_initiated", "kart_id": kart_id}
