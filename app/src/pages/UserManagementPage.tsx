import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, Plus, Edit2, Trash2,
  UserCheck, UserX, Shield, Eye, X, Save,
  User, Calendar, Mail, Phone, AlertTriangle, CheckCircle2, AlertCircle
} from 'lucide-react';
import { User as UserType, UserRole, UserCreate, UserUpdate, UserStats, ROLE_LABELS, ROLE_DESCRIPTIONS } from '../types/user';
import { api } from '../services/api';
import usePermissions from '../hooks/usePermissions';
import Sidebar from '../components/Sidebar';

const ROLE_COLORS: Record<UserRole, string> = {
  [UserRole.ADMIN]:       'text-red-400   border-red-400/30   bg-red-400/10',
  [UserRole.COMMISSAIRE]: 'text-blue-400  border-blue-400/30  bg-blue-400/10',
  [UserRole.MECHANIC]:    'text-orange-400 border-orange-400/30 bg-orange-400/10',
  [UserRole.INSTRUCTOR]:  'text-green-400 border-green-400/30 bg-green-400/10',
  [UserRole.DRIVER]:      'text-[#7bf8ac] border-[#7bf8ac]/30 bg-[#7bf8ac]/10',
  [UserRole.SPECTATOR]:   'text-[#94a3b8] border-[#94a3b8]/30 bg-[#94a3b8]/10',
};

const inputCls = 'w-full bg-[#0d0f12] border border-[#262626] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#94a3b8]/40 focus:outline-none focus:border-[#7bf8ac]/40 transition-colors';
const labelCls = 'text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]';

// ─── Modal wrapper ────────────────────────────────────────────────────────────

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold">{title}</h2>
        <button onClick={onClose} className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/5 transition-all">
          <X size={15} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

// ─── User form (shared by create + edit) ─────────────────────────────────────

