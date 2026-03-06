// MOCK DATA — toutes les valeurs sont synthétiques (voir src/data/mock.ts)
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { MOCK_DRIVER, MOCK_SESSIONS, fmtLap, fmtDelta } from '../data/mock';
import {
  Bell, Search, TrendingDown, TrendingUp,
  Timer, Gauge, Layers, Zap, ChevronRight,
  Cpu, Wifi, Battery, Activity, Radio
} from 'lucide-react';

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
    {sub && <div className="text-[11px] text-[#404040] mt-1">{sub}</div>}
  </div>
);

const SessionRow: React.FC<{
  session: typeof MOCK_SESSIONS[0];
  isFirst?: boolean;
}> = ({ session, isFirst }) => {
  const improved = session.improvement <= 0;
  const date = new Date(session.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

  return (
    <div className={`flex items-center gap-2 sm:gap-3 py-4 px-1 border-b border-[#262626] transition-all hover:bg-white/[0.02] last:border-0 ${isFirst ? 'border-b border-[#262626]' : ''}`}>
      {/* Date */}
      <div className="text-[10px] sm:text-[11px] text-[#94a3b8] font-data w-10 sm:w-12 shrink-0">{date}</div>
      {/* Circuit — on mobile juste le kart est masqué */}
      <div className="flex-1 min-w-0">
        <div className="text-xs sm:text-sm text-white font-medium truncate flex items-center gap-1.5">
          {session.circuit.replace('SpeedKart ', '')}
          {isFirst && <span className="text-[8px] font-bold uppercase tracking-widest text-[#7bf8ac] border border-[#7bf8ac]/25 px-1 py-0.5 rounded shrink-0 hidden xs:inline">New</span>}
        </div>
        <div className="text-[10px] text-[#94a3b8] hidden sm:block">{session.kart}</div>
      </div>
      {/* Best lap */}
      <div className="text-xs sm:text-sm font-data font-bold text-white shrink-0">{fmtLap(session.bestLap)}</div>
      {/* Delta */}
      <div className={`flex items-center gap-0.5 text-[10px] sm:text-[11px] font-data font-bold shrink-0 ${improved ? 'text-[#7bf8ac]' : 'text-red-400'}`}>
        {improved ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
        <span className="hidden xs:inline">{fmtDelta(session.improvement)}</span>
        <span className="xs:hidden">{session.improvement.toFixed(2)}s</span>
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const Home: React.FC = () => {
  const [userName, setUserName] = useState(MOCK_DRIVER.name.split(' ')[0]);

  useEffect(() => {
    const user = localStorage.getItem('mokart_user');
    if (user) {
      try {
        const data = JSON.parse(user);
        const n = (data.email || '').split('@')[0];
        setUserName(n.charAt(0).toUpperCase() + n.slice(1));
      } catch { /* use default */ }
    }
  }, []);

  const gapToRecord = (MOCK_DRIVER.bestLap - MOCK_DRIVER.trackRecord).toFixed(3);

  return (
    <div className="flex min-h-screen bg-base text-white font-display overflow-hidden relative">
      <div className="absolute inset-0 bg-grid-minimal opacity-40 pointer-events-none" />
      <Sidebar />

      <main className="flex-1 md:ml-16 ml-0 flex flex-col h-screen overflow-y-auto pb-20 md:pb-0 relative z-10">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-20 px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between border-b border-[#262626] bg-[#0d0f12]/95 backdrop-blur-xl">
          <div>
            <h1 className="text-sm sm:text-base font-semibold tracking-tight">Dashboard</h1>
            <p className="text-[10px] sm:text-[11px] text-[#94a3b8]">Bienvenue, <span className="text-[#a3a3a3]">{userName}</span></p>
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
        <div className="flex-1 p-5 md:p-6 space-y-5 animate-fade-in">

          {/* Mock notice */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-[#262626] text-[11px] text-[#94a3b8]/60">
            <span className="w-1.5 h-1.5 rounded-full bg-[#94a3b8]/40 animate-pulse-dot shrink-0" />
            Données synthétiques — mode mock
          </div>

          {/* ── KPI Row ───────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Meilleur tour"
              value={fmtLap(MOCK_DRIVER.bestLap)}
              sub="Session 28 fév."
              icon={<Timer size={16} />}
            />
            <KpiCard
              label="Tours totaux"
              value={MOCK_DRIVER.totalLaps.toLocaleString()}
              sub="Toutes sessions"
              icon={<Layers size={16} />}
            />
            <KpiCard
              label="Consistance"
              value={`${MOCK_DRIVER.consistencyScore}%`}
              sub="Moy. ce mois"
              icon={<Gauge size={16} />}
            />
            <KpiCard
              label="Écart record"
              value={`+${gapToRecord}s`}
              sub="vs 46.891 track record"
              icon={<Zap size={16} />}
            />
          </div>

          {/* ── Sessions + Device ─────────────────────────────────────────── */}
          <div className="grid lg:grid-cols-3 gap-4">

            {/* Sessions list */}
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
              <div className="space-y-1">
                {MOCK_SESSIONS.slice(0, 4).map((s, i) => (
                  <div key={s.id} className="stagger-item" style={{ animationDelay: `${i * 70}ms` }}>
                    <SessionRow session={s} isFirst={i === 0} />
                  </div>
                ))}
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">

              {/* Device status */}
              <div className="card">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-4">Mokart Unit</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#1c1f26] border border-[#262626] flex items-center justify-center text-[#94a3b8]">
                    <Cpu size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Unit #042</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="status-dot status-dot-green w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider glow-green-text">Online</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Batterie', icon: <Battery size={10} />, pct: 85, fill: 'bar-fill-brand' },
                    { label: 'Signal',   icon: <Wifi size={10} />,    pct: 92, fill: 'bar-fill-brand' },
                    { label: 'CPU',      icon: <Cpu size={10} />,     pct: 34, fill: 'bar-fill-brand' },
                  ].map(({ label, icon, pct, fill }) => (
                    <div key={label}>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-[#94a3b8] flex items-center gap-1">{icon} {label}</span>
                        <span className="text-white font-data">{pct}%</span>
                      </div>
                      <div className="bar-track">
                        <div className={`bar-fill ${fill}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick links */}
              <div className="card">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-3">Accès rapide</h3>
                <div className="space-y-2">
                  {[
                    { to: '/analysis', icon: <Activity size={14} />, label: 'Analyse dernière session' },
                    { to: '/live',     icon: <Radio size={14} />,    label: 'Mode Live' },
                  ].map(({ to, icon, label }) => (
                    <NavLink key={to} to={to} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-[#7bf8ac]/20 hover:bg-[#7bf8ac]/[0.03] transition-all group">
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
        </div>
      </main>
    </div>
  );
};

export default Home;
