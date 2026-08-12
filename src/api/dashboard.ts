import { api } from './client';

export const dashboardAPI = {
  getMetrics: () => api.get('dashboard/metrics/'),
  getSuperAdminDashboard: () => api.get('reports/super-admin-dashboard/'),
  getDocumentation: () => api.get('documentation/'),
  createDocumentation: (data: FormData) => api.post('documentation/', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateDocumentation: (id: string | number, data: FormData) => api.put(`documentation/${id}/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteDocumentation: (id: string | number) => api.delete(`documentation/${id}/`),
};
