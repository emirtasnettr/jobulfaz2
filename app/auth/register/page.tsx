/**
 * Register Sayfası
 * 
 * Yeni kullanıcı kaydı - SADECE CANDIDATE rolü ile kayıt yapılabilir
 * Middleman kullanıcıları manuel olarak DB'den eklenmelidir
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validasyon
    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    if (formData.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return;
    }

    if (!formData.fullName.trim()) {
      setError('Ad Soyad alanı zorunludur');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // ÖNEMLİ: Kayıt sırasında metadata'ya rol ve ad bilgisi ekliyoruz
      // Trigger (handle_new_user) bu bilgileri kullanarak profiles tablosuna kayıt oluşturacak
      // NOT: Email konfirmasyonu devre dışı bırakıldığı için kullanıcı otomatik olarak authenticated olacak
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: 'CANDIDATE', // SADECE CANDIDATE rolü ile kayıt
          },
          emailRedirectTo: undefined, // Email konfirmasyonu devre dışı
        },
      });

      if (signUpError) {
        setError(signUpError.message || 'Kayıt olunamadı');
        setLoading(false);
        return;
      }

      if (data.user) {
        // Email konfirmasyonu kapalıysa kullanıcı otomatik olarak authenticated olur
        // Profil oluşması için kısa bir bekleme (trigger çalışsın)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Kullanıcının profilini ve rolünü al (retry ile)
        let profile = null;
        for (let i = 0; i < 3; i++) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();
          
          if (profileData) {
            profile = profileData;
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 300));
        }

        // Rolüne göre yönlendir (kayıt olanlar genelde CANDIDATE olur)
        let redirectPath = '/dashboard/candidate';
        if (profile?.role === 'ADMIN') {
          redirectPath = '/dashboard/admin';
        } else if (profile?.role === 'CONSULTANT') {
          redirectPath = '/dashboard/consultant';
        } else if (profile?.role === 'MIDDLEMAN') {
          redirectPath = '/dashboard/middleman';
        }

        // Dashboard'a yönlendir (hard redirect kullan - middleware'in çalışması için)
        window.location.href = redirectPath;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bir hata oluştu';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M7 18V8.5a2.5 2.5 0 0 1 2.5-2.5H12a5 5 0 0 1 0 10H7Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path
                  d="M14.5 10.5h2a2.5 2.5 0 0 1 0 5h-2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="text-sm font-semibold tracking-tight text-gray-900">JobulAI</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/auth/login"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Giriş Yap
            </Link>
            <Link
              href="/auth/register"
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
            >
              Kayıt Ol
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-16">
        {/* Form */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm">
                <span className="inline-flex h-2 w-2 rounded-full bg-blue-600" />
                Kayıt (Sadece aday)
              </div>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900">
                Hesabını oluştur
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Kayıt olduktan sonra otomatik yönlendirileceksin.
              </p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" />
                Sadece aday kaydı yapılabilir
              </div>
            </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                Ad Soyad <span className="text-red-500">*</span>
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                placeholder="Adınız Soyadınız"
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-posta Adresi <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                placeholder="info@example.com"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Şifre <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-12 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                  placeholder="En az 6 karakter"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0L7.5 7.5m-1.21-1.21L3 3m18 18l-3.29-3.29m0 0L16.5 16.5m1.21-1.21L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">Şifre en az 6 karakter olmalıdır</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Şifre Tekrar <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-12 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                  placeholder="Şifrenizi tekrar girin"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0L7.5 7.5m-1.21-1.21L3 3m18 18l-3.29-3.29m0 0L16.5 16.5m1.21-1.21L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Info Box */}
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              <p className="mb-1 font-semibold">Bilgi</p>
              <p>Kayıt olduktan sonra hesabınız otomatik olarak aktif olacak ve dashboard'unuza yönlendirileceksiniz.</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              Zaten hesabınız var mı?{' '}
              <Link href="/auth/login" className="font-semibold text-blue-600 hover:text-blue-700">
                Giriş yapın
              </Link>
            </p>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gradient-to-b from-gray-50 to-white text-gray-500">Veya Devam Et</span>
            </div>
          </div>

          {/* Google Sign Up Button */}
          <button
            type="button"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50"
          >
            <span className="flex items-center justify-center gap-3">
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Google ile Kayıt Ol</span>
            </span>
          </button>
        </div>
      </div>

      {/* Right: marketing */}
      <div className="hidden lg:flex lg:items-center">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="text-sm font-semibold text-gray-900">Kayıt sonrası akış</div>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Kayıt olduktan sonra aday paneline yönlendirilirsin. Belgelerini yükleyip başvurunu değerlendirmeye gönderebilirsin.
          </p>

          <div className="mt-6 space-y-3">
            {[
              'Profil bilgilerini tamamla',
              'Belgelerini yükle (CV, Kimlik, vb.)',
              'Danışman değerlendirme sürecini başlat',
              'Fırsatları takvimde takip et',
            ].map((t) => (
              <div key={t} className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4">
                <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <div className="text-sm font-medium text-gray-800">{t}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl bg-gradient-to-br from-gray-900 to-black p-6 text-white">
            <div className="text-sm font-semibold">Not</div>
            <div className="mt-1 text-sm text-white/90">
              Şifren güvenliğin için en az 6 karakter olmalı.
            </div>
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}
