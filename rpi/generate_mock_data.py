import csv
import math
import random


# =========================================================
# CONFIG
# =========================================================

SAMPLING_RATE = 100  # Hz
DURATION = 60        # secondes

G = 9.81


# =========================================================
# UTILITAIRES
# =========================================================

def clamp(value, min_value, max_value):
    return max(min_value, min(value, max_value))


def low_pass(current, target, alpha=0.02):
    """
    Transition progressive vers une cible.
    alpha petit = mouvement plus fluide.
    """
    return current + (target - current) * alpha


# =========================================================
# GÉNÉRATION IMU KARTING
# =========================================================

def generate_mock_imu_data(
    sampling_rate: int,
    duration: int,
    output_file: str
):

    samples = sampling_rate * duration

    with open(output_file, "w", newline="") as f:

        writer = csv.writer(f)

        writer.writerow([
            "timestamp",
            "ax", "ay", "az",
            "gx", "gy", "gz",
            "roll", "pitch", "yaw",
            "mx", "my", "mz",
            "temperature"
        ])

        # =====================================================
        # ÉTAT DU KART
        # =====================================================

        speed = 0.0            # m/s
        yaw = 0.0              # degrés

        ax = 0.0
        ay = 0.0
        az = G

        gx = 0.0
        gy = 0.0
        gz = 0.0

        roll = 0.0
        pitch = 0.0

        temperature = 35.0

        # états possibles
        states = [
            "straight",
            "accelerate",
            "brake",
            "left_turn",
            "right_turn"
        ]

        current_state = "straight"
        next_state_change = 0

        for i in range(samples):

            t = i / sampling_rate

            # =================================================
            # CHANGEMENT D'ÉTAT
            # =================================================

            if i >= next_state_change:

                current_state = random.choice(states)

                # durée de l'état : 2 à 6 secondes
                duration_state = random.randint(
                    2 * sampling_rate,
                    6 * sampling_rate
                )

                next_state_change = i + duration_state

            # =================================================
            # CIBLES SELON L'ÉTAT
            # =================================================

            target_ax = 0.0
            target_ay = 0.0
            target_gz = 0.0

            if current_state == "straight":

                target_ax = 0.0
                target_ay = 0.0
                target_gz = 0.0

            elif current_state == "accelerate":

                # +0.35 g
                target_ax = 0.35 * G

            elif current_state == "brake":

                # -0.8 g
                target_ax = -0.8 * G

            elif current_state == "left_turn":

                # virage gauche
                target_ay = 0.9 * G
                target_gz = 75.0

            elif current_state == "right_turn":

                # virage droite
                target_ay = -0.9 * G
                target_gz = -75.0

            # =================================================
            # TRANSITIONS FLUIDES
            # =================================================

            ax = low_pass(ax, target_ax, alpha=0.015)
            ay = low_pass(ay, target_ay, alpha=0.02)
            gz = low_pass(gz, target_gz, alpha=0.02)

            # =================================================
            # VIBRATIONS KART
            # =================================================

            engine_vibration = (
                math.sin(2 * math.pi * 22 * t) * 0.15
            )

            curb_vibration = 0.0

            # parfois le kart roule sur un vibreur
            if random.random() < 0.002:

                curb_vibration = random.uniform(-2.0, 2.0)

            # bruit IMU réaliste
            noise_ax = random.gauss(0, 0.12)
            noise_ay = random.gauss(0, 0.12)
            noise_az = random.gauss(0, 0.15)

            # =================================================
            # ACCÉLÉROMÈTRE
            # =================================================

            ax_real = ax + noise_ax + engine_vibration
            ay_real = ay + noise_ay
            az_real = (
                G
                + noise_az
                + abs(engine_vibration)
                + curb_vibration
            )

            # =================================================
            # GYROSCOPE
            # =================================================

            gx = random.gauss(0, 1.5)
            gy = random.gauss(0, 1.5)

            gz_real = gz + random.gauss(0, 2.0)

            # =================================================
            # ORIENTATION
            # =================================================

            dt = 1.0 / sampling_rate

            yaw += gz_real * dt

            # garde le yaw entre 0 et 360
            yaw = yaw % 360

            # roulis dépend du virage
            target_roll = clamp(ay_real * 2.0, -15, 15)

            # pitch dépend accélération/freinage
            target_pitch = clamp(-ax_real * 1.5, -10, 10)

            roll = low_pass(roll, target_roll, alpha=0.03)
            pitch = low_pass(pitch, target_pitch, alpha=0.03)

            # =================================================
            # MAGNÉTOMÈTRE
            # =================================================

            heading_rad = math.radians(yaw)

            mx = 35 * math.cos(heading_rad) + random.gauss(0, 1.0)
            my = 35 * math.sin(heading_rad) + random.gauss(0, 1.0)
            mz = random.gauss(0, 2.0)

            # =================================================
            # TEMPÉRATURE
            # =================================================

            temperature += random.gauss(0, 0.005)

            # =================================================
            # ÉCRITURE CSV
            # =================================================

            row = [
                round(t, 3),

                round(ax_real, 3),
                round(ay_real, 3),
                round(az_real, 3),

                round(gx, 2),
                round(gy, 2),
                round(gz_real, 2),

                round(roll, 2),
                round(pitch, 2),
                round(yaw, 2),

                round(mx, 2),
                round(my, 2),
                round(mz, 2),

                round(temperature, 2)
            ]

            writer.writerow(row)


# =========================================================
# MAIN
# =========================================================

if __name__ == "__main__":

    generate_mock_imu_data(
        sampling_rate=SAMPLING_RATE,
        duration=DURATION,
        output_file="imu_mock_data.csv"
    )

    print("Fichier généré : imu_mock_data.csv")