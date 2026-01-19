/**
 * Müşteri Dashboard Sayfası
 * 
 * Müşterilerin dashboard'u - Fırsat Yönetimi
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

type JobStatus = 'ACTIVE' | 'CURRENT' | 'PAST' | 'ALL';

interface JobPosting {
  id: string;
  customer_id: string;
  title: string;
  description: string | null;
  required_count: number;
  contract_start_date: string | null;
  contract_end_date: string | null;
  start_date: string | null;
  city: string | null;
  district: string | null;
  job_type: 'FULL_TIME' | 'PART_TIME' | 'SEASONAL' | null;
  part_time_start_date: string | null;
  part_time_end_date: string | null;
  seasonal_period_months: number | null;
  status: 'ACTIVE' | 'CURRENT' | 'PAST' | 'REJECTED';
  rejection_reason: 'NEW_OFFER' | 'PERSONNEL_SHORTAGE' | null;
  new_offer_monthly_budget_per_person: number | null;
  new_offer_daily_budget_per_person: number | null;
  new_offer_total_without_vat: number | null;
  new_offer_total_with_vat: number | null;
  new_offer_accepted: boolean | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Profile {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
}

interface CustomerInfo {
  id: string;
  profile_id: string;
  authorized_name: string | null;
  authorized_phone: string | null;
  company_name: string | null;
  tax_number: string | null;
  tax_office: string | null;
  company_address: string | null;
  company_phone: string | null;
}

export default function CustomerDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobPosting[]>([]);
  const [activeFilter, setActiveFilter] = useState<JobStatus>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stats, setStats] = useState({
    active: 0,
    current: 0,
    past: 0,
    total: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [jobMenuOpen, setJobMenuOpen] = useState(false);
  const jobMenuRef = useRef<HTMLDivElement>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [siteLogo, setSiteLogo] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [dismissedCancelledOffers, setDismissedCancelledOffers] = useState<Set<string>>(new Set());

  // Welcome card'ı 5 saniye sonra otomatik kapat
  useEffect(() => {
    if (showWelcome) {
      const timer = setTimeout(() => {
        setShowWelcome(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showWelcome]);

  // Verileri yükle
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

        if (!profileData || profileData.role !== 'CUSTOMER') {
          router.push('/');
          return;
        }

        setProfile(profileData);

        // Müşteri bilgilerini al
        const { data: customerInfoData } = await supabase
          .from('customer_info')
          .select('*')
          .eq('profile_id', user.id)
          .single();

        setCustomerInfo(customerInfoData || null);

        // Eğer müşteri bilgileri yoksa, profil tamamlama sayfasına yönlendir
        if (!customerInfoData) {
          router.push('/dashboard/customer/profile/complete');
          return;
        }

        // İş ilanlarını al
        const { data: jobs } = await supabase
          .from('job_postings')
          .select('*')
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false });

        const jobsData = jobs || [];
        setJobPostings(jobsData);

        // İstatistikleri hesapla
        const statsData = {
          active: jobsData.filter((job) => job.status === 'ACTIVE').length,
          current: jobsData.filter((job) => job.status === 'CURRENT').length,
          past: jobsData.filter((job) => job.status === 'PAST').length,
          total: jobsData.length,
        };
        setStats(statsData);

        // İlk filtreleme
        filterJobs(jobsData, activeFilter, searchQuery);

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
      if (jobMenuRef.current && !jobMenuRef.current.contains(event.target as Node)) {
        setJobMenuOpen(false);
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

  // Filtreleme ve arama
  const filterJobs = (jobs: JobPosting[], filter: JobStatus, search: string = '') => {
    let filtered = jobs;

    if (filter !== 'ALL') {
      filtered = filtered.filter((job) => job.status === filter);
    }

    if (search.trim() !== '') {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((job) => {
        const title = job.title?.toLowerCase() || '';
        const description = job.description?.toLowerCase() || '';
        return title.includes(searchLower) || description.includes(searchLower);
      });
    }

    setFilteredJobs(filtered);
  };

  const handleFilterClick = (filter: JobStatus) => {
    setActiveFilter(filter);
    filterJobs(jobPostings, filter, searchQuery);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    filterJobs(jobPostings, activeFilter, query);
    setCurrentPage(1);
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

  const handleDismissCancelledOffer = (jobId: string) => {
    setDismissedCancelledOffers((prev) => new Set(prev).add(jobId));
  };

  const getStatusBadge = (job: JobPosting) => {
    switch (job.status) {
      case 'ACTIVE':
        return (
          <span 
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
            title="Yeni açılmış, henüz Consultant tarafından kabul edilmemiş ve çalışan atanmamış"
          >
            Onay Bekleyen
          </span>
        );
      case 'CURRENT':
        return (
          <span 
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"
            title="Consultant tarafından kabul edilmiş ve çalışan atanmış"
          >
            Aktif Fırsat
          </span>
        );
      case 'PAST':
        return (
          <span 
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
            title="Çalışma bitiş tarihi bitmiş fırsat"
          >
            Geçmiş Fırsat
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
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

            {/* Fırsat Yönetimi Dropdown */}
            <div className="relative" ref={jobMenuRef}>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setJobMenuOpen(!jobMenuOpen);
                  }}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-1"
                >
                  Fırsat Yönetimi
                  <svg className={`w-4 h-4 transition-transform ${jobMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {jobMenuOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white/95 backdrop-blur-md rounded-lg border border-gray-200 shadow-lg overflow-hidden z-50">
                  <div className="py-1.5">
                    <Link
                      href="/dashboard/customer/jobs/create"
                      onClick={() => setJobMenuOpen(false)}
                      className="w-full px-3 py-2.5 text-left flex items-center gap-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Yeni Fırsat Oluştur</p>
                        <p className="text-xs text-gray-400">Yeni fırsat ekle</p>
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
                  {profile?.full_name?.charAt(0) || 'M'}
                </span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-700">{profile?.full_name || 'Müşteri'}</p>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Card */}
        {showWelcome && (
          <div className="relative mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-blue-100 p-6 text-gray-800 overflow-hidden">
              <button
                onClick={() => setShowWelcome(false)}
                className="absolute top-3 right-3 w-6 h-6 rounded-md bg-white/80 hover:bg-white border border-gray-200 flex items-center justify-center transition-colors"
                aria-label="Kapat"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="relative z-10 pr-8">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <span className="text-xl">👋</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                      Hoş Geldiniz
                    </h2>
                    <p className="text-sm text-gray-600">{customerInfo?.company_name || profile?.full_name || 'Müşteri'}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Fırsatlarınızı yönetebilir ve yeni fırsat oluşturabilirsiniz.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-6">
          {/* Onay Bekleyen Fırsatlar */}
          <button
            onClick={() => handleFilterClick('ACTIVE')}
            className={`group bg-[#FDFDFD] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 ${
              activeFilter === 'ACTIVE' 
                ? 'ring-2 ring-blue-300' 
                : ''
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600">Onay Bekleyen Fırsatlar</p>
            </div>
            <p className="text-4xl font-bold text-gray-900">{stats.active}</p>
          </button>

          {/* Aktif Fırsatlar */}
          <button
            onClick={() => handleFilterClick('CURRENT')}
            className={`group bg-[#FDFDFD] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 ${
              activeFilter === 'CURRENT' 
                ? 'ring-2 ring-green-300' 
                : ''
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600">Aktif Fırsatlar</p>
            </div>
            <p className="text-4xl font-bold text-gray-900">{stats.current}</p>
          </button>

          {/* Geçmiş İşe Alımlar */}
          <button
            onClick={() => handleFilterClick('PAST')}
            className={`group bg-[#FDFDFD] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 ${
              activeFilter === 'PAST' 
                ? 'ring-2 ring-gray-300' 
                : ''
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600">Geçmiş Fırsatlar</p>
            </div>
            <p className="text-4xl font-bold text-gray-900">{stats.past}</p>
          </button>

          {/* Toplam */}
          <button
            onClick={() => handleFilterClick('ALL')}
            className={`group bg-[#FDFDFD] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 ${
              activeFilter === 'ALL' 
                ? 'ring-2 ring-indigo-300' 
                : ''
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600">Tüm Fırsatlar</p>
            </div>
            <p className="text-4xl font-bold text-gray-900">{stats.total}</p>
          </button>

        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg mb-6 shadow-md">
            <div className="flex items-center">
              <span className="text-xl mr-3">⚠️</span>
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Fırsatlar Listesi */}
        <div className="bg-white rounded-xl border border-gray-200 mt-6">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Fırsatlar</h3>
            <Link
              href="/dashboard/customer/jobs/create"
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Yeni Fırsat Oluştur
            </Link>
          </div>

          {/* Header Actions */}
          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Ara (Başlık, Açıklama...)"
                value={searchQuery}
                onChange={handleSearchChange}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fırsat Başlığı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İl / İlçe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İş Tipi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kişi Sayısı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredJobs
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="text-gray-400 text-sm">
                          {searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz fırsat bulunmuyor'}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredJobs
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((job) => {
                        // İş tipi label
                        const getJobTypeLabel = () => {
                          if (job.job_type === 'PART_TIME') return 'Part-time';
                          if (job.job_type === 'SEASONAL') return 'Dönemsel';
                          if (job.job_type === 'FULL_TIME') return 'Tam Zamanlı';
                          return '-';
                        };

                        return (
                          <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{job.title}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-600">
                                {job.city && job.district ? `${job.city} / ${job.district}` : '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">{getJobTypeLabel()}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">{job.required_count} kişi</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(job)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Link
                                href={`/dashboard/customer/jobs/${job.id}`}
                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                              >
                                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                  )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredJobs.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                {(() => {
                  const start = (currentPage - 1) * itemsPerPage + 1;
                  const end = Math.min(currentPage * itemsPerPage, filteredJobs.length);
                  return `${start} - ${end} arası, toplam ${filteredJobs.length} kayıt`;
                })()}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  &lt;&lt;
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  &lt;
                </button>
                {(() => {
                  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
                  if (totalPages <= 1) return null;
                  
                  return (
                    <>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </>
                  );
                })()}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredJobs.length / itemsPerPage), prev + 1))}
                  disabled={currentPage >= Math.ceil(filteredJobs.length / itemsPerPage)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  &gt;
                </button>
                <button
                  onClick={() => setCurrentPage(Math.ceil(filteredJobs.length / itemsPerPage))}
                  disabled={currentPage >= Math.ceil(filteredJobs.length / itemsPerPage)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  &gt;&gt;
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
