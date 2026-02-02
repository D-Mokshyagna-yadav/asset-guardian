import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, AuthState } from '@/types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data for demo
const mockUsers: Record<string, { password: string; user: User }> = {
  'admin@college.edu': {
    password: 'admin123',
    user: {
      id: '1',
      name: 'John Administrator',
      email: 'admin@college.edu',
      role: 'SUPER_ADMIN',
      isActive: true,
      createdAt: '2024-01-01',
    },
  },
  'staff@college.edu': {
    password: 'staff123',
    user: {
      id: '2',
      name: 'Sarah Tech',
      email: 'staff@college.edu',
      role: 'IT_STAFF',
      isActive: true,
      createdAt: '2024-01-15',
    },
  },
  'hod@college.edu': {
    password: 'hod123',
    user: {
      id: '3',
      name: 'Dr. Michael Dean',
      email: 'hod@college.edu',
      role: 'DEPARTMENT_INCHARGE',
      departmentId: 'dept-1',
      isActive: true,
      createdAt: '2024-02-01',
    },
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  });

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const userData = mockUsers[email];
    if (userData && userData.password === password) {
      setAuthState({
        user: userData.user,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    }
    
    setAuthState(prev => ({ ...prev, isLoading: false }));
    return false;
  }, []);

  const logout = useCallback(() => {
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
