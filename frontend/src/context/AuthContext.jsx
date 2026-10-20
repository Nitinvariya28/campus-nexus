import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [accessToken, setAccessToken] = useState(() => {
    return localStorage.getItem('access_token') || null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(localStorage.getItem('access_token'));
  });

  // Login handler
  const login = (tokens, userData) => {
    const access = tokens?.access_token || tokens?.access;
    const refresh = tokens?.refresh_token || tokens?.refresh;

    if (access) {
      localStorage.setItem('access_token', access);
      setAccessToken(access);
    }
    if (refresh) {
      localStorage.setItem('refresh_token', refresh);
    }
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    }
    setIsAuthenticated(true);
  };

  // User update handler (e.g. after profile edits, avatar changes)
  const updateUser = (userData) => {
    setUser((prevUser) => {
      const updated = typeof userData === 'function' ? userData(prevUser) : { ...prevUser, ...userData };
      try {
        localStorage.setItem('user', JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save user in localStorage', err);
      }
      return updated;
    });
  };

  // Logout handler
  const logout = async () => {
    const refresh = localStorage.getItem('refresh_token');
    if (refresh) {
      await authService.logout(refresh);
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    setAccessToken(null);
    setIsAuthenticated(false);
  };

  // Development toggle (removed dummy user to enforce genuine API authentication)
  const toggleDevAuth = () => {
    if (isAuthenticated) {
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated,
        login,
        updateUser,
        logout,
        toggleDevAuth,
      }}
    >
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

export default AuthContext;