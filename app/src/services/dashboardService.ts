import { DashboardData } from '../types/dashboard';
import { API_BASE_URL, authFetch } from './api';

export const dashboardService = {
  async getDashboardData(): Promise<DashboardData> {
    const userStr = localStorage.getItem('mokart_user');
    if (!userStr) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      const response = await authFetch(`${API_BASE_URL}/dashboard/data`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des données du dashboard:', error);
      throw error;
    }
  }
};
