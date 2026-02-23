import React, { useState, useEffect } from 'react';
// Global style import handled in index.tsx
import Sidebar from '../components/Sidebar';
import { User, Map, Smartphone, Search, Bell, Settings } from 'lucide-react';

const Home: React.FC = () => {
  const [userName, setUserName] = useState('');

  useEffect(() => {
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
  }, []);

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden relative">
      <Sidebar />

      <main className="flex-1 md:ml-16 ml-0 md:p-6 p-4 relative z-10 overflow-y-auto h-screen pb-20 md:pb-0">
        {/* Header */}
        <header className="flex justify-between items-center mb-8 pb-4 border-b border-[#262626]">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Dashboard</h1>
            <p className="text-[#737373] text-sm mt-1">Overview for <span className="text-white font-medium">{userName}</span></p>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg text-[#737373] hover:text-white hover:bg-[#171717] transition-colors">
              <Search size={18} />
            </button>
            <button className="p-2 rounded-lg text-[#737373] hover:text-white hover:bg-[#171717] transition-colors relative">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#22D3EE] rounded-full"></span>
            </button>
            <div className="w-px h-5 bg-[#262626] mx-1"></div>
            <div className="flex items-center gap-2 pr-3 pl-1 py-1 rounded-full border border-[#262626] bg-[#171717] hover:border-[#404040] transition-colors cursor-pointer">
              <div className="w-6 h-6 rounded-full bg-[#262626] flex items-center justify-center text-xs font-medium text-white">
                {userName.charAt(0) || 'U'}
              </div>
              <span className="text-xs font-medium text-[#d4d4d4] hidden md:block">{userName || 'User'}</span>
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* User Profile Card */}
          <div className="bg-[#171717] p-5 rounded-lg border border-[#262626] relative overflow-hidden group">
            <div className="absolute top-4 right-4 text-[#262626]">
              <User size={80} strokeWidth={1} />
            </div>
            <h3 className="text-[#737373] text-[10px] font-bold uppercase tracking-widest mb-3">Driver Profile</h3>
            <div className="flex items-end gap-2 mb-2 relative z-10">
              <span className="text-2xl font-bold text-white">{userName || 'Driver'}</span>
            </div>
            <div className="flex gap-2 mb-6 relative z-10">
              <span className="px-1.5 py-0.5 bg-[#262626] text-white text-[10px] font-medium rounded border border-[#404040]">Pro License</span>
              <span className="px-1.5 py-0.5 bg-[#262626] text-[#a3a3a3] text-[10px] font-medium rounded border border-[#404040]">Team Mokart</span>
            </div>
            <div className="mt-4 pt-4 border-t border-[#262626] grid grid-cols-2 gap-4 relative z-10">
              <div>
                <div className="text-[#737373] text-[10px] mb-1 uppercase tracking-wider">Total Laps</div>
                <div className="text-lg font-mono text-white">1,248</div>
              </div>
              <div>
                <div className="text-[#737373] text-[10px] mb-1 uppercase tracking-wider">Best Lap</div>
                <div className="text-lg font-mono text-[#22D3EE]">48.2s</div>
              </div>
            </div>
          </div>

          {/* Track Map / Status */}
          <div className="bg-[#171717] p-5 rounded-lg border border-[#262626] col-span-1 md:col-span-2 relative overflow-hidden flex flex-col">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <h3 className="text-[#737373] text-[10px] font-bold uppercase tracking-widest mb-1">Circuit Status</h3>
                <div className="text-lg font-bold text-white">SPEEDKART Hyères</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] font-medium text-emerald-500 uppercase tracking-wider">Live Tracking</span>
              </div>
            </div>

            {/* Simulated Map Graphic (Clean Line) */}
            <div className="flex-1 relative w-full h-full min-h-[120px] rounded border border-[#262626] bg-[#0a0a0a] flex items-center justify-center">
               <svg className="w-full h-full p-4" viewBox="0 0 800 400">
                  <path 
                    d="M100,200 Q200,100 400,250 T700,300 M50,300 Q150,50 350,150 T600,350" 
                    fill="none" 
                    stroke="#262626" 
                    strokeWidth="1" 
                  />
                  <path 
                    d="M100,200 Q200,100 400,250 T700,300" 
                    fill="none" 
                    stroke="#22D3EE" 
                    strokeWidth="1.5" 
                  />
               </svg>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#262626]">
                <div className="text-[10px] text-[#737373] mb-1">Track Temp</div>
                <div className="text-sm font-medium text-white">24°C</div>
              </div>
              <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#262626]">
                <div className="text-[10px] text-[#737373] mb-1">Humidity</div>
                <div className="text-sm font-medium text-white">42%</div>
              </div>
              <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#262626]">
                <div className="text-[10px] text-[#737373] mb-1">Grip Level</div>
                <div className="text-sm font-medium text-[#22D3EE]">High</div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-[#171717] p-5 rounded-lg border border-[#262626] hover:border-[#404040] transition-colors">
            <h3 className="text-[#737373] text-[10px] font-bold uppercase tracking-widest mb-4">Last Session</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-[#262626]">
                <span className="text-xs text-[#a3a3a3]">Avg Lap</span>
                <span className="font-mono text-sm text-white">52.4s</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#262626]">
                <span className="text-xs text-[#a3a3a3]">Top Speed</span>
                <span className="font-mono text-sm text-white">84 km/h</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#262626]">
                <span className="text-xs text-[#a3a3a3]">Max G-Force</span>
                <span className="font-mono text-sm text-white">1.8 G</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#a3a3a3]">Consistency</span>
                <span className="font-mono text-sm text-emerald-500">94%</span>
              </div>
            </div>
          </div>

          {/* Device Status */}
          <div className="bg-[#171717] p-5 rounded-lg border border-[#262626] hover:border-[#404040] transition-colors group">
            <div className="flex justify-between items-start mb-4">
              <div className="text-[#a3a3a3] group-hover:text-white transition-colors">
                <Smartphone size={20} />
              </div>
              <span className="px-1.5 py-0.5 bg-[#064e3b] text-[#34d399] text-[10px] font-bold uppercase rounded border border-[#065f46]">Online</span>
            </div>
            <h3 className="text-sm font-medium text-white mb-2">Mokart Unit #042</h3>
            <div className="w-full bg-[#262626] rounded-full h-1 mb-2 overflow-hidden">
              <div className="bg-emerald-500 h-1 rounded-full" style={{ width: '85%' }}></div>
            </div>
            <div className="text-[10px] text-[#737373] flex justify-between">
              <span>Battery</span>
              <span>85%</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;

