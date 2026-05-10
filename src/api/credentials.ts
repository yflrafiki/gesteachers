import API from './axios';

export const submitForVerification = (documentId: string) =>
  API.post(`/credentials/verify/${documentId}`);

export const getMyCredentials = () => API.get('/credentials/my');