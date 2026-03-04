import numpy as np
from scipy.interpolate import CubicSpline
from scipy.optimize import minimize
from scipy.spatial.distance import cdist
from typing import List, Tuple
from models import sql_models


# =============================================================================
# KART PHYSICAL PARAMETERS (commented out - uncomment to enable in optimization)
# =============================================================================
# KART_MASS = 160.0           # kg (kart + pilote)
# TIRE_GRIP_COEFF = 1.4       # coefficient d'adhérence latérale (mu)
# ENGINE_POWER = 9000.0       # W (environ 12ch en karting rotax)
# MAX_LATERAL_FORCE = KART_MASS * 9.81 * TIRE_GRIP_COEFF  # N - force latérale max
# MAX_BRAKING_DECEL = 12.0    # m/s² - décélération max au freinage
# MAX_SPEED = 25.0            # m/s (~90 km/h en karting)
# =============================================================================


class TrajectoryOptimizer:
    def __init__(self):
        self.smoothing_factor = 0.1
        self.trajectory_points = 100

        # -----------------------------------------------------------------------
        # Paramètres dynamiques (désactivés - décommenter pour activer)
        # -----------------------------------------------------------------------
        # self.kart_mass = KART_MASS
        # self.tire_grip = TIRE_GRIP_COEFF
        # self.engine_power = ENGINE_POWER
        # self.max_lateral_force = MAX_LATERAL_FORCE
        # self.max_braking_decel = MAX_BRAKING_DECEL
        # self.max_speed = MAX_SPEED
        # -----------------------------------------------------------------------

        # Poids pour l'optimisation (0.0 = centre, 1.0 = intérieur pur)
        self.racing_bias = 0.5

    # =========================================================================
    # MÉTHODE PRINCIPALE : Minimum Curvature Path
    # =========================================================================

    def calculate_optimal_trajectory(
        self,
        left_boundary: List[sql_models.CircuitBoundary],
        right_boundary: List[sql_models.CircuitBoundary]
    ) -> List[Tuple[float, float]]:
        """
        Calcule la trajectoire optimale via l'algorithme Minimum Curvature Path.
        Principe : minimiser la somme des courbures au carré sur tout le circuit.
        C'est l'approche standard en motorsport (F1, karting simulateurs).
        Fonctionne quel que soit le nombre de points des boundaries.
        """
        if not left_boundary or not right_boundary:
            raise ValueError("Les bordures gauche et droite sont requises")

        left_pts = np.array(
            [(b.x, b.y) for b in sorted(left_boundary, key=lambda b: b.point_order)]
        )
        right_pts = np.array(
            [(b.x, b.y) for b in sorted(right_boundary, key=lambda b: b.point_order)]
        )

        # Rééchantillonner pour avoir le même nombre de points
        left_pts, right_pts = self._resample_boundaries(left_pts, right_pts)
        n = len(left_pts)

        # Alpha = paramètre d'interpolation entre droite (0) et gauche (1)
        # 0.5 = ligne centrale, <0.5 = côté droit, >0.5 = côté gauche
        alpha_init = np.full(n, 0.5)

        # Optimisation : minimiser la courbure totale
        result = minimize(
            fun=self._curvature_cost,
            x0=alpha_init,
            args=(left_pts, right_pts),
            method='L-BFGS-B',
            bounds=[(0.05, 0.95)] * n,  # Garder une marge de sécurité par rapport aux bords
            options={'maxiter': 500, 'ftol': 1e-9}
        )

        alpha_opt = result.x
        trajectory = self._alpha_to_trajectory(alpha_opt, left_pts, right_pts)

        # Lissage final pour éliminer les oscillations numériques
        trajectory = self._smooth_trajectory_gaussian(trajectory)

        return [(float(x), float(y)) for x, y in trajectory]

    # =========================================================================
    # RACING LINE : Minimum Curvature + biais intérieur virage
    # =========================================================================

    def calculate_racing_line(
        self,
        left_boundary: List[sql_models.CircuitBoundary],
        right_boundary: List[sql_models.CircuitBoundary]
    ) -> List[Tuple[float, float]]:
        """
        Calcule la ligne de course optimale :
        - Large à l'entrée du virage
        - Apex serré à l'intérieur
        - Large à la sortie
        Utilise Minimum Curvature Path avec contrainte de courbure pondérée.
        """
        if not left_boundary or not right_boundary:
            raise ValueError("Les bordures gauche et droite sont requises")

        left_pts = np.array(
            [(b.x, b.y) for b in sorted(left_boundary, key=lambda b: b.point_order)]
        )
        right_pts = np.array(
            [(b.x, b.y) for b in sorted(right_boundary, key=lambda b: b.point_order)]
        )

        left_pts, right_pts = self._resample_boundaries(left_pts, right_pts)
        n = len(left_pts)

        alpha_init = np.full(n, 0.5)

        # Coût combiné : courbure + pénalité de largeur (favorise l'utilisation
        # de toute la piste, caractéristique d'une vraie ligne de course)
        result = minimize(
            fun=self._racing_line_cost,
            x0=alpha_init,
            args=(left_pts, right_pts),
            method='L-BFGS-B',
            bounds=[(0.02, 0.98)] * n,
            options={'maxiter': 800, 'ftol': 1e-10}
        )

        # -----------------------------------------------------------------------
        # Contrainte dynamique (décommenter pour activer)
        # La vitesse max en virage est limitée par la force latérale max :
        # v_max = sqrt(max_lateral_force / (mass * kappa))
        # où kappa est la courbure locale
        # -----------------------------------------------------------------------
        # alpha_dyn = self._apply_dynamic_constraints(result.x, left_pts, right_pts)
        # trajectory = self._alpha_to_trajectory(alpha_dyn, left_pts, right_pts)
        # -----------------------------------------------------------------------

        trajectory = self._alpha_to_trajectory(result.x, left_pts, right_pts)
        trajectory = self._smooth_trajectory_gaussian(trajectory)

        return [(float(x), float(y)) for x, y in trajectory]

    # =========================================================================
    # FONCTIONS DE COÛT
    # =========================================================================

    def _curvature_cost(
        self,
        alpha: np.ndarray,
        left_pts: np.ndarray,
        right_pts: np.ndarray
    ) -> float:
        """
        Fonction de coût : somme des courbures² (Minimum Curvature Path).
        Une faible courbure = virages plus larges = vitesse plus élevée.
        """
        traj = self._alpha_to_trajectory(alpha, left_pts, right_pts)
        curvatures = self._compute_curvature(traj)
        return float(np.sum(curvatures ** 2))

    def _racing_line_cost(
        self,
        alpha: np.ndarray,
        left_pts: np.ndarray,
        right_pts: np.ndarray
    ) -> float:
        """
        Fonction de coût combinée pour la ligne de course :
        - 70% minimisation de courbure (vitesse en virage)
        - 30% maximisation de l'utilisation de la piste (entrée/sortie large)
        """
        traj = self._alpha_to_trajectory(alpha, left_pts, right_pts)
        curvatures = self._compute_curvature(traj)

        # Coût principal : courbure minimale
        curvature_cost = np.sum(curvatures ** 2)

        # Pénalité : pénalise le fait de rester toujours au centre
        # (encourage à utiliser toute la largeur de piste)
        center_penalty = np.sum((alpha - 0.5) ** 2) * 0.001

        # -----------------------------------------------------------------------
        # Terme de vitesse (décommenter pour activer avec les paramètres dynamiques)
        # Estime la vitesse max possible à chaque point selon la courbure et le grip
        # v_max[i] = sqrt(TIRE_GRIP_COEFF * 9.81 / max(kappa[i], 1e-6))
        # speed_cost = -np.sum(np.sqrt(TIRE_GRIP_COEFF * 9.81 / np.maximum(curvatures, 1e-6)))
        # return 0.7 * curvature_cost + 0.3 * speed_cost * 0.0001 - center_penalty
        # -----------------------------------------------------------------------

        return curvature_cost - center_penalty

    # =========================================================================
    # CALCUL DE COURBURE
    # =========================================================================

    def _compute_curvature(self, traj: np.ndarray) -> np.ndarray:
        """
        Calcule la courbure de Menger en chaque point de la trajectoire.
        Formule exacte basée sur l'aire du triangle formé par 3 points consécutifs.
        Gère les circuits fermés (bouclage des indices).
        """
        n = len(traj)
        curvatures = np.zeros(n)

        for i in range(n):
            p1 = traj[(i - 1) % n]
            p2 = traj[i]
            p3 = traj[(i + 1) % n]

            # Longueurs des côtés
            a = np.linalg.norm(p2 - p1)
            b = np.linalg.norm(p3 - p2)
            c = np.linalg.norm(p3 - p1)

            # Aire du triangle (formule du produit vectoriel)
            area = 0.5 * abs((p2[0] - p1[0]) * (p3[1] - p1[1]) -
                             (p3[0] - p1[0]) * (p2[1] - p1[1]))

            denom = a * b * c
            if denom > 1e-10:
                # Courbure de Menger = 4*Aire / (a*b*c)
                curvatures[i] = 4.0 * area / denom
            else:
                curvatures[i] = 0.0

        return curvatures

    # =========================================================================
    # UTILITAIRES GÉOMÉTRIQUES
    # =========================================================================

    def _alpha_to_trajectory(
        self,
        alpha: np.ndarray,
        left_pts: np.ndarray,
        right_pts: np.ndarray
    ) -> np.ndarray:
        """
        Convertit un vecteur alpha en trajectoire.
        alpha[i] = 0 → point sur la bordure droite
        alpha[i] = 1 → point sur la bordure gauche
        alpha[i] = 0.5 → ligne centrale
        """
        return (1 - alpha[:, np.newaxis]) * right_pts + alpha[:, np.newaxis] * left_pts

    def _resample_boundaries(
        self,
        left_pts: np.ndarray,
        right_pts: np.ndarray,
        target_n: int = None
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Rééchantillonne les deux boundaries pour avoir exactement target_n points,
        uniformément répartis en longueur d'arc.
        Si target_n n'est pas fourni, utilise le max des deux longueurs.
        Fonctionne quel que soit le nombre de points en entrée.
        """
        if target_n is None:
            target_n = max(len(left_pts), len(right_pts))

        left_resampled = self._resample_polyline(left_pts, target_n)
        right_resampled = self._resample_polyline(right_pts, target_n)

        return left_resampled, right_resampled

    def _resample_polyline(self, pts: np.ndarray, n: int) -> np.ndarray:
        """
        Rééchantillonne une polyligne en n points équidistants en longueur d'arc.
        Utilise une interpolation par spline cubique pour la précision.
        """
        if len(pts) < 2:
            return np.tile(pts[0], (n, 1)) if len(pts) == 1 else pts

        # Calculer les distances cumulées (longueur d'arc)
        diffs = np.diff(pts, axis=0)
        seg_lengths = np.sqrt((diffs ** 2).sum(axis=1))
        arc_lengths = np.concatenate([[0], np.cumsum(seg_lengths)])
        total_length = arc_lengths[-1]

        if total_length < 1e-10:
            return np.tile(pts[0], (n, 1))

        # Normaliser entre 0 et 1
        arc_norm = arc_lengths / total_length

        # Interpolation cubique séparée pour x et y
        cs_x = CubicSpline(arc_norm, pts[:, 0])
        cs_y = CubicSpline(arc_norm, pts[:, 1])

        # Rééchantillonner uniformément
        t_new = np.linspace(0, 1, n)
        return np.column_stack([cs_x(t_new), cs_y(t_new)])

    def _smooth_trajectory_gaussian(
        self,
        trajectory: np.ndarray,
        sigma: int = 3
    ) -> np.ndarray:
        """
        Lissage gaussien de la trajectoire pour supprimer les oscillations
        numériques issues de l'optimisation. Préserve la forme globale.
        """
        if len(trajectory) < 5:
            return trajectory

        n = len(trajectory)
        # Fenêtre gaussienne
        window = min(sigma * 2 + 1, n // 4 * 2 + 1)
        if window < 3:
            return trajectory

        kernel = np.exp(-0.5 * (np.arange(window) - window // 2) ** 2 / sigma ** 2)
        kernel /= kernel.sum()

        x = np.array([p[0] for p in trajectory]) if isinstance(trajectory[0], tuple) else trajectory[:, 0]
        y = np.array([p[1] for p in trajectory]) if isinstance(trajectory[0], tuple) else trajectory[:, 1]

        # Convolution avec padding circulaire (pour circuit fermé)
        x_smooth = np.convolve(np.pad(x, window // 2, mode='wrap'), kernel, mode='valid')
        y_smooth = np.convolve(np.pad(y, window // 2, mode='wrap'), kernel, mode='valid')

        return np.column_stack([x_smooth[:n], y_smooth[:n]])

    # =========================================================================
    # CONTRAINTES DYNAMIQUES (prêtes à activer)
    # =========================================================================

    # def _apply_dynamic_constraints(
    #     self,
    #     alpha: np.ndarray,
    #     left_pts: np.ndarray,
    #     right_pts: np.ndarray
    # ) -> np.ndarray:
    #     """
    #     Ajuste alpha pour respecter les contraintes dynamiques du kart.
    #     Si la courbure dépasse ce que le grip peut supporter à la vitesse max,
    #     on élargit légèrement la trajectoire pour réduire la courbure.
    #     """
    #     traj = self._alpha_to_trajectory(alpha, left_pts, right_pts)
    #     curvatures = self._compute_curvature(traj)
    #
    #     # Vitesse max théorique en chaque point (limité par grip latéral)
    #     v_max = np.sqrt(TIRE_GRIP_COEFF * 9.81 / np.maximum(curvatures, 1e-6))
    #     v_max = np.minimum(v_max, MAX_SPEED)
    #
    #     # Force centripète requise à chaque point
    #     # F_centripete = mass * v² * kappa
    #     # Si F_centripete > MAX_LATERAL_FORCE → ajuster alpha vers l'extérieur
    #     alpha_adjusted = alpha.copy()
    #     for i in range(len(alpha)):
    #         f_req = KART_MASS * v_max[i] ** 2 * curvatures[i]
    #         if f_req > MAX_LATERAL_FORCE:
    #             # Réduire la courbure en élargissant légèrement
    #             overshoot = (f_req - MAX_LATERAL_FORCE) / MAX_LATERAL_FORCE
    #             alpha_adjusted[i] = np.clip(alpha[i] * (1 - overshoot * 0.1), 0.05, 0.95)
    #     return alpha_adjusted

    # =========================================================================
    # ANALYSE DE DÉVIATION
    # =========================================================================

    def calculate_deviation(
        self,
        actual_trajectory: List[Tuple[float, float]],
        optimal_trajectory: List[Tuple[float, float]]
    ) -> dict:
        """
        Calcule les statistiques de déviation entre trajectoire réelle et optimale.
        Utilise la distance au point optimal le plus proche (distance de Fréchet approchée).
        """
        if not actual_trajectory or not optimal_trajectory:
            return {"mean_deviation": 0, "max_deviation": 0, "min_deviation": 0}

        actual_arr = np.array(actual_trajectory)
        optimal_arr = np.array(optimal_trajectory)

        # Matrice de distances : chaque point réel → tous les points optimaux
        dist_matrix = cdist(actual_arr, optimal_arr)
        deviations = dist_matrix.min(axis=1)

        return {
            "mean_deviation": float(np.mean(deviations)),
            "max_deviation": float(np.max(deviations)),
            "min_deviation": float(np.min(deviations)),
            "std_deviation": float(np.std(deviations))
        }

    # =========================================================================
    # MÉTHODES HÉRITÉES (conservées pour compatibilité)
    # =========================================================================

    def _interpolate_boundary(self, points):
        """Conservé pour compatibilité ascendante."""
        if len(points) < 2:
            raise ValueError("Au moins 2 points sont requis pour l'interpolation")
        pts = np.array(points)
        return self._resample_polyline(pts, len(pts))

    def _smooth_trajectory(self, trajectory):
        """Conservé pour compatibilité ascendante. Utilise maintenant le lissage gaussien."""
        arr = np.array(trajectory)
        smoothed = self._smooth_trajectory_gaussian(arr)
        return [(float(x), float(y)) for x, y in smoothed]

    def _adjust_for_curve(self, current, prev, next_pt):
        """Conservé pour compatibilité ascendante."""
        dx = next_pt[0] - prev[0]
        dy = next_pt[1] - prev[1]
        length = np.sqrt(dx ** 2 + dy ** 2)
        if length > 0:
            dx /= length
            dy /= length
        return (current[0] + dx * 0.1, current[1] + dy * 0.1)
