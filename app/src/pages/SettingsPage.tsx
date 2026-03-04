import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Save, ArrowLeft } from 'lucide-react';
import api, { UserProfile, UserProfileUpdate } from '../services/api';
import Sidebar from '../components/Sidebar';

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

  // ID utilisateur fixe pour la démo (à remplacer par l'authentification réelle)
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
    setMessage(null); // effacer le message d'erreur si userId est présent
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

      // Mettre à jour le localStorage avec les nouvelles informations
      const currentUser = JSON.parse(localStorage.getItem('mokart_user') || '{}');
      const updatedUser = {
        ...currentUser,
        email: updatedProfile.email,
        first_name: updatedProfile.first_name,
        last_name: updatedProfile.last_name
      };
      localStorage.setItem('mokart_user', JSON.stringify(updatedUser));

      // Déclencher un événement de stockage pour notifier les autres composants
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden relative">
      <Sidebar />

      <main className="flex-1 md:ml-16 ml-0 relative z-10 overflow-y-auto h-screen">
        <div className="md:p-6 p-4 pb-20 md:pb-0">
          {/* En-tête */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => window.history.back()}
              className="p-2 text-[#a3a3a3] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-white">Paramètres</h1>
          </div>

          {/* Message de succès/erreur */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg border ${
                message.type === 'success'
                  ? 'bg-green-900/20 border-green-500 text-green-400'
                  : 'bg-red-900/20 border-red-500 text-red-400'
              }`}
            >
              {message.text}
            </div>
          )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations personnelles */}
          <div className="bg-[#171717] border border-[#262626] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <User className="w-5 h-5" />
              Informations personnelles
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#a3a3a3] mb-2">
                  Prénom
                </label>
                <input
                  type="text"
                  value={profile.first_name || ''}
                  onChange={handleChange('first_name')}
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#404040] transition-colors"
                  placeholder="Votre prénom"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#a3a3a3] mb-2">
                  Nom
                </label>
                <input
                  type="text"
                  value={profile.last_name || ''}
                  onChange={handleChange('last_name')}
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#404040] transition-colors"
                  placeholder="Votre nom"
                />
              </div>
            </div>
          </div>

          {/* Coordonnées */}
          <div className="bg-[#171717] border border-[#262626] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Coordonnées
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#a3a3a3] mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={handleChange('email')}
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#404040] transition-colors"
                  placeholder="votre.email@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#a3a3a3] mb-2">
                  Téléphone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#737373] w-4 h-4" />
                  <input
                    type="tel"
                    value={profile.phone || ''}
                    onChange={handleChange('phone')}
                    className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-[#404040] transition-colors"
                    placeholder="06 12 34 56 78"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Informations système */}
          <div className="bg-[#171717] border border-[#262626] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Informations système</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#a3a3a3]">Nom d'utilisateur</span>
                <span className="text-sm text-white font-mono">{profile.username}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#a3a3a3]">ID utilisateur</span>
                <span className="text-sm text-white font-mono">{profile.id.slice(0, 8)}...</span>
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-6 py-2 border border-[#262626] text-[#a3a3a3] rounded-lg hover:text-white hover:border-[#404040] transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-[#22D3EE] text-black font-medium rounded-lg hover:bg-[#40E0D0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
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
