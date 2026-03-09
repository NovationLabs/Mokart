import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Activity, LogOut, Settings, Users, Play } from 'lucide-react';

const NAV = [
  { to: '/',         icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/analysis', icon: Activity,        label: 'Analysis'             },
  { to: '/simulation', icon: Play,          label: 'Simulation'           },
  { to: '/users',    icon: Users,           label: 'Utilisateurs'         },
  { to: '/settings', icon: Settings,        label: 'Settings'             },
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('mokart_session');
    localStorage.removeItem('mokart_user');
    navigate('/login');
    window.location.reload();
  };

  return (
    <>
      {/* ── Mobile bottom nav ──────────────────────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0d0f12]/98 border-t border-[#262626] flex items-center justify-around z-50 px-4 backdrop-blur-xl">
        {NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 p-2 rounded-lg transition-all ${
                isActive ? 'text-[#7bf8ac]' : 'text-white/35 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                <span className="text-[9px] font-medium uppercase tracking-wider">{label}</span>
              </>
            )}
          </NavLink>
        ))}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-0.5 p-2 rounded-lg text-white/35 hover:text-white transition-colors"
        >
          <LogOut size={20} strokeWidth={1.5} />
          <span className="text-[9px] font-medium uppercase tracking-wider">Out</span>
        </button>
      </div>

      {/* ── Desktop sidebar ────────────────────────────────────────────────── */}
      <aside className="fixed left-0 top-0 h-screen w-16 glass-sidebar hidden md:flex flex-col items-center py-5 z-50">

        {/* Logo */}
        <div className="mb-8 w-8 h-8 flex items-center justify-center">
          <img
            src="/icon_inverse.png"
            alt="Mokart"
            className="w-7 h-7 object-contain opacity-80"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>

        {/* Nav links */}
        <nav className="flex-1 flex flex-col gap-1 w-full px-2">
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={label}
              className={({ isActive }) =>
                `w-full p-2.5 rounded-lg flex justify-center transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-[#0d0f12] text-[#7bf8ac]'
                    : 'text-white/35 hover:text-white hover:bg-white/[0.04]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#7bf8ac]/40 rounded-r" />
                  )}
                  <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                  {/* Tooltip */}
                  <span className="absolute left-full ml-3 px-2 py-1 bg-[#16181d] border border-[#262626] text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Logout"
          className="p-2.5 text-white/35 hover:text-white hover:bg-white/[0.04] rounded-lg transition-all duration-200 group relative"
        >
          <LogOut size={18} strokeWidth={1.5} />
          <span className="absolute left-full ml-3 px-2 py-1 bg-[#16181d] border border-[#262626] text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
            Logout
          </span>
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
