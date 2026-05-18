import React, { useState, useEffect } from 'react';
// Global style import handled in index.tsx
import Header from '../components/Header';
import { DashboardSkeleton } from '../components/Skeleton';
import { User, Smartphone, Activity, Zap, Map, Users, Battery, Wifi, Trophy, Gauge, Flag, Menu, Search, Bell, Play, TrendingUp, Droplets, UserPlus, Share2, BarChart3, ArrowRight, Star, Brain, ArrowUpRight, Thermometer, Calendar, MapPin, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardService } from '../services/dashboardService';
import { DashboardData } from '../types/dashboard';

const Home: React.FC = () => {
  const [userName, setUserName] = useState('');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // États pour le graphique d'évolution des performances du Pilote
  const [selectedPilots, setSelectedPilots] = useState([
    {
      name: "Jean (Moi)",
      sessions: 10,
      data: [
        { session: 'S01', time: 52.4 }, { session: 'S02', time: 55.6 }, { session: 'S03', time: 53.3 },
        { session: 'S04', time: 50.3 }, { session: 'S05', time: 52.3 }, { session: 'S06', time: 51.3 },
        { session: 'S07', time: 48.8 }, { session: 'S08', time: 48.3 }, { session: 'S09', time: 48.3 },
        { session: 'S10', time: 48.3 },
      ],
      color: "#7bf8ac",
      enabled: true
    },
    {
      name: "Marie Racer",
      sessions: 25,
      data: [
        { session: 'S01', time: 54.2 }, { session: 'S02', time: 53.8 }, { session: 'S03', time: 52.1 },
        { session: 'S04', time: 51.5 }, { session: 'S05', time: 50.8 }, { session: 'S06', time: 50.2 },
        { session: 'S07', time: 49.6 }, { session: 'S08', time: 49.1 }, { session: 'S09', time: 48.9 },
        { session: 'S10', time: 48.7 },
      ],
      color: "#f59e0b",
      enabled: false
    },
    {
      name: "Pierre Speed",
      sessions: 8,
      data: [
        { session: 'S01', time: 56.1 }, { session: 'S02', time: 54.3 }, { session: 'S03', time: 52.8 },
        { session: 'S04', time: 51.2 }, { session: 'S05', time: 50.1 }, { session: 'S06', time: 49.5 },
        { session: 'S07', time: 49.0 }, { session: 'S08', time: 48.8 },
      ],
      color: "#3b82f6",
      enabled: false
    }
  ]);

  const togglePilot = (index: number) => {
    setSelectedPilots((prev: any[]) => prev.map((pilot: any, i: number) =>
      i === index ? { ...pilot, enabled: !pilot.enabled } : pilot
    ));
  };

  const createChartData = () => {
    const enabledPilots = selectedPilots.filter((p: any) => p.enabled);
    if (enabledPilots.length === 0) return [];
    const maxSessions = Math.max(...enabledPilots.map((p: any) => p.sessions));
    const chartData = [];
    for (let i = 1; i <= maxSessions; i++) {
      const sessionLabel = `S${i.toString().padStart(2, '0')}`;
      const dataPoint: any = { session: sessionLabel };
      enabledPilots.forEach((pilot: any) => {
        if (i <= pilot.sessions) {
          const sessionData = pilot.data.find((d: any) => d.session === sessionLabel);
          if (sessionData) dataPoint[pilot.name] = sessionData.time;
        }
      });
      chartData.push(dataPoint);
    }
    return chartData;
  };

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
    return (
      <div className="space-y-8">

        {/* ROW 1: Hero + Quick Stats */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* HERO BANNER (Span 2) */}
          <div className="xl:col-span-2 card relative overflow-hidden p-8 md:p-10 flex flex-col justify-center">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#4F46E5]/20 rounded-full blur-[80px]"></div>
            <div className="absolute right-40 -bottom-20 w-64 h-64 bg-[#A855F7]/20 rounded-full blur-[80px]"></div>

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <div className="max-w-lg">
                <div className="inline-flex items-center px-3 py-1 bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                  <TrendingUp className="w-4 h-4 mr-1.5" /> Progression +12%
                </div>
                <h2 className="text-4xl font-black text-white mb-4 leading-tight">
                  Ton dernier run était <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F46E5] to-[#0EA5E9]">exceptionnel.</span>
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                  Session S-442 : Tu as amélioré ton temps de 0.421s. Ton freinage tardif au T3 te place dans le Top 5% du circuit.
                </p>
                <button className="px-6 py-3 bg-white text-black hover:bg-gray-200 rounded-xl text-sm font-bold transition-all flex items-center">
                  Analyser la session <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>

              {/* Large Lap Time Display */}
              <div className="flex-shrink-0 flex flex-col items-end">
                <span className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Meilleur Tour</span>
                <div className="font-mono font-black text-7xl text-white tracking-tighter" style={{ textShadow: '0 0 40px rgba(255,255,255,0.1)' }}>
                  44<span className="text-5xl text-gray-400">.182</span>
                </div>
                <div className="flex gap-2 mt-4">
                  <div className="px-3 py-1 bg-[#A855F7]/20 border border-[#A855F7]/30 rounded-md text-[#A855F7] font-bold text-xs font-mono shadow-[0_0_10px_rgba(168,85,247,0.2)]">S1 P.B.</div>
                  <div className="px-3 py-1 bg-[#10B981]/20 border border-[#10B981]/30 rounded-md text-[#10B981] font-bold text-xs font-mono">S2 P.B.</div>
                  <div className="px-3 py-1 bg-[#10B981]/20 border border-[#10B981]/30 rounded-md text-[#10B981] font-bold text-xs font-mono">S3 P.B.</div>
                </div>
              </div>
            </div>
          </div>

          {/* STATS STACK (Span 1) */}
          <div className="flex flex-col gap-4">
            <div className="card p-6 flex items-center justify-between flex-1">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Niveau Pilote</p>
                <h3 className="text-2xl font-black text-white">Lvl. 42</h3>
                <div className="w-full bg-[#222222] h-1.5 rounded-full mt-3 w-32">
                  <div className="bg-gradient-to-r from-[#4F46E5] to-[#A855F7] h-full rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#151515] border border-[#222222] flex items-center justify-center">
                <Star className="w-6 h-6 text-[#F59E0B] fill-[#F59E0B]" />
              </div>
            </div>

            <div className="card p-6 flex items-center justify-between flex-1">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Classement</p>
                <h3 className="text-2xl font-black text-white">Top 8%</h3>
                <p className="text-xs text-[#10B981] mt-1 font-semibold flex items-center"><ArrowUpRight className="w-3 h-3 mr-1" /> +2 places</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#151515] border border-[#222222] flex items-center justify-center">
                <Trophy className="w-6 h-6 text-gray-400" />
              </div>
            </div>

            <div className="card p-6 flex items-center justify-between flex-1">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Score IA</p>
                <h3 className="text-2xl font-black text-[#0EA5E9] font-mono">A+</h3>
                <p className="text-xs text-gray-500 mt-1">Précision trajectoire</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#151515] border border-[#222222] flex items-center justify-center">
                <Brain className="w-6 h-6 text-[#0EA5E9]" />
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2 - ACTIONS / RÉSERVATION (Booking Block) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Action 1 : Réserver au circuit habituel */}
          <div className="card relative overflow-hidden group cursor-pointer border border-[#222222] hover:border-[#10B981]/40 transition-all duration-300 p-0">
            <div className="absolute inset-0 bg-gradient-to-br from-[#10B981]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="p-6 relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div className="inline-flex items-center px-2 py-1 bg-[#151515] border border-[#222222] text-gray-300 rounded text-[10px] font-bold uppercase tracking-wider">
                    <Clock className="w-3 h-3 mr-1.5 text-[#10B981]" /> Piste Habituée
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#151515] border border-[#222222] flex items-center justify-center group-hover:bg-[#10B981] group-hover:text-black group-hover:border-[#10B981] transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mt-3">Mokart Strasbourg Indoor</h3>
                <p className="text-sm text-gray-500 mt-1">Dernière session : Il y a 3 jours</p>
              </div>

              <button className="w-full mt-6 py-3 bg-[#10B981] text-black font-bold rounded-xl hover:bg-[#059669] transition-colors flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <Calendar className="w-4 h-4 mr-2" /> Réserver mon prochain run
              </button>
            </div>
          </div>

          {/* Action 2 : Découvrir un nouveau centre */}
          <div className="card relative overflow-hidden group cursor-pointer border border-[#222222] hover:border-[#3B82F6]/40 transition-all duration-300 p-0">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
            <div className="absolute inset-0 bg-gradient-to-tl from-[#3B82F6]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="p-6 relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div className="inline-flex items-center px-2 py-1 bg-[#151515] border border-[#222222] text-gray-300 rounded text-[10px] font-bold uppercase tracking-wider">
                    <MapPin className="w-3 h-3 mr-1.5 text-[#3B82F6]" /> Exploration
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#151515] border border-[#222222] flex items-center justify-center group-hover:bg-[#3B82F6] group-hover:text-white group-hover:border-[#3B82F6] transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mt-3">Trouver un nouveau circuit</h3>
                <p className="text-sm text-gray-500 mt-1">Défie tes amis sur des tracés inédits.</p>
              </div>

              <button className="w-full mt-6 py-3 bg-transparent border border-[#3B82F6] text-[#3B82F6] font-bold rounded-xl hover:bg-[#3B82F6] hover:text-white transition-all flex items-center justify-center">
                <Search className="w-4 h-4 mr-2" /> Explorer la carte
              </button>
            </div>
          </div>

        </div>

        {/* ROW 3: Mes Records (Stats globales) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-5 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-full bg-gradient-to-l from-[#F59E0B]/10 to-transparent"></div>
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={16} className="text-[#F59E0B]" />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Record Personnel</span>
            </div>
            <div className="text-2xl font-black text-white font-mono">48.2s</div>
            <div className="text-xs text-[#10B981] mt-1 font-medium">+1.2% ce mois</div>
          </div>

          <div className="card p-5 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-full bg-gradient-to-l from-[#3B82F6]/10 to-transparent"></div>
            <div className="flex items-center gap-2 mb-2">
              <Gauge size={16} className="text-[#3B82F6]" />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Vitesse Max</span>
            </div>
            <div className="text-2xl font-black text-white font-mono">84 <span className="text-sm text-gray-500">km/h</span></div>
            <div className="text-xs text-gray-500 mt-1 font-medium">En ligne droite</div>
          </div>

          <div className="card p-5 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-full bg-gradient-to-l from-[#10B981]/10 to-transparent"></div>
            <div className="flex items-center gap-2 mb-2">
              <Activity size={16} className="text-[#10B981]" />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Constance</span>
            </div>
            <div className="text-2xl font-black text-white font-mono">94%</div>
            <div className="text-xs text-gray-500 mt-1 font-medium">Très stable</div>
          </div>

          <div className="card p-5 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-full bg-gradient-to-l from-[#A855F7]/10 to-transparent"></div>
            <div className="flex items-center gap-2 mb-2">
              <Flag size={16} className="text-[#A855F7]" />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Total Tours</span>
            </div>
            <div className="text-2xl font-black text-white font-mono">1 248</div>
            <div className="text-xs text-[#10B981] mt-1 font-medium">+12% ce mois</div>
          </div>
        </div>

        {/* ROW 4: Chart & Recent */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Graphique Progression (2/3) */}
          <div className="xl:col-span-2 card p-6 md:p-8 flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h3 className="text-xl font-bold text-white">Évolution des temps</h3>
                <p className="text-sm text-gray-500 mt-1">10 dernières sessions sur Circuit Loisir</p>
              </div>
              <div className="flex flex-col items-end gap-3">
                {/* Minimalist Tabs */}
                <div className="flex bg-[#151515] p-1 rounded-xl border border-[#222222]">
                  <button className="px-4 py-1.5 bg-[#0e0e0e] border border-[#222222]/50 rounded-lg text-sm font-bold text-white shadow-sm">Loisir</button>
                  <button className="px-4 py-1.5 text-sm font-bold text-gray-500 hover:text-white transition-colors">Pro</button>
                </div>
                {/* Toggles pour les amis */}
                <div className="flex gap-2">
                  {selectedPilots.map((pilot, index) => (
                    <button
                      key={index}
                      onClick={() => togglePilot(index)}
                      className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all flex items-center ${pilot.enabled ? 'text-white' : 'border-[#222222] text-gray-500 hover:border-gray-500'}`}
                      style={{
                        backgroundColor: pilot.enabled ? `${pilot.color}15` : 'transparent',
                        borderColor: pilot.enabled ? `${pilot.color}40` : ''
                      }}
                    >
                      <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: pilot.enabled ? pilot.color : '#3f3f46' }}></span>
                      {pilot.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-1 relative min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={createChartData()}>
                  <CartesianGrid strokeDasharray="5 5" stroke="#1a1a1a" vertical={false} />
                  <XAxis dataKey="session" stroke="#71717a" tick={{ fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#71717a" tick={{ fontSize: 11, fontFamily: 'Fira Code, monospace', color: '#71717a' }} domain={['dataMin - 1', 'dataMax + 1']} axisLine={false} tickLine={false} tickFormatter={(value: number) => value.toFixed(1) + 's'} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#151515', border: '1px solid #222', borderRadius: '12px', padding: '16px' }}
                    labelStyle={{ color: '#a1a1aa', fontSize: 12, fontWeight: 600, fontFamily: 'Outfit' }}
                    content={({ payload, label }: any) => {
                      if (payload && payload.length) {
                        return (
                          <div>
                            <div style={{ color: '#a1a1aa', fontSize: 12, marginBottom: 8 }}>Session {label}</div>
                            {payload.map((entry: any, index: number) => (
                              <div key={index} className="flex items-center justify-between gap-4 mb-1">
                                <span style={{ color: entry.color, fontSize: 12, fontWeight: 600 }}>{entry.name}</span>
                                <span style={{ fontFamily: 'Fira Code, monospace', fontWeight: 700, fontSize: 14, color: '#fff' }}>{entry.value}s</span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {selectedPilots.filter((p: any) => p.enabled).map((pilot: any, index: number) =>
                    <Line key={index} type="monotone" dataKey={pilot.name} stroke={pilot.color} strokeWidth={3} dot={{ fill: '#0e0e0e', stroke: pilot.color, strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: pilot.color, stroke: '#fff' }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Historique Compact (1/3) */}
          <div className="card p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Sessions Récentes</h3>
              <button className="text-[#4F46E5] hover:text-white transition-colors p-2 bg-[#151515] rounded-lg">
                <Menu className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-2">
              <div className="p-4 rounded-2xl bg-[#151515] border border-[#222222]/50 hover:border-[#4F46E5]/30 transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#4F46E5] shadow-[0_0_8px_#4F46E5]"></div>
                    <span className="text-sm font-bold text-white">Session S-442</span>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">Hier, 14:30</span>
                </div>
                <div className="flex justify-between items-end">
                  <div className="flex gap-3">
                    <span className="text-xs font-mono text-gray-400 bg-[#0e0e0e] px-2 py-1 rounded-md border border-[#222222]"><Activity className="w-3 h-3 mr-1 inline" />K-04</span>
                    <span className="text-xs font-mono text-gray-400 bg-[#0e0e0e] px-2 py-1 rounded-md border border-[#222222]">15 Laps</span>
                  </div>
                  <span className="font-mono text-lg font-black text-[#A855F7]">44.182</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#151515]/50 border border-transparent hover:border-[#222222] transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                    <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">Session S-390</span>
                  </div>
                  <span className="text-xs text-gray-600 font-medium">12 Mai</span>
                </div>
                <div className="flex justify-between items-end">
                  <div className="flex gap-3 opacity-70 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs font-mono text-gray-500 bg-[#0e0e0e] px-2 py-1 rounded-md border border-transparent">K-12</span>
                    <span className="text-xs font-mono text-gray-500 bg-[#0e0e0e] px-2 py-1 rounded-md border border-transparent">12 Laps</span>
                  </div>
                  <span className="font-mono text-lg font-bold text-gray-400">44.603</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#151515]/50 border border-transparent hover:border-[#222222] transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#EF4444]"></div>
                    <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">Session S-345</span>
                  </div>
                  <span className="text-xs text-gray-600 font-medium">05 Mai</span>
                </div>
                <div className="flex justify-between items-end">
                  <div className="flex gap-3 opacity-70 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs font-mono text-gray-500 bg-[#0e0e0e] px-2 py-1 rounded-md border border-transparent">K-07</span>
                    <span className="text-xs font-mono text-gray-500 bg-[#0e0e0e] px-2 py-1 rounded-md border border-transparent">4 Laps</span>
                  </div>
                  <span className="font-mono text-lg font-bold text-gray-500">52.190</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 5: Leaderboard Amis & Conditions du Kart */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

          {/* Concurrence Amis (Span 2) */}
          <div className="xl:col-span-2 card p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2"><Users className="w-5 h-5 text-[#10B981]" /> Concurrence Amis</h3>
                <p className="text-sm text-gray-500">Classement actuel de ton groupe</p>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-[#151515] border border-[#222222] hover:border-gray-500 rounded-lg text-sm font-bold text-white transition-colors flex items-center">
                  <Share2 className="w-4 h-4 mr-2" /> Partager
                </button>
                <button className="px-4 py-2 bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20 rounded-lg text-sm font-bold transition-colors flex items-center">
                  <UserPlus className="w-4 h-4 mr-2" /> Inviter
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#222222] text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="p-3 pl-0">Position</th>
                    <th className="p-3">Pilote</th>
                    <th className="p-3">Meilleur Tour</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { pos: 1, name: "VOUS (Jean)", time: "48.2s", gap: "-", color: "bg-[#7bf8ac]", text: "text-black" },
                    { pos: 2, name: "Marie Racer", time: "48.5s", gap: "+0.3s", color: "bg-gray-400", text: "text-black" },
                    { pos: 3, name: "Pierre Speed", time: "48.8s", gap: "+0.6s", color: "bg-[#f59e0b]", text: "text-white" },
                    { pos: 4, name: "Sophie Fast", time: "49.1s", gap: "+0.9s", color: "bg-[#222222]", text: "text-gray-400" },
                    { pos: 5, name: "Lucas Bolt", time: "49.5s", gap: "+1.3s", color: "bg-[#222222]", text: "text-gray-400" }
                  ].map((row, i) => (
                    <tr key={i} className={`border-b border-[#222222]/50 hover:bg-[#151515] transition-colors ${row.pos === 1 ? 'bg-[#7bf8ac]/5' : ''}`}>
                      <td className="p-3 pl-0">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${row.color} ${row.text}`}>
                          {row.pos}
                        </div>
                      </td>
                      <td className={`p-3 font-medium ${row.pos === 1 ? 'text-[#7bf8ac]' : 'text-white'}`}>{row.name}</td>
                      <td className="p-3">
                        <span className="font-mono text-white font-bold">{row.time}</span>
                        {row.gap !== "-" && <span className="ml-2 text-xs font-mono text-gray-500">{row.gap}</span>}
                      </td>
                      <td className="p-3">
                        <button className="text-gray-500 hover:text-white transition-colors">
                          <BarChart3 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* États et conditions (Span 1) */}
          <div className="card p-6 flex flex-col">
             <h3 className="text-xl font-bold text-white mb-6">États et Conditions</h3>

             {/* Kart Status */}
             <div className="bg-[#151515] border border-[#222222] rounded-xl p-4 mb-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-white">SodiKart RT8-1</h4>
                    <p className="text-xs text-gray-500">Kart assigné</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]"></div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400 flex items-center"><Battery className="w-3 h-3 mr-1" /> Batterie</span>
                    <span className="text-xs font-mono text-white font-bold">85%</span>
                  </div>
                  <div className="w-full bg-[#222222] rounded-full h-1.5">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
             </div>

             {/* Track Conditions */}
             <div className="bg-[#151515] border border-[#222222] rounded-xl p-4 flex-1">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Piste</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#EAB308]/10 text-[#EAB308] flex items-center justify-center">
                        <Thermometer className="w-4 h-4" />
                      </div>
                      <span className="text-sm text-gray-300">Temp. Circuit</span>
                    </div>
                    <span className="text-lg font-bold text-white">24°C</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/10 text-[#3B82F6] flex items-center justify-center">
                        <Droplets className="w-4 h-4" />
                      </div>
                      <span className="text-sm text-gray-300">Humidité</span>
                    </div>
                    <span className="text-lg font-bold text-white">42%</span>
                  </div>
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
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-[10px] sm:text-sm text-[#94a3b8]">Temps de session</div>
                  <div className="text-lg sm:text-2xl font-mono font-bold text-white">14:32</div>
                </div>
                <div>
                  <div className="text-[10px] sm:text-sm text-[#94a3b8]">Tours complétés</div>
                  <div className="text-lg sm:text-2xl font-bold text-[#7bf8ac]">47</div>
                </div>
                <div>
                  <div className="text-[10px] sm:text-sm text-[#94a3b8]">Meilleur tour</div>
                  <div className="text-lg sm:text-2xl font-bold text-white">48.2s</div>
                </div>
              </div>
            </div>

            {/* Live Leaderboard */}
            <div className="space-y-3">
              <div className="hidden md:grid grid-cols-5 gap-4 text-xs text-[#94a3b8] font-bold uppercase tracking-wider">
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
                <div key={position.pos} className="p-3 bg-[#1c1f26] rounded-lg">
                  <div className="flex items-center justify-between md:grid md:grid-cols-5 md:gap-4 md:items-center">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        position.pos === 1 ? 'bg-yellow-500 text-black' :
                        position.pos === 2 ? 'bg-gray-400 text-black' :
                        position.pos === 3 ? 'bg-orange-600 text-white' :
                        'bg-[#262626] text-white'
                      }`}>
                        {position.pos}
                      </div>
                      <span className="text-sm font-medium text-white">{position.driver}</span>
                    </div>
                    <span className="text-xs text-[#94a3b8] hidden md:block">{position.kart}</span>
                    <span className="text-sm font-mono text-white">{position.lastLap}</span>
                    <span className={`text-xs font-bold ${
                      position.gap === "LIDER" ? 'text-[#7bf8ac]' : 'text-white'
                    }`}>
                      {position.gap}
                    </span>
                  </div>
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
        return renderDriverDashboard();
    }
  };

  return (
    <div className="flex-1 md:ml-64 ml-0 relative z-10 flex flex-col h-screen">
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
