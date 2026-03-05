import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, User, Settings, LogOut, X, Check, AlertCircle, Info, CheckCircle, Shield } from 'lucide-react';
import api, { Notification, UserProfile } from '../services/api';

const Header: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const roleSwitcherRef = useRef<HTMLDivElement>(null);

  // ID utilisateur pour la démo (à remplacer par l'authentification réelle)
  const getStoredUserId = () => {
    try {
      const storedUser = localStorage.getItem('mokart_user');
      if (!storedUser) {
        // Utiliser l'ID du user pilot par défaut pour la démo
        const defaultUser = {
          id: '550e8400-e29b-41d4-a716-446655440001',
          username: 'pilot',
          role: 'admin'
        };
        localStorage.setItem('mokart_user', JSON.stringify(defaultUser));
        return defaultUser.id;
      }
      const parsed = JSON.parse(storedUser);
      return typeof parsed?.id === 'string' ? parsed.id : '550e8400-e29b-41d4-a716-446655440001';
    } catch {
      return '550e8400-e29b-41d4-a716-446655440001';
    }
  };

  useEffect(() => {
    const userId = getStoredUserId();
    console.log('User ID utilisé:', userId);
    setUserId(userId);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mokart_user') {
        const newUserId = getStoredUserId();
        console.log('User ID changé:', newUserId);
        setUserId(newUserId);
      }
    };

    // Fonction pour nettoyer et réinitialiser l'utilisateur
    const clearUserSession = () => {
      localStorage.removeItem('mokart_user');
      localStorage.removeItem('mokart_session');
      setUserId('');
      setUserProfile(null);
      setNotifications([]);
      console.log('Session utilisateur nettoyée');
    };

    // Exposer la fonction globalement pour pouvoir l'utiliser depuis la console
    (window as any).clearUserSession = clearUserSession;

    // Fermer les menus quand on clique ailleurs
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (roleSwitcherRef.current && !roleSwitcherRef.current.contains(event.target as Node)) {
        setShowRoleSwitcher(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      setUserProfile(null);
      setNotifications([]);
      return;
    }
    fetchNotifications(userId);
    fetchUserProfile(userId);
  }, [userId]);

  const fetchNotifications = async (uid: string) => {
    try {
      const data = await api.users.getNotifications(uid);
      setNotifications(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
    }
  };

  const fetchUserProfile = async (uid: string) => {
    try {
      const data = await api.users.getProfile(uid);
      setUserProfile(data);
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    if (!userId) return;
    try {
      await api.users.markNotificationRead(notificationId, userId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (!userId) return;
    try {
      await api.users.markAllNotificationsRead(userId);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Erreur lors du marquage des notifications:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    // Supprimer la session et les données utilisateur du localStorage
    localStorage.removeItem('mokart_session');
    localStorage.removeItem('mokart_user');

    // Rediriger vers la page de login
    window.location.href = '/login';
  };

  const isDemoUser = () => {
    const storedUser = localStorage.getItem('mokart_user');
    if (!storedUser) return false;
    try {
      const user = JSON.parse(storedUser);
      return user.id === '550e8400-e29b-41d4-a716-446655440001';
    } catch {
      return false;
    }
  };

  const switchRole = (newRole: string) => {
    const storedUser = localStorage.getItem('mokart_user');
    if (!storedUser) return;

    try {
      const user = JSON.parse(storedUser);
      user.role = newRole;
      localStorage.setItem('mokart_user', JSON.stringify(user));

      // Émettre un événement personnalisé pour que le composant Home puisse l'écouter
      window.dispatchEvent(new CustomEvent('userRoleChanged', { detail: { role: newRole } }));

      // Forcer le rechargement de la page pour mettre à jour le dashboard
      window.location.reload();
    } catch (error) {
      console.error('Erreur lors du changement de rôle:', error);
    }
  };

  const getCurrentRole = () => {
    const storedUser = localStorage.getItem('mokart_user');
    if (!storedUser) return 'pilot';
    try {
      const user = JSON.parse(storedUser);
      return user.role || 'pilot';
    } catch {
      return 'pilot';
    }
  };

  const roles = [
    { id: 'admin', name: 'Admin', icon: '👑' },
    { id: 'pilot', name: 'Pilote', icon: '🏎️' },
    { id: 'mechanic', name: 'Mécanicien', icon: '🔧' },
    { id: 'observer', name: 'Observateur', icon: '👁️' }
  ];

  return (
    <header className="bg-[#0a0a0a] border-b border-[#262626] px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Barre de recherche */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#737373] w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#171717] border border-[#262626] rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-[#737373] focus:outline-none focus:border-[#404040] transition-colors"
            />
          </div>
        </div>

        {/* Actions à droite */}
        <div className="flex items-center gap-4 ml-6">
          {/* Bouton switcher de rôle - uniquement pour le compte démo */}
          {isDemoUser() && (
            <div className="relative" ref={roleSwitcherRef}>
              <button
                onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                className="flex items-center gap-2 p-2 text-[#a3a3a3] hover:text-white transition-colors"
                title="Changer de rôle (démo)"
              >
                <Shield className="w-5 h-5" />
                <span className="text-xs px-2 py-1 bg-[#22D3EE] text-white rounded">
                  {roles.find(r => r.id === getCurrentRole())?.icon} {getCurrentRole()}
                </span>
              </button>

              {/* Menu switcher de rôle */}
              {showRoleSwitcher && (
                <div className="absolute right-0 mt-2 w-48 bg-[#171717] border border-[#262626] rounded-lg shadow-lg z-50">
                  <div className="p-3 border-b border-[#262626]">
                    <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Changer de Rôle</h3>
                    <p className="text-xs text-[#737373] mt-1">Mode démo uniquement</p>
                  </div>
                  <div className="py-2">
                    {roles.map((role) => (
                      <button
                        key={role.id}
                        onClick={() => switchRole(role.id)}
                        className={`flex items-center gap-3 w-full px-3 py-2 text-sm transition-colors ${
                          getCurrentRole() === role.id
                            ? 'bg-[#22D3EE] text-white'
                            : 'text-[#a3a3a3] hover:text-white hover:bg-[#262626]'
                        }`}
                      >
                        <span className="text-lg">{role.icon}</span>
                        <div className="text-left">
                          <div className="font-medium">{role.name}</div>
                          <div className="text-xs opacity-75">{role.id}</div>
                        </div>
                        {getCurrentRole() === role.id && (
                          <Check className="w-4 h-4 ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-[#a3a3a3] hover:text-white transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#22D3EE] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Menu notifications */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-[#171717] border border-[#262626] rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-[#262626] flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-xs text-[#22D3EE] hover:text-[#40E0D0] transition-colors"
                    >
                      Tout marquer comme lu
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-[#737373] text-sm">
                      Aucune notification
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-[#262626] hover:bg-[#262626] transition-colors cursor-pointer ${
                          !notification.read ? 'bg-[#1a1a1a]' : ''
                        }`}
                        onClick={() => !notification.read && markNotificationAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium text-white truncate">
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-[#22D3EE] rounded-full"></div>
                              )}
                            </div>
                            <p className="text-xs text-[#a3a3a3] mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-[#737373] mt-2">
                              {new Date(notification.created_at).toLocaleDateString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Menu utilisateur */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-2 text-[#a3a3a3] hover:text-white transition-colors"
            >
              <User className="w-5 h-5" />
              <span className="text-sm">
                {userProfile ? `${userProfile.first_name || userProfile.username}` : 'Chargement...'}
              </span>
            </button>

            {/* Menu utilisateur */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-[#171717] border border-[#262626] rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-[#262626]">
                  <p className="text-sm font-medium text-white">
                    {userProfile ? `${userProfile.first_name} ${userProfile.last_name}`.trim() || userProfile.username : 'Chargement...'}
                  </p>
                  <p className="text-xs text-[#a3a3a3] mt-1">
                    {userProfile?.email}
                  </p>
                </div>
                <div className="py-2">
                  <a
                    href="/settings"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-[#a3a3a3] hover:text-white hover:bg-[#262626] transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Paramètres
                  </a>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-[#a3a3a3] hover:text-white hover:bg-[#262626] transition-colors w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
