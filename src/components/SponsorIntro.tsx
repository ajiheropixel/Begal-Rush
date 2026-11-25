import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FastForward } from 'lucide-react';
import { BegalLogoSvg } from './BegalLogoSvg';
import { audioEngine } from '../systems/audioEngine';

interface SponsorIntroProps {
  onComplete: () => void;
}

type IntroBeat = 'cikara' | 'studio' | 'sponsors' | 'title';

export const SponsorIntro: React.FC<SponsorIntroProps> = ({ onComplete }) => {
  const [beat, setBeat] = useState<IntroBeat>('cikara');
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [cikaraError, setCikaraError] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const finishedRef = useRef(false);

  const finishIntro = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setExiting(true);
    window.setTimeout(() => {
      onComplete();
    }, 420);
  }, [onComplete]);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scale = reduceMotion ? 0.5 : 1;

    const delay =
      beat === 'cikara'
        ? 2600 * scale
        : beat === 'studio'
        ? 2700 * scale
        : beat === 'sponsors'
        ? 2700 * scale
        : 1800 * scale;

    const timer = window.setTimeout(() => {
      if (beat === 'cikara') {
        audioEngine.playSponsorChime();
        setBeat('studio');
      } else if (beat === 'studio') {
        audioEngine.playSponsorChime();
        setBeat('sponsors');
      } else if (beat === 'sponsors') {
        audioEngine.playSponsorChime();
        setBeat('title');
      } else {
        finishIntro();
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [beat, finishIntro]);

  const handleStageClick = () => {
    audioEngine.unlock();
    if (beat === 'cikara') {
      audioEngine.playSponsorChime();
      setBeat('studio');
    } else if (beat === 'studio') {
      audioEngine.playSponsorChime();
      setBeat('sponsors');
    } else if (beat === 'sponsors') {
      audioEngine.playSponsorChime();
      setBeat('title');
    } else {
      audioEngine.playUiClick();
      finishIntro();
    }
  };

  const progressScale =
    beat === 'cikara' ? 0.25 : beat === 'studio' ? 0.5 : beat === 'sponsors' ? 0.75 : 1;
  const headerBrand =
    beat === 'cikara'
      ? 'CIKARA DEVELOPERS'
      : beat === 'studio'
      ? 'AJIVA STUDIO'
      : 'CIKARA × AJIVA STUDIO';

  return (
    <div
      onClick={handleStageClick}
      className={`fixed inset-0 z-40 bg-[#07090D] flex flex-col justify-between pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] sm:p-10 select-none cursor-pointer transition-opacity duration-400 ${
        visible && !exiting ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Subtle Top Hairline Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-mono-tabular">
        <span>{headerBrand}</span>
        <span>PRESENTATION</span>
      </div>

      {/* Center Stage */}
      <div className="flex-1 flex items-center justify-center px-2">
        {beat === 'cikara' && (
          <div key="cikara" className="flex flex-col items-center text-center w-full max-w-2xl">
            <div className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-black px-6 py-8 sm:px-12 sm:py-10">
              {!cikaraError ? (
                <img
                  src="/assets/aistudio/WhatsApp_Image_2026-11-25_at_17.04.04_fe6b6364.jpeg"
                  alt="CIKARA Games & Apps Developers"
                  referrerPolicy="no-referrer"
                  onError={() => setCikaraError(true)}
                  className="w-full h-auto max-h-[260px] object-contain mx-auto block animate-studio-reveal"
                />
              ) : (
                <div className="py-12 px-6 animate-studio-reveal">
                  <div className="font-display text-4xl sm:text-6xl font-bold tracking-[0.2em] text-white">
                    CIKARA
                  </div>
                  <div className="text-sm sm:text-base tracking-[0.26em] text-slate-300 mt-2">
                    Games &amp; Apps Developers
                  </div>
                </div>
              )}

              {/* Subtle diagonal silver sheen sweep */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-studio-shine"
              />

              {/* Edge blend vignette */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#07090D]/55 via-transparent to-[#07090D]/35"
              />
            </div>

            <div className="mt-5 flex items-center gap-3 text-xs sm:text-sm text-slate-400 tracking-widest uppercase animate-intro-subtitle">
              <span>Cikara Games &amp; Apps Developers</span>
              <span aria-hidden="true">·</span>
              <span>Co-Production</span>
            </div>
          </div>
        )}

        {beat === 'studio' && (
          <div key="studio" className="flex flex-col items-center text-center w-full max-w-2xl">
            <div className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-[#06080C]">
              {!logoError ? (
                <img
                  src="/assets/aistudio/logo_studio_ajiva_8626caf7.png"
                  alt="AJIVA STUDIO"
                  referrerPolicy="no-referrer"
                  onError={() => setLogoError(true)}
                  className="w-full h-auto max-h-[340px] object-contain block animate-studio-reveal"
                />
              ) : (
                <div className="py-16 px-8 animate-studio-reveal">
                  <div className="font-display text-4xl sm:text-6xl font-bold tracking-[0.22em] text-white">
                    AJIVA
                  </div>
                  <div className="text-sm sm:text-base tracking-[0.45em] text-slate-300 mt-1">
                    STUDIO
                  </div>
                </div>
              )}

              {/* Subtle diagonal silver sheen sweep */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-studio-shine"
              />

              {/* Edge blend vignette */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#07090D]/70 via-transparent to-[#07090D]/40"
              />
            </div>

            <div className="mt-5 flex items-center gap-3 text-xs sm:text-sm text-slate-400 tracking-widest uppercase animate-intro-subtitle">
              <span>Ajiva Studio Presents</span>
              <span aria-hidden="true">·</span>
              <span>Indonesia Arcade Division</span>
            </div>
          </div>
        )}

        {beat === 'sponsors' && (
          <div key="sponsors" className="w-full max-w-3xl animate-intro-fade">
            <div className="text-center mb-7">
              <div className="text-xs font-mono-tabular tracking-[0.22em] text-yellow-400 uppercase">
                Official Track &amp; Gear Partners
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1.5">
                POWERED BY STREET SPONSORS
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Sponsor 1: Kilat Nitro */}
              <div className="bg-[#0D1118] border border-white/10 rounded-lg p-5 flex items-center gap-4">
                <svg viewBox="0 0 48 48" className="w-11 h-11 shrink-0" aria-hidden="true">
                  <rect x="4" y="4" width="40" height="40" rx="8" fill="#0B1324" stroke="#38BDF8" strokeWidth="2" />
                  <path d="M27 10 L15 26 H24 L21 38 L33 22 H24 Z" fill="#38BDF8" />
                </svg>
                <div className="min-w-0">
                  <div className="font-display text-lg font-bold tracking-wider text-white">
                    KILAT NITRO
                  </div>
                  <div className="text-xs text-slate-400">High-Octane Fuel Systems</div>
                </div>
              </div>

              {/* Sponsor 2: Aspal Raya */}
              <div className="bg-[#0D1118] border border-white/10 rounded-lg p-5 flex items-center gap-4">
                <svg viewBox="0 0 48 48" className="w-11 h-11 shrink-0" aria-hidden="true">
                  <rect x="4" y="4" width="40" height="40" rx="8" fill="#18130B" stroke="#FACC15" strokeWidth="2" />
                  <circle cx="24" cy="24" r="11" fill="none" stroke="#FACC15" strokeWidth="3" />
                  <circle cx="24" cy="24" r="4" fill="#F8FAFC" />
                </svg>
                <div className="min-w-0">
                  <div className="font-display text-lg font-bold tracking-wider text-white">
                    ASPAL RAYA
                  </div>
                  <div className="text-xs text-slate-400">Street Grip Tire Engineering</div>
                </div>
              </div>

              {/* Sponsor 3: Garda Armor */}
              <div className="bg-[#0D1118] border border-white/10 rounded-lg p-5 flex items-center gap-4">
                <svg viewBox="0 0 48 48" className="w-11 h-11 shrink-0" aria-hidden="true">
                  <rect x="4" y="4" width="40" height="40" rx="8" fill="#1A0E12" stroke="#EF4444" strokeWidth="2" />
                  <path d="M24 10 L36 16 V25 C36 32 30 37 24 39 C18 37 12 32 12 25 V16 Z" fill="none" stroke="#EF4444" strokeWidth="2.5" />
                  <path d="M19 24 L23 28 L30 20" fill="none" stroke="#F8FAFC" strokeWidth="2.5" />
                </svg>
                <div className="min-w-0">
                  <div className="font-display text-lg font-bold tracking-wider text-white">
                    GARDA ARMOR
                  </div>
                  <div className="text-xs text-slate-400">Rider Impact &amp; Frame Tech</div>
                </div>
              </div>

              {/* Sponsor 4: Nusa Audio */}
              <div className="bg-[#0D1118] border border-white/10 rounded-lg p-5 flex items-center gap-4">
                <svg viewBox="0 0 48 48" className="w-11 h-11 shrink-0" aria-hidden="true">
                  <rect x="4" y="4" width="40" height="40" rx="8" fill="#0F171A" stroke="#10B981" strokeWidth="2" />
                  <rect x="13" y="21" width="4" height="10" rx="1" fill="#10B981" />
                  <rect x="22" y="13" width="4" height="22" rx="1" fill="#F8FAFC" />
                  <rect x="31" y="17" width="4" height="16" rx="1" fill="#10B981" />
                </svg>
                <div className="min-w-0">
                  <div className="font-display text-lg font-bold tracking-wider text-white">
                    NUSA AUDIO
                  </div>
                  <div className="text-xs text-slate-400">Dynamic Chase Soundworks</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {beat === 'title' && (
          <div key="title" className="flex flex-col items-center text-center animate-intro-fade">
            <div className="scale-110 sm:scale-125">
              <BegalLogoSvg />
            </div>
            <p className="mt-8 text-xs sm:text-sm font-mono-tabular text-slate-400 tracking-widest">
              SURVIVE THE NIGHT STREETS
            </p>
          </div>
        )}
      </div>

      {/* Bottom Controls & Thin Progress Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] sm:text-xs text-slate-500">
            Ketuk layar untuk lanjut · Skip untuk masuk menu
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              audioEngine.unlock();
              audioEngine.playUiClick();
              finishIntro();
            }}
            className="min-h-[44px] px-4 py-2 bg-[#111620] hover:bg-slate-800 border border-white/15 rounded-lg text-xs font-semibold text-slate-200 hover:text-yellow-400 flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-yellow-400"
          >
            <span>Skip Intro</span>
            <FastForward className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400 origin-left transition-transform duration-500 ease-out"
            style={{ transform: `scaleX(${progressScale})` }}
          />
        </div>
      </div>
    </div>
  );
};
