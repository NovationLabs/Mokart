// MOCK DATA — toutes les valeurs sont synthétiques (voir src/data/mock.ts)
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { MOCK_DRIVER, MOCK_SESSIONS, fmtLap, fmtDelta } from '../data/mock';
import {
  Bell, Search, TrendingDown, TrendingUp,
  Timer, Gauge, Layers, Zap, ChevronRight,
  Cpu, Wifi, Battery, Activity, Radio,
  Users, Map
} from 'lucide-react';
import { dashboardService } from '../services/dashboardService';
import { DashboardData } from '../types/dashboard';

// ─── Sub-components ──────────────────────────────────────────────────────────

const KpiCard: React.FC<{
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
}> = ({ label, value, sub, icon }) => (
  <div className="card">
    <div className="flex items-start justify-between mb-3">
      <div className="p-2 rounded-lg bg-[#1c1f26] text-[#94a3b8]">
        {icon}
      </div>
      <span className="text-[10px] font-medium uppercase tracking-widest text-[#94a3b8]">
        {label}
      </span>
    </div>
    <div className="text-2xl font-bold font-data tracking-tight text-white">
      {value}
    </div>
    {sub && <div className="text-[11px] text-[#94a3b8]/50 mt-1">{sub}</div>}
  </div>
);

