import API from './api';

export interface NotificationRecord {
  _id: string;
  type: string;
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: NotificationRecord[];
  page: number;
  pages: number;
  total: number;
  unreadCount: number;
}

export const getNotifications = async (page = 1, limit = 20): Promise<NotificationsResponse> => {
  const response = await API.get('/notifications', { params: { page, limit } });
  return response.data;
};

export const getUnreadCount = async (): Promise<number> => {
  const response = await API.get('/notifications/unread-count');
  return response.data.unreadCount;
};

export const markNotificationAsRead = async (id: string) => {
  const response = await API.put(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await API.put('/notifications/read-all');
  return response.data;
};
