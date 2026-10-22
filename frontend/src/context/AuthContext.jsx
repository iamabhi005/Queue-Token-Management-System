import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('smartqueue_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('smartqueue_token') || null;
  });

  const [loading, setLoading] = useState(false);

  // Auto logout when session expires (401 from backend API)
  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('smartqueue_auth_expired', handleExpired);
    return () => window.removeEventListener('smartqueue_auth_expired', handleExpired);
  }, []);

  // Login with real backend API
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authAPI.login(email, password);
      if (res.success && res.token) {
        setToken(res.token);
        setUser(res.data.user);
        localStorage.setItem('smartqueue_token', res.token);
        localStorage.setItem('smartqueue_auth_user', JSON.stringify(res.data.user));
        return { success: true, user: res.data.user };
      }
      return { success: false, message: res.message || 'Login failed.' };
    } catch (err) {
      return {
        success: false,
        message: err.message || 'Unable to connect to backend server. Make sure it is running on port 5001.'
      };
    } finally {
      setLoading(false);
    }
  };

  // Register with real backend API
  const register = async (name, email, password, role = 'STAFF') => {
    setLoading(true);
    try {
      const res = await authAPI.register(name, email, password, role);
      if (res.success && res.token) {
        setToken(res.token);
        setUser(res.data.user);
        localStorage.setItem('smartqueue_token', res.token);
        localStorage.setItem('smartqueue_auth_user', JSON.stringify(res.data.user));
        return { success: true, user: res.data.user };
      }
      return { success: false, message: res.message || 'Registration failed.' };
    } catch (err) {
      return { success: false, message: err.message || 'Registration failed.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('smartqueue_token');
    localStorage.removeItem('smartqueue_auth_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        loading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { useAuth } from '../hooks/useAuth';
