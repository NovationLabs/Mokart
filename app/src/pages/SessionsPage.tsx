// MOCK DATA — toutes les valeurs sont synthétiques (voir src/data/mock.ts)
import React, { useState, useEffect } from 'react';
import { MOCK_SESSIONS, MOCK_DRIVER, fmtLap, fmtDelta } from '../data/mock';
import { TrendingDown, TrendingUp, MapPin, Gauge, ChevronRight, Filter, Search, Bell } from 'lucide-react';

// NOTE: 'FilterKey' renamed to avoid shadowing the Filter icon import
type FilterKey = 'all' | 'feb' | 'jan';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'feb', label: 'Fév.' },
  { key: 'jan', label: 'Jan.' },
];

const SessionsPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [selected, setSelected] = useState<string | null>(null);
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

  const filtered = MOCK_SESSIONS.filter(s => {
    if (activeFilter === 'feb') return s.date.startsWith('2026-02');
    if (activeFilter === 'jan') return s.date.startsWith('2026-01');
    return true;
  });

  const bestLapSession = MOCK_SESSIONS.reduce((a, b) => a.bestLap < b.bestLap ? a : b);

  return (
    <>
      <div className="absolute inset-0 bg-grid-minimal opacity-40 pointer-events-none" />

      <main className="flex-1 md:ml-11 ml-0 flex flex-col h-screen relative z-10">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-20 px-4 sm:px-6 flex-shrink-0 h-14 sm:h-16 flex items-center justify-between border-b border-[#262626] bg-[#0d0f12]/95 backdrop-blur-xl">
          <div>
            <h1 className="text-sm sm:text-base font-semibold tracking-tight">Sessions</h1>
            <p className="text-[10px] sm:text-[11px] text-[#94a3b8]">{MOCK_SESSIONS.length} sessions enregistrées</p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button className="hidden sm:flex p-2 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/5 transition-all">
              <Search size={16} />
            </button>
            <button className="p-2 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/5 transition-all">
              <Bell size={15} className="sm:hidden" />
              <Bell size={16} className="hidden sm:block" />
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

        <div className="flex-1 overflow-y-auto pb-20 md:pb-0 p-4 sm:p-6 space-y-4 animate-fade-in">

          {/* Mock notice */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-[#262626] text-[11px] text-[#94a3b8]/60">
            <span className="w-1.5 h-1.5 rounded-full bg-[#94a3b8]/40 animate-pulse-dot shrink-0" />
            Données synthétiques — mode mock
          </div>

          {/* ── Stats summary ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Sessions',   value: MOCK_SESSIONS.length.toString() },
              { label: 'Best lap',   value: fmtLap(bestLapSession.bestLap), accent: true },
              { label: 'Tours',      value: MOCK_SESSIONS.reduce((a, s) => a + s.laps, 0).toString() },
            ].map(({ label, value, accent }) => (
              <div key={label} className={`card text-center py-4 ${accent ? 'card-brand' : ''}`}>
                <div className={`text-base sm:text-xl font-bold font-data ${accent ? 'text-[#7bf8ac] glow-brand-text' : 'text-white'}`}>{value}</div>
                <div className="text-[9px] sm:text-[10px] text-[#94a3b8] mt-1 uppercase tracking-widest">{label}</div>
              </div>
            ))}
          </div>

          {/* ── Filter pills ──────────────────────────────────────────────── */}
          <div className="flex gap-2">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeFilter === key
                    ? 'bg-white/10 text-white border border-white/15'
                    : 'bg-white/[0.03] border border-[#262626] text-[#94a3b8] hover:text-white hover:bg-white/[0.07]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Sessions list ─────────────────────────────────────────────── */}
          <div className="space-y-3">
            {filtered.map((s, idx) => {
              const improved = s.improvement <= 0;
              const isBest   = s.id === bestLapSession.id;
              const isSelected = selected === s.id;

              return (
                <div key={s.id} className="stagger-item" style={{ animationDelay: `${idx * 60}ms` }}>
                  <button
                    onClick={() => setSelected(isSelected ? null : s.id)}
                    className={`w-full text-left card transition-all ${
                      isSelected ? 'border-[#7bf8ac]/25' : ''
                    } ${isBest ? 'border-white/[0.08]' : ''}`}
                  >
                    <div className="flex items-center gap-4 py-1">

                      {/* Date block */}
                      <div className="shrink-0 w-10 sm:w-12 text-center">
                        <div className="text-base sm:text-lg font-bold font-data text-white leading-none">
                          {new Date(s.date).getDate()}
                        </div>
                        <div className="text-[9px] sm:text-[10px] text-[#94a3b8] uppercase tracking-wider">
                          {new Date(s.date).toLocaleDateString('fr-FR', { month: 'short' })}
                        </div>
                      </div>

                      <div className="w-px h-8 bg-white/5 shrink-0" />

                      {/* Main info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-white truncate">{s.circuit}</span>
                          {isBest && (
                            <span className="text-[9px] font-bold uppercase tracking-widest text-[#7bf8ac] border border-[#7bf8ac]/20 bg-[#7bf8ac]/5 px-1.5 py-0.5 rounded shrink-0 hidden sm:inline">
                              Record
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] text-[#94a3b8]">
                          <span className="flex items-center gap-1 truncate"><MapPin size={9} className="shrink-0" />{s.kart}</span>
                          <span className="flex items-center gap-1 shrink-0"><Gauge size={9} />{s.laps}t</span>
                        </div>
                      </div>

                      {/* Best lap + delta */}
                      <div className="shrink-0 text-right">
                        <div className="text-sm font-bold font-data text-white">{fmtLap(s.bestLap)}</div>
                        <div className={`flex items-center justify-end gap-1 text-[11px] font-data font-bold mt-0.5 ${improved ? 'text-[#7bf8ac]' : 'text-red-400'}`}>
                          {improved ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
                          {fmtDelta(s.improvement)}
                        </div>
                      </div>

                      <ChevronRight size={14} className={`shrink-0 transition-transform text-[#94a3b8] ${isSelected ? 'rotate-90 text-[#7bf8ac]' : ''}`} />
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isSelected && (
                    <div className="mt-2 mx-1 px-4 sm:px-5 py-4 rounded-xl bg-[#0d0f12] border border-[#262626] grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in">
                      {[
                        { label: 'Meilleur tour', value: fmtLap(s.bestLap) },
                        { label: 'Tour moyen',    value: fmtLap(s.avgLap) },
                        { label: 'Vitesse max',   value: `${s.topSpeed} km/h` },
                        { label: 'Progression',   value: fmtDelta(s.improvement), colored: true, improved },
                      ].map(({ label, value, colored, improved: imp }) => (
                        <div key={label}>
                          <div className="text-[10px] text-[#94a3b8] uppercase tracking-wider mb-1">{label}</div>
                          <div className={`text-sm font-bold font-data ${colored ? (imp ? 'text-[#7bf8ac]' : 'text-red-400') : 'text-white'}`}>
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
};

export default SessionsPage;
