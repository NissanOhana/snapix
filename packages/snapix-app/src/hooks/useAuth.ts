import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    loginAsGuest,
    logout,
    fetchUser,
    clearError,
    setUser,
  } = useAuthStore();

  useEffect(() => {
    if (isLoading || user) return;
    
    // Check for guest session first
    const guestSession = localStorage.getItem('guestSession');
    if (guestSession) {
      try {
        const guestUser = JSON.parse(guestSession);
        setUser(guestUser);
        return;
      } catch (error) {
        console.error('Failed to parse guest session:', error);
        localStorage.removeItem('guestSession');
      }
    }
    
    // Check for regular auth token
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchUser();
    }
  }, [user, isLoading, setUser, fetchUser]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    loginAsGuest,
    logout,
    clearError,
  };
};