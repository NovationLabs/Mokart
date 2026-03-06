import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Save, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import api, { UserProfile } from '../services/api';
import Sidebar from '../components/Sidebar';

const SettingsPage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>({
    id: '', username: '', email: '',
    first_name: '', last_name: '', phone: '', created_at: ''
  });
  const [userId,  setUserId]  = useState('');
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const getStoredUserId = () => {
    try {
      const u = localStorage.getItem('mokart_user');
      if (!u) return '';
      const parsed = JSON.parse(u);
      return typeof parsed?.id === 'string' ? parsed.id : '';
    } catch { return ''; }
  };

  useEffect(() => { setUserId(getStoredUserId()); }, []);

  useEffect(() => {
    if (!userId) { setLoading(false); setMessage({ type: 'error', text: 'Utilisateur non connecté' }); return; }
    setMessage(null);
    fetchProfile(userId);
  }, [userId]);

  const fetchProfile = async (uid: string) => {
    try {
      const data = await api.users.getProfile(uid);
      setProfile(data);
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors du chargement du profil' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const updated = await api.users.updateProfile(userId, {
        first_name: profile.first_name,
        last_name:  profile.last_name,
        phone:      profile.phone,
        email:      profile.email,
      });
      setProfile(updated);
      const current = JSON.parse(localStorage.getItem('mokart_user') || '{}');
      const next    = { ...current, email: updated.email, first_name: updated.first_name, last_name: updated.last_name };
      localStorage.setItem('mokart_user', JSON.stringify(next));
      window.dispatchEvent(new StorageEvent('storage', { key: 'mokart_user', newValue: JSON.stringify(next) }));
      setMessage({ type: 'success', text: 'Profil mis à jour avec succès' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Erreur lors de la mise à jour' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof UserProfile) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile(prev => ({ ...prev, [field]: e.target.value }));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-base text-white font-display items-center justify-center">
        <div className="flex items-center gap-2 text-[#94a3b8] text-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[#94a3b8]/60 animate-pulse-dot" />
          Chargement...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-base text-white font-display overflow-hidden relative">
      <div className="absolute inset-0 bg-grid-minimal opacity-40 pointer-events-none" />
      <Sidebar />

      <main className="flex-1 md:ml-16 ml-0 flex flex-col h-screen overflow-y-auto pb-20 md:pb-0 relative z-10">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-20 px-4 sm:px-6 h-14 sm:h-16 flex items-center gap-3 border-b border-[#262626] bg-[#0d0f12]/95 backdrop-blur-xl">
          <button
            onClick={() => window.history.back()}
            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-sm sm:text-base font-semibold tracking-tight">Paramètres</h1>
            <p className="text-[10px] sm:text-[11px] text-[#94a3b8]">Profil &amp; compte</p>
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6 space-y-4 animate-fade-in max-w-2xl">

          {/* Alert */}
          {message && (
            <div className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border text-sm ${
              message.type === 'success'
                ? 'bg-[#7bf8ac]/5 border-[#7bf8ac]/20 text-[#7bf8ac]'
                : 'bg-red-500/5 border-red-500/20 text-red-400'
            }`}>
              {message.type === 'success'
                ? <CheckCircle2 size={15} className="shrink-0" />
                : <AlertCircle size={15} className="shrink-0" />}
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* ── Informations personnelles ──────────────────────────────── */}
            <div className="card">
              <div className="flex items-center gap-2 mb-5">
                <div className="p-1.5 rounded-lg bg-[#1c1f26] text-[#94a3b8]">
                  <User size={14} />
                </div>
                <h2 className="text-sm font-semibold">Informations personnelles</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { field: 'first_name' as const, label: 'Prénom',   placeholder: 'Votre prénom' },
                  { field: 'last_name'  as const, label: 'Nom',      placeholder: 'Votre nom'    },
                ].map(({ field, label, placeholder }) => (
                  <div key={field} className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">{label}</label>
                    <input
                      type="text"
                      value={profile[field] || ''}
                      onChange={handleChange(field)}
                      className="w-full bg-[#0d0f12] border border-[#262626] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#94a3b8]/40 focus:outline-none focus:border-[#7bf8ac]/40 transition-colors"
                      placeholder={placeholder}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* ── Coordonnées ───────────────────────────────────────────── */}
            <div className="card">
              <div className="flex items-center gap-2 mb-5">
                <div className="p-1.5 rounded-lg bg-[#1c1f26] text-[#94a3b8]">
                  <Mail size={14} />
                </div>
                <h2 className="text-sm font-semibold">Coordonnées</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={handleChange('email')}
                    className="w-full bg-[#0d0f12] border border-[#262626] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#94a3b8]/40 focus:outline-none focus:border-[#7bf8ac]/40 transition-colors"
                    placeholder="votre.email@example.com"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Téléphone</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]/50" />
                    <input
                      type="tel"
                      value={profile.phone || ''}
                      onChange={handleChange('phone')}
                      className="w-full bg-[#0d0f12] border border-[#262626] rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-[#94a3b8]/40 focus:outline-none focus:border-[#7bf8ac]/40 transition-colors"
                      placeholder="06 12 34 56 78"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Informations système ───────────────────────────────────── */}
            <div className="card">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-4">Informations système</h2>
              <div className="divide-y divide-[#262626]">
                {[
                  { label: "Nom d'utilisateur", value: profile.username },
                  { label: 'ID utilisateur',    value: profile.id ? profile.id.slice(0, 8) + '...' : '—' },
                  { label: 'Membre depuis',     value: profile.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-2.5">
                    <span className="text-[11px] text-[#94a3b8]">{label}</span>
                    <span className="text-[11px] font-data text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Actions ───────────────────────────────────────────────── */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-4 py-2 rounded-lg text-sm text-[#94a3b8] border border-[#262626] hover:text-white hover:border-white/20 transition-all"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary px-5 py-2 flex items-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Save size={14} />
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
