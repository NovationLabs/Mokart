import { useState, useEffect } from 'react';
import { UserRole, ROLE_PERMISSIONS } from '../types/user';

export const usePermissions = (userRole?: UserRole) => {
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (userRole) {
      setPermissions(ROLE_PERMISSIONS[userRole] || []);
    } else {
      // Récupérer le rôle de l'utilisateur depuis le localStorage
      const getUserRole = (): UserRole | null => {
        try {
          const user = localStorage.getItem('mokart_user');
          if (!user) return null;
          const parsed = JSON.parse(user);
          return parsed.role || null;
        } catch {
          return null;
        }
      };

      const role = getUserRole();
      if (role) {
        setPermissions(ROLE_PERMISSIONS[role] || []);
      }
    }
  }, [userRole]);

  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissionsNeeded: string[]): boolean => {
    return permissionsNeeded.some(permission => permissions.includes(permission));
  };

  const hasAllPermissions = (permissionsNeeded: string[]): boolean => {
    return permissionsNeeded.every(permission => permissions.includes(permission));
  };

  const canAccessUsers = (): boolean => {
    return hasAnyPermission(['users.read', 'users.create', 'users.update', 'users.delete']);
  };

  const canManageUsers = (): boolean => {
    return hasAllPermissions(['users.create', 'users.update', 'users.delete']);
  };

  const canAccessSessions = (): boolean => {
    return hasAnyPermission(['sessions.read', 'sessions.create', 'sessions.update', 'sessions.delete']);
  };

  const canManageSessions = (): boolean => {
    return hasAllPermissions(['sessions.create', 'sessions.update', 'sessions.delete']);
  };

  const canAccessAnalysis = (): boolean => {
    return hasPermission('analysis.read');
  };

  const canExportAnalysis = (): boolean => {
    return hasPermission('analysis.export');
  };

  const canManageSystem = (): boolean => {
    return hasPermission('system.manage');
  };

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessUsers,
    canManageUsers,
    canAccessSessions,
    canManageSessions,
    canAccessAnalysis,
    canExportAnalysis,
    canManageSystem
  };
};

export default usePermissions;
