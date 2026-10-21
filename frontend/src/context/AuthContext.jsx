import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    user_id: 'usr-sre-lead',
    username: 'sre_lead',
    email: 'sre_lead@cloudplatform.internal',
    role: 'sre_engineer',
  });
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const u = await authApi.getCurrentUser();
        if (u) {
          setUser(u);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.warn('Using default demo authenticated session');
      }
    };
    checkAuth();
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const data = await authApi.login(username, password);
      localStorage.setItem('sre_token', data.access_token);
      setUser(data.user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.detail || 'Authentication failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('sre_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
