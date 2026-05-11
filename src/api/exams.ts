import API from './axios';

export const getAvailableExams = () => API.get('/exams/available');
export const getExamQuestions = (examId: string) => API.get(`/exams/${examId}/questions`);
export const submitExam = (examId: string, data: object) => API.post(`/exams/${examId}/submit`, data);