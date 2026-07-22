import { api } from './client';

export const dashboardAPI = {
  getMetrics: () => api.get('dashboard/metrics/'),
  getSuperAdminDashboard: () => api.get('reports/super-admin-dashboard/'),
};
