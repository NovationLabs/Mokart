import React, { useState, useEffect } from 'react';
import MokartMain from './MokartMain';
import AnalysisPage from './AnalysisPage';
import AuthPage from './AuthPage';

const Navigation: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'home' | 'analysis' | 'auth'>('home');
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
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('mokart_session');
    localStorage.removeItem('mokart_user');
    setIsAuthenticated(false);
    setUserName('');
    setCurrentPage('home');
  };

  return (
    <div className="min-h-screen">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">MOKART</h1>
              {isAuthenticated && userName && (
                <span className="ml-4 text-mokart-accent">
                  Bonjour {userName} !
                </span>
              )}
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setCurrentPage('home')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === 'home'
                    ? 'bg-mokart-accent text-black'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                Accueil
              </button>

              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => setCurrentPage('analysis')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentPage === 'analysis'
                        ? 'bg-mokart-accent text-black'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Analyse
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setCurrentPage('auth')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === 'auth'
                      ? 'bg-mokart-accent text-black'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Connexion
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <div className="pt-16">
        {currentPage === 'home' && <MokartMain />}
        {currentPage === 'analysis' && isAuthenticated && <AnalysisPage />}
        {currentPage === 'analysis' && !isAuthenticated && (
          <div className="min-h-screen bg-mokart-dark flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Accès restreint</h2>
              <p className="text-gray-400 mb-6">Vous devez être connecté pour accéder à la page d'analyse</p>
              <button
                onClick={() => setCurrentPage('auth')}
                className="px-6 py-3 bg-mokart-accent text-black font-bold rounded hover:bg-white transition-all"
              >
                Se connecter
              </button>
            </div>
          </div>
        )}
        {currentPage === 'auth' && !isAuthenticated && <AuthPage />}
        {currentPage === 'auth' && isAuthenticated && (
          <div className="min-h-screen bg-mokart-dark flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Déjà connecté</h2>
              <p className="text-gray-400 mb-6">Vous êtes déjà authentifié</p>
              <button
                onClick={() => setCurrentPage('analysis')}
                className="px-6 py-3 bg-mokart-accent text-black font-bold rounded hover:bg-white transition-all"
              >
                Aller à l'analyse
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navigation;
