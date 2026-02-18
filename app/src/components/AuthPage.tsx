import React, { useState } from 'react';
import '../styles/theme.css';
import '../styles/AuthPage.css';

interface AuthResponse {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      vehicle_model?: string;
    };
  };
  session?: {
    access_token: string;
    refresh_token: string;
  };
  message: string;
}

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const body = isLogin
        ? { email, password }
        : { email, password, vehicle_model: vehicleModel };

      const response = await fetch(`http://localhost:8081${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data: AuthResponse = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        // Stocker la session dans localStorage
        if (data.session) {
          localStorage.setItem('mokart_session', JSON.stringify(data.session));
          localStorage.setItem('mokart_user', JSON.stringify(data.user));
        }

        // Rediriger vers la page d'analyse après 2 secondes
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        setError(data.detail || data.message || 'Une erreur est survenue');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:8081/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'demo@mokart.com',
          password: 'demo123456'
        }),
      });

      const data: AuthResponse = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        // Stocker la session dans localStorage
        if (data.session) {
          localStorage.setItem('mokart_session', JSON.stringify(data.session));
          localStorage.setItem('mokart_user', JSON.stringify(data.user));
        }

        // Rediriger vers la page d'analyse après 2 secondes
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        setError('Mode démo indisponible. Créez un compte.');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-container">
      <div className="auth-container">
        {/* Logo et titre */}
        <div className="auth-header">
          <h1 className="auth-title">MOKART</h1>
          <p className="auth-subtitle">
            {isLogin ? 'Connectez-vous à votre compte' : 'Créez votre compte'}
          </p>
        </div>

        {/* Formulaire */}
        <div className="auth-card">
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Email */}
            <div className="form-group">
              <label className="form-label">
                Email
              </label>
              <div className="input-with-icon">
                <i className="ri-mail-line input-icon"></i>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div className="form-group">
              <label className="form-label">
                Mot de passe
              </label>
              <div className="input-with-icon">
                <i className="ri-lock-line input-icon"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="input-action"
                >
                  <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                </button>
              </div>
            </div>

            {/* Modèle de véhicule (uniquement pour l'inscription) */}
            {!isLogin && (
              <div className="form-group">
                <label className="form-label">
                  Modèle de kart (optionnel)
                </label>
                <div className="input-with-icon">
                  <i className="ri-car-line input-icon"></i>
                  <input
                    type="text"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    className="form-input"
                    placeholder="Sodi, De-haardt, RaceFacer..."
                  />
                </div>
              </div>
            )}

            {/* Messages d'erreur/succès */}
            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                {success}
              </div>
            )}

            {/* Bouton de soumission */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-full"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <i className="ri-loader-4-line animate-spin mr-2"></i>
                  Chargement...
                </span>
              ) : (
                isLogin ? 'Se connecter' : "S'inscrire"
              )}
            </button>

            {/* Bouton de démo */}
            <div className="divider">
              <span>OU</span>
            </div>

            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="btn btn-secondary btn-full"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <i className="ri-loader-4-line animate-spin mr-2"></i>
                  Chargement...
                </span>
              ) : (
                '🚪 Mode Démo'
              )}
            </button>
          </form>

          {/* Basculer entre login/register */}
          <div className="auth-footer">
            <p>
              {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setSuccess('');
                }}
                className="auth-link"
              >
                {isLogin ? "S'inscrire" : "Se connecter"}
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="auth-bottom">
          <p>Data at the heart of racing, for everyone</p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
