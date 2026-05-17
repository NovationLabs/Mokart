import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flag,
  AlertTriangle,
  Play,
  Pause,
  Square,
  Car,
  Users,
  Clock,
  Zap,
  Shield,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Header from '../components/Header';
import usePermissions from '../hooks/usePermissions';
import { UserRole, ROLE_LABELS } from '../types/user';

interface KartStatus {
  id: string;
  name: string;
  driver: string;
  status: 'online' | 'offline' | 'restricted' | 'warning';
  speed_limit?: number;
  battery: number;
  position?: { x: number; y: number };
  lap_time?: string;
}

interface RaceStatus {
  status: 'stopped' | 'starting' | 'running' | 'finished' | 'safety_car' | 'red_flag' | 'yellow_flag';
  session_time: string;
  laps_completed: number;
  total_laps: number;
  leader: string;
}

const RaceControlPage: React.FC = () => {
  const navigate = useNavigate();
  const { canControlRace, canRestrictKarts } = usePermissions();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  // États
  const [raceStatus, setRaceStatus] = useState<RaceStatus>({
    status: 'stopped',
    session_time: '00:00:00',
    laps_completed: 0,
    total_laps: 20,
    leader: 'Jean Pilot'
  });

  const [karts, setKarts] = useState<KartStatus[]>([
    {
      id: 'kart_001',
      name: 'SodiKart RT8-1',
      driver: 'Jean Pilot',
      status: 'online',
      battery: 85,
      position: { x: 250, y: 150 },
      lap_time: '48.2s'
    },
    {
      id: 'kart_002',
      name: 'SodiKart RT8-2',
      driver: 'Marie Racer',
      status: 'online',
      battery: 72,
      position: { x: 280, y: 160 },
      lap_time: '48.5s'
    },
    {
      id: 'kart_003',
      name: 'SodiKart RT8-3',
      driver: 'Pierre Speed',
      status: 'restricted',
      speed_limit: 30,
      battery: 68,
      position: { x: 240, y: 140 },
      lap_time: '48.8s'
    },
    {
      id: 'kart_004',
      name: 'SodiKart RT8-4',
      driver: 'Sophie Fast',
      status: 'warning',
      battery: 45,
      position: { x: 260, y: 155 },
      lap_time: '49.1s'
    }
  ]);

  const [selectedKart, setSelectedKart] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const getUserRole = (): UserRole | null => {
      try {
        const user = localStorage.getItem('mokart_user');
        if (!user) return null;
        const parsed = JSON.parse(user);
        return parsed.role || null;
      } catch {
        return null;
      }
    };

    const role = getUserRole();
    setUserRole(role);

    console.log('RaceControlPage - User role:', role);
    console.log('RaceControlPage - canControlRace():', canControlRace());
    console.log('RaceControlPage - canRestrictKarts():', canRestrictKarts());
    console.log('RaceControlPage - All permissions:', { canControlRace: canControlRace(), canRestrictKarts: canRestrictKarts() });

    if (!canControlRace() && !canRestrictKarts()) {
      console.log('RaceControlPage - Access denied, redirecting to dashboard');
      navigate('/');
      return;
    }

    setIsAuthorized(true);
  }, [canControlRace, canRestrictKarts, navigate]);

  const handleRaceControl = (action: string) => {
    switch (action) {
      case 'start':
        setRaceStatus(prev => ({ ...prev, status: 'starting' }));
        setTimeout(() => {
          setRaceStatus(prev => ({ ...prev, status: 'running' }));
          setMessage({ type: 'success', text: 'Course démarrée' });
        }, 3000);
        break;
      case 'stop':
        setRaceStatus(prev => ({ ...prev, status: 'finished' }));
        setMessage({ type: 'success', text: 'Course terminée' });
        break;
      case 'pause':
        setRaceStatus(prev => ({ ...prev, status: 'safety_car' }));
        setMessage({ type: 'warning', text: 'Safety Car déployé' });
        break;
      case 'red_flag':
        setRaceStatus(prev => ({ ...prev, status: 'red_flag' }));
        setMessage({ type: 'error', text: 'Drapeau rouge - Course arrêtée' });
        break;
      case 'yellow_flag':
        setRaceStatus(prev => ({ ...prev, status: 'yellow_flag' }));
        setMessage({ type: 'warning', text: 'Drapeau jaune - Danger sur la piste' });
        break;
      case 'clear':
        setRaceStatus(prev => ({ ...prev, status: 'running' }));
        setMessage({ type: 'success', text: 'Piste dégagée' });
        break;
    }

    setTimeout(() => setMessage(null), 5000);
  };

  const handleKartRestriction = (kartId: string, action: 'restrict' | 'unrestrict' | 'limit') => {
    setKarts(prev => prev.map(kart => {
      if (kart.id === kartId) {
        if (action === 'restrict') {
          return { ...kart, status: 'restricted', speed_limit: 30 };
        } else if (action === 'unrestrict') {
          const { speed_limit, ...rest } = kart;
          return { ...rest, status: 'online' };
        } else if (action === 'limit') {
          const newLimit = prompt('Limite de vitesse (km/h):', kart.speed_limit?.toString() || '50');
          return { ...kart, status: 'restricted', speed_limit: parseInt(newLimit || '50') };
        }
      }
      return kart;
    }));

    setMessage({ type: 'success', text: `Kart ${action === 'unrestrict' ? 'libéré' : 'restreint'} avec succès` });
    setTimeout(() => setMessage(null), 3000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-emerald-500';
      case 'offline': return 'bg-red-500';
      case 'restricted': return 'bg-yellow-500';
      case 'warning': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getRaceStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-emerald-500';
      case 'starting': return 'text-blue-500';
      case 'finished': return 'text-gray-500';
      case 'safety_car': return 'text-yellow-500';
      case 'red_flag': return 'text-red-500';
      case 'yellow_flag': return 'text-orange-500';
      default: return 'text-gray-500';
    }
  };

  const getRaceStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Play className="w-5 h-5" />;
      case 'starting': return <Clock className="w-5 h-5" />;
      case 'finished': return <Square className="w-5 h-5" />;
      case 'safety_car': return <AlertTriangle className="w-5 h-5" />;
      case 'red_flag': return <XCircle className="w-5 h-5" />;
      case 'yellow_flag': return <AlertCircle className="w-5 h-5" />;
      default: return <Pause className="w-5 h-5" />;
    }
  };

  if (isAuthorized === false) {
    return (
      <div className="flex-1 md:ml-64 ml-0 relative z-10 flex flex-col h-screen">
        <Header className="flex-shrink-0" />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 pb-20 md:pb-6">
            <div className="max-w-2xl mx-auto">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 sm:p-6 mb-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-red-400 mb-1">Accès non autorisé</h3>
                    <p className="text-sm text-red-300">
                      Seuls les commissaires et les administrateurs peuvent accéder au contrôle de course.
                      Votre rôle actuel : <span className="font-medium">{userRole ? ROLE_LABELS[userRole] : 'Inconnu'}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 md:ml-64 ml-0 relative z-10 flex flex-col h-screen">
      <Header className="flex-shrink-0" />

      <main className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 pb-20 md:pb-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Contrôle de Course</h1>
              <p className="text-[#94a3b8] text-sm mt-1">Gestion des drapeaux et restrictions des karts</p>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mb-6 p-3 sm:p-4 rounded-lg border text-sm ${
                message.type === 'success'
                  ? 'bg-green-900/20 border-green-500 text-green-400'
                  : message.type === 'warning'
                  ? 'bg-yellow-900/20 border-yellow-500 text-yellow-400'
                  : 'bg-red-900/20 border-red-500 text-red-400'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Race Status */}
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Statut de la Course</h2>
              <div className={`flex items-center gap-2 ${getRaceStatusColor(raceStatus.status)}`}>
                {getRaceStatusIcon(raceStatus.status)}
                <span className="font-medium capitalize">{raceStatus.status.replace('_', ' ')}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{raceStatus.session_time}</div>
                <div className="text-xs text-[#94a3b8]">Temps de session</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{raceStatus.laps_completed}/{raceStatus.total_laps}</div>
                <div className="text-xs text-[#94a3b8]">Tours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{karts.filter(k => k.status === 'online').length}</div>
                <div className="text-xs text-[#94a3b8]">Karts actifs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#7bf8ac]">{raceStatus.leader}</div>
                <div className="text-xs text-[#94a3b8]">Leader</div>
              </div>
            </div>

            {/* Race Controls */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {canControlRace() && (
                <>
                  <button
                    onClick={() => handleRaceControl('start')}
                    disabled={raceStatus.status === 'running'}
                    className="flex items-center justify-center gap-2 p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-500 rounded-lg hover:bg-emerald-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="w-4 h-4" />
                    <span className="text-xs font-medium">Démarrer</span>
                  </button>
                  <button
                    onClick={() => handleRaceControl('stop')}
                    disabled={raceStatus.status === 'stopped'}
                    className="flex items-center justify-center gap-2 p-3 bg-red-500/20 border border-red-500/30 text-red-500 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Square className="w-4 h-4" />
                    <span className="text-xs font-medium">Arrêter</span>
                  </button>
                  <button
                    onClick={() => handleRaceControl('yellow_flag')}
                    disabled={raceStatus.status === 'red_flag'}
                    className="flex items-center justify-center gap-2 p-3 bg-yellow-500/20 border border-yellow-500/30 text-yellow-500 rounded-lg hover:bg-yellow-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Flag className="w-4 h-4" />
                    <span className="text-xs font-medium">Drapeau Jaune</span>
                  </button>
                  <button
                    onClick={() => handleRaceControl('red_flag')}
                    className="flex items-center justify-center gap-2 p-3 bg-red-500/20 border border-red-500/30 text-red-500 rounded-lg hover:bg-red-500/30 transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs font-medium">Drapeau Rouge</span>
                  </button>
                  <button
                    onClick={() => handleRaceControl('pause')}
                    disabled={raceStatus.status === 'red_flag'}
                    className="flex items-center justify-center gap-2 p-3 bg-orange-500/20 border border-orange-500/30 text-orange-500 rounded-lg hover:bg-orange-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Pause className="w-4 h-4" />
                    <span className="text-xs font-medium">Safety Car</span>
                  </button>
                  <button
                    onClick={() => handleRaceControl('clear')}
                    disabled={raceStatus.status !== 'yellow_flag' && raceStatus.status !== 'safety_car'}
                    className="flex items-center justify-center gap-2 p-3 bg-green-500/20 border border-green-500/30 text-green-500 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">Dégager</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Karts Control */}
          <div className="card">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-4">Contrôle des Karts</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {karts.map((kart) => (
                <div key={kart.id} className="border border-[#262626] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(kart.status)}`}></div>
                      <div>
                        <h3 className="text-sm font-medium text-white">{kart.name}</h3>
                        <p className="text-xs text-[#94a3b8]">{kart.driver}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {kart.lap_time && (
                        <div className="text-sm font-mono text-white">{kart.lap_time}</div>
                      )}
                      {kart.speed_limit && (
                        <div className="text-xs text-yellow-500">Limité: {kart.speed_limit} km/h</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-[#94a3b8]" />
                      <span className="text-xs text-[#94a3b8]">Batterie</span>
                      <div className="w-16 bg-[#262626] rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            kart.battery > 60 ? 'bg-emerald-500' :
                            kart.battery > 30 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${kart.battery}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-white">{kart.battery}%</span>
                    </div>
                  </div>

                  {canRestrictKarts() && (
                    <div className="flex gap-2">
                      {kart.status === 'restricted' ? (
                        <button
                          onClick={() => handleKartRestriction(kart.id, 'unrestrict')}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-500 rounded-lg hover:bg-emerald-500/30 transition-colors text-xs"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Libérer
                        </button>
                      ) : (
                        <button
                          onClick={() => handleKartRestriction(kart.id, 'restrict')}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-500 rounded-lg hover:bg-yellow-500/30 transition-colors text-xs"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          Restreindre
                        </button>
                      )}
                      <button
                        onClick={() => handleKartRestriction(kart.id, 'limit')}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-500 rounded-lg hover:bg-blue-500/30 transition-colors text-xs"
                      >
                        <Zap className="w-3 h-3" />
                        Limiter
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RaceControlPage;
