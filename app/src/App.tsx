import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import AnalysisPage from './pages/AnalysisPage';
import SessionsPage from './pages/SessionsPage';
import LivePage from './pages/LivePage';
import AuthPage from './pages/AuthPage';
import SettingsPage from './pages/SettingsPage';

const App: React.FC = () => {
  const isAuthenticated = !!localStorage.getItem('mokart_session');

  return (
    <Router>
      <Routes>
        <Route path="/login"    element={!isAuthenticated ? <AuthPage />    : <Navigate to="/" />} />
        <Route path="/"         element={isAuthenticated  ? <Home />         : <Navigate to="/login" />} />
        <Route path="/sessions" element={isAuthenticated  ? <SessionsPage /> : <Navigate to="/login" />} />
        <Route path="/analysis" element={isAuthenticated  ? <AnalysisPage /> : <Navigate to="/login" />} />
        <Route path="/live"     element={isAuthenticated  ? <LivePage />     : <Navigate to="/login" />} />
        <Route path="/settings" element={isAuthenticated  ? <SettingsPage /> : <Navigate to="/login" />} />
        <Route path="*"         element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
