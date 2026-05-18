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

        "accel_g": 0.45,
        "brake_g": -1.10,
        "corner_g": 1.25,
        "yaw_rate": 95,

        "transition_alpha": 0.04,

        "imu_noise": 0.05,
        "gyro_noise": 0.6,

        "steering_jitter": 0.25,

        "curb_probability": 0.02,

        "state_variation": 0.08,
    },

    "average": {

        "accel_g": 0.32,
        "brake_g": -0.75,
        "corner_g": 0.90,
        "yaw_rate": 70,

        "transition_alpha": 0.025,

        "imu_noise": 0.10,
        "gyro_noise": 1.2,

        "steering_jitter": 0.8,

        "curb_probability": 0.04,

        "state_variation": 0.15,
    },

    "beginner": {

        "accel_g": 0.18,
        "brake_g": -0.45,
        "corner_g": 0.55,
        "yaw_rate": 40,

        "transition_alpha": 0.012,

        "imu_noise": 0.20,
        "gyro_noise": 2.5,

        "steering_jitter": 3.0,

        "curb_probability": 0.08,

        "state_variation": 0.30,
    }
}


# =========================================================
# CIRCUIT
# =========================================================

TRACK_SEGMENTS = [

    {"type": "straight",    "duration": 4.0},
    {"type": "brake",       "duration": 1.2},
    {"type": "left_turn",   "duration": 2.5},
    {"type": "accelerate",  "duration": 2.0},

    {"type": "straight",    "duration": 3.5},
    {"type": "brake",       "duration": 1.0},
    {"type": "right_turn",  "duration": 2.2},
    {"type": "accelerate",  "duration": 1.8},

    {"type": "straight",    "duration": 5.0},
]


# =========================================================
# UTILITAIRES
# =========================================================

def clamp(value, min_value, max_value):
    return max(min_value, min(value, max_value))


def low_pass(current, target, alpha):
    return current + (target - current) * alpha


# =========================================================
# GÉNÉRATION
# =========================================================

