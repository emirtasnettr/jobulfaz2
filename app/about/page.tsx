'use client';

import Link from 'next/link';
import Footer from '@/components/footer';

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <img
                src="https://i.hizliresim.com/nvytmdi.png"
                alt="Joblin Logo"
                className="h-8 w-auto"
                loading="eager"
              />
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                Ana Sayfa
              </Link>
              <Link href="/about" className="text-sm font-medium text-blue-600 transition-colors">
                Hakkımızda
              </Link>
            </nav>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="hidden sm:block px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Giriş Yap
              </Link>
              <Link
                href="/auth/register"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                Ücretsiz Başla
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <section className="py-24 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                Hakkımızda
              </h1>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
              <div className="prose prose-lg max-w-none">
                <p className="text-xl text-gray-700 leading-relaxed mb-6">
                  Joblin, iş arayanlarla işverenleri hızlı, sade ve güvenilir bir şekilde buluşturmak için kuruldu.
                </p>
                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                  Amacımız; iş arama sürecini karmaşadan uzak, herkes için erişilebilir hale getirmek.
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  İster ilk işin, ister yeni bir başlangıç olsun — Joblin yanında.
                </p>
              </div>

              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Misyonumuz</h2>
                    <p className="text-gray-600 leading-relaxed">
                      İş bulma sürecini herkes için kolay, hızlı ve şeffaf hale getirmek.
                    </p>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Vizyonumuz</h2>
                    <p className="text-gray-600 leading-relaxed">
                      Türkiye'nin en güvenilir ve kullanıcı dostu iş bulma platformu olmak.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-12 text-center">
                <Link
                  href="/auth/register"
                  className="inline-block px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                >
                  Ücretsiz kayıt ol
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
