import pandas as pd
import numpy as np
import os

# ==========================================
# 1. CONFIGURATION DES FICHIERS
# ==========================================
CIRCUIT_IN_FILE = 'circuit_in_final.txt'
CIRCUIT_OUT_FILE = 'circuit_out_final.txt'
GNSS_FILE = 'gnss_20260719_141853.csv'
IMU_FILE = 'imu_20260719_141915.csv'
OUTPUT_SQL_FILE = 'generated_inserts.sql'

# On génère des UUID statiques pour référencer ce nouveau circuit et sa session
CIRCUIT_ID = '550e8400-e29b-41d4-a716-446655440100'
SESSION_ID = '550e8400-e29b-41d4-a716-446655440200'

# On réutilise le "pilot" admin déjà présent dans ton init.sql
USER_ID = '550e8400-e29b-41d4-a716-446655440001'

# Rayon moyen de la Terre en mètres pour la projection
R = 6371000

def latlon_to_xy(lat, lon, lat0, lon0):
    """Convertit la latitude/longitude en X/Y local (mètres)."""
    x = R * np.cos(np.radians(lat0)) * np.radians(lon - lon0)
    y = R * np.radians(lat - lat0)
    return x, y

def generate_sql():
    sql_lines = []
    sql_lines.append("-- ==========================================")
    sql_lines.append("-- INSERTIONS GENERÉES PAR PYTHON (IMPORT GPS)")
    sql_lines.append("-- ==========================================\n")
    
    # ---------------------------------------------------------
    # PARTIE 1 : CIRCUIT BOUNDARIES
    # ---------------------------------------------------------
    if os.path.exists(CIRCUIT_IN_FILE) and os.path.exists(CIRCUIT_OUT_FILE):
        # Séparateur par tabulation d'après la structure de tes fichiers
        df_in = pd.read_csv(CIRCUIT_IN_FILE, sep='\t')
        df_out = pd.read_csv(CIRCUIT_OUT_FILE, sep='\t')
        
        # Définition de l'origine du plan cartésien (au centre du tracé 'in')
        lat0 = df_in['latitude'].mean()
        lon0 = df_in['longitude'].mean()
        
        # Projection des coordonnées
        df_in['x'], df_in['y'] = latlon_to_xy(df_in['latitude'], df_in['longitude'], lat0, lon0)
        df_out['x'], df_out['y'] = latlon_to_xy(df_out['latitude'], df_out['longitude'], lat0, lon0)
        
        sql_lines.append("INSERT INTO circuits (id, name, description) VALUES ")
        sql_lines.append(f"('{CIRCUIT_ID}', 'Circuit Réel', 'Circuit importé depuis traces GPS')")
        sql_lines.append("ON CONFLICT DO NOTHING;\n")
        
        # Fonction pour insérer massivement les points sans alourdir le fichier SQL
        def batch_boundaries(df, side):
            values = []
            for idx, row in df.iterrows():
                values.append(f"(uuid_generate_v4(), '{CIRCUIT_ID}', '{side}', {idx+1}, {row['x']:.4f}, {row['y']:.4f})")
            
            for i in range(0, len(values), 100): # Batch de 100
                chunk = values[i:i+100]
                sql = f"INSERT INTO circuit_boundaries (id, circuit_id, side, point_order, x, y) VALUES\n"
                sql += ",\n".join(chunk) + "\nON CONFLICT DO NOTHING;\n"
                sql_lines.append(sql)

        # Assumons que "in" correspond à la limite intérieure ("left" selon le sens)
        batch_boundaries(df_in, 'left')
        batch_boundaries(df_out, 'right')
        
        print(f"✔ Circuit boundaries traités ({len(df_in)} left, {len(df_out)} right).")
    else:
        print("❌ Fichiers de circuit introuvables. Vérifie les chemins.")

    # ---------------------------------------------------------
    # PARTIE 2 : SENSOR DATA (GNSS + IMU)
    # ---------------------------------------------------------
    if os.path.exists(GNSS_FILE) and os.path.exists(IMU_FILE):
        df_gnss = pd.read_csv(GNSS_FILE)
        df_imu = pd.read_csv(IMU_FILE)
        
        # Tri obligatoire pour utiliser merge_asof
        df_gnss = df_gnss.sort_values('timestamp')
        df_imu = df_imu.sort_values('timestamp')
        
        # Fusion : on associe à chaque point GNSS la ligne IMU la plus proche
        df_merged = pd.merge_asof(df_gnss, df_imu, on='timestamp', direction='nearest')
        
        # Récupération de x, y via la MÊME origine que le circuit
        df_merged['x'], df_merged['y'] = latlon_to_xy(df_merged['lat'], df_merged['lon'], lat0, lon0)
        
        sql_lines.append("INSERT INTO sessions (id, user_id, circuit_id, kart, created_at) VALUES ")
        sql_lines.append(f"('{SESSION_ID}', '{USER_ID}', '{CIRCUIT_ID}', 'Kart Données Capteurs', NOW())")
        sql_lines.append("ON CONFLICT DO NOTHING;\n")
        
        values = []
        for _, row in df_merged.iterrows():
            # init.sql attend un BIGINT pour le timestamp (ex: en millisecondes)
            ts_ms = int(row['timestamp'] * 1000)
            
            # Helper pour formatter correctement (gère les valeurs manquantes NaN -> NULL SQL)
            def fmt(val):
                return f"{val:.4f}" if pd.notna(val) else "NULL"
                
            x, y, z = fmt(row['x']), fmt(row['y']), fmt(row['alt_m'])
            ax, ay, az = fmt(row['ax(g)']), fmt(row['ay(g)']), fmt(row['az(g)'])
            gx, gy, gz = fmt(row['gx(deg/s)']), fmt(row['gy(deg/s)']), fmt(row['gz(deg/s)'])
            
            values.append(f"('{SESSION_ID}', {ts_ms}, {x}, {y}, {z}, {ax}, {ay}, {az}, {gx}, {gy}, {gz}, NULL)")
            
        # Bulk Insert pour optimiser le chargement SQL
        for i in range(0, len(values), 500):
            chunk = values[i:i+500]
            sql = "INSERT INTO sensor_data (session_id, timestamp, uwb_x, uwb_y, uwb_z, imu_ax, imu_ay, imu_az, imu_gx, imu_gy, imu_gz, steering_angle) VALUES\n"
            sql += ",\n".join(chunk) + "\nON CONFLICT DO NOTHING;\n"
            sql_lines.append(sql)
            
        print(f"✔ Données capteurs traitées (Session avec {len(df_merged)} points temporels).")
    else:
        print("❌ Fichiers de capteurs introuvables. Vérifie les chemins.")

    # ---------------------------------------------------------
    # ECRITURE FINALE
    # ---------------------------------------------------------
    with open(OUTPUT_SQL_FILE, 'w', encoding='utf-8') as f:
        f.write("\n".join(sql_lines))
    print(f"\n✅ Fichier '{OUTPUT_SQL_FILE}' généré ! Tu peux copier son contenu à la fin de 'init.sql'.")

if __name__ == '__main__':
    generate_sql()