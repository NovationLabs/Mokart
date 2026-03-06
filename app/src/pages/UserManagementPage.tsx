import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Filter,
  ChevronDown,
  UserPlus,
  UserCheck,
  UserX,
  Shield,
  Eye,
  Settings,
  X,
  Save,
  User,
  Calendar,
  Mail,
  Phone,
  AlertTriangle
} from 'lucide-react';
import { User as UserType, UserRole, UserCreate, UserUpdate, UserStats, ROLE_LABELS, ROLE_DESCRIPTIONS } from '../types/user';
import { api } from '../services/api';
import usePermissions from '../hooks/usePermissions';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const UserManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { canManageUsers } = usePermissions();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  // Vérifier les permissions - rediriger si pas admin
  useEffect(() => {
    const getUserRole = (): UserRole | null => {
      try {
        const user = localStorage.getItem('mokart_user');
        if (!user) return null;
        const parsed = JSON.parse(user);
        return parsed.role || null;
      } catch {
        return null;
      }
    };

    const role = getUserRole();
    setUserRole(role);
    if (!canManageUsers() && role !== UserRole.ADMIN) {
      navigate('/');
      return;
    }

    setIsAuthorized(role === UserRole.ADMIN);
  }, [canManageUsers, navigate]);

  const [users, setUsers] = useState<UserType[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [formData, setFormData] = useState<UserCreate>({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    kart: '',
    role: UserRole.DRIVER,
    license_number: '',
    license_expiry: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await api.users.getAll();
      // S'assurer que les utilisateurs ont le bon typage
      const typedUsers = data.map(user => ({
        ...user,
        role: user.role as UserRole
      }));
      setUsers(typedUsers);
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des utilisateurs' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const stats = await api.users.getStats();
      setStats(stats);
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Nettoyer les données avant envoi
      const cleanFormData = {
        ...formData,
        license_expiry: formData.license_expiry || undefined
      };

      const newUser = await api.users.create(cleanFormData);
      // S'assurer que le nouvel utilisateur a le bon typage
      const typedNewUser = {
        ...newUser,
        role: newUser.role as UserRole
      };
      setUsers(prev => [...prev, typedNewUser]);
      setShowCreateModal(false);
      resetForm();
      setMessage({ type: 'success', text: 'Utilisateur créé avec succès' });
      fetchStats();
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la création de l\'utilisateur' });
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      // Créer les données de mise à jour uniquement avec les champs modifiés
      const updateData: UserUpdate = {};

      if (formData.username !== selectedUser.username) updateData.username = formData.username;
      if (formData.email !== selectedUser.email) updateData.email = formData.email;
      if (formData.first_name !== selectedUser.first_name) updateData.first_name = formData.first_name;
      if (formData.last_name !== selectedUser.last_name) updateData.last_name = formData.last_name;
      if (formData.phone !== selectedUser.phone) updateData.phone = formData.phone;
      if (formData.kart !== selectedUser.kart) updateData.kart = formData.kart;
      if (formData.role !== selectedUser.role) updateData.role = formData.role;
      if (formData.license_number !== selectedUser.license_number) updateData.license_number = formData.license_number;
      if (formData.license_expiry !== selectedUser.license_expiry) {
        // Envoyer null si la date est vide, sinon la date
        updateData.license_expiry = formData.license_expiry || undefined;
      }

      const updatedUser = await api.users.update(selectedUser.id, updateData);
      // S'assurer que l'utilisateur mis à jour a le bon typage
      const typedUpdatedUser = {
        ...updatedUser,
        role: updatedUser.role as UserRole
      };
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? typedUpdatedUser : u));
      setShowEditModal(false);
      resetForm();
      setSelectedUser(null);
      setMessage({ type: 'success', text: 'Utilisateur mis à jour avec succès' });
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour:', error);
      const errorMessage = error?.message || 'Erreur lors de la mise à jour de l\'utilisateur';
      setMessage({ type: 'error', text: errorMessage });
    }
  };

  const handleToggleUserStatus = async (user: UserType) => {
    try {
      await api.users.toggleStatus(user.id);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
      setMessage({ type: 'success', text: `Utilisateur ${!user.is_active ? 'activé' : 'désactivé'} avec succès` });
      fetchStats();
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      setMessage({ type: 'error', text: 'Erreur lors du changement de statut' });
    }
  };

  const handleDeleteUser = async (user: UserType) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.first_name} ${user.last_name} ?`)) {
      return;
    }

    try {
      await api.users.delete(user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      setMessage({ type: 'success', text: 'Utilisateur supprimé avec succès' });
      fetchStats();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la suppression de l\'utilisateur' });
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      phone: '',
      kart: '',
      role: UserRole.DRIVER,
      license_number: '',
      license_expiry: ''
    });
  };

  const openEditModal = (user: UserType) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone || '',
      kart: user.kart || '',
      role: user.role,
      license_number: user.license_number || '',
      license_expiry: user.license_expiry || ''
    });
    setShowEditModal(true);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'active' && user.is_active) ||
                         (statusFilter === 'inactive' && !user.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return <Shield className="w-4 h-4 text-red-500" />;
      case UserRole.COMMISSAIRE: return <UserCheck className="w-4 h-4 text-blue-500" />;
      case UserRole.MECHANIC: return <Edit2 className="w-4 h-4 text-orange-500" />;
      case UserRole.INSTRUCTOR: return <User className="w-4 h-4 text-green-500" />;
      case UserRole.DRIVER: return <User className="w-4 h-4 text-cyan-500" />;
      case UserRole.SPECTATOR: return <Eye className="w-4 h-4 text-gray-500" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleLabel = (role: any) => {
    return ROLE_LABELS[role as UserRole] || 'Rôle inconnu';
  };

  const getRoleDescription = (role: any) => {
    return ROLE_DESCRIPTIONS[role as UserRole] || 'Description non disponible';
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden relative">
        <Sidebar />
        <div className="flex-1 md:ml-16 ml-0 relative z-10 flex flex-col h-screen">
          <Header className="flex-shrink-0" />
          <main className="flex-1 overflow-y-auto">
            <div className="md:p-6 p-4 pb-20 md:pb-0">
              <div className="text-white">Chargement...</div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Afficher un message d'erreur si pas autorisé
  if (isAuthorized === false && userRole && userRole !== UserRole.ADMIN) {
    return (
      <div className="flex min-h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden relative">
        <Sidebar />
        <div className="flex-1 md:ml-16 ml-0 relative z-10 flex flex-col h-screen">
          <Header className="flex-shrink-0" />
          <main className="flex-1 overflow-y-auto">
            <div className="md:p-6 p-4 pb-20 md:pb-0">
              <div className="max-w-2xl mx-auto">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 mb-6">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-red-400 mb-1">Accès non autorisé</h3>
                      <p className="text-red-300">
                        Seuls les administrateurs peuvent accéder à la gestion des utilisateurs.
                        Votre rôle actuel : <span className="font-medium">{getRoleLabel(userRole)}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden relative">
      <Sidebar />

      <div className="flex-1 md:ml-16 ml-0 relative z-10 flex flex-col h-screen">
        <Header className="flex-shrink-0" />

        <main className="flex-1 overflow-y-auto">
          <div className="md:p-6 p-4 pb-20 md:pb-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white">Gestion des utilisateurs</h1>
                <p className="text-[#737373] text-sm mt-1">Gérer les comptes et les permissions</p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#22D3EE] text-black font-medium rounded-lg hover:bg-[#40E0D0] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nouvel utilisateur
              </button>
            </div>

            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-[#171717] border border-[#262626] rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[#737373] text-xs uppercase tracking-wider">Total utilisateurs</div>
                      <div className="text-2xl font-bold text-white mt-1">{stats.total_users}</div>
                    </div>
                    <User className="w-8 h-8 text-[#22D3EE]" />
                  </div>
                </div>
                <div className="bg-[#171717] border border-[#262626] rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[#737373] text-xs uppercase tracking-wider">Utilisateurs actifs</div>
                      <div className="text-2xl font-bold text-white mt-1">{stats.active_users}</div>
                    </div>
                    <UserCheck className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <div className="bg-[#171717] border border-[#262626] rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[#737373] text-xs uppercase tracking-wider">Nouveaux ce mois</div>
                      <div className="text-2xl font-bold text-white mt-1">{stats.new_users_this_month}</div>
                    </div>
                    <Calendar className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                <div className="bg-[#171717] border border-[#262626] rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[#737373] text-xs uppercase tracking-wider">Taux d'activité</div>
                      <div className="text-2xl font-bold text-white mt-1">
                        {stats.total_users > 0 ? Math.round((stats.active_users / stats.total_users) * 100) : 0}%
                      </div>
                    </div>
                    <Shield className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-[#171717] border border-[#262626] rounded-lg p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#737373] w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Rechercher un utilisateur..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg pl-10 pr-4 py-2 text-white placeholder-[#737373] focus:outline-none focus:border-[#404040] transition-colors"
                    />
                  </div>
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
                  className="bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#404040] transition-colors"
                >
                  <option value="all">Tous les rôles</option>
                  {Object.entries(ROLE_LABELS).map(([role, label]) => (
                    <option key={role} value={role}>{label}</option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                  className="bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#404040] transition-colors"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actifs</option>
                  <option value="inactive">Inactifs</option>
                </select>
              </div>
            </div>

            {/* Message */}
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

            {/* Users Table */}
            <div className="bg-[#171717] border border-[#262626] rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#0a0a0a] border-b border-[#262626]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#737373] uppercase tracking-wider">Utilisateur</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#737373] uppercase tracking-wider">Rôle</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#737373] uppercase tracking-wider">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#737373] uppercase tracking-wider">Licence</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#737373] uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#737373] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262626]">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-[#262626] transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#22D3EE] rounded-full flex items-center justify-center text-black font-medium text-sm">
                              {(user.first_name || '').charAt(0)}{(user.last_name || '').charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">{user.first_name || ''} {user.last_name || ''}</div>
                              <div className="text-xs text-[#737373]">@{user.username || ''}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            {getRoleIcon(user.role)}
                            <div>
                              <div className="text-sm font-medium text-white">{getRoleLabel(user.role)}</div>
                              <div className="text-xs text-[#737373]">{getRoleDescription(user.role)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-white">
                              <Mail className="w-3 h-3 text-[#737373]" />
                              {user.email}
                            </div>
                            {user.phone && (
                              <div className="flex items-center gap-2 text-sm text-[#a3a3a3]">
                                <Phone className="w-3 h-3 text-[#737373]" />
                                {user.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {user.license_number ? (
                            <div className="space-y-1">
                              <div className="text-sm font-mono text-white">{user.license_number}</div>
                              {user.license_expiry && (
                                <div className="text-xs text-[#737373]">
                                  Expire: {new Date(user.license_expiry).toLocaleDateString('fr-FR')}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-[#737373]">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className={`text-sm ${user.is_active ? 'text-green-400' : 'text-red-400'}`}>
                              {user.is_active ? 'Actif' : 'Inactif'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditModal(user)}
                              className="p-1 text-[#737373] hover:text-white transition-colors"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleUserStatus(user)}
                              className="p-1 text-[#737373] hover:text-white transition-colors"
                              title={user.is_active ? 'Désactiver' : 'Activer'}
                            >
                              {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="p-1 text-[#737373] hover:text-red-500 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#171717] border border-[#262626] rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-white mb-4">Créer un utilisateur</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#a3a3a3] mb-1">Prénom</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#404040] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#a3a3a3] mb-1">Nom</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#404040] transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a3a3a3] mb-1">Nom d'utilisateur</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#404040] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a3a3a3] mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#404040] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a3a3a3] mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#404040] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a3a3a3] mb-1">Rôle</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#404040] transition-colors"
                >
                  {Object.entries(ROLE_LABELS).map(([role, label]) => (
                    <option key={role} value={role}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a3a3a3] mb-1">Numéro de licence</label>
                <input
                  type="text"
                  value={formData.license_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, license_number: e.target.value }))}
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#404040] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a3a3a3] mb-1">Date d'expiration de licence</label>
                <input
                  type="date"
                  value={formData.license_expiry}
                  onChange={(e) => setFormData(prev => ({ ...prev, license_expiry: e.target.value }))}
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#404040] transition-colors"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-[#262626] text-[#a3a3a3] rounded-lg hover:text-white hover:border-[#404040] transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#22D3EE] text-black font-medium rounded-lg hover:bg-[#40E0D0] transition-colors"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#171717] border border-[#262626] rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-white mb-4">Modifier l'utilisateur</h2>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#a3a3a3] mb-1">Prénom</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#404040] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#a3a3a3] mb-1">Nom</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#404040] transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a3a3a3] mb-1">Nom d'utilisateur</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#404040] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a3a3a3] mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#404040] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a3a3a3] mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#404040] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a3a3a3] mb-1">Rôle</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#404040] transition-colors"
                >
                  {Object.entries(ROLE_LABELS).map(([role, label]) => (
                    <option key={role} value={role}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a3a3a3] mb-1">Numéro de licence</label>
                <input
                  type="text"
                  value={formData.license_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, license_number: e.target.value }))}
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#404040] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a3a3a3] mb-1">Date d'expiration de licence</label>
                <input
                  type="date"
                  value={formData.license_expiry}
                  onChange={(e) => setFormData(prev => ({ ...prev, license_expiry: e.target.value }))}
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#404040] transition-colors"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 border border-[#262626] text-[#a3a3a3] rounded-lg hover:text-white hover:border-[#404040] transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#22D3EE] text-black font-medium rounded-lg hover:bg-[#40E0D0] transition-colors"
                >
                  Mettre à jour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
