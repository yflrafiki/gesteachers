import API from './axios';

export const createTransfer = (data: object) => API.post('/transfers', data);
export const getMyTransfers = () => API.get('/transfers/my');
export const getTransferById = (id: string) => API.get(`/transfers/${id}`);