export enum UserRole {
  ADMIN = 'admin',
  TRACK_MANAGER = 'track_manager',
  COMMISSAIRE = 'commissaire',
  MECHANIC = 'mechanic',
  INSTRUCTOR = 'instructor',
  DRIVER = 'driver',
  SPECTATOR = 'spectator',
  DEVICE_KART = 'device_kart'
}

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  kart?: string;
  role: UserRole;
  is_active: boolean;
  license_number?: string;
  license_expiry?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  profile_image?: string;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  kart?: string;
  role: UserRole;
  license_number?: string;
  license_expiry?: string;
}

export interface UserUpdate {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  kart?: string;
  role?: UserRole;
  is_active?: boolean;
  license_number?: string;
  license_expiry?: string;
}

export interface UserStats {
  total_users: number;
  active_users: number;
  users_by_role: Record<UserRole, number>;
  new_users_this_month: number;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.ADMIN]: [
    'users.create', 'users.read', 'users.update', 'users.delete',
    'sessions.create', 'sessions.read', 'sessions.update', 'sessions.delete',
    'circuits.create', 'circuits.read', 'circuits.update', 'circuits.delete',
    'karts.create', 'karts.read', 'karts.update', 'karts.delete',
    'hardware.calibrate', 'hardware.reboot', 'hardware.ota_update',
    'race.control', 'karts.restrict',
    'telemetry.write', 'hardware.status.write',
    'analysis.read', 'analysis.export',
    'system.manage', 'system.monitor',
    'billing.read', 'billing.manage'
  ],
  [UserRole.TRACK_MANAGER]: [
    'users.create', 'users.read', 'users.update',
    'sessions.create', 'sessions.read', 'sessions.update', 'sessions.delete',
    'circuits.read', 'circuits.update',
    'karts.create', 'karts.read', 'karts.update', 'karts.delete',
    'hardware.reboot', 'hardware.ota_update',
    'race.control', 'karts.restrict',
    'analysis.read', 'analysis.export',
    'billing.read', 'billing.manage',
    'employees.read', 'employees.create', 'employees.update'
  ],
  [UserRole.COMMISSAIRE]: [
    'sessions.read', 'sessions.update',
    'circuits.read',
    'karts.read',
    'race.control', 'karts.restrict',
    'analysis.read', 'analysis.export',
    'users.read', 'users.update'
  ],
  [UserRole.MECHANIC]: [
    'sessions.read',
    'karts.read',
    'hardware.calibrate', 'hardware.reboot', 'hardware.ota_update',
    'telemetry.read', 'hardware.status.read',
    'analysis.read'
  ],
  [UserRole.INSTRUCTOR]: [
    'sessions.read', 'sessions.create',
    'circuits.read',
    'karts.read',
    'analysis.read', 'analysis.export',
    'users.read'
  ],
  [UserRole.DRIVER]: [
    'sessions.read', 'sessions.join',
    'karts.read',
    'telemetry.read',
    'analysis.read'
  ],
  [UserRole.SPECTATOR]: [
    'sessions.read',
    'circuits.read',
    'analysis.read'
  ],
  [UserRole.DEVICE_KART]: [
    'telemetry.write',
    'hardware.status.write',
    'sessions.update',
    'karts.update'
  ]
};

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Administrateur',
  [UserRole.TRACK_MANAGER]: 'Gérant de circuit',
  [UserRole.COMMISSAIRE]: 'Commissaire de piste',
  [UserRole.MECHANIC]: 'Mécanicien',
  [UserRole.INSTRUCTOR]: 'Instructeur',
  [UserRole.DRIVER]: 'Pilote',
  [UserRole.SPECTATOR]: 'Spectateur',
  [UserRole.DEVICE_KART]: 'Kart (Device)'
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Accès complet à toutes les fonctionnalités du système et gestion globale de la plateforme',
  [UserRole.TRACK_MANAGER]: 'Gestion de la flotte de karts, facturation et employés du circuit',
  [UserRole.COMMISSAIRE]: 'Contrôle de la course, gestion des drapeaux et restrictions des karts',
  [UserRole.MECHANIC]: 'Maintenance hardware, calibration IMU et gestion technique des karts',
  [UserRole.INSTRUCTOR]: 'Formation des pilotes et gestion des sessions d\'entraînement',
  [UserRole.DRIVER]: 'Participation aux sessions et accès à ses données de performance',
  [UserRole.SPECTATOR]: 'Visualisation des sessions publiques et données de course',
  [UserRole.DEVICE_KART]: 'Raspberry Pi du kart - envoi de télémétrie et statut hardware'
};
