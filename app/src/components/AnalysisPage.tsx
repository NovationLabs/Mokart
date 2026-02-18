import React, { useState, useEffect, useRef } from 'react';
import '../styles/theme.css';
import '../styles/AnalysisPage.css';

interface Session {
  id: string;
  user_id?: string;
  vehicle_model?: string;
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

const AnalysisPage: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [trajectory, setTrajectory] = useState<TrajectoryPoint[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Charger les sessions au démarrage
  useEffect(() => {
    fetchSessions();
  }, []);

  // Charger la trajectoire quand une session est sélectionnée
  useEffect(() => {
    if (selectedSession) {
      fetchTrajectory(selectedSession);
      fetchStats(selectedSession);
    }
  }, [selectedSession]);

  const fetchSessions = async () => {
    try {
      const response = await fetch('http://localhost:8081/sessions');
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error('Erreur lors du chargement des sessions:', error);
    }
  };

  const fetchTrajectory = async (sessionId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8081/sessions/${sessionId}/trajectory`);
      const data = await response.json();
      setTrajectory(data);
    } catch (error) {
      console.error('Erreur lors du chargement de la trajectoire:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (sessionId: string) => {
    try {
      const response = await fetch(`http://localhost:8081/sessions/${sessionId}/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
    }
  };

  // Dessiner la trajectoire sur le canvas
  useEffect(() => {
    if (!canvasRef.current || trajectory.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Effacer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculer les bounds pour le scaling
    const bounds = stats?.bounds || {
      min_x: Math.min(...trajectory.map(p => p.x)),
      max_x: Math.max(...trajectory.map(p => p.x)),
      min_y: Math.min(...trajectory.map(p => p.y)),
      max_y: Math.max(...trajectory.map(p => p.y))
    };

    const padding = 40;
    const scaleX = (canvas.width - 2 * padding) / (bounds.max_x - bounds.min_x);
    const scaleY = (canvas.height - 2 * padding) / (bounds.max_y - bounds.min_y);
    const scale = Math.min(scaleX, scaleY);

    // Fonction pour convertir les coordonnées
    const toCanvasCoords = (x: number, y: number) => {
      const canvasX = padding + (x - bounds.min_x) * scale;
      const canvasY = canvas.height - padding - (y - bounds.min_y) * scale;
      return { x: canvasX, y: canvasY };
    };

    // Dessiner la grille
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = padding + (i * (canvas.width - 2 * padding)) / 10;
      const y = padding + (i * (canvas.height - 2 * padding)) / 10;

      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, canvas.height - padding);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
    }

    // Dessiner la trajectoire
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();

    trajectory.forEach((point, index) => {
      const canvasPoint = toCanvasCoords(point.x, point.y);

      if (index === 0) {
        ctx.moveTo(canvasPoint.x, canvasPoint.y);
      } else {
        ctx.lineTo(canvasPoint.x, canvasPoint.y);
      }
    });

    ctx.stroke();

    // Dessiner les points
    trajectory.forEach((point, index) => {
      const canvasPoint = toCanvasCoords(point.x, point.y);

      // Point de départ en vert
      if (index === 0) {
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(canvasPoint.x, canvasPoint.y, 6, 0, 2 * Math.PI);
        ctx.fill();
      }
      // Point de fin en rouge
      else if (index === trajectory.length - 1) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(canvasPoint.x, canvasPoint.y, 6, 0, 2 * Math.PI);
        ctx.fill();
      }
      // Points intermédiaires en bleu
      else if (index % Math.max(1, Math.floor(trajectory.length / 100)) === 0) {
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.arc(canvasPoint.x, canvasPoint.y, 2, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

  }, [trajectory, stats]);

  return (
    <div className="main-container">
      <div className="content-area">
        <div className="section-header">
          <h2 className="section-title">Analyse de Trajectoires</h2>
        </div>

        {/* Sélecteur de session */}
        <div className="card">
          <div className="card-header">
            <label className="form-label">
              Sélectionner une session
            </label>
          </div>
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="form-select"
          >
            <option value="">Choisir une session...</option>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.vehicle_model || 'Session'} - {new Date(session.created_at || '').toLocaleString()}
              </option>
            ))}
          </select>
        </div>

        {selectedSession && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Canvas de trajectoire */}
            <div className="lg:col-span-2">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Trajectoire</h3>
                </div>
                {loading ? (
                  <div className="flex justify-center items-center h-96">
                    <div className="text-gray-400">Chargement...</div>
                  </div>
                ) : (
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={600}
                    className="canvas-container"
                  />
                )}
              </div>
            </div>

            {/* Statistiques */}
            <div className="lg:col-span-1">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Statistiques</h3>
                </div>
                {stats && (
                  <div className="space-y-4">
                    <div className="stat-item">
                      <span className="stat-label">Points de données</span>
                      <p className="stat-value">{stats.total_points}</p>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Durée</span>
                      <p className="stat-value">{(stats.duration_ms / 1000).toFixed(2)}s</p>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Couverture UWB</span>
                      <p className="stat-value">{stats.uwb_coverage.toFixed(1)}%</p>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Couverture IMU</span>
                      <p className="stat-value">{stats.imu_coverage.toFixed(1)}%</p>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Couverture Direction</span>
                      <p className="stat-value">{stats.steering_coverage.toFixed(1)}%</p>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Bounds</span>
                      <p className="stat-value font-mono text-sm">
                        X: [{stats.bounds.min_x.toFixed(2)}, {stats.bounds.max_x.toFixed(2)}]<br/>
                        Y: [{stats.bounds.min_y.toFixed(2)}, {stats.bounds.max_y.toFixed(2)}]
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisPage;
