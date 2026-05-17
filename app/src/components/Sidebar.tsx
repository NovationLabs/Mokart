import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Activity, LogOut, Settings, Users, Play, Wrench, Flag, Car, CreditCard, Gauge, Trophy, TrendingUp } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';

const NAV = [
  { to: '/',           icon: LayoutDashboard, label: 'Vue d\'ensemble', end: true, section: 'dashboard' },
  { to: '/sessions',   icon: Flag,            label: 'Historique Sessions', permission: 'sessions.read', section: 'dashboard' },
  { to: '/analysis',   icon: TrendingUp,      label: 'Télémétrie Avancée', permission: 'analysis.read', section: 'performance' },
  { to: '/simulation', icon: Play,            label: 'Mode Simulateur', permission: 'sessions.read', section: 'performance' },
  { to: '/race-control', icon: Trophy,       label: 'Leaderboard Global', permission: 'race.control', section: 'performance' },
  { to: '/karts',      icon: Car,            label: 'Karts',               permission: 'karts.read', section: 'karts' },
  { to: '/hardware',   icon: Wrench,          label: 'Hardware',            permission: 'hardware.calibrate', section: 'karts' },
  { to: '/billing',    icon: CreditCard,      label: 'Billing',             permission: 'billing.read', section: 'admin' },
  { to: '/users',      icon: Users,           label: 'Utilisateurs',        permission: 'users.read', section: 'admin' },
  { to: '/settings',   icon: Settings,        label: 'Settings',            section: 'admin' },
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const { hasPermission } = usePermissions();

  useEffect(() => {
    const user = localStorage.getItem('mokart_user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        const email = userData.email || '';
        const firstName = email.split('@')[0];
        setUserName(firstName.charAt(0).toUpperCase() + firstName.slice(1));
      } catch (e) {
        setUserName('Utilisateur');
      }
    }
  }, []);

  const filteredNav = NAV.filter(item => !item.permission || hasPermission(item.permission));

  const handleLogout = () => {
    localStorage.removeItem('mokart_session');
    localStorage.removeItem('mokart_user');
    navigate('/login');
    window.location.reload();
  };

  return (
    <>
      {/* ── Mobile bottom nav ──────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0d0f12]/98 border-t border-[#262626] flex items-center justify-evenly z-50 px-2 backdrop-blur-xl safe-area-bottom">
        {filteredNav.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 min-w-[48px] py-1.5 px-1 rounded-lg transition-all ${
                isActive ? 'text-[#7bf8ac]' : 'text-white/35 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                <span className="text-[8px] font-medium uppercase tracking-wider leading-none">{label}</span>
              </>
            )}
          </NavLink>
        ))}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center gap-0.5 min-w-[48px] py-1.5 px-1 rounded-lg text-white/35 hover:text-white transition-colors"
        >
          <LogOut size={20} strokeWidth={1.5} />
          <span className="text-[8px] font-medium uppercase tracking-wider leading-none">Out</span>
        </button>
      </nav>

      {/* ── Desktop sidebar ────────────────────────────────────────────── */}
      <aside className="fixed left-0 top-0 h-screen bg-[#131316]/90 border-r border-[#27272a] hidden md:flex flex-col z-50 shrink-0 backdrop-blur-xl w-64">

        {/* Logo */}
        <div className="h-20 flex items-center justify-center md:justify-start md:px-6 border-b border-[#27272a]/50">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#06b6d4] flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.4)] md:mr-3 shrink-0">
            <Gauge className="w-6 h-6 text-white" />
          </div>
          <span className="hidden md:block text-2xl font-black text-white tracking-widest uppercase italic">
            Mo<span className="text-[#3B82F6]">Kart</span>
          </span>
        </div>

        {/* Links */}
        <nav className="flex-1 overflow-y-auto py-6 space-y-2 px-3">
          {['dashboard', 'performance', 'karts', 'admin'].map((section) => {
            const sectionItems = filteredNav.filter(item => item.section === section);
            if (sectionItems.length === 0) return null;
            return (
              <div key={section}>
                <p className={`hidden md:block text-xs font-bold text-slate-500 uppercase tracking-wider px-3 mb-2 ${sectionItems[0].section !== 'dashboard' ? 'mt-6' : ''}`}>
                  {section === 'dashboard' ? 'Tableau de bord' : section === 'performance' ? 'Performance' : section === 'karts' ? 'Karts' : 'Administration'}
                </p>
                {sectionItems.map(({ to, icon: Icon, label, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-3 rounded-xl font-semibold group relative overflow-hidden transition-all ${
                        isActive
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-100"></div>
                        )}
                        <Icon size={24} className={`md:mr-3 relative z-10 ${isActive ? 'ph-fill' : ''}`} />
                        <span className="hidden md:block relative z-10">
                          {label}
                        </span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        {/* Bottom User Profile & XP */}
        <div className="p-4 border-t border-[#27272a]/50 bg-black/20">
          <div className="flex items-center cursor-pointer group">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#06b6d4] flex items-center justify-center text-white font-bold text-lg">
                {userName ? userName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#10B981] border-2 border-[#131316] rounded-full"></div>
            </div>
            <div className="hidden md:block ml-3 flex-1 overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{userName || 'Utilisateur'}</p>
              <p className="text-xs text-[#3B82F6] font-medium truncate">Licence Pro</p>
            </div>
          </div>
          {/* XP Bar */}
          <div className="hidden md:block mt-3">
            <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
              <span>NIVEAU 42</span>
              <span>1200 / 1500 XP</span>
            </div>
            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#3B82F6] to-[#06b6d4] rounded-full" style={{ width: '80%' }}></div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
