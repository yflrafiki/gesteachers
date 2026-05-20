import API from './axios';

export const loginUser = (data: { email: string; password: string }) =>
  API.post('/auth/login', data);

export const getMe = () => API.get('/auth/me');

export const changePassword = (data: { current_password: string; new_password: string }) =>
  API.post('/auth/change-password', data);