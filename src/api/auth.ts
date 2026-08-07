import { api } from './client';

export const authAPI = {
  me: () => api.get('auth/me/'),
  login: (data: any) => api.post('auth/login/', data, { requireAuth: false }),
  changePasswordFirstLogin: (data: any, token?: string) => 
    api.post('auth/change-password-first-login/', data, { 
      requireAuth: !token, 
      headers: token ? { Authorization: `Bearer ${token}` } : undefined 
    }),
};
