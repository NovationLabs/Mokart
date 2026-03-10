import React, { useState, useEffect, useRef, WheelEvent } from 'react';
import Header from '../components/Header';
import { Play, Pause, Square, Flag, AlertTriangle, RotateCw, ZoomIn, ZoomOut, Move, Users, Gauge, Timer } from 'lucide-react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Line, LineChart, ComposedChart } from 'recharts';

interface CircuitBoundary {
  id: string;
  side: string;
  point_order: number;
  x: number;
  y: number;
}

interface TrajectoryPoint {
  x: number;
  y: number;
  point_order: number;
}

interface Player {
  id: string;
  name: string;
  color: string;
  position: number;
  speed: number;
  status: 'running' | 'stopped' | 'slowed' | 'blue_flag';
  currentTrajectoryIndex: number;
}

interface CircuitSection {
  id: string;
  name: string;
  color: string;
  startIndex: number;
  endIndex: number;
  isSlowed: boolean;
}

interface SimulationData {
  circuit: {
    id: string;
    name: string;
    description: string;
  };
  boundaries: CircuitBoundary[];
  optimal_trajectory: TrajectoryPoint[];
}

const API_BASE_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:8081`;

const SimulationPage: React.FC = () => {
  const [simulationData, setSimulationData] = useState<SimulationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: 'Joueur 1', color: '#7bf8ac', position: 0, speed: 0.1, status: 'running', currentTrajectoryIndex: 0 },
    { id: '2', name: 'Joueur 2', color: '#f59e0b', position: 0, speed: 0.08, status: 'running', currentTrajectoryIndex: 0 },
    { id: '3', name: 'Joueur 3', color: '#ef4444', position: 0, speed: 0.12, status: 'running', currentTrajectoryIndex: 0 },
    { id: '4', name: 'Joueur 4', color: '#3b82f6', position: 0, speed: 0.09, status: 'running', currentTrajectoryIndex: 0 }
  ]);

  const [circuitSections, setCircuitSections] = useState<CircuitSection[]>([]);

  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [graphBounds, setGraphBounds] = useState<{ minX: number; maxX: number; minY: number; maxY: number }>({ minX: -20, maxX: 20, minY: -20, maxY: 20 });

  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const chartRef = useRef<any>(null);

  // Refs to always have the latest values inside the animation loop (avoids stale closures)
  const circuitSectionsRef = useRef<CircuitSection[]>([]);
  const playersRef = useRef<Player[]>([]);
  const simulationDataRef = useRef<SimulationData | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    circuitSectionsRef.current = circuitSections;
  }, [circuitSections]);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  useEffect(() => {
    simulationDataRef.current = simulationData;
  }, [simulationData]);

  // Initialize circuit sections when data loads
  useEffect(() => {
    if (simulationData && simulationData.optimal_trajectory.length > 0) {
      const trajectoryLength = simulationData.optimal_trajectory.length;
      const sectionSize = Math.floor(trajectoryLength / 4);

      const sections: CircuitSection[] = [
        {
          id: 'section1',
          name: 'Section 1',
          color: 'rgba(239, 68, 68, 0.3)',
          startIndex: 0,
          endIndex: sectionSize,
          isSlowed: false
        },
        {
          id: 'section2',
          name: 'Section 2',
          color: 'rgba(245, 158, 11, 0.3)',
          startIndex: sectionSize,
          endIndex: sectionSize * 2,
          isSlowed: false
        },
        {
          id: 'section3',
          name: 'Section 3',
          color: 'rgba(59, 130, 246, 0.3)',
          startIndex: sectionSize * 2,
          endIndex: sectionSize * 3,
          isSlowed: false
        },
        {
          id: 'section4',
          name: 'Section 4',
          color: 'rgba(168, 85, 247, 0.3)',
          startIndex: sectionSize * 3,
          endIndex: trajectoryLength - 1,
          isSlowed: false
        }
      ];

      setCircuitSections(sections);
    }
  }, [simulationData]);

  // Load simulation data on mount
  useEffect(() => {
    fetchSimulationData();
  }, []);

  // Calculate bounds when data loads
  useEffect(() => {
    if (simulationData && (simulationData.boundaries.length > 0 || simulationData.optimal_trajectory.length > 0)) {
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;

      for (const b of simulationData.boundaries) {
        minX = Math.min(minX, b.x);
        maxX = Math.max(maxX, b.x);
        minY = Math.min(minY, b.y);
        maxY = Math.max(maxY, b.y);
      }

      for (const t of simulationData.optimal_trajectory) {
        minX = Math.min(minX, t.x);
        maxX = Math.max(maxX, t.x);
        minY = Math.min(minY, t.y);
        maxY = Math.max(maxY, t.y);
      }

      const paddingX = (maxX - minX) * 0.1;
      const paddingY = (maxY - minY) * 0.1;

      setGraphBounds({
        minX: minX - paddingX,
        maxX: maxX + paddingX,
        minY: minY - paddingY,
        maxY: maxY + paddingY
      });

      setZoomLevel(1);
      setPanOffset({ x: 0, y: 0 });
    }
  }, [simulationData]);

  // Animation loop — uses refs so it always reads the latest sections/players without restart
  useEffect(() => {
    if (isRunning) {
      const animate = (currentTime: number) => {
        if (lastTimeRef.current === 0) {
          lastTimeRef.current = currentTime;
        }

        const deltaTime = currentTime - lastTimeRef.current;
        lastTimeRef.current = currentTime;

        const currentSections = circuitSectionsRef.current;
        const currentSimData = simulationDataRef.current;

        if (!currentSimData) {
          animationRef.current = requestAnimationFrame(animate);
          return;
        }

        setPlayers(prevPlayers =>
          prevPlayers.map(player => {
            // Stopped players don't move at all
            if (player.status === 'stopped') {
              return player;
            }

            const currentIndex = Math.floor(player.currentTrajectoryIndex);

            // Check if the player is currently inside a slowed section
            const inSlowedSection = currentSections.some(
              section =>
                section.isSlowed &&
                currentIndex >= section.startIndex &&
                currentIndex <= section.endIndex
            );

            let speedMultiplier = player.speed;

            if (inSlowedSection) {
              speedMultiplier *= 0.1; // Full stop in slowed section
            }

            // Apply per-player status multipliers
            if (player.status === 'slowed') speedMultiplier *= 0.1;
            if (player.status === 'blue_flag') speedMultiplier *= 0.2;

            let newIndex = player.currentTrajectoryIndex + (speedMultiplier * deltaTime * 0.05);

            if (newIndex >= currentSimData.optimal_trajectory.length) {
              newIndex = 0;
            }

            return {
              ...player,
              currentTrajectoryIndex: newIndex
            };
          })
        );

        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        lastTimeRef.current = 0;
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning]); // Only re-run when isRunning changes — sections/data read via refs

  const fetchSimulationData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/circuits/week-circuit/simulation-data`);
      if (response.ok) {
        const data = await response.json();
        setSimulationData(data);
      } else {
        console.error('Error loading simulation data');
      }
    } catch (error) {
      console.error('Error loading simulation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setZoomLevel(prev => Math.max(0.1, Math.min(10, prev * zoomFactor)));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      setPanOffset(prev => ({
        x: prev.x - deltaX,
        y: prev.y + deltaY
      }));

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

  const toggleSimulation = () => {
    setIsRunning(!isRunning);
  };

  const stopSimulation = () => {
    setIsRunning(false);
    setPlayers(prevPlayers =>
      prevPlayers.map(player => ({
        ...player,
        currentTrajectoryIndex: 0
      }))
    );
  };

  const handlePlayerAction = (playerId: string, action: 'stop' | 'slow' | 'blue_flag' | 'clear') => {
    setPlayers(prevPlayers =>
      prevPlayers.map(player => {
        if (player.id === playerId) {
          let newStatus: 'running' | 'stopped' | 'slowed' | 'blue_flag';
          switch (action) {
            case 'stop': newStatus = 'stopped'; break;
            case 'slow': newStatus = 'slowed'; break;
            case 'blue_flag': newStatus = 'blue_flag'; break;
            case 'clear': newStatus = 'running'; break;
            default: newStatus = 'running';
          }
          return { ...player, status: newStatus };
        }
        return player;
      })
    );
  };

  const toggleSectionSlow = (sectionId: string) => {
    setCircuitSections(prevSections =>
      prevSections.map(section =>
        section.id === sectionId
          ? { ...section, isSlowed: !section.isSlowed }
          : section
      )
    );
  };

  const getPlayerPosition = (player: Player) => {
    if (!simulationData || simulationData.optimal_trajectory.length === 0) {
      return { x: 0, y: 0 };
    }

    const index = Math.floor(player.currentTrajectoryIndex);
    const nextIndex = (index + 1) % simulationData.optimal_trajectory.length;
    const fraction = player.currentTrajectoryIndex - index;

    const currentPoint = simulationData.optimal_trajectory[index];
    const nextPoint = simulationData.optimal_trajectory[nextIndex];

    return {
      x: currentPoint.x + (nextPoint.x - currentPoint.x) * fraction,
      y: currentPoint.y + (nextPoint.y - currentPoint.y) * fraction
    };
  };

  const getCurrentBounds = () => {
    const centerX = (graphBounds.minX + graphBounds.maxX) / 2;
    const centerY = (graphBounds.minY + graphBounds.maxY) / 2;
    const rangeX = (graphBounds.maxX - graphBounds.minX) / (2 * zoomLevel);
    const rangeY = (graphBounds.maxY - graphBounds.minY) / (2 * zoomLevel);

    const panScaleX = rangeX * 0.003;
    const panScaleY = rangeY * 0.003;

    return {
      minX: centerX - rangeX + panOffset.x * panScaleX,
      maxX: centerX + rangeX + panOffset.x * panScaleX,
      minY: centerY - rangeY + panOffset.y * panScaleY,
      maxY: centerY + rangeY + panOffset.y * panScaleY
    };
  };

  const prepareChartData = () => {
    if (!simulationData) return { leftBoundary: [], rightBoundary: [], trajectory: [], players: [], sections: [] };

    const leftBoundary = simulationData.boundaries.filter(b => b.side === 'left');
    const rightBoundary = simulationData.boundaries.filter(b => b.side === 'right');

    const sectionsData = circuitSections.map(section => {
      const sectionTrajectory = simulationData.optimal_trajectory.slice(section.startIndex, section.endIndex + 1);
      return { ...section, data: sectionTrajectory };
    });

    const playerPositions = players.map(player => {
      const pos = getPlayerPosition(player);
      return {
        x: pos.x,
        y: pos.y,
        color: player.color,
        name: player.name,
        status: player.status
      };
    });

    return {
      leftBoundary,
      rightBoundary,
      trajectory: simulationData.optimal_trajectory,
      players: playerPositions,
      sections: sectionsData
    };
  };

  const chartData = prepareChartData();
  const bounds = getCurrentBounds();

  return (
    <main className="flex-1 md:ml-11 ml-0 relative z-10 h-screen flex flex-col overflow-hidden">
      <Header />

        <div className="flex-1 md:p-6 p-4 pb-20 md:pb-0 overflow-hidden flex flex-col">
          {/* Top Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 shrink-0 border-b border-[#262626] pb-4 gap-4 md:gap-0">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
                <Users size={20} className="text-[#7bf8ac]" />
                Simulation en Direct
              </h1>
              <p className="text-[#94a3b8] text-xs mt-1 font-mono flex items-center gap-2">
                CIRCUIT: <span className="text-white">{simulationData?.circuit?.name || 'Chargement...'}</span>
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={toggleSimulation}
                className={`p-2 border transition-colors rounded ${
                  isRunning
                    ? 'bg-[#ef4444] border-[#ef4444] text-white hover:bg-[#dc2626]'
                    : 'bg-[#7bf8ac] border-[#7bf8ac] text-[#0d0f12] hover:bg-[#6ee7b7]'
                }`}
                title={isRunning ? "Pause" : "Démarrer"}
              >
                {isRunning ? <Pause size={16} /> : <Play size={16} />}
              </button>

              <button
                onClick={stopSimulation}
                className="p-2 bg-[#16181d] border border-[#262626] text-[#94a3b8] hover:text-white rounded hover:bg-[#262626] transition-colors"
                title="Arrêter"
              >
                <Square size={16} />
              </button>

              <button
                onClick={fetchSimulationData}
                className="p-2 bg-[#16181d] border border-[#262626] text-[#94a3b8] hover:text-white rounded hover:bg-[#262626] transition-colors"
                title="Actualiser"
              >
                <RotateCw size={16} />
              </button>

              <button
                onClick={zoomIn}
                className="p-2 bg-[#16181d] border border-[#262626] text-[#94a3b8] hover:text-white rounded hover:bg-[#262626] transition-colors"
                title="Zoom avant"
              >
                <ZoomIn size={16} />
              </button>

              <button
                onClick={zoomOut}
                className="p-2 bg-[#16181d] border border-[#262626] text-[#94a3b8] hover:text-white rounded hover:bg-[#262626] transition-colors"
                title="Zoom arrière"
              >
                <ZoomOut size={16} />
              </button>

              <button
                onClick={resetView}
                className="p-2 bg-[#16181d] border border-[#262626] text-[#94a3b8] hover:text-white rounded hover:bg-[#262626] transition-colors"
                title="Réinitialiser la vue"
              >
                <Move size={16} />
              </button>
            </div>
          </div>

          {/* Content Grid */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">

            {/* Controls Column */}
            <div className="lg:col-span-1 flex flex-col gap-3 overflow-y-auto pr-1">
              {/* Player Controls */}
              <div className="card">
                <h3 className="text-[#94a3b8] text-[10px] uppercase tracking-wider font-medium mb-3 flex items-center gap-2">
                  <Users size={12} />
                  Contrôle des Joueurs
                </h3>
                <div className="space-y-3">
                  {players.map((player) => (
                    <div key={player.id} className="border border-[#262626] rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: player.color }}
                          />
                          <span className="text-sm font-medium text-white">{player.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${
                            player.status === 'running' ? 'bg-[#7bf8ac]' :
                            player.status === 'stopped' ? 'bg-[#ef4444]' :
                            player.status === 'slowed' ? 'bg-[#f59e0b]' :
                            player.status === 'blue_flag' ? 'bg-[#3b82f6]' :
                            'bg-[#94a3b8]'
                          }`} />
                          <span className="text-xs text-[#94a3b8]">
                            {player.status === 'running' ? 'Actif' :
                             player.status === 'stopped' ? 'Arrêté' :
                             player.status === 'slowed' ? 'Ralenti' :
                             player.status === 'blue_flag' ? 'Drapeau bleu' :
                             player.status}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1">
                        <button
                          onClick={() => handlePlayerAction(player.id, 'stop')}
                          className="p-1.5 bg-[#16181d] border border-[#262626] text-[#94a3b8] hover:text-white hover:bg-[#262626] transition-colors rounded text-xs flex items-center justify-center gap-1"
                        >
                          <Square size={10} /> Arrêt
                        </button>
                        <button
                          onClick={() => handlePlayerAction(player.id, 'slow')}
                          className="p-1.5 bg-[#16181d] border border-[#262626] text-[#94a3b8] hover:text-white hover:bg-[#262626] transition-colors rounded text-xs flex items-center justify-center gap-1"
                        >
                          <AlertTriangle size={10} /> Ralenti
                        </button>
                        <button
                          onClick={() => handlePlayerAction(player.id, 'blue_flag')}
                          className="p-1.5 bg-[#16181d] border border-[#262626] text-[#94a3b8] hover:text-white hover:bg-[#262626] transition-colors rounded text-xs flex items-center justify-center gap-1 col-span-2"
                        >
                          <Flag size={10} className="text-blue-400" /> Drapeau Bleu
                        </button>
                        {player.status !== 'running' && (
                          <button
                            onClick={() => handlePlayerAction(player.id, 'clear')}
                            className="p-1.5 bg-[#7bf8ac]/20 border border-[#7bf8ac]/30 text-[#7bf8ac] hover:bg-[#7bf8ac]/30 transition-colors rounded text-xs col-span-2"
                          >
                            Effacer
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Circuit Info */}
              {simulationData ? (
                <div className="w-full h-full p-2 flex items-center justify-center">
                  <div
                    className="bg-[#101010]"
                    style={{
                      width: 'min(100%, calc(100vh - 200px))',
                      height: 'min(100%, calc(100vh - 200px))',
                      maxWidth: '100%',
                      maxHeight: '100%'
                    }}
                    ref={chartRef}
                  >
                    <h3 className="text-[#94a3b8] text-[10px] uppercase tracking-wider font-medium mb-3">Informations Circuit</h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-[#a3a3a3]">Nom</span>
                        <span className="text-white font-medium">{simulationData?.circuit?.name || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#a3a3a3]">Points Trajectoire</span>
                        <span className="text-white font-mono">{simulationData?.optimal_trajectory?.length || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#a3a3a3]">Points Bordure</span>
                        <span className="text-white font-mono">{simulationData?.boundaries?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card">
                  <h3 className="text-[#94a3b8] text-[10px] uppercase tracking-wider font-medium mb-3">Informations Circuit</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[#a3a3a3]">Statut</span>
                      <span className="text-white font-medium">Chargement...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Section Controls */}
              <div className="card">
                <h3 className="text-[#94a3b8] text-[10px] uppercase tracking-wider font-medium mb-3 flex items-center gap-2">
                  <AlertTriangle size={12} />
                  Contrôle Sections
                </h3>
                <div className="space-y-2">
                  {circuitSections.map((section: any) => (
                    <div key={section.id} className="border border-[#262626] rounded-lg p-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: section.color.replace('0.3', '1') }}
                          />
                          <span className="text-sm font-medium text-white">{section.name}</span>
                        </div>
                        <button
                          onClick={() => toggleSectionSlow(section.id)}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                            section.isSlowed
                              ? 'bg-red-500 text-white hover:bg-red-600'
                              : 'bg-[#16181d] text-[#94a3b8] hover:text-white hover:bg-[#262626]'
                          }`}
                        >
                          {section.isSlowed ? 'Ralenti' : 'Normal'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Circuit Visualization */}
            <div className="lg:col-span-3 card relative overflow-hidden flex flex-col">
              <div className="absolute top-4 left-4 z-10 flex gap-2">
                <div className="px-3 py-1.5 bg-[#0d0f12]/80 backdrop-blur text-[10px] text-[#94a3b8] border border-[#262626] rounded">
                  Vue Circuit - Simulation en Direct
                </div>
                {loading && (
                  <div className="px-3 py-1.5 bg-[#0d0f12]/80 backdrop-blur text-[10px] text-[#7bf8ac] border border-[#262626] rounded flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7bf8ac] animate-pulse"></span>
                    Chargement
                  </div>
                )}
                {isRunning && (
                  <div className="px-3 py-1.5 bg-[#0d0f12]/80 backdrop-blur text-[10px] text-[#7bf8ac] border border-[#262626] rounded flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7bf8ac] animate-pulse"></span>
                    Simulation Active
                  </div>
                )}
              </div>

              <div
                className="flex-1 relative"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {simulationData && (
                  <div className="w-full h-full p-2 flex items-center justify-center">
                    <div
                      style={{
                        width: 'min(100%, calc(100vh - 200px))',
                        height: 'min(100%, calc(100vh - 200px))',
                        maxWidth: '100%',
                        maxHeight: '100%'
                      }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 50, right: 20, bottom: 20, left: 20 }}>
                      <XAxis
                        type="number"
                        dataKey="x"
                        domain={[bounds.minX, bounds.maxX]}
                        hide={true}
                      />
                      <YAxis
                        type="number"
                        dataKey="y"
                        domain={[bounds.minY, bounds.maxY]}
                        hide={true}
                      />

                      {/* Left Boundary */}
                      <Scatter
                        name="Bordure Gauche"
                        data={chartData.leftBoundary}
                        fill="transparent"
                        line={{ stroke: '#ef4444', strokeWidth: 2 }}
                        shape={false}
                      />

                      {/* Right Boundary */}
                      <Scatter
                        name="Bordure Droite"
                        data={chartData.rightBoundary}
                        fill="transparent"
                        line={{ stroke: '#3b82f6', strokeWidth: 2 }}
                        shape={false}
                      />

                      {/* Circuit Sections */}
                      {chartData.sections.map((section: any) => (
                        <Scatter
                          key={section.id}
                          name={section.name}
                          data={section.data}
                          fill={section.color}
                          line={{
                            stroke: section.isSlowed ? section.color.replace('0.3', '0.8') : section.color,
                            strokeWidth: section.isSlowed ? 4 : 2
                          }}
                          shape={false}
                        />
                      ))}

                      {/* Players */}
                      <Scatter
                        name="Joueurs"
                        data={chartData.players}
                        fill="#8884d8"
                        shape={(props: any) => {
                          const { cx, cy, payload } = props;
                          return (
                            <g>
                              <circle
                                cx={cx}
                                cy={cy}
                                r={6}
                                fill={payload.color}
                                stroke="#fff"
                                strokeWidth={1}
                              />
                            </g>
                          );
                        }}
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="absolute bottom-4 right-4 bg-[#0d0f12]/80 backdrop-blur border border-[#262626] rounded p-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#ef4444] rounded-full" />
                    <span className="text-[#94a3b8]">Bordure Gauche</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#3b82f6] rounded-full" />
                    <span className="text-[#94a3b8]">Bordure Droite</span>
                  </div>
                  {players.map((player) => (
                    <div key={player.id} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: player.color }} />
                      <span className="text-[#94a3b8]">{player.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
      </div>
    </main>
  );
};

export default SimulationPage;
