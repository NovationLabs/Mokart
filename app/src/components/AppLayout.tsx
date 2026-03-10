import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const AppLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-base text-white font-display overflow-hidden relative">
      <Sidebar />
      <Outlet />
    </div>
  );
};

export default AppLayout;
