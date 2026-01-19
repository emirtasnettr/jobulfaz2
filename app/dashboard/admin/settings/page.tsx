/**
 * Sistem Ayarları Sayfası
 * 
 * Admin'lerin sistem ayarlarını yönetebileceği sayfa (Logo, site ayarları vb.)
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function AdminSettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [siteLogo, setSiteLogo] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sliders, setSliders] = useState<any[]>([]);
  const [editingSlider, setEditingSlider] = useState<any | null>(null);
  const [showSliderForm, setShowSliderForm] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error('User error:', userError);
          router.push('/auth/login');
          return;
        }

        console.log('User loaded:', user.id, user.email);

        // Profil bilgilerini al
        let profileData = null;
        
        for (let i = 0; i < 3; i++) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (data && !error) {
            profileData = data;
            console.log('Profile loaded:', profileData);
            break;
          }
          
          if (i < 2) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }

        if (!profileData) {
          console.warn('Profile not found');
          setUser(user);
          setLoading(false);
          return;
        }

        // Admin kontrolü
        if (profileData.role !== 'ADMIN') {
          router.push('/dashboard/admin');
          return;
        }

        setProfile(profileData);
        setUser(user);

        // Site logo'yu yükle
        try {
          const { data: settings, error: settingsError } = await supabase
            .from('site_settings')
            .select('logo_url')
            .single();
          
          if (!settingsError && settings?.logo_url) {
            setSiteLogo(settings.logo_url);
          }
        } catch (err) {
          console.log('Logo yüklenemedi:', err);
        }

        // Sliderları yükle (API route üzerinden)
        try {
          const response = await fetch('/api/admin/settings/sliders');
          if (response.ok) {
            const data = await response.json();
            setSliders(data.sliders || []);
          }
        } catch (err) {
          console.log('Sliderlar yüklenemedi:', err);
        }
      } catch (err: any) {
        console.error('Load data error:', err);
        setError(err.message || 'Veriler yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router, supabase]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Dosya tipi kontrolü
    if (!file.type.startsWith('image/')) {
      setError('Sadece resim dosyaları yüklenebilir');
      return;
    }

    // Dosya boyutu kontrolü (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Logo dosyası 5MB\'dan büyük olamaz');
      return;
    }

    setLogoUploading(true);
    setError(null);
    setSuccess(null);

    try {
      // API route kullanarak logo yükle (RLS bypass)
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/settings/logo', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Logo yüklenirken hata oluştu');
      }

      setSiteLogo(data.logoUrl);
      setSuccess('Logo başarıyla yüklendi!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Logo upload error:', err);
      setError(err.message || 'Logo yüklenirken hata oluştu');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!confirm('Logoyu kaldırmak istediğinize emin misiniz?')) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      // Önce kaydın var olup olmadığını kontrol et
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .single();

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({ logo_url: null })
          .eq('id', '00000000-0000-0000-0000-000000000001');
        
        if (error) throw error;
      }
      
      setSiteLogo(null);
      setSuccess('Logo kaldırıldı!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Logo kaldırılırken hata oluştu');
    }
  };

  const handleAddSlider = () => {
    if (sliders.length >= 9) {
      setError('En fazla 9 slider ekleyebilirsiniz');
      return;
    }
    setEditingSlider(null);
    setShowSliderForm(true);
  };

  const handleEditSlider = (slider: any) => {
    setEditingSlider(slider);
    setShowSliderForm(true);
  };

  const handleDeleteSlider = async (id: string) => {
    if (!confirm('Bu sliderı silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      // API route üzerinden sil
      const response = await fetch(`/api/admin/settings/sliders?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Slider silinirken hata oluştu');
      }

      setSliders(sliders.filter(s => s.id !== id));
      setSuccess('Slider silindi!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Slider silinirken hata oluştu');
    }
  };

  const handleImageUpload = async (file: File): Promise<string | null> => {
    setImageUploading(true);
    try {
      // API route üzerinden resim yükle
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/settings/sliders/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Resim yüklenirken hata oluştu');
      }

      return data.imageUrl;
    } catch (err: any) {
      setError(err.message || 'Resim yüklenirken hata oluştu');
      return null;
    } finally {
      setImageUploading(false);
    }
  };

  const handleSaveSlider = async (formData: any) => {
    try {
      setError(null);
      setSuccess(null);

      let imageUrl = formData.image_url;

      // Yeni resim yüklendiyse
      if (formData.image_file) {
        const uploadedUrl = await handleImageUpload(formData.image_file);
        if (!uploadedUrl) return;
        imageUrl = uploadedUrl;
      }

      const sliderData = {
        title: formData.title,
        description: formData.description || null,
        image_url: imageUrl || null,
        link_url: formData.link_url || null,
        display_order: formData.order || sliders.length,
        is_active: formData.is_active !== undefined ? formData.is_active : true,
      };

      let response;
      if (editingSlider) {
        // Güncelle (API route üzerinden)
        response = await fetch('/api/admin/settings/sliders', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: editingSlider.id,
            ...sliderData,
          }),
        });
      } else {
        // Yeni ekle (API route üzerinden)
        response = await fetch('/api/admin/settings/sliders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sliderData),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ API error response:', response.status, data);
        const errorMessage = data.error || data.message || 'Slider kaydedilirken hata oluştu';
        const fullErrorMessage = data.details 
          ? `${errorMessage}\n\nDetaylar: ${data.details}`
          : errorMessage;
        throw new Error(fullErrorMessage);
      }

      if (editingSlider) {
        setSliders(sliders.map(s => s.id === editingSlider.id ? data.slider : s));
        setSuccess('Slider güncellendi!');
      } else {
        setSliders([...sliders, data.slider]);
        setSuccess('Slider eklendi!');
      }

      setShowSliderForm(false);
      setEditingSlider(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Slider kaydedilirken hata oluştu');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      // API route üzerinden güncelle
      const response = await fetch('/api/admin/settings/sliders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          is_active: !currentStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Slider durumu güncellenirken hata oluştu');
      }

      setSliders(sliders.map(s => s.id === id ? data.slider : s));
    } catch (err: any) {
      setError(err.message || 'Slider durumu güncellenirken hata oluştu');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50/50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      {/* Modern Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/admin"
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center hover:scale-105 transition-transform"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Sistem Ayarları</h1>
              <p className="text-xs text-gray-400 mt-0.5">Logo ve site ayarlarını yönetin</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50/80 border border-red-200/50 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-red-700 font-medium mb-1">Hata</p>
                <p className="text-sm text-red-600 whitespace-pre-wrap">{error}</p>
                {error.includes('SUPABASE_SERVICE_ROLE_KEY') && (
                  <div className="mt-3 p-3 bg-red-100/50 rounded-lg border border-red-200">
                    <p className="text-xs text-red-700 font-medium mb-1">Çözüm:</p>
                    <ol className="text-xs text-red-600 list-decimal list-inside space-y-1">
                      <li>.env.local dosyanızı açın</li>
                      <li>SUPABASE_SERVICE_ROLE_KEY=your-key-here satırını ekleyin</li>
                      <li>Development server'ı yeniden başlatın (Ctrl+C, sonra npm run dev)</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50/80 border border-green-200/50 rounded-xl flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-green-700 font-medium">{success}</p>
          </div>
        )}

        {/* Logo Upload Card */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-200/50 p-8 mb-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Site Logo</h3>
            <p className="text-sm text-gray-500">Admin dashboard'da görünecek logoyu yükleyin</p>
          </div>

          <div className="space-y-4">
            {/* Mevcut Logo */}
            {siteLogo && (
              <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-200/30">
                <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                  Mevcut Logo
                </label>
                <div className="flex items-center gap-4">
                  <img
                    src={siteLogo}
                    alt="Site Logo"
                    className="h-16 w-auto max-w-[200px] object-contain border border-gray-200 rounded-lg p-2 bg-white"
                  />
                  <button
                    onClick={handleRemoveLogo}
                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    Logoyu Kaldır
                  </button>
                </div>
              </div>
            )}

            {/* Logo Yükleme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {siteLogo ? 'Logoyu Değiştir' : 'Logo Yükle'}
              </label>
              <div className="flex items-center gap-4">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={logoUploading}
                    className="hidden"
                  />
                  <div className="px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-all text-center">
                    {logoUploading ? (
                      <div className="flex items-center justify-center gap-2 text-gray-600">
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm">Yükleniyor...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-sm text-gray-600">
                          {siteLogo ? 'Yeni logo seç' : 'Logo dosyası seç'}
                        </span>
                        <span className="text-xs text-gray-400">PNG, JPG veya SVG (Max 5MB)</span>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Sliders Management */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-200/50 p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Ana Sayfa Sliderları</h3>
              <p className="text-sm text-gray-500">Ana sayfada gösterilecek sliderları yönetin (Maksimum 9)</p>
            </div>
            <button
              onClick={handleAddSlider}
              disabled={sliders.length >= 9}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Slider Ekle
            </button>
          </div>

          {sliders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Henüz slider eklenmemiş</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sliders.map((slider) => (
                <div
                  key={slider.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{slider.title}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        slider.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {slider.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                      <span className="text-xs text-gray-500">Sıra: {slider.display_order}</span>
                    </div>
                    {slider.description && (
                      <p className="text-sm text-gray-600 line-clamp-1">{slider.description}</p>
                    )}
                    {slider.image_url && (
                      <img
                        src={slider.image_url}
                        alt={slider.title}
                        className="mt-2 h-16 w-auto rounded-lg object-cover"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(slider.id, slider.is_active)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        slider.is_active
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {slider.is_active ? 'Pasif Yap' : 'Aktif Yap'}
                    </button>
                    <button
                      onClick={() => handleEditSlider(slider)}
                      className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDeleteSlider(slider.id)}
                      className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Slider Form Modal */}
        {showSliderForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <SliderForm
                slider={editingSlider}
                onSave={handleSaveSlider}
                onCancel={() => {
                  setShowSliderForm(false);
                  setEditingSlider(null);
                }}
                imageUploading={imageUploading}
                maxOrder={sliders.length}
              />
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="bg-blue-50/50 border border-blue-200/50 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-1">Bilgi</h4>
              <p className="text-sm text-blue-700">
                Yüklediğiniz logo admin dashboard ve kullanıcı yönetimi sayfalarının header'ında görünecektir. 
                Logo yüklenmezse varsayılan simge gösterilecektir. Sliderlar ana sayfada yan yana 3 sütun halinde gösterilir ve otomatik olarak kaydırılır.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Slider Form Component
function SliderForm({
  slider,
  onSave,
  onCancel,
  imageUploading,
  maxOrder,
}: {
  slider: any | null;
  onSave: (data: any) => void;
  onCancel: () => void;
  imageUploading: boolean;
  maxOrder: number;
}) {
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    image_url: string;
    link_url: string;
    order: number;
    is_active: boolean;
    image_file: File | null;
  }>({
    title: slider?.title || '',
    description: slider?.description || '',
    image_url: slider?.image_url || '',
    link_url: slider?.link_url || '',
    order: slider?.order ?? maxOrder,
    is_active: slider?.is_active !== undefined ? slider.is_active : true,
    image_file: null as File | null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Başlık zorunludur');
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          {slider ? 'Slider Düzenle' : 'Yeni Slider Ekle'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Başlık <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Açıklama
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resim
          </label>
          {formData.image_url && !formData.image_file && (
            <img
              src={formData.image_url}
              alt="Preview"
              className="mb-2 h-32 w-auto rounded-lg object-cover"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setFormData({ ...formData, image_file: file, image_url: '' });
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {imageUploading && (
            <p className="mt-2 text-sm text-gray-600">Resim yükleniyor...</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Link URL (Opsiyonel)
          </label>
          <input
            type="url"
            value={formData.link_url}
            onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sıra
            </label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              min={0}
              max={maxOrder}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Durum
            </label>
            <select
              value={formData.is_active ? 'true' : 'false'}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="true">Aktif</option>
              <option value="false">Pasif</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200">
        <button
          type="submit"
          disabled={imageUploading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
        >
          {slider ? 'Güncelle' : 'Ekle'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          İptal
        </button>
      </div>
    </form>
  );
}
