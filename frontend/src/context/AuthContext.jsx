import React, { createContext, useContext, useState, useEffect } from 'react';

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
    if (tokens?.access) {
      localStorage.setItem('access_token', tokens.access);
      setAccessToken(tokens.access);
    }
    if (tokens?.refresh) {
      localStorage.setItem('refresh_token', tokens.refresh);
    }
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    }
    localStorage.removeItem('dev_auth');
    setIsAuthenticated(true);
  };

  // Logout handler
  const logout = () => {
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
