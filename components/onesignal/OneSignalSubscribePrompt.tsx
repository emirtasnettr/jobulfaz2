'use client';

import { useEffect, useMemo, useState } from 'react';

declare global {
  interface Window {
    OneSignalDeferred?: any[];
  }
}

function safeLocalStorageGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export function OneSignalSubscribePrompt() {
  const storageKey = useMemo(() => 'jobulai_onesignal_prompt_dismissed', []);
  const [hidden, setHidden] = useState(true);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    // Daha önce kapatıldıysa hiç gösterme
    if (typeof window === 'undefined') return;
    const dismissed = safeLocalStorageGet(storageKey);
    if (dismissed === '1') return;

    // Sayfa yüklendikten kısa süre sonra göster
    const t = window.setTimeout(() => setHidden(false), 1200);
    return () => window.clearTimeout(t);
  }, [storageKey]);

  const handleDismiss = () => {
    safeLocalStorageSet(storageKey, '1');
    setHidden(true);
  };

  const handleEnable = () => {
    setWorking(true);
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      try {
        // OneSignal v16: soft prompt (slidedown) ile izin iste
        if (OneSignal?.Slidedown?.promptPush) {
          await OneSignal.Slidedown.promptPush({ force: true });
        } else if (OneSignal?.Notifications?.requestPermission) {
          await OneSignal.Notifications.requestPermission();
        }
        // Prompt gösterildikten sonra banner'ı kapat
        safeLocalStorageSet(storageKey, '1');
        setHidden(true);
      } finally {
        setWorking(false);
      }
    });
  };

  if (hidden) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2">
      <div className="rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M15 17H9a4 4 0 0 1-4-4V9a7 7 0 1 1 14 0v4a4 4 0 0 1-4 4Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M9 17v1a3 3 0 0 0 6 0v-1"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="flex-1">
            <div className="text-sm font-extrabold text-gray-900">Bildirimleri aç</div>
            <div className="mt-1 text-sm text-gray-600">
              Atama ve güncellemelerden anında haberdar olmak için tarayıcı bildirimlerini etkinleştirin.
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={handleDismiss}
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                disabled={working}
              >
                Sonra
              </button>
              <button
                type="button"
                onClick={handleEnable}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60"
                disabled={working}
              >
                {working ? 'Açılıyor…' : 'Bildirimleri Aç'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

