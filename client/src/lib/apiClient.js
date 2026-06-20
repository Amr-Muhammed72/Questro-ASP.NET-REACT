import axios from 'axios';

export const SERVER_URL = import.meta.env.VITE_API_URL || 'https://questroapi.runasp.net';
export const BASE_URL = `${SERVER_URL}/api`;
let token = null;

export const getToken = () => {
  if (!token) {
    token = localStorage.getItem('accessToken');
  }
  return token;
};

export const setToken = (newToken) => {
  token = newToken;
  if (newToken) {
    localStorage.setItem('accessToken', newToken);
  } else {
    localStorage.removeItem('accessToken');
  }
};

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to automatically attach the token
apiClient.interceptors.request.use(
  (config) => {
    const currentToken = getToken();
    if (currentToken) {
      config.headers.Authorization = `Bearer ${currentToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let refreshPromise = null;

// Intercept responses to handle token refreshing on 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/Auth/logIn')) {
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
            setToken(null);
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
      } catch (retryError) {
        return Promise.reject(retryError.response?.data || retryError);
      }
    }

    return Promise.reject(error.response?.data || error);
  }
);
export default {
  apiClient,
  getToken,
  setToken
};