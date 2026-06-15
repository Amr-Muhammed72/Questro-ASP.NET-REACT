import React, { useEffect } from 'react';
import { useAuth } from '../../auth/store/AuthContext';
import { familyApi } from '../api/familyApi';
import { useFamilyStore } from '../store/useFamilyStore';

export const RestrictionProvider = ({ children }) => {
  return <>{children}</>;
};
