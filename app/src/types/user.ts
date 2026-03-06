export enum UserRole {
  ADMIN = 'admin',
  COMMISSAIRE = 'commissaire',
  MECHANIC = 'mechanic',
  INSTRUCTOR = 'instructor',
  DRIVER = 'driver',
  SPECTATOR = 'spectator'
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
    'analysis.read', 'analysis.export',
    'system.manage', 'system.monitor'
  ],
  [UserRole.COMMISSAIRE]: [
    'sessions.read', 'sessions.update',
    'circuits.read',
    'analysis.read', 'analysis.export',
    'users.read', 'users.update'
  ],
  [UserRole.MECHANIC]: [
    'sessions.read', 'sessions.update',
    'analysis.read'
  ],
  [UserRole.INSTRUCTOR]: [
    'sessions.read', 'sessions.create',
    'analysis.read', 'analysis.export',
    'users.read'
  ],
  [UserRole.DRIVER]: [
    'sessions.read', 'sessions.create',
    'analysis.read'
  ],
  [UserRole.SPECTATOR]: [
    'sessions.read',
    'analysis.read'
  ]
};

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Administrateur',
  [UserRole.COMMISSAIRE]: 'Commissaire de piste',
  [UserRole.MECHANIC]: 'Mécanicien',
  [UserRole.INSTRUCTOR]: 'Instructeur',
  [UserRole.DRIVER]: 'Pilote',
  [UserRole.SPECTATOR]: 'Spectateur'
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Accès complet à toutes les fonctionnalités du système',
  [UserRole.COMMISSAIRE]: 'Gestion des sessions, circuits et analyse des données',
  [UserRole.MECHANIC]: 'Accès aux données techniques et maintenance des karts',
  [UserRole.INSTRUCTOR]: 'Formation des pilotes et gestion des sessions d\'entraînement',
  [UserRole.DRIVER]: 'Participation aux sessions et accès à ses données personnelles',
  [UserRole.SPECTATOR]: 'Visualisation des sessions et données publiques'
};
