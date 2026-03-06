import React, { useState } from 'react';
// Global style import handled in index.tsx
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface AuthResponse {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      kart?: string;
    };
  };
  session?: {
    access_token: string;
    refresh_token: string;
  };
  message: string;
}

const API_BASE_URL = process.env.REACT_API_URL || `http://${window.location.hostname}:8081`;

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [kart, setKart] = useState('');
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
        : { email, password, kart };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data: AuthResponse = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        if (data.session) {
          localStorage.setItem('mokart_session', JSON.stringify(data.session));
          localStorage.setItem('mokart_user', JSON.stringify(data.user));
        }
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        setError(data.message || 'Une erreur est survenue');
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
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@mokart.com', password: 'demo123456' }),
      });

      const data: AuthResponse = await response.json();

      if (response.ok) {
        setSuccess('Mode démo activé');
        if (data.session) {
          localStorage.setItem('mokart_session', JSON.stringify(data.session));
          localStorage.setItem('mokart_user', JSON.stringify(data.user));
        }
        setTimeout(() => window.location.href = '/', 1000);
      } else {
        setError('Mode démo indisponible');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0f12] text-gray-100 font-display antialiased flex items-center justify-center p-4 relative overflow-hidden">

      {/* Grid overlay */}
      <div className="fixed inset-0 bg-grid-minimal opacity-20 pointer-events-none" />

      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[260px] bg-[#7bf8ac]/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">

        {/* Header */}
        <div className="text-center mb-8">

          <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
            {isLogin ? 'Welcome back.' : 'Create your account.'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isLogin
              ? 'Enter your credentials to access the platform.'
              : 'Join MoKart and start analysing your laps.'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="glass-panel rounded-xl p-8 border border-white/8">

          {/* Alerts */}
          {error && (
            <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="mb-5 p-3 bg-[#7bf8ac]/10 border border-[#7bf8ac]/20 rounded-lg text-sm text-[#7bf8ac] flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0" />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#7bf8ac]/50 focus:ring-1 focus:ring-[#7bf8ac]/20 transition-all"
                placeholder="name@example.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#7bf8ac]/50 focus:ring-1 focus:ring-[#7bf8ac]/20 transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Kart</label>
                <input
                  type="text"
                  value={kart}
                  onChange={(e) => setKart(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#7bf8ac]/50 focus:ring-1 focus:ring-[#7bf8ac]/20 transition-all"
                  placeholder="Sodi RT8 v2"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="relative flex justify-center">
              <span className="bg-transparent px-3 text-[10px] font-bold uppercase tracking-widest text-gray-600">or</span>
            </div>
          </div>

          {/* Demo */}
          <button
            onClick={handleDemoLogin}
            disabled={loading}
            className="btn-secondary w-full justify-center py-3 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Demo Mode
          </button>

          {/* Toggle sign-in / register */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs text-gray-600 hover:text-[#7bf8ac] transition-colors"
            >
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span className="font-semibold text-gray-400 hover:text-[#7bf8ac]">
                {isLogin ? 'Sign up' : 'Sign in'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
