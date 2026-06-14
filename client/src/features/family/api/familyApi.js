import { apiClient } from '../../../lib/apiClient';

export const familyApi = {
  getRestrictions: async () => {
    const response = await apiClient.get('/users/me/restrictions');
    return response.data;
  },

  getChildren: async () => {
    const response = await apiClient.get('/family/children');
    return response.data;
  },

  createChild: async (childData) => {
    try {
      const response = await apiClient.post('/family/children', childData);
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        throw error.response.data; // Throw the backend error envelope to be caught by the form
      }
      throw error;
    }
  },

  updateChildRestrictions: async (childId, restrictionsData) => {
    try {
      const response = await apiClient.put(`/family/children/${childId}/restrictions`, restrictionsData);
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw error;
    }
  }
};
