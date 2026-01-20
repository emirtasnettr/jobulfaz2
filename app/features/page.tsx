import Link from 'next/link';
import Footer from '@/components/footer';

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="group inline-flex items-center gap-2">
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
            <span className="text-sm font-semibold tracking-tight">
              JobulAI
              <span className="ml-1 text-xs font-medium text-gray-400 group-hover:text-gray-500">Platform</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link href="/features" className="text-sm font-medium text-gray-900">
              Özellikler
            </Link>
            <Link href="/how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Nasıl Çalışır?
            </Link>
            <Link href="/why-jobulai" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Neden JobulAI
            </Link>
            <Link href="/about" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Hakkımızda
            </Link>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link href="/auth/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Giriş Yap
            </Link>
            <Link
              href="/auth/register"
              className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-blue-700 hover:to-indigo-700"
            >
              Ücretsiz Başla
            </Link>
          </div>

          <details className="relative md:hidden">
            <summary className="list-none rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Menü
            </summary>
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
              <Link href="/features" className="block rounded-lg px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50">
                Özellikler
              </Link>
              <Link href="/how-it-works" className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Nasıl Çalışır?
              </Link>
              <Link href="/why-jobulai" className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Neden JobulAI
              </Link>
              <Link href="/about" className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Hakkımızda
              </Link>
              <div className="my-2 h-px bg-gray-100" />
              <Link href="/auth/login" className="block rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Giriş Yap
              </Link>
              <Link
                href="/auth/register"
                className="mt-1 block rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm"
              >
                Ücretsiz Başla
              </Link>
            </div>
          </details>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 left-1/2 h-72 w-[44rem] -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl" />
            <div className="absolute -bottom-24 left-1/3 h-72 w-[44rem] -translate-x-1/2 rounded-full bg-indigo-200/25 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                Ürün özellikleri
              </div>
              <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                JobulAI ile
                <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  uçtan uca süreç yönetimi
                </span>
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-gray-600">
                İlan oluşturma, çalışma saatleri, maliyet özeti, atama ve takvim görünürlüğünü aynı panelde birleştiriyoruz.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {[
                {
                  title: 'İlan & detay yönetimi',
                  desc: 'İl/ilçe, kişi sayısı, iş tipi, tarih/saat ve açıklamalar tek formda.',
                },
                {
                  title: 'Çalışma saatleri (Part-time)',
                  desc: 'Gün gün başlangıç/bitiş saatlerini tanımlayın; toplam süre otomatik hesaplanır.',
                },
                {
                  title: 'Maliyet özeti',
                  desc: 'KDV, hizmet bedeli ve toplam maliyet şeffaf şekilde hesaplanır.',
                },
                {
                  title: 'Atama & aday yanıtı',
                  desc: 'Aday kabul/red verir; red gerekçesi zorunlu olabilir. Süreç kayıt altındadır.',
                },
                {
                  title: 'Takvim görünümü',
                  desc: 'Aday tarafında vardiyalar haftalık/saatlik görünür; çakışmalar kolay fark edilir.',
                },
                {
                  title: 'Rol bazlı erişim',
                  desc: 'Müşteri, aday ve danışman akışları birbirinden ayrıdır; doğru bilgi doğru kişiye gider.',
                },
              ].map((f) => (
                <div key={f.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md">
                  <div className="text-base font-extrabold text-gray-900">{f.title}</div>
                  <div className="mt-2 text-sm leading-relaxed text-gray-600">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-b from-white to-gray-50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm lg:p-10">
              <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
                <div>
                  <div className="text-sm font-semibold text-gray-900">Bir sonraki adım</div>
                  <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">Akışı görün</h2>
                  <p className="mt-3 text-sm leading-relaxed text-gray-600">
                    JobulAI’nin uçtan uca akışını adım adım görmek için “Nasıl Çalışır?” sayfasına göz atın.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Link
                    href="/how-it-works"
                    className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                  >
                    Nasıl Çalışır?
                  </Link>
                  <Link
                    href="/auth/register"
                    className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:from-blue-700 hover:to-indigo-700"
                  >
                    Ücretsiz Başla
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

