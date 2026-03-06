export type TabName = 'User' | 'Map' | 'Graph' | 'Documentation';
export type IconName = 'Smartphone' | 'Search' | 'Help' | 'Sparkle' | 'Layout';

export interface OptimalTrajectoryPoint {
  id: string;
  circuit_id: string;
  point_order: number;
  x: number;
  y: number;
  created_at: string;
}

export interface TrajectoryComparison {
  session_id: string;
  optimal_trajectory: Array<{x: number, y: number}>;
  actual_trajectory: Array<{x: number, y: number, timestamp: number}>;
  deviation_stats: {
    mean_deviation: number;
    max_deviation: number;
    min_deviation: number;
    std_deviation: number;
  };
}
