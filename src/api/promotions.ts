import API from './axios';

export const checkEligibility = () => API.get('/promotions/eligibility');
export const applyPromotion = (data: object) => API.post('/promotions', data);
export const getMyPromotions = () => API.get('/promotions/my');