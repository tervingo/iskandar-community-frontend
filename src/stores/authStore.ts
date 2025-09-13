import { create } from 'zustand';
import { User, LoginRequest, LoginResponse } from '../types';
import { authApi } from '../services/api';

interface AuthStore {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;

  // Actions
  login: (credentials: LoginRequest) => Promise<boolean>;
  logout: () => void;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token'),
  loading: false,
  error: null,
  isAuthenticated: false,
  isAdmin: false,

  login: async (credentials: LoginRequest) => {
    set({ loading: true, error: null });
    try {
      const response: LoginResponse = await authApi.login(credentials);
      
      // Store token in sessionStorage (and temporarily in localStorage for new windows)
      sessionStorage.setItem('auth_token', response.access_token);
      localStorage.setItem('auth_token_temp', response.access_token);
      // Clear temp token after a short delay
      setTimeout(() => {
        localStorage.removeItem('auth_token_temp');
      }, 5000);
      
      set({ 
        user: response.user,
        token: response.access_token,
        loading: false,
        isAuthenticated: true,
        isAdmin: response.user.role === 'admin'
      });
      
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Login failed';
      set({ error: errorMessage, loading: false });
      return false;
    }
  },


  logout: () => {
    sessionStorage.removeItem('auth_token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_token_temp');
    set({ 
      user: null, 
      token: null, 
      isAuthenticated: false, 
      isAdmin: false,
      error: null 
    });
  },

  getCurrentUser: async () => {
    const { token } = get();
    if (!token) return;

    set({ loading: true });
    try {
      const user = await authApi.getCurrentUser();
      set({ 
        user,
        loading: false,
        isAuthenticated: true,
        isAdmin: user.role === 'admin'
      });
    } catch (error: any) {
      // Token might be invalid
      get().logout();
      set({ loading: false });
    }
  },

  clearError: () => set({ error: null }),

  initAuth: () => {
    // First try sessionStorage (main session)
    let token = sessionStorage.getItem('auth_token');

    // If no session token but there's a temp token (new window case)
    if (!token) {
      const tempToken = localStorage.getItem('auth_token_temp');
      if (tempToken) {
        // Move temp token to session for this window
        sessionStorage.setItem('auth_token', tempToken);
        token = tempToken;
      }
    }

    if (token) {
      set({ token });
      get().getCurrentUser();
    }
  },
}));