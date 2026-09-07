import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { apiClient } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (emailOrNik: string, passwordPlain: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('dexa_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('dexa_token');
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (token) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const refreshUser = async () => {
    try {
      const res = await apiClient.get('/api/auth/me');
      if (res.data?.success && res.data.user) {
        setUser(res.data.user);
        localStorage.setItem('dexa_user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.warn('Session expired or invalid token');
      logout();
    }
  };

  const login = async (emailOrNik: string, passwordPlain: string): Promise<User> => {
    const res = await apiClient.post('/api/auth/login', {
      emailOrNik,
      password: passwordPlain,
    });

    if (res.data?.success && res.data.accessToken) {
      const receivedToken = res.data.accessToken;
      const receivedUser = res.data.user;

      localStorage.setItem('dexa_token', receivedToken);
      localStorage.setItem('dexa_user', JSON.stringify(receivedUser));

      setToken(receivedToken);
      setUser(receivedUser);
      return receivedUser;
    } else {
      throw new Error(res.data?.message || 'Login gagal');
    }
  };

  const logout = () => {
    localStorage.removeItem('dexa_token');
    localStorage.removeItem('dexa_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
