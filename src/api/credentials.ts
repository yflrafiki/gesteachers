import API from './axios';

// Verification is fully automatic on upload (blockchain hash anchor + OCR
// profile check) — there is no manual "submit for verification" action.
export const getMyCredentials = () => API.get('/credentials/my');