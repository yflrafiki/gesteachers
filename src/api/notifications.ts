import API from './axios';

export const getNotifications = () => API.get('/notifications');

export const getUnreadCount = () => API.get('/notifications/unread-count');

export const markNotificationRead = (id: string) => API.put(`/notifications/${id}/read`);

export const markAllNotificationsRead = () => API.put('/notifications/read-all');
