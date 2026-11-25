import React, { useState } from 'react';
import { Download, Smartphone, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'card';
  showFallbackHint?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  showFallbackHint = false,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    if (!showFallbackHint) return null;
    return (
      <div className="bg-emerald-950/45 border border-emerald-500/40 rounded-lg px-3.5 py-2.5 text-xs text-emerald-200 flex items-center gap-2">
        <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>Terpasang sebagai Aplikasi Offline di perangkat ini.</span>
      </div>
    );
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={
          variant === 'card'
            ? 'w-full min-h-[44px] px-4 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-display font-bold text-xs sm:text-sm rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap shadow-md shadow-emerald-500/20'
            : 'min-h-[44px] px-3 hud-panel border-emerald-400/45 text-emerald-300 hover:text-slate-950 hover:bg-emerald-400 rounded-lg flex items-center justify-center gap-1.5 text-xs font-display font-bold transition-colors cursor-pointer whitespace-nowrap'
        }
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowGuide(true)}
          className={
            variant === 'card'
              ? 'w-full min-h-[44px] px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-emerald-400/40 text-emerald-300 font-display font-bold text-xs sm:text-sm rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap'
              : 'min-h-[44px] px-3 hud-panel border-emerald-400/40 text-emerald-300 hover:text-white rounded-lg flex items-center justify-center gap-1.5 text-xs font-display font-bold transition-colors cursor-pointer whitespace-nowrap'
          }
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>Pasang iOS</span>
        </button>

        {showGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-sm hud-panel-amber hud-chamfer p-5 text-slate-100">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <h3 className="font-display text-base font-bold text-yellow-400">
                  PASANG DI IPHONE / IPAD
                </h3>
                <button
                  type="button"
                  onClick={() => setShowGuide(false)}
                  aria-label="Tutup panduan"
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg bg-slate-800 text-slate-300 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ol className="mt-3 space-y-2 text-xs text-slate-300 leading-relaxed list-decimal list-inside">
                <li>
                  Buka halaman game ini langsung di browser <strong className="text-white">Safari</strong>.
                </li>
                <li>
                  Ketuk ikon <strong className="text-white">Bagikan (Share)</strong> di bilah bawah/atas Safari.
                </li>
                <li>
                  Pilih <strong className="text-yellow-300">Tambah ke Layar Utama (Add to Home Screen)</strong> untuk bermain layar penuh secara offline.
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="mt-4 w-full min-h-[42px] bg-yellow-400 text-slate-950 font-display font-bold text-xs rounded-lg cursor-pointer whitespace-nowrap"
              >
                MENGERTI
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  if (!showFallbackHint) return null;

  return (
    <div className="bg-slate-900/95 border border-white/10 rounded-lg p-3 text-xs text-slate-300 leading-relaxed space-y-1.5">
      <div className="font-display font-bold text-emerald-300 flex items-center gap-1.5">
        <Smartphone className="w-4 h-4" />
        MAIN OFFLINE / VERSI MOBILE
      </div>
      <p className="text-slate-400">
        Buka URL game di Chrome Android atau Safari iOS lalu pilih menu browser{' '}
        <strong className="text-white">Tambahkan ke Layar Utama / Install App</strong> agar tersimpan
        di HP dan tetap berjalan tanpa internet.
      </p>
    </div>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-[max(0.75rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-slate-950 border border-amber-200/70 px-3 py-1 rounded-md text-[11px] font-display font-bold flex items-center gap-1.5 shadow-lg whitespace-nowrap pointer-events-none">
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>MODE OFFLINE · CACHE AKTIF</span>
    </div>
  );
};
