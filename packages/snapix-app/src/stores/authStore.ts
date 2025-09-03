import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface User {
  _id: string;
  email?: string;
  name: string;
  profilePicture?: string;
  metadata?: Record<string, any>;
  isGuest?: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  login: () => void;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  immer((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    setUser: (user) =>
      set((state) => {
        state.user = user;
        state.isAuthenticated = !!user;
      }),

    login: () => {
      window.location.href = `${import.meta.env.VITE_API_URL}/auth/facebook`;
    },

    loginWithGoogle: () => {
      window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
    },

    loginAsGuest: () => {
      const guestUser: User = {
        _id: `guest_${Date.now()}`,
        name: 'Guest User',
        isGuest: true,
      };
      
      // Store guest session in localStorage first
      localStorage.setItem('guestSession', JSON.stringify(guestUser));
      
      set((state) => {
        state.user = guestUser;
        state.isAuthenticated = true;
        state.error = null;
      });
    },

    logout: async () => {
      try {
        const user = get().user;
        
        // If guest user, just clear local storage
        if (user?.isGuest) {
          localStorage.removeItem('guestSession');
        } else {
          // For authenticated users, call logout API
          await fetch(`${import.meta.env.VITE_TRPC_URL}/auth.logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
          });

          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
        
        set((state) => {
          state.user = null;
          state.isAuthenticated = false;
        });
        window.location.href = '/login';
      } catch (error) {
        console.error('Logout error:', error);
      }
    },

    fetchUser: async () => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('No token found');
        }

        // Note: Direct fetch for non-React context, use trpc hooks in components
        const response = await fetch(`${import.meta.env.VITE_TRPC_URL}/auth.me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }

        const userData = await response.json();
        set((state) => {
          state.user = userData.result.data;
          state.isAuthenticated = true;
          state.isLoading = false;
        });
      } catch (error: any) {
        set((state) => {
          state.user = null;
          state.isAuthenticated = false;
          state.isLoading = false;
          state.error = error.message;
        });
      }
    },

    refreshToken: async () => {
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token found');
        }

        const response = await fetch(`${import.meta.env.VITE_TRPC_URL}/auth.refreshToken`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
          throw new Error('Failed to refresh token');
        }

        const data = await response.json();
        const { accessToken, refreshToken: newRefreshToken } = data.result.data;
        
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
      } catch (error) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    },

    clearError: () =>
      set((state) => {
        state.error = null;
      }),
  }))
);