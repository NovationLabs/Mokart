// MOCK DATA — toutes les valeurs sont synthétiques (voir src/data/mock.ts)
// Onglet Trajectoire connecté à l'API réelle quand disponible.
import React, { useState, useEffect, useRef, WheelEvent } from 'react';
import Sidebar from '../components/Sidebar';
import { MOCK_SESSIONS, MOCK_LAPS, MOCK_SPEED_TRACE, MOCK_DRIVER, fmtLap } from '../data/mock';
import { ChevronDown, Target, Search, Bell, RotateCw, Eye, EyeOff, ZoomIn, ZoomOut, Move, TrendingUp, X, Navigation, Gauge, Timer } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid, ReferenceLine,
  ScatterChart, Scatter, ZAxis,
} from 'recharts';
import { OptimalTrajectoryPoint, TrajectoryComparison } from '../types';

// ─── API types ────────────────────────────────────────────────────────────────

interface TrajectoryPoint {
  x: number; y: number; timestamp: number;
  steering_angle?: number;
  uwb_z?: number;
  imu_ax?: number; imu_ay?: number; imu_az?: number;
  imu_gx?: number; imu_gy?: number; imu_gz?: number;
}
interface CircuitBoundary  { x: number; y: number; side: 'left' | 'right'; }
interface Session          { id: string; created_at?: string; kart?: string; circuit_id?: string; }
interface PointInfo {
  point: TrajectoryPoint;
  index: number;
  speed?: number;
  acceleration?: number;
  distance_from_start?: number;
  time_from_start?: number;
}

const StatItem = ({ label, value, unit, icon: Icon }: any) => (
  <div className="p-4 rounded-lg bg-[#0d0f12] border border-[#262626] flex items-center gap-3">
    <div className="text-[#94a3b8]"><Icon size={16} /></div>
    <div>
      <div className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-bold">{label}</div>
      <div className="text-sm font-medium text-white font-data">
        {value} <span className="text-[#94a3b8]/50 text-xs font-normal">{unit}</span>
      </div>
    </div>
  </div>
);

const API_BASE_URL = process.env.REACT_API_URL || `http://${window.location.hostname}:8081`;
const BEST_LAP_IDX = 9;

// ─── Custom tooltip ───────────────────────────────────────────────────────────

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

// ─── Main ─────────────────────────────────────────────────────────────────────

