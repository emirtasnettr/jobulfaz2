/**
 * Supabase Database Types
 * 
 * Supabase client'ları için tip güvenliği sağlar
 * 
 * ÖNEMLİ: Bu type tanımları manuel olarak oluşturulmuştur.
 * Supabase'in otomatik generate ettiği type'ları kullanmak için:
 * 1. Supabase CLI ile type'ları generate edin: `npx supabase gen types typescript --project-id <project-id> > lib/supabase/database.types.ts`
 * 2. Bu dosyayı silin ve generate edilen type'ları kullanın
 * 
 * ŞU ANKİ DURUM: Manuel type tanımları kullanılıyor. Bu, type safety sağlar
 * ancak Supabase'in otomatik type inference'ı ile tam uyumlu olmayabilir.
 */

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
 * 
 * Supabase'in Database type formatı:
 * - Her tablo için Row, Insert, Update type'ları tanımlanmalı
 * - Insert type'ları, otomatik oluşturulan alanları (id, created_at, updated_at) içermemeli
 * - Update type'ları, Partial olmalı ve id, created_at, updated_at içermemeli
 * 
 * NOT: Eğer Supabase type'ları `never` döndürüyorsa, bu type tanımlarının
 * Supabase'in beklediği formatta olmadığını gösterir. Bu durumda:
 * 1. Supabase CLI ile type'ları regenerate edin
 * 2. Veya bu type tanımlarını Supabase'in beklediği formata uygun hale getirin
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
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
