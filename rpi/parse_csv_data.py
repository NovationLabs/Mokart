import pandas as pd
import numpy as np

def load_imu_data(filepath: str) -> pd.DataFrame:
    """
    Charge un fichier CSV de télémétrie IMU et retourne un DataFrame structuré.
    
    - index = timestamp (en secondes)
    - colonnes = mesures capteurs
    """
    
    df = pd.read_csv(filepath)
    
    expected_columns = {
        "timestamp","ax","ay","az",
        "gx","gy","gz",
        "roll","pitch","yaw",
        "mx","my","mz",
        "temperature"
    }
    
    missing = expected_columns - set(df.columns)
    if missing:
        raise ValueError(f"Colonnes manquantes : {missing}")
    
    df = df.astype(float)
    
    df = df.sort_values("timestamp")
    df = df.set_index("timestamp")

    return df

def send_imu_data(df: pd.DataFrame):

    vx = 0.0
    prev_t = None

    for t, row in df.iterrows():
        
        if prev_t is None:
            prev_t = t
            continue
        
        dt = t - prev_t
        prev_t = t

        ax_corr = row["ax"] - np.sin(np.radians(row["pitch"]))
        
        vx += ax_corr * dt
        speed = vx

        steering = row["gz"]

        return {
            "speed": speed,
            "steering": steering,
            "imu_ax": row["ax"],
            "imu_ay": row["ay"],
            "imu_az": row["az"],
            "imu_gx": row["gx"],
            "imu_gy": row["gy"],
            "imu_gz": row["gz"],
        }

def get_score_from_G_variation(df: pd.DataFrame):
    jerk_x = []
    jerk_y = []
    jerk_total = []
    prev_t = None
    prev_ax = None
    prev_ay = None

    for t, row in df.iterrows():
        
        if prev_t is None:
            prev_t = t
            prev_ax = row["ax"]
            prev_ay = row["ay"]
            continue

        dt = t - prev_t
        if dt == 0:
            continue

        jerk_x_val = (row["ax"] - prev_ax) / dt
        jerk_y_val = (row["ay"] - prev_ay) / dt
        jerk_x.append(jerk_x_val)
        jerk_y.append(jerk_y_val)
        jerk_total.append(np.sqrt(jerk_x_val**2 + jerk_y_val**2))

        prev_t = t
        prev_ax = row["ax"]
        prev_ay = row["ay"]

    if not jerk_total:
        return 0.0

    jerk_rms = np.sqrt(np.mean(np.array(jerk_total) ** 2))
    score = max(0.0, 100.0 - (jerk_rms / 10.0) * 100.0)
    return score