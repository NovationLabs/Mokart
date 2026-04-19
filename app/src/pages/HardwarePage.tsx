import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  Zap,
  Cpu,
  Wifi,
  Battery,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Settings,
  Activity,
  Thermometer,
  Shield,
  Radio
} from 'lucide-react';
import Header from '../components/Header';
import usePermissions from '../hooks/usePermissions';
import { UserRole, ROLE_LABELS } from '../types/user';

interface HardwareModule {
  id: string;
  kart_id: string;
  module_type: 'rpi' | 'imu' | 'rtk' | 'uwb' | 'battery' | 'motor_controller';
  name: string;
  status: 'online' | 'offline' | 'error' | 'warning' | 'calibrating' | 'updating';
  battery_voltage?: number;
  signal_strength?: number;
  temperature?: number;
  firmware_version?: string;
  last_seen: string;
  data?: {
    satellites?: number;
    accuracy?: string;
    calibration_status?: string;
    anchor_count?: number;
  };
}

const HardwarePage: React.FC = () => {
  const navigate = useNavigate();
  const { canManageHardware, canCalibrateHardware, canRebootHardware, canOTAUpdate } = usePermissions();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  const [modules, setModules] = useState<HardwareModule[]>([
    {
      id: 'mod_001',
      kart_id: 'kart_001',
      module_type: 'rpi',
      name: 'Raspberry Pi 4B',
      status: 'online',
      temperature: 45,
      firmware_version: 'v2.1.3',
      last_seen: '2024-03-10T14:30:00Z'
    },
    {
      id: 'mod_002',
      kart_id: 'kart_001',
      module_type: 'imu',
      name: 'BNO085 IMU',
      status: 'online',
      battery_voltage: 3.3,
      temperature: 38,
      firmware_version: 'v1.5.2',
      last_seen: '2024-03-10T14:30:00Z',
      data: {
        calibration_status: 'Calibrated',
        accuracy: '±0.1°'
      }
    },
    {
      id: 'mod_003',
      kart_id: 'kart_001',
      module_type: 'rtk',
      name: 'Point One RTK',
      status: 'online',
      signal_strength: -65,
      temperature: 42,
      firmware_version: 'v3.0.1',
      last_seen: '2024-03-10T14:30:00Z',
      data: {
        satellites: 14,
        accuracy: '±1cm'
      }
    },
    {
      id: 'mod_004',
      kart_id: 'kart_001',
      module_type: 'uwb',
      name: 'UWB Module',
      status: 'warning',
      signal_strength: -78,
      firmware_version: 'v1.2.0',
      last_seen: '2024-03-10T14:28:00Z',
      data: {
        anchor_count: 3
      }
    },
    {
      id: 'mod_005',
      kart_id: 'kart_002',
      module_type: 'battery',
      name: 'Battery Management System',
      status: 'online',
      battery_voltage: 48.2,
      temperature: 35,
      firmware_version: 'v1.0.5',
      last_seen: '2024-03-10T14:30:00Z'
    }
  ]);

  const [selectedModule, setSelectedModule] = useState<HardwareModule | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

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

    if (!canManageHardware()) {
      navigate('/');
      return;
    }

    setIsAuthorized(true);
  }, [canManageHardware, navigate]);

  const handleHardwareAction = async (moduleId: string, action: 'calibrate' | 'reboot' | 'ota_update') => {
    setLoading(prev => ({ ...prev, [moduleId]: true }));

    try {
      // Simuler l'action
      await new Promise(resolve => setTimeout(resolve, 2000));

      setModules(prev => prev.map(module => {
        if (module.id === moduleId) {
          switch (action) {
            case 'calibrate':
              return {
                ...module,
                status: 'calibrating',
                data: { ...module.data, calibration_status: 'Calibrating...' }
              };
            case 'reboot':
              return {
                ...module,
                status: 'offline',
                last_seen: new Date().toISOString()
              };
            case 'ota_update':
              return {
                ...module,
                status: 'updating',
                firmware_version: 'Updating...'
              };
          }
        }
        return module;
      }));

      setMessage({
        type: 'success',
        text: `${action === 'calibrate' ? 'Calibration' : action === 'reboot' ? 'Redémarrage' : 'Mise à jour'} démarré(e)`
      });

      // Simuler la fin de l'action
      setTimeout(() => {
        setModules(prev => prev.map(module => {
          if (module.id === moduleId) {
            if (action === 'calibrate') {
              return {
                ...module,
                status: 'online',
                data: { ...module.data, calibration_status: 'Calibrated' }
              };
            } else if (action === 'reboot') {
              return {
                ...module,
                status: 'online',
                last_seen: new Date().toISOString()
              };
            } else if (action === 'ota_update') {
              return {
                ...module,
                status: 'online',
                firmware_version: 'v2.1.4'
              };
            }
          }
          return module;
        }));
      }, 3000);

    } catch (error) {
      setMessage({ type: 'error', text: `Erreur lors de l'action ${action}` });
    } finally {
      setLoading(prev => ({ ...prev, [moduleId]: false }));
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-emerald-500';
      case 'offline': return 'bg-red-500';
      case 'error': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'calibrating': return 'bg-blue-500';
      case 'updating': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="w-4 h-4" />;
      case 'offline': return <AlertTriangle className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'calibrating': return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'updating': return <Download className="w-4 h-4 animate-bounce" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getModuleIcon = (type: string) => {
    switch (type) {
      case 'rpi': return <Cpu className="w-5 h-5" />;
      case 'imu': return <Activity className="w-5 h-5" />;
      case 'rtk': return <Radio className="w-5 h-5" />;
      case 'uwb': return <Wifi className="w-5 h-5" />;
      case 'battery': return <Battery className="w-5 h-5" />;
      case 'motor_controller': return <Zap className="w-5 h-5" />;
      default: return <Settings className="w-5 h-5" />;
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
                      Seuls les mécaniciens et les administrateurs peuvent accéder à la gestion hardware.
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
              <h1 className="text-xl sm:text-2xl font-bold text-white">Gestion Hardware</h1>
              <p className="text-[#94a3b8] text-sm mt-1">Calibration, maintenance et mise à jour des modules</p>
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

          {/* Hardware Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((module) => (
              <div key={module.id} className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-[#1c1f26] text-[#7bf8ac]`}>
                      {getModuleIcon(module.module_type)}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white">{module.name}</h3>
                      <p className="text-xs text-[#94a3b8]">{module.kart_id}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 ${getStatusColor(module.status)}`}>
                    {getStatusIcon(module.status)}
                    <span className="text-xs capitalize">{module.status}</span>
                  </div>
                </div>

                {/* Module Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#94a3b8]">Type</span>
                    <span className="text-xs text-white capitalize">{module.module_type.replace('_', ' ')}</span>
                  </div>

                  {module.firmware_version && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#94a3b8]">Firmware</span>
                      <span className="text-xs text-white font-mono">{module.firmware_version}</span>
                    </div>
                  )}

                  {module.temperature && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#94a3b8]">Température</span>
                      <div className="flex items-center gap-1">
                        <Thermometer className="w-3 h-3 text-[#94a3b8]" />
                        <span className="text-xs text-white">{module.temperature}°C</span>
                      </div>
                    </div>
                  )}

                  {module.battery_voltage && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#94a3b8]">Voltage</span>
                      <span className="text-xs text-white">{module.battery_voltage}V</span>
                    </div>
                  )}

                  {module.signal_strength && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#94a3b8]">Signal</span>
                      <div className="flex items-center gap-1">
                        <Wifi className="w-3 h-3 text-[#94a3b8]" />
                        <span className="text-xs text-white">{module.signal_strength} dBm</span>
                      </div>
                    </div>
                  )}

                  {module.data?.satellites && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#94a3b8]">Satellites</span>
                      <span className="text-xs text-white">{module.data.satellites}</span>
                    </div>
                  )}

                  {module.data?.accuracy && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#94a3b8]">Précision</span>
                      <span className="text-xs text-white">{module.data.accuracy}</span>
                    </div>
                  )}

                  {module.data?.calibration_status && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#94a3b8]">Calibration</span>
                      <span className="text-xs text-white">{module.data.calibration_status}</span>
                    </div>
                  )}

                  {module.data?.anchor_count && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#94a3b8]">Anchors</span>
                      <span className="text-xs text-white">{module.data.anchor_count}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#94a3b8]">Dernière activité</span>
                    <span className="text-xs text-white">
                      {new Date(module.last_seen).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 gap-2">
                  {canCalibrateHardware() && module.module_type === 'imu' && (
                    <button
                      onClick={() => handleHardwareAction(module.id, 'calibrate')}
                      disabled={loading[module.id] || module.status === 'calibrating'}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-500 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                    >
                      <Activity className="w-3 h-3" />
                      {loading[module.id] ? 'Calibration...' : 'Calibrer IMU'}
                    </button>
                  )}

                  {canRebootHardware() && (
                    <button
                      onClick={() => handleHardwareAction(module.id, 'reboot')}
                      disabled={loading[module.id] || module.status === 'updating'}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-orange-500/20 border border-orange-500/30 text-orange-500 rounded-lg hover:bg-orange-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                    >
                      <RefreshCw className={`w-3 h-3 ${loading[module.id] ? 'animate-spin' : ''}`} />
                      {loading[module.id] ? 'Redémarrage...' : 'Redémarrer'}
                    </button>
                  )}

                  {canOTAUpdate() && (
                    <button
                      onClick={() => handleHardwareAction(module.id, 'ota_update')}
                      disabled={loading[module.id] || module.status === 'updating'}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-500 rounded-lg hover:bg-emerald-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                    >
                      <Download className={`w-3 h-3 ${loading[module.id] ? 'animate-bounce' : ''}`} />
                      {loading[module.id] ? 'Mise à jour...' : 'Mise à jour OTA'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* System Status Summary */}
          <div className="card mt-6">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-4">Résumé Système</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-500">
                  {modules.filter(m => m.status === 'online').length}
                </div>
                <div className="text-xs text-[#94a3b8]">Modules en ligne</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500">
                  {modules.filter(m => m.status === 'warning' || m.status === 'calibrating').length}
                </div>
                <div className="text-xs text-[#94a3b8]">Attention</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">
                  {modules.filter(m => m.status === 'offline' || m.status === 'error').length}
                </div>
                <div className="text-xs text-[#94a3b8]">Hors ligne</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {modules.length}
                </div>
                <div className="text-xs text-[#94a3b8]">Total modules</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HardwarePage;
