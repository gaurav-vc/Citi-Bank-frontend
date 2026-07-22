import { api } from './client';

export const requisitionsAPI = {
  getIndents: (query = '') => api.get(`requisitions/indents/${query}`),
  createIndent: (data: any) => api.post('requisitions/indents/', data),
  getIndent: (id: string | number) => api.get(`requisitions/indents/${id}/`),
  updateIndent: (id: string | number, data: any) => api.patch(`requisitions/indents/${id}/`, data),
  deleteIndent: (id: string | number) => api.delete(`requisitions/indents/${id}/`),
};
