/**
 * Next.js Proxy - Rol Bazlı Yönlendirme ve Yetkilendirme
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from './lib/supabase/middleware';
import { hasAccess, getDefaultRoute, getUserRole } from './lib/auth/roles';

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public route'lar (herkes erişebilir)
  const isPublicRoute =
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/test-db');

  // Ana sayfa herkese açık (giriş yapmış kullanıcılar da görebilir)
  if (pathname === '/') {
    return NextResponse.next();
  }

  // Public route ise kontrol yapmadan devam et
  if (isPublicRoute) {
    return NextResponse.next();
  }

  try {
    // Proxy client'ı oluştur
    const { supabase, response } = createClient(request);

    // Cookie'leri kontrol et (debug için)
    const cookies = request.cookies.getAll();
    const hasAuthCookie = cookies.some(c => c.name.includes('supabase') || c.name.includes('auth'));
    
    // Kullanıcının giriş yapıp yapmadığını kontrol et
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // Debug log
    if (pathname.startsWith('/dashboard')) {
      console.log('🔍 Proxy Debug:', {
        pathname,
        hasAuthCookie,
        hasUser: !!user,
        userError: userError?.message,
        userId: user?.id,
        userEmail: user?.email,
      });
    }

    // Giriş yapmamışsa login sayfasına yönlendir
    if (!user || userError) {
      console.log('❌ Proxy: Kullanıcı bulunamadı, login\'e yönlendiriliyor', {
        pathname,
        error: userError?.message,
        hasAuthCookie,
      });
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/auth/login';
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // ÖNCE metadata'dan rolü kontrol et (çok daha hızlı)
    let role = (user.user_metadata?.role || user.app_metadata?.role) as any;
    
    console.log('🔍 Proxy: Rol kontrolü', {
      pathname,
      userId: user.id,
      userMetadataRole: user.user_metadata?.role,
      appMetadataRole: user.app_metadata?.role,
      foundRole: role,
    });
    
    // Metadata'da yoksa veritabanından al (sadece gerektiğinde)
    if (!role) {
      console.log('⚠️ Proxy: Metadata\'da rol yok, veritabanından alınıyor...');
      role = await getUserRole(supabase);
      console.log('🔍 Proxy: Veritabanından alınan rol:', role);
    }

    // Hala rol yoksa ve dashboard'a gitmeye çalışıyorsa, login'e yönlendir
    if (!role && pathname.startsWith('/dashboard')) {
      console.error('❌ Proxy: Rol bulunamadı, login\'e yönlendiriliyor', {
        pathname,
        userId: user.id,
        userEmail: user.email,
      });
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/auth/login';
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Rol varsa, erişim kontrolü yap
    if (role) {
      // Kullanıcının bu sayfaya erişim yetkisi var mı kontrol et
      if (!hasAccess(role, pathname)) {
        // Yetkisiz erişim denemelerinde kullanıcıyı kendi dashboard'una gönder
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = getDefaultRoute(role);
        return NextResponse.redirect(redirectUrl);
      }

      // Header'lara rol ve kullanıcı ID'si ekle
      response.headers.set('x-user-role', role);
      response.headers.set('x-user-id', user.id);
    }

    return response;
  } catch (error) {
    // Hata durumunda login sayfasına yönlendir
    // Detaylı hata log'u
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('❌❌❌ PROXY ERROR ❌❌❌');
    console.error('Path:', pathname);
    console.error('Error Message:', errorMessage);
    console.error('Error Stack:', errorStack);
    console.error('Full Error:', error);
    console.error('❌❌❌ END PROXY ERROR ❌❌❌');
    
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/auth/login';
    redirectUrl.searchParams.set('error', 'proxy_error');
    redirectUrl.searchParams.set('path', pathname);
    return NextResponse.redirect(redirectUrl);
  }
}

// Proxy'nin hangi route'larda çalışacağını belirle
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
