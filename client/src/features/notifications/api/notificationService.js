import { apiClient } from '../../../lib/apiClient';

export const notificationService = {
  getUnreadCount: async () => {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data;
  },

  getNotifications: async (pageIndex = 1, pageSize = 10) => {
    const response = await apiClient.get(`/notifications`, {
      params: { pageIndex, pageSize },
    });
    // console.log('Fetched notifications:', response.data); // Debug log
    return response.data;
  },

  markAsRead: async (notificationId) => {
    const response = await apiClient.post(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await apiClient.post('/notifications/read-all');
    return response.data;
  },
};
