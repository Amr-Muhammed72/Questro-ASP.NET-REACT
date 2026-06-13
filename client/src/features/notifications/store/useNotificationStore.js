import { create } from 'zustand';
import { notificationService } from '../api/notificationService';

export const useNotificationStore = create((set, get) => ({
  unreadCount: 0,
  notifications: [],
  pagination: null,
  isFetching: false,
  error: null,
  pollingIntervalId: null,

  fetchUnreadCount: async () => {
    try {
      const count = await notificationService.getUnreadCount();
      set({ unreadCount: count });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  fetchNotifications: async (pageIndex = 1, pageSize = 10) => {
    try {
      set({ isFetching: true, error: null });
      const response = await notificationService.getNotifications(pageIndex, pageSize);
      
      set({
        notifications: response.data || [], 
        
        pagination: {
          pageIndex: response.pageNumber, 
          totalPages: response.totalPages,
          totalCount: response.totalCount,
        },
      });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      set({ error: error.message });
    } finally {
      set({ isFetching: false });
    }
  },
  markAsRead: async (notificationId) => {
    try {
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
      
      await notificationService.markAsRead(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      get().fetchUnreadCount();
    }
  },

  markAllAsRead: async () => {
    try {
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));

      await notificationService.markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      get().fetchUnreadCount();
    }
  },

  startPolling: () => {
    const { pollingIntervalId, fetchUnreadCount } = get();
    if (pollingIntervalId) return;
    fetchUnreadCount();
    const intervalId = setInterval(fetchUnreadCount, 60000);
    set({ pollingIntervalId: intervalId });
  },

  stopPolling: () => {
    const { pollingIntervalId } = get();
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      set({ pollingIntervalId: null });
    }
  },
}));
