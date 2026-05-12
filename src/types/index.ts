export interface User {
  id: string;
  email: string;
  role: string;
}

export interface Teacher {
  id: string;
  user_id: string;
  staff_id: string;
  title: string | null;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  phone: string;
  gender: string;
  marital_status: string | null;
  nationality: string | null;
  hometown: string | null;
  subject_specialization: string;
  current_grade: string;
  national_date_of_present_rank: string | null;
  years_in_current_rank: number;
  current_school: string;
  current_district: string;
  current_region: string;
  years_of_service: number;
  qualification: string;
  date_of_first_appointment: string | null;
  date_of_confirmation: string | null;
  date_of_current_posting: string | null;
  employment_status: string | null;
  passport_photo: string | null;
  disability_status: boolean;
  disability_type: string | null;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  teacher_id: string;
  type: string;
  status: string;
  reason: string;
  requested_district?: string;
  requested_region?: string;
  hr_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  teacher_id: string;
  application_id: string | null;
  file_name: string;
  file_type: string;
  ocr_status: string;
  ocr_extracted_text: string | null;
  uploaded_at: string;
}

export interface Credential {
  id: string;
  teacher_id: string;
  document_id: string;
  document_hash: string;
  blockchain_tx_id: string;
  verification_status: string;
  verified_at: string | null;
  created_at: string;
  file_name: string;
  file_type: string;
  ocr_status: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  total_marks: number;
  pass_mark: number;
  status: string;
  question_count: number;
  my_attempt_status: string | null;
  my_score: number | null;
  my_passed: boolean | null;
}

export interface ExamQuestion {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  marks: number;
}