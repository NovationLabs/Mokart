import React, { useState, useEffect } from 'react';
// Global style import handled in index.tsx
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { User, Smartphone, Activity, Zap, Map, Users, Battery, Wifi } from 'lucide-react';
import { dashboardService } from '../services/dashboardService';
import { DashboardData } from '../types/dashboard';

const Home: React.FC = () => {
  const [userName, setUserName] = useState('');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const updateUserName = () => {
      const user = localStorage.getItem('mokart_user');
      if (user) {
        try {
          const userData = JSON.parse(user);
          const email = userData.email || '';
          const firstName = email.split('@')[0];
          setUserName(firstName.charAt(0).toUpperCase() + firstName.slice(1));
        } catch (e) {
          setUserName('Driver');
        }
      }
    };

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getDashboardData();
        setDashboardData(data);
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement du dashboard:', err);
        setError('Impossible de charger les données du dashboard');
      } finally {
        setLoading(false);
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mokart_user') {
        updateUserName();
        loadDashboardData();
      }
    };

    const handleUserRoleChange = () => {
      updateUserName();
      loadDashboardData();
    };

    updateUserName();
    loadDashboardData();

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userRoleChanged', handleUserRoleChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userRoleChanged', handleUserRoleChange);
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-emerald-500';
      case 'offline': return 'bg-red-500';
      case 'charging': return 'bg-blue-500';
      case 'maintenance': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 60) return 'bg-emerald-500';
    if (level > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const renderAdminDashboard = () => {
    if (!dashboardData) return null;

    return (
      <div className="space-y-6">
        {/* System Status */}
        {dashboardData.system_status && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card">
              <div className="flex items-center gap-2 mb-2">
                <Users size={16} className="text-[#94a3b8]" />
                <span className="text-[10px] text-[#94a3b8] uppercase tracking-wider">Utilisateurs</span>
              </div>
              <div className="text-2xl font-bold text-white">{dashboardData.system_status.total_users}</div>
            </div>
            <div className="card">
              <div className="flex items-center gap-2 mb-2">
                <Activity size={16} className="text-[#94a3b8]" />
                <span className="text-[10px] text-[#94a3b8] uppercase tracking-wider">Sessions Actives</span>
              </div>
              <div className="text-2xl font-bold text-white">{dashboardData.system_status.active_sessions}</div>
            </div>
            <div className="card">
              <div className="flex items-center gap-2 mb-2">
                <Map size={16} className="text-[#94a3b8]" />
                <span className="text-[10px] text-[#94a3b8] uppercase tracking-wider">Karts en Ligne</span>
              </div>
              <div className="text-2xl font-bold text-white">{dashboardData.system_status.online_karts}/{dashboardData.system_status.total_karts}</div>
            </div>
            <div className="card">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={16} className="text-[#94a3b8]" />
                <span className="text-[10px] text-[#94a3b8] uppercase tracking-wider">Système</span>
              </div>
              <div className={`text-sm font-bold ${
                dashboardData.system_status.system_health === 'good' ? 'text-emerald-500' :
                dashboardData.system_status.system_health === 'warning' ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {dashboardData.system_status.system_health.toUpperCase()}
              </div>
            </div>
          </div>
        )}

        {/* Karts Status */}
        {dashboardData.karts_status && (
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-4">Statut des Karts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {dashboardData.karts_status.map((kart) => (
                <div key={kart.id} className="card">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-sm font-medium text-white">{kart.name}</h3>
                      <p className="text-xs text-[#94a3b8]">{kart.driver}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(kart.status)}`}></div>
                  </div>
                  <div className="space-y-2">
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
                    <div className="text-xs text-[#94a3b8]">
                      Status: <span className="text-white capitalize">{kart.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Electrical Modules */}
        {dashboardData.electrical_modules && (
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-4">Modules Électriques</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.electrical_modules.map((module, index) => (
                <div key={index} className="card">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-sm font-medium text-white">{module.kart_id}</h3>
                      <p className="text-xs text-[#94a3b8] capitalize">{module.module_type.replace('_', ' ')}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(module.status)}`}></div>
                  </div>
                  <div className="space-y-1">
                    {module.battery_voltage && (
                      <div className="flex justify-between text-xs">
                        <span className="text-[#94a3b8]">Voltage</span>
                        <span className="text-white">{module.battery_voltage}V</span>
                      </div>
                    )}
                    {module.signal_strength && (
                      <div className="flex justify-between text-xs">
                        <span className="text-[#94a3b8]">Signal</span>
                        <span className="text-white">{module.signal_strength} dBm</span>
                      </div>
                    )}
                    {module.module_type === 'point_one' && module.data.satellites && (
                      <div className="flex justify-between text-xs">
                        <span className="text-[#94a3b8]">Satellites</span>
                        <span className="text-white">{module.data.satellites}</span>
                      </div>
                    )}
                    {module.module_type === 'uwb' && module.data.anchor_count && (
                      <div className="flex justify-between text-xs">
                        <span className="text-[#94a3b8]">Anchors</span>
                        <span className="text-white">{module.data.anchor_count}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDriverDashboard = () => {
    if (!dashboardData) return null;

    return (
      <div className="space-y-6">
        {/* User Stats */}
        {dashboardData.user_stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card">
              <div className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-widest mb-2">Total Tours</div>
              <div className="text-2xl font-bold text-white">{dashboardData.user_stats.total_laps.toLocaleString()}</div>
            </div>
            <div className="card">
              <div className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-widest mb-2">Meilleur Tour</div>
              <div className="text-2xl font-bold text-[#7bf8ac]">{dashboardData.user_stats.best_lap_time}s</div>
            </div>
            <div className="card">
              <div className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-widest mb-2">Vitesse Max</div>
              <div className="text-2xl font-bold text-white">{dashboardData.user_stats.top_speed} km/h</div>
            </div>
            <div className="card">
              <div className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-widest mb-2">Constance</div>
              <div className="text-2xl font-bold text-emerald-500">{dashboardData.user_stats.consistency}%</div>
            </div>
          </div>
        )}

        {/* Last Session Details */}
        {dashboardData.user_stats && (
          <div className="card">
            <h3 className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-widest mb-4">Dernière Session</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-[#262626]">
                  <span className="text-xs text-[#94a3b8]">Tour Moyen</span>
                  <span className="font-mono text-sm text-white">{dashboardData.user_stats.avg_lap_time}s</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-[#262626]">
                  <span className="text-xs text-[#94a3b8]">Vitesse Max</span>
                  <span className="font-mono text-sm text-white">{dashboardData.user_stats.top_speed} km/h</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-[#262626]">
                  <span className="text-xs text-[#94a3b8]">Constance</span>
                  <span className="font-mono text-sm text-emerald-500">{dashboardData.user_stats.consistency}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#94a3b8]">Dernière Session</span>
                  <span className="font-mono text-sm text-white">
                    {dashboardData.user_stats.last_session_date ?
                      new Date(dashboardData.user_stats.last_session_date).toLocaleDateString() :
                      'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMechanicDashboard = () => {
    if (!dashboardData) return null;

    return (
      <div className="space-y-6">
        {/* Karts Status */}
        {dashboardData.karts_status && (
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-4">État des Karts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dashboardData.karts_status.map((kart) => (
                <div key={kart.id} className="card">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-sm font-medium text-white">{kart.name}</h3>
                      <p className="text-xs text-[#94a3b8]">{kart.driver || 'Non assigné'}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-bold uppercase rounded ${
                      kart.status === 'online' ? 'bg-emerald-900 text-emerald-300' :
                      kart.status === 'charging' ? 'bg-blue-900 text-blue-300' :
                      kart.status === 'maintenance' ? 'bg-yellow-900 text-yellow-300' :
                      'bg-red-900 text-red-300'
                    }`}>
                      {kart.status}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-[#94a3b8]">Batterie</span>
                        <span className="text-xs text-white">{kart.battery_level}%</span>
                      </div>
                      <div className="w-full bg-[#262626] rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getBatteryColor(kart.battery_level)}`}
                          style={{ width: `${kart.battery_level}%` }}
                        ></div>
                      </div>
                    </div>
                    {kart.last_seen && (
                      <div className="text-xs text-[#94a3b8]">
                        Dernière vue: {new Date(kart.last_seen).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Electrical Modules */}
        {dashboardData.electrical_modules && (
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-4">Modules Électriques</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.electrical_modules.map((module, index) => (
                <div key={index} className="card">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-sm font-medium text-white">{module.kart_id}</h3>
                      <p className="text-xs text-[#94a3b8] capitalize">{module.module_type.replace('_', ' ')}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(module.status)}`}></div>
                  </div>
                  <div className="space-y-2">
                    {module.battery_voltage && (
                      <div className="flex justify-between items-center">
                        <Battery size={14} className="text-[#94a3b8]" />
                        <span className="text-xs text-white">{module.battery_voltage}V</span>
                      </div>
                    )}
                    {module.signal_strength && (
                      <div className="flex justify-between items-center">
                        <Wifi size={14} className="text-[#94a3b8]" />
                        <span className="text-xs text-white">{module.signal_strength} dBm</span>
                      </div>
                    )}
                    {module.module_type === 'battery_controller' && module.data.temperature && (
                      <div className="flex justify-between text-xs">
                        <span className="text-[#94a3b8]">Température</span>
                        <span className="text-white">{module.data.temperature}°C</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderObserverDashboard = () => {
    if (!dashboardData) return null;

    return (
      <div className="space-y-6">
        {/* Circuit Info Only */}
        {dashboardData.circuit_info && (
          <div className="card">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-widest mb-1">Circuit</h3>
                <div className="text-lg font-bold text-white">{dashboardData.circuit_info.name}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  dashboardData.circuit_info.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'
                }`}></span>
                <span className="text-[10px] font-medium text-emerald-500 uppercase tracking-wider">
                  {dashboardData.circuit_info.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{dashboardData.circuit_info.temperature}°C</div>
                <div className="text-xs text-[#94a3b8]">Température</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{dashboardData.circuit_info.humidity}%</div>
                <div className="text-xs text-[#94a3b8]">Humidité</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#7bf8ac]">{dashboardData.circuit_info.grip_level}</div>
                <div className="text-xs text-[#94a3b8]">Adhérence</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{dashboardData.circuit_info.active_karts}</div>
                <div className="text-xs text-[#94a3b8]">Karts Actifs</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCommissaireDashboard = () => {
    if (!dashboardData) return null;

    return (
      <div className="space-y-6">
        {/* Karts Status - vue commissaire */}
        {dashboardData.karts_status && (
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-4">Contrôle des Karts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.karts_status.map((kart) => (
                <div key={kart.id} className="card">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-sm font-medium text-white">{kart.name}</h3>
                      <p className="text-xs text-[#94a3b8]">{kart.driver || 'Non assigné'}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-bold uppercase rounded ${
                      kart.status === 'online' ? 'bg-emerald-900 text-emerald-300' :
                      kart.status === 'charging' ? 'bg-blue-900 text-blue-300' :
                      kart.status === 'maintenance' ? 'bg-yellow-900 text-yellow-300' :
                      'bg-red-900 text-red-300'
                    }`}>
                      {kart.status}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#94a3b8]">N° Kart</span>
                      <span className="text-xs text-white font-mono">{kart.id}</span>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-[#94a3b8]">Batterie</span>
                        <span className="text-xs text-white">{kart.battery_level}%</span>
                      </div>
                      <div className="w-full bg-[#262626] rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            kart.battery_level > 60 ? 'bg-emerald-500' :
                            kart.battery_level > 30 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${kart.battery_level}%` }}
                        ></div>
                      </div>
                    </div>
                    {kart.last_seen && (
                      <div className="text-xs text-[#94a3b8]">
                        Dernière activité: {new Date(kart.last_seen).toLocaleTimeString()}
                      </div>
                    )}
                    {kart.location && (
                      <div className="text-xs text-[#94a3b8]">
                        Position: X:{kart.location.x.toFixed(1)}, Y:{kart.location.y.toFixed(1)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Circuit Info */}
        {dashboardData.circuit_info && (
          <div className="card">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-widest mb-1">État du Circuit</h3>
                <div className="text-lg font-bold text-white">{dashboardData.circuit_info.name}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  dashboardData.circuit_info.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'
                }`}></span>
                <span className="text-[10px] font-medium text-emerald-500 uppercase tracking-wider">
                  {dashboardData.circuit_info.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{dashboardData.circuit_info.temperature}°C</div>
                <div className="text-xs text-[#94a3b8]">Température</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{dashboardData.circuit_info.humidity}%</div>
                <div className="text-xs text-[#94a3b8]">Humidité</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#7bf8ac]">{dashboardData.circuit_info.grip_level}</div>
                <div className="text-xs text-[#94a3b8]">Adhérence</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{dashboardData.circuit_info.active_karts}</div>
                <div className="text-xs text-[#94a3b8]">Karts Actifs</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDashboard = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Chargement du dashboard...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">{error}</div>
        </div>
      );
    }

    if (!dashboardData) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Aucune donnée disponible</div>
        </div>
      );
    }

    switch (dashboardData.user_role) {
      case 'admin':
        return renderAdminDashboard();
      case 'driver':
        return renderDriverDashboard();
      case 'mechanic':
        return renderMechanicDashboard();
      case 'observer':
        return renderObserverDashboard();
      case 'commissaire_piste':
        return renderCommissaireDashboard();
      default:
        return renderDriverDashboard(); // Fallback
    }
  };

  return (
    <div className="flex min-h-screen bg-base text-white font-display overflow-hidden relative">
      <Sidebar />

      <div className="flex-1 md:ml-11 ml-0 relative z-10 flex flex-col h-screen">
        <Header className="flex-shrink-0" />

        <main className="flex-1 overflow-y-auto">
          <div className="md:p-6 p-4 pb-20 md:pb-0">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-2xl font-semibold tracking-tight text-white">Dashboard</h1>
              <p className="text-[#94a3b8] text-sm mt-1">
                Vue pour <span className="text-white font-medium">{userName}</span>
                {dashboardData && (
                  <span className="ml-2 px-2 py-1 bg-[#1c1f26] text-xs font-medium rounded border border-[#262626] capitalize text-[#94a3b8]">
                    {dashboardData.user_role}
                  </span>
                )}
              </p>
            </div>

            {/* Dashboard Content */}
            {renderDashboard()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;
