import { api } from './client';

export const authAPI = {
  me: () => api.get('auth/me/'),
  login: (data: any) => api.post('auth/login/', data, { requireAuth: false }),
  forgotPassword: (email: string) => 
    api.post('auth/forgot-password/', { email }, { requireAuth: false }),
  resetPassword: (data: { email: string; code: string; reset_token?: string; new_password: string }) => 
    api.post('auth/reset-password/', data, { requireAuth: false }),
  changePasswordFirstLogin: (data: any, token?: string) => 
    api.post('auth/change-password-first-login/', data, { 
      requireAuth: !token, 
      headers: token ? { Authorization: `Bearer ${token}` } : undefined 
    }),
  updateUser: (id: string | number, data: any) => api.patch(`users/${id}/`, data),
};
