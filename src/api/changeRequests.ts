import API from './axios';

export const getMyChangeRequests = () => API.get('/change-requests/my');

// Requires a supporting affidavit document, so this is always multipart.
export const createChangeRequest = (formData: FormData) =>
  API.post('/change-requests', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

// The endpoint requires the Bearer token, which only axios attaches — a plain
// <a href> can't carry it, so fetch as a blob and let the caller open/download it.
export const getChangeRequestDocument = (id: string) =>
  API.get(`/change-requests/${id}/document`, { responseType: 'blob' });
