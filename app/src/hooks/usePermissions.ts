import { useState, useEffect } from 'react';
import { UserRole, ROLE_PERMISSIONS } from '../types/user';

// État global partagé pour les permissions
let globalPermissions: string[] = [];
let globalRole: UserRole | null = null;
const permissionListeners = new Set<() => void>();

const notifyListeners = () => {
  permissionListeners.forEach(listener => listener());
};

export const usePermissions = (userRole?: UserRole) => {
  const [permissions, setPermissions] = useState<string[]>(globalPermissions);

  useEffect(() => {
    // Ajouter ce listener à la liste globale
    permissionListeners.add(() => {
      setPermissions([...globalPermissions]);
    });

    if (userRole) {
      globalPermissions = ROLE_PERMISSIONS[userRole] || [];
      globalRole = userRole;
      setPermissions(globalPermissions);
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
      console.log('usePermissions - Role from localStorage:', role);
      if (role) {
        globalPermissions = ROLE_PERMISSIONS[role] || [];
        globalRole = role;
        console.log('usePermissions - Available permissions:', globalPermissions);
        setPermissions(globalPermissions);
      }
    }

    return () => {
      // Nettoyer le listener quand le composant est démonté
      permissionListeners.clear();
    };
  }, [userRole]);

  // Écouter les changements de rôle depuis le Header
  useEffect(() => {
    const handleRoleChange = (event: CustomEvent) => {
      const newRole = event.detail.role as UserRole;
      if (newRole) {
        globalPermissions = ROLE_PERMISSIONS[newRole] || [];
        globalRole = newRole;
        setPermissions(globalPermissions);
        notifyListeners(); // Notifier tous les autres composants
      }
    };

    window.addEventListener('userRoleChanged', handleRoleChange as EventListener);
    return () => {
      window.removeEventListener('userRoleChanged', handleRoleChange as EventListener);
    };
  }, []);

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

  const canManageKarts = (): boolean => {
    return hasAllPermissions(['karts.create', 'karts.update', 'karts.delete']);
  };

  const canAccessKarts = (): boolean => {
    return hasAnyPermission(['karts.read', 'karts.create', 'karts.update', 'karts.delete']);
  };

  const canControlRace = (): boolean => {
    const result = hasPermission('race.control');
    console.log('usePermissions - canControlRace() called, current permissions:', permissions, 'result:', result);
    return result;
  };

  const canRestrictKarts = (): boolean => {
    return hasPermission('karts.restrict');
  };

  const canManageHardware = (): boolean => {
    return hasAnyPermission(['hardware.calibrate', 'hardware.reboot', 'hardware.ota_update']);
  };

  const canCalibrateHardware = (): boolean => {
    return hasPermission('hardware.calibrate');
  };

  const canRebootHardware = (): boolean => {
    return hasPermission('hardware.reboot');
  };

  const canOTAUpdate = (): boolean => {
    return hasPermission('hardware.ota_update');
  };

  const canWriteTelemetry = (): boolean => {
    return hasPermission('telemetry.write');
  };

  const canReadTelemetry = (): boolean => {
    return hasPermission('telemetry.read');
  };

  const canJoinSession = (): boolean => {
    return hasPermission('sessions.join');
  };

  const canManageBilling = (): boolean => {
    return hasPermission('billing.manage');
  };

  const canReadBilling = (): boolean => {
    return hasPermission('billing.read');
  };

  const canManageEmployees = (): boolean => {
    return hasAnyPermission(['employees.create', 'employees.update', 'employees.delete']);
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
    canManageSystem,
    canManageKarts,
    canAccessKarts,
    canControlRace,
    canRestrictKarts,
    canManageHardware,
    canCalibrateHardware,
    canRebootHardware,
    canOTAUpdate,
    canWriteTelemetry,
    canReadTelemetry,
    canJoinSession,
    canManageBilling,
    canReadBilling,
    canManageEmployees
  };
};

export default usePermissions;
