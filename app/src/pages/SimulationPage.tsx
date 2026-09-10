import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import { SkeletonSidePanel, SkeletonChart } from '../components/Skeleton';
import { Play, Pause, Square, Flag, AlertTriangle, RotateCw, Users, Download, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../services/api';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera, MapControls, Line } from '@react-three/drei';
import * as THREE from 'three';

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

interface Circuit {
  id: string;
  name: string;
  description: string;
  created_at: string;
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

const SimulationPage: React.FC = () => {
  const [simulationData, setSimulationData] = useState<SimulationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [predictionsLoaded, setPredictionsLoaded] = useState(false);
  const [circuits, setCircuits] = useState<Circuit[]>([]);
  const [selectedCircuitId, setSelectedCircuitId] = useState<string>('');
  const [loadingCircuits, setLoadingCircuits] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: 'Joueur 1', color: '#7bf8ac', position: 0, speed: 0.1, status: 'running', currentTrajectoryIndex: 0 },
    { id: '2', name: 'Joueur 2', color: '#f59e0b', position: 0, speed: 0.08, status: 'running', currentTrajectoryIndex: 0 },
    { id: '3', name: 'Joueur 3', color: '#ef4444', position: 0, speed: 0.12, status: 'running', currentTrajectoryIndex: 0 },
    { id: '4', name: 'Joueur 4', color: '#3b82f6', position: 0, speed: 0.09, status: 'running', currentTrajectoryIndex: 0 }
  ]);

  const [circuitSections, setCircuitSections] = useState<CircuitSection[]>([]);
  const [loadTrajectory, setLoadTrajectory] = useState<boolean>(true);
  const [userSessions, setUserSessions] = useState<any[]>([]);
  const [selectedTrajectoryType, setSelectedTrajectoryType] = useState<'optimal' | 'session'>('optimal');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [laps, setLaps] = useState<TrajectoryPoint[][]>([]);
  const [selectedLap, setSelectedLap] = useState<number>(-1); // -1 = tous les tours

  const [graphBounds, setGraphBounds] = useState<{ minX: number; maxX: number; minY: number; maxY: number }>({ minX: -20, maxX: 20, minY: -20, maxY: 20 });

  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

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

  // Load circuits list on mount
  useEffect(() => {
    const fetchCircuits = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/circuits`);
        if (response.ok) {
          const data = await response.json();
          setCircuits(data);
          if (data.length > 0) {
            setSelectedCircuitId(data[0].id);
          }
        } else {
          console.error('Error loading circuits');
        }
      } catch (error) {
        console.error('Error loading circuits:', error);
      } finally {
        setLoadingCircuits(false);
      }
    };
    fetchCircuits();
  }, []);

  // Reset data when circuit changes
  useEffect(() => {
    if (dataLoaded) {
      setDataLoaded(false);
      setSimulationData(null);
      setIsRunning(false);
      setPlayers(prevPlayers =>
        prevPlayers.map(player => ({
          ...player,
          currentTrajectoryIndex: 0
        }))
      );
    }
  }, [selectedCircuitId]);

  // Charger les sessions de l'utilisateur quand le circuit change
  useEffect(() => {
    if (selectedCircuitId) {
      loadUserSessions(selectedCircuitId);
    }
  }, [selectedCircuitId]);

  // Load simulation data only when requested
  const loadUserSessions = async (circuitId: string) => {
    try {
      const user = localStorage.getItem('mokart_user');
      if (!user) return;

      const parsed = JSON.parse(user);
      const userId = parsed.id;
      if (!userId) return;

      const response = await fetch(`${API_BASE_URL}/sessions/user/${userId}/circuit/${circuitId}`);
      if (response.ok) {
        const sessions = await response.json();
        setUserSessions(sessions);
      }
    } catch (error) {
      console.error('Error loading user sessions:', error);
    }
  };

  const loadSimulationData = async () => {
    if (!selectedCircuitId) return;

    setLoading(true);
    try {
      const boundariesRes = await fetch(`${API_BASE_URL}/circuits/${selectedCircuitId}/boundaries`);

      if (!boundariesRes.ok) {
        console.error('Error loading boundaries');
        return;
      }

      const boundaries = await boundariesRes.json();

      let trajectory: TrajectoryPoint[] = [];

      if (loadTrajectory) {
        if (selectedTrajectoryType === 'optimal') {
          let trajectoryRes = await fetch(`${API_BASE_URL}/circuits/${selectedCircuitId}/optimal-trajectory`);

          if (trajectoryRes.status === 404) {
            trajectoryRes = await fetch(`${API_BASE_URL}/circuits/${selectedCircuitId}/optimal-trajectory`, {
              method: 'POST'
            });
          }

          if (trajectoryRes.ok) {
            trajectory = await trajectoryRes.json();
          } else {
            console.error('Error loading trajectory');
          }
        } else if (selectedTrajectoryType === 'session' && selectedSessionId) {
          const trajectoryRes = await fetch(`${API_BASE_URL}/sessions/${selectedSessionId}/trajectory`);
          if (trajectoryRes.ok) {
            trajectory = await trajectoryRes.json();
          } else {
            console.error('Error loading session trajectory');
          }
        }
      }

      const circuit = circuits.find(c => c.id === selectedCircuitId);

      setSimulationData({
        circuit: {
          id: selectedCircuitId,
          name: circuit?.name || 'Unknown',
          description: circuit?.description || ''
        },
        boundaries,
        optimal_trajectory: trajectory
      });

      // Détecter les tours
      const detectedLaps = detectLaps(trajectory);
      setLaps(detectedLaps);
      setSelectedLap(-1); // Réinitialiser à "tous les tours"

      setDataLoaded(true);
    } catch (error) {
      console.error('Error loading simulation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPredictions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/circuits/week-circuit/predictions`);
      if (response.ok) {
        setPredictionsLoaded(true);
      } else {
        console.error('Error loading predictions');
      }
    } catch (error) {
      console.error('Error loading predictions:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const detectLaps = (trajectory: TrajectoryPoint[]): TrajectoryPoint[][] => {
    if (trajectory.length < 10) return [trajectory];

    // Trouver le point le plus rapide comme ligne de départ/arrivée
    const speeds = trajectory.map((p, i) => {
      if (i === 0) return 0;
      const dx = p.x - trajectory[i - 1].x;
      const dy = p.y - trajectory[i - 1].y;
      return Math.sqrt(dx * dx + dy * dy);
    });

    const maxSpeedIndex = speeds.indexOf(Math.max(...speeds));
    const finishLine = trajectory[maxSpeedIndex];

    // Détecter les tours en trouvant quand on croise la ligne de départ
    const lapThreshold = 5; // distance minimale pour considérer un tour
    const laps: TrajectoryPoint[][] = [];
    let currentLap: TrajectoryPoint[] = [];
    let lastCrossIndex = -1;
    let minDistanceToFinish = Infinity;

    for (let i = 0; i < trajectory.length; i++) {
      const point = trajectory[i];
      const distToFinish = Math.sqrt(
        Math.pow(point.x - finishLine.x, 2) +
        Math.pow(point.y - finishLine.y, 2)
      );

      minDistanceToFinish = Math.min(minDistanceToFinish, distToFinish);

      // Si on s'éloigne de la ligne de départ après s'en être approché
      if (minDistanceToFinish < lapThreshold && distToFinish > lapThreshold * 2) {
        if (currentLap.length > 10) {
          laps.push(currentLap);
          currentLap = [point];
          lastCrossIndex = i;
          minDistanceToFinish = Infinity;
          continue;
        }
      }

      currentLap.push(point);
    }

    // Ajouter le dernier tour
    if (currentLap.length > 10) {
      laps.push(currentLap);
    }

    return laps.length > 0 ? laps : [trajectory];
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


  const prepareChartData = () => {
    if (!simulationData) return { leftBoundary: [], rightBoundary: [], trajectory: [], players: [], sections: [] };

    const leftBoundary = simulationData.boundaries.filter(b => b.side === 'left');
    const rightBoundary = simulationData.boundaries.filter(b => b.side === 'right');

    // Utiliser le tour sélectionné ou toute la trajectoire
    const trajectoryToUse = selectedLap >= 0 && laps[selectedLap]
      ? laps[selectedLap]
      : simulationData.optimal_trajectory;

    // Pour les sections, utiliser toute la trajectoire du tour si un tour est sélectionné
    const sectionsData = circuitSections.map(section => {
      const sectionTrajectory = selectedLap >= 0
        ? trajectoryToUse
        : simulationData.optimal_trajectory.slice(section.startIndex, section.endIndex + 1);
      const hexColor = section.color.replace('rgba(', '').replace(')', '').split(',').slice(0, 3).map((c: string) => {
        const val = parseInt(c.trim());
        return val.toString(16).padStart(2, '0');
      }).join('');
      return { ...section, data: sectionTrajectory, hexColor: `#${hexColor}` };
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
      trajectory: trajectoryToUse,
      players: playerPositions,
      sections: sectionsData
    };
  };

  const chartData = prepareChartData();

  return (
    <main className="flex-1 md:ml-64 ml-0 relative z-10 h-screen flex flex-col overflow-hidden">
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
                CIRCUIT: <span className="text-white">{dataLoaded ? simulationData?.circuit?.name : 'Non chargé'}</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3">
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

              <select
                value={selectedCircuitId}
                onChange={(e) => setSelectedCircuitId(e.target.value)}
                className="w-full p-2 bg-[#16181d] border border-[#262626] text-white rounded text-sm focus:outline-none focus:border-[#7bf8ac]"
              >
                {circuits.map((circuit) => (
                  <option key={circuit.id} value={circuit.id}>
                    {circuit.name}
                  </option>
                ))}
              </select>

              <button
                onClick={loadSimulationData}
                disabled={!selectedCircuitId || dataLoaded || loading}
                className={`p-2 border transition-colors rounded ${
                  dataLoaded
                    ? 'bg-[#7bf8ac] border-[#7bf8ac] text-[#0d0f12]'
                    : loading
                    ? 'bg-[#16181d] border-[#262626] text-[#94a3b8]'
                    : !selectedCircuitId
                    ? 'bg-[#16181d] border-[#262626] text-[#525252] cursor-not-allowed'
                    : 'bg-[#16181d] border border-[#262626] text-[#94a3b8] hover:text-white hover:bg-[#262626]'
                }`}
                title="Charger le circuit"
              >
                {loading ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
              </button>

              <select
                value={selectedTrajectoryType === 'session' ? selectedSessionId : 'optimal'}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'optimal') {
                    setSelectedTrajectoryType('optimal');
                    setSelectedSessionId('');
                  } else {
                    setSelectedTrajectoryType('session');
                    setSelectedSessionId(value);
                  }
                }}
                disabled={!selectedCircuitId || dataLoaded || loading}
                className="p-2 bg-[#16181d] border border-[#262626] text-white rounded text-sm focus:outline-none focus:border-[#7bf8ac]"
              >
                <option value="optimal">Trajectoire optimisée</option>
                {userSessions.length > 0 && (
                  <optgroup label="Mes sessions">
                    {userSessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.kart} - {new Date(session.created_at).toLocaleDateString()}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>

              <label className="flex items-center gap-2 text-xs text-[#94a3b8] cursor-pointer">
                <input
                  type="checkbox"
                  checked={loadTrajectory}
                  onChange={(e) => setLoadTrajectory(e.target.checked)}
                  disabled={dataLoaded || loading}
                  className="w-4 h-4 rounded border-[#262626] bg-[#16181d] text-[#7bf8ac] focus:ring-[#7bf8ac] focus:ring-offset-0"
                />
                <span>Trajectoire</span>
              </label>

              {dataLoaded && laps.length > 1 && (
                <select
                  value={selectedLap}
                  onChange={(e) => setSelectedLap(parseInt(e.target.value))}
                  className="p-2 bg-[#16181d] border border-[#262626] text-white rounded text-sm focus:outline-none focus:border-[#7bf8ac]"
                >
                  <option value={-1}>Tous les tours</option>
                  {laps.map((_, index) => (
                    <option key={index} value={index}>
                      Tour {index + 1}
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={loadPredictions}
                disabled={!dataLoaded || predictionsLoaded || loading}
                className={`p-2 border transition-colors rounded ${
                  predictionsLoaded
                    ? 'bg-[#7bf8ac] border-[#7bf8ac] text-[#0d0f12]'
                    : !dataLoaded || loading
                    ? 'bg-[#16181d] border-[#262626] text-[#525252] cursor-not-allowed'
                    : 'bg-[#16181d] border-[#262626] text-[#94a3b8] hover:text-white hover:bg-[#262626]'
                }`}
                title="Charger les prédictions"
              >
                <RefreshCw size={16} />
              </button>

            </div>
          </div>

          {/* Content Grid */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">

            {/* Controls Column */}
            {!dataLoaded ? (
              <div className="lg:col-span-1 overflow-y-auto pr-1">
                <div className="card">
                  <h3 className="text-[#94a3b8] text-[10px] uppercase tracking-wider font-medium mb-3 flex items-center gap-2">
                    <Download size={12} />
                    Chargement Différé
                  </h3>
                  <div className="space-y-3">
                    {loadingCircuits ? (
                      <div className="text-center text-[#94a3b8] text-sm py-4">
                        Chargement des circuits...
                      </div>
                    ) : circuits.length === 0 ? (
                      <div className="text-center text-[#94a3b8] text-sm py-4">
                        Aucun circuit disponible
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <label className="text-xs text-[#94a3b8]">Sélectionner un circuit</label>
                          <select
                            value={selectedCircuitId}
                            onChange={(e) => setSelectedCircuitId(e.target.value)}
                            className="w-full p-2 bg-[#16181d] border border-[#262626] text-white rounded text-sm focus:outline-none focus:border-[#7bf8ac]"
                          >
                            {circuits.map((circuit) => (
                              <option key={circuit.id} value={circuit.id}>
                                {circuit.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-[#94a3b8]">Type de trajectoire</label>
                          <select
                            value={selectedTrajectoryType === 'session' ? selectedSessionId : 'optimal'}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === 'optimal') {
                                setSelectedTrajectoryType('optimal');
                                setSelectedSessionId('');
                              } else {
                                setSelectedTrajectoryType('session');
                                setSelectedSessionId(value);
                              }
                            }}
                            disabled={!selectedCircuitId || loading}
                            className="w-full p-2 bg-[#16181d] border border-[#262626] text-white rounded text-sm focus:outline-none focus:border-[#7bf8ac]"
                          >
                            <option value="optimal">Trajectoire optimisée</option>
                            {userSessions.length > 0 && (
                              <optgroup label="Mes sessions">
                                {userSessions.map((session) => (
                                  <option key={session.id} value={session.id}>
                                    {session.kart} - {new Date(session.created_at).toLocaleDateString()}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                          </select>
                        </div>
                        <label className="flex items-center gap-2 text-xs text-[#94a3b8] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={loadTrajectory}
                            onChange={(e) => setLoadTrajectory(e.target.checked)}
                            disabled={loading}
                            className="w-4 h-4 rounded border-[#262626] bg-[#16181d] text-[#7bf8ac] focus:ring-[#7bf8ac] focus:ring-offset-0"
                          />
                          <span>Charger la trajectoire optimisée</span>
                        </label>
                        {dataLoaded && laps.length > 1 && (
                          <div className="space-y-2">
                            <label className="text-xs text-[#94a3b8]">Tour à afficher</label>
                            <select
                              value={selectedLap}
                              onChange={(e) => setSelectedLap(parseInt(e.target.value))}
                              className="w-full p-2 bg-[#16181d] border border-[#262626] text-white rounded text-sm focus:outline-none focus:border-[#7bf8ac]"
                            >
                              <option value={-1}>Tous les tours</option>
                              {laps.map((_, index) => (
                                <option key={index} value={index}>
                                  Tour {index + 1}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        <button
                          onClick={loadSimulationData}
                          disabled={!selectedCircuitId || loading}
                          className={`w-full p-3 border transition-colors rounded flex items-center justify-center gap-2 font-medium ${
                            loading
                              ? 'bg-[#16181d] border-[#262626] text-[#94a3b8] cursor-not-allowed'
                              : !selectedCircuitId
                              ? 'bg-[#16181d] border-[#262626] text-[#525252] cursor-not-allowed'
                              : 'bg-[#7bf8ac] border-[#7bf8ac] text-[#0d0f12] hover:bg-[#6ee7b7]'
                          }`}
                        >
                          {loading ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                          {loading ? 'Chargement...' : 'Charger le Circuit'}
                        </button>
                        <p className="text-xs text-[#94a3b8] text-center">
                          Sélectionnez un circuit puis cliquez pour charger les données
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
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
            )}

            {/* Circuit Visualization */}
            {!dataLoaded ? (
              <div className="lg:col-span-3 card relative overflow-hidden flex flex-col items-center justify-center">
                <div className="text-center space-y-4">
                  <Download size={48} className="text-[#94a3b8] mx-auto" />
                  <h3 className="text-white text-lg font-medium">Circuit Non Chargé</h3>
                  <p className="text-[#94a3b8] text-sm max-w-md">
                    Utilisez le bouton "Charger le Circuit" dans le panneau de contrôle pour charger les données et démarrer la simulation.
                  </p>
                </div>
              </div>
            ) : loading ? (
              <SkeletonChart className="lg:col-span-3 min-h-[300px]" />
            ) : (
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

              <div className="flex-1 relative">
                {simulationData && (
                  <div className="w-full h-full" style={{ minHeight: '400px' }}>
                    <Canvas style={{ background: '#1a1a1a' }}>
                      <OrthographicCamera
                        position={[0, 0, 100]}
                        zoom={1}
                        left={graphBounds.minX}
                        right={graphBounds.maxX}
                        top={graphBounds.maxY}
                        bottom={graphBounds.minY}
                        near={0.1}
                        far={1000}
                      />
                      <MapControls
                        enableRotate={false}
                        enableZoom={true}
                        enablePan={true}
                        minZoom={0.1}
                        maxZoom={10}
                      />
                      <ambientLight intensity={1} />
                      <directionalLight position={[10, 10, 5]} intensity={1} />

                      {/* Left Boundary - triée par point_order */}
                      {chartData.leftBoundary.length > 0 && (
                        <Line
                          points={chartData.leftBoundary
                            .sort((a: any, b: any) => a.point_order - b.point_order)
                            .map((b: any) => new THREE.Vector3(b.x, b.y, 0))}
                          color="#ef4444"
                          lineWidth={5}
                        />
                      )}

                      {/* Right Boundary - triée par point_order */}
                      {chartData.rightBoundary.length > 0 && (
                        <Line
                          points={chartData.rightBoundary
                            .sort((a: any, b: any) => a.point_order - b.point_order)
                            .map((b: any) => new THREE.Vector3(b.x, b.y, 0))}
                          color="#3b82f6"
                          lineWidth={5}
                        />
                      )}

                      {/* Circuit Sections */}
                      {chartData.sections.length > 0 && chartData.sections.map((section: any) => (
                        <Line
                          key={section.id}
                          points={section.data.map((p: any) => new THREE.Vector3(p.x, p.y, 0))}
                          color={section.hexColor}
                          lineWidth={section.isSlowed ? 8 : 5}
                          opacity={section.isSlowed ? 0.8 : 0.3}
                          transparent={true}
                        />
                      ))}

                      {/* Players */}
                      {chartData.players.map((player: any) => (
                        <mesh key={player.name} position={[player.x, player.y, 1]}>
                          <sphereGeometry args={[2, 16, 16]} />
                          <meshBasicMaterial color={player.color} />
                        </mesh>
                      ))}
                    </Canvas>
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
            )}
          </div>
      </div>
    </main>
  );
};

export default SimulationPage;
