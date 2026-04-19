import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search, Bell, Settings, LogOut, Check, AlertCircle, Info, CheckCircle,
  ChevronRight, Command, LayoutDashboard, Activity, Play, Users, Radio,
  Clock, ArrowRight
} from 'lucide-react';
import api, { Notification, UserProfile } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';

interface HeaderProps {
  className?: string;
}

interface SearchItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  category: 'page' | 'action';
}

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/sessions': 'Sessions',
  '/analysis': 'Analysis',
  '/live': 'Live Tracking',
  '/simulation': 'Simulation',
  '/settings': 'Settings',
  '/users': 'Utilisateurs',
};

const Header: React.FC<HeaderProps> = ({ className }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const roleSwitcherRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const currentPage = PAGE_TITLES[location.pathname] || 'Dashboard';
  const { hasPermission } = usePermissions();

  // ── Search items ─────────────────────────────────────────────────
  const allSearchItems: (SearchItem & { permission?: string })[] = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', description: 'Vue principale', icon: <LayoutDashboard className="w-4 h-4" />, action: () => navigate('/'), category: 'page' },
    { id: 'analysis', label: 'Analysis', description: 'Analyse de performance', icon: <Activity className="w-4 h-4" />, action: () => navigate('/analysis'), category: 'page', permission: 'analysis.read' },
    { id: 'sessions', label: 'Sessions', description: 'Historique des sessions', icon: <Clock className="w-4 h-4" />, action: () => navigate('/sessions'), category: 'page', permission: 'sessions.read' },
    { id: 'live', label: 'Live Tracking', description: 'Suivi en temps réel', icon: <Radio className="w-4 h-4" />, action: () => navigate('/live'), category: 'page', permission: 'sessions.read' },
    { id: 'simulation', label: 'Simulation', description: 'Simulateur de circuit', icon: <Play className="w-4 h-4" />, action: () => navigate('/simulation'), category: 'page', permission: 'sessions.read' },
    { id: 'users', label: 'Utilisateurs', description: 'Gestion des utilisateurs', icon: <Users className="w-4 h-4" />, action: () => navigate('/users'), category: 'page', permission: 'users.read' },
    { id: 'settings', label: 'Settings', description: 'Paramètres du compte', icon: <Settings className="w-4 h-4" />, action: () => navigate('/settings'), category: 'page' },
    { id: 'logout', label: 'Déconnexion', description: 'Se déconnecter', icon: <LogOut className="w-4 h-4" />, action: () => handleLogout(), category: 'action' },
  ], [navigate]);

  const searchItems: SearchItem[] = useMemo(() =>
    allSearchItems.filter(item => !item.permission || hasPermission(item.permission)),
  [allSearchItems, hasPermission]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return searchItems;
    const q = searchQuery.toLowerCase();
    return searchItems.filter(item =>
      item.label.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q)
    );
  }, [searchQuery, searchItems]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems.length, searchQuery]);

  // ── User helpers ─────────────────────────────────────────────────
  const getStoredUserId = () => {
    try {
      const storedUser = localStorage.getItem('mokart_user');
      if (!storedUser) {
        const defaultUser = { id: '550e8400-e29b-41d4-a716-446655440001', username: 'pilot', role: 'admin' };
        localStorage.setItem('mokart_user', JSON.stringify(defaultUser));
        return defaultUser.id;
      }
      const parsed = JSON.parse(storedUser);
      return typeof parsed?.id === 'string' ? parsed.id : '550e8400-e29b-41d4-a716-446655440001';
    } catch {
      return '550e8400-e29b-41d4-a716-446655440001';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mokart_session');
    localStorage.removeItem('mokart_user');
    window.location.href = '/login';
  };

  const isDemoUser = () => {
    try {
      const user = JSON.parse(localStorage.getItem('mokart_user') || '');
      return user.id === '550e8400-e29b-41d4-a716-446655440001';
    } catch { return false; }
  };

  const getCurrentRole = () => {
    try {
      const user = JSON.parse(localStorage.getItem('mokart_user') || '');
      return user.role || 'driver';
    } catch { return 'driver'; }
  };

  const switchRole = (newRole: string) => {
    try {
      const user = JSON.parse(localStorage.getItem('mokart_user') || '');
      user.role = newRole;
      localStorage.setItem('mokart_user', JSON.stringify(user));
      window.dispatchEvent(new CustomEvent('userRoleChanged', { detail: { role: newRole } }));
      window.location.reload();
    } catch (error) {
      console.error('Erreur lors du changement de rôle:', error);
    }
  };

  const getUserInitials = () => {
    if (!userProfile) return '?';
    const first = userProfile.first_name?.[0] || '';
    const last = userProfile.last_name?.[0] || '';
    return (first + last).toUpperCase() || userProfile.username?.[0]?.toUpperCase() || '?';
  };

  const roles = [
    { id: 'admin', name: 'Admin', icon: '👑' },
    { id: 'track_manager', name: 'Track Manager', icon: '🏆' },
    { id: 'commissaire', name: 'Commissaire', icon: '�️' },
    { id: 'mechanic', name: 'Mécanicien', icon: '🔧' },
    { id: 'instructor', name: 'Instructeur', icon: '👨‍🏫' },
    { id: 'driver', name: 'Pilote', icon: '🏎️' },
    { id: 'spectator', name: 'Spectateur', icon: '👁️' },
    { id: 'device_kart', name: 'Device Kart', icon: '📱' },
  ];

  // ── Search keyboard navigation ──────────────────────────────────
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      e.preventDefault();
      filteredItems[selectedIndex].action();
      closeSearch();
    }
  }, [filteredItems, selectedIndex]);

  const openSearch = () => {
    setShowSearch(true);
    setSearchQuery('');
    setSelectedIndex(0);
  };

  const closeSearch = () => {
    setShowSearch(false);
    setSearchQuery('');
    setSelectedIndex(0);
  };

  // ── Effects ──────────────────────────────────────────────────────
  useEffect(() => {
    const uid = getStoredUserId();
    setUserId(uid);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mokart_user') setUserId(getStoredUserId());
    };

    const clearUserSession = () => {
      localStorage.removeItem('mokart_user');
      localStorage.removeItem('mokart_session');
      setUserId('');
      setUserProfile(null);
      setNotifications([]);
    };
    (window as any).clearUserSession = clearUserSession;

    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) setShowNotifications(false);
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setShowUserMenu(false);
      if (roleSwitcherRef.current && !roleSwitcherRef.current.contains(event.target as Node)) setShowRoleSwitcher(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(prev => {
          if (prev) { closeSearch(); return false; }
          openSearch();
          return true;
        });
      }
      if (e.key === 'Escape') closeSearch();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [showSearch]);

  useEffect(() => {
    if (!userId) { setUserProfile(null); setNotifications([]); return; }
    fetchNotifications(userId);
    fetchUserProfile(userId);
  }, [userId]);

  // ── API calls ────────────────────────────────────────────────────
  const fetchNotifications = async (uid: string) => {
    try { setNotifications(await api.users.getNotifications(uid)); } catch {}
  };

  const fetchUserProfile = async (uid: string) => {
    try { setUserProfile(await api.users.getProfile(uid)); } catch {}
  };

  const markNotificationAsRead = async (notificationId: string) => {
    if (!userId) return;
    try {
      await api.users.markNotificationRead(notificationId, userId);
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
    } catch {}
  };

  const markAllNotificationsAsRead = async () => {
    if (!userId) return;
    try {
      await api.users.markAllNotificationsRead(userId);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {}
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // ── Group filtered items by category ─────────────────────────────
  const pageItems = filteredItems.filter(i => i.category === 'page');
  const actionItems = filteredItems.filter(i => i.category === 'action');

  return (
    <>
      <header className={`flex-shrink-0 h-12 flex items-center bg-[#0d0f12]/95 border-b border-[#262626] px-4 backdrop-blur-xl relative z-40 ${className || ''}`}>
        {/* ── Left: Breadcrumb (Supabase style) ──────────────────────── */}
        <div className="flex items-center gap-0 min-w-0">
          <img
            src="/icon_inverse.png"
            alt="Mokart"
            className="w-4 h-4 object-contain opacity-60 mr-2 hidden sm:block"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <span className="text-[#737373] text-sm hover:text-[#a3a3a3] cursor-default hidden sm:inline transition-colors">Mokart</span>
          <span className="text-[#404040] mx-2 hidden sm:inline">/</span>
          <span className="text-white text-sm font-medium truncate">{currentPage}</span>
        </div>

        <div className="flex-1" />

        {/* ── Right: Actions ────────────────────────────────────────── */}
        <div className="flex items-center gap-1">

          {/* Search (cmd+K) */}
          <button
            onClick={openSearch}
            className="flex items-center gap-2 h-7 px-2.5 text-[#737373] hover:text-[#a3a3a3] hover:border-[#404040] bg-[#16181d] border border-[#262626] rounded-md text-xs transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rechercher</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.5 bg-[#0d0f12] border border-[#333] rounded text-[10px] text-[#555] font-mono">
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          </button>

          <div className="w-px h-5 bg-[#262626] mx-1.5" />

          {/* Role switcher (demo) */}
          {isDemoUser() && (
            <div className="relative" ref={roleSwitcherRef}>
              <button
                onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                className="flex items-center gap-1.5 h-7 px-2 text-[#a3a3a3] hover:text-white bg-[#16181d] border border-[#262626] rounded-md text-xs transition-colors"
              >
                <span className="text-sm">{roles.find(r => r.id === getCurrentRole())?.icon}</span>
                <span className="hidden sm:inline capitalize">{getCurrentRole()}</span>
              </button>

              {showRoleSwitcher && (
                <div className="absolute right-0 mt-2 w-48 bg-[#16181d] border border-[#262626] rounded-lg shadow-xl z-[200]">
                  <div className="p-3 border-b border-[#262626]">
                    <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Changer de Rôle</h3>
                    <p className="text-xs text-[#737373] mt-1">Mode démo uniquement</p>
                  </div>
                  <div className="py-1">
                    {roles.map((role) => (
                      <button
                        key={role.id}
                        onClick={() => switchRole(role.id)}
                        className={`flex items-center gap-3 w-full px-3 py-2 text-sm transition-colors ${
                          getCurrentRole() === role.id
                            ? 'bg-[#7bf8ac]/10 text-[#7bf8ac]'
                            : 'text-[#a3a3a3] hover:text-white hover:bg-[#262626]'
                        }`}
                      >
                        <span className="text-base">{role.icon}</span>
                        <span className="font-medium">{role.name}</span>
                        {getCurrentRole() === role.id && <Check className="w-3.5 h-3.5 ml-auto" />}
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
              className="relative flex items-center justify-center w-7 h-7 text-[#737373] hover:text-white rounded-md hover:bg-[#1c1f26] transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#7bf8ac] text-black text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 sm:right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-80 bg-[#16181d] border border-[#262626] rounded-lg shadow-xl z-50">
                <div className="p-3 border-b border-[#262626] flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllNotificationsAsRead} className="text-xs text-[#7bf8ac] hover:text-[#34d399] transition-colors">
                      Tout marquer lu
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-[#737373] text-sm">Aucune notification</div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b border-[#262626]/50 hover:bg-[#1c1f26] transition-colors cursor-pointer ${!notification.read ? 'bg-[#1a1c21]' : ''}`}
                        onClick={() => !notification.read && markNotificationAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-2.5">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-medium text-white truncate">{notification.title}</h4>
                              {!notification.read && <div className="w-1.5 h-1.5 bg-[#7bf8ac] rounded-full ml-2 flex-shrink-0" />}
                            </div>
                            <p className="text-xs text-[#737373] mt-0.5 line-clamp-2">{notification.message}</p>
                            <p className="text-[10px] text-[#555] mt-1">
                              {new Date(notification.created_at).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
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

          <div className="w-px h-5 bg-[#262626] mx-1.5" />

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 h-7 pl-1 pr-2 text-[#a3a3a3] hover:text-white rounded-md hover:bg-[#1c1f26] transition-colors"
            >
              <div className="w-5 h-5 rounded-full bg-[#7bf8ac]/20 text-[#7bf8ac] flex items-center justify-center text-[10px] font-bold">
                {getUserInitials()}
              </div>
              <span className="text-xs hidden sm:inline max-w-[100px] truncate">
                {userProfile ? (userProfile.first_name || userProfile.username) : '...'}
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] bg-[#16181d] border border-[#262626] rounded-lg shadow-xl z-50">
                <div className="p-3 border-b border-[#262626]">
                  <p className="text-sm font-medium text-white">
                    {userProfile ? `${userProfile.first_name} ${userProfile.last_name}`.trim() || userProfile.username : '...'}
                  </p>
                  <p className="text-xs text-[#737373] mt-0.5">{userProfile?.email}</p>
                </div>
                <div className="py-1">
                  <a href="/settings" className="flex items-center gap-2.5 px-3 py-2 text-xs text-[#a3a3a3] hover:text-white hover:bg-[#1c1f26] transition-colors">
                    <Settings className="w-3.5 h-3.5" />
                    Paramètres
                  </a>
                  <button onClick={handleLogout} className="flex items-center gap-2.5 px-3 py-2 text-xs text-[#a3a3a3] hover:text-white hover:bg-[#1c1f26] transition-colors w-full text-left">
                    <LogOut className="w-3.5 h-3.5" />
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Command Palette (cmd+K) ─────────────────────────────────── */}
      {showSearch && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeSearch} />
          <div className="relative w-full max-w-lg mx-4 bg-[#16181d] border border-[#262626] rounded-xl shadow-2xl overflow-hidden">
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 h-12 border-b border-[#262626]">
              <Search className="w-4 h-4 text-[#737373] flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Aller à une page, action..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="flex-1 bg-transparent text-sm text-white placeholder-[#555] focus:outline-none"
              />
              <kbd className="px-1.5 py-0.5 bg-[#0d0f12] border border-[#333] rounded text-[10px] text-[#555] font-mono">ESC</kbd>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto py-1">
              {filteredItems.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-[#555]">
                  Aucun résultat pour "{searchQuery}"
                </div>
              ) : (
                <>
                  {/* Pages */}
                  {pageItems.length > 0 && (
                    <>
                      <div className="px-3 pt-2 pb-1">
                        <span className="text-[10px] font-semibold text-[#555] uppercase tracking-wider">Pages</span>
                      </div>
                      {pageItems.map((item) => {
                        const globalIndex = filteredItems.indexOf(item);
                        return (
                          <button
                            key={item.id}
                            onClick={() => { item.action(); closeSearch(); }}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={`flex items-center gap-3 w-full px-3 py-2 text-left transition-colors ${
                              selectedIndex === globalIndex
                                ? 'bg-[#7bf8ac]/10 text-white'
                                : 'text-[#a3a3a3] hover:bg-[#1c1f26]'
                            }`}
                          >
                            <span className={selectedIndex === globalIndex ? 'text-[#7bf8ac]' : 'text-[#555]'}>{item.icon}</span>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium">{item.label}</span>
                              {item.description && (
                                <span className="text-xs text-[#555] ml-2">{item.description}</span>
                              )}
                            </div>
                            {selectedIndex === globalIndex && (
                              <ArrowRight className="w-3.5 h-3.5 text-[#7bf8ac] flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </>
                  )}

                  {/* Actions */}
                  {actionItems.length > 0 && (
                    <>
                      <div className="px-3 pt-3 pb-1 border-t border-[#262626] mt-1">
                        <span className="text-[10px] font-semibold text-[#555] uppercase tracking-wider">Actions</span>
                      </div>
                      {actionItems.map((item) => {
                        const globalIndex = filteredItems.indexOf(item);
                        return (
                          <button
                            key={item.id}
                            onClick={() => { item.action(); closeSearch(); }}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={`flex items-center gap-3 w-full px-3 py-2 text-left transition-colors ${
                              selectedIndex === globalIndex
                                ? 'bg-[#7bf8ac]/10 text-white'
                                : 'text-[#a3a3a3] hover:bg-[#1c1f26]'
                            }`}
                          >
                            <span className={selectedIndex === globalIndex ? 'text-[#7bf8ac]' : 'text-[#555]'}>{item.icon}</span>
                            <span className="text-sm font-medium">{item.label}</span>
                            {selectedIndex === globalIndex && (
                              <ArrowRight className="w-3.5 h-3.5 text-[#7bf8ac] flex-shrink-0 ml-auto" />
                            )}
                          </button>
                        );
                      })}
                    </>
                  )}
                </>
              )}
            </div>

            {/* Footer hints */}
            <div className="flex items-center gap-4 px-3 py-2 border-t border-[#262626] text-[10px] text-[#555]">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-[#0d0f12] border border-[#333] rounded font-mono">↑↓</kbd>
                naviguer
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-[#0d0f12] border border-[#333] rounded font-mono">↵</kbd>
                ouvrir
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-[#0d0f12] border border-[#333] rounded font-mono">esc</kbd>
                fermer
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
