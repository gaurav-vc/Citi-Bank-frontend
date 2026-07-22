// Determine base URL depending on whether we are in production or local development
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.MODE === 'production' 
    ? 'https://procurement.vibesandbox.live' 
    : 'http://localhost:8000');

export class APIError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'APIError';
  }
}

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

export const apiClient = async (endpoint: string, options: FetchOptions = {}) => {
  const { requireAuth = true, ...customConfig } = options;
  
  // If it's a FormData body, let the browser set the Content-Type to multipart/form-data with the boundary.
  const isFormData = customConfig.body instanceof FormData;
  
  const headers: HeadersInit = {
    ...customConfig.headers,
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (requireAuth) {
    const token = localStorage.getItem('campusspend_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  let url = endpoint;
  if (endpoint.startsWith('http')) {
    // leave url as is
  } else if (endpoint.startsWith('/')) {
    url = `${API_BASE_URL}${endpoint}`;
  } else {
    // Ensure we don't accidentally add /api/ if the endpoint already starts with it
    if (endpoint.startsWith('api/')) {
      url = `${API_BASE_URL}/${endpoint}`;
    } else {
      url = `${API_BASE_URL}/api/${endpoint}`;
    }
  }

  const config: RequestInit = {
    ...customConfig,
    headers,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = null;
      }
      throw new APIError(`HTTP error! status: ${response.status}`, response.status, errorData);
    }
    
    // For 204 No Content
    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.blob(); 
    }
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    console.error(`[API Client] Error fetching ${url}:`, error);
    throw new Error(error instanceof Error ? error.message : 'Unknown network error');
  }
};

export const api = {
  get: (endpoint: string, options?: FetchOptions) => 
    apiClient(endpoint, { ...options, method: 'GET' }),
  post: (endpoint: string, data?: any, options?: FetchOptions) => {
      const isFormData = data instanceof FormData;
      return apiClient(endpoint, { ...options, method: 'POST', body: isFormData ? data : JSON.stringify(data) })
  },
  put: (endpoint: string, data?: any, options?: FetchOptions) => {
      const isFormData = data instanceof FormData;
      return apiClient(endpoint, { ...options, method: 'PUT', body: isFormData ? data : JSON.stringify(data) })
  },
  patch: (endpoint: string, data?: any, options?: FetchOptions) => {
      const isFormData = data instanceof FormData;
      return apiClient(endpoint, { ...options, method: 'PATCH', body: isFormData ? data : JSON.stringify(data) })
  },
  delete: (endpoint: string, options?: FetchOptions) => 
    apiClient(endpoint, { ...options, method: 'DELETE' }),
};
