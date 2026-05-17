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
    { id: 'commissaire', name: 'Commissaire', icon: '👮' },
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
      case 'success': return <CheckCircle className="w-4 h-4 text-[#10B981]" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-[#eab308]" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-[#ef4444]" />;
      default: return <Info className="w-4 h-4 text-[#3B82F6]" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // ── Group filtered items by category ─────────────────────────────
  const pageItems = filteredItems.filter(i => i.category === 'page');
  const actionItems = filteredItems.filter(i => i.category === 'action');

  return (
    <>
      <header className={`flex-shrink-0 h-20 border-b border-[#27272a]/30 flex items-center justify-between px-6 md:px-10 z-40 relative backdrop-blur-md bg-[#0a0a0c]/60 ${className || ''}`}>

        {/* ── Left: Titles ────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight capitalize">{currentPage}</h1>
          <p className="text-sm text-slate-400 font-medium hidden sm:block">MoKart Management System</p>
        </div>

        {/* ── Right: Actions ────────────────────────────────────────── */}
        <div className="flex items-center space-x-3 sm:space-x-5">

          {/* Status Piste */}
          <div className="hidden md:flex items-center bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
            </span>
            <span className="text-xs font-bold text-[#10B981] tracking-widest uppercase">Système Actif</span>
          </div>

          {/* Search (cmd+K) */}
          <button
            onClick={openSearch}
            className="flex items-center bg-white/5 hover:bg-white/10 border border-white/5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all shadow-lg group"
          >
            <Search className="w-4 h-4 sm:mr-2 text-slate-400 group-hover:text-white transition-colors" />
            <span className="hidden sm:inline">Rechercher</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 ml-3 px-1.5 py-0.5 bg-black/40 border border-white/10 rounded-md text-[10px] text-slate-400 font-mono">
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          </button>

          {/* Role switcher (demo) */}
          {isDemoUser() && (
            <div className="relative" ref={roleSwitcherRef}>
              <button
                onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-sm font-bold text-white transition-all shadow-lg"
              >
                <span className="text-sm">{roles.find(r => r.id === getCurrentRole())?.icon}</span>
                <span className="hidden sm:inline capitalize">{roles.find(r => r.id === getCurrentRole())?.name}</span>
              </button>

              {showRoleSwitcher && (
                <div className="absolute right-0 mt-3 w-48 bg-[#131316]/95 backdrop-blur-xl border border-[#27272a] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] z-[200] overflow-hidden">
                  <div className="p-4 border-b border-white/5 bg-black/20">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Changer de Rôle</h3>
                  </div>
                  <div className="py-2">
                    {roles.map((role) => (
                      <button
                        key={role.id}
                        onClick={() => switchRole(role.id)}
                        className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors ${
                          getCurrentRole() === role.id
                            ? 'bg-[#3B82F6]/10 text-[#3B82F6]'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span className="text-base">{role.icon}</span>
                        <span className="font-semibold">{role.name}</span>
                        {getCurrentRole() === role.id && <Check className="w-4 h-4 ml-auto" />}
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
              className="relative p-2.5 text-slate-400 hover:text-white bg-white/5 rounded-full hover:bg-white/10 transition-colors border border-white/5 shadow-lg"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#3B82F6] rounded-full border-2 border-[#0a0a0c]"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 sm:right-0 mt-3 w-[calc(100vw-2rem)] sm:w-80 max-w-80 bg-[#131316]/95 backdrop-blur-xl border border-[#27272a] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] z-50 overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-black/20 flex items-center justify-between">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllNotificationsAsRead} className="text-xs text-[#3B82F6] hover:text-[#60a5fa] font-semibold transition-colors">
                      Tout marquer lu
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-sm font-medium">Aucune notification</div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${!notification.read ? 'bg-white/[0.02]' : ''}`}
                        onClick={() => !notification.read && markNotificationAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className={`text-sm font-bold truncate ${!notification.read ? 'text-white' : 'text-slate-300'}`}>{notification.title}</h4>
                              {!notification.read && <div className="w-1.5 h-1.5 bg-[#3B82F6] rounded-full ml-2 flex-shrink-0" />}
                            </div>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{notification.message}</p>
                            <p className="text-[10px] text-slate-500 mt-2 font-medium">
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

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="relative p-1 text-slate-400 hover:text-white bg-white/5 rounded-full hover:bg-white/10 transition-colors border border-white/5 shadow-lg group"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#06b6d4] flex items-center justify-center text-white text-xs font-bold shadow-inner group-hover:scale-105 transition-transform">
                {getUserInitials()}
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-3 w-56 max-w-[calc(100vw-2rem)] bg-[#131316]/95 backdrop-blur-xl border border-[#27272a] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] z-50 overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-black/20">
                  <p className="text-sm font-bold text-white">
                    {userProfile ? `${userProfile.first_name} ${userProfile.last_name}`.trim() || userProfile.username : '...'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{userProfile?.email}</p>
                </div>
                <div className="py-2">
                  <a href="/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                    <Settings className="w-4 h-4" />
                    Paramètres
                  </a>
                  <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors w-full text-left">
                    <LogOut className="w-4 h-4" />
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
          <div className="absolute inset-0 bg-[#0a0a0c]/80 backdrop-blur-sm transition-opacity" onClick={closeSearch} />
          <div className="relative w-full max-w-lg mx-4 bg-[#131316] border border-[#27272a] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.8)] overflow-hidden">

            {/* Search input */}
            <div className="flex items-center gap-3 px-5 h-14 border-b border-[#27272a]">
              <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Rechercher une page ou une action..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="flex-1 bg-transparent text-base text-white placeholder-slate-500 focus:outline-none"
              />
              <kbd className="px-1.5 py-0.5 bg-black/40 border border-white/10 rounded-md text-[10px] text-slate-400 font-mono">ESC</kbd>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto py-2">
              {filteredItems.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm font-medium text-slate-500">
                  Aucun résultat trouvé pour "{searchQuery}"
                </div>
              ) : (
                <>
                  {/* Pages */}
                  {pageItems.length > 0 && (
                    <>
                      <div className="px-4 pt-2 pb-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pages</span>
                      </div>
                      {pageItems.map((item) => {
                        const globalIndex = filteredItems.indexOf(item);
                        return (
                          <button
                            key={item.id}
                            onClick={() => { item.action(); closeSearch(); }}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors ${
                              selectedIndex === globalIndex
                                ? 'bg-[#3B82F6]/10 text-white border-l-2 border-[#3B82F6]'
                                : 'text-slate-400 hover:bg-white/5 border-l-2 border-transparent'
                            }`}
                          >
                            <span className={selectedIndex === globalIndex ? 'text-[#3B82F6]' : 'text-slate-500'}>{item.icon}</span>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-bold">{item.label}</span>
                              {item.description && (
                                <span className="text-xs text-slate-500 ml-2 font-medium hidden sm:inline">{item.description}</span>
                              )}
                            </div>
                            {selectedIndex === globalIndex && (
                              <ArrowRight className="w-4 h-4 text-[#3B82F6] flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </>
                  )}

                  {/* Actions */}
                  {actionItems.length > 0 && (
                    <>
                      <div className="px-4 pt-4 pb-1 border-t border-white/5 mt-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Actions</span>
                      </div>
                      {actionItems.map((item) => {
                        const globalIndex = filteredItems.indexOf(item);
                        return (
                          <button
                            key={item.id}
                            onClick={() => { item.action(); closeSearch(); }}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors ${
                              selectedIndex === globalIndex
                                ? 'bg-[#3B82F6]/10 text-white border-l-2 border-[#3B82F6]'
                                : 'text-slate-400 hover:bg-white/5 border-l-2 border-transparent'
                            }`}
                          >
                            <span className={selectedIndex === globalIndex ? 'text-[#3B82F6]' : 'text-slate-500'}>{item.icon}</span>
                            <span className="text-sm font-bold">{item.label}</span>
                            {selectedIndex === globalIndex && (
                              <ArrowRight className="w-4 h-4 text-[#3B82F6] flex-shrink-0 ml-auto" />
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
            <div className="flex items-center gap-4 px-4 py-3 border-t border-[#27272a] bg-black/20 text-[10px] font-medium text-slate-500">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-black/40 border border-white/10 rounded font-mono">↑↓</kbd>
                Naviguer
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-black/40 border border-white/10 rounded font-mono">↵</kbd>
                Ouvrir
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-black/40 border border-white/10 rounded font-mono">esc</kbd>
                Fermer
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
