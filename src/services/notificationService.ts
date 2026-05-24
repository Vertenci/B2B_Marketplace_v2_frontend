import { apiClient } from '../api/client';
import type { NotificationListResponse } from '../types';

export const notificationService = {
  getNotifications: async (): Promise<NotificationListResponse> => {
    const { data } = await apiClient.get('/notifications');
    return data;
  },
};
