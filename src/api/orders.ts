import { api } from './client';

export const ordersAPI = {
  getOrders: (query = '') => api.get(`orders/${query}`),
  getOrder: (id: string | number) => api.get(`orders/${id}/`),
  createOrder: (data: any) => api.post('orders/', data),
  updateOrder: (id: string | number, data: any) => api.patch(`orders/${id}/`, data),
  duplicateOrder: (id: string | number) => api.post(`orders/${id}/duplicate/`),
  archiveOrder: (id: string | number) => api.post(`orders/${id}/archive/`),
  closeOrder: (id: string | number) => api.post(`orders/${id}/close/`),
};
