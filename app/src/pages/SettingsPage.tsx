import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Save, ArrowLeft } from 'lucide-react';
import api, { UserProfile, UserProfileUpdate } from '../services/api';
import Header from '../components/Header';
import { SettingsSkeleton } from '../components/Skeleton';

const SettingsPage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    created_at: ''
  });
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const getStoredUserId = () => {
    try {
      const storedUser = localStorage.getItem('mokart_user');
      if (!storedUser) return '';
      const parsed = JSON.parse(storedUser);
      return typeof parsed?.id === 'string' ? parsed.id : '';
    } catch {
      return '';
    }
  };

  useEffect(() => {
    setUserId(getStoredUserId());
  }, []);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setMessage({ type: 'error', text: 'Utilisateur non connecté' });
      return;
    }
    setMessage(null);
    fetchProfile(userId);
  }, [userId]);

  const fetchProfile = async (uid: string) => {
    try {
      const data = await api.users.getProfile(uid);
      setProfile(data);
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
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
      const updatedProfile = await api.users.updateProfile(userId, {
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        email: profile.email
      });
      setProfile(updatedProfile);

      const currentUser = JSON.parse(localStorage.getItem('mokart_user') || '{}');
      const updatedUser = {
        ...currentUser,
        email: updatedProfile.email,
        first_name: updatedProfile.first_name,
        last_name: updatedProfile.last_name
      };
      localStorage.setItem('mokart_user', JSON.stringify(updatedUser));

      window.dispatchEvent(new StorageEvent('storage', {
        key: 'mokart_user',
        newValue: JSON.stringify(updatedUser)
      }));

      setMessage({ type: 'success', text: 'Profil mis à jour avec succès' });
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la mise à jour du profil';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof UserProfile) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="flex-1 md:ml-11 ml-0 relative z-10 flex flex-col h-screen">
      <Header className="flex-shrink-0" />

      <main className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 pb-20 md:pb-6 max-w-2xl mx-auto">
          {/* En-tête */}
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <button
              onClick={() => window.history.back()}
              className="p-2 text-[#94a3b8] hover:text-white transition-colors -ml-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Paramètres</h1>
          </div>

          {loading ? (
            <SettingsSkeleton />
          ) : (
          <>

          {/* Message de succès/erreur */}
          {message && (
            <div
              className={`mb-6 p-3 sm:p-4 rounded-lg border text-sm ${
                message.type === 'success'
                  ? 'bg-green-900/20 border-green-500 text-green-400'
                  : 'bg-red-900/20 border-red-500 text-red-400'
              }`}
            >
              {message.text}
            </div>
          )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Informations personnelles */}
          <div className="card">
            <h2 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
              <User className="w-5 h-5" />
              Informations personnelles
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-[#94a3b8] mb-2">
                  Prénom
                </label>
                <input
                  type="text"
                  value={profile.first_name || ''}
                  onChange={handleChange('first_name')}
                  className="w-full bg-[#0d0f12] border border-[#262626] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#7bf8ac]/50 focus:ring-1 focus:ring-[#7bf8ac]/20 transition-colors"
                  placeholder="Votre prénom"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#94a3b8] mb-2">
                  Nom
                </label>
                <input
                  type="text"
                  value={profile.last_name || ''}
                  onChange={handleChange('last_name')}
                  className="w-full bg-[#0d0f12] border border-[#262626] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#7bf8ac]/50 focus:ring-1 focus:ring-[#7bf8ac]/20 transition-colors"
                  placeholder="Votre nom"
                />
              </div>
            </div>
          </div>

          {/* Coordonnées */}
          <div className="card">
            <h2 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Coordonnées
            </h2>

            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#94a3b8] mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={handleChange('email')}
                  className="w-full bg-[#0d0f12] border border-[#262626] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#7bf8ac]/50 focus:ring-1 focus:ring-[#7bf8ac]/20 transition-colors"
                  placeholder="votre.email@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#94a3b8] mb-2">
                  Téléphone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#737373] w-4 h-4" />
                  <input
                    type="tel"
                    value={profile.phone || ''}
                    onChange={handleChange('phone')}
                    className="w-full bg-[#0d0f12] border border-[#262626] rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#7bf8ac]/50 focus:ring-1 focus:ring-[#7bf8ac]/20 transition-colors"
                    placeholder="06 12 34 56 78"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Informations système */}
          <div className="card">
            <h2 className="text-base sm:text-lg font-semibold text-white mb-4">Informations système</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center gap-2">
                <span className="text-sm text-[#94a3b8] shrink-0">Nom d'utilisateur</span>
                <span className="text-sm text-white font-mono truncate">{profile.username}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-sm text-[#94a3b8] shrink-0">ID utilisateur</span>
                <span className="text-sm text-white font-mono truncate">{profile.id.slice(0, 8)}...</span>
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 pb-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-6 py-2.5 border border-[#262626] text-[#94a3b8] rounded-lg hover:text-white hover:border-[#404040] transition-colors text-sm text-center"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#7bf8ac] text-black font-semibold rounded-full hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
          </>
          )}
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
