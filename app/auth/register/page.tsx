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
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Column - Register Form */}
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
              Yeni hesap oluşturun ve güvenli dashboard'unuza erişin
            </p>
            <p className="text-sm text-amber-600 mt-3 bg-amber-50 px-3 py-2 rounded-lg inline-block">
              ⚠️ Sadece aday kaydı yapılabilir
            </p>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white"
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
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white"
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
              <p className="text-xs text-gray-500 mt-1">Şifre en az 6 karakter olmalıdır</p>
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
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white"
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
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl text-sm">
              <p className="font-medium mb-1">ℹ️ Bilgi</p>
              <p>Kayıt olduktan sonra hesabınız otomatik olarak aktif olacak ve dashboard'unuza yönlendirileceksiniz.</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Zaten hesabınız var mı?{' '}
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
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
              <span className="px-2 bg-white text-gray-500">Veya Devam Et</span>
            </div>
          </div>

          {/* Google Sign Up Button */}
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
            <span className="text-gray-700 font-medium">Google ile Kayıt Ol</span>
          </button>
        </div>
      </div>

      {/* Right Column - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-50 to-gray-100 items-center justify-center p-12">
        <div className="max-w-lg w-full">
          {/* Image */}
          <div className="mb-8">
            <img 
              src="https://yzqzgpnzwiwkoimfjzmu.supabase.co/storage/v1/object/public/program_documents/Joblin-sigortali.png"
              alt="Joblin Sigortali"
              className="w-full h-auto rounded-3xl shadow-2xl object-contain"
            />
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
    </div>
  );
}
