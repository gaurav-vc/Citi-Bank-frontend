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
      const response = await api.get(`search/?q=${encodeURIComponent(query)}`);
      return response as any as SearchResult[];
    } catch (error) {
      console.error('Error fetching search results:', error);
      throw error;
    }
  }
};
