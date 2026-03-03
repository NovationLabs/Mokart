import numpy as np
from scipy.interpolate import interp1d, CubicSpline
from scipy.spatial.distance import cdist
from typing import List, Tuple
from models import sql_models


class TrajectoryOptimizer:
    def __init__(self):
        self.smoothing_factor = 0.1
        self.trajectory_points = 100

    def calculate_optimal_trajectory(self, left_boundary: List[sql_models.CircuitBoundary],
                                   right_boundary: List[sql_models.CircuitBoundary]) -> List[Tuple[float, float]]:
        """
        Calcule la trajectoire optimale à partir des bordures gauche et droite
        """
        if not left_boundary or not right_boundary:
            raise ValueError("Les bordures gauche et droite sont requises")

        # Trier les points par point_order (l'ordre défini dans la base de données)
        left_points = [(b.x, b.y) for b in sorted(left_boundary, key=lambda b: b.point_order)]
        right_points = [(b.x, b.y) for b in sorted(right_boundary, key=lambda b: b.point_order)]

        # S'assurer que les deux bordures ont le même nombre de points
        min_points = min(len(left_points), len(right_points))
        left_points = left_points[:min_points]
        right_points = right_points[:min_points]

        # Calculer la ligne centrale point par point
        center_line = []
        for i in range(min_points):
            left_x, left_y = left_points[i]
            right_x, right_y = right_points[i]

            # Calculer le point milieu
            center_x = (left_x + right_x) / 2
            center_y = (left_y + right_y) / 2
            center_line.append((float(center_x), float(center_y)))

        # Lisser la trajectoire si nécessaire
        if len(center_line) > 3:
            smoothed_trajectory = self._smooth_trajectory(center_line)
        else:
            smoothed_trajectory = center_line

        return smoothed_trajectory

    def _interpolate_boundary(self, points: List[Tuple[float, float]]) -> interp1d:
        """
        Interpole une bordure avec des splines cubiques
        """
        if len(points) < 2:
            raise ValueError("Au moins 2 points sont requis pour l'interpolation")

        x_coords = [p[0] for p in points]
        y_coords = [p[1] for p in points]

        # Utiliser des splines cubiques pour une trajectoire lisse
        try:
            spline = CubicSpline(x_coords, y_coords)
            return spline
        except:
            # Fallback sur interpolation linéaire
            return interp1d(x_coords, y_coords, kind='linear', fill_value='extrapolate')

    def _smooth_trajectory(self, trajectory: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
        """
        Applique un lissage supplémentaire à la trajectoire
        """
        if len(trajectory) < 3:
            return trajectory

        x_coords = np.array([p[0] for p in trajectory])
        y_coords = np.array([p[1] for p in trajectory])

        # Lissage avec moyenne mobile
        window_size = min(5, len(trajectory) // 4)
        if window_size >= 3:
            y_smooth = np.convolve(y_coords, np.ones(window_size)/window_size, mode='same')
            smoothed_trajectory = list(zip(x_coords, y_smooth))
        else:
            smoothed_trajectory = trajectory

        return smoothed_trajectory

    def calculate_racing_line(self, left_boundary: List[sql_models.CircuitBoundary],
                            right_boundary: List[sql_models.CircuitBoundary]) -> List[Tuple[float, float]]:
        """
        Calcule une ligne de course optimisée (plus proche de l'intérieur des virages)
        """
        center_line = self.calculate_optimal_trajectory(left_boundary, right_boundary)

        # Détecter les virages et ajuster la trajectoire
        racing_line = []
        for i, point in enumerate(center_line):
            if i == 0 or i == len(center_line) - 1:
                racing_line.append(point)
            else:
                # Calculer la courbure locale
                prev_point = center_line[i-1]
                next_point = center_line[i+1]

                # Ajuster la position vers l'intérieur du virage
                adjusted_point = self._adjust_for_curve(point, prev_point, next_point)
                racing_line.append(adjusted_point)

        return racing_line

    def _adjust_for_curve(self, current: Tuple[float, float],
                         prev: Tuple[float, float],
                         next: Tuple[float, float]) -> Tuple[float, float]:
        """
        Ajuste un point de trajectoire pour optimiser la prise de virage
        """
        # Calculer le vecteur de direction
        dx = next[0] - prev[0]
        dy = next[1] - prev[1]

        # Normaliser
        length = np.sqrt(dx**2 + dy**2)
        if length > 0:
            dx /= length
            dy /= length

        # Ajustement subtil vers l'intérieur du virage
        adjustment_factor = 0.1
        adjusted_x = current[0] + dx * adjustment_factor
        adjusted_y = current[1] + dy * adjustment_factor

        return (adjusted_x, adjusted_y)

    def calculate_deviation(self, actual_trajectory: List[Tuple[float, float]],
                          optimal_trajectory: List[Tuple[float, float]]) -> dict:
        """
        Calcule les statistiques de déviation entre trajectoire réelle et optimale
        """
        if not actual_trajectory or not optimal_trajectory:
            return {"mean_deviation": 0, "max_deviation": 0, "min_deviation": 0}

        # Calculer les distances point par point
        deviations = []
        for actual_point in actual_trajectory:
            # Trouver le point optimal le plus proche
            distances = [np.sqrt((actual_point[0] - opt[0])**2 + (actual_point[1] - opt[1])**2)
                        for opt in optimal_trajectory]
            min_distance = min(distances)
            deviations.append(min_distance)

        if not deviations:
            return {"mean_deviation": 0, "max_deviation": 0, "min_deviation": 0}

        return {
            "mean_deviation": float(np.mean(deviations)),
            "max_deviation": float(np.max(deviations)),
            "min_deviation": float(np.min(deviations)),
            "std_deviation": float(np.std(deviations))
        }
