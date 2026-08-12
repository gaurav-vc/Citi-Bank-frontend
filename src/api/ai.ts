import { api } from './client';

export const aiAPI = {
  sendMessage: async (message: string): Promise<{ response?: string, error?: string }> => {
    try {
      const response: any = await api.post('core/ai-assistant/', { message });
      return { response: response.response };
    } catch (error: any) {
      if (error.data) {
        if (error.data.response) return { response: error.data.response };
        if (error.data.error) return { error: error.data.error };
      }
      return { error: error.message || 'Failed to communicate with AI Assistant.' };
    }
  },
};
