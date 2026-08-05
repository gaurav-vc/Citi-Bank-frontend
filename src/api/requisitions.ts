import { api } from './client';

export const requisitionsAPI = {
  getIndents: (query = '') => api.get(`indents/${query}`),
  createIndent: (data: any) => api.post('indents/', data),
  getIndent: (id: string | number) => api.get(`indents/${id}/`),
  updateIndent: (id: string | number, data: any) => api.patch(`indents/${id}/`, data),
  deleteIndent: (id: string | number) => api.delete(`indents/${id}/`),
};
