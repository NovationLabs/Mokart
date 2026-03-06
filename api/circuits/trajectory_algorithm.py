import numpy as np
from scipy.interpolate import CubicSpline
from scipy.spatial.distance import cdist
from scipy.optimize import minimize
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

        self.racing_bias = 0.5

        # Marge par rapport aux bords en fraction de largeur [0, 0.5]
        # 0.05 = 5% de la largeur de piste de chaque côté
        self.boundary_margin = 0.05

    # =========================================================================
    # MÉTHODE PRINCIPALE : Minimum Curvature Path
    # =========================================================================

    def calculate_optimal_trajectory(
        self,
        left_boundary: List[sql_models.CircuitBoundary],
        right_boundary: List[sql_models.CircuitBoundary]
    ) -> List[Tuple[float, float]]:
        """
        Calcule la trajectoire optimale via Minimum Curvature Path.
        Principe : minimiser la somme des courbures² sur tout le circuit.
        La contrainte de boundary est garantie en lissant alpha (pas XY) :
        un alpha ∈ [margin, 1-margin] produit toujours un point entre les bords.
        """
        if not left_boundary or not right_boundary:
            raise ValueError("Les bordures gauche et droite sont requises")

        left_pts, right_pts = self._prepare_boundaries(left_boundary, right_boundary)
        n = len(left_pts)
        m = self.boundary_margin

        alpha_init = np.full(n, 0.5)

        result = minimize(
            fun=self._curvature_cost,
            x0=alpha_init,
            args=(left_pts, right_pts),
            method='L-BFGS-B',
            bounds=[(m, 1.0 - m)] * n,
            options={'maxiter': 1000, 'ftol': 1e-10, 'gtol': 1e-7}
        )

        # Lissage dans l'espace alpha → garantit que les points restent dans la piste
        alpha_smooth = self._smooth_alpha(result.x, margin=m)

        # Conversion en coordonnées — chaque point est entre left[i] et right[i]
        trajectory = self._alpha_to_trajectory(alpha_smooth, left_pts, right_pts)

        return [(float(x), float(y)) for x, y in trajectory]

    # =========================================================================
    # RACING LINE
    # =========================================================================

    def calculate_racing_line(
        self,
        left_boundary: List[sql_models.CircuitBoundary],
        right_boundary: List[sql_models.CircuitBoundary]
    ) -> List[Tuple[float, float]]:
        """
        Calcule la ligne de course optimale (large en entrée, apex serré, large en sortie).
        Même logique que calculate_optimal_trajectory avec un coût légèrement différent.
        """
        if not left_boundary or not right_boundary:
            raise ValueError("Les bordures gauche et droite sont requises")

        left_pts, right_pts = self._prepare_boundaries(left_boundary, right_boundary)
        n = len(left_pts)
        m = self.boundary_margin

        alpha_init = np.full(n, 0.5)

        result = minimize(
            fun=self._racing_line_cost,
            x0=alpha_init,
            args=(left_pts, right_pts),
            method='L-BFGS-B',
            bounds=[(m, 1.0 - m)] * n,
            options={'maxiter': 1000, 'ftol': 1e-10, 'gtol': 1e-7}
        )

        # -----------------------------------------------------------------------
        # Contrainte dynamique (décommenter pour activer)
        # v_max = sqrt(TIRE_GRIP_COEFF * 9.81 / max(kappa, 1e-6))
        # alpha_dyn = self._apply_dynamic_constraints(result.x, left_pts, right_pts)
        # -----------------------------------------------------------------------

        alpha_smooth = self._smooth_alpha(result.x, margin=m)
        trajectory = self._alpha_to_trajectory(alpha_smooth, left_pts, right_pts)

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
        """Somme des courbures² → minimiser = maximiser les rayons de virage."""
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
        Coût racing line : minimise la courbure + encourage à utiliser
        toute la largeur de piste (pas rester au centre).
        """
        traj = self._alpha_to_trajectory(alpha, left_pts, right_pts)
        curvatures = self._compute_curvature(traj)
        curvature_cost = np.sum(curvatures ** 2)

        # Encourage à s'éloigner du centre (utiliser toute la piste)
        center_penalty = np.sum((alpha - 0.5) ** 2) * 0.001

        # -----------------------------------------------------------------------
        # Terme de vitesse (décommenter pour activer avec les paramètres dynamiques)
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
        Courbure de Menger en chaque point.
        Formule : kappa = 4*Aire / (a*b*c) sur 3 points consécutifs.
        Bouclage circulaire pour les circuits fermés.
        """
        n = len(traj)
        curvatures = np.zeros(n)
        for i in range(n):
            p1 = traj[(i - 1) % n]
            p2 = traj[i]
            p3 = traj[(i + 1) % n]
            a = np.linalg.norm(p2 - p1)
            b = np.linalg.norm(p3 - p2)
            c = np.linalg.norm(p3 - p1)
            area = 0.5 * abs(
                (p2[0] - p1[0]) * (p3[1] - p1[1]) -
                (p3[0] - p1[0]) * (p2[1] - p1[1])
            )
            denom = a * b * c
            curvatures[i] = (4.0 * area / denom) if denom > 1e-10 else 0.0
        return curvatures

    # =========================================================================
    # LISSAGE ALPHA (clé de la contrainte de boundary)
    # =========================================================================

    def _smooth_alpha(self, alpha: np.ndarray, margin: float, sigma: int = 3) -> np.ndarray:
        """
        Lisse le vecteur alpha avec un noyau gaussien, puis le clamp dans [margin, 1-margin].

        POURQUOI lisser alpha et pas XY :
        - alpha[i] ∈ [0,1] → _alpha_to_trajectory → point entre left[i] et right[i]
        - Si on lisse XY, le point moyenné avec ses voisins peut sortir du couloir local
        - Si on lisse alpha, le résultat clampé est TOUJOURS dans le couloir local
        """
        n = len(alpha)
        window = min(sigma * 4 + 1, n // 4 * 2 + 1)
        if window < 3:
            return np.clip(alpha, margin, 1.0 - margin)

        kernel = np.exp(-0.5 * (np.arange(window) - window // 2) ** 2 / sigma ** 2)
        kernel /= kernel.sum()

        # Padding circulaire pour circuit fermé
        alpha_padded = np.pad(alpha, window // 2, mode='wrap')
        alpha_smooth = np.convolve(alpha_padded, kernel, mode='valid')[:n]

        # Clamp final — garantit mathématiquement que chaque point reste dans la piste
        return np.clip(alpha_smooth, margin, 1.0 - margin)

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
        alpha[i] = 0 → bordure droite, alpha[i] = 1 → bordure gauche.
        Tout alpha dans [0,1] est garanti entre les deux boundaries à l'index i.
        """
        return (1.0 - alpha[:, np.newaxis]) * right_pts + alpha[:, np.newaxis] * left_pts

    def _prepare_boundaries(
        self,
        left_boundary: List[sql_models.CircuitBoundary],
        right_boundary: List[sql_models.CircuitBoundary]
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Trie et rééchantillonne les deux boundaries sur le même nombre de points."""
        left_raw = np.array(
            [(b.x, b.y) for b in sorted(left_boundary, key=lambda b: b.point_order)]
        )
        right_raw = np.array(
            [(b.x, b.y) for b in sorted(right_boundary, key=lambda b: b.point_order)]
        )
        target_n = max(len(left_raw), len(right_raw))
        return self._resample_polyline(left_raw, target_n), self._resample_polyline(right_raw, target_n)

    def _resample_boundaries(
        self,
        left_pts: np.ndarray,
        right_pts: np.ndarray,
        target_n: int = None
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Conservé pour compatibilité ascendante."""
        if target_n is None:
            target_n = max(len(left_pts), len(right_pts))
        return self._resample_polyline(left_pts, target_n), self._resample_polyline(right_pts, target_n)

    def _resample_polyline(self, pts: np.ndarray, n: int) -> np.ndarray:
        """Rééchantillonne une polyligne en n points équidistants par longueur d'arc (spline cubique)."""
        if len(pts) < 2:
            return np.tile(pts[0], (n, 1)) if len(pts) == 1 else pts

        diffs = np.diff(pts, axis=0)
        seg_lengths = np.sqrt((diffs ** 2).sum(axis=1))
        arc_lengths = np.concatenate([[0], np.cumsum(seg_lengths)])
        total_length = arc_lengths[-1]

        if total_length < 1e-10:
            return np.tile(pts[0], (n, 1))

        arc_norm = arc_lengths / total_length
        cs_x = CubicSpline(arc_norm, pts[:, 0])
        cs_y = CubicSpline(arc_norm, pts[:, 1])
        t_new = np.linspace(0, 1, n)
        return np.column_stack([cs_x(t_new), cs_y(t_new)])

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
    #     v_max = np.sqrt(TIRE_GRIP_COEFF * 9.81 / np.maximum(curvatures, 1e-6))
    #     v_max = np.minimum(v_max, MAX_SPEED)
    #     alpha_adjusted = alpha.copy()
    #     for i in range(len(alpha)):
    #         f_req = KART_MASS * v_max[i] ** 2 * curvatures[i]
    #         if f_req > MAX_LATERAL_FORCE:
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
        Statistiques de déviation entre trajectoire réelle et optimale.
        Distance de Fréchet discrète approchée (point réel → point optimal le plus proche).
        """
        if not actual_trajectory or not optimal_trajectory:
            return {"mean_deviation": 0, "max_deviation": 0, "min_deviation": 0}

        actual_arr = np.array(actual_trajectory)
        optimal_arr = np.array(optimal_trajectory)
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
        return self._resample_polyline(np.array(points), len(points))

    def _smooth_trajectory(self, trajectory):
        """Conservé pour compatibilité ascendante."""
        arr = np.array(trajectory)
        # Lissage XY uniquement pour compatibilité — préférer _smooth_alpha en interne
        n = len(arr)
        kernel = np.array([0.25, 0.5, 0.25])
        x_s = np.convolve(np.pad(arr[:, 0], 1, mode='wrap'), kernel, mode='valid')
        y_s = np.convolve(np.pad(arr[:, 1], 1, mode='wrap'), kernel, mode='valid')
        return [(float(x), float(y)) for x, y in zip(x_s[:n], y_s[:n])]

    def _smooth_trajectory_gaussian(self, trajectory: np.ndarray, sigma: int = 3) -> np.ndarray:
        """Conservé pour compatibilité ascendante. NE PAS utiliser après _alpha_to_trajectory."""
        return trajectory

    def _adjust_for_curve(self, current, prev, next_pt):
        """Conservé pour compatibilité ascendante."""
        dx = next_pt[0] - prev[0]
        dy = next_pt[1] - prev[1]
        length = np.sqrt(dx ** 2 + dy ** 2)
        if length > 0:
            dx /= length
            dy /= length
        return (current[0] + dx * 0.1, current[1] + dy * 0.1)
