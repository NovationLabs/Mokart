// MOCK DATA — toutes les valeurs sont synthétiques (voir src/data/mock.ts)
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { MOCK_SESSIONS, MOCK_LAPS, MOCK_SPEED_TRACE, MOCK_DRIVER, fmtLap } from '../data/mock';
import { ChevronDown, Target, Search, Bell } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts';

const BEST_LAP_IDX = 9; // lap 10 (index 9)

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#16181d] border border-[#262626] rounded-lg px-3 py-2 text-xs font-data shadow-xl">
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-[#a3a3a3]">{p.name}:</span>
          <span className="text-white font-bold">{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

const AnalysisPage: React.FC = () => {
  const [selectedSession, setSelectedSession] = useState(MOCK_SESSIONS[0].id);
  const [activeTab, setActiveTab] = useState<'laps' | 'speed' | 'sectors'>('laps');
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

  const session = MOCK_SESSIONS.find(s => s.id === selectedSession) || MOCK_SESSIONS[0];
  const bestLap = MOCK_LAPS[BEST_LAP_IDX];
  const bestS1  = Math.min(...MOCK_LAPS.map(l => l.s1));
  const bestS2  = Math.min(...MOCK_LAPS.map(l => l.s2));
  const bestS3  = Math.min(...MOCK_LAPS.map(l => l.s3));

  const lapChartData = MOCK_LAPS.map(l => ({
    lap: `L${l.lap}`,
    time: l.time,
    isBest: l.lap === bestLap.lap,
  }));

  return (
    <div className="flex min-h-screen bg-base text-white font-display overflow-hidden relative">
      <div className="absolute inset-0 bg-grid-minimal opacity-40 pointer-events-none" />
      <Sidebar />

      <main className="flex-1 md:ml-16 ml-0 flex flex-col h-screen overflow-y-auto pb-20 md:pb-0 relative z-10">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-20 px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between border-b border-[#262626] bg-[#0d0f12]/95 backdrop-blur-xl">
          <div>
            <h1 className="text-sm sm:text-base font-semibold tracking-tight">Analyse</h1>
            <p className="text-[10px] sm:text-[11px] text-[#94a3b8]">
              {session.circuit.replace('SpeedKart ', '')}
              <span className="mx-1.5 text-white/20">·</span>
              {new Date(session.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
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

        <div className="flex-1 p-4 sm:p-6 space-y-4 animate-fade-in">

          {/* ── Session selector bar ──────────────────────────────────────── */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative">
              <select
                value={selectedSession}
                onChange={e => setSelectedSession(e.target.value)}
                className="appearance-none bg-white/[0.04] border border-[#262626] text-[#a3a3a3] text-xs pl-3 pr-7 py-2 rounded-lg focus:outline-none focus:border-[#7bf8ac]/40 focus:text-white transition-all cursor-pointer"
              >
                {MOCK_SESSIONS.map(s => (
                  <option key={s.id} value={s.id} style={{ background: '#16181d' }}>
                    {new Date(s.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} — {s.kart}
                  </option>
                ))}
              </select>
              <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
            </div>
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-[#262626]">
              <Target size={12} className="text-[#94a3b8]" />
              <span className="text-xs text-white font-data font-bold">{fmtLap(session.bestLap)}</span>
              <span className="text-[10px] text-[#94a3b8]">best lap</span>
            </div>
          </div>

          {/* ── Session KPIs ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Tours',       value: session.laps.toString() },
              { label: 'Meilleur',    value: fmtLap(session.bestLap), accent: true },
              { label: 'Moyen',       value: fmtLap(session.avgLap) },
              { label: 'Vit. max',    value: `${session.topSpeed} km/h` },
            ].map(({ label, value, accent }) => (
              <div key={label} className={`card text-center py-3 sm:py-4 ${accent ? 'card-brand' : ''}`}>
                <div className={`text-base sm:text-lg font-bold font-data ${accent ? 'text-[#7bf8ac] glow-brand-text' : 'text-white'}`}>{value}</div>
                <div className="text-[9px] sm:text-[10px] text-[#94a3b8] mt-1 uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </div>

          {/* ── Tabs ──────────────────────────────────────────────────────── */}
          <div className="flex gap-1 p-1 bg-white/[0.02] border border-white/5 rounded-xl w-full sm:w-fit overflow-x-auto">
            {(['laps', 'speed', 'sectors'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-white/10 text-white'
                    : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                {tab === 'laps' ? 'Tours' : tab === 'speed' ? 'Vitesse' : 'Secteurs'}
              </button>
            ))}
          </div>

          {/* ── TAB: Laps ─────────────────────────────────────────────────── */}
          {activeTab === 'laps' && (
            <div className="space-y-4">
              {/* Chart */}
              <div className="card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <h2 className="text-sm font-semibold">Progression des tours</h2>
                  <div className="flex items-center gap-3 text-[10px] text-[#94a3b8]">
                    <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#7bf8ac] inline-block rounded" /> Tour actuel</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-0.5 border-t border-dashed border-[#7bf8ac]/30 inline-block" /> Meilleur</span>
                  </div>
                </div>
                <div style={{ filter: 'drop-shadow(0 0 3px rgba(123,248,172,0.35))' }}>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={lapChartData} margin={{ top: 5, right: 5, left: -22, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="lap" tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} interval={2} />
                    <YAxis domain={['auto', 'auto']} tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `${v.toFixed(0)}s`} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={bestLap.time} stroke="rgba(123,248,172,0.2)" strokeDasharray="4 4" />
                    <Line
                      type="monotone" dataKey="time" name="Temps" stroke="#7bf8ac" strokeWidth={2}
                      dot={(p: any) => (
                        <circle key={p.index} cx={p.cx} cy={p.cy}
                          r={p.index === BEST_LAP_IDX ? 5 : 2.5}
                          fill={p.index === BEST_LAP_IDX ? '#7bf8ac' : '#16181d'}
                          stroke={p.index === BEST_LAP_IDX ? '#7bf8ac' : 'rgba(123,248,172,0.35)'}
                          strokeWidth={2} />
                      )}
                    />
                  </LineChart>
                </ResponsiveContainer>
                </div>
              </div>

              {/* Table */}
              <div className="card overflow-hidden">
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-left" style={{ minWidth: 340 }}>
                    <thead>
                      <tr className="border-b border-white/5">
                        {['Tour', 'Temps', 'Delta', 'S1', 'S2', 'S3'].map(h => (
                          <th key={h} className="pb-3 text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] pr-3 first:pl-1">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                      {MOCK_LAPS.map((l) => {
                        const isBest = l.lap === bestLap.lap;
                        const delta  = l.time - bestLap.time;
                        return (
                          <tr key={l.lap} className={`transition-colors ${isBest ? 'bg-[#7bf8ac]/[0.05]' : 'hover:bg-white/[0.02]'}`}>
                            <td className="py-2 pr-3 pl-1 text-xs font-data text-[#94a3b8]">
                              {isBest
                                ? <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#7bf8ac] shrink-0" /><span className="text-[#7bf8ac] font-bold">L{l.lap}</span></span>
                                : `L${l.lap}`}
                            </td>
                            <td className={`py-2 pr-3 text-xs font-data font-bold ${isBest ? 'text-[#7bf8ac]' : 'text-white'}`}>{fmtLap(l.time)}</td>
                            <td className="py-2 pr-3">
                              {isBest
                                ? <span className="text-[10px] font-bold uppercase tracking-wider text-[#7bf8ac] bg-[#7bf8ac]/10 px-1.5 py-0.5 rounded">BEST</span>
                                : <span className={`text-xs font-data font-bold ${delta < 2 ? 'text-emerald-400' : 'text-[#a3a3a3]'}`}>+{delta.toFixed(3)}s</span>}
                            </td>
                            <td className={`py-2 pr-3 text-xs font-data ${l.s1 === bestS1 ? 'text-emerald-400 font-bold' : 'text-[#a3a3a3]'}`}>{l.s1.toFixed(1)}</td>
                            <td className={`py-2 pr-3 text-xs font-data ${l.s2 === bestS2 ? 'text-emerald-400 font-bold' : 'text-[#a3a3a3]'}`}>{l.s2.toFixed(1)}</td>
                            <td className={`py-2      text-xs font-data ${l.s3 === bestS3 ? 'text-emerald-400 font-bold' : 'text-[#a3a3a3]'}`}>{l.s3.toFixed(1)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-[#94a3b8] mt-3 pt-3 border-t border-white/5">
                  <span className="text-emerald-400 font-bold">Vert</span> = meilleur secteur · meilleur tour
                </p>
              </div>
            </div>
          )}

          {/* ── TAB: Speed ────────────────────────────────────────────────── */}
          {activeTab === 'speed' && (
            <div className="card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-sm font-semibold">Trace de vitesse</h2>
                  <p className="text-[11px] text-[#94a3b8] mt-0.5">Tour 10 (best) vs référence session précédente</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-[#94a3b8] shrink-0">
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#7bf8ac] inline-block rounded" /> Tour 10</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-white/30 inline-block rounded" /> Référence</span>
                </div>
              </div>
              <div style={{ filter: 'drop-shadow(0 0 3px rgba(123,248,172,0.35))' }}>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={MOCK_SPEED_TRACE} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="dist" tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}m`} />
                  <YAxis domain={[20, 95]} tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} unit=" km/h" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="speed" name="Tour 10"    stroke="#7bf8ac"               strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="ref"   name="Référence"  stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── TAB: Sectors ──────────────────────────────────────────────── */}
          {activeTab === 'sectors' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(['s1', 's2', 's3'] as const).map((sk, si) => {
                const times  = MOCK_LAPS.map(l => l[sk]);
                const best   = Math.min(...times);
                const worst  = Math.max(...times);
                const avg    = times.reduce((a, b) => a + b, 0) / times.length;

                return (
                  <div key={sk} className="card">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-md bg-white/[0.05] border border-[#262626] flex items-center justify-center text-[10px] font-bold text-[#94a3b8]">
                        S{si + 1}
                      </div>
                      <span className="text-sm font-semibold">Secteur {si + 1}</span>
                    </div>

                    <div className="space-y-2.5 mb-4">
                      {[
                        { label: 'Meilleur',  value: best,         color: 'text-emerald-400' },
                        { label: 'Pire',      value: worst,        color: 'text-red-400' },
                        { label: 'Moyen',     value: avg,          color: 'text-[#a3a3a3]' },
                        { label: 'Best lap',  value: bestLap[sk],  color: 'text-[#7bf8ac]' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="flex justify-between items-center">
                          <span className="text-[11px] text-[#94a3b8]">{label}</span>
                          <span className={`text-sm font-bold font-data ${color}`}>{value.toFixed(3)}s</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1">
                      <div className="text-[10px] text-[#94a3b8] mb-2 uppercase tracking-wider">Distribution</div>
                      {times.map((t, i) => {
                        const pct       = ((worst - t) / (worst - best)) * 100;
                        const isBestLap = i === BEST_LAP_IDX;
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <div className="text-[9px] font-data text-[#94a3b8] w-4 shrink-0">L{i + 1}</div>
                            <div className="flex-1 bar-track" style={{ height: '6px' }}>
                              <div className={`bar-fill ${isBestLap ? 'bar-fill-brand' : 'bar-fill-neutral'}`} style={{ width: `${pct}%` }} />
                            </div>
                            <div className={`text-[9px] font-data w-9 text-right shrink-0 ${isBestLap ? 'text-[#7bf8ac] font-bold' : 'text-[#94a3b8]'}`}>
                              {t.toFixed(2)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AnalysisPage;
