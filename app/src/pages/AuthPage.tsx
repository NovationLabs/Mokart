import React, { useState } from 'react';
// Global style import handled in index.tsx
import { Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

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
      const response = await fetch('http://localhost:8081/auth/login', {
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
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-white text-black text-xl font-bold rounded-lg flex items-center justify-center mx-auto mb-4">M</div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Welcome to Mokart</h1>
          <p className="text-[#737373] text-sm">Enter your credentials to access the platform.</p>
        </div>

        {/* Auth Card */}
        <div className="bg-[#171717] p-8 rounded-lg border border-[#262626]">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400 flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded text-sm text-emerald-400 flex items-center gap-2">
              <CheckCircle2 size={16} />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#a3a3a3]">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded px-3 py-2 text-white placeholder-[#404040] focus:outline-none focus:border-white transition-colors text-sm"
                placeholder="name@example.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#a3a3a3]">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded px-3 py-2 text-white placeholder-[#404040] focus:outline-none focus:border-white transition-colors text-sm"
                placeholder="••••••••"
                required
              />
            </div>

            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#a3a3a3]">Kart</label>
                <input
                  type="text"
                  value={kart}
                  onChange={(e) => setKart(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded px-3 py-2 text-white placeholder-[#404040] focus:outline-none focus:border-white transition-colors text-sm"
                  placeholder="Sodi RT8 v2"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-medium py-2 rounded hover:bg-[#e5e5e5] transition-colors text-sm mt-2"
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-3 text-center">
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#262626]"></span>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#171717] px-2 text-[#525252]">OR</span>
              </div>
            </div>

            <button
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full border border-[#262626] bg-transparent hover:bg-[#262626] text-white font-medium py-2 rounded transition-colors text-sm"
            >
              Demo Mode
            </button>

            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs text-[#737373] hover:text-white transition-colors mt-2"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
