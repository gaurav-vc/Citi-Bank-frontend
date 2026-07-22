import { api } from './client';

export const paymentsAPI = {
  getPayments: async () => {
    return await api.get('payments/');
  },
  
  getEligibleVendors: async () => {
    return await api.get('payments/eligible-vendors/');
  },

  updatePayment: async (id: string, data: any) => {
    return await api.put(`payments/${id}/`, data);
  },
  
  processPayment: async (id: string, actionData: any) => {
    return await api.post(`payments/${id}/process/`, actionData);
  },
};
