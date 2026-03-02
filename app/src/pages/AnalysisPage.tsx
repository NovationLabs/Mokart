import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Activity, Clock, RotateCw, ChevronDown } from 'lucide-react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, ZAxis, Line, LineChart, ComposedChart } from 'recharts';

interface CircuitBoundary {
  id: string;
  circuit_id: string;
  side: string;
  point_order: number;
  x: number;
  y: number;
}

interface Session {
  id: string;
  user_id?: string;
  kart?: string;
  circuit_id?: string;
  created_at?: string;
}

interface TrajectoryPoint {
  x: number;
  y: number;
  timestamp: number;
  steering_angle?: number;
}

interface SessionStats {
  session_id: string;
  total_points: number;
  duration_ms: number;
  uwb_coverage: number;
  imu_coverage: number;
  steering_coverage: number;
  bounds: {
    min_x: number;
    max_x: number;
    min_y: number;
    max_y: number;
  };
}

const StatItem = ({ label, value, unit, icon: Icon }: any) => (
  <div className="bg-[#171717] p-4 rounded-lg border border-[#262626] flex items-center gap-3">
    <div className="text-[#737373]">
      <Icon size={18} />
    </div>
    <div>
      <div className="text-[10px] text-[#737373] uppercase tracking-wider font-medium">{label}</div>
      <div className="text-sm font-medium text-white">
        {value} <span className="text-[#525252] text-xs font-normal">{unit}</span>
      </div>
    </div>
  </div>
);

const API_BASE_URL = process.env.REACT_API_URL || `http://${window.location.hostname}:8081`;

