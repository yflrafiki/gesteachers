import API from './axios';

export const uploadDocument = (formData: FormData) =>
  API.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getMyDocuments = () => API.get('/documents/my');
export const getDocumentById = (id: string) => API.get(`/documents/${id}`);