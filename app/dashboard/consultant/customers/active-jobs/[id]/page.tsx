/**
 * Aktif İş İlanı Detay Sayfası
 * 
 * Consultant'ların aktif iş ilanı detaylarını ve atanmış adayları görebileceği sayfa
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface JobPosting {
  id: string;
  customer_id: string;
  title: string;
  description: string | null;
  required_count: number;
  contract_start_date: string | null;
  contract_end_date: string | null;
  start_date: string | null;
  status: 'ACTIVE' | 'CURRENT' | 'PAST';
  created_at: string;
}

interface Customer {
  full_name: string;
  company_name: string | null;
  authorized_name: string | null;
  authorized_phone: string | null;
  tax_number: string | null;
  tax_office: string | null;
  company_address: string | null;
  company_phone: string | null;
}

interface AssignedCandidate {
  assignment_id: string;
  candidate_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  assigned_at: string;
  responded_at: string | null;
  rejection_reason: string | null;
}

export default function ActiveJobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const jobId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [jobPosting, setJobPosting] = useState<JobPosting | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [assignedCandidates, setAssignedCandidates] = useState<AssignedCandidate[]>([]);
  const [siteLogo, setSiteLogo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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

        if (job.status !== 'CURRENT') {
          setError('Bu iş ilanı aktif değil');
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
          .select('company_name, authorized_name, authorized_phone, tax_number, tax_office, company_address, company_phone')
          .eq('profile_id', job.customer_id)
          .single();

        setCustomer({
          full_name: customerProfile?.full_name || '-',
          company_name: customerInfo?.company_name || null,
          authorized_name: customerInfo?.authorized_name || null,
          authorized_phone: customerInfo?.authorized_phone || null,
          tax_number: customerInfo?.tax_number || null,
          tax_office: customerInfo?.tax_office || null,
          company_address: customerInfo?.company_address || null,
          company_phone: customerInfo?.company_phone || null,
        });

        // İlana atanmış adayları al
        const { data: assignments } = await supabase
          .from('job_assignments')
          .select('*')
          .eq('job_posting_id', jobId)
          .order('assigned_at', { ascending: false });

        if (assignments && assignments.length > 0) {
          const candidatesWithInfo = await Promise.all(
            assignments.map(async (assignment) => {
              const { data: candidateProfile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', assignment.candidate_id)
                .single();

              const { data: candidateInfo } = await supabase
                .from('candidate_info')
                .select('phone, email')
                .eq('profile_id', assignment.candidate_id)
                .single();

              return {
                assignment_id: assignment.id,
                candidate_id: assignment.candidate_id,
                full_name: candidateProfile?.full_name || '-',
                phone: candidateInfo?.phone || null,
                email: candidateInfo?.email || null,
                status: assignment.status as 'PENDING' | 'ACCEPTED' | 'REJECTED',
                assigned_at: assignment.assigned_at,
                responded_at: assignment.responded_at,
                rejection_reason: assignment.rejection_reason,
              };
            })
          );

          setAssignedCandidates(candidatesWithInfo);
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
      } catch (err: any) {
        setError(err.message || 'Veriler yüklenirken hata oluştu');
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            Beklemede
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
            Kabul Edildi
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
            Reddedildi
          </span>
        );
      default:
        return null;
    }
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg mb-6 shadow-md">
            <div className="flex items-center">
              <span className="text-xl mr-3">⚠️</span>
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}

        {jobPosting && (
          <>
            {/* İş İlanı Detayları */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">{jobPosting.title}</h2>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    jobPosting.status === 'CURRENT' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {jobPosting.status === 'CURRENT' ? 'Aktif Sözleşme' : 'Onaylandı'}
                  </span>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {/* Açıklama */}
                {jobPosting.description && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Açıklama</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{jobPosting.description}</p>
                  </div>
                )}

                {/* İş Detayları */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <h3 className="text-xs font-medium text-gray-500 mb-1">Gerekli Kişi Sayısı</h3>
                    <p className="text-sm font-semibold text-gray-900">{jobPosting.required_count} kişi</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-medium text-gray-500 mb-1">İşe Başlama Tarihi</h3>
                    <p className="text-sm font-semibold text-gray-900">{formatDate(jobPosting.start_date)}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-medium text-gray-500 mb-1">Sözleşme Başlangıç</h3>
                    <p className="text-sm font-semibold text-gray-900">{formatDate(jobPosting.contract_start_date)}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-medium text-gray-500 mb-1">Sözleşme Bitiş</h3>
                    <p className="text-sm font-semibold text-gray-900">{formatDate(jobPosting.contract_end_date)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Firma Bilgileri */}
            {customer && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">Firma Bilgileri</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 mb-1">Firma Ünvanı</h3>
                      <p className="text-sm font-semibold text-gray-900">{customer.company_name || '-'}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 mb-1">Yetkili Adı Soyadı</h3>
                      <p className="text-sm font-semibold text-gray-900">{customer.authorized_name || '-'}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 mb-1">Yetkili Telefon</h3>
                      <p className="text-sm font-semibold text-gray-900">{customer.authorized_phone || '-'}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 mb-1">Şirket Telefonu</h3>
                      <p className="text-sm font-semibold text-gray-900">{customer.company_phone || '-'}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 mb-1">Vergi Numarası</h3>
                      <p className="text-sm font-semibold text-gray-900">{customer.tax_number || '-'}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 mb-1">Vergi Dairesi</h3>
                      <p className="text-sm font-semibold text-gray-900">{customer.tax_office || '-'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <h3 className="text-xs font-medium text-gray-500 mb-1">Şirket Adresi</h3>
                      <p className="text-sm font-semibold text-gray-900">{customer.company_address || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Atanmış Adaylar */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  Atanmış Adaylar ({assignedCandidates.length}/{jobPosting.required_count})
                </h2>
              </div>
              <div className="p-6">
                {assignedCandidates.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Bu iş ilanına henüz aday atanmamış
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignedCandidates.map((candidate) => (
                      <div key={candidate.assignment_id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-base font-semibold text-gray-900 mb-1">{candidate.full_name}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              {candidate.phone && (
                                <span>📞 {candidate.phone}</span>
                              )}
                              {candidate.email && (
                                <span>✉️ {candidate.email}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {getStatusBadge(candidate.status)}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 mt-3">
                          <div>
                            <span className="font-medium">Atanma Tarihi:</span>{' '}
                            {formatDate(candidate.assigned_at)}
                          </div>
                          {candidate.responded_at && (
                            <div>
                              <span className="font-medium">Cevap Tarihi:</span>{' '}
                              {formatDate(candidate.responded_at)}
                            </div>
                          )}
                        </div>
                        {candidate.rejection_reason && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-xs">
                            <p className="font-medium text-red-700 mb-1">Red Nedeni:</p>
                            <p className="text-gray-700">{candidate.rejection_reason}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
