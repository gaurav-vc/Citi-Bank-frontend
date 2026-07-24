import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { User } from '@/types';

import { authAPI } from '@/api/auth';

const TOKEN_KEY = 'campusspend_token';
const USER_KEY = 'campusspend_user';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: (jwt?: string) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function decodeJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

function validateTokenRoute(pathname: string, module: string, docId: string): boolean {
  const normPath = pathname.toLowerCase();
  const normDocId = docId.toLowerCase();
  if (module === 'rfqs') {
    return normPath.includes('/tendering/rfq') || normPath.includes('/rfqs');
  }
  if (module === 'invoices') {
    return normPath.includes('/billing/invoices/') && normPath.includes(normDocId);
  }
  if (module === 'payments') {
    return normPath.includes('/payments/proposals/') && normPath.includes(normDocId);
  }
  return false;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Fetch fresh user data (with permissions) from the server
  const refreshUser = async (jwt?: string): Promise<void> => {
    const activeToken = jwt || localStorage.getItem(TOKEN_KEY);
    if (!activeToken) return;
    try {
      const data = await authAPI.me();
      // Support both { user: {...} } and flat { id, email, ... } response shapes
      const userData: User = data.user || data;
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      setUser(userData);
    } catch (err) {
      console.warn('[AuthContext] refreshUser failed:', err);
      throw err;
    }
  };

  useEffect(() => {
    const handleUrlToken = async () => {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      if (urlToken) {
        // Clean URL
        params.delete('token');
        const newSearch = params.toString();
        const newPath = window.location.pathname + (newSearch ? `?${newSearch}` : '');
        window.history.replaceState({}, document.title, newPath);

        const decoded = decodeJwt(urlToken);
        if (!decoded || !decoded.approval_link || decoded.purpose !== 'email_approval') {
          setAuthError('Invalid or expired approval link.');
          setIsLoading(false);
          return;
        }

        const { module, document_id, role } = decoded;
        if (!validateTokenRoute(window.location.pathname, module, document_id)) {
          setAuthError('Invalid or expired approval link.');
          setIsLoading(false);
          return;
        }

        try {
          localStorage.setItem(TOKEN_KEY, urlToken);
          setToken(urlToken);

          await refreshUser(urlToken);

          const storedUser = localStorage.getItem(USER_KEY);
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.role !== role) {
              localStorage.removeItem(TOKEN_KEY);
              localStorage.removeItem(USER_KEY);
              setToken(null);
              setUser(null);
              setAuthError('Invalid or expired approval link.');
              setIsLoading(false);
              return;
            }
          }
        } catch (e) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setToken(null);
          setUser(null);
          setAuthError('Invalid or expired approval link.');
          setIsLoading(false);
          return;
        }
        setIsLoading(false);
        return;
      }

      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          // Refresh permissions from server in background — don't block render
          refreshUser(storedToken).finally(() => setIsLoading(false));
          return;
        } catch {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        }
      }
      setIsLoading(false);
    };

    handleUrlToken();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const data = await authAPI.login({ email, password });
      const jwt = data.token;
      const userData = data.user;
      if (!jwt || !userData) return false;
      localStorage.setItem(TOKEN_KEY, jwt);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      setToken(jwt);
      setUser(userData);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F4F8] p-4">
        <div className="w-full max-w-[460px] border-2 border-red-600 shadow-[0_8px_30px_rgb(0,0,0,0.06)] bg-white rounded-2xl p-10 font-sans text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-3 bg-red-100 rounded-full">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-[#0D1B2A] tracking-tight">Invalid or expired approval link.</h2>
          <p className="text-sm text-slate-500 font-medium">This link may have expired or is not authorized for your account.</p>
          <button
            onClick={() => {
              setAuthError(null);
              window.location.href = '/login';
            }}
            className="w-full h-[48px] font-bold text-[15px] bg-[#002D62] hover:bg-[#001D3D] text-white transition-colors rounded-lg shadow-sm"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshUser, isAuthenticated: !!token, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}