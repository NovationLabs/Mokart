import React, { useState, useEffect } from 'react';
import '../styles/theme.css';
import '../styles/MokartMain.css';
import { TabName } from '../types';
import AnalysisPage from './AnalysisPage';
import AuthPage from './AuthPage';

const MokartMain: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabName>('User');
  const [activeIcons, setActiveIcons] = useState<Set<string>>(new Set());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const session = localStorage.getItem('mokart_session');
    const user = localStorage.getItem('mokart_user');
    setIsAuthenticated(!!session && !!user);

    // Extraire le prénom depuis l'email
    if (user) {
      try {
        const userData = JSON.parse(user);
        const email = userData.email || '';
        const firstName = email.split('@')[0];
        setUserName(firstName.charAt(0).toUpperCase() + firstName.slice(1));
      } catch (e) {
        setUserName('');
      }
    }

    // Rediriger vers la tab Analysis si connecté
    if (!!session && !!user) {
      setActiveTab('Graph');
    }
  }, []);

  const handleTabClick = (tabName: TabName) => {
    // Si non connecté et pas la tab User, rediriger vers login
    if (!isAuthenticated && tabName !== 'User') {
      return;
    }
    setActiveTab(tabName);
  };

  const toggleIcon = (btnName: string) => {
    setActiveIcons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(btnName)) {
        newSet.delete(btnName);
      } else {
        newSet.add(btnName);
      }
      return newSet;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('mokart_session');
    localStorage.removeItem('mokart_user');
    setIsAuthenticated(false);
    setUserName('');
    setActiveTab('User');
  };

  // Si non authentifié, afficher la page de login
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="main-container">
      <nav className="top-navbar">

        <div className="nav-group left">
          <button
            className={`nav-tab ${activeTab === 'User' ? 'active' : ''}`}
            title="User"
            onClick={() => handleTabClick('User')}
          >
            <i className="ri-user-line"></i>
            <span>User</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'Map' ? 'active' : ''}`}
            title="Map"
            onClick={() => handleTabClick('Map')}
          >
            <i className="ri-map-2-line"></i>
            <span>Map</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'Graph' ? 'active' : ''}`}
            title="Analysis"
            onClick={() => handleTabClick('Graph')}
          >
            <i className="ri-line-chart-line"></i>
            <span>Analysis</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'Documentation' ? 'active' : ''}`}
            title="Documentation"
            onClick={() => handleTabClick('Documentation')}
          >
            <i className="ri-book-open-line"></i>
            <span>Documentation</span>
          </button>
        </div>

        <div className="nav-center">
          <div className="search-bar"></div>
        </div>

        <div className="nav-group right">
          {userName && (
            <div className="user-welcome">
              <span>Bonjour {userName} !</span>
            </div>
          )}
          <button
            className={`icon-btn ${activeIcons.has('Search') ? 'active' : ''}`}
            title="Search"
            onClick={() => toggleIcon('Search')}
          >
            <i className="ri-search-line"></i>
          </button>

          <button
            className={`icon-btn ${activeIcons.has('Logout') ? 'active' : ''}`}
            title="Logout"
            onClick={handleLogout}
          >
            <i className="ri-logout-box-line"></i>
          </button>

          <button
            className={`icon-btn ${activeIcons.has('Smartphone') ? 'active' : ''}`}
            title="Smartphone"
            onClick={() => toggleIcon('Smartphone')}
          >
            <i className="ri-smartphone-line"></i>
          </button>

          <div className="separator"></div>

          <button
            className={`icon-btn ${activeIcons.has('Sparkle') ? 'active' : ''}`}
            title="Sparkle"
            onClick={() => toggleIcon('Sparkle')}
          >
            <i className="ri-shining-2-line"></i>
          </button>

        </div>
      </nav>

      {/*
        Tab Content
      */}
      <div className="content-area">
        {activeTab === 'Graph' && <AnalysisPage />}
        {activeTab !== 'Graph' && (
          <div>
            <h3>{activeTab} View</h3>
            <p>Content for {activeTab} goes here.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default MokartMain;
