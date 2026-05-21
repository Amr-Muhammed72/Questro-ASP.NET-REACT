import axios from 'axios';
const PORT = import.meta.env.VITE_PORT || 5222;
export const BASE_URL = `http://localhost:${PORT}/api`;
let token = null;

export const getToken = () => {
  if (!token) {
    token = localStorage.getItem('accessToken');
  }
  return token;
}

export const setToken = (newToken) => {
  token = newToken;
  if (newToken) {
    localStorage.setItem('accessToken', newToken);
  } else {
    localStorage.removeItem('accessToken');
  }
}

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let refreshPromise = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = (async () => {
          try {
            const response = await axios.post(`${BASE_URL}/Auth/refresh-token`, {}, {
              withCredentials: true,
            });
            const newToken = response.data.accessToken;
            setToken(newToken);
            return newToken;
          } catch (refreshError) {
            token = null;
            localStorage.removeItem('accessToken');
            window.location.href = '/login';
            throw refreshError;
          } finally {
            refreshPromise = null;
          }
        })();
      }

      try {
        await refreshPromise;
        return apiClient(originalRequest);
      } catch {
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
export default {apiClient, getToken, setToken};