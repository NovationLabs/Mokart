import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import Home from './pages/Home';
import AnalysisPage from './pages/AnalysisPage';
import SessionsPage from './pages/SessionsPage';
import LivePage from './pages/LivePage';
import SimulationPage from './pages/SimulationPage';
import AuthPage from './pages/AuthPage';
import SettingsPage from './pages/SettingsPage';
import UserManagementPage from './pages/UserManagementPage';

const App: React.FC = () => {
  const isAuthenticated = !!localStorage.getItem('mokart_session');

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <AuthPage /> : <Navigate to="/" />} />
        {isAuthenticated ? (
          <Route element={<AppLayout />}>
            <Route path="/"           element={<Home />} />
            <Route path="/sessions"   element={<SessionsPage />} />
            <Route path="/analysis"   element={<AnalysisPage />} />
            <Route path="/live"       element={<LivePage />} />
            <Route path="/simulation" element={<SimulationPage />} />
            <Route path="/settings"   element={<SettingsPage />} />
            <Route path="/users"      element={<UserManagementPage />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
