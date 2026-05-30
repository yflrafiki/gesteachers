import API from './axios';

export const checkEligibility = () => API.get('/promotions/eligibility');
export const getPromotionFormData = () => API.get('/promotions/form');
export const applyPromotion = (data: object) => API.post('/promotions', data);
export const getMyPromotions = () => API.get('/promotions/my');
export const submitPromotionDocument = (applicationId: string, documentId: string) =>
  API.post(`/promotions/${applicationId}/submit-document`, { document_id: documentId });