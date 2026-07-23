import { api } from './client';

export interface SearchResult {
  id: number;
  type: string;
  title: string;
  subtitle: string;
  url: string;
}

export const searchAPI = {
  globalSearch: async (query: string): Promise<SearchResult[]> => {
    try {
      const response = await api.get(`/core/search/?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching search results:', error);
      throw error;
    }
  }
};
