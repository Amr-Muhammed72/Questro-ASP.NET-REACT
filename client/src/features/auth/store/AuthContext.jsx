import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useProfileStore } from '../../profile/store/useProfileStore';
import { useFamilyStore } from '../../family/store/useFamilyStore';
import { setToken } from '../../../lib/apiClient';

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

    try {
      const decoded = jwtDecode(token);
      console.log(token);
      console.log('Decoded JWT:', decoded);
      
      const isChildClaim = decoded.IsChildAccount || decoded.isChildAccount || decoded.ischildaccount || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/ischildaccount'];
      const isChild = String(isChildClaim).toLowerCase() === "true" || isChildClaim === true;
      
      if (isChild) { 
        useFamilyStore.getState().setRestrictions({ isChild: true }); 
      } else {
        useFamilyStore.getState().clearRestrictions();
      }
    } catch (e) {
      console.error('Failed to decode JWT or parse restrictions', e);
    }
  };

  const logout = async () => {
    localStorage.clear();
    sessionStorage.clear();
    setToken(null);
    clearProfile();
    setIsLoggedIn(false);
    
    // Clear family restrictions on logout
    try {
      // Calling clearRestrictions correctly zeroes out the state in memory, triggers 
      // a React re-render, and Zustand's persist middleware automatically wipes the data from localStorage.
      useFamilyStore.getState().clearRestrictions();
    } catch (e) {
      console.error('Failed to clear family state:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
