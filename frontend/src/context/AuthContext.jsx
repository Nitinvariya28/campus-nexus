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
    return Boolean(localStorage.getItem('access_token') || localStorage.getItem('dev_auth') === 'true');
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
    localStorage.removeItem('dev_auth');
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
    localStorage.removeItem('dev_auth');
    setUser(null);
    setAccessToken(null);
    setIsAuthenticated(false);
  };

  // Development helper to quickly toggle between Guest and Logged-In view
  const toggleDevAuth = () => {
    if (isAuthenticated) {
      logout();
    } else {
      const dummyUser = {
        id: 1,
        first_name: 'Nitin',
        last_name: 'Variya',
        email: '24bce006@nirmauni.ac.in',
        role: 'STUDENT',
        avatar: null,
      };
      localStorage.setItem('dev_auth', 'true');
      localStorage.setItem('user', JSON.stringify(dummyUser));
      setUser(dummyUser);
      setIsAuthenticated(true);
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