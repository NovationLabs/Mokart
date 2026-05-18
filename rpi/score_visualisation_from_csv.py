import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

from parse_csv_data import load_imu_data


def compute_jerk_and_score(df: pd.DataFrame):
    """
    Calcule :
    - le jerk instantané
    - le score de fluidité

    Le DataFrame doit contenir :
    - index = temps (en secondes)
    - colonnes : 'ax', 'ay'
    """

    # =========================================================
    # LISSAGE DES DONNÉES (réduction du bruit capteur)
    # =========================================================
    df = df.copy()

    df["ax"] = df["ax"].rolling(window=5, center=True).mean()
    df["ay"] = df["ay"].rolling(window=5, center=True).mean()

    # suppression des NaN créés par rolling()
    df = df.dropna()

    # =========================================================
    # VARIABLES
    # =========================================================
    times = []
    jerk_values = []
    smoothness_scores = []

    prev_t = None
    prev_ax = None
    prev_ay = None

    jerk_history = []

    # valeur de référence à calibrer selon ton application
    MAX_JERK = 200

    # =========================================================
    # BOUCLE PRINCIPALE
    # =========================================================
    for t, row in df.iterrows():

        ax = row["ax"]
        ay = row["ay"]

        # initialisation
        if prev_t is None:
            prev_t = t
            prev_ax = ax
            prev_ay = ay
            continue

        dt = t - prev_t

        # sécurité division par zéro
        if dt <= 0:
            continue

        # =====================================================
        # CALCUL DU JERK
        # =====================================================
        jerk_x = (ax - prev_ax) / dt
        jerk_y = (ay - prev_ay) / dt

        # norme du jerk
        jerk_total = np.sqrt(jerk_x**2 + jerk_y**2)

        # historique
        jerk_history.append(jerk_total)

        # =====================================================
        # RMS DU JERK
        # =====================================================
        jerk_rms = np.sqrt(np.mean(np.array(jerk_history) ** 2))

        # =====================================================
        # SCORE DE FLUIDITÉ
        # =====================================================
        score = max(0.0, 100.0 - (jerk_rms / MAX_JERK) * 100.0)

        # stockage
        times.append(t)
        jerk_values.append(jerk_total)
        smoothness_scores.append(score)

        # mise à jour
        prev_t = t
        prev_ax = ax
        prev_ay = ay

    return times, jerk_values, smoothness_scores, df


# =============================================================
# EXEMPLE D'UTILISATION
# =============================================================

filename = input("Filename CSV (ex: imu_mock_data.csv) : ")

df = load_imu_data(filename)

# =============================================================
# CALCULS
# =============================================================

times, jerk_values, smoothness_scores, df_filtered = (
    compute_jerk_and_score(df)
)

# =============================================================
# CALCUL G TOTAL
# =============================================================

g_total = np.sqrt(
    df_filtered["ax"]**2 +
    df_filtered["ay"]**2
)

session_gmax = g_total.max()
session_gmean = g_total.mean()

print(f"G max session : {session_gmax:.2f} g")
print(f"G moyen session : {session_gmean:.2f} g")

# =============================================================
# VISUALISATION
# =============================================================

fig, axs = plt.subplots(
    4,
    1,
    figsize=(14, 14),
    sharex=False
)

# -------------------------------------------------------------
# 1. ACCÉLÉRATIONS
# -------------------------------------------------------------
axs[0].plot(
    df_filtered.index,
    df_filtered["ax"],
    color="blue",
    label="ax"
)

axs[0].plot(
    df_filtered.index,
    df_filtered["ay"],
    color="orange",
    label="ay"
)

axs[0].set_title("Accélérations IMU")
axs[0].set_ylabel("Accélération (g)")

axs[0].legend()
axs[0].grid(True)

# -------------------------------------------------------------
# 2. JERK INSTANTANÉ
# -------------------------------------------------------------
axs[1].plot(
    times,
    jerk_values,
    color="red",
    label="Jerk instantané"
)

axs[1].set_title("Jerk instantané")
axs[1].set_ylabel("Jerk")

axs[1].legend()
axs[1].grid(True)

# -------------------------------------------------------------
# 3. SCORE DE FLUIDITÉ
# -------------------------------------------------------------
axs[2].plot(
    times,
    smoothness_scores,
    color="green",
    label="Score de fluidité"
)

axs[2].set_title("Score de fluidité")

axs[2].set_xlabel("Temps (s)")
axs[2].set_ylabel("Score")

axs[2].set_ylim(0, 100)

axs[2].legend()
axs[2].grid(True)

# -------------------------------------------------------------
# 4. DIAGRAMME G-G
# -------------------------------------------------------------
scatter = axs[3].scatter(
    df_filtered["ax"],
    df_filtered["ay"],
    c=df_filtered.index,
    cmap="viridis",
    s=10,
    alpha=0.7
)

# cercle du G max
circle = plt.Circle(
    (0, 0),
    session_gmax,
    color='red',
    fill=False,
    linestyle='--',
    linewidth=2,
    label=f"G max = {session_gmax:.2f} g"
)

axs[3].add_patch(circle)

# axes centraux
axs[3].axhline(
    0,
    color='black',
    linewidth=0.8
)

axs[3].axvline(
    0,
    color='black',
    linewidth=0.8
)

axs[3].set_title("Diagramme G-G")

axs[3].set_xlabel("ax (g)")
axs[3].set_ylabel("ay (g)")

# aspect carré
axs[3].set_aspect(
    'equal',
    adjustable='box'
)

axs[3].legend()
axs[3].grid(True)

# colorbar temps
fig.colorbar(
    scatter,
    ax=axs[3],
    label="Temps (s)"
)

# =============================================================
# AFFICHAGE
# =============================================================

plt.tight_layout()
plt.show()