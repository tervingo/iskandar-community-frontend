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
  heartbeatInterval: ReturnType<typeof setInterval> | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<boolean>;
  logout: () => void;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;
  initAuth: () => void;
  startHeartbeat: () => void;
  stopHeartbeat: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: sessionStorage.getItem('auth_token'),
  loading: false,
  error: null,
  isAuthenticated: false,
  isAdmin: false,
  heartbeatInterval: null,

  login: async (credentials: LoginRequest) => {
    set({ loading: true, error: null });
    try {
      const response: LoginResponse = await authApi.login(credentials);
      
      // Store token only in sessionStorage
      sessionStorage.setItem('auth_token', response.access_token);
      
      set({
        user: response.user,
        token: response.access_token,
        loading: false,
        isAuthenticated: true,
        isAdmin: response.user.role === 'admin'
      });

      // Start heartbeat after successful login
      get().startHeartbeat();
      
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Login failed';
      set({ error: errorMessage, loading: false });
      return false;
    }
  },


  logout: () => {
    // Stop heartbeat first
    get().stopHeartbeat();

    sessionStorage.removeItem('auth_token');
    // Clean up any leftover localStorage tokens
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_token_temp');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isAdmin: false,
      error: null,
      heartbeatInterval: null
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

      // Start heartbeat after successful user retrieval
      get().startHeartbeat();
    } catch (error: any) {
      // Token might be invalid
      get().logout();
      set({ loading: false });
    }
  },

  clearError: () => set({ error: null }),

  initAuth: () => {
    // Clean up any old persistent tokens from previous versions
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_token_temp');

    // Only use sessionStorage
    const token = sessionStorage.getItem('auth_token');
    if (token) {
      set({ token });
      get().getCurrentUser();
    }
  },

  startHeartbeat: () => {
    const { heartbeatInterval } = get();
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }

    const interval = setInterval(async () => {
      const { isAuthenticated } = get();
      if (isAuthenticated) {
        try {
          await authApi.heartbeat();
        } catch (error: any) {
          console.warn('Heartbeat failed:', error);
          // If heartbeat fails due to invalid token, logout
          if (error?.response?.status === 401) {
            get().logout();
          }
        }
      }
    }, 60000); // Every 60 seconds

    set({ heartbeatInterval: interval });
  },

  stopHeartbeat: () => {
    const { heartbeatInterval } = get();
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      set({ heartbeatInterval: null });
    }
  },
}));