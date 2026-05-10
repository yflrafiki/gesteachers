import API from './axios';

export const getMyProfile = () => API.get('/teachers/profile');
export const updateMyProfile = (data: object) => API.put('/teachers/profile', data);