import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Activity, LogOut, Users, Settings } from 'lucide-react';

const Sidebar: React.FC = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('mokart_session');
        localStorage.removeItem('mokart_user');
        navigate('/login');
        window.location.reload();
    };

    return (
        <>
            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0a0a0a] border-t border-[#262626] flex items-center justify-around z-50 px-6">
                <NavLink
                    to="/"
                    end
                    className={({ isActive }) =>
                        `p-2 rounded-lg transition-colors ${isActive ? 'text-white bg-[#171717]' : 'text-[#737373]'}`
                    }
                >
                    <Home size={24} strokeWidth={1.5} />
                </NavLink>
                <NavLink
                    to="/analysis"
                    className={({ isActive }) =>
                        `p-2 rounded-lg transition-colors ${isActive ? 'text-white bg-[#171717]' : 'text-[#737373]'}`
                    }
                >
                    <Activity size={24} strokeWidth={1.5} />
                </NavLink>
                <NavLink
                    to="/users"
                    className={({ isActive }) =>
                        `p-2 rounded-lg transition-colors ${isActive ? 'text-white bg-[#171717]' : 'text-[#737373]'}`
                    }
                >
                    <Users size={24} strokeWidth={1.5} />
                </NavLink>
                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        `p-2 rounded-lg transition-colors ${isActive ? 'text-white bg-[#171717]' : 'text-[#737373]'}`
                    }
                >
                    <Settings size={24} strokeWidth={1.5} />
                </NavLink>
                <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg text-[#737373] active:text-white transition-colors"
                >
                    <LogOut size={24} strokeWidth={1.5} />
                </button>
            </div>

            {/* Desktop Sidebar */}
            <aside className="fixed left-0 top-0 h-screen w-16 bg-[#0a0a0a] border-r border-[#262626] hidden md:flex flex-col items-center py-6 z-50">
                <div className="mb-8">
                    {/* Brand/Logo */}
                    <div className="w-8 h-8 flex items-center justify-center">
                        <img
                            src="/icon_inverse.png"
                            alt="Mokart"
                            className="w-full h-full object-contain opacity-90"
                        />
                    </div>
                </div>

                <nav className="flex-1 flex flex-col gap-2 w-full px-2">
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) =>
                            `p-2 rounded-lg transition-all duration-200 flex justify-center group relative ${isActive
                                ? 'bg-[#171717] text-white'
                                : 'text-[#737373] hover:text-white hover:bg-[#171717]'
                            }`
                        }
                    >
                        <Home size={20} />
                        {/* Tooltip hint could go here */}
                    </NavLink>

                    <NavLink
                        to="/analysis"
                        className={({ isActive }) =>
                            `p-2 rounded-lg transition-all duration-200 flex justify-center group relative ${isActive
                                ? 'bg-[#171717] text-white'
                                : 'text-[#737373] hover:text-white hover:bg-[#171717]'
                            }`
                        }
                    >
                        <Activity size={20} />
                    </NavLink>

                    <NavLink
                        to="/users"
                        className={({ isActive }) =>
                            `p-2 rounded-lg transition-all duration-200 flex justify-center group relative ${isActive
                                ? 'bg-[#171717] text-white'
                                : 'text-[#737373] hover:text-white hover:bg-[#171717]'
                            }`
                        }
                    >
                        <Users size={20} />
                    </NavLink>

                    <NavLink
                        to="/settings"
                        className={({ isActive }) =>
                            `p-2 rounded-lg transition-all duration-200 flex justify-center group relative ${isActive
                                ? 'bg-[#171717] text-white'
                                : 'text-[#737373] hover:text-white hover:bg-[#171717]'
                            }`
                        }
                    >
                        <Settings size={20} />
                    </NavLink>
                </nav>

                <button
                    onClick={handleLogout}
                    className="mt-auto p-2 text-[#737373] hover:text-white transition-colors rounded-lg hover:bg-[#171717]"
                    title="Logout"
                >
                    <LogOut size={20} />
                </button>
            </aside>
        </>
    );
};

export default Sidebar;
