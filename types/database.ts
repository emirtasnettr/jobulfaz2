/**
 * Veritabanı Type Definitions
 */

export type UserRole = 'CANDIDATE' | 'MIDDLEMAN' | 'CONSULTANT' | 'ADMIN' | 'CUSTOMER';

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  middleman_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CandidateInfo {
  id: string;
  profile_id: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  district: string | null;
  address: string | null;
  date_of_birth: string | null;
  national_id: string | null;
  education_level: string | null;
  experience_years: number;
  skills: string[];
  languages: Array<{ name: string; level: string }>;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  profile_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerInfo {
  id: string;
  profile_id: string;
  authorized_name: string | null; // Yetkili Adı Soyadı
  authorized_phone: string | null; // Yetkili Telefon Numarası
  company_name: string | null; // Firma Ünvanı
  tax_number: string | null; // Vergi Numarası
  tax_office: string | null; // Vergi Dairesi
  company_address: string | null; // Şirket Adresi
  company_phone: string | null; // Şirket Telefon Numarası
  created_at: string;
  updated_at: string;
}

export type JobStatus = 'ACTIVE' | 'APPROVED' | 'CURRENT' | 'PAST';

export interface JobPosting {
  id: string;
  customer_id: string;
  title: string;
  description: string | null;
  required_count: number; // Kaç kişiye ihtiyaç var
  contract_start_date: string | null; // Sözleşme Başlangıç Tarihi
  contract_end_date: string | null; // Sözleşme Bitiş Tarihi
  start_date: string | null; // Personelin ne zaman işe başlaması gerektiği
  status: JobStatus;
  created_at: string;
  updated_at: string;
}

export type JobAssignmentStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface JobAssignment {
  id: string;
  job_posting_id: string;
  candidate_id: string;
  status: JobAssignmentStatus;
  rejection_reason: string | null;
  assigned_by: string;
  assigned_at: string;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  id: string;
  logo_url: string | null;
  site_name: string | null;
  created_at: string;
  updated_at: string;
}
