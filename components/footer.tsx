'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-300 border-t border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Logo ve Açıklama */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <img
                src="https://i.hizliresim.com/nvytmdi.png"
                alt="Joblin Logo"
                className="h-8 w-auto brightness-0 invert"
                loading="lazy"
              />
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-md mb-6">
              İş arayanlarla işverenleri hızlı, sade ve güvenilir bir şekilde buluşturuyoruz.
            </p>
            <div className="text-lg font-semibold text-white">
              Joblin – İş bulmanın en kısa yolu.
            </div>
          </div>

          {/* Hızlı Linkler */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6">Hızlı Linkler</h4>
            <ul className="space-y-3">
              <li>
                <a href="#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Nasıl Çalışır?
                </a>
              </li>
              <li>
                <Link href="/about" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Giriş Yap
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Kayıt Ol
                </Link>
              </li>
            </ul>
          </div>

          {/* İletişim */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6">İletişim</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-gray-400 group">
                <svg className="w-5 h-5 mt-0.5 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="group-hover:text-white transition-colors">info@joblin.com</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-400 group">
                <svg className="w-5 h-5 mt-0.5 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="group-hover:text-white transition-colors">+90 (212) 123 45 67</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-400 group">
                <svg className="w-5 h-5 mt-0.5 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="group-hover:text-white transition-colors">İstanbul, Türkiye</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Alt Kısım */}
        <div className="mt-16 pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <div className="text-sm text-gray-400">
                © 2024 Joblin. Tüm hakları saklıdır.
              </div>
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                Gizlilik Politikası
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                Kullanım Şartları
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
