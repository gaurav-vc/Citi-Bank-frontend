import { api } from './client';

export const commonAPI = {
  getVendors: () => api.get('vendors/'),
  getOrganizations: () => api.get('organizations/'),
  getSites: () => api.get('sites/'),
  getUsers: () => api.get('users/'),
  getItems: () => api.get('items/'),
};
