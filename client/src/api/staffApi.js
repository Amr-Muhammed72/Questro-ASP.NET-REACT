import { apiClient } from '../lib/apiClient';

export const fetchStaffDetails = async (id) => {
  try {
    const response = await apiClient.get(`/staff/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch staff details');
  }
};
