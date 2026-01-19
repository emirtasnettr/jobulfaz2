/**
 * Supabase Database Types
 * 
 * Supabase client'ları için tip güvenliği sağlar
 */

import type { Database as SupabaseDatabase } from '@supabase/supabase-js';
import type { 
  Profile, 
  Document, 
  HeroSlider, 
  SiteSettings, 
  CandidateInfo,
  JobPosting,
  JobAssignment,
  CustomerInfo
} from '@/types/database';

/**
 * Database schema type definition
 * Supabase'in generate ettiği type'ları buraya ekleyebiliriz
 * Şimdilik manuel type mapping kullanıyoruz
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
      documents: {
        Row: Document;
        Insert: Omit<Document, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Document, 'id' | 'created_at' | 'updated_at'>>;
      };
      hero_sliders: {
        Row: HeroSlider;
        Insert: Omit<HeroSlider, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<HeroSlider, 'id' | 'created_at' | 'updated_at'>>;
      };
      site_settings: {
        Row: SiteSettings;
        Insert: Omit<SiteSettings, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SiteSettings, 'id' | 'created_at' | 'updated_at'>>;
      };
      candidate_info: {
        Row: CandidateInfo;
        Insert: Omit<CandidateInfo, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CandidateInfo, 'id' | 'created_at' | 'updated_at'>>;
      };
      job_postings: {
        Row: JobPosting;
        Insert: Omit<JobPosting, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<JobPosting, 'id' | 'created_at' | 'updated_at'>>;
      };
      job_assignments: {
        Row: JobAssignment;
        Insert: Omit<JobAssignment, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<JobAssignment, 'id' | 'created_at' | 'updated_at'>>;
      };
      customer_info: {
        Row: CustomerInfo;
        Insert: Omit<CustomerInfo, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CustomerInfo, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}

export type SupabaseClient = SupabaseDatabase<Database>['public'];
