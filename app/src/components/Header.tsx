import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, User, Settings, LogOut, X, Check, AlertCircle, Info, CheckCircle } from 'lucide-react';
import api, { Notification, UserProfile } from '../services/api';

const Header: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // ID utilisateur fixe pour la démo (à remplacer par l'authentification réelle)
  const userId = '550e8400-e29b-41d4-a716-446655440001';

  useEffect(() => {
    fetchNotifications();
    fetchUserProfile();

    // Fermer les menus quand on clique ailleurs
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await api.users.getNotifications(userId);
      setNotifications(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const data = await api.users.getProfile(userId);
      setUserProfile(data);
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
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
