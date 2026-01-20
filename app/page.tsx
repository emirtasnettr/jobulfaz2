import Link from 'next/link';
import Footer from '@/components/footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
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
            <Link href="/features" className="text-sm font-medium text-gray-600 hover:text-gray-900">
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

          {/* Mobile menu (no JS) */}
          <details className="relative md:hidden">
            <summary className="list-none rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Menü
            </summary>
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
              <Link href="/features" className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
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

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/2 h-72 w-[44rem] -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 h-72 w-[44rem] -translate-x-1/2 rounded-full bg-indigo-200/25 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              İlan → Onay → Atama → Takvim: tek akış
            </div>

            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
              İş ilanı yönetimini
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                profesyonel ve hızlı
              </span>
              hale getirin.
            </h1>

            <p className="mt-4 max-w-xl text-lg leading-relaxed text-gray-600">
              JobulAI; müşteri, danışman ve aday akışlarını aynı platformda toplar. Tarih/saat bazlı çalışma planı,
              maliyet özeti ve aday takvimi ile süreçler net, izlenebilir ve düzenli olur.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:from-blue-700 hover:to-indigo-700"
              >
                Ücretsiz Hesap Oluştur
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              >
                Giriş Yap
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-6">
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="text-sm font-semibold text-gray-900">Dakikalar içinde</div>
                <div className="mt-1 text-xs text-gray-500">İlan oluştur & yayınla</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="text-sm font-semibold text-gray-900">Şeffaf maliyet</div>
                <div className="mt-1 text-xs text-gray-500">KDV & hizmet bedeli</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="text-sm font-semibold text-gray-900">Takvim görünümü</div>
                <div className="mt-1 text-xs text-gray-500">Saatlik haftalık plan</div>
              </div>
            </div>
          </div>

          {/* Product mock */}
          <div className="relative">
            <div className="rounded-3xl border border-gray-200 bg-white shadow-xl">
              <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                <div className="ml-3 text-xs font-semibold text-gray-600">JobulAI Dashboard (Önizleme)</div>
              </div>
              <div className="p-4 sm:p-5">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                  <div className="space-y-3 lg:col-span-8">
                    <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">İlan Bilgileri</div>
                          <div className="mt-1 text-xs text-gray-600">İl/İlçe • Tarih • Saat • Kişi sayısı</div>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm">
                          CURRENT
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        <div className="rounded-xl bg-white p-3">
                          <div className="text-[11px] text-gray-500">Çalışma</div>
                          <div className="text-sm font-semibold text-gray-900">09:00–17:00</div>
                        </div>
                        <div className="rounded-xl bg-white p-3">
                          <div className="text-[11px] text-gray-500">Toplam</div>
                          <div className="text-sm font-semibold text-gray-900">16 saat</div>
                        </div>
                        <div className="rounded-xl bg-white p-3">
                          <div className="text-[11px] text-gray-500">Kişi</div>
                          <div className="text-sm font-semibold text-gray-900">2</div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-gray-900">Adaylar</div>
                        <div className="text-xs text-gray-500">Kabul edenler listesi</div>
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                          <div className="text-sm font-semibold text-gray-800">Aday • Ad Soyad</div>
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                            ACCEPTED
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                          <div className="text-sm font-semibold text-gray-800">Aday • Ad Soyad</div>
                          <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-700">
                            PENDING
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-4">
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 lg:sticky lg:top-24">
                      <div className="text-sm font-semibold text-gray-900">Maliyet Özeti</div>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">KDV Hariç</span>
                          <span className="font-semibold text-gray-900">₺ 12.000</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Hizmet Bedeli</span>
                          <span className="font-semibold text-gray-900">₺ 1.440</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">KDV</span>
                          <span className="font-semibold text-gray-900">₺ 2.688</span>
                        </div>
                        <div className="my-2 h-px bg-gray-100" />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-900 font-semibold">Toplam</span>
                          <span className="font-extrabold text-gray-900">₺ 16.128</span>
                        </div>
                        <Link
                          href="/auth/login"
                          className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-black"
                        >
                          Panele Git
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-3xl bg-gradient-to-br from-blue-600/20 to-indigo-600/20 blur-xl" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Daha hızlı süreç, daha net bilgi.
            </h2>
            <p className="mt-3 text-lg text-gray-600">
              İlan oluşturma, onay, aday atama ve aday takvimi gibi kritik adımları sade bir arayüzle yönetin.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Tarih/Saat Bazlı Plan',
                desc: 'Part-time işler için gün gün çalışma saatlerini tanımlayın.',
                icon: (
                  <path
                    d="M8 7V3m8 4V3M5 11h14M7 21h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ),
              },
              {
                title: 'Maliyet Özeti',
                desc: 'KDV, hizmet bedeli ve toplam maliyeti otomatik hesaplayın.',
                icon: (
                  <path
                    d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7H14.5a3.5 3.5 0 0 1 0 7H7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ),
              },
              {
                title: 'Rol Bazlı Akış',
                desc: 'Müşteri, danışman ve aday ekranları birbirini tamamlar.',
                icon: (
                  <path
                    d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M19 11a4 4 0 0 0 0-8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ),
              },
              {
                title: 'Aday Takvimi',
                desc: 'Adaylar işlerini haftalık saatlik takvimde görür.',
                icon: (
                  <path
                    d="M12 8v5l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ),
              },
              {
                title: 'Atama & Onay',
                desc: 'Danışman aday atar, aday kabul/red verir; müşteri bilgilenir.',
                icon: (
                  <path
                    d="M20 6 9 17l-5-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ),
              },
              {
                title: 'Güvenli Oturum',
                desc: 'Supabase Auth ile güvenli giriş ve rol kontrolü.',
                icon: (
                  <path
                    d="M12 1 3 5v6c0 5 3 9 9 12 6-3 9-7 9-12V5l-9-4Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ),
              },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md">
                <div className="flex items-start gap-4">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      {f.icon}
                    </svg>
                  </div>
                  <div>
                    <div className="text-base font-bold text-gray-900">{f.title}</div>
                    <div className="mt-1 text-sm leading-relaxed text-gray-600">{f.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-gradient-to-b from-white to-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">Nasıl çalışır?</h2>
            <p className="mt-3 text-lg text-gray-600">
              Akış basit: müşteri ilan açar, danışman süreci yönetir, aday kabul/red verir; her şey panelde görünür.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {[
              {
                title: 'Müşteri',
                steps: ['İlanı oluştur', 'Bütçe & çalışma saatlerini gir', 'Onay/aktif fırsatları takip et'],
              },
              {
                title: 'Danışman',
                steps: ['İlanı kontrol et', 'Uygun adayları ata', 'Onayla / süreç mesajlarını yönet'],
              },
              {
                title: 'Aday',
                steps: ['Fırsatı incele', 'Kabul veya gerekçeli red ver', 'Takvimde vardiyalarını gör'],
              },
            ].map((c) => (
              <div key={c.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="text-lg font-extrabold text-gray-900">{c.title}</div>
                <ol className="mt-4 space-y-3">
                  {c.steps.map((s, idx) => (
                    <li key={s} className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-xs font-extrabold text-white">
                        {idx + 1}
                      </span>
                      <span className="text-sm text-gray-700">{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles CTA */}
      <section id="roles" className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">Hemen başlayın</h2>
              <p className="mt-3 text-lg text-gray-600">
                İster ilan oluşturun, ister fırsatları takip edin — birkaç dakikada başlayın.
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/auth/login" className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50">
                Giriş Yap
              </Link>
              <Link href="/auth/register" className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-black">
                Kayıt Ol
              </Link>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              {
                title: 'Müşteri Paneli',
                desc: 'İlanınızı hızlıca oluşturun, maliyetleri net görün ve kabul eden adayların iletişim bilgilerine erişin.',
                bullets: ['İlan oluşturma', 'Maliyet özeti (KDV + hizmet bedeli)', 'Kabul eden aday listesi'],
              },
              {
                title: 'Aday Paneli',
                desc: 'Gelen fırsatları inceleyin, kabul/red verin ve çalışma saatlerinizi haftalık takvimde takip edin.',
                bullets: ['Fırsat kabul / red (gerekçeli)', 'Gün-gün çalışma saatleri', 'Takvim görünümü'],
              },
            ].map((r) => (
              <div key={r.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md">
                <div className="text-base font-extrabold text-gray-900">{r.title}</div>
                <div className="mt-2 text-sm leading-relaxed text-gray-600">{r.desc}</div>
                <ul className="mt-4 space-y-2">
                  {r.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4">
                  <Link href="/auth/login" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                    Panele git →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