def generate_mock_imu_data(
    sampling_rate: int,
    duration: int,
    output_file: str,
    driver_profile: str = "average"
):

    if driver_profile not in DRIVER_PROFILES:
        raise ValueError("Profil inconnu")

    profile = DRIVER_PROFILES[driver_profile]

    samples = sampling_rate * duration

    # =====================================================
    # ÉTAT GLOBAL
    # =====================================================

    yaw = 0.0

    ax = 0.0
    ay = 0.0
    az = G

    gz = 0.0

    roll = 0.0
    pitch = 0.0

    roll_velocity = 0.0
    pitch_velocity = 0.0

    temperature = 35.0

    steering_memory = 0.0

    imu_noise_memory_x = 0.0
    imu_noise_memory_y = 0.0
    imu_noise_memory_z = 0.0

    segment_index = 0
    segment_elapsed = 0

    current_segment = TRACK_SEGMENTS[0]

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

        # =================================================
        # BOUCLE PRINCIPALE
        # =================================================

        for i in range(samples):

            t = i / sampling_rate
            dt = 1.0 / sampling_rate

            # =============================================
            # FATIGUE / CONCENTRATION
            # =============================================

            fatigue = (
                math.sin(t * 0.015) * 0.15
                + math.sin(t * 0.003) * 0.1
            )

            # =============================================
            # SEGMENT CIRCUIT
            # =============================================

            segment_type = current_segment["type"]

            segment_duration = (
                current_segment["duration"]
                * random.uniform(
                    1.0 - profile["state_variation"],
                    1.0 + profile["state_variation"]
                )
            )

            segment_samples = int(
                segment_duration * sampling_rate
            )

            phase = segment_elapsed / max(segment_samples, 1)

            if segment_elapsed >= segment_samples:

                segment_index = (
                    segment_index + 1
                ) % len(TRACK_SEGMENTS)

                current_segment = TRACK_SEGMENTS[
                    segment_index
                ]

                segment_elapsed = 0

                segment_type = current_segment["type"]

            segment_elapsed += 1

            # =============================================
            # VARIABILITÉ HUMAINE
            # =============================================

            corner_strength = random.uniform(0.9, 1.08)
            brake_strength = random.uniform(0.92, 1.05)
            accel_strength = random.uniform(0.95, 1.03)

            # =============================================
            # CIBLES
            # =============================================

            target_ax = 0.0
            target_ay = 0.0
            target_gz = 0.0

            # ---------------------------------------------
            # LIGNE DROITE
            # ---------------------------------------------

            if segment_type == "straight":

                target_ax = (
                    math.sin(t * 0.4) * 0.1
                )

            # ---------------------------------------------
            # ACCÉLÉRATION
            # ---------------------------------------------

            elif segment_type == "accelerate":

                accel_curve = math.sin(
                    phase * math.pi / 2
                )

                target_ax = (
                    profile["accel_g"]
                    * accel_strength
                    * G
                    * accel_curve
                )

            # ---------------------------------------------
            # FREINAGE
            # ---------------------------------------------

            elif segment_type == "brake":

                brake_curve = math.sin(
                    phase * math.pi / 2
                )

                target_ax = (
                    profile["brake_g"]
                    * brake_strength
                    * G
                    * brake_curve
                )

            # ---------------------------------------------
            # VIRAGE GAUCHE
            # ---------------------------------------------

            elif segment_type == "left_turn":

                corner_curve = math.sin(
                    phase * math.pi
                )

                target_ay = (
                    profile["corner_g"]
                    * corner_strength
                    * G
                    * corner_curve
                )

                target_gz = (
                    profile["yaw_rate"]
                    * corner_curve
                )

            # ---------------------------------------------
            # VIRAGE DROIT
            # ---------------------------------------------

            elif segment_type == "right_turn":

                corner_curve = math.sin(
                    phase * math.pi
                )

                target_ay = (
                    -profile["corner_g"]
                    * corner_strength
                    * G
                    * corner_curve
                )

                target_gz = (
                    -profile["yaw_rate"]
                    * corner_curve
                )

            # =============================================
            # TRANSITIONS FLUIDES
            # =============================================

            alpha = (
                profile["transition_alpha"]
                * (1.0 - fatigue * 0.2)
            )

            ax = low_pass(ax, target_ax, alpha)
            ay = low_pass(ay, target_ay, alpha)
            gz = low_pass(gz, target_gz, alpha)

            # =============================================
            # VIBRATIONS MOTEUR
            # =============================================

            engine_vibration = (

                math.sin(2 * math.pi * 22 * t) * 0.12
                + math.sin(2 * math.pi * 41 * t) * 0.05
                + math.sin(2 * math.pi * 9 * t) * 0.08
            )

            # =============================================
            # VIBREURS
            # =============================================

            curb_vibration = 0.0

            curb_probability = (
                profile["curb_probability"]
            )

            if segment_type in [
                "left_turn",
                "right_turn"
            ]:
                curb_probability *= 3

            if random.random() < curb_probability:

                curb_vibration = random.uniform(
                    -2.5,
                    2.5
                )

            # =============================================
            # BRUIT CORRÉLÉ
            # =============================================

            imu_noise = (
                profile["imu_noise"]
                * (1 + fatigue)
            )

            imu_noise_memory_x = low_pass(
                imu_noise_memory_x,
                random.gauss(0, imu_noise),
                0.05
            )

            imu_noise_memory_y = low_pass(
                imu_noise_memory_y,
                random.gauss(0, imu_noise),
                0.05
            )

            imu_noise_memory_z = low_pass(
                imu_noise_memory_z,
                random.gauss(0, imu_noise),
                0.05
            )

            # =============================================
            # ACCÉLÉROMÈTRE
            # =============================================

            ax_real = (
                ax
                + imu_noise_memory_x
                + engine_vibration
            )

            ay_real = (
                ay
                + imu_noise_memory_y
            )

            az_real = (
                G
                + imu_noise_memory_z
                + abs(engine_vibration)
                + curb_vibration
            )

            # =============================================
            # GYROSCOPE
            # =============================================

            gyro_noise = (
                profile["gyro_noise"]
                * (1 + fatigue)
            )

            gx = random.gauss(0, gyro_noise)
            gy = random.gauss(0, gyro_noise)

            # =============================================
            # MICRO-CORRECTIONS HUMAINES
            # =============================================

            steering_memory = low_pass(
                steering_memory,
                random.gauss(
                    0,
                    profile["steering_jitter"]
                ),
                0.03
            )

            gz_real = (
                gz
                + steering_memory
                + random.gauss(0, gyro_noise)
            )

            # =============================================
            # SOUS-VIRAGE
            # =============================================

            if abs(ay_real) > (
                profile["corner_g"] * G * 0.9
            ):
                gz_real *= 0.93

            # =============================================
            # SURVIRAGE OCCASIONNEL
            # =============================================

            if random.random() < 0.002:

                gz_real *= random.uniform(
                    1.05,
                    1.15
                )

            # =============================================
            # ORIENTATION
            # =============================================

            yaw += gz_real * dt
            yaw %= 360

            target_roll = clamp(
                ay_real * 2.0,
                -16,
                16
            )

            target_pitch = clamp(
                -ax_real * 1.5,
                -12,
                12
            )

            # =============================================
            # INERTIE BIOMÉCANIQUE
            # =============================================

            roll_velocity += (
                (target_roll - roll) * 0.02
            )

            pitch_velocity += (
                (target_pitch - pitch) * 0.02
            )

            roll += roll_velocity
            pitch += pitch_velocity

            roll_velocity *= 0.94
            pitch_velocity *= 0.94

            # =============================================
            # MAGNÉTOMÈTRE
            # =============================================

            heading_rad = math.radians(yaw)

            mx = (
                35 * math.cos(heading_rad)
                + random.gauss(0, 1.2)
            )

            my = (
                35 * math.sin(heading_rad)
                + random.gauss(0, 1.2)
            )

            mz = random.gauss(0, 2.0)

            # =============================================
            # TEMPÉRATURE
            # =============================================

            temperature += random.gauss(
                0,
                0.003
            )

            # =============================================
            # CSV
            # =============================================

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

    print("\n=== Générateur IMU Karting Réaliste ===\n")

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