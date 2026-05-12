import API from './axios';

export const getMyProfile = () => API.get('/teachers/profile');

export const updateMyProfile = (formData: FormData) =>
  API.put('/teachers/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });