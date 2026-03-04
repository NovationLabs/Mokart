// Configuration de l'API
const API_BASE_URL = 'http://localhost:8081';

// Types pour les réponses API
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  created_at: string;
}

export interface UserProfileUpdate {
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
}

// Classe d'erreur personnalisée pour l'API
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Fonction utilitaire pour les requêtes fetch
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorMessage = `Erreur HTTP ${response.status}`;

      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        // Si la réponse n'est pas du JSON, on garde le message par défaut
      }

      throw new ApiError(errorMessage, response.status);
    }

    // Gérer les réponses vides (comme pour les PUT sans contenu)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    return {} as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Erreurs réseau ou autres
    throw new ApiError(
      error instanceof Error ? error.message : 'Erreur réseau',
      0
    );
  }
}

// Service API
export const api = {
  // URL de base (utile pour la configuration)
  getBaseUrl: () => API_BASE_URL,

  // Service Utilisateurs
  users: {
    // Récupérer le profil utilisateur
    getProfile: (userId: string): Promise<UserProfile> => {
      return apiRequest<UserProfile>(`/users/profile?user_id=${userId}`);
    },

    // Mettre à jour le profil utilisateur
    updateProfile: (userId: string, data: UserProfileUpdate): Promise<UserProfile> => {
      return apiRequest<UserProfile>(`/users/profile?user_id=${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    // Récupérer les notifications
    getNotifications: (userId: string, unreadOnly: boolean = false): Promise<Notification[]> => {
      const params = new URLSearchParams({
        user_id: userId,
        ...(unreadOnly && { unread_only: 'true' }),
      });
      return apiRequest<Notification[]>(`/users/notifications?${params}`);
    },

    // Marquer une notification comme lue
    markNotificationRead: (notificationId: string, userId: string): Promise<{ message: string }> => {
      return apiRequest<{ message: string }>(
        `/users/notifications/${notificationId}/read?user_id=${userId}`,
        { method: 'PUT' }
      );
    },

    // Marquer toutes les notifications comme lues
    markAllNotificationsRead: (userId: string): Promise<{ message: string }> => {
      return apiRequest<{ message: string }>(
        `/users/notifications/read-all?user_id=${userId}`,
        { method: 'PUT' }
      );
    },
  },

  // Service Authentification (à implémenter plus tard)
  auth: {
    login: async (email: string, password: string) => {
      // TODO: Implémenter l'authentification
      throw new Error('Non implémenté');
    },

    logout: async () => {
      // TODO: Implémenter la déconnexion
      throw new Error('Non implémenté');
    },
  },

  // Service Circuits (à connecter avec les endpoints existants)
  circuits: {
    getAll: () => {
      return apiRequest('/circuits');
    },

    getById: (id: string) => {
      return apiRequest(`/circuits/${id}`);
    },
  },

  // Service Sessions (à connecter avec les endpoints existants)
  sessions: {
    getAll: () => {
      return apiRequest('/sessions');
    },

    getById: (id: string) => {
      return apiRequest(`/sessions/${id}`);
    },
  },
};

export default api;
