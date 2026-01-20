'use client';

import Script from 'next/script';

const APP_ID =
  process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID ||
  '794d4da0-beb2-4592-b346-2d3c8396faa0';

const SAFARI_WEB_ID =
  process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID ||
  'web.onesignal.auto.4132c962-fb08-4b74-acbc-06682d034170';

export function OneSignalScripts() {
  return (
    <>
      <Script
        src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
        strategy="afterInteractive"
      />
      <Script id="onesignal-init" strategy="afterInteractive">
        {`
          window.OneSignalDeferred = window.OneSignalDeferred || [];
          OneSignalDeferred.push(async function(OneSignal) {
            // OneSignal app'ı domain'e bağlıdır. Yanlış origin'de init edilirse:
            // "Can only be used on: https://jobulai.com.tr" hatası alınır.
            // Bu yüzden sadece prod domain'de (ve local geliştirmede) init ediyoruz.
            var host = window.location.hostname;
            var origin = window.location.origin;
            var isLocal = host === 'localhost' || host === '127.0.0.1';
            var isProd = origin === 'https://jobulai.com.tr';

            if (!isProd && !isLocal) {
              return;
            }

            await OneSignal.init({
              appId: ${JSON.stringify(APP_ID)},
              safari_web_id: ${JSON.stringify(SAFARI_WEB_ID)},
              notifyButton: { enable: true },
              // Service worker dosyalarını ve scope'u açıkça belirtelim (özellikle prod'da path/scope uyuşmazlığına karşı)
              serviceWorkerPath: '/OneSignalSDKWorker.js',
              serviceWorkerUpdaterPath: '/OneSignalSDKUpdaterWorker.js',
              serviceWorkerParam: { scope: '/' },
              // Local ortamda (localhost) Web Push test edebilmek için
              allowLocalhostAsSecureOrigin: isLocal,
              // Custom Code kullandığınız için prompt'u otomatik tetiklemiyoruz.
              // Kullanıcı aksiyonu ile prompt etmek için OneSignalSubscribePrompt bileşenini kullanıyoruz.
            });
          });
        `}
      </Script>
    </>
  );
}

