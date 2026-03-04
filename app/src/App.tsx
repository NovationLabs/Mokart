import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import AnalysisPage from './pages/AnalysisPage';
import AuthPage from './pages/AuthPage';
import SettingsPage from './pages/SettingsPage';
// Removed: import './styles/App.css';

const App: React.FC = () => {
  // Simple auth check simulation (in a real app, use Context or Redux)
  const isAuthenticated = !!localStorage.getItem('mokart_session');

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <AuthPage /> : <Navigate to="/" />} />
        <Route path="/" element={isAuthenticated ? <Home /> : <Navigate to="/login" />} />
        <Route path="/analysis" element={isAuthenticated ? <AnalysisPage /> : <Navigate to="/login" />} />
        <Route path="/settings" element={isAuthenticated ? <SettingsPage /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
