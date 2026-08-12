import { api } from './client';

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  link_url?: string;
  is_read: boolean;
  created_at: string;
}

export const notificationsAPI = {
  getNotifications: async (): Promise<NotificationItem[]> => {
    const response: any = await api.get('notifications/');
    return response.results || response || [];
  },

  markAsRead: async (id: number): Promise<void> => {
    await api.post(`notifications/${id}/mark_read/`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.post('notifications/mark_all_read/');
  },
};
