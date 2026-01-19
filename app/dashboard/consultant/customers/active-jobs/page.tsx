/**
 * Aktif İş İlanları Sayfası
 * 
 * Consultant'ların onayladığı ve aday ataması yapılabilen iş ilanlarını görüntüleyebileceği sayfa
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  customer: {
    full_name: string;
    company_name: string | null;
  } | null;
  assignedCount: number; // Kaç aday atanmış
}

export default function ActiveJobsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [siteLogo, setSiteLogo] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [customerMenuOpen, setCustomerMenuOpen] = useState(false);
  const customerMenuRef = useRef<HTMLDivElement>(null);
  const [candidateMenuOpen, setCandidateMenuOpen] = useState(false);
  const candidateMenuRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

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

        // Aktif iş ilanlarını al (status = 'CURRENT')
        const { data: jobs, error: jobsError } = await supabase
          .from('job_postings')
          .select('*')
          .eq('status', 'CURRENT')
          .order('created_at', { ascending: false });

        if (jobsError) {
          throw jobsError;
        }

        // Her iş ilanı için müşteri bilgilerini ve atama sayısını al
        const jobsWithDetails = await Promise.all(
          (jobs || []).map(async (job) => {
            const { data: customerProfile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', job.customer_id)
              .single();

            const { data: customerInfo } = await supabase
              .from('customer_info')
              .select('company_name')
              .eq('profile_id', job.customer_id)
              .single();

            // Atama sayısını al
            const { count: assignmentCount } = await supabase
              .from('job_assignments')
              .select('*', { count: 'exact', head: true })
              .eq('job_posting_id', job.id);

            return {
              ...job,
              customer: {
                full_name: customerProfile?.full_name || '-',
                company_name: customerInfo?.company_name || null,
              },
              assignedCount: assignmentCount || 0,
            };
          })
        );

        setJobPostings(jobsWithDetails);

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
  }, [router, supabase]);

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
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const handleViewDetails = (jobId: string) => {
    // İş ilanı detay sayfasına yönlendir
    router.push(`/dashboard/consultant/customers/active-jobs/${jobId}`);
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
      {/* Header - Same as JobRequestsPage */}
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

          {/* User Profile Dropdown - Same as JobRequestsPage */}
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Aktif İş İlanları</h1>
          <p className="text-sm text-gray-600">
            Onaylanmış iş ilanlarına aday ataması yapabilirsiniz
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg mb-6 shadow-md">
            <div className="flex items-center">
              <span className="text-xl mr-3">⚠️</span>
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* İş İlanları Listesi */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Aktif İş İlanları ({jobPostings.length})</h3>
          </div>

          {jobPostings.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-400 text-sm">
                Henüz aktif iş ilanı bulunmuyor
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {jobPostings.map((job) => (
                <div key={job.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{job.title}</h4>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          Onaylandı
                        </span>
                      </div>
                      {job.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{job.description}</p>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Müşteri:</span>
                          <p className="font-medium text-gray-900">{job.customer?.full_name || '-'}</p>
                          {job.customer?.company_name && (
                            <p className="text-xs text-gray-500">{job.customer.company_name}</p>
                          )}
                        </div>
                        <div>
                          <span className="text-gray-500">Kişi Sayısı:</span>
                          <p className="font-medium text-gray-900">{job.required_count} kişi</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Atanan:</span>
                          <p className="font-medium text-gray-900">{job.assignedCount}/{job.required_count} aday</p>
                        </div>
                        <div>
                          <span className="text-gray-500">İşe Başlama:</span>
                          <p className="font-medium text-gray-900">{formatDate(job.start_date)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Oluşturulma:</span>
                          <p className="font-medium text-gray-900">{formatDate(job.created_at)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => handleViewDetails(job.id)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        Detaylı Görüntüle
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