const AnalysisPage: React.FC = () => {
  // Mock-data state
  const [selectedSession, setSelectedSession] = useState(MOCK_SESSIONS[0].id);
  const [activeTab, setActiveTab] = useState<'laps' | 'speed' | 'sectors' | 'trajectory'>('laps');
  const [userName, setUserName] = useState(MOCK_DRIVER.name.split(' ')[0]);
  const [selectedPoint, setSelectedPoint] = useState<PointInfo | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setSelectedPoint(null);
      }
    };
    if (selectedPoint) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedPoint]);

  // Trajectory / API state
  const [apiSessions,         setApiSessions]         = useState<Session[]>([]);
  const [selectedApiSession,  setSelectedApiSession]  = useState<string>('');
  const [trajectory,          setTrajectory]          = useState<TrajectoryPoint[]>([]);
  const [circuitBoundaries,   setCircuitBoundaries]   = useState<CircuitBoundary[]>([]);
  const [optimalTrajectory,   setOptimalTrajectory]   = useState<OptimalTrajectoryPoint[]>([]);
  const [trajectoryComparison,setTrajectoryComparison]= useState<TrajectoryComparison | null>(null);
  const [showOptimal,         setShowOptimal]         = useState(true);
  const [loadingTraj,         setLoadingTraj]         = useState(false);
  const [calculatingTraj,     setCalculatingTraj]     = useState(false);
  const [graphBounds,         setGraphBounds]         = useState({ minX: -20, maxX: 20, minY: -20, maxY: 20 });
  const [zoomLevel,           setZoomLevel]           = useState(1);
  const [panOffset,           setPanOffset]           = useState({ x: 0, y: 0 });
  const [isDragging,          setIsDragging]          = useState(false);
  const [dragStart,           setDragStart]           = useState({ x: 0, y: 0 });

  // ── Auth userName ──────────────────────────────────────────────────────────
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

  // ── Graph bounds from trajectory data ─────────────────────────────────────
  useEffect(() => {
    if (trajectory.length === 0 && circuitBoundaries.length === 0) return;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of [...trajectory, ...circuitBoundaries]) {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    }
    const px = (maxX - minX) * 0.1;
    const py = (maxY - minY) * 0.1;
    setGraphBounds({ minX: minX - px, maxX: maxX + px, minY: minY - py, maxY: maxY + py });
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, [trajectory, circuitBoundaries]);

  // ── Load trajectory + optimal when API session changes ────────────────────
  useEffect(() => {
    if (!selectedApiSession) return;
    fetchTrajectory(selectedApiSession);
    fetchStats(selectedApiSession);
    fetchCircuitBoundaries(selectedApiSession);
    const s = apiSessions.find(s => s.id === selectedApiSession);
    if (s?.circuit_id) {
      fetchOptimalTrajectory(s.circuit_id);
      fetchTrajectoryComparison(s.circuit_id, selectedApiSession);
    }
  }, [selectedApiSession, apiSessions]);

  // ── Load API sessions when trajectory tab opens ────────────────────────────
  useEffect(() => {
    if (activeTab === 'trajectory') fetchApiSessions();
  }, [activeTab]);

  // ─── API helpers ───────────────────────────────────────────────────────────

  const fetchApiSessions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/sessions/`);
      const data = await res.json();
      setApiSessions(data);
      if (data.length > 0 && !selectedApiSession) setSelectedApiSession(data[0].id);
    } catch { /* silent fail */ }
  };

  const fetchTrajectory = async (id: string) => {
    setLoadingTraj(true);
    try {
      const res = await fetch(`${API_BASE_URL}/sessions/${id}/trajectory`);
      const data = await res.json();
      // Enrich with sensor data if available
      const sensorRes = await fetch(`${API_BASE_URL}/sessions/${id}/sensor-data`);
      if (sensorRes.ok) {
        const sensorData = await sensorRes.json();
        setTrajectory(data.map((pt: TrajectoryPoint) => {
          const sp = sensorData.find((s: any) => s.timestamp === pt.timestamp);
          return sp ? { ...pt, uwb_z: sp.uwb_z, imu_ax: sp.imu_ax, imu_ay: sp.imu_ay, imu_az: sp.imu_az, imu_gx: sp.imu_gx, imu_gy: sp.imu_gy, imu_gz: sp.imu_gz } : pt;
        }));
      } else {
        setTrajectory(data);
      }
    } catch { setTrajectory([]); } finally { setLoadingTraj(false); }
  };

  const fetchStats = async (id: string) => {
    try { await fetch(`${API_BASE_URL}/sessions/${id}/stats`); } catch { /* silent */ }
  };

  const fetchCircuitBoundaries = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/sessions/${id}/circuit-boundaries`);
      setCircuitBoundaries(await res.json());
    } catch { setCircuitBoundaries([]); }
  };

  const fetchOptimalTrajectory = async (circuitId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/circuits/${circuitId}/optimal-trajectory`);
      if (res.ok) setOptimalTrajectory(await res.json());
      else setOptimalTrajectory([]);
    } catch { setOptimalTrajectory([]); }
  };

  const fetchTrajectoryComparison = async (circuitId: string, sessionId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/circuits/${circuitId}/trajectory-comparison/${sessionId}`);
      if (res.ok) setTrajectoryComparison(await res.json());
    } catch { /* silent */ }
  };

  const calculateOptimalTrajectory = async () => {
    if (!selectedApiSession) return;
    const s = apiSessions.find(s => s.id === selectedApiSession);
    if (!s?.circuit_id) return;
    setCalculatingTraj(true);
    try {
      const res = await fetch(`${API_BASE_URL}/circuits/${s.circuit_id}/optimal-trajectory`, { method: 'POST' });
      if (res.ok) {
        setOptimalTrajectory(await res.json());
        fetchTrajectoryComparison(s.circuit_id, selectedApiSession);
      }
    } catch { /* silent */ } finally { setCalculatingTraj(false); }
  };

  // ─── Zoom / pan ────────────────────────────────────────────────────────────

  const getCurrentBounds = () => {
    const cx = (graphBounds.minX + graphBounds.maxX) / 2;
    const cy = (graphBounds.minY + graphBounds.maxY) / 2;
    const rx = (graphBounds.maxX - graphBounds.minX) / (2 * zoomLevel);
    const ry = (graphBounds.maxY - graphBounds.minY) / (2 * zoomLevel);
    const sx = rx * 0.003, sy = ry * 0.003;
    return {
      minX: cx - rx + panOffset.x * sx, maxX: cx + rx + panOffset.x * sx,
      minY: cy - ry + panOffset.y * sy, maxY: cy + ry + panOffset.y * sy,
    };
  };

  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    setZoomLevel(prev => Math.max(0.1, Math.min(10, prev * (e.deltaY > 0 ? 0.9 : 1.1))));
  };
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { setIsDragging(true); setDragStart({ x: e.clientX, y: e.clientY }); }
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset(prev => ({ x: prev.x - (e.clientX - dragStart.x), y: prev.y + (e.clientY - dragStart.y) }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };
  const handleMouseUp = () => setIsDragging(false);

  // ─── Mock derived data ─────────────────────────────────────────────────────

  const session     = MOCK_SESSIONS.find(s => s.id === selectedSession) || MOCK_SESSIONS[0];
  const bestLap     = MOCK_LAPS[BEST_LAP_IDX];
  const bestS1      = Math.min(...MOCK_LAPS.map(l => l.s1));
  const bestS2      = Math.min(...MOCK_LAPS.map(l => l.s2));
  const bestS3      = Math.min(...MOCK_LAPS.map(l => l.s3));
  const lapChartData = MOCK_LAPS.map(l => ({ lap: `L${l.lap}`, time: l.time, isBest: l.lap === bestLap.lap }));

  // ─── Point info helpers (from Admin_User_Dashboard) ───────────────────────

  const calculateSpeed = (p1: TrajectoryPoint, p2: TrajectoryPoint): number => {
    const d = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    const dt = p2.timestamp - p1.timestamp;
    return dt > 0 ? (d / dt) * 1000 : 0;
  };

  const calculateAcceleration = (p1: TrajectoryPoint, p2: TrajectoryPoint, p3: TrajectoryPoint): number => {
    const s1 = calculateSpeed(p1, p2);
    const s2 = calculateSpeed(p2, p3);
    const dt = p3.timestamp - p1.timestamp;
    return dt > 0 ? (s2 - s1) / (dt / 1000) : 0;
  };

  const calculateDistanceFromStart = (pts: TrajectoryPoint[]): number => {
    let d = 0;
    for (let i = 1; i < pts.length; i++)
      d += Math.sqrt(Math.pow(pts[i].x - pts[i-1].x, 2) + Math.pow(pts[i].y - pts[i-1].y, 2));
    return d;
  };

  const calculatePointInfo = (point: TrajectoryPoint, index: number): PointInfo => ({
    point,
    index,
    speed: index > 0 ? calculateSpeed(trajectory[index - 1], point) : 0,
    acceleration: index > 1 ? calculateAcceleration(trajectory[index - 2], trajectory[index - 1], point) : 0,
    distance_from_start: calculateDistanceFromStart(trajectory.slice(0, index + 1)),
    time_from_start: point.timestamp - (trajectory[0]?.timestamp || 0),
  });

  // ─── Render ────────────────────────────────────────────────────────────────

  // Point info popup (trajectory tab)
  const PointPopup = () => {
    if (!selectedPoint) return null;
    const p = selectedPoint;

    return (
      <div ref={popupRef} className="card p-4 text-xs space-y-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] flex items-center gap-1.5">
            <Navigation size={12} /> Point #{p.index}
          </span>
          <button onClick={() => setSelectedPoint(null)} className="text-[#94a3b8] hover:text-white transition-colors">
            <X size={13} />
          </button>
        </div>
        <div className="space-y-1 pb-2 border-b border-[#262626]">
          <div className="flex justify-between">
            <span className="text-[#94a3b8]">Position</span>
            <span className="font-mono text-white">X:{p.point.x.toFixed(2)} Y:{p.point.y.toFixed(2)}</span>
          </div>
          {p.point.uwb_z != null && (
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Altitude Z</span>
              <span className="font-mono text-white">{p.point.uwb_z.toFixed(3)} m</span>
            </div>
          )}
        </div>
        <div className="space-y-1 pb-2 border-b border-[#262626]">
          <div className="flex justify-between">
            <span className="text-[#94a3b8] flex items-center gap-1"><Timer size={11} /> Temps</span>
            <span className="font-mono text-white">{((p.time_from_start || 0) / 1000).toFixed(2)}s</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#94a3b8] flex items-center gap-1"><Gauge size={11} /> Vitesse</span>
            <span className="font-mono text-[#7bf8ac]">{(p.speed || 0).toFixed(2)} m/s</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#94a3b8]">Accélération</span>
            <span className="font-mono text-white">{(p.acceleration || 0).toFixed(2)} m/s²</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#94a3b8]">Distance</span>
            <span className="font-mono text-white">{(p.distance_from_start || 0).toFixed(2)} m</span>
          </div>
          {p.point.steering_angle != null && (
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Direction</span>
              <span className="font-mono text-white">{p.point.steering_angle.toFixed(1)}°</span>
            </div>
          )}
        </div>
        {(p.point.imu_ax != null || p.point.imu_ay != null || p.point.imu_az != null) && (
          <div className="pb-2 border-b border-[#262626]">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-2">IMU Accéléro</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {(['imu_ax', 'imu_ay', 'imu_az'] as const).map(k => p.point[k] != null && (
                <div key={k}>
                  <div className="font-mono text-white">{(p.point[k] as number).toFixed(3)}</div>
                  <div className="text-[#94a3b8]">{k.split('_')[1].toUpperCase()} (g)</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {(p.point.imu_gx != null || p.point.imu_gy != null || p.point.imu_gz != null) && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-2">IMU Gyro</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {(['imu_gx', 'imu_gy', 'imu_gz'] as const).map(k => p.point[k] != null && (
                <div key={k}>
                  <div className="font-mono text-white">{(p.point[k] as number).toFixed(1)}</div>
                  <div className="text-[#94a3b8]">{k.split('_')[1].toUpperCase()} (°/s)</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };


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
              { label: 'Tours',    value: session.laps.toString() },
              { label: 'Meilleur', value: fmtLap(session.bestLap), accent: true },
              { label: 'Moyen',    value: fmtLap(session.avgLap) },
              { label: 'Vit. max', value: `${session.topSpeed} km/h` },
            ].map(({ label, value, accent }) => (
              <div key={label} className={`card text-center py-3 sm:py-4 ${accent ? 'card-brand' : ''}`}>
                <div className={`text-base sm:text-lg font-bold font-data ${accent ? 'text-[#7bf8ac] glow-brand-text' : 'text-white'}`}>{value}</div>
                <div className="text-[9px] sm:text-[10px] text-[#94a3b8] mt-1 uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </div>

          {/* ── Tabs ──────────────────────────────────────────────────────── */}
          <div className="flex gap-1 p-1 bg-white/[0.02] border border-[#262626] rounded-xl w-full sm:w-fit overflow-x-auto">
            {(['laps', 'speed', 'sectors', 'trajectory'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === tab ? 'bg-white/10 text-white' : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                {tab === 'laps' ? 'Tours' : tab === 'speed' ? 'Vitesse' : tab === 'sectors' ? 'Secteurs' : 'Trajectoire'}
              </button>
            ))}
          </div>

          {/* ── TAB: Laps ─────────────────────────────────────────────────── */}
          {activeTab === 'laps' && (
            <div className="space-y-4">
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
                    <Line type="monotone" dataKey="speed" name="Tour 10"   stroke="#7bf8ac"               strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="ref"   name="Référence" stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── TAB: Sectors ──────────────────────────────────────────────── */}
          {activeTab === 'sectors' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(['s1', 's2', 's3'] as const).map((sk, si) => {
                const times = MOCK_LAPS.map(l => l[sk]);
                const best  = Math.min(...times);
                const worst = Math.max(...times);
                const avg   = times.reduce((a, b) => a + b, 0) / times.length;
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
                        { label: 'Meilleur', value: best,        color: 'text-emerald-400' },
                        { label: 'Pire',     value: worst,       color: 'text-red-400' },
                        { label: 'Moyen',    value: avg,         color: 'text-[#a3a3a3]' },
                        { label: 'Best lap', value: bestLap[sk], color: 'text-[#7bf8ac]' },
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

          {/* ── TAB: Trajectoire (API réelle) ─────────────────────────────── */}
          {activeTab === 'trajectory' && (
            <div className="space-y-4">
              {/* Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <select
                    value={selectedApiSession}
                    onChange={e => setSelectedApiSession(e.target.value)}
                    className="appearance-none bg-white/[0.04] border border-[#262626] text-[#a3a3a3] text-xs pl-3 pr-7 py-2 rounded-lg focus:outline-none focus:border-[#7bf8ac]/40 focus:text-white transition-all cursor-pointer min-w-[180px]"
                  >
                    <option value="" disabled>Sélectionner une session</option>
                    {apiSessions.map(s => (
                      <option key={s.id} value={s.id} style={{ background: '#16181d' }}>
                        {new Date(s.created_at || '').toLocaleDateString('fr-FR')} — {s.kart || 'Kart'}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
                </div>
                <button onClick={() => selectedApiSession && fetchTrajectory(selectedApiSession)}
                  className="p-2 rounded-lg bg-white/[0.04] border border-[#262626] text-[#94a3b8] hover:text-white transition-all" title="Rafraîchir">
                  <RotateCw size={14} />
                </button>
                <button onClick={calculateOptimalTrajectory} disabled={calculatingTraj || !selectedApiSession}
                  className="p-2 rounded-lg bg-white/[0.04] border border-[#262626] text-[#94a3b8] hover:text-white transition-all disabled:opacity-40" title="Calculer trajectoire optimale">
                  <Target size={14} />
                </button>
                <button onClick={() => setShowOptimal(!showOptimal)}
                  className="p-2 rounded-lg bg-white/[0.04] border border-[#262626] text-[#94a3b8] hover:text-white transition-all" title={showOptimal ? 'Masquer optimale' : 'Afficher optimale'}>
                  {showOptimal ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                {/* Status indicators */}
                {loadingTraj && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-[#262626] text-[10px] text-[#94a3b8]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7bf8ac] animate-pulse" />
                    Chargement
                  </div>
                )}
                {calculatingTraj && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-[#262626] text-[10px] text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Calcul en cours
                  </div>
                )}
              </div>

              {/* Chart */}
              <div className="card relative overflow-hidden" style={{ minHeight: 420 }}>
                {/* Zoom controls */}
                <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5">
                  {[
                    { icon: <ZoomIn size={13} />, action: () => setZoomLevel(p => Math.min(10, p * 1.2)), title: 'Zoom +' },
                    { icon: <ZoomOut size={13} />, action: () => setZoomLevel(p => Math.max(0.1, p / 1.2)), title: 'Zoom -' },
                    { icon: <Move size={13} />, action: () => { setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); }, title: 'Reset' },
                  ].map(({ icon, action, title }) => (
                    <button key={title} onClick={action} title={title}
                      className="p-1.5 rounded-lg bg-[#0d0f12] border border-[#262626] text-[#94a3b8] hover:text-white transition-colors">
                      {icon}
                    </button>
                  ))}
                  <div className="px-2 py-1 rounded-lg bg-[#0d0f12] border border-[#262626] text-[9px] text-[#94a3b8] text-center font-data">
                    {(zoomLevel * 100).toFixed(0)}%
                  </div>
                </div>

                {trajectory.length > 0 ? (
                  <div
                    className="w-full" style={{ height: 400, cursor: isDragging ? 'grabbing' : 'grab' }}
                    onWheel={handleWheel} onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 10, right: 50, bottom: 10, left: 10 }}>
                        <XAxis type="number" dataKey="x" hide domain={[getCurrentBounds().minX, getCurrentBounds().maxX]} allowDataOverflow />
                        <YAxis type="number" dataKey="y" hide domain={[getCurrentBounds().minY, getCurrentBounds().maxY]} allowDataOverflow />
                        <ZAxis type="number" dataKey="timestamp" range={[0, 500]} />
                        <Tooltip contentStyle={{ backgroundColor: '#16181d', borderColor: '#262626', color: '#fff', fontSize: 11 }} />
                        {/* Circuit boundaries */}
                        {['left', 'right'].map(side => (
                          <Scatter key={side} name={`Limite ${side}`}
                            data={circuitBoundaries.filter(b => b.side === side).map(b => ({ x: b.x, y: b.y, timestamp: 0 }))}
                            fill="none" line={{ stroke: 'rgba(239,68,68,0.6)', strokeWidth: 1.5 }} lineType="joint"
                            shape={<circle r={0} />} />
                        ))}
                        {/* Actual trajectory — click for PointInfo */}
                        <Scatter name="Trajectoire" data={trajectory} fill="#7bf8ac"
                          line={{ stroke: '#7bf8ac', strokeWidth: 1.5 }} lineType="joint"
                          shape={<circle r={0} />}
                          style={{ filter: 'drop-shadow(0 0 3px rgba(123,248,172,0.5))' }}
                          onClick={(data: any, idx: number) => {
                            if (data?.payload) setSelectedPoint(calculatePointInfo(data.payload, idx));
                          }} />
                        {/* Optimal trajectory */}
                        {showOptimal && optimalTrajectory.length > 0 && (
                          <Scatter name="Optimale" data={optimalTrajectory.map(p => ({ x: p.x, y: p.y, timestamp: 0 }))}
                            fill="none" line={{ stroke: 'rgba(16,185,129,0.8)', strokeWidth: 2, strokeDasharray: '5 5' }}
                            lineType="joint" shape={<circle r={0} />} />
                        )}
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-[#262626] flex items-center justify-center">
                      <Target size={18} className="text-[#94a3b8]" />
                    </div>
                    <p className="text-sm text-[#94a3b8]">Sélectionne une session pour afficher la trajectoire</p>
                    <p className="text-[11px] text-[#94a3b8]/50">Données GPS temps réel via l'API</p>
                  </div>
                )}

                {/* Legend */}
                {trajectory.length > 0 && (
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#262626] text-[10px] text-[#94a3b8]">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#7bf8ac] inline-block rounded" /> Trajectoire</span>
                    {showOptimal && optimalTrajectory.length > 0 && (
                      <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 border-t-2 border-dashed border-emerald-500 inline-block" /> Optimale</span>
                    )}
                    {circuitBoundaries.length > 0 && (
                      <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-red-500/60 inline-block rounded" /> Limites</span>
                    )}
                  </div>
                )}
              </div>

              {/* Trajectory comparison stats */}
              {trajectoryComparison && (
                <div className="card">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-3 flex items-center gap-2">
                    <TrendingUp size={12} />
                    Analyse de trajectoire
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'Déviation moy.', value: `${trajectoryComparison.deviation_stats.mean_deviation.toFixed(2)}m` },
                      { label: 'Déviation max.', value: `${trajectoryComparison.deviation_stats.max_deviation.toFixed(2)}m` },
                      { label: 'Écart-type',     value: `${trajectoryComparison.deviation_stats.std_deviation.toFixed(2)}m` },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <div className="text-[10px] text-[#94a3b8] mb-1">{label}</div>
                        <div className="text-sm font-bold font-data text-white">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Point Popup */}
      <PointPopup />
    </div>
  );
};

export default AnalysisPage;
