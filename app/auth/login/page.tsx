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
      
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Bir hata oluştu');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Column - Login Form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Logo and Welcome */}
          <div className="mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mb-6">
              <span className="text-2xl font-bold text-white">J</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Jobul<span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">AI</span>'a Hoş Geldiniz
            </h1>
            <p className="text-gray-600">
              Güvenli admin dashboard'unuza erişmek için giriş yapın
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white"
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
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white"
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
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-700">Beni Hatırla</span>
              </label>
              <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Şifremi Unuttum?
              </Link>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Hesabınız yok mu?{' '}
              <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 font-medium">
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
              <span className="px-2 bg-white text-gray-500">Veya Devam Et</span>
            </div>
          </div>

          {/* Google Login Button */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-gray-700 font-medium">Google ile Giriş Yap</span>
          </button>
        </div>
      </div>

      {/* Right Column - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-50 to-gray-100 items-center justify-center p-12">
        <div className="max-w-lg">
          {/* Illustration Placeholder */}
          <div className="mb-8 relative">
            <div className="relative w-full h-96 bg-white/50 rounded-3xl p-8 flex items-center justify-center">
              {/* Business Person Illustration */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
                <div className="w-32 h-40 bg-gradient-to-br from-gray-800 to-gray-900 rounded-t-3xl relative">
                  {/* Head */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-gray-300 rounded-full"></div>
                  {/* Floating Cards */}
                  <div className="absolute -right-8 top-8 w-20 h-20 bg-white rounded-xl shadow-lg flex items-center justify-center">
                    <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="absolute -left-8 top-16 w-20 h-20 bg-white rounded-xl shadow-lg flex items-center justify-center">
                    <div className="flex gap-1">
                      <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              {/* Chart Background */}
              <div className="absolute top-8 right-8 w-32 h-40 bg-white rounded-xl shadow-lg p-4">
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full"></div>
                  <div className="w-full h-1 bg-gray-200 rounded"></div>
                  <div className="w-full h-1 bg-gray-200 rounded"></div>
                  <div className="w-full h-1 bg-gray-200 rounded"></div>
                </div>
              </div>
              {/* Decorative Elements */}
              <div className="absolute top-4 left-4 w-12 h-12 bg-purple-200/30 rounded-full blur-xl"></div>
              <div className="absolute bottom-4 right-4 w-16 h-16 bg-indigo-200/30 rounded-full blur-xl"></div>
            </div>
          </div>

          {/* Marketing Text */}
          <div className="text-center lg:text-left">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Tekrar Hoş Geldiniz!
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              JobulAI'ye hoş geldiniz, akıllı iş yönetimi için kapsamlı çözümünüz. 
              İş akışlarınızı optimize edin, verimliliği artırın ve işinizi güvenle büyütün.
            </p>
          </div>
        </div>
      </div>

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
