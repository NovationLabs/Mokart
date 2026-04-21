import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car,
  Battery,
  Wifi,
  Settings,
  Edit2,
  Trash2,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  Activity,
  Zap,
  Shield,
  User,
  Clock
} from 'lucide-react';
import Header from '../components/Header';
import usePermissions from '../hooks/usePermissions';
import { UserRole, ROLE_LABELS } from '../types/user';

interface Kart {
  id: string;
  name: string;
  model: string;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  battery_level: number;
  signal_strength: number;
  driver?: string;
  last_session?: string;
  firmware_version: string;
  location?: { x: number; y: number };
  maintenance_due?: string;
}

const KartsPage: React.FC = () => {
  const navigate = useNavigate();
  const { canAccessKarts, canManageKarts } = usePermissions();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  const [karts, setKarts] = useState<Kart[]>([
    {
      id: 'kart_001',
      name: 'SodiKart RT8-1',
      model: 'SodiKart RT8',
      status: 'online',
      battery_level: 85,
      signal_strength: -65,
      driver: 'Jean Pilot',
      last_session: '2024-03-10T14:30:00Z',
      firmware_version: 'v2.1.3',
      location: { x: 250, y: 150 },
      maintenance_due: '2024-04-15'
    },
    {
      id: 'kart_002',
      name: 'SodiKart RT8-2',
      model: 'SodiKart RT8',
      status: 'online',
      battery_level: 72,
      signal_strength: -68,
      driver: 'Marie Racer',
      last_session: '2024-03-10T14:25:00Z',
      firmware_version: 'v2.1.3',
      location: { x: 280, y: 160 }
    },
    {
      id: 'kart_003',
      name: 'SodiKart RT8-3',
      model: 'SodiKart RT8',
      status: 'maintenance',
      battery_level: 45,
      signal_strength: -78,
      last_session: '2024-03-09T16:45:00Z',
      firmware_version: 'v2.0.8',
      location: { x: 240, y: 140 },
      maintenance_due: '2024-03-20'
    },
    {
      id: 'kart_004',
      name: 'SodiKart LR5-1',
      model: 'SodiKart LR5',
      status: 'offline',
      battery_level: 12,
      signal_strength: -85,
      firmware_version: 'v1.8.2',
      location: { x: 260, y: 155 }
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'maintenance' | 'error'>('all');
  const [selectedKart, setSelectedKart] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
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

    if (!canAccessKarts()) {
      navigate('/');
      return;
    }

    setIsAuthorized(true);
  }, [canAccessKarts, navigate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-emerald-500';
      case 'offline': return 'bg-red-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 60) return 'bg-emerald-500';
    if (level > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getSignalColor = (strength: number) => {
    if (strength > -70) return 'text-emerald-500';
    if (strength > -80) return 'text-yellow-500';
    return 'text-red-500';
  };

  const filteredKarts = karts.filter(kart => {
    const matchesSearch = kart.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         kart.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (kart.driver && kart.driver.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || kart.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleKartAction = async (kartId: string, action: 'reboot' | 'maintenance' | 'delete') => {
    try {
      switch (action) {
        case 'reboot':
          setKarts(prev => prev.map(kart =>
            kart.id === kartId ? { ...kart, status: 'offline' } : kart
          ));
          setMessage({ type: 'success', text: 'Kart redémarré avec succès' });
          setTimeout(() => {
            setKarts(prev => prev.map(kart =>
              kart.id === kartId ? { ...kart, status: 'online' } : kart
            ));
          }, 3000);
          break;
        case 'maintenance':
          setKarts(prev => prev.map(kart =>
            kart.id === kartId ? { ...kart, status: 'maintenance' } : kart
          ));
          setMessage({ type: 'success', text: 'Kart mis en maintenance' });
          break;
        case 'delete':
          if (window.confirm('Êtes-vous sûr de vouloir supprimer ce kart?')) {
            setKarts(prev => prev.filter(kart => kart.id !== kartId));
            setMessage({ type: 'success', text: 'Kart supprimé avec succès' });
          }
          break;
      }
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: `Erreur lors de l'action ${action}` });
      setTimeout(() => setMessage(null), 5000);
    }
  };

  if (isAuthorized === false) {
    return (
      <div className="flex-1 md:ml-11 ml-0 relative z-10 flex flex-col h-screen">
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
                      Vous n'avez pas les permissions nécessaires pour accéder à la gestion des karts.
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
    <div className="flex-1 md:ml-11 ml-0 relative z-10 flex flex-col h-screen">
      <Header className="flex-shrink-0" />

      <main className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 pb-20 md:pb-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Gestion des Karts</h1>
              <p className="text-[#94a3b8] text-sm mt-1">Surveiller et gérer la flotte de karts</p>
            </div>
            {canManageKarts() && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#7bf8ac] text-black font-semibold rounded-full hover:opacity-90 transition-all w-full sm:w-auto justify-center"
              >
                <Plus className="w-4 h-4" />
                Nouveau Kart
              </button>
            )}
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

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="card">
              <div className="flex items-center gap-2 mb-2">
                <Car className="w-4 h-4 text-[#94a3b8]" />
                <span className="text-[10px] text-[#94a3b8] uppercase tracking-wider">Total</span>
              </div>
              <div className="text-2xl font-bold text-white">{karts.length}</div>
            </div>
            <div className="card">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] text-[#94a3b8] uppercase tracking-wider">En ligne</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {karts.filter(k => k.status === 'online').length}
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span className="text-[10px] text-[#94a3b8] uppercase tracking-wider">Maintenance</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {karts.filter(k => k.status === 'maintenance').length}
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-red-500" />
                <span className="text-[10px] text-[#94a3b8] uppercase tracking-wider">Hors ligne</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {karts.filter(k => k.status === 'offline').length}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="card mb-6">
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#94a3b8] w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher un kart..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0d0f12] border border-[#262626] rounded-lg pl-10 pr-4 py-2.5 text-white text-sm placeholder-[#737373] focus:outline-none focus:border-[#7bf8ac]/50 transition-colors"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="flex-1 bg-[#0d0f12] border border-[#262626] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#7bf8ac]/50 transition-colors"
              >
                <option value="all">Tous les statuts</option>
                <option value="online">En ligne</option>
                <option value="offline">Hors ligne</option>
                <option value="maintenance">Maintenance</option>
                <option value="error">Erreur</option>
              </select>
            </div>
          </div>

          {/* Karts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredKarts.map((kart) => (
              <div key={kart.id} className="card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(kart.status)}`}></div>
                    <div>
                      <h3 className="text-sm font-medium text-white">{kart.name}</h3>
                      <p className="text-xs text-[#94a3b8]">{kart.model}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#94a3b8]">v{kart.firmware_version}</span>
                    {canManageKarts() && (
                      <button
                        onClick={() => setSelectedKart(kart.id)}
                        className="p-1 text-[#94a3b8] hover:text-white transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Driver Info */}
                {kart.driver && (
                  <div className="flex items-center gap-2 mb-3 p-2 bg-[#1c1f26] rounded-lg">
                    <User className="w-4 h-4 text-[#94a3b8]" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{kart.driver}</div>
                      <div className="text-xs text-[#94a3b8]">Pilote actuel</div>
                    </div>
                  </div>
                )}

                {/* Status Indicators */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#94a3b8]">Batterie</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-[#262626] rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${getBatteryColor(kart.battery_level)}`}
                          style={{ width: `${kart.battery_level}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-white">{kart.battery_level}%</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#94a3b8]">Signal</span>
                    <div className="flex items-center gap-2">
                      <Wifi className="w-3 h-3 text-[#94a3b8]" />
                      <span className={`text-xs font-mono ${getSignalColor(kart.signal_strength)}`}>
                        {kart.signal_strength} dBm
                      </span>
                    </div>
                  </div>

                  {kart.last_session && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#94a3b8]">Dernière session</span>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-[#94a3b8]" />
                        <span className="text-xs text-white">
                          {new Date(kart.last_session).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  )}

                  {kart.maintenance_due && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#94a3b8]">Maintenance</span>
                      <span className="text-xs text-yellow-500">
                        {new Date(kart.maintenance_due).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {canManageKarts() && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleKartAction(kart.id, 'reboot')}
                      disabled={kart.status === 'offline'}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-500 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                    >
                      <Zap className="w-3 h-3" />
                      Redémarrer
                    </button>
                    <button
                      onClick={() => handleKartAction(kart.id, 'maintenance')}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-500 rounded-lg hover:bg-yellow-500/30 transition-colors text-xs"
                    >
                      <Shield className="w-3 h-3" />
                      Maintenance
                    </button>
                    <button
                      onClick={() => handleKartAction(kart.id, 'delete')}
                      className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default KartsPage;
