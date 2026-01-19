'use client';

import Link from 'next/link';
import Footer from '@/components/footer';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Modern Header */}
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
              <a href="#why-joblin" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                Neden Joblin.net?
              </a>
              <a href="#how-it-works" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                Nasıl Çalışır?
              </a>
              <Link href="/about" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
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

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 pt-24 pb-32">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl -ml-48 -mb-48"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Sol Taraf - Metin ve Butonlar */}
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl text-gray-900 mb-6 leading-tight">
                <span className="font-light">Sen İşi Değil,</span><br />
                <span className="font-bold">İş Seni Bulsun</span>
              </h1>
              <p className="text-xl sm:text-2xl text-gray-600 mb-10 leading-relaxed">
                Dakikalar içinde üye ol,<br />
                sana en uygun fırsatları kaçırma.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/auth/register"
                  className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 text-center"
                >
                  Fırsatları Yakala
                </Link>
                <Link
                  href="/auth/register?type=employer"
                  className="px-8 py-4 text-lg font-semibold text-gray-900 bg-white border-2 border-gray-300 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all transform hover:-translate-y-1 text-center"
                >
                  Fırsat Oluştur
                </Link>
              </div>
            </div>

            {/* Sağ Taraf - Görsel Alan */}
            <div className="relative">
              <div className="relative bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl p-8 shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-200/30 rounded-full blur-3xl -ml-32 -mb-32"></div>
                
                {/* Görsel */}
                <div className="relative z-10 bg-white rounded-2xl p-4 overflow-hidden">
                  <img
                    src="https://yzqzgpnzwiwkoimfjzmu.supabase.co/storage/v1/object/public/program_documents/Joblin-sigortali.png"
                    alt="Joblin"
                    className="w-full h-auto rounded-xl object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section id="why-joblin" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Neden Joblin?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Hızlı */}
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 hover:shadow-xl transition-all">
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Hızlı</h3>
              <p className="text-gray-600 leading-relaxed">
                Dakikalar içinde ilanları görüntüle,<br />
                tek tıkla başvur.
              </p>
            </div>

            {/* Doğru Eşleşme */}
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200 hover:shadow-xl transition-all">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Doğru Eşleşme</h3>
              <p className="text-gray-600 leading-relaxed">
                Filtrelenmiş ilanlar sayesinde<br />
                sana uygun işler önüne gelsin.
              </p>
            </div>

            {/* Güvenli */}
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200 hover:shadow-xl transition-all">
              <div className="text-5xl mb-4">🔒</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Güvenli</h3>
              <p className="text-gray-600 leading-relaxed">
                Onaylı firmalar, gerçek ilanlar,<br />
                şeffaf başvuru süreci.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Nasıl Çalışır?
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* İş Arayanlar İçin */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="text-center mb-8">
                <div className="text-5xl mb-4">👤</div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">İş Arayanlar İçin</h3>
              </div>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Ücretsiz kayıt ol</h4>
                    <p className="text-gray-600 text-sm">Hemen başla, hiçbir ücret yok</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Profilini oluştur</h4>
                    <p className="text-gray-600 text-sm">Bilgilerini ekle, belgelerini yükle</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">İşlere anında başvur</h4>
                    <p className="text-gray-600 text-sm">Tek tıkla başvuru yap, hızlı başvur</p>
                  </div>
                </div>
              </div>
            </div>

            {/* İşverenler İçin */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="text-center mb-8">
                <div className="text-5xl mb-4">🏢</div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">İşverenler İçin</h3>
              </div>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">İlanını oluştur</h4>
                    <p className="text-gray-600 text-sm">İlanını hemen yayınla</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Doğru adaylara ulaş</h4>
                    <p className="text-gray-600 text-sm">İlana göz at, filtrele</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Hızla işe al</h4>
                    <p className="text-gray-600 text-sm">Başvuruları değerlendir, başvurunu takip et</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-gray-600 text-lg mb-8">Binlerce ilan, tek platform.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 hover:shadow-lg transition-all cursor-pointer">
              <div className="text-4xl mb-3">💼</div>
              <h3 className="font-semibold text-gray-900">Ofis & Kurumsal</h3>
            </div>
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200 hover:shadow-lg transition-all cursor-pointer">
              <div className="text-4xl mb-3">🏗️</div>
              <h3 className="font-semibold text-gray-900">İnşaat & Teknik</h3>
            </div>
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200 hover:shadow-lg transition-all cursor-pointer">
              <div className="text-4xl mb-3">🛒</div>
              <h3 className="font-semibold text-gray-900">Perakende</h3>
            </div>
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200 hover:shadow-lg transition-all cursor-pointer">
              <div className="text-4xl mb-3">🍽️</div>
              <h3 className="font-semibold text-gray-900">Hizmet & Restoran</h3>
            </div>
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 hover:shadow-lg transition-all cursor-pointer">
              <div className="text-4xl mb-3">🚚</div>
              <h3 className="font-semibold text-gray-900">Lojistik</h3>
            </div>
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200 hover:shadow-lg transition-all cursor-pointer">
              <div className="text-4xl mb-3">💻</div>
              <h3 className="font-semibold text-gray-900">IT & Dijital</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Social Proof Section */}
      <section id="benefits" className="py-24 bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Binlerce kişi Joblin ile işini buldu
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Gerçek firmalar</h3>
              <p className="text-gray-600">Onaylı ve güvenilir işverenler</p>
            </div>
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Güncel ilanlar</h3>
              <p className="text-gray-600">Her gün yeni fırsatlar</p>
            </div>
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Spam'siz başvuru sistemi</h3>
              <p className="text-gray-600">Sadece gerçek iş fırsatları</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-12 md:p-16 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                İş Bulma Yolculuğunuza Bugün Başlayın
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Binlerce iş arayanımıza katılın ve hayalinizdeki işe bir adım daha yaklaşın.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/auth/register"
                  className="px-8 py-4 text-lg font-semibold text-blue-600 bg-white rounded-xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  Ücretsiz kayıt ol
                </Link>
                <Link
                  href="/auth/login"
                  className="px-8 py-4 text-lg font-semibold text-white border-2 border-white/30 rounded-xl hover:bg-white/10 transition-all duration-300"
                >
                  Giriş Yap
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
