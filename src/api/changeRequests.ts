import API from './axios';

export const getMyChangeRequests = () => API.get('/change-requests/my');

export const createChangeRequest = (data: { field_name: string; requested_value: string; reason?: string }) =>
  API.post('/change-requests', data);
