import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  FileText,
  Download,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
  Mail,
  Phone,
  User,
  Edit2,
  Trash2,
  Receipt
} from 'lucide-react';
import Header from '../components/Header';
import usePermissions from '../hooks/usePermissions';
import { UserRole, ROLE_LABELS } from '../types/user';

interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  due_date: string;
  created_at: string;
  description: string;
  items: {
    name: string;
    quantity: number;
    unit_price: number;
    total: number;
  }[];
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  total_invoiced: number;
  total_paid: number;
  balance: number;
  status: 'active' | 'inactive';
  created_at: string;
}

const BillingPage: React.FC = () => {
  const navigate = useNavigate();
  const { canReadBilling, canManageBilling } = usePermissions();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  const [activeTab, setActiveTab] = useState<'invoices' | 'customers' | 'analytics'>('invoices');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [message, setMessage] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);

  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: 'inv_001',
      invoice_number: 'INV-2024-001',
      client_name: 'Jean Pilot',
      client_email: 'jean.pilot@email.com',
      amount: 150.00,
      status: 'paid',
      due_date: '2024-03-15',
      created_at: '2024-03-01',
      description: 'Session de karting - 10 tours',
      items: [
        { name: 'Session karting 30min', quantity: 1, unit_price: 50.00, total: 50.00 },
        { name: 'Location équipement', quantity: 1, unit_price: 25.00, total: 25.00 },
        { name: 'Assurance', quantity: 1, unit_price: 15.00, total: 15.00 },
        { name: 'Boissons', quantity: 3, unit_price: 20.00, total: 60.00 }
      ]
    },
    {
      id: 'inv_002',
      invoice_number: 'INV-2024-002',
      client_name: 'Marie Racer',
      client_email: 'marie.racer@email.com',
      amount: 75.00,
      status: 'pending',
      due_date: '2024-03-20',
      created_at: '2024-03-10',
      description: 'Session de karting - 5 tours',
      items: [
        { name: 'Session karting 15min', quantity: 1, unit_price: 35.00, total: 35.00 },
        { name: 'Location équipement', quantity: 1, unit_price: 25.00, total: 25.00 },
        { name: 'Assurance', quantity: 1, unit_price: 15.00, total: 15.00 }
      ]
    },
    {
      id: 'inv_003',
      invoice_number: 'INV-2024-003',
      client_name: 'Pierre Speed',
      client_email: 'pierre.speed@email.com',
      amount: 200.00,
      status: 'overdue',
      due_date: '2024-03-05',
      created_at: '2024-02-20',
      description: 'Abonnement mensuel',
      items: [
        { name: 'Abonnement mensuel', quantity: 1, unit_price: 180.00, total: 180.00 },
        { name: 'Frais dossier', quantity: 1, unit_price: 20.00, total: 20.00 }
      ]
    }
  ]);

  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: 'cust_001',
      name: 'Jean Pilot',
      email: 'jean.pilot@email.com',
      phone: '06 12 34 56 78',
      company: 'Racing Team Pro',
      total_invoiced: 1250.00,
      total_paid: 1100.00,
      balance: 150.00,
      status: 'active',
      created_at: '2023-06-15'
    },
    {
      id: 'cust_002',
      name: 'Marie Racer',
      email: 'marie.racer@email.com',
      phone: '06 23 45 67 89',
      total_invoiced: 850.00,
      total_paid: 850.00,
      balance: 0.00,
      status: 'active',
      created_at: '2023-08-20'
    },
    {
      id: 'cust_003',
      name: 'Pierre Speed',
      email: 'pierre.speed@email.com',
      phone: '06 34 56 78 90',
      total_invoiced: 450.00,
      total_paid: 250.00,
      balance: 200.00,
      status: 'inactive',
      created_at: '2023-04-10'
    }
  ]);

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

    if (!canReadBilling()) {
      navigate('/');
      return;
    }

    setIsAuthorized(true);
  }, [canReadBilling, navigate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-emerald-500 bg-emerald-500/10';
      case 'pending': return 'text-yellow-500 bg-yellow-500/10';
      case 'overdue': return 'text-red-500 bg-red-500/10';
      case 'active': return 'text-emerald-500 bg-emerald-500/10';
      case 'inactive': return 'text-gray-500 bg-gray-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'overdue': return <AlertCircle className="w-4 h-4" />;
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'inactive': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Payée';
      case 'pending': return 'En attente';
      case 'overdue': return 'En retard';
      case 'active': return 'Actif';
      case 'inactive': return 'Inactif';
      default: return status;
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         invoice.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         invoice.client_email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (customer.company && customer.company.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const pendingRevenue = invoices
    .filter(inv => inv.status === 'pending')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const overdueRevenue = invoices
    .filter(inv => inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const handleInvoiceAction = async (invoiceId: string, action: 'mark_paid' | 'send_reminder' | 'delete') => {
    try {
      switch (action) {
        case 'mark_paid':
          setInvoices(prev => prev.map(inv =>
            inv.id === invoiceId ? { ...inv, status: 'paid' as const } : inv
          ));
          setMessage({ type: 'success', text: 'Facture marquée comme payée' });
          break;
        case 'send_reminder':
          setMessage({ type: 'success', text: 'Rappel envoyé au client' });
          break;
        case 'delete':
          if (window.confirm('Êtes-vous sûr de vouloir supprimer cette facture?')) {
            setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
            setMessage({ type: 'success', text: 'Facture supprimée avec succès' });
          }
          break;
      }
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: `Erreur lors de l'action ${action}` });
      setTimeout(() => setMessage(null), 5000);
    }
  };

  if (isAuthorized === false) {
    return (
      <div className="flex-1 md:ml-64 ml-0 relative z-10 flex flex-col h-screen">
        <Header className="flex-shrink-0" />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 pb-20 md:pb-6">
            <div className="max-w-2xl mx-auto">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 sm:p-6 mb-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-red-400 mb-1">Accès non autorisé</h3>
                    <p className="text-sm text-red-300">
                      Vous n'avez pas les permissions nécessaires pour accéder à la facturation.
                      Votre rôle actuel : <span className="font-medium">{userRole ? ROLE_LABELS[userRole] : 'Inconnu'}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 md:ml-64 ml-0 relative z-10 flex flex-col h-screen">
      <Header className="flex-shrink-0" />

      <main className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 pb-20 md:pb-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Facturation</h1>
              <p className="text-[#94a3b8] text-sm mt-1">Gestion des factures et clients</p>
            </div>
            {canManageBilling() && (
              <button
                className="flex items-center gap-2 px-4 py-2 bg-[#7bf8ac] text-black font-semibold rounded-full hover:opacity-90 transition-all w-full sm:w-auto justify-center"
              >
                <Plus className="w-4 h-4" />
                Nouvelle Facture
              </button>
            )}
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mb-6 p-3 sm:p-4 rounded-lg border text-sm ${
                message.type === 'success'
                  ? 'bg-green-900/20 border-green-500 text-green-400'
                  : message.type === 'warning'
                  ? 'bg-yellow-900/20 border-yellow-500 text-yellow-400'
                  : 'bg-red-900/20 border-red-500 text-red-400'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="card">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] text-[#94a3b8] uppercase tracking-wider">Revenus totaux</span>
              </div>
              <div className="text-2xl font-bold text-emerald-500">{totalRevenue.toFixed(2)}€</div>
            </div>
            <div className="card">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span className="text-[10px] text-[#94a3b8] uppercase tracking-wider">En attente</span>
              </div>
              <div className="text-2xl font-bold text-yellow-500">{pendingRevenue.toFixed(2)}€</div>
            </div>
            <div className="card">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-[10px] text-[#94a3b8] uppercase tracking-wider">En retard</span>
              </div>
              <div className="text-2xl font-bold text-red-500">{overdueRevenue.toFixed(2)}€</div>
            </div>
            <div className="card">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-[#7bf8ac]" />
                <span className="text-[10px] text-[#94a3b8] uppercase tracking-wider">Clients</span>
              </div>
              <div className="text-2xl font-bold text-white">{customers.length}</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="card mb-6">
            <div className="flex border-b border-[#262626]">
              <button
                onClick={() => setActiveTab('invoices')}
                className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'invoices'
                    ? 'text-[#7bf8ac] border-[#7bf8ac]'
                    : 'text-[#94a3b8] border-transparent hover:text-white'
                }`}
              >
                Factures
              </button>
              <button
                onClick={() => setActiveTab('customers')}
                className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'customers'
                    ? 'text-[#7bf8ac] border-[#7bf8ac]'
                    : 'text-[#94a3b8] border-transparent hover:text-white'
                }`}
              >
                Clients
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'analytics'
                    ? 'text-[#7bf8ac] border-[#7bf8ac]'
                    : 'text-[#94a3b8] border-transparent hover:text-white'
                }`}
              >
                Analytics
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="card mb-6">
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#94a3b8] w-4 h-4" />
                <input
                  type="text"
                  placeholder={activeTab === 'invoices' ? "Rechercher une facture..." : "Rechercher un client..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0d0f12] border border-[#262626] rounded-lg pl-10 pr-4 py-2.5 text-white text-sm placeholder-[#737373] focus:outline-none focus:border-[#7bf8ac]/50 transition-colors"
                />
              </div>
              {activeTab === 'invoices' && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="flex-1 bg-[#0d0f12] border border-[#262626] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#7bf8ac]/50 transition-colors"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="paid">Payées</option>
                  <option value="pending">En attente</option>
                  <option value="overdue">En retard</option>
                </select>
              )}
            </div>
          </div>

          {/* Content */}
          {activeTab === 'invoices' && (
            <div className="space-y-4">
              {filteredInvoices.map((invoice) => (
                <div key={invoice.id} className="card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-sm font-medium text-white">{invoice.invoice_number}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(invoice.status)}`}>
                          {getStatusIcon(invoice.status)}
                          {getStatusLabel(invoice.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[#94a3b8]">
                        <span>Client: {invoice.client_name}</span>
                        <span>Email: {invoice.client_email}</span>
                        <span>Échéance: {new Date(invoice.due_date).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">{invoice.amount.toFixed(2)}€</div>
                    </div>
                  </div>

                  <div className="border-t border-[#262626] pt-3 mb-3">
                    <p className="text-sm text-[#94a3b8] mb-2">{invoice.description}</p>
                    <div className="space-y-1">
                      {invoice.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-xs">
                          <span className="text-[#94a3b8]">{item.quantity}x {item.name}</span>
                          <span className="text-white">{item.total.toFixed(2)}€</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {canManageBilling() && (
                    <div className="flex gap-2">
                      {invoice.status !== 'paid' && (
                        <button
                          onClick={() => handleInvoiceAction(invoice.id, 'mark_paid')}
                          className="flex items-center gap-1 px-3 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-500 rounded-lg hover:bg-emerald-500/30 transition-colors text-xs"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Marquer payée
                        </button>
                      )}
                      <button
                        onClick={() => handleInvoiceAction(invoice.id, 'send_reminder')}
                        className="flex items-center gap-1 px-3 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-500 rounded-lg hover:bg-blue-500/30 transition-colors text-xs"
                      >
                        <Mail className="w-3 h-3" />
                        Envoyer rappel
                      </button>
                      <button
                        onClick={() => handleInvoiceAction(invoice.id, 'delete')}
                        className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'customers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCustomers.map((customer) => (
                <div key={customer.id} className="card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#1c1f26] rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-[#94a3b8]" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-white">{customer.name}</h3>
                        {customer.company && (
                          <p className="text-xs text-[#94a3b8]">{customer.company}</p>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(customer.status)}`}>
                      {getStatusIcon(customer.status)}
                      {getStatusLabel(customer.status)}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-[#94a3b8]">
                      <Mail className="w-3 h-3" />
                      <span>{customer.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#94a3b8]">
                      <Phone className="w-3 h-3" />
                      <span>{customer.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#94a3b8]">
                      <Calendar className="w-3 h-3" />
                      <span>Client depuis {new Date(customer.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>

                  <div className="border-t border-[#262626] pt-3">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="text-[#94a3b8]">Facturé</div>
                        <div className="font-medium text-white">{customer.total_invoiced.toFixed(2)}€</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[#94a3b8]">Payé</div>
                        <div className="font-medium text-emerald-500">{customer.total_paid.toFixed(2)}€</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[#94a3b8]">Solde</div>
                        <div className={`font-medium ${customer.balance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                          {customer.balance.toFixed(2)}€
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-sm font-medium text-white mb-4">Répartition par statut</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#94a3b8]">Factures payées</span>
                    <span className="text-sm font-medium text-emerald-500">
                      {invoices.filter(inv => inv.status === 'paid').length} ({totalRevenue.toFixed(2)}€)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#94a3b8]">En attente</span>
                    <span className="text-sm font-medium text-yellow-500">
                      {invoices.filter(inv => inv.status === 'pending').length} ({pendingRevenue.toFixed(2)}€)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#94a3b8]">En retard</span>
                    <span className="text-sm font-medium text-red-500">
                      {invoices.filter(inv => inv.status === 'overdue').length} ({overdueRevenue.toFixed(2)}€)
                    </span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-sm font-medium text-white mb-4">Top clients</h3>
                <div className="space-y-3">
                  {customers
                    .sort((a, b) => b.total_invoiced - a.total_invoiced)
                    .slice(0, 5)
                    .map((customer, index) => (
                      <div key={customer.id} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">#{index + 1}</span>
                          <span className="text-sm text-[#94a3b8]">{customer.name}</span>
                        </div>
                        <span className="text-sm font-medium text-white">{customer.total_invoiced.toFixed(2)}€</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BillingPage;