const AnalysisPage: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [trajectory, setTrajectory] = useState<TrajectoryPoint[]>([]);
  const [circuitBoundaries, setCircuitBoundaries] = useState<CircuitBoundary[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [maxGraphBound, setMaxGraphBound] = useState<number>(20);

  // Load sessions on mount
  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCircuitBoundaries = async (sessionId: string) => {
    try {
      // Get circuit_id from session
      const session = sessions.find((s: Session) => s.id === sessionId);
      if (session?.circuit_id) {
        const response = await fetch(`${API_BASE_URL}/circuits/${session.circuit_id}/boundaries`);
        const data = await response.json();
        setCircuitBoundaries(data);
      }
    } catch (error) {
      console.error('Error loading circuit boundaries:', error);
    }
  };

  // Load trajectory when session changes
  useEffect(() => {
    if (selectedSession) {
      fetchTrajectory(selectedSession);
      fetchStats(selectedSession);
      fetchCircuitBoundaries(selectedSession);
    }
  }, [selectedSession]);

  useEffect(() => {
    if (trajectory.length > 0 || circuitBoundaries.length > 0) {
      // Find the absolute maximum value across trajectory and circuit boundaries
      let maxVal = 0;

      // Check trajectory points
      for (const p of trajectory) {
        const absX = Math.abs(p.x);
        const absY = Math.abs(p.y);
        if (absX > maxVal) maxVal = absX;
        if (absY > maxVal) maxVal = absY;
      }

      // Check circuit boundary points
      for (const b of circuitBoundaries) {
        const absX = Math.abs(b.x);
        const absY = Math.abs(b.y);
        if (absX > maxVal) maxVal = absX;
        if (absY > maxVal) maxVal = absY;
      }

      // Add 10% padding
      setMaxGraphBound(maxVal * 1.1);
    }
  }, [trajectory, circuitBoundaries]);

  const fetchSessions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions/`);
      const data = await response.json();
      setSessions(data);
      if (data.length > 0 && !selectedSession) {
        setSelectedSession(data[0].id);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const fetchTrajectory = async (sessionId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/trajectory`);
      const data = await response.json();
      setTrajectory(data);
    } catch (error) {
      console.error('Error loading trajectory:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (sessionId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden">
      <Sidebar />

      <main className="flex-1 md:ml-16 ml-0 sm:p-6 p-4 h-screen flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 shrink-0 border-b border-[#262626] pb-4 gap-4 md:gap-0">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
              Telemetry Analysis
            </h1>
            <p className="text-[#737373] text-xs mt-1 font-mono flex items-center gap-2">
              SESSION: <span className="text-white">{selectedSession || 'NONE'}</span>
            </p>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <select
                value={selectedSession}
                onChange={(e: any) => setSelectedSession(e.target.value)}
                className="w-full md:w-auto appearance-none bg-[#171717] border border-[#262626] text-white pl-3 pr-8 py-1.5 rounded text-xs focus:outline-none focus:border-white transition-colors cursor-pointer min-w-[200px]"
              >
                <option value="" disabled>Select Session</option>
                {sessions.map((s: Session) => (
                  <option key={s.id} value={s.id}>
                    {new Date(s.created_at || '').toLocaleDateString()} - {s.kart || 'Kart'}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-2 text-[#737373] pointer-events-none" size={14} />
            </div>

            <button
              onClick={() => selectedSession && fetchTrajectory(selectedSession)}
              className="p-1.5 bg-[#171717] border border-[#262626] text-[#737373] hover:text-white rounded hover:bg-[#262626] transition-colors"
              title="Refresh Data"
            >
              <RotateCw size={14} />
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">

          {/* Stats Column */}
          <div className="lg:col-span-1 flex flex-col gap-3 overflow-y-auto pr-1">
            <StatItem
              label="Data Points"
              value={stats?.total_points?.toLocaleString() || '0'}
              unit="pts"
              icon={Activity}
            />
            <StatItem
              label="Duration"
              value={((stats?.duration_ms || 0) / 1000).toFixed(1)}
              unit="s"
              icon={Clock}
            />

            <div className="bg-[#171717] p-4 rounded-lg border border-[#262626] flex-1">
              <h3 className="text-[#737373] text-[10px] uppercase tracking-wider font-medium mb-3">Sensor Health</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#a3a3a3]">UWB Coverage</span>
                  <span className="font-mono text-white">{(stats?.uwb_coverage || 0).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-[#262626] h-1 rounded-full overflow-hidden">
                  <div className="bg-[#22D3EE] h-full" style={{ width: `${stats?.uwb_coverage || 0}%` }}></div>
                </div>

                <div className="flex justify-between items-center text-xs pt-2">
                  <span className="text-[#a3a3a3]">IMU Data</span>
                  <span className="font-mono text-white">{(stats?.imu_coverage || 0).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-[#262626] h-1 rounded-full overflow-hidden">
                  <div className="bg-[#22D3EE] h-full" style={{ width: `${stats?.imu_coverage || 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Map / Visualization Column */}
          <div className="lg:col-span-3 bg-[#171717] rounded-lg border border-[#262626] relative overflow-hidden flex flex-col">
            <div className="absolute top-4 left-4 z-10 flex gap-2">
              <div className="px-2 py-1 bg-[#0a0a0a]/80 backdrop-blur text-[10px] text-[#737373] border border-[#262626] rounded">
                Trajectory View
              </div>
              {loading && (
                <div className="px-2 py-1 bg-[#0a0a0a]/80 backdrop-blur text-[10px] text-[#22D3EE] border border-[#262626] rounded flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] animate-pulse"></span>
                  Loading
                </div>
              )}
            </div>

            <div className="flex-1 w-full h-full min-h-[400px] flex items-center justify-center bg-[#101010]">
              {trajectory.length > 0 ? (
                <div className="w-full h-full max-w-2xl aspect-square p-4">
                  <ResponsiveContainer width="100%" height="100%" aspect={1}>
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <XAxis
                        type="number"
                        dataKey="x"
                        name="X"
                        hide
                        domain={[-maxGraphBound, maxGraphBound]}
                        allowDataOverflow={true}
                      />
                      <YAxis
                        type="number"
                        dataKey="y"
                        name="Y"
                        hide
                        domain={[-maxGraphBound, maxGraphBound]}
                        allowDataOverflow={true}
                      />
                      <ZAxis type="number" dataKey="timestamp" range={[0, 500]} />
                      <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#262626', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                      />

                      {/* Circuit boundaries - left side */}
                      <Scatter
                        name="Circuit Left"
                        data={[...circuitBoundaries.filter((b: CircuitBoundary) => b.side === 'left').map((b: CircuitBoundary) => ({ x: b.x, y: b.y, timestamp: 0 })),
                              ...circuitBoundaries.filter((b: CircuitBoundary) => b.side === 'left').slice(0, 1).map((b: CircuitBoundary) => ({ x: b.x, y: b.y, timestamp: 0 }))]}
                        fill="none"
                        line={{ stroke: '#ef4444', strokeWidth: 2 }}
                        lineType="joint"
                        shape={<circle r={0} />}
                      />

                      {/* Circuit boundaries - right side */}
                      <Scatter
                        name="Circuit Right"
                        data={[...circuitBoundaries.filter((b: CircuitBoundary) => b.side === 'right').map((b: CircuitBoundary) => ({ x: b.x, y: b.y, timestamp: 0 })),
                              ...circuitBoundaries.filter((b: CircuitBoundary) => b.side === 'right').slice(0, 1).map((b: CircuitBoundary) => ({ x: b.x, y: b.y, timestamp: 0 }))]}
                        fill="none"
                        line={{ stroke: '#ef4444', strokeWidth: 2 }}
                        lineType="joint"
                        shape={<circle r={0} />}
                      />

                      {/* Trajectory */}
                      <Scatter
                        name="Trajectory"
                        data={trajectory}
                        fill="#22D3EE"
                        line={{ stroke: '#22D3EE', strokeWidth: 1.5 }}
                        lineType="joint"
                        shape={<circle r={0} />}
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-[#737373] text-sm">
                  {loading ? 'Loading visualization...' : 'No trajectory data available'}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default AnalysisPage;
