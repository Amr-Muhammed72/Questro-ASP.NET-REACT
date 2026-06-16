const BASE_URL = 'http://localhost:5222/api/staff';

export const fetchStaffDetails = async (id) => {
  const response = await fetch(`${BASE_URL}/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch staff details');
  }
  return await response.json();
};
