import API from './axios';

export const loginUser = (data: { email: string; password: string }) =>
  API.post('/auth/login', data);

export const getMe = () => API.get('/auth/me');

export const changePassword = (data: { current_password: string; new_password: string }) =>
  API.put('/auth/change-password', data);

export const verifyEmailCode = (data: { email: string; code: string }) =>
  API.post('/auth/verify-email-code', data);

export const resendVerificationCode = (data: { email: string }) =>
  API.post('/auth/resend-verification-code', data);

export const forgotPassword = (data: { email: string }) =>
  API.post('/auth/forgot-password', data);

export const resetPassword = (data: { email: string; code: string; new_password: string }) =>
  API.post('/auth/reset-password', data);