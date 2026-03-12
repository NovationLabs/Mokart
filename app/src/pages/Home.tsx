import React, { useState, useEffect } from 'react';
// Global style import handled in index.tsx
import Header from '../components/Header';
import { DashboardSkeleton } from '../components/Skeleton';
import { User, Smartphone, Activity, Zap, Map, Users, Battery, Wifi, Trophy, Gauge, Flag, Menu, Search, Bell, Play, TrendingUp, Droplets } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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

    // Données pour le graphique d'évolution des performances
    const performanceData = [
      { session: 'S01', time: 52.4 },
      { session: 'S02', time: 55.6 },
      { session: 'S03', time: 53.3 },
      { session: 'S04', time: 50.3 },
      { session: 'S05', time: 52.3 },
      { session: 'S06', time: 51.3 },
      { session: 'S07', time: 48.8 },
      { session: 'S08', time: 48.3 },
      { session: 'S09', time: 48.3 },
      { session: 'S10', time: 48.3 },
    ];

    return (
      <div className="space-y-6">
        {/* En-tête avec salutation et bouton de démarrage */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Bonjour Jean</h1>
            <p className="text-[#94a3b8] text-sm">Prêt pour une nouvelle session ?</p>
          </div>
          <button className="bg-[#7bf8ac] hover:bg-[#6fe89c] text-black font-bold py-3 px-6 rounded-lg transition-all duration-200 flex items-center gap-2">
            <Play className="w-5 h-5" />
            DÉMARRER UNE SESSION
          </button>
        </div>

        {/* Section Mes Records */}
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-4">Mes Records</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Meilleur Tour */}
            <div className="card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-500/20 to-transparent rounded-bl-full"></div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy size={16} className="text-yellow-500" />
                  <span className="text-[10px] text-[#94a3b8] uppercase tracking-wider">Meilleur Tour (Record Personnel)</span>
                </div>
                <div className="text-2xl font-bold text-white">48.2s</div>
                <div className="text-xs text-[#7bf8ac] mt-1">+1.2% ce mois</div>
              </div>
            </div>

            {/* Vitesse Max */}
            <div className="card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-transparent rounded-bl-full"></div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Gauge size={16} className="text-blue-500" />
                  <span className="text-[10px] text-[#94a3b8] uppercase tracking-wider">Vitesse Max</span>
                </div>
                <div className="text-2xl font-bold text-white">84 km/h</div>
                <div className="text-xs text-[#94a3b8] mt-1">En ligne droite</div>
              </div>
            </div>

            {/* Constance */}
            <div className="card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-bl-full"></div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} className="text-emerald-500" />
                  <span className="text-[10px] text-[#94a3b8] uppercase tracking-wider">Constance (Moyenne)</span>
                </div>
                <div className="text-2xl font-bold text-emerald-500">94%</div>
                <div className="text-xs text-[#94a3b8] mt-1">Très stable</div>
              </div>
            </div>

            {/* Total Tours */}
            <div className="card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#7bf8ac]/20 to-transparent rounded-bl-full"></div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Flag size={16} className="text-[#7bf8ac]" />
                  <span className="text-[10px] text-[#94a3b8] uppercase tracking-wider">Total Tours</span>
                </div>
                <div className="text-2xl font-bold text-white">1248</div>
                <div className="text-xs text-[#7bf8ac] mt-1">+12% ce mois</div>
              </div>
            </div>
          </div>
        </div>

        {/* Évolution des Performances */}
        <div className="card">
          <h3 className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-widest mb-4">
            ÉVOLUTION DES PERFORMANCES (TEMPS AU TOUR)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis
                  dataKey="session"
                  stroke="#94a3b8"
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fontSize: 10 }}
                  domain={[48, 60]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#16181d',
                    border: '1px solid #262626',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#94a3b8', fontSize: 10 }}
                  itemStyle={{ color: '#7bf8ac' }}
                />
                <Line
                  type="monotone"
                  dataKey="time"
                  stroke="#7bf8ac"
                  strokeWidth={2}
                  dot={{ fill: '#7bf8ac', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center">
            <span className="text-xs text-[#94a3b8]">Dernière session: </span>
            <span className="text-sm font-bold text-white">S10: 48.3s</span>
          </div>
        </div>

        {/* Résumé Dernière Session et États */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Résumé Dernière Session */}
          <div className="lg:col-span-2 card">
            <h3 className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-widest mb-4">
              RÉSUMÉ: DERNIÈRE SESSION (10/03/2026)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-[#1c1f26] rounded-lg">
                <div className="text-lg font-bold text-white">52.4s</div>
                <div className="text-xs text-[#94a3b8]">Temps Moyen</div>
              </div>
              <div className="text-center p-3 bg-[#1c1f26] rounded-lg">
                <div className="text-lg font-bold text-white">84 km/h</div>
                <div className="text-xs text-[#94a3b8]">Vitesse Max</div>
              </div>
              <div className="text-center p-3 bg-[#1c1f26] rounded-lg">
                <div className="text-lg font-bold text-white">25</div>
                <div className="text-xs text-[#94a3b8]">Tours</div>
              </div>
              <div className="text-center p-3 bg-[#1c1f26] rounded-lg">
                <div className="text-lg font-bold text-emerald-500">94%</div>
                <div className="text-xs text-[#94a3b8]">Constance</div>
              </div>
            </div>
            <button className="w-full bg-[#1c1f26] border border-[#262626] text-white font-medium py-3 px-4 rounded-lg hover:bg-[#262626] transition-all duration-200 text-sm">
              ANALYSER LA SESSION DÉTAILLÉE
            </button>
          </div>

          {/* États et Conditions */}
          <div className="card">
            <h3 className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-widest mb-4">
              ÉTATS ET CONDITIONS
            </h3>
            <div className="space-y-4">
              {/* Kart Status */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-white">SodiKart RT8-1</span>
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-[#94a3b8]">BATTERIE</span>
                    <span className="text-xs text-white">85%</span>
                  </div>
                  <div className="w-full bg-[#262626] rounded-full h-2">
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: '85%' }}></div>
                  </div>
                </div>
              </div>

              {/* Conditions Environnementales */}
              <div className="border-t border-[#262626] pt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-orange-500 text-xs">°C</span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">24°C</div>
                      <div className="text-xs text-[#94a3b8]">Temp. Circuit</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Droplets className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">42%</div>
                      <div className="text-xs text-[#94a3b8]">Humidité</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Réalisations Récentes */}
        <div className="card">
          <h3 className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-widest mb-4">
            RÉALISATIONS RÉCENTES
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-[#1c1f26] rounded-lg">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <Trophy className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">Tour Record</div>
                <div className="text-xs text-[#94a3b8]">Meilleur temps personnel</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-[#1c1f26] rounded-lg">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">Progression</div>
                <div className="text-xs text-[#94a3b8]">-15% de mois</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-[#1c1f26] rounded-lg">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Gauge className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">Constance</div>
                <div className="text-xs text-[#94a3b8]">94% de régularité</div>
              </div>
            </div>
          </div>
        </div>
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
        {/* Circuit Overview */}
        {dashboardData.circuit_info && (
          <div className="card relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#7bf8ac]/10 to-transparent rounded-bl-full"></div>
            <div className="relative">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Map size={14} />
                    Vue Circuit
                  </h3>
                  <div className="text-2xl font-bold text-white">{dashboardData.circuit_info.name}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    dashboardData.circuit_info.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'
                  } animate-pulse`}></div>
                  <span className="text-sm font-medium text-emerald-500 uppercase tracking-wider">
                    {dashboardData.circuit_info.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-[#1c1f26] rounded-lg">
                  <div className="text-2xl font-bold text-white">{dashboardData.circuit_info.temperature}°C</div>
                  <div className="text-xs text-[#94a3b8]">Température</div>
                </div>
                <div className="text-center p-4 bg-[#1c1f26] rounded-lg">
                  <div className="text-2xl font-bold text-white">{dashboardData.circuit_info.humidity}%</div>
                  <div className="text-xs text-[#94a3b8]">Humidité</div>
                </div>
                <div className="text-center p-4 bg-[#1c1f26] rounded-lg">
                  <div className="text-2xl font-bold text-[#7bf8ac]">{dashboardData.circuit_info.grip_level}</div>
                  <div className="text-xs text-[#94a3b8]">Adhérence</div>
                </div>
                <div className="text-center p-4 bg-[#1c1f26] rounded-lg">
                  <div className="text-2xl font-bold text-white">{dashboardData.circuit_info.active_karts}</div>
                  <div className="text-xs text-[#94a3b8]">Karts Actifs</div>
                </div>
              </div>

              {/* Circuit Map Placeholder */}
              <div className="bg-[#1c1f26] rounded-lg p-6 h-48 flex items-center justify-center">
                <div className="text-center">
                  <Map size={32} className="text-[#94a3b8] mx-auto mb-3" />
                  <div className="text-sm text-[#94a3b8]">Carte du circuit en temps réel</div>
                  <div className="text-xs text-white mt-1">Positions des karts et trajectoires</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Racing Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Session */}
          <div className="lg:col-span-2 card">
            <h3 className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity size={14} />
              Session en Cours
            </h3>

            {/* Session Timer */}
            <div className="bg-[#1c1f26] rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-[#94a3b8]">Temps de session</div>
                  <div className="text-2xl font-mono font-bold text-white">14:32</div>
                </div>
                <div>
                  <div className="text-sm text-[#94a3b8]">Tours complétés</div>
                  <div className="text-2xl font-bold text-[#7bf8ac]">47</div>
                </div>
                <div>
                  <div className="text-sm text-[#94a3b8]">Meilleur tour</div>
                  <div className="text-2xl font-bold text-white">48.2s</div>
                </div>
              </div>
            </div>

            {/* Live Leaderboard */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs text-[#94a3b8] font-bold uppercase tracking-wider">
                <span>Position</span>
                <span>Pilote</span>
                <span>Kart</span>
                <span>Dernier Tour</span>
                <span>Écart</span>
              </div>

              {[
                { pos: 1, driver: "Jean Pilot", kart: "KRT8-1", lastLap: "48.2s", gap: "LIDER" },
                { pos: 2, driver: "Marie Racer", kart: "KRT8-2", lastLap: "48.5s", gap: "+0.3s" },
                { pos: 3, driver: "Pierre Speed", kart: "KRT8-3", lastLap: "48.8s", gap: "+0.6s" },
                { pos: 4, driver: "Sophie Fast", kart: "KRT8-4", lastLap: "49.1s", gap: "+0.9s" }
              ].map((position) => (
                <div key={position.pos} className="flex justify-between items-center p-3 bg-[#1c1f26] rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      position.pos === 1 ? 'bg-yellow-500 text-black' :
                      position.pos === 2 ? 'bg-gray-400 text-black' :
                      position.pos === 3 ? 'bg-orange-600 text-white' :
                      'bg-[#262626] text-white'
                    }`}>
                      {position.pos}
                    </div>
                    <span className="text-sm font-medium text-white">{position.driver}</span>
                  </div>
                  <span className="text-xs text-[#94a3b8]">{position.kart}</span>
                  <span className="text-sm font-mono text-white">{position.lastLap}</span>
                  <span className={`text-xs font-bold ${
                    position.gap === "LIDER" ? 'text-[#7bf8ac]' : 'text-white'
                  }`}>
                    {position.gap}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card">
            <h3 className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <Zap size={14} />
              Statistiques Live
            </h3>
            <div className="space-y-4">
              <div className="p-3 bg-[#1c1f26] rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-[#94a3b8]">Vitesse moyenne</span>
                </div>
                <div className="text-xl font-bold text-white">67.3 km/h</div>
              </div>

              <div className="p-3 bg-[#1c1f26] rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-[#94a3b8]">Tours/minute</span>
                </div>
                <div className="text-xl font-bold text-white">3.2</div>
              </div>

              <div className="p-3 bg-[#1c1f26] rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-[#94a3b8]">Constance moyenne</span>
                </div>
                <div className="text-xl font-bold text-white">91.2%</div>
              </div>

              <button className="w-full bg-gradient-to-r from-[#7bf8ac] to-emerald-600 text-black font-bold py-3 px-4 rounded-lg hover:from-emerald-600 hover:to-[#7bf8ac] transition-all duration-200 text-sm mt-4">
                Voir Session Complète
              </button>
            </div>
          </div>
        </div>

        {/* Weather & Track Conditions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weather Forecast */}
          <div className="card">
            <h3 className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity size={14} />
              Conditions Météo
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-[#1c1f26] rounded-lg">
                <div className="text-xs text-[#94a3b8] mb-1">Maintenant</div>
                <div className="text-lg mb-1">☀️</div>
                <div className="text-sm font-bold text-white">24°C</div>
              </div>
              <div className="text-center p-3 bg-[#1c1f26] rounded-lg">
                <div className="text-xs text-[#94a3b8] mb-1">+2h</div>
                <div className="text-lg mb-1">⛅</div>
                <div className="text-sm font-bold text-white">22°C</div>
              </div>
              <div className="text-center p-3 bg-[#1c1f26] rounded-lg">
                <div className="text-xs text-[#94a3b8] mb-1">+4h</div>
                <div className="text-lg mb-1">🌤️</div>
                <div className="text-sm font-bold text-white">20°C</div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-[#1c1f26] rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs text-[#94a3b8]">Vent</div>
                  <div className="text-sm font-bold text-white">12 km/h NE</div>
                </div>
                <div>
                  <div className="text-xs text-[#94a3b8]">Pression</div>
                  <div className="text-sm font-bold text-white">1013 hPa</div>
                </div>
              </div>
            </div>
          </div>

          {/* Track Evolution */}
          <div className="card">
            <h3 className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <Map size={14} />
              Évolution Piste
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-[#94a3b8]">Grip actuel</span>
                  <span className="text-xs text-white font-bold">87%</span>
                </div>
                <div className="w-full bg-[#262626] rounded-full h-2">
                  <div className="h-2 rounded-full bg-[#7bf8ac]" style={{ width: '87%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-[#94a3b8]">Prévision +1h</span>
                  <span className="text-xs text-white font-bold">92%</span>
                </div>
                <div className="w-full bg-[#262626] rounded-full h-2">
                  <div className="h-2 rounded-full bg-emerald-500" style={{ width: '92%' }}></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="text-center p-2 bg-[#1c1f26] rounded">
                  <div className="text-xs text-[#94a3b8]">Température piste</div>
                  <div className="text-sm font-bold text-white">28°C</div>
                </div>
                <div className="text-center p-2 bg-[#1c1f26] rounded">
                  <div className="text-xs text-[#94a3b8]">Optimale</div>
                  <div className="text-sm font-bold text-emerald-500">Oui</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Historical Highlights */}
        <div className="card">
          <h3 className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
            <Zap size={14} />
            Moments Forts du Jour
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-[#1c1f26] rounded-lg">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <span className="text-yellow-500">🏆</span>
              </div>
              <div>
                <div className="text-sm font-medium text-white">Meilleur Tour</div>
                <div className="text-xs text-[#94a3b8]">Jean Pilot - 47.8s</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-[#1c1f26] rounded-lg">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <span className="text-red-500">⚡</span>
              </div>
              <div>
                <div className="text-sm font-medium text-white">Vitesse Max</div>
                <div className="text-xs text-[#94a3b8]">Marie Racer - 89 km/h</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-[#1c1f26] rounded-lg">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <span className="text-blue-500">📊</span>
              </div>
              <div>
                <div className="text-sm font-medium text-white">Sessions Aujourd'hui</div>
                <div className="text-xs text-[#94a3b8]">12 sessions complètes</div>
              </div>
            </div>
          </div>
        </div>
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
      return <DashboardSkeleton />;
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
    <div className="flex-1 md:ml-11 ml-0 relative z-10 flex flex-col h-screen">
      <Header className="flex-shrink-0" />

      <main className="flex-1 overflow-y-auto">
        <div className="md:p-6 p-4 pb-20 md:pb-0">
            {/* Dashboard Content */}
            {renderDashboard()}
        </div>
      </main>
    </div>
  );
};

export default Home;
