import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, AuthState } from '@/types';
import { authApi } from '@/lib/api';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Check for existing token on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }

      try {
        const response = await authApi.getProfile();
        if (response.data.success && response.data.data?.user) {
          setAuthState({
            user: response.data.data.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          throw new Error('Invalid profile response');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    checkAuthStatus();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await authApi.login(email, password);
      
      if (response.data.success && response.data.data) {
        const { user, accessToken } = response.data.data;
        
        // Store access token (refresh token is set as HTTP-only cookie by backend)
        localStorage.setItem('accessToken', accessToken);
        
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
        
        return true;
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if API call fails
    }
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