const UserForm: React.FC<{
  formData: UserCreate;
  onChange: (field: keyof UserCreate, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitLabel: string;
}> = ({ formData, onChange, onSubmit, onCancel, submitLabel }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div className="grid grid-cols-2 gap-3">
      {[
        { field: 'first_name' as const, label: 'Prénom',   required: true },
        { field: 'last_name'  as const, label: 'Nom',      required: true },
      ].map(({ field, label, required }) => (
        <div key={field} className="space-y-1.5">
          <label className={labelCls}>{label}</label>
          <input type="text" required={required} value={formData[field] || ''} onChange={e => onChange(field, e.target.value)} className={inputCls} />
        </div>
      ))}
    </div>
    {[
      { field: 'username'       as const, label: "Nom d'utilisateur", type: 'text',  required: true  },
      { field: 'email'          as const, label: 'Email',             type: 'email', required: true  },
      { field: 'phone'          as const, label: 'Téléphone',         type: 'tel',   required: false },
      { field: 'kart'           as const, label: 'Kart',              type: 'text',  required: false },
      { field: 'license_number' as const, label: 'N° de licence',     type: 'text',  required: false },
      { field: 'license_expiry' as const, label: 'Expiration licence', type: 'date', required: false },
    ].map(({ field, label, type, required }) => (
      <div key={field} className="space-y-1.5">
        <label className={labelCls}>{label}</label>
        <input type={type} required={required} value={formData[field] || ''} onChange={e => onChange(field, e.target.value)} className={inputCls} />
      </div>
    ))}
    <div className="space-y-1.5">
      <label className={labelCls}>Rôle</label>
      <select value={formData.role} onChange={e => onChange('role', e.target.value)} className={inputCls}>
        {Object.entries(ROLE_LABELS).map(([role, label]) => (
          <option key={role} value={role}>{label}</option>
        ))}
      </select>
    </div>
    <div className="flex items-center justify-end gap-3 pt-2">
      <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm text-[#94a3b8] border border-[#262626] hover:text-white hover:border-white/20 transition-all">
        Annuler
      </button>
      <button type="submit" className="btn-primary px-5 py-2 flex items-center gap-2 text-sm">
        <Save size={14} />
        {submitLabel}
      </button>
    </div>
  </form>
);

// ─── Main ─────────────────────────────────────────────────────────────────────

const UserManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { canManageUsers } = usePermissions();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const getUserRole = (): UserRole | null => {
      try {
        const user = localStorage.getItem('mokart_user');
        if (!user) return null;
        return JSON.parse(user).role || null;
      } catch { return null; }
    };
    const role = getUserRole();
    setUserRole(role);
    if (!canManageUsers() && role !== UserRole.ADMIN) { navigate('/'); return; }
    setIsAuthorized(role === UserRole.ADMIN);
  }, [canManageUsers, navigate]);

  const [users,           setUsers]           = useState<UserType[]>([]);
  const [stats,           setStats]           = useState<UserStats | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [searchQuery,     setSearchQuery]     = useState('');
  const [roleFilter,      setRoleFilter]      = useState<UserRole | 'all'>('all');
  const [statusFilter,    setStatusFilter]    = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal,   setShowEditModal]   = useState(false);
  const [selectedUser,    setSelectedUser]    = useState<UserType | null>(null);
  const [message,         setMessage]         = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const emptyForm: UserCreate = { username: '', email: '', first_name: '', last_name: '', phone: '', kart: '', role: UserRole.DRIVER, license_number: '', license_expiry: '' };
  const [formData, setFormData] = useState<UserCreate>(emptyForm);

  const updateForm = (field: keyof UserCreate, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  useEffect(() => { fetchUsers(); fetchStats(); }, []);

  const fetchUsers = async () => {
    try {
      const data = await api.users.getAll();
      setUsers(data.map(u => ({ ...u, role: u.role as UserRole })));
    } catch { setMessage({ type: 'error', text: 'Erreur lors du chargement des utilisateurs' }); }
    finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try { setStats(await api.users.getStats()); } catch { /* silent */ }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newUser = await api.users.create({ ...formData, license_expiry: formData.license_expiry || undefined });
      setUsers(prev => [...prev, { ...newUser, role: newUser.role as UserRole }]);
      setShowCreateModal(false);
      setFormData(emptyForm);
      setMessage({ type: 'success', text: 'Utilisateur créé avec succès' });
      fetchStats();
    } catch { setMessage({ type: 'error', text: "Erreur lors de la création de l'utilisateur" }); }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const updateData: UserUpdate = {};
      if (formData.username       !== selectedUser.username)       updateData.username       = formData.username;
      if (formData.email          !== selectedUser.email)          updateData.email          = formData.email;
      if (formData.first_name     !== selectedUser.first_name)     updateData.first_name     = formData.first_name;
      if (formData.last_name      !== selectedUser.last_name)      updateData.last_name      = formData.last_name;
      if (formData.phone          !== selectedUser.phone)          updateData.phone          = formData.phone;
      if (formData.kart           !== selectedUser.kart)           updateData.kart           = formData.kart;
      if (formData.role           !== selectedUser.role)           updateData.role           = formData.role;
      if (formData.license_number !== selectedUser.license_number) updateData.license_number = formData.license_number;
      if (formData.license_expiry !== selectedUser.license_expiry) updateData.license_expiry = formData.license_expiry || undefined;

      const updated = await api.users.update(selectedUser.id, updateData);
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...updated, role: updated.role as UserRole } : u));
      setShowEditModal(false);
      setFormData(emptyForm);
      setSelectedUser(null);
      setMessage({ type: 'success', text: 'Utilisateur mis à jour avec succès' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || "Erreur lors de la mise à jour de l'utilisateur" });
    }
  };

  const handleToggleStatus = async (user: UserType) => {
    try {
      await api.users.toggleStatus(user.id);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
      setMessage({ type: 'success', text: `Utilisateur ${!user.is_active ? 'activé' : 'désactivé'}` });
      fetchStats();
    } catch { setMessage({ type: 'error', text: 'Erreur lors du changement de statut' }); }
  };

  const handleDeleteUser = async (user: UserType) => {
    if (!window.confirm(`Supprimer ${user.first_name} ${user.last_name} ?`)) return;
    try {
      await api.users.delete(user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      setMessage({ type: 'success', text: 'Utilisateur supprimé' });
      fetchStats();
    } catch { setMessage({ type: 'error', text: "Erreur lors de la suppression" }); }
  };

  const openEdit = (user: UserType) => {
    setSelectedUser(user);
    setFormData({ username: user.username, email: user.email, first_name: user.first_name, last_name: user.last_name, phone: user.phone || '', kart: user.kart || '', role: user.role, license_number: user.license_number || '', license_expiry: user.license_expiry || '' });
    setShowEditModal(true);
  };

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    const matchSearch = u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || `${u.first_name} ${u.last_name}`.toLowerCase().includes(q);
    const matchRole   = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? u.is_active : !u.is_active);
    return matchSearch && matchRole && matchStatus;
  });

  // ── Loading state ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-screen bg-base text-white font-display overflow-hidden relative">
        <div className="absolute inset-0 bg-grid-minimal opacity-40 pointer-events-none" />
        <Sidebar />
        <main className="flex-1 md:ml-16 ml-0 flex items-center justify-center relative z-10">
          <div className="flex items-center gap-2 text-[#94a3b8] text-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#94a3b8]/60 animate-pulse-dot" />
            Chargement...
          </div>
        </main>
      </div>
    );
  }

  // ── Unauthorized ────────────────────────────────────────────────────────────

  if (isAuthorized === false) {
    return (
      <div className="flex min-h-screen bg-base text-white font-display overflow-hidden relative">
        <div className="absolute inset-0 bg-grid-minimal opacity-40 pointer-events-none" />
        <Sidebar />
        <main className="flex-1 md:ml-16 ml-0 flex items-center justify-center pb-20 md:pb-0 relative z-10 p-6">
          <div className="card max-w-md w-full flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-400 mb-1">Accès non autorisé</h3>
              <p className="text-xs text-[#94a3b8]">
                Seuls les administrateurs peuvent accéder à cette page.
                Votre rôle : <span className="text-white font-medium">{ROLE_LABELS[userRole as UserRole] || userRole}</span>
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen bg-base text-white font-display overflow-hidden relative">
      <div className="absolute inset-0 bg-grid-minimal opacity-40 pointer-events-none" />
      <Sidebar />

      <main className="flex-1 md:ml-16 ml-0 flex flex-col h-screen relative z-10">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-20 px-4 sm:px-6 flex-shrink-0 h-14 sm:h-16 flex items-center justify-between border-b border-[#262626] bg-[#0d0f12]/95 backdrop-blur-xl">
          <div>
            <h1 className="text-sm sm:text-base font-semibold tracking-tight">Utilisateurs</h1>
            <p className="text-[10px] sm:text-[11px] text-[#94a3b8]">
              {filteredUsers.length} utilisateur{filteredUsers.length !== 1 ? 's' : ''}
              {stats && <span className="text-[#94a3b8]/50"> · {stats.active_users} actifs</span>}
            </p>
          </div>
          <button
            onClick={() => { setFormData(emptyForm); setShowCreateModal(true); }}
            className="btn-primary flex items-center gap-1.5 text-xs px-3 py-2"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Nouvel utilisateur</span>
            <span className="sm:hidden">Nouveau</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto pb-20 md:pb-0 p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 animate-fade-in">

          {/* ── Alert ─────────────────────────────────────────────────── */}
          {message && (
            <div className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border text-sm ${
              message.type === 'success'
                ? 'bg-[#7bf8ac]/5 border-[#7bf8ac]/20 text-[#7bf8ac]'
                : 'bg-red-500/5 border-red-500/20 text-red-400'
            }`}>
              {message.type === 'success'
                ? <CheckCircle2 size={15} className="shrink-0" />
                : <AlertCircle size={15} className="shrink-0" />}
              <span className="flex-1 text-sm">{message.text}</span>
              <button onClick={() => setMessage(null)} className="opacity-60 hover:opacity-100 transition-opacity">
                <X size={14} />
              </button>
            </div>
          )}

          {/* ── KPI Stats ─────────────────────────────────────────────── */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: 'Total',         value: stats.total_users,        icon: <Users size={16} /> },
                { label: 'Actifs',        value: stats.active_users,       icon: <UserCheck size={16} />, accent: true },
                { label: 'Ce mois',       value: stats.new_users_this_month, icon: <Calendar size={16} /> },
                { label: 'Taux activité', value: `${stats.total_users > 0 ? Math.round((stats.active_users / stats.total_users) * 100) : 0}%`, icon: <Shield size={16} /> },
              ].map(({ label, value, icon, accent }) => (
                <div key={label} className="card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-[#1c1f26] text-[#94a3b8]">{icon}</div>
                    <span className="text-[10px] font-medium uppercase tracking-widest text-[#94a3b8]">{label}</span>
                  </div>
                  <div className={`text-2xl font-bold font-data tracking-tight ${accent ? 'text-[#7bf8ac]' : 'text-white'}`}>{value}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── Filters ───────────────────────────────────────────────── */}
          <div className="card">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]/50" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0d0f12] border border-[#262626] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-[#94a3b8]/40 focus:outline-none focus:border-[#7bf8ac]/40 transition-colors"
                />
              </div>
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value as UserRole | 'all')}
                className="bg-[#0d0f12] border border-[#262626] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7bf8ac]/40 transition-colors"
              >
                <option value="all">Tous les rôles</option>
                {Object.entries(ROLE_LABELS).map(([role, label]) => (
                  <option key={role} value={role}>{label}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="bg-[#0d0f12] border border-[#262626] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7bf8ac]/40 transition-colors"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
              </select>
            </div>
          </div>

          {/* ── Table ─────────────────────────────────────────────────── */}
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#262626]">
                    {['Utilisateur', 'Rôle', 'Contact', 'Licence', 'Statut', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262626]">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-[#94a3b8]">
                        Aucun utilisateur trouvé
                      </td>
                    </tr>
                  ) : filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Utilisateur */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-[11px] font-bold text-[#94a3b8] shrink-0">
                            {(user.first_name || '').charAt(0).toUpperCase()}{(user.last_name || '').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{user.first_name} {user.last_name}</div>
                            <div className="text-[11px] text-[#94a3b8]">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      {/* Rôle */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${ROLE_COLORS[user.role] || 'text-[#94a3b8] border-[#262626]'}`}>
                          {user.role === UserRole.ADMIN && <Shield size={10} />}
                          {ROLE_LABELS[user.role] || user.role}
                        </span>
                      </td>
                      {/* Contact */}
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-white">
                            <Mail size={11} className="text-[#94a3b8] shrink-0" />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-[#94a3b8]">
                              <Phone size={11} className="shrink-0" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      {/* Licence */}
                      <td className="px-4 py-3">
                        {user.license_number ? (
                          <div>
                            <div className="text-xs font-data text-white">{user.license_number}</div>
                            {user.license_expiry && (
                              <div className="text-[11px] text-[#94a3b8]">
                                exp. {new Date(user.license_expiry).toLocaleDateString('fr-FR')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-[#94a3b8]/50">—</span>
                        )}
                      </td>
                      {/* Statut */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-[#7bf8ac]' : 'bg-[#94a3b8]/30'}`} />
                          <span className={`text-xs font-medium ${user.is_active ? 'text-[#7bf8ac]' : 'text-[#94a3b8]/50'}`}>
                            {user.is_active ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(user)} title="Modifier"
                            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/5 transition-all">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleToggleStatus(user)} title={user.is_active ? 'Désactiver' : 'Activer'}
                            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/5 transition-all">
                            {user.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                          </button>
                          <button onClick={() => handleDeleteUser(user)} title="Supprimer"
                            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-red-400 hover:bg-red-400/5 transition-all">
                            <Trash2 size={14} />
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

      {/* ── Create Modal ────────────────────────────────────────────────── */}
      {showCreateModal && (
        <Modal title="Nouvel utilisateur" onClose={() => { setShowCreateModal(false); setFormData(emptyForm); }}>
          <UserForm
            formData={formData}
            onChange={updateForm}
            onSubmit={handleCreateUser}
            onCancel={() => { setShowCreateModal(false); setFormData(emptyForm); }}
            submitLabel="Créer"
          />
        </Modal>
      )}

      {/* ── Edit Modal ──────────────────────────────────────────────────── */}
      {showEditModal && selectedUser && (
        <Modal title="Modifier l'utilisateur" onClose={() => { setShowEditModal(false); setFormData(emptyForm); setSelectedUser(null); }}>
          <UserForm
            formData={formData}
            onChange={updateForm}
            onSubmit={handleUpdateUser}
            onCancel={() => { setShowEditModal(false); setFormData(emptyForm); setSelectedUser(null); }}
            submitLabel="Enregistrer"
          />
        </Modal>
      )}
    </div>
  );
};

export default UserManagementPage;
