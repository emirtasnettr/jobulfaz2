/**
 * Login Sayfası
 * 
 * Kullanıcıların giriş yapabileceği sayfa
 */

'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard/candidate';
  const errorParam = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam === 'proxy_error' 
      ? 'Proxy hatası oluştu. Lütfen terminal log\'larını kontrol edin veya sayfayı yenileyin.' 
      : null
  );
  const [loading, setLoading] = useState(false);
  const [showInactiveModal, setShowInactiveModal] = useState(false);

  // URL'deki hata parametresini log'la
  useEffect(() => {
    if (errorParam) {
      console.error('🔴 Login sayfasına hata ile yönlendirildi:', {
        error: errorParam,
        redirect: searchParams.get('path'),
      });
    }
  }, [errorParam, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();

      // Giriş yap
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message || 'Giriş yapılamadı');
        setLoading(false);
        return;
      }

      if (!data.user || !data.session) {
        setError('Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.');
        setLoading(false);
        return;
      }

      // Metadata'dan rolü al
      let role = data.user.user_metadata?.role || data.user.app_metadata?.role;
      
      console.log('🔍 Login sonrası kontrol:', {
        userId: data.user.id,
        email: data.user.email,
        roleFromMetadata: role,
        userMetadata: data.user.user_metadata,
        appMetadata: data.user.app_metadata,
        hasSession: !!data.session,
        sessionToken: data.session?.access_token?.substring(0, 20) + '...',
      });

      // Kullanıcının aktif olup olmadığını kontrol et
      let isActive = true;
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, is_active')
          .eq('id', data.user.id)
          .single();

        if (!profileError && profile) {
          isActive = profile.is_active !== false; // undefined veya true ise aktif
          if (!role) {
            role = profile.role;
            console.log('✅ Veritabanından rol alındı:', role);
          }
        } else {
          console.warn('⚠️ Profil bulunamadı veya hata:', profileError);
        }
      } catch (err) {
        console.error('❌ Profil sorgusu hatası:', err);
      }

      // Eğer kullanıcı pasifse, modal göster ve çıkış yap
      if (!isActive) {
        setLoading(false);
        setShowInactiveModal(true);
        
        // 15 saniye sonra ana sayfaya yönlendir
        setTimeout(async () => {
          await supabase.auth.signOut();
          router.push('/');
          router.refresh();
        }, 15000);
        
        return;
      }

      // Eğer metadata'da rol yoksa ve henüz alınmadıysa, veritabanından al
      if (!role) {
        console.log('⚠️ Metadata\'da rol yok, veritabanından alınıyor...');
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

          if (!profileError && profile) {
            role = profile.role;
            console.log('✅ Veritabanından rol alındı:', role);
          } else {
            console.warn('⚠️ Profil bulunamadı veya hata:', profileError);
          }
        } catch (err) {
          console.error('❌ Profil sorgusu hatası:', err);
        }
      }

      // Rolüne göre yönlendir
      let redirectPath = '/dashboard/candidate'; // Varsayılan
      
      if (role === 'ADMIN') {
        redirectPath = '/dashboard/admin';
      } else if (role === 'CONSULTANT') {
        redirectPath = '/dashboard/consultant';
      } else if (role === 'MIDDLEMAN') {
        redirectPath = '/dashboard/middleman';
      } else if (role === 'CANDIDATE') {
        redirectPath = '/dashboard/candidate';
      } else {
        // Rol bulunamadıysa, varsayılan olarak candidate dashboard'a git
        // Proxy zaten kontrol edecek ve gerekirse login'e yönlendirecek
        console.warn('⚠️ Rol bulunamadı, varsayılan dashboard\'a yönlendiriliyor. Rol:', role);
        redirectPath = '/dashboard/candidate';
      }

      console.log('🚀 Yönlendirme:', {
        role,
        redirectPath,
      });

      // Session'ın kaydedilmesi için kısa bir bekleme
      // createBrowserClient otomatik olarak cookie'leri set eder
      await new Promise(resolve => setTimeout(resolve, 100));

      // Session'ı tekrar kontrol et (cookie'lerin set edildiğinden emin olmak için)
      const { data: { session: verifySession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Session kontrol hatası:', sessionError);
      }
      
      if (!verifySession) {
        console.warn('⚠️ Session henüz set edilmemiş, yine de yönlendiriliyor...');
      } else {
        console.log('✅ Session doğrulandı');
      }

      // Loading'i kapat
      setLoading(false);

      // Hard redirect - en güvenilir yöntem
      // Cookie'ler zaten set edilmiş olmalı (createBrowserClient otomatik yapar)
      window.location.href = redirectPath;
      
    } catch (err) {
      console.error('Login error:', err);
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
              href="/auth/register"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Kayıt Ol
            </Link>
            <Link
              href="/auth/login"
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
            >
              Giriş Yap
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
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                Güvenli giriş
              </div>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900">
                Hesabına giriş yap
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Devam etmek için e-posta ve şifreni gir.
              </p>
            </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-posta Adresi
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                placeholder="info@example.com"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Şifre
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-12 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                  placeholder="••••••••"
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
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700">Beni Hatırla</span>
              </label>
              <Link href="/auth/forgot-password" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                Şifremi Unuttum?
              </Link>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              Hesabınız yok mu?{' '}
              <Link href="/auth/register" className="font-semibold text-blue-600 hover:text-blue-700">
                Buradan kayıt olun
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

          {/* Google Login Button */}
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
            <span>Google ile Giriş Yap</span>
            </span>
          </button>
        </div>
        </div>
        {/* Right: marketing */}
        <div className="hidden lg:flex lg:items-center">
          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="text-sm font-semibold text-gray-900">Neler kazanırsın?</div>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Tüm roller aynı platformda: ilan, onay, atama ve takvim akışı tek yerde.
            </p>

            <div className="mt-6 space-y-3">
              {[
                'Tarih/saat bazlı çalışma planı (part-time)',
                'KDV ve hizmet bedeli dahil maliyet özeti',
                'Aday kabul/red ve takvim görünümü',
                'Rol bazlı güvenli erişim',
              ].map((t) => (
                <div key={t} className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <div className="text-sm font-medium text-gray-800">{t}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-6 text-white">
              <div className="text-sm font-semibold">Hızlı ipucu</div>
              <div className="mt-1 text-sm text-white/90">
                Giriş yaptıktan sonra rolüne göre paneline otomatik yönlendirilirsin.
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Inactive Account Modal */}
      {showInactiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-gray-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Hesabınız Pasif Hale Getirilmiştir
              </h2>
              <p className="text-gray-600 mb-2 leading-relaxed">
                Hesabınız pasif duruma getirilmiştir. Bu konuyla ilgili sorularınız için{' '}
                <a href="mailto:destek@jobulai.com.tr" className="text-blue-600 hover:text-blue-700 font-medium">
                  destek@jobulai.com.tr
                </a>
                {' '}adresine e-posta gönderebilirsiniz.
              </p>
              <p className="text-sm text-gray-500 mt-4">
                Ana sayfaya yönlendiriliyorsunuz...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
