export interface KartStatus {
  id: string;
  name: string;
  driver?: string;
  battery_level: number;
  status: 'online' | 'offline' | 'charging' | 'maintenance';
  last_seen?: string;
  location?: {
    x: number;
    y: number;
  };
}

export interface ElectricalModule {
  kart_id: string;
  module_type: 'point_one' | 'uwb' | 'battery_controller';
  status: string;
  battery_voltage?: number;
  signal_strength?: number;
  last_update: string;
  data: Record<string, any>;
}

export interface CircuitInfo {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'maintenance';
  temperature: number;
  humidity: number;
  grip_level: string;
  active_karts: number;
}

export interface UserStats {
  total_laps: number;
  best_lap_time: number;
  avg_lap_time: number;
  top_speed: number;
  consistency: number;
  last_session_date?: string;
}

export interface SystemStatus {
  total_users: number;
  active_sessions: number;
  total_karts: number;
  online_karts: number;
  system_health: 'good' | 'warning' | 'critical';
  last_backup?: string;
}

export interface DashboardData {
  user_role: 'admin' | 'pilot' | 'mechanic' | 'observer';
  user_stats?: UserStats;
  karts_status?: KartStatus[];
  electrical_modules?: ElectricalModule[];
  circuit_info?: CircuitInfo;
  system_status?: SystemStatus;
}
