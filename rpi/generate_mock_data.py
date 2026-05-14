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
# PROFILS PILOTES
# =========================================================

DRIVER_PROFILES = {

    "expert": {

        # dynamique
        "accel_g": 0.45,
        "brake_g": -1.1,
        "corner_g": 1.25,
        "yaw_rate": 95,

        # fluidité
        "transition_alpha": 0.035,

        # bruit IMU
        "imu_noise": 0.06,
        "gyro_noise": 0.8,

        # corrections volant
        "steering_jitter": 0.3,

        # erreurs / vibreurs
        "curb_probability": 0.004,

        # durée des états
        "state_min": 1.5,
        "state_max": 4.0,
    },

    "average": {

        "accel_g": 0.32,
        "brake_g": -0.75,
        "corner_g": 0.9,
        "yaw_rate": 70,

        "transition_alpha": 0.02,

        "imu_noise": 0.12,
        "gyro_noise": 1.5,

        "steering_jitter": 1.0,

        "curb_probability": 0.002,

        "state_min": 2.0,
        "state_max": 6.0,
    },

    "beginner": {

        "accel_g": 0.18,
        "brake_g": -0.45,
        "corner_g": 0.55,
        "yaw_rate": 40,

        "transition_alpha": 0.008,

        "imu_noise": 0.22,
        "gyro_noise": 3.0,

        "steering_jitter": 3.5,

        "curb_probability": 0.008,

        "state_min": 3.0,
        "state_max": 8.0,
    }
}


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
    output_file: str,
    driver_profile: str = "average"
):

    if driver_profile not in DRIVER_PROFILES:
        raise ValueError(
            f"Profil inconnu : {driver_profile}"
        )

    profile = DRIVER_PROFILES[driver_profile]

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

        yaw = 0.0

        ax = 0.0
        ay = 0.0
        az = G

        gx = 0.0
        gy = 0.0
        gz = 0.0

        roll = 0.0
        pitch = 0.0

        temperature = 35.0

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

                duration_state = random.randint(
                    int(profile["state_min"] * sampling_rate),
                    int(profile["state_max"] * sampling_rate)
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

                target_ax = profile["accel_g"] * G

            elif current_state == "brake":

                target_ax = profile["brake_g"] * G

            elif current_state == "left_turn":

                target_ay = profile["corner_g"] * G
                target_gz = profile["yaw_rate"]

            elif current_state == "right_turn":

                target_ay = -profile["corner_g"] * G
                target_gz = -profile["yaw_rate"]

            # =================================================
            # TRANSITIONS FLUIDES
            # =================================================

            alpha = profile["transition_alpha"]

            ax = low_pass(ax, target_ax, alpha=alpha)
            ay = low_pass(ay, target_ay, alpha=alpha)
            gz = low_pass(gz, target_gz, alpha=alpha)

            # =================================================
            # VIBRATIONS KART
            # =================================================

            engine_vibration = (
                math.sin(2 * math.pi * 22 * t) * 0.15
            )

            curb_vibration = 0.0

            if random.random() < profile["curb_probability"]:

                curb_vibration = random.uniform(-2.0, 2.0)

            # =================================================
            # BRUIT IMU
            # =================================================

            imu_noise = profile["imu_noise"]

            noise_ax = random.gauss(0, imu_noise)
            noise_ay = random.gauss(0, imu_noise)
            noise_az = random.gauss(0, imu_noise * 1.2)

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

            gyro_noise = profile["gyro_noise"]

            gx = random.gauss(0, gyro_noise)
            gy = random.gauss(0, gyro_noise)

            steering_jitter = random.gauss(
                0,
                profile["steering_jitter"]
            )

            gz_real = (
                gz
                + steering_jitter
                + random.gauss(0, gyro_noise)
            )

            # =================================================
            # ORIENTATION
            # =================================================

            dt = 1.0 / sampling_rate

            yaw += gz_real * dt

            yaw = yaw % 360

            target_roll = clamp(
                ay_real * 2.0,
                -15,
                15
            )

            target_pitch = clamp(
                -ax_real * 1.5,
                -10,
                10
            )

            roll = low_pass(
                roll,
                target_roll,
                alpha=0.03
            )

            pitch = low_pass(
                pitch,
                target_pitch,
                alpha=0.03
            )

            # =================================================
            # MAGNÉTOMÈTRE
            # =================================================

            heading_rad = math.radians(yaw)

            mx = (
                35 * math.cos(heading_rad)
                + random.gauss(0, 1.0)
            )

            my = (
                35 * math.sin(heading_rad)
                + random.gauss(0, 1.0)
            )

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

    print("\n=== Générateur IMU Karting ===\n")

    print("Profils disponibles :")
    print("1 - expert")
    print("2 - average")
    print("3 - beginner")

    choice = input("\nChoisissez un profil : ")

    profile_map = {
        "1": "expert",
        "2": "average",
        "3": "beginner"
    }

    driver_profile = profile_map.get(choice)

    if driver_profile is None:

        print("\nChoix invalide.")
        exit()

    output_file = f"imu_{driver_profile}.csv"

    generate_mock_imu_data(
        sampling_rate=SAMPLING_RATE,
        duration=DURATION,
        output_file=output_file,
        driver_profile=driver_profile
    )

    print(f"\nFichier généré : {output_file}")
    print(f"Profil utilisé : {driver_profile}")