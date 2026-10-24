'use client';

import React, { useEffect, useState } from 'react';
import { Download, Wifi, WifiOff, CheckCircle2, X } from 'lucide-react';
import type { AppLanguage } from '@/lib/ollama-bible-spec';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAOfflineStatusBarProps {
  lang: AppLanguage;
  onOpenRustSqlD3?: () => void;
}

export default function PWAOfflineStatusBar({
  lang,
  onOpenRustSqlD3,
}: PWAOfflineStatusBarProps) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [swReady, setSwReady] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    const ua = window.navigator.userAgent.toLowerCase();
    queueMicrotask(() => {
      setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
      setIsInstalled(isStandalone);
      setIsIOS(/iphone|ipad|ipod/.test(ua));
    });

    // Register & update Offline Service Worker (/sw.js · v2.4.0-stable)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          setSwReady(true);
          reg.update().catch(() => {
            // Ignore offline SW update check errors
          });
        })
        .catch(() => {
          setSwReady(true);
        });
    } else {
      queueMicrotask(() => setSwReady(true));
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
      return;
    }
    setShowInstallModal(true);
  };

  return (
    <>
      <div className="flex items-center gap-1.5">
        {/* Offline / Online WASM+SQL v2.4.0 Stable Status Pill */}
        <button
          type="button"
          onClick={onOpenRustSqlD3}
          data-testid="status-offline-badge"
          title={
            lang === 'da'
              ? 'o-Llama · AXIOM-7 v2.4.0 Stable LTS (Rust/WASM, SQL, D3 & Service Worker)'
              : 'o-Llama · AXIOM-7 v2.4.0 Stable LTS (Rust/WASM, SQL, D3 & Service Worker)'
          }
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
            isOnline
              ? 'bg-[#091426]/90 border-[#00E676]/50 text-[#00E676] hover:border-[#00E676]'
              : 'bg-[#2A1205]/95 border-[#FFD600] text-[#FFD600]'
          }`}
        >
          {isOnline ? (
            <Wifi className="w-3 h-3 text-[#00E676]" />
          ) : (
            <WifiOff className="w-3 h-3 text-[#FFD600] animate-pulse" />
          )}
          <span>
            {isOnline
              ? swReady
                ? lang === 'da'
                  ? 'v2.4.0 STABIL · WASM+SQL'
                  : 'v2.4.0 STABLE · WASM+SQL'
                : 'SYNCING SW v2.4.0'
              : lang === 'da'
              ? 'OFFLINE v2.4.0 · LOKAL SQL'
              : 'OFFLINE v2.4.0 · LOCAL SQL'}
          </span>
        </button>

        {/* In-App PWA Install Button */}
        {!isInstalled && (
          <button
            type="button"
            onClick={handleInstallClick}
            data-testid="btn-pwa-install"
            aria-label={lang === 'da' ? 'Installer Offline Spil (PWA)' : 'Install Offline Game (PWA)'}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider bg-[#121D38] hover:bg-[#1A294E] text-[#00F0FF] border border-[#00F0FF]/50 transition-colors cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">
              {lang === 'da' ? 'Installer App' : 'Install PWA'}
            </span>
          </button>
        )}
      </div>

      {/* Offline Banner Toast when network drops */}
      {!isOnline && (
        <div
          role="status"
          className="fixed bottom-16 left-4 z-50 flex items-center gap-2 rounded-lg bg-[#2A1805]/95 border border-[#FFD600] px-3.5 py-2 text-xs font-mono text-[#FFD600] shadow-xl pointer-events-auto"
        >
          <span className="h-2 w-2 rounded-full bg-[#FFD600] animate-pulse" />
          {lang === 'da'
            ? 'Offline tilstand aktiv — Rust/WASM kerne & lokal SQL database driver spillet 100% offline.'
            : 'Offline Mode Active — Rust/WASM kernel & local SQL database are powering the game 100% offline.'}
        </div>
      )}

      {/* Guided PWA Installation Modal (for iOS Safari & Desktop Browsers) */}
      {showInstallModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lang === 'da' ? 'Installer o-Llama AXIOM-7 Offline PWA' : 'Install o-Llama AXIOM-7 Offline PWA'}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 pointer-events-auto"
        >
          <div className="w-full max-w-md rounded-xl bg-[#0B1021] border-2 border-[#00F0FF] p-5 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#00E676]" />
                <h3 className="text-sm font-bold uppercase tracking-wider font-[family-name:var(--font-display)] text-[#00F0FF]">
                  {lang === 'da'
                    ? 'Installer o-Llama · AXIOM-7 (Offline PWA)'
                    : 'Install o-Llama · AXIOM-7 (Offline PWA)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                aria-label="Close PWA Install Guide"
                className="p-1 rounded bg-[#162038] hover:bg-[#1F2D4D] text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                {lang === 'da'
                  ? 'Spillet er fuldt offline-kompatibelt med Service Worker caching (/sw.js), WebAssembly Rust-kerne og lokal SQL-lagring.'
                  : 'The game is 100% offline-compatible with Service Worker caching (/sw.js), a compiled Rust/WASM kernel, and persistent local SQL tables.'}
              </p>
              {isIOS ? (
                <div className="p-3 rounded bg-[#070B16] border border-slate-800 font-mono text-[11px] space-y-1.5">
                  <div className="text-[#FFD600] font-bold">iOS Safari Installation:</div>
                  <div>1. Tryk på Del-knappen (Share) i Safari-værktøjslinjen.</div>
                  <div>2. Vælg &quot;Føj til hjemmeskærm&quot; (Add to Home Screen).</div>
                </div>
              ) : (
                <div className="p-3 rounded bg-[#070B16] border border-slate-800 font-mono text-[11px] space-y-1.5">
                  <div className="text-[#00F0FF] font-bold">
                    {lang === 'da' ? 'Desktop / Android Installation:' : 'Desktop / Android Installation:'}
                  </div>
                  <div>
                    {lang === 'da'
                      ? '1. Klik på Installations-ikonet i browserens adresselinje (Chrome / Edge), eller brug browsermenuen -> "Installer AXIOM-7".'
                      : '1. Click the Install icon in your browser address bar (Chrome / Edge), or open the browser menu -> "Install AXIOM-7".'}
                  </div>
                  <div>
                    {lang === 'da'
                      ? '2. Alle 6 3D-kapitler, 14 o-Llama positurer, Rust/WASM fysik og SQL-databasen fungerer derefter uden internet.'
                      : '2. All 6 3D chapters, 14 o-Llama poses, Rust/WASM physics, and the SQL database will run without internet.'}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowInstallModal(false)}
              className="mt-4 w-full py-2 rounded bg-[#00F0FF] hover:bg-[#00B8D4] text-[#050510] font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              {lang === 'da' ? 'Forstået' : 'Got It'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
