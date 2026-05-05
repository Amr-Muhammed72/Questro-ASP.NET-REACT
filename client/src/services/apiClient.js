import axios from 'axios';
const BASE_URL = 'http://localhost:5222/api';
export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// We can later add interceptors here (e.g., attaching the access token, handling 401s for refresh)
