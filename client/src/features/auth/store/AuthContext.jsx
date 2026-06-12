import React, { createContext, useState, useEffect, useContext } from 'react';
import { useProfileStore } from '../../profile/store/useProfileStore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem('accessToken');
  });
  const { clearProfile } = useProfileStore();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  const login = (token) => {
    localStorage.setItem('accessToken', token);
    setIsLoggedIn(true);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    clearProfile();
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
