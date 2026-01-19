/**
 * İş İlanı Talebi Detay ve Onay Sayfası
 * 
 * Consultant'ların iş ilanı talebini inceleyip onaylayabileceği ve aday atayabileceği sayfa
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

type JobType = 'FULL_TIME' | 'PART_TIME' | 'SEASONAL' | null;

interface JobPosting {
  id: string;
  customer_id: string;
  title: string;
  task: string | null;
  description: string | null;
  required_count: number;
  job_type: JobType;
  city: string | null;
  district: string | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  part_time_start_date: string | null;
  part_time_end_date: string | null;
  seasonal_period_months: number | null;
  monthly_budget_per_person: number | null;
  daily_budget_per_person: number | null;
  hourly_budget_per_person: number | null;
  working_hours: Record<string, { start: string; end: string }> | null;
  start_date: string | null;
  status: 'ACTIVE' | 'CURRENT' | 'PAST' | 'REJECTED';
  created_at: string;
}

interface Customer {
  full_name: string;
  company_name: string | null;
  authorized_name: string | null;
  authorized_phone: string | null;
  company_address: string | null;
  company_phone: string | null;
}

interface Candidate {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  district: string | null;
  application_status: string | null;
}

export default function JobRequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const jobId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [jobPosting, setJobPosting] = useState<JobPosting | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [siteLogo, setSiteLogo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState<'NEW_OFFER' | 'PERSONNEL_SHORTAGE' | ''>('');
  const [newOfferAmount, setNewOfferAmount] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [customerMenuOpen, setCustomerMenuOpen] = useState(false);
  const customerMenuRef = useRef<HTMLDivElement>(null);
  const [candidateMenuOpen, setCandidateMenuOpen] = useState(false);
  const candidateMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/auth/login');
          return;
        }

        // Profil ve rol kontrolü
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!profileData || !['CONSULTANT', 'ADMIN'].includes(profileData.role)) {
          router.push('/');
          return;
        }

        setProfile(profileData);

        // İş ilanını al
        const { data: job, error: jobError } = await supabase
          .from('job_postings')
          .select('*')
          .eq('id', jobId)
          .single();

        if (jobError || !job) {
          setError('İş ilanı bulunamadı');
          setLoading(false);
          return;
        }

        if (job.status !== 'ACTIVE') {
          setError('Bu iş ilanı zaten onaylanmış veya sonlandırılmış');
          setLoading(false);
          return;
        }

        setJobPosting(job);

        // Müşteri bilgilerini al
        const { data: customerProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', job.customer_id)
          .single();

        const { data: customerInfo } = await supabase
          .from('customer_info')
          .select('company_name, authorized_name, authorized_phone, company_address, company_phone')
          .eq('profile_id', job.customer_id)
          .single();

        setCustomer({
          full_name: customerProfile?.full_name || '-',
          company_name: customerInfo?.company_name || null,
          authorized_name: customerInfo?.authorized_name || null,
          authorized_phone: customerInfo?.authorized_phone || null,
          company_address: customerInfo?.company_address || null,
          company_phone: customerInfo?.company_phone || null,
        });

        // İş ilanının city ve district'ine göre onaylanmış adayları al
        if (job.city && job.district) {
          // Önce city ve district'e göre candidate_info'dan adayları bul
          const { data: candidateInfoData } = await supabase
            .from('candidate_info')
            .select('profile_id')
            .eq('city', job.city)
            .eq('district', job.district);

          if (candidateInfoData && candidateInfoData.length > 0) {
            const candidateIds = candidateInfoData.map((ci) => ci.profile_id);

            // Bu adayların profillerini al (APPROVED olanlar)
            const { data: candidatesData } = await supabase
              .from('profiles')
              .select('id, full_name, application_status')
              .eq('role', 'CANDIDATE')
              .eq('application_status', 'APPROVED')
              .in('id', candidateIds)
              .order('full_name');

            if (candidatesData) {
              // Aday bilgilerini de al
              const candidatesWithInfo = await Promise.all(
                candidatesData.map(async (candidate) => {
                  const { data: candidateInfo } = await supabase
                    .from('candidate_info')
                    .select('phone, email, city, district')
                    .eq('profile_id', candidate.id)
                    .single();

                  return {
                    ...candidate,
                    phone: candidateInfo?.phone || null,
                    email: candidateInfo?.email || null,
                    city: candidateInfo?.city || null,
                    district: candidateInfo?.district || null,
                  };
                })
              );

              setCandidates(candidatesWithInfo);
            }
          } else {
            setCandidates([]);
          }
        } else {
          setCandidates([]);
        }

        // Site logo'yu yükle
        try {
          const { data: settings } = await supabase
            .from('site_settings')
            .select('logo_url')
            .single();
          
          if (settings?.logo_url) {
            setSiteLogo(settings.logo_url);
          }
        } catch (err) {
          console.log('Logo yüklenemedi:', err);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Veriler yüklenirken hata oluştu';
        setError(errorMessage);
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router, supabase, jobId]);

  // Dropdown dışına tıklama kontrolü
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (customerMenuRef.current && !customerMenuRef.current.contains(event.target as Node)) {
        setCustomerMenuOpen(false);
      }
      if (candidateMenuRef.current && !candidateMenuRef.current.contains(event.target as Node)) {
        setCandidateMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push('/');
      router.refresh();
    }
  };

  const handleApprove = async () => {
    if (selectedCandidateIds.length === 0) {
      setError('Lütfen en az bir aday seçin');
      return;
    }

    // Consultant birden fazla aday seçebilir, ama seçim yapması zorunlu
    // Kabul eden ilk N kişi (required_count) işi alacak

    // Adayın kazancını hesapla (müşterinin belirlediği kişi başı ücretten)
    const candidateEarning = calculateCandidateEarning(jobPosting);
    if (!candidateEarning) {
      let errorMsg = 'İş ilanı tutar bilgileri eksik. Aday kazancı hesaplanamıyor.';
      if (jobPosting?.job_type === 'PART_TIME') {
        if (!jobPosting.hourly_budget_per_person) {
          errorMsg = 'Saatlik ücret bilgisi eksik. Lütfen müşteriyi bilgilendirin.';
        } else if (!jobPosting.working_hours || Object.keys(jobPosting.working_hours).length === 0) {
          errorMsg = 'Çalışma saatleri bilgisi eksik. Lütfen müşteriyi bilgilendirin.';
        } else if (!jobPosting.part_time_start_date || !jobPosting.part_time_end_date) {
          errorMsg = 'Başlangıç/bitiş tarihi bilgisi eksik. Lütfen müşteriyi bilgilendirin.';
        }
      } else if (jobPosting?.job_type === 'FULL_TIME' && !jobPosting.monthly_budget_per_person) {
        errorMsg = 'Aylık ücret bilgisi eksik. Lütfen müşteriyi bilgilendirin.';
      } else if (jobPosting?.job_type === 'SEASONAL' && (!jobPosting.monthly_budget_per_person || !jobPosting.seasonal_period_months)) {
        errorMsg = 'Aylık ücret veya dönemsel süre bilgisi eksik. Lütfen müşteriyi bilgilendirin.';
      }
      setError(errorMsg);
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // İş ilanını CURRENT (Aktif Fırsat) durumuna geçir
      const { error: updateError } = await supabase
        .from('job_postings')
        .update({
          status: 'CURRENT',
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      if (updateError) {
        throw new Error(updateError.message || 'İş ilanı onaylanırken hata oluştu');
      }

      // Aday atamalarını kaydet (tutar otomatik hesaplanır)
      // Tüm seçili adaylara iş atanır, kabul eden ilk N kişi işi alır
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && selectedCandidateIds.length > 0) {
        const assignments = selectedCandidateIds.map((candidateId) => {
          // İş tipine göre adayın kazancını belirle
          if (jobPosting?.job_type === 'PART_TIME') {
            // Part-time için saatlik ücret
            return {
              job_posting_id: jobId,
              candidate_id: candidateId,
              status: 'PENDING',
              assigned_by: user.id,
              candidate_daily_salary: jobPosting.hourly_budget_per_person || null, // Saatlik ücreti daily_salary alanına kaydediyoruz (geriye dönük uyumluluk için)
            };
          } else if (jobPosting?.job_type === 'FULL_TIME' || jobPosting?.job_type === 'SEASONAL') {
            // Full-time ve Seasonal için aylık ücret
            return {
              job_posting_id: jobId,
              candidate_id: candidateId,
              status: 'PENDING',
              assigned_by: user.id,
              candidate_monthly_salary: jobPosting.monthly_budget_per_person || null,
            };
          } else {
            return {
              job_posting_id: jobId,
              candidate_id: candidateId,
              status: 'PENDING',
              assigned_by: user.id,
              candidate_monthly_salary: null,
              candidate_daily_salary: null,
            };
          }
        });

        const { error: assignmentError } = await supabase
          .from('job_assignments')
          .insert(assignments);

        if (assignmentError) {
          console.error('Error creating assignments:', assignmentError);
          // İş ilanını geri ACTIVE yap
          await supabase
            .from('job_postings')
            .update({ status: 'ACTIVE' })
            .eq('id', jobId);
          throw new Error('Aday atamaları kaydedilemedi: ' + assignmentError.message);
        }
      }

      setSuccess(true);

      // 2 saniye sonra liste sayfasına yönlendir
      setTimeout(() => {
        router.push('/dashboard/consultant/customers/job-requests');
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'İş ilanı onaylanırken hata oluştu';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason) {
      setError('Lütfen red nedeni seçin');
      return;
    }

    if (rejectReason === 'NEW_OFFER' && (!newOfferAmount || parseFloat(newOfferAmount) <= 0)) {
      setError('Lütfen kişi başı yeni teklif tutarını girin (KDV hariç)');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Giriş yapmamışsınız');
      }

      // İş ilanını REJECTED durumuna geçir ve red nedeni ekle
      // Update type: Partial<Omit<JobPosting, 'id' | 'created_at' | 'updated_at'>>
      // NOT: updated_at otomatik güncellenir, manuel eklemeye gerek yok
      // TypeScript'in Partial<Omit<...>> inference'ı bazen çalışmıyor, bu yüzden type assertion kullanıyoruz
      // NOT: Tüm JobPosting alanları dahil (new_offer_* dahil)
      const updateData: any = {
        status: 'REJECTED',
        rejection_reason: rejectReason as 'NEW_OFFER' | 'PERSONNEL_SHORTAGE',
        rejected_by: user.id,
        rejected_at: new Date().toISOString(),
      };

      // Eğer yeni teklif varsa, yeni teklif tutarlarını kaydet
      if (rejectReason === 'NEW_OFFER' && jobPosting) {
        // newOfferAmount artık kişi başı tutar
        const offerPerPersonWithoutVAT = parseFloat(newOfferAmount);
        const totalOfferWithoutVAT = offerPerPersonWithoutVAT * (jobPosting.required_count || 1);
        const vatAmount = totalOfferWithoutVAT * 0.20;
        const totalOfferWithVAT = totalOfferWithoutVAT + vatAmount;

        // İş tipine göre yeni teklif tutarlarını kaydet
        if (jobPosting.job_type === 'FULL_TIME' || jobPosting.job_type === 'SEASONAL') {
          updateData.new_offer_monthly_budget_per_person = offerPerPersonWithoutVAT;
        } else if (jobPosting.job_type === 'PART_TIME') {
          // Part-time için günlük hesaplama (toplam gün sayısına göre)
          if (jobPosting.part_time_start_date && jobPosting.part_time_end_date) {
            const startDate = new Date(jobPosting.part_time_start_date);
            const endDate = new Date(jobPosting.part_time_end_date);
            const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            // Kişi başı aylık tutardan günlük tutarı hesapla (toplam güne böl)
            updateData.new_offer_daily_budget_per_person = totalOfferWithoutVAT / ((jobPosting.required_count || 1) * daysDiff);
          }
        }
        updateData.new_offer_total_without_vat = totalOfferWithoutVAT;
        updateData.new_offer_total_with_vat = totalOfferWithVAT;
      }

      const { error: updateError } = await supabase
        .from('job_postings')
        .update(updateData)
        .eq('id', jobId);

      if (updateError) {
        console.error('Update error:', updateError);
        throw new Error(updateError.message || 'İş ilanı reddedilirken hata oluştu');
      }

      setSuccess(true);
      setShowRejectModal(false);
      setError(null);

      // 2 saniye sonra liste sayfasına yönlendir
      setTimeout(() => {
        router.push('/dashboard/consultant/customers/job-requests');
        router.refresh();
      }, 2000);
    } catch (err) {
      console.error('Reject error:', err);
      const errorMessage = err instanceof Error ? err.message : 'İş ilanı reddedilirken hata oluştu';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getJobTypeLabel = (jobType: JobType) => {
    switch (jobType) {
      case 'FULL_TIME':
        return 'Tam Zamanlı';
      case 'PART_TIME':
        return 'Part-time';
      case 'SEASONAL':
        return 'Dönemsel';
      default:
        return '-';
    }
  };

  // Müşterinin tutarlarını hesaplama (KDV Hariç)
  const calculatePartTimeTotalHours = (job: JobPosting | null): number => {
    if (!job || !job.working_hours || !job.part_time_start_date || !job.part_time_end_date) return 0;
    
    const startDate = new Date(job.part_time_start_date);
    const endDate = new Date(job.part_time_end_date);
    const days: string[] = [];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      days.push(dateStr);
    }
    
    let totalMinutes = 0;
    days.forEach(day => {
      const hours = job.working_hours?.[day];
      if (hours?.start && hours?.end) {
        const [startH, startM] = hours.start.split(':').map(Number);
        const [endH, endM] = hours.end.split(':').map(Number);
        const startTotalMinutes = startH * 60 + startM;
        const endTotalMinutes = endH * 60 + endM;
        totalMinutes += endTotalMinutes - startTotalMinutes;
      }
    });
    
    return totalMinutes / 60; // Toplam saat
  };

  const calculateCustomerBudgetWithoutVAT = (job: JobPosting | null) => {
    if (!job) return null;

    if (job.job_type === 'FULL_TIME') {
      if (!job.monthly_budget_per_person || !job.required_count) return null;
      return job.monthly_budget_per_person * job.required_count;
    } else if (job.job_type === 'PART_TIME') {
      if (!job.hourly_budget_per_person || !job.required_count) return null;
      const totalHours = calculatePartTimeTotalHours(job);
      if (totalHours === 0) return null;
      return job.hourly_budget_per_person * job.required_count * totalHours;
    } else if (job.job_type === 'SEASONAL') {
      if (!job.monthly_budget_per_person || !job.required_count || !job.seasonal_period_months) return null;
      return job.monthly_budget_per_person * job.required_count * job.seasonal_period_months;
    }
    return null;
  };

  // Adayın kazancını hesapla (müşterinin belirlediği kişi başı ücretten)
  const calculateCandidateEarning = (job: JobPosting | null): number | null => {
    if (!job) return null;

    if (job.job_type === 'PART_TIME') {
      if (!job.hourly_budget_per_person || !job.part_time_start_date || !job.part_time_end_date || !job.working_hours) return null;
      const totalHours = calculatePartTimeTotalHours(job);
      if (totalHours === 0) return null;
      // Saatlik ücret * toplam çalışma saati = adayın toplam kazancı
      return job.hourly_budget_per_person * totalHours;
    } else if (job.job_type === 'FULL_TIME') {
      // Tam zamanlı için aylık ücret (muhtemelen 1 aylık)
      return job.monthly_budget_per_person || null;
    } else if (job.job_type === 'SEASONAL') {
      if (!job.monthly_budget_per_person || !job.seasonal_period_months) return null;
      // Aylık ücret * dönemsel süre = adayın toplam kazancı
      return job.monthly_budget_per_person * job.seasonal_period_months;
    }
    return null;
  };

  const toggleCandidateSelection = (candidateId: string) => {
    setSelectedCandidateIds((prev) => {
      if (prev.includes(candidateId)) {
        // Aday seçimi kaldır
        return prev.filter((id) => id !== candidateId);
      } else {
        // Aday seçildi - tutar otomatik hesaplanacak, modal yok
        // Consultant birden fazla aday seçebilir, kabul eden ilk N kişi işi alır
        return [...prev, candidateId];
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full"></div>
            </div>
          </div>
          <p className="text-gray-600 font-medium mt-4">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error && !jobPosting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href="/dashboard/consultant/customers/job-requests"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Geri Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F9FE' }}>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {siteLogo ? (
              <img
                src={siteLogo}
                alt="Site Logo"
                className="h-10 w-auto max-w-[200px] object-contain"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                <span className="text-lg font-semibold text-white">J</span>
              </div>
            )}

            {/* Aday Yönetimi Dropdown */}
            <div className="relative" ref={candidateMenuRef}>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setCandidateMenuOpen(!candidateMenuOpen);
                  }}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-1"
                >
                  Aday Yönetimi
                  <svg className={`w-4 h-4 transition-transform ${candidateMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {candidateMenuOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white/95 backdrop-blur-md rounded-lg border border-gray-200 shadow-lg overflow-hidden z-50">
                  <div className="py-1.5">
                    <Link
                      href="/dashboard/consultant"
                      onClick={() => setCandidateMenuOpen(false)}
                      className="w-full px-3 py-2.5 text-left flex items-center gap-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Aday Yönetimi Ana Sayfa</p>
                        <p className="text-xs text-gray-400">Dashboard</p>
                      </div>
                    </Link>
                    
                    <div className="h-px bg-gray-100 my-1"></div>

                    <Link
                      href="/applications"
                      onClick={() => setCandidateMenuOpen(false)}
                      className="w-full px-3 py-2.5 text-left flex items-center gap-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-md bg-purple-50 flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Tüm Başvurular</p>
                        <p className="text-xs text-gray-400">Başvuru listesi ve yönetimi</p>
                      </div>
                    </Link>

                    <Link
                      href="/documents/review"
                      onClick={() => setCandidateMenuOpen(false)}
                      className="w-full px-3 py-2.5 text-left flex items-center gap-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-md bg-green-50 flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Belge İnceleme</p>
                        <p className="text-xs text-gray-400">Belgeleri gözden geçir</p>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Müşteri Yönetimi Dropdown */}
            <div className="relative" ref={customerMenuRef}>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setCustomerMenuOpen(!customerMenuOpen);
                  }}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-1"
                >
                  Müşteri Yönetimi
                  <svg className={`w-4 h-4 transition-transform ${customerMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {customerMenuOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white/95 backdrop-blur-md rounded-lg border border-gray-200 shadow-lg overflow-hidden z-50">
                  <div className="py-1.5">
                    <Link
                      href="/dashboard/consultant/customers"
                      onClick={() => setCustomerMenuOpen(false)}
                      className="w-full px-3 py-2.5 text-left flex items-center gap-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-md bg-purple-50 flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Müşteri Yönetimi</p>
                        <p className="text-xs text-gray-400">Ana sayfa</p>
                      </div>
                    </Link>
                    
                    <div className="h-px bg-gray-100 my-1"></div>

                    <Link
                      href="/dashboard/consultant/customers/job-requests"
                      onClick={() => setCustomerMenuOpen(false)}
                      className="w-full px-3 py-2.5 text-left flex items-center gap-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Fırsat Talepleri</p>
                        <p className="text-xs text-gray-400">Onay bekleyen fırsatlar</p>
                      </div>
                    </Link>

                    <Link
                      href="/dashboard/consultant/customers/active-jobs"
                      onClick={() => setCustomerMenuOpen(false)}
                      className="w-full px-3 py-2.5 text-left flex items-center gap-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-md bg-yellow-50 flex items-center justify-center">
                        <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Aktif Fırsatlar</p>
                        <p className="text-xs text-gray-400">Onaylanmış fırsatlar</p>
                      </div>
                    </Link>

                    <Link
                      href="/dashboard/consultant/customers/past-contracts"
                      onClick={() => setCustomerMenuOpen(false)}
                      className="w-full px-3 py-2.5 text-left flex items-center gap-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-md bg-gray-50 flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Geçmiş Fırsatlar</p>
                        <p className="text-xs text-gray-400">Tamamlanmış fırsatlar</p>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {profile?.full_name?.charAt(0) || 'C'}
                </span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-700">{profile?.full_name || 'Consultant'}</p>
              </div>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-md rounded-lg border border-gray-200 shadow-lg overflow-hidden z-50">
                <div className="py-1.5">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      router.push('/dashboard/settings');
                    }}
                    className="w-full px-3 py-2.5 text-left flex items-center gap-2.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Hesap Ayarları</p>
                      <p className="text-xs text-gray-400">Şifre ve profil ayarları</p>
                    </div>
                  </button>
                  
                  <div className="h-px bg-gray-100 my-1"></div>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full px-3 py-2.5 text-left flex items-center gap-2.5 hover:bg-red-50 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-md bg-red-50 flex items-center justify-center">
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-600">Çıkış Yap</p>
                      <p className="text-xs text-gray-400">Hesabınızdan çıkış yapın</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 font-medium">✅ İş ilanı başarıyla onaylandı! Yönlendiriliyorsunuz...</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 font-medium">⚠️ {error}</p>
          </div>
        )}

        <div className="space-y-4 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* İş İlanı Bilgileri */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-white">İş İlanı Bilgileri</h2>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="pb-3 border-b border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        İlan Başlığı
                      </label>
                      <p className="text-xl font-bold text-gray-900 leading-tight">{jobPosting?.title}</p>
                    </div>
                    {jobPosting?.task && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Görev
                        </label>
                        <p className="text-sm text-gray-700 leading-relaxed">{jobPosting.task}</p>
                      </div>
                    )}
                  </div>
                </div>
                {jobPosting?.description && (
                  <div className="pb-3 border-b border-gray-100">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Açıklama
                    </label>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg p-3 border border-gray-100">{jobPosting.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-100">
                    <label className="block text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      İş Tipi
                    </label>
                    <p className="text-base font-bold text-gray-900">{getJobTypeLabel(jobPosting?.job_type || null)}</p>
                  </div>
                  {jobPosting?.city && jobPosting?.district && (
                    <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-3 border border-teal-100">
                      <label className="block text-xs font-semibold text-teal-600 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Konum
                      </label>
                      <p className="text-base font-bold text-gray-900">{jobPosting.city} / {jobPosting.district}</p>
                    </div>
                  )}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
                    <label className="block text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Kişi Sayısı
                    </label>
                    <p className="text-base font-bold text-gray-900">{jobPosting?.required_count} kişi</p>
                  </div>
                  {jobPosting?.created_at && (
                    <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg p-3 border border-gray-100">
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Oluşturulma Tarihi
                      </label>
                      <p className="text-base font-bold text-gray-900">{formatDate(jobPosting.created_at)}</p>
                    </div>
                  )}
                  {jobPosting?.job_type === 'PART_TIME' && jobPosting?.part_time_start_date && (
                    <>
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100">
                        <label className="block text-xs font-semibold text-green-600 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Başlangıç Tarihi
                        </label>
                        <p className="text-base font-bold text-gray-900">{formatDate(jobPosting.part_time_start_date)}</p>
                      </div>
                      {jobPosting?.part_time_end_date && (
                        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-3 border border-orange-100">
                          <label className="block text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Bitiş Tarihi
                          </label>
                          <p className="text-base font-bold text-gray-900">{formatDate(jobPosting.part_time_end_date)}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Çalışma Saatleri - Part-time için */}
                {jobPosting?.job_type === 'PART_TIME' && jobPosting?.working_hours && jobPosting?.part_time_start_date && jobPosting?.part_time_end_date && (() => {
                  const startDate = new Date(jobPosting.part_time_start_date);
                  const endDate = new Date(jobPosting.part_time_end_date);
                  const days: string[] = [];
                  
                  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                    const dateStr = d.toISOString().split('T')[0];
                    days.push(dateStr);
                  }

                  const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
                  
                  return (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Çalışma Saatleri
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 max-h-80 overflow-y-auto">
                        {days.map((day) => {
                          const date = new Date(day);
                          const dayName = dayNames[date.getDay()];
                          const dayFormatted = date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                          const hours = jobPosting.working_hours?.[day];
                          
                          if (!hours || !hours.start || !hours.end) return null;

                          const [startH, startM] = hours.start.split(':').map(Number);
                          const [endH, endM] = hours.end.split(':').map(Number);
                          const startTotalMinutes = startH * 60 + startM;
                          const endTotalMinutes = endH * 60 + endM;
                          const diffMinutes = endTotalMinutes - startTotalMinutes;
                          const diffHours = Math.floor(diffMinutes / 60);
                          const diffMins = diffMinutes % 60;

                          return (
                            <div key={day} className="bg-white rounded-lg p-3 border border-indigo-200 hover:border-indigo-300 hover:shadow-sm transition-all">
                              <div className="mb-1">
                                <p className="text-xs font-semibold text-gray-900">{dayFormatted} - {dayName}</p>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-600">Baş.:</span>
                                  <span className="text-xs font-semibold text-gray-900">{hours.start}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-600">Bitş.:</span>
                                  <span className="text-xs font-semibold text-gray-900">{hours.end}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-600">Süre:</span>
                                  <span className="text-xs font-bold text-gray-900">
                                    {diffHours}s {diffMins > 0 ? `${diffMins}d` : ''}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Müşteri Tutarları ve Özeti */}
            {jobPosting && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-bold text-white">Müşteri Tutarları ve Özeti</h2>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  
                  {/* Maliyet Bilgileri - İş Tipine Göre */}
                  {(() => {
                    const totalCostWithoutVAT = calculateCustomerBudgetWithoutVAT(jobPosting);
                    if (!totalCostWithoutVAT) return null;
                    
                    const serviceFee = totalCostWithoutVAT * 0.12; // %12 hizmet bedeli
                    const vatAmount = (totalCostWithoutVAT + serviceFee) * 0.20; // %20 KDV (hizmet bedeli dahil toplam üzerinden)
                    const totalCostWithVAT = totalCostWithoutVAT + serviceFee + vatAmount;
                    
                    if (jobPosting.job_type === 'PART_TIME' && jobPosting.hourly_budget_per_person) {
                      const totalHours = calculatePartTimeTotalHours(jobPosting);
                      return (
                        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4 shadow-sm">
                          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            Toplam Maliyet Özeti
                          </h3>
                          <div className="space-y-1.5 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Saatlik Kişi Başı Bütçe:</span>
                              <span className="font-medium text-gray-900">{formatCurrency(jobPosting.hourly_budget_per_person)}</span>
                            </div>
                            {jobPosting.part_time_start_date && jobPosting.part_time_end_date && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Toplam Gün:</span>
                                  <span className="font-medium text-gray-900">
                                    {(() => {
                                      const startDate = new Date(jobPosting.part_time_start_date);
                                      const endDate = new Date(jobPosting.part_time_end_date);
                                      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                                      return `${daysDiff} gün`;
                                    })()}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Toplam Çalışma Saati:</span>
                                  <span className="font-medium text-gray-900">{totalHours.toFixed(1)} saat</span>
                                </div>
                              </>
                            )}
                            <div className="flex justify-between pt-2 border-t border-blue-200">
                              <span className="text-gray-600">Toplam Maliyet (KDV Hariç):</span>
                              <span className="font-medium text-gray-900">{formatCurrency(totalCostWithoutVAT)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Hizmet Bedeli (%12):</span>
                              <span className="font-medium text-gray-900">{formatCurrency(serviceFee)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">KDV (%20):</span>
                              <span className="font-medium text-gray-900">{formatCurrency(vatAmount)}</span>
                            </div>
                            <div className="flex justify-between pt-3 border-t-2 border-blue-200 mt-3">
                              <span className="text-base font-bold text-gray-900">KDV Dahil Toplam:</span>
                              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{formatCurrency(totalCostWithVAT)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    if (jobPosting.job_type === 'FULL_TIME' && jobPosting.monthly_budget_per_person) {
                      return (
                        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4 shadow-sm">
                          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            Tam Zamanlı Maliyet Özeti
                          </h3>
                          <div className="space-y-1.5 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Aylık Kişi Başı Bütçe:</span>
                              <span className="font-medium text-gray-900">{formatCurrency(jobPosting.monthly_budget_per_person)}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-blue-200">
                              <span className="text-gray-600">Aylık Toplam Maliyet (KDV Hariç):</span>
                              <span className="font-medium text-gray-900">{formatCurrency(totalCostWithoutVAT)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Hizmet Bedeli (%12):</span>
                              <span className="font-medium text-gray-900">{formatCurrency(serviceFee)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">KDV (%20):</span>
                              <span className="font-medium text-gray-900">{formatCurrency(vatAmount)}</span>
                            </div>
                            <div className="flex justify-between pt-3 border-t-2 border-blue-200 mt-3">
                              <span className="text-base font-bold text-gray-900">KDV Dahil Toplam:</span>
                              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{formatCurrency(totalCostWithVAT)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (jobPosting.job_type === 'SEASONAL' && jobPosting.monthly_budget_per_person) {
                      return (
                        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4 shadow-sm">
                          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            Dönemsel Maliyet Özeti
                          </h3>
                          <div className="space-y-1.5 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Aylık Kişi Başı Bütçe:</span>
                              <span className="font-medium text-gray-900">{formatCurrency(jobPosting.monthly_budget_per_person)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Dönemsel Süre:</span>
                              <span className="font-medium text-gray-900">{jobPosting.seasonal_period_months} ay</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-blue-200">
                              <span className="text-gray-600">Toplam Maliyet (KDV Hariç):</span>
                              <span className="font-medium text-gray-900">{formatCurrency(totalCostWithoutVAT)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Hizmet Bedeli (%12):</span>
                              <span className="font-medium text-gray-900">{formatCurrency(serviceFee)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">KDV (%20):</span>
                              <span className="font-medium text-gray-900">{formatCurrency(vatAmount)}</span>
                            </div>
                            <div className="flex justify-between pt-3 border-t-2 border-blue-200 mt-3">
                              <span className="text-base font-bold text-gray-900">KDV Dahil Toplam:</span>
                              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{formatCurrency(totalCostWithVAT)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    return null;
                  })()}
                </div>
              </div>
            )}
          </div>

            {/* Müşteri Bilgileri */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-white">Müşteri Bilgileri</h2>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {customer?.company_name && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100">
                      <label className="block text-xs font-semibold text-green-600 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Firma Ünvanı
                      </label>
                      <p className="text-base font-bold text-gray-900">{customer.company_name}</p>
                    </div>
                  )}
                  {customer?.authorized_name && (
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-100">
                      <label className="block text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Yetkili Adı
                      </label>
                      <p className="text-base font-bold text-gray-900">{customer.authorized_name}</p>
                    </div>
                  )}
                  {customer?.authorized_phone && (
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-3 border border-orange-100">
                      <label className="block text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Yetkili Telefon
                      </label>
                      <p className="text-base font-bold text-gray-900">{customer.authorized_phone}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Aday Seçimi Bölümü */}
            {jobPosting && jobPosting.city && jobPosting.district && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">Aday Seçimi</h2>
                        <p className="text-sm text-white/80">
                          {jobPosting.city} / {jobPosting.district} - {jobPosting.required_count} kişi aranıyor
                        </p>
                      </div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                      <p className="text-sm font-semibold text-white">
                        {selectedCandidateIds.length} / {candidates.length} aday seçildi
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {candidates.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                      <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-gray-600 font-medium">Uygun aday bulunamadı!</p>
                      <p className="text-sm text-gray-500 mt-2">Lütfen müşteriyi bilgilendirin.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600 mb-4">
                        <span className="font-semibold text-indigo-600">Not:</span> İş ilanı birden fazla adaya gönderilebilir. Kabul eden ilk <span className="font-bold">{jobPosting.required_count} kişi</span> işi alacak, diğerleri "Geçmiş Fırsatlar" bölümüne yansıyacaktır.
                      </p>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Sol: Mevcut Adaylar */}
                        <div className="space-y-4">
                          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg px-4 py-3">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              Mevcut Adaylar ({candidates.length - selectedCandidateIds.length})
                            </h3>
                          </div>
                          
                          {candidates.filter(c => !selectedCandidateIds.includes(c.id)).length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-sm text-gray-500">Tüm adaylar seçildi</p>
                            </div>
                          ) : (
                            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                              {candidates
                                .filter(c => !selectedCandidateIds.includes(c.id))
                                .map((candidate) => {
                                  const candidateEarning = calculateCandidateEarning(jobPosting);
                                  
                                  return (
                                    <div
                                      key={candidate.id}
                                      className="rounded-xl border-2 border-gray-200 bg-white p-4 transition-all duration-200 cursor-pointer hover:border-indigo-300 hover:shadow-sm"
                                      onClick={() => toggleCandidateSelection(candidate.id)}
                                    >
                                      <div className="flex items-start gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center flex-shrink-0">
                                          <span className="text-lg font-bold">
                                            {candidate.full_name?.charAt(0) || 'A'}
                                          </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h3 className="font-semibold text-gray-900 truncate">
                                            {candidate.full_name}
                                          </h3>
                                          {candidate.phone && (
                                            <p className="text-xs text-gray-500 mt-1">{candidate.phone}</p>
                                          )}
                                        </div>
                                        <div className="flex-shrink-0 text-gray-400">
                                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                          </svg>
                                        </div>
                                      </div>
                                      {candidateEarning && (
                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                          <p className="text-xs text-gray-600">
                                            <span className="font-semibold">Adayın Kazancı:</span>{' '}
                                            {formatCurrency(candidateEarning)} (KDV Hariç)
                                          </p>
                                        </div>
                                      )}
                                      <p className="text-xs text-indigo-600 mt-2 font-medium">Tıklayarak seç</p>
                                    </div>
                                  );
                                })}
                            </div>
                          )}
                        </div>

                        {/* Sağ: Seçilen Adaylar */}
                        <div className="space-y-4">
                          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg px-4 py-3">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Seçilen Adaylar ({selectedCandidateIds.length})
                            </h3>
                          </div>
                          
                          {selectedCandidateIds.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              <p className="text-sm text-gray-500">Henüz aday seçilmedi</p>
                              <p className="text-xs text-gray-400 mt-1">Sol taraftan aday seçin</p>
                            </div>
                          ) : (
                            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                              {candidates
                                .filter(c => selectedCandidateIds.includes(c.id))
                                .map((candidate) => {
                                  const candidateEarning = calculateCandidateEarning(jobPosting);
                                  
                                  return (
                                    <div
                                      key={candidate.id}
                                      className="rounded-xl border-2 border-green-500 bg-green-50 p-4 transition-all duration-200 cursor-pointer hover:shadow-md"
                                      onClick={() => toggleCandidateSelection(candidate.id)}
                                    >
                                      <div className="flex items-start gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-green-500 text-white flex items-center justify-center flex-shrink-0">
                                          <span className="text-lg font-bold">
                                            {candidate.full_name?.charAt(0) || 'A'}
                                          </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h3 className="font-semibold text-gray-900 truncate">
                                            {candidate.full_name}
                                          </h3>
                                          {candidate.phone && (
                                            <p className="text-xs text-gray-500 mt-1">{candidate.phone}</p>
                                          )}
                                        </div>
                                        <div className="flex-shrink-0 text-green-600">
                                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                        </div>
                                      </div>
                                      {candidateEarning && (
                                        <div className="mt-3 pt-3 border-t border-green-200">
                                          <p className="text-xs text-gray-700">
                                            <span className="font-semibold">Adayın Kazancı:</span>{' '}
                                            {formatCurrency(candidateEarning)} (KDV Hariç)
                                          </p>
                                        </div>
                                      )}
                                      <p className="text-xs text-green-600 mt-2 font-medium">Tıklayarak kaldır</p>
                                    </div>
                                  );
                                })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Onayla ve Reddet Butonları */}
                  {candidates.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-end gap-4">
                      <button
                        onClick={() => {
                          setRejectReason('');
                          setNewOfferAmount('');
                          setShowRejectModal(true);
                        }}
                        disabled={submitting}
                        className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-rose-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                      >
                        Reddet
                      </button>
                      <button
                        onClick={handleApprove}
                        disabled={submitting || selectedCandidateIds.length === 0}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                      >
                        {submitting ? 'Onaylanıyor...' : 'Onayla ve Adaylara Gönder'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>
      </main>

      {/* Reddet Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">İş İlanını Reddet</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Red Nedeni <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="rejectReason"
                      value="NEW_OFFER"
                      checked={rejectReason === 'NEW_OFFER'}
                      onChange={(e) => setRejectReason(e.target.value as 'NEW_OFFER')}
                      className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-700">Yeni Teklif</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="rejectReason"
                      value="PERSONNEL_SHORTAGE"
                      checked={rejectReason === 'PERSONNEL_SHORTAGE'}
                      onChange={(e) => setRejectReason(e.target.value as 'PERSONNEL_SHORTAGE')}
                      className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-700">Personel Eksiği</span>
                  </label>
                </div>
              </div>

              {rejectReason === 'NEW_OFFER' && (
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kişi Sayısı
                    </label>
                    <input
                      type="number"
                      value={jobPosting?.required_count || 0}
                      readOnly
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kişi Başı Yeni Teklif (KDV Hariç) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newOfferAmount}
                      onChange={(e) => setNewOfferAmount(e.target.value)}
                      placeholder="Örn: 15000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  
                  {newOfferAmount && parseFloat(newOfferAmount) > 0 && jobPosting && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Teklif Özeti</h4>
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Kişi Sayısı:</span>
                          <span className="font-medium text-gray-900">{jobPosting.required_count} kişi</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Kişi Başı Yeni Teklif (KDV Hariç):</span>
                          <span className="font-medium text-gray-900">{formatCurrency(parseFloat(newOfferAmount))}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-blue-200">
                          <span className="text-gray-600">Toplam KDV Hariç:</span>
                          <span className="font-medium text-gray-900">{formatCurrency(parseFloat(newOfferAmount) * (jobPosting.required_count || 1))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">%20 KDV:</span>
                          <span className="font-medium text-gray-900">{formatCurrency(parseFloat(newOfferAmount) * (jobPosting.required_count || 1) * 0.20)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-blue-200">
                          <span className="font-semibold text-gray-900">Toplam Aylık Maliyet (KDV Dahil):</span>
                          <span className="font-bold text-blue-600">{formatCurrency(parseFloat(newOfferAmount) * (jobPosting.required_count || 1) * 1.20)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Şu an maalesef talebiniz mevcut adaylarımız ile eşleştirilememiştir.
                  </p>
                </div>
              )}

              {rejectReason === 'PERSONNEL_SHORTAGE' && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-700">
                    Şu an maalesef talebiniz mevcut adaylarımız ile eşleştirilememiştir.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setNewOfferAmount('');
                }}
                disabled={submitting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50"
              >
                İptal
              </button>
              <button
                onClick={handleReject}
                disabled={submitting || !rejectReason || (rejectReason === 'NEW_OFFER' && (!newOfferAmount || parseFloat(newOfferAmount) <= 0) || !jobPosting)}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-rose-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Reddediliyor...' : 'Reddet'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