const SessionRow: React.FC<{
  session: typeof MOCK_SESSIONS[0];
  isFirst?: boolean;
}> = ({ session, isFirst }) => {
  const improved = session.improvement <= 0;
  const date = new Date(session.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

  return (
    <div className="flex items-center gap-2 sm:gap-3 py-4 px-1 border-b border-[#262626] transition-all hover:bg-white/[0.02] last:border-0">
      <div className="text-[10px] sm:text-[11px] text-[#94a3b8] font-data w-10 sm:w-12 shrink-0">{date}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs sm:text-sm text-white font-medium truncate flex items-center gap-1.5">
          {session.circuit.replace('SpeedKart ', '')}
          {isFirst && <span className="text-[8px] font-bold uppercase tracking-widest text-[#7bf8ac] border border-[#7bf8ac]/25 px-1 py-0.5 rounded shrink-0 hidden xs:inline">New</span>}
        </div>
        <div className="text-[10px] text-[#94a3b8] hidden sm:block">{session.kart}</div>
      </div>
      <div className="text-xs sm:text-sm font-data font-bold text-white shrink-0">{fmtLap(session.bestLap)}</div>
      <div className={`flex items-center gap-0.5 text-[10px] sm:text-[11px] font-data font-bold shrink-0 ${improved ? 'text-[#7bf8ac]' : 'text-red-400'}`}>
        {improved ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
        <span className="hidden xs:inline">{fmtDelta(session.improvement)}</span>
        <span className="xs:hidden">{session.improvement.toFixed(2)}s</span>
      </div>
    </div>
  );
};

// ─── Role-based dashboard helpers ────────────────────────────────────────────

const getStatusColor = (status: string) => {
  switch (status) {
    case 'online': return 'bg-emerald-500';
    case 'offline': return 'bg-red-500';
    case 'charging': return 'bg-blue-500';
    case 'maintenance': return 'bg-yellow-500';
    default: return 'bg-gray-500';
  }
};

const getBatteryColor = (level: number) => {
  if (level > 60) return 'bg-emerald-500';
  if (level > 30) return 'bg-yellow-500';
  return 'bg-red-500';
};

const AdminDashboard: React.FC<{ data: DashboardData }> = ({ data }) => (
  <div className="space-y-6">
    {data.system_status && (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { icon: <Users size={16} />, label: 'Utilisateurs', value: data.system_status.total_users },
          { icon: <Activity size={16} />, label: 'Sessions Actives', value: data.system_status.active_sessions },
          { icon: <Map size={16} />, label: 'Karts en Ligne', value: `${data.system_status.online_karts}/${data.system_status.total_karts}` },
          { icon: <Zap size={16} />, label: 'Système', value: data.system_status.system_health.toUpperCase(), accent: data.system_status.system_health === 'good' },
        ].map(({ icon, label, value, accent }) => (
          <div key={label} className="card">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-[#1c1f26] text-[#94a3b8]">{icon}</div>
              <span className="text-[10px] font-medium uppercase tracking-widest text-[#94a3b8]">{label}</span>
            </div>
            <div className={`text-2xl font-bold font-data ${accent ? 'text-[#7bf8ac]' : 'text-white'}`}>{value}</div>
          </div>
        ))}
      </div>
    )}
    {data.karts_status && (
      <div className="card">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-4">Statut des Karts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {data.karts_status.map((kart) => (
            <div key={kart.id} className="p-4 rounded-lg bg-[#0d0f12] border border-[#262626]">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-sm font-medium text-white">{kart.name}</div>
                  <div className="text-xs text-[#94a3b8]">{kart.driver || 'Non assigné'}</div>
                </div>
                <div className={`w-2 h-2 rounded-full ${getStatusColor(kart.status)}`} />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-[#262626] rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${getBatteryColor(kart.battery_level)}`} style={{ width: `${kart.battery_level}%` }} />
                </div>
                <span className="text-xs text-white font-data">{kart.battery_level}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

const DriverDashboard: React.FC<{ data: DashboardData }> = ({ data }) => (
  <div className="space-y-6">
    {data.user_stats && (
      <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard label="Total Tours"    value={data.user_stats.total_laps.toLocaleString()} icon={<Layers size={16} />} />
          <KpiCard label="Meilleur Tour"  value={`${data.user_stats.best_lap_time}s`}         icon={<Timer size={16} />} />
          <KpiCard label="Vitesse Max"    value={`${data.user_stats.top_speed} km/h`}          icon={<Gauge size={16} />} />
          <KpiCard label="Constance"      value={`${data.user_stats.consistency}%`}            icon={<Zap size={16} />} />
        </div>
        <div className="card">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-4">Dernière Session</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              {[
                { label: 'Tour Moyen', value: `${data.user_stats.avg_lap_time}s` },
                { label: 'Vitesse Max', value: `${data.user_stats.top_speed} km/h` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center pb-2 border-b border-[#262626]">
                  <span className="text-xs text-[#94a3b8]">{label}</span>
                  <span className="font-data text-sm text-white">{value}</span>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-[#262626]">
                <span className="text-xs text-[#94a3b8]">Constance</span>
                <span className="font-data text-sm text-[#7bf8ac]">{data.user_stats.consistency}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#94a3b8]">Dernière Session</span>
                <span className="font-data text-sm text-white">
                  {data.user_stats.last_session_date ? new Date(data.user_stats.last_session_date).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </>
    )}
  </div>
);

const MechanicDashboard: React.FC<{ data: DashboardData }> = ({ data }) => (
  <div className="space-y-6">
    {data.karts_status && (
      <div className="card">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-4">État des Karts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.karts_status.map((kart) => (
            <div key={kart.id} className="p-4 rounded-lg bg-[#0d0f12] border border-[#262626]">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-sm font-medium text-white">{kart.name}</div>
                  <div className="text-xs text-[#94a3b8]">{kart.driver || 'Non assigné'}</div>
                </div>
                <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded border ${
                  kart.status === 'online'      ? 'border-emerald-500/30 text-emerald-400' :
                  kart.status === 'charging'    ? 'border-blue-500/30 text-blue-400' :
                  kart.status === 'maintenance' ? 'border-yellow-500/30 text-yellow-400' :
                  'border-red-500/30 text-red-400'
                }`}>{kart.status}</span>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-[#94a3b8]">Batterie</span>
                  <span className="text-xs font-data text-white">{kart.battery_level}%</span>
                </div>
                <div className="w-full bg-[#262626] rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${getBatteryColor(kart.battery_level)}`} style={{ width: `${kart.battery_level}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

const CommissaireDashboard: React.FC<{ data: DashboardData }> = ({ data }) => (
  <div className="space-y-6">
    {data.karts_status && (
      <div className="card">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-4">Contrôle des Karts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.karts_status.map((kart) => (
            <div key={kart.id} className="p-4 rounded-lg bg-[#0d0f12] border border-[#262626]">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-sm font-medium text-white">{kart.name}</div>
                  <div className="text-xs text-[#94a3b8]">{kart.driver || 'Non assigné'}</div>
                </div>
                <div className={`w-2 h-2 rounded-full ${getStatusColor(kart.status)}`} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-[#94a3b8]">N° Kart</span>
                  <span className="text-xs font-data text-white">{kart.id}</span>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-[#94a3b8]">Batterie</span>
                    <span className="text-xs font-data text-white">{kart.battery_level}%</span>
                  </div>
                  <div className="w-full bg-[#262626] rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${getBatteryColor(kart.battery_level)}`} style={{ width: `${kart.battery_level}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
    {data.circuit_info && (
      <div className="card">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-1">État du Circuit</h3>
            <div className="text-lg font-bold text-white">{data.circuit_info.name}</div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${data.circuit_info.status === 'active' ? 'bg-[#7bf8ac]' : 'bg-red-500'}`} />
            <span className="text-[10px] font-medium text-[#7bf8ac] uppercase tracking-wider">{data.circuit_info.status}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Température', value: `${data.circuit_info.temperature}°C` },
            { label: 'Humidité', value: `${data.circuit_info.humidity}%` },
            { label: 'Adhérence', value: data.circuit_info.grip_level, accent: true },
            { label: 'Karts Actifs', value: `${data.circuit_info.active_karts}` },
          ].map(({ label, value, accent }) => (
            <div key={label} className="p-3 rounded-lg bg-[#0d0f12] border border-[#262626] text-center">
              <div className={`text-2xl font-bold font-data ${accent ? 'text-[#7bf8ac]' : 'text-white'}`}>{value}</div>
              <div className="text-xs text-[#94a3b8] mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────

const Home: React.FC = () => {
  const [userName, setUserName] = useState(MOCK_DRIVER.name.split(' ')[0]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  useEffect(() => {
    const updateUserName = () => {
      const user = localStorage.getItem('mokart_user');
      if (user) {
        try {
          const userData = JSON.parse(user);
          const email = userData.email || '';
          const firstName = email.split('@')[0];
          setUserName(firstName.charAt(0).toUpperCase() + firstName.slice(1));
        } catch (e) {
          setUserName('Driver');
        }
      }
    };

    const loadDashboardData = async () => {
      try {
        setDashboardLoading(true);
        const data = await dashboardService.getDashboardData();
        setDashboardData(data);
      } catch {
        setDashboardData(null);
      } finally {
        setDashboardLoading(false);
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mokart_user') {
        updateUserName();
        loadDashboardData();
      }
    };

    const handleUserRoleChange = () => {
      updateUserName();
      loadDashboardData();
    };

    updateUserName();
    loadDashboardData();

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userRoleChanged', handleUserRoleChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userRoleChanged', handleUserRoleChange);
    };
  }, []);

  const gapToRecord = (MOCK_DRIVER.bestLap - MOCK_DRIVER.trackRecord).toFixed(3);

  const renderRoleDashboard = () => {
    if (dashboardLoading || !dashboardData) return null;
    switch (dashboardData.user_role) {
      case 'admin':           return <AdminDashboard data={dashboardData} />;
      case 'mechanic':        return <MechanicDashboard data={dashboardData} />;
      case 'commissaire_piste': return <CommissaireDashboard data={dashboardData} />;
      case 'driver':          return <DriverDashboard data={dashboardData} />;
      default:                return null;
    }
  };

  const roleDashboard = renderRoleDashboard();

  return (
    <div className="flex min-h-screen bg-base text-white font-display overflow-hidden relative">
      <div className="absolute inset-0 bg-grid-minimal opacity-40 pointer-events-none" />
      <Sidebar />

      <main className="flex-1 md:ml-16 ml-0 flex flex-col h-screen relative z-10">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-20 px-4 sm:px-6 flex-shrink-0 h-14 sm:h-16 flex items-center justify-between border-b border-[#262626] bg-[#0d0f12]/95 backdrop-blur-xl">
          <div>
            <h1 className="text-sm sm:text-base font-semibold tracking-tight">Dashboard</h1>
            <p className="text-[10px] sm:text-[11px] text-[#94a3b8]">
              Bienvenue, <span className="text-[#a3a3a3]">{userName}</span>
              {dashboardData && (
                <span className="ml-2 px-1.5 py-0.5 bg-white/[0.04] text-[9px] font-bold uppercase tracking-widest border border-[#262626] rounded text-[#94a3b8]">
                  {dashboardData.user_role}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button className="hidden sm:flex p-2 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/5 transition-all">
              <Search size={16} />
            </button>
            <button className="p-2 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/5 transition-all relative">
              <Bell size={15} className="sm:hidden" />
              <Bell size={16} className="hidden sm:block" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-white/30 rounded-full" />
            </button>
            <div className="w-px h-4 bg-white/10 mx-0.5 sm:mx-1" />
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full border border-white/5 bg-white/[0.02] hover:border-white/10 cursor-pointer transition-all">
              <div className="w-6 h-6 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-[10px] font-bold text-[#a3a3a3]">
                {MOCK_DRIVER.initials}
              </div>
              <span className="text-xs font-medium text-[#a3a3a3] hidden md:block">{userName}</span>
            </div>
          </div>
        </header>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0 p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 animate-fade-in">

          {/* Role-based dashboard (when API data available) */}
          {roleDashboard ? (
            roleDashboard
          ) : (
            <>
              {/* Mock notice */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-[#262626] text-[11px] text-[#94a3b8]/60">
                <span className="w-1.5 h-1.5 rounded-full bg-[#94a3b8]/40 animate-pulse-dot shrink-0" />
                Données synthétiques — mode mock
              </div>

              {/* ── KPI Row ─────────────────────────────────────────────────── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <KpiCard label="Meilleur tour" value={fmtLap(MOCK_DRIVER.bestLap)}               sub="Session 28 fév."          icon={<Timer size={16} />} />
                <KpiCard label="Tours totaux"  value={MOCK_DRIVER.totalLaps.toLocaleString()}    sub="Toutes sessions"          icon={<Layers size={16} />} />
                <KpiCard label="Consistance"   value={`${MOCK_DRIVER.consistencyScore}%`}        sub="Moy. ce mois"             icon={<Gauge size={16} />} />
                <KpiCard label="Écart record"  value={`+${gapToRecord}s`}                        sub="vs 46.891 track record"   icon={<Zap size={16} />} />
              </div>

              {/* ── Circuit Status ───────────────────────────────────────────── */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-0.5">Circuit Status</h3>
                    <div className="text-sm font-semibold text-white">SpeedKart Hyères</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7bf8ac]" />
                    <span className="text-[10px] font-medium text-[#7bf8ac] uppercase tracking-wider">Live Tracking</span>
                  </div>
                </div>
                <div className="rounded-lg border border-[#262626] bg-[#0d0f12] flex items-center justify-center overflow-hidden mb-4" style={{ height: 110 }}>
                  <svg className="w-full h-full p-4" viewBox="0 0 800 300">
                    <path d="M100,150 Q200,60 400,180 T700,220" fill="none" stroke="#262626" strokeWidth="1" />
                    <path d="M100,150 Q200,60 400,180 T700,220" fill="none" stroke="#7bf8ac" strokeWidth="1.5"
                      style={{ filter: 'drop-shadow(0 0 3px rgba(123,248,172,0.5))' }} />
                  </svg>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Temp. piste', value: '24°C' },
                    { label: 'Humidité',    value: '42%' },
                    { label: 'Adhérence',   value: 'Haute', accent: true },
                  ].map(({ label, value, accent }) => (
                    <div key={label} className="p-3 rounded-lg bg-[#0d0f12] border border-[#262626]">
                      <div className="text-[10px] text-[#94a3b8] mb-1">{label}</div>
                      <div className={`text-sm font-medium ${accent ? 'text-[#7bf8ac]' : 'text-white'}`}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Sessions + Device ───────────────────────────────────────── */}
              <div className="grid lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="lg:col-span-2 card">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-sm font-semibold">Sessions récentes</h2>
                      <p className="text-[11px] text-[#94a3b8] mt-0.5">{MOCK_SESSIONS.length} sessions · {MOCK_DRIVER.totalLaps} tours</p>
                    </div>
                    <NavLink to="/sessions" className="flex items-center gap-1 text-[11px] text-[#a3a3a3] hover:text-white transition-colors font-medium">
                      Voir tout <ChevronRight size={12} />
                    </NavLink>
                  </div>
                  <div className="space-y-0">
                    {MOCK_SESSIONS.slice(0, 4).map((s, i) => (
                      <div key={s.id} className="stagger-item" style={{ animationDelay: `${i * 70}ms` }}>
                        <SessionRow session={s} isFirst={i === 0} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div className="card">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-4">Mokart Unit</h3>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-[#1c1f26] border border-[#262626] flex items-center justify-center text-[#94a3b8]">
                        <Cpu size={18} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">Unit #042</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#7bf8ac]" />
                          <span className="text-[10px] text-[#7bf8ac] font-medium uppercase tracking-wider">Online</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: 'Batterie', icon: <Battery size={10} />, pct: 85 },
                        { label: 'Signal',   icon: <Wifi size={10} />,    pct: 92 },
                        { label: 'CPU',      icon: <Cpu size={10} />,     pct: 34 },
                      ].map(({ label, icon, pct }) => (
                        <div key={label}>
                          <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-[#94a3b8] flex items-center gap-1">{icon} {label}</span>
                            <span className="text-white font-data">{pct}%</span>
                          </div>
                          <div className="bar-track">
                            <div className="bar-fill bar-fill-brand" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-3">Accès rapide</h3>
                    <div className="space-y-2">
                      {[
                        { to: '/analysis', icon: <Activity size={14} />, label: 'Analyse dernière session' },
                        { to: '/live',     icon: <Radio size={14} />,    label: 'Mode Live' },
                      ].map(({ to, icon, label }) => (
                        <NavLink key={to} to={to} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.02] border border-[#262626] hover:border-[#7bf8ac]/20 hover:bg-[#7bf8ac]/[0.03] transition-all group">
                          <div className="flex items-center gap-2">
                            <span className="text-[#94a3b8] group-hover:text-[#7bf8ac] transition-colors">{icon}</span>
                            <span className="text-xs text-[#a3a3a3] group-hover:text-white transition-colors">{label}</span>
                          </div>
                          <ChevronRight size={12} className="text-[#94a3b8] group-hover:text-[#7bf8ac] transition-colors" />
                        </NavLink>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;
