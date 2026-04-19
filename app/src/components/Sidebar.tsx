import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Activity, LogOut, Settings, Users, Play, Wrench, Flag, Car, CreditCard } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';

const NAV = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/analysis',   icon: Activity,        label: 'Analysis',            permission: 'analysis.read' },
  { to: '/simulation', icon: Play,            label: 'Simulation',          permission: 'sessions.read' },
  { to: '/race-control', icon: Flag,          label: 'Race Control',        permission: 'race.control' },
  { to: '/karts',      icon: Car,            label: 'Karts',               permission: 'karts.read' },
  { to: '/hardware',   icon: Wrench,          label: 'Hardware',            permission: 'hardware.calibrate' },
  { to: '/billing',    icon: CreditCard,      label: 'Billing',             permission: 'billing.read' },
  { to: '/users',      icon: Users,           label: 'Utilisateurs',        permission: 'users.read' },
  { to: '/settings',   icon: Settings,        label: 'Settings'             },
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const { hasPermission } = usePermissions();

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
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={`fixed left-0 top-0 h-screen glass-sidebar hidden md:flex flex-col py-4 z-50 transition-all duration-200 ease-out overflow-hidden ${
          expanded ? 'w-48' : 'w-11'
        }`}
      >
        {/* Logo */}
        <div className="mb-6 flex items-center gap-2.5 px-2.5 flex-shrink-0">
          <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
            <img
              src="/icon_inverse.png"
              alt="Mokart"
              className="w-5 h-5 object-contain opacity-80"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
          <span className={`text-sm font-semibold text-white whitespace-nowrap transition-opacity duration-200 ${expanded ? 'opacity-100' : 'opacity-0'}`}>
            Mokart
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 flex flex-col gap-0.5 w-full px-1.5">
          {filteredNav.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={!expanded ? label : undefined}
              className={({ isActive }) =>
                `w-full h-8 rounded-md flex items-center gap-2.5 px-2 transition-all duration-150 relative ${
                  isActive
                    ? 'bg-[#1c1f26] text-[#7bf8ac]'
                    : 'text-[#737373] hover:text-white hover:bg-white/[0.04]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-3.5 bg-[#7bf8ac]/60 rounded-r" />
                  )}
                  <Icon size={16} strokeWidth={isActive ? 2 : 1.5} className="flex-shrink-0" />
                  <span className={`text-xs font-medium whitespace-nowrap transition-opacity duration-200 ${expanded ? 'opacity-100' : 'opacity-0'}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-1.5 flex-shrink-0">
          <button
            onClick={handleLogout}
            title={!expanded ? 'Logout' : undefined}
            className="w-full h-8 rounded-md flex items-center gap-2.5 px-2 text-[#737373] hover:text-white hover:bg-white/[0.04] transition-all duration-150"
          >
            <LogOut size={16} strokeWidth={1.5} className="flex-shrink-0" />
            <span className={`text-xs font-medium whitespace-nowrap transition-opacity duration-200 ${expanded ? 'opacity-100' : 'opacity-0'}`}>
              Logout
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
