
export interface Assignment {
  id: string;
  title: string;
  description?: string;
  subject: string;
  due_date?: string;
  status: string;
  user_id: string;
  writer_id?: string;
  created_at: string;
  updated_at?: string;
  completed_date?: string;
  grade?: string;
  student_name?: string;
  student_email?: string;
  student_phone?: string;
  is_verified_account?: boolean;
  file_urls?: string[];
  price?: number;
  paid?: boolean;
  payment_date?: string;
}
