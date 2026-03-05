import { DashboardData } from '../types/dashboard';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const dashboardService = {
  async getDashboardData(): Promise<DashboardData> {
    const userStr = localStorage.getItem('mokart_user');
    if (!userStr) {
      throw new Error('Utilisateur non connecté');
    }

    const user = JSON.parse(userStr);
    const userId = user.id;
    const userRole = user.role || 'pilot';

    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/data?user_id=${userId}&role=${userRole}`, {
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
