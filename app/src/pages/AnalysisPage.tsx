import React, { useState, useEffect, useRef, WheelEvent } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Activity, Clock, RotateCw, ChevronDown, Target, TrendingUp, Eye, EyeOff, ZoomIn, ZoomOut, Move } from 'lucide-react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, ZAxis, Line, LineChart, ComposedChart } from 'recharts';
import { OptimalTrajectoryPoint, TrajectoryComparison } from '../types';

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
  const [optimalTrajectory, setOptimalTrajectory] = useState<OptimalTrajectoryPoint[]>([]);
  const [showOptimalTrajectory, setShowOptimalTrajectory] = useState<boolean>(true);
  const [trajectoryComparison, setTrajectoryComparison] = useState<TrajectoryComparison | null>(null);
  const [calculatingTrajectory, setCalculatingTrajectory] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [graphBounds, setGraphBounds] = useState<{ minX: number; maxX: number; minY: number; maxY: number }>({ minX: -20, maxX: 20, minY: -20, maxY: 20 });
  const chartRef = useRef<any>(null);

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
      // Calculate proper bounds based on all data points
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;

      // Check trajectory points
      for (const p of trajectory) {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      }

      // Check circuit boundary points
      for (const b of circuitBoundaries) {
        minX = Math.min(minX, b.x);
        maxX = Math.max(maxX, b.x);
        minY = Math.min(minY, b.y);
        maxY = Math.max(maxY, b.y);
      }

      // Add padding
      const paddingX = (maxX - minX) * 0.1;
      const paddingY = (maxY - minY) * 0.1;

      setGraphBounds({
        minX: minX - paddingX,
        maxX: maxX + paddingX,
        minY: minY - paddingY,
        maxY: maxY + paddingY
      });

      // Reset zoom and pan when new data loads
      setZoomLevel(1);
      setPanOffset({ x: 0, y: 0 });
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

  const fetchOptimalTrajectory = async (circuitId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/circuits/${circuitId}/optimal-trajectory`);
      if (response.ok) {
        const data = await response.json();
        setOptimalTrajectory(data);
      } else {
        setOptimalTrajectory([]);
      }
    } catch (error) {
      console.error('Error loading optimal trajectory:', error);
      setOptimalTrajectory([]);
    }
  };

  const calculateOptimalTrajectory = async () => {
    if (!selectedSession) return;

    const session = sessions.find(s => s.id === selectedSession);
    if (!session?.circuit_id) return;

    setCalculatingTrajectory(true);
    try {
      const response = await fetch(`${API_BASE_URL}/circuits/${session.circuit_id}/optimal-trajectory`, {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        setOptimalTrajectory(data);
        // Fetch comparison data
        fetchTrajectoryComparison(session.circuit_id, selectedSession);
      }
    } catch (error) {
      console.error('Error calculating optimal trajectory:', error);
    } finally {
      setCalculatingTrajectory(false);
    }
  };

  const fetchTrajectoryComparison = async (circuitId: string, sessionId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/circuits/${circuitId}/trajectory-comparison/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setTrajectoryComparison(data);
      }
    } catch (error) {
      console.error('Error loading trajectory comparison:', error);
    }
  };

  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1; // Inversé : deltaY > 0 = zoom avant
    setZoomLevel(prev => Math.max(0.1, Math.min(10, prev * zoomFactor)));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 0) { // Left mouse button
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY }); // Store initial mouse position
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      // Calculate the delta movement
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      // Update pan offset with the exact mouse movement (inverted X for natural feel)
      setPanOffset(prev => ({
        x: prev.x - deltaX, // Inverted X for natural pan direction
        y: prev.y + deltaY
      }));

      // Update drag start to current position for continuous tracking
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const zoomIn = () => {
    setZoomLevel(prev => Math.min(10, prev * 1.2));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(0.1, prev / 1.2));
  };

  // Calculate current bounds based on zoom and pan
  const getCurrentBounds = () => {
    const centerX = (graphBounds.minX + graphBounds.maxX) / 2;
    const centerY = (graphBounds.minY + graphBounds.maxY) / 2;
    const rangeX = (graphBounds.maxX - graphBounds.minX) / (2 * zoomLevel);
    const rangeY = (graphBounds.maxY - graphBounds.minY) / (2 * zoomLevel);

    // Apply pan offset with more responsive scaling
    const panScaleX = rangeX * 0.003; // Increased scale factor for more responsive pan
    const panScaleY = rangeY * 0.003;

    return {
      minX: centerX - rangeX + panOffset.x * panScaleX,
      maxX: centerX + rangeX + panOffset.x * panScaleX,
      minY: centerY - rangeY + panOffset.y * panScaleY,
      maxY: centerY + rangeY + panOffset.y * panScaleY
    };
  };

  // Load optimal trajectory when session changes
  useEffect(() => {
    if (selectedSession) {
      const session = sessions.find(s => s.id === selectedSession);
      if (session?.circuit_id) {
        fetchOptimalTrajectory(session.circuit_id);
        fetchTrajectoryComparison(session.circuit_id, selectedSession);
      }
    }
  }, [selectedSession, sessions]);

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden relative">
      <Sidebar />

      <main className="flex-1 md:ml-16 ml-0 relative z-10 h-screen flex flex-col overflow-hidden">
        <Header />

        <div className="flex-1 md:p-6 p-4 pb-20 md:pb-0 overflow-hidden flex flex-col">
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

              <button
                onClick={calculateOptimalTrajectory}
                disabled={calculatingTrajectory || !selectedSession}
                className="p-1.5 bg-[#171717] border border-[#262626] text-[#737373] hover:text-white rounded hover:bg-[#262626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Calculate Optimal Trajectory"
              >
                <Target size={14} />
              </button>

              <button
                onClick={() => setShowOptimalTrajectory(!showOptimalTrajectory)}
                className="p-1.5 bg-[#171717] border border-[#262626] text-[#737373] hover:text-white rounded hover:bg-[#262626] transition-colors"
                title={showOptimalTrajectory ? "Hide Optimal Trajectory" : "Show Optimal Trajectory"}
              >
                {showOptimalTrajectory ? <EyeOff size={14} /> : <Eye size={14} />}
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

            {/* Trajectory Comparison Stats */}
            {trajectoryComparison && (
              <div className="bg-[#171717] p-4 rounded-lg border border-[#262626]">
                <h3 className="text-[#737373] text-[10px] uppercase tracking-wider font-medium mb-3 flex items-center gap-2">
                  <TrendingUp size={12} />
                  Trajectory Analysis
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#a3a3a3]">Mean Deviation</span>
                    <span className="font-mono text-white">{trajectoryComparison.deviation_stats.mean_deviation.toFixed(2)}m</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#a3a3a3]">Max Deviation</span>
                    <span className="font-mono text-white">{trajectoryComparison.deviation_stats.max_deviation.toFixed(2)}m</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#a3a3a3]">Std Deviation</span>
                    <span className="font-mono text-white">{trajectoryComparison.deviation_stats.std_deviation.toFixed(2)}m</span>
                  </div>
                </div>
              </div>
            )}
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
              {calculatingTrajectory && (
                <div className="px-2 py-1 bg-[#0a0a0a]/80 backdrop-blur text-[10px] text-[#10b981] border border-[#262626] rounded flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></span>
                  Calculating Trajectory
                </div>
              )}
            </div>

            {/* Zoom Controls */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
              <button
                onClick={zoomIn}
                className="p-1.5 bg-[#0a0a0a]/80 backdrop-blur border border-[#262626] text-[#737373] hover:text-white rounded transition-colors"
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={zoomOut}
                className="p-1.5 bg-[#0a0a0a]/80 backdrop-blur border border-[#262626] text-[#737373] hover:text-white rounded transition-colors"
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>
              <button
                onClick={resetView}
                className="p-1.5 bg-[#0a0a0a]/80 backdrop-blur border border-[#262626] text-[#737373] hover:text-white rounded transition-colors"
                title="Reset View"
              >
                <Move size={14} />
              </button>
              <div className="px-2 py-1 bg-[#0a0a0a]/80 backdrop-blur text-[10px] text-[#737373] border border-[#262626] rounded text-center">
                {(zoomLevel * 100).toFixed(0)}%
              </div>
            </div>

            <div
              className="flex-1 w-full h-full min-h-[400px] flex items-center justify-center bg-[#101010]"
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
              {trajectory.length > 0 ? (
                <div className="w-full h-full p-2 flex items-center justify-center">
                  <div
                    className="bg-[#101010]"
                    style={{
                      width: 'min(100%, calc(100vh - 200px))',
                      height: 'min(100%, calc(100vh - 200px))',
                      maxWidth: '100%',
                      maxHeight: '100%'
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                      <XAxis
                        type="number"
                        dataKey="x"
                        name="X"
                        hide
                        domain={[getCurrentBounds().minX, getCurrentBounds().maxX]}
                        allowDataOverflow={true}
                      />
                      <YAxis
                        type="number"
                        dataKey="y"
                        name="Y"
                        hide
                        domain={[getCurrentBounds().minY, getCurrentBounds().maxY]}
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

                      {/* Optimal Trajectory */}
                      {showOptimalTrajectory && optimalTrajectory.length > 0 && (
                        <Scatter
                          name="Optimal Trajectory"
                          data={[...optimalTrajectory.map((point: OptimalTrajectoryPoint) => ({ x: point.x, y: point.y, timestamp: 0 })),
                                ...optimalTrajectory.slice(0, 1).map((point: OptimalTrajectoryPoint) => ({ x: point.x, y: point.y, timestamp: 0 }))]}
                          fill="none"
                          line={{ stroke: '#10b981', strokeWidth: 2, strokeDasharray: '5 5' }}
                          lineType="joint"
                          shape={<circle r={0} />}
                        />
                      )}
                    </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-[#737373] text-sm">
                  {loading ? 'Loading visualization...' : 'No trajectory data available'}
                </div>
              )}
            </div>
          </div>

        </div>
        </div>
      </main>
    </div>
  );
};

export default AnalysisPage;
