import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Award,
  CheckCircle2,
  Lock,
  RotateCcw,
  Shield,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Target,
  Users,
  X,
} from 'lucide-react';
import { ACHIEVEMENTS, EASTER_EGGS, MISSIONS } from '../data/gameCatalog';
import {
  GameSettings,
  HudAlertMode,
  SaveData,
  SubModal,
  TouchButtonScale,
  TouchPadLayout,
  TouchSideOffset,
  TouchVerticalOffset,
} from '../types/game';
import { PWAInstallButton } from './PWAInstallButton';

interface PauseModalProps {
  isMultiplayer?: boolean;
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings?: () => void;
  onQuitToMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isMultiplayer = false,
  onResume,
  onRestart,
  onOpenSettings,
  onQuitToMenu,
}) => {
  return (
    <div className="fixed inset-0 z-30 bg-black/75 flex items-center justify-center p-4">
      <div className="w-full max-w-sm hud-panel-amber hud-chamfer p-6 text-center">
        <div className="text-[10px] font-mono-tabular uppercase tracking-[0.2em] text-amber-300">
          BEGAL RUSUH · {isMultiplayer ? 'MULTIPLAYER AKTIF' : 'PAUSED'}
        </div>
        <h2 className="font-display text-2xl font-bold text-white mt-1">
          {isMultiplayer ? 'MENU CEPAT' : 'ISTIRAHAT SEJENAK'}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {isMultiplayer
            ? 'Balapan tetap berjalan secara real-time bersama rider lain.'
            : 'Siapkan refleks sebelum kembali menerobos malam.'}
        </p>

        <div className="mt-5 space-y-2.5">
          <button
            type="button"
            onClick={onResume}
            className="w-full min-h-[44px] bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 text-slate-950 font-display font-bold text-sm rounded-lg cursor-pointer whitespace-nowrap"
          >
            LANJUTKAN BALAP
          </button>
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="w-full min-h-[44px] bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/50 text-sky-200 font-semibold text-sm rounded-lg cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Atur Posisi Tombol &amp; Setelan
            </button>
          )}
          {!isMultiplayer && (
            <button
              type="button"
              onClick={onRestart}
              className="w-full min-h-[44px] bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm rounded-lg cursor-pointer whitespace-nowrap"
            >
              Ulangi Perjalanan
            </button>
          )}
          <button
            type="button"
            onClick={onQuitToMenu}
            className="w-full min-h-[44px] bg-slate-900 hover:bg-slate-800 border border-white/12 text-slate-300 font-semibold text-sm rounded-lg cursor-pointer whitespace-nowrap"
          >
            {isMultiplayer ? 'Keluar dari Room & Kembali' : 'Kembali ke Menu Utama'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface SecondaryModalsProps {
  modal: SubModal;
  save: SaveData;
  onClose: () => void;
  onUpdateSettings: (patch: Partial<GameSettings>) => void;
  onResetSave: () => void;
}

const PREVIEW_BOTTOM_PAD: Record<TouchVerticalOffset, string> = {
  0: 'pb-0',
  1: 'pb-1.5',
  2: 'pb-3',
  3: 'pb-5',
};

const PREVIEW_SIDE_PAD: Record<TouchSideOffset, string> = {
  0: 'px-0',
  1: 'px-1.5',
  2: 'px-3.5',
  3: 'px-6',
};

const PREVIEW_STEER_SIZE: Record<TouchButtonScale, string> = {
  compact: 'w-5 h-5',
  normal: 'w-6 h-6',
  large: 'w-7 h-7',
};

const PREVIEW_ACTION_W: Record<TouchButtonScale, string> = {
  compact: 'w-14',
  normal: 'w-16',
  large: 'w-20',
};

export const SecondaryModals: React.FC<SecondaryModalsProps> = ({
  modal,
  save,
  onClose,
  onUpdateSettings,
  onResetSave,
}) => {
  const [achTab, setAchTab] = useState<'achievements' | 'secrets'>('achievements');

  if (modal === 'none' || modal === 'multiplayer') return null;

  const touchScale: TouchButtonScale = save.settings.touchScale ?? 'normal';
  const touchVerticalOffset: TouchVerticalOffset = save.settings.touchVerticalOffset ?? 1;
  const touchSideOffset: TouchSideOffset = save.settings.touchSideOffset ?? 0;
  const touchPadLayout: TouchPadLayout = save.settings.touchPadLayout ?? 'ergo';
  const hudAlertMode: HudAlertMode = save.settings.hudAlertMode ?? 'compact';

  return (
    <div className="fixed inset-0 z-40 bg-black/80 flex items-start sm:items-center justify-center pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] px-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-xl hud-panel-amber hud-chamfer p-4 sm:p-6 text-slate-100 my-auto">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
            {modal === 'missions' && (
              <>
                <Target className="w-5 h-5 text-yellow-400" /> MISI HARIAN & KARIR
              </>
            )}
            {modal === 'achievements' && (
              <>
                <Award className="w-5 h-5 text-yellow-400" /> PRESTASI & EASTER EGG
              </>
            )}
            {modal === 'settings' && 'PENGATURAN & KONTROL'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {modal === 'missions' && (
          <div className="mt-4 space-y-2.5 max-h-[60vh] overflow-y-auto pr-1 hud-scroll">
            {MISSIONS.map((m) => {
              const done = save.completedMissionIds.includes(m.id);
              return (
                <div
                  key={m.id}
                  className={`border rounded-lg p-3.5 flex items-center justify-between gap-3 ${
                    done
                      ? 'bg-emerald-950/35 border-emerald-500/35'
                      : 'bg-slate-900/95 border-white/10'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-sm text-white flex items-center gap-2">
                      {m.title}
                      {done && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{m.description}</p>
                  </div>
                  <div className="text-right font-mono-tabular text-xs shrink-0">
                    <div className="text-yellow-400 font-bold">+{m.rewardCoins} C</div>
                    <div className="text-slate-400">+{m.rewardExp} EXP</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {modal === 'achievements' && (
          <div className="mt-4">
            {/* Switch between Achievements and 8 Easter Eggs Tracker */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={() => setAchTab('achievements')}
                className={`min-h-[40px] px-3 py-2 rounded-lg text-xs font-display font-bold flex items-center justify-center gap-2 border transition-colors cursor-pointer whitespace-nowrap ${
                  achTab === 'achievements'
                    ? 'bg-yellow-400 text-slate-950 border-yellow-300'
                    : 'bg-slate-900 text-slate-300 border-white/10 hover:text-white'
                }`}
              >
                <Award className="w-4 h-4" />
                Prestasi ({save.unlockedAchievementIds.length}/{ACHIEVEMENTS.length})
              </button>
              <button
                type="button"
                onClick={() => setAchTab('secrets')}
                className={`min-h-[40px] px-3 py-2 rounded-lg text-xs font-display font-bold flex items-center justify-center gap-2 border transition-colors cursor-pointer whitespace-nowrap ${
                  achTab === 'secrets'
                    ? 'bg-emerald-400 text-slate-950 border-emerald-300'
                    : 'bg-slate-900 text-slate-300 border-white/10 hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Easter Egg ({save.discoveredEasterEggs.length}/{EASTER_EGGS.length})
              </button>
            </div>

            {achTab === 'achievements' ? (
              <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1 hud-scroll">
                {ACHIEVEMENTS.map((a) => {
                  const unlocked = save.unlockedAchievementIds.includes(a.id);
                  return (
                    <div
                      key={a.id}
                      className={`border rounded-lg p-3.5 flex items-center justify-between gap-3 ${
                        unlocked
                          ? 'bg-yellow-400/12 border-yellow-400/40'
                          : 'bg-slate-900/95 border-white/10 opacity-75'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-sm text-white flex items-center gap-2">
                          {a.title}
                          {unlocked && <CheckCircle2 className="w-4 h-4 text-yellow-400" />}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{a.description}</p>
                      </div>
                      <div className="text-right font-mono-tabular text-xs shrink-0">
                        <div className="text-yellow-400 font-bold">+{a.rewardCoins} C</div>
                        <div className="text-slate-400">+{a.rewardExp} EXP</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1 hud-scroll">
                {EASTER_EGGS.map((egg) => {
                  const found = save.discoveredEasterEggs.includes(egg.id);
                  return (
                    <div
                      key={egg.id}
                      className={`border rounded-lg p-3.5 flex items-center justify-between gap-3 ${
                        found
                          ? 'bg-emerald-500/12 border-emerald-400/45'
                          : 'bg-slate-900/95 border-white/10'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-sm text-white flex items-center gap-2">
                          {found ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          )}
                          <span>{found ? egg.title : 'Rahasia Kota Malam'}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          Petunjuk: {egg.hint}
                        </p>
                      </div>
                      <div className="text-right font-mono-tabular text-xs shrink-0">
                        <div className={found ? 'text-emerald-300 font-bold' : 'text-yellow-400 font-bold'}>
                          +{egg.rewardCoins} C
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {found ? 'TERBUKA' : 'TERKUNCI'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {modal === 'settings' && (
          <div className="mt-4 space-y-4 text-sm max-h-[75vh] overflow-y-auto pr-1 hud-scroll">
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Volume SFX</span>
                <span className="font-mono-tabular">
                  {Math.round(save.settings.sfxVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={save.settings.sfxVolume}
                onChange={(e) => onUpdateSettings({ sfxVolume: Number(e.target.value) })}
                className="w-full accent-yellow-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Volume Musik</span>
                <span className="font-mono-tabular">
                  {Math.round(save.settings.musicVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={save.settings.musicVolume}
                onChange={(e) => onUpdateSettings({ musicVolume: Number(e.target.value) })}
                className="w-full accent-yellow-400"
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-slate-300">Kualitas Grafis 3D</span>
              <div className="flex gap-1.5">
                {(['low', 'medium', 'high'] as const).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => onUpdateSettings({ graphicsQuality: q })}
                    className={`min-h-[34px] px-3 py-1.5 rounded-md text-xs font-semibold capitalize cursor-pointer whitespace-nowrap ${
                      save.settings.graphicsQuality === q
                        ? 'bg-yellow-400 text-slate-950'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="text-xs text-slate-300">Notifikasi Atas Saat Balap</span>
              <div className="flex gap-1.5">
                {(
                  [
                    { id: 'compact', label: 'Ringkas' },
                    { id: 'minimal', label: 'Minimal' },
                    { id: 'off', label: 'Sembunyi' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onUpdateSettings({ hudAlertMode: opt.id })}
                    className={`min-h-[34px] px-2.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer whitespace-nowrap ${
                      hudAlertMode === opt.id
                        ? 'bg-yellow-400 text-slate-950'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Android Touch Button Position & Layout Customizer */}
            <div className="bg-slate-900/95 border border-amber-400/25 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 text-xs font-display font-bold text-amber-300">
                  <Smartphone className="w-4 h-4" />
                  POSISI TOMBOL ANDROID
                </div>
                <div className="flex gap-1.5">
                  {(['auto', 'always', 'off'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onUpdateSettings({ touchControls: mode })}
                      className={`min-h-[30px] px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize cursor-pointer whitespace-nowrap ${
                        save.settings.touchControls === mode
                          ? 'bg-yellow-400 text-slate-950'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Phone Screen Mini-Preview */}
              <div className="h-28 bg-slate-950 border border-white/15 rounded-lg p-2 flex flex-col justify-between overflow-hidden">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-3 rounded-xs bg-slate-800 border border-white/10" />
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-9 h-2.5 rounded-xs bg-slate-800 border border-amber-400/30" />
                    {hudAlertMode !== 'off' && (
                      <div className="px-2 py-0.5 rounded-full bg-slate-900/90 border border-amber-400/50 text-[8px] font-mono-tabular text-amber-200 whitespace-nowrap">
                        {hudAlertMode === 'minimal' ? 'NOTIF BAHAYA' : 'NOTIF RINGKAS'}
                      </div>
                    )}
                  </div>
                  <div className="w-10 h-3 rounded-xs bg-slate-800 border border-white/10" />
                </div>

                <div
                  className={`flex items-end justify-between ${
                    save.settings.touchSwapped ? 'flex-row-reverse' : ''
                  } ${PREVIEW_BOTTOM_PAD[touchVerticalOffset]} ${PREVIEW_SIDE_PAD[touchSideOffset]}`}
                >
                  {/* Steering preview */}
                  <div className="flex flex-col gap-0.5">
                    <div className="h-2 rounded-xs bg-emerald-500/35 border border-emerald-400/50" />
                    <div className="flex gap-0.5">
                      <div
                        className={`${PREVIEW_STEER_SIZE[touchScale]} rounded bg-slate-800 border border-white/25 flex items-center justify-center text-[8px] text-slate-300`}
                      >
                        ◀
                      </div>
                      <div
                        className={`${PREVIEW_STEER_SIZE[touchScale]} rounded bg-slate-800 border border-white/25 flex items-center justify-center text-[8px] text-slate-300`}
                      >
                        ▶
                      </div>
                    </div>
                  </div>

                  {/* Action pad preview */}
                  {touchPadLayout === 'ergo' ? (
                    <div className={`${PREVIEW_ACTION_W[touchScale]} flex flex-col gap-0.5`}>
                      <div className="grid grid-cols-4 gap-0.5">
                        <div className="h-1.5 rounded-xs bg-sky-500/40" />
                        <div className="h-1.5 rounded-xs bg-red-500/40" />
                        <div className="h-1.5 rounded-xs bg-cyan-500/40" />
                        <div className="h-1.5 rounded-xs bg-slate-700" />
                      </div>
                      <div className="grid grid-cols-3 gap-0.5">
                        <div className="h-2 rounded-xs bg-red-900/80" />
                        <div className="h-2 rounded-xs bg-yellow-400/40" />
                        <div className="h-2 rounded-xs bg-slate-700" />
                      </div>
                      <div className="grid grid-cols-2 gap-0.5">
                        <div className="h-3.5 rounded-xs bg-emerald-500/80 flex items-center justify-center text-[7px] font-bold text-white">
                          GAS
                        </div>
                        <div className="h-3.5 rounded-xs bg-yellow-400 flex items-center justify-center text-[7px] font-bold text-slate-950">
                          PKL
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={`${PREVIEW_ACTION_W[touchScale]} grid grid-cols-3 gap-0.5`}>
                      <div className="h-2 rounded-xs bg-sky-500/40" />
                      <div className="h-2 rounded-xs bg-red-500/40" />
                      <div className="h-2 rounded-xs bg-cyan-500/40" />
                      <div className="h-2 rounded-xs bg-slate-700" />
                      <div className="h-2 rounded-xs bg-yellow-400/40" />
                      <div className="h-2 rounded-xs bg-slate-700" />
                      <div className="h-2.5 rounded-xs bg-red-900/80" />
                      <div className="h-2.5 rounded-xs bg-emerald-500/80" />
                      <div className="h-2.5 rounded-xs bg-yellow-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Pad Layout Style */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs text-slate-300">Susunan Pad Aksi</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ touchPadLayout: 'ergo' })}
                    className={`min-h-[32px] px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer whitespace-nowrap ${
                      touchPadLayout === 'ergo'
                        ? 'bg-yellow-400 text-slate-950'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    Nyaman (Gas Besar)
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ touchPadLayout: 'classic' })}
                    className={`min-h-[32px] px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer whitespace-nowrap ${
                      touchPadLayout === 'classic'
                        ? 'bg-yellow-400 text-slate-950'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    Klasik 3×3
                  </button>
                </div>
              </div>

              {/* Swap Left / Right */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs text-slate-300">Posisi Kiri-Kanan</span>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ touchSwapped: !save.settings.touchSwapped })}
                  className={`min-h-[32px] px-3 py-1 rounded-md text-xs font-semibold cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    save.settings.touchSwapped
                      ? 'bg-sky-400 text-slate-950'
                      : 'bg-slate-800 text-slate-200 border border-white/10'
                  }`}
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  {save.settings.touchSwapped ? 'Ditukar (Belok Kanan)' : 'Normal (Belok Kiri)'}
                </button>
              </div>

              {/* Button Scale */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs text-slate-300">Ukuran Tombol</span>
                <div className="flex gap-1.5">
                  {(
                    [
                      { id: 'compact', label: 'Kecil' },
                      { id: 'normal', label: 'Sedang' },
                      { id: 'large', label: 'Besar' },
                    ] as const
                  ).map((sz) => (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => onUpdateSettings({ touchScale: sz.id })}
                      className={`min-h-[32px] px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer whitespace-nowrap ${
                        touchScale === sz.id
                          ? 'bg-yellow-400 text-slate-950'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vertical Elevation */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs text-slate-300">Tinggi dari Bawah</span>
                <div className="flex gap-1.5">
                  {(
                    [
                      { id: 0, label: 'Rapat' },
                      { id: 1, label: 'Sedang' },
                      { id: 2, label: 'Naik' },
                      { id: 3, label: 'Tinggi' },
                    ] as const
                  ).map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => onUpdateSettings({ touchVerticalOffset: lvl.id })}
                      className={`min-h-[32px] px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer whitespace-nowrap ${
                        touchVerticalOffset === lvl.id
                          ? 'bg-yellow-400 text-slate-950'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Horizontal Edge Offset */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs text-slate-300">Jarak dari Pinggir</span>
                <div className="flex gap-1.5">
                  {(
                    [
                      { id: 0, label: 'Pinggir' },
                      { id: 1, label: 'Masuk 1' },
                      { id: 2, label: 'Masuk 2' },
                      { id: 3, label: 'Tengah' },
                    ] as const
                  ).map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => onUpdateSettings({ touchSideOffset: lvl.id })}
                      className={`min-h-[32px] px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer whitespace-nowrap ${
                        touchSideOffset === lvl.id
                          ? 'bg-yellow-400 text-slate-950'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings({
                      touchSwapped: false,
                      touchScale: 'normal',
                      touchVerticalOffset: 1,
                      touchSideOffset: 0,
                      touchPadLayout: 'ergo',
                      hudAlertMode: 'compact',
                    })
                  }
                  className="min-h-[30px] px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset Posisi Default
                </button>
              </div>
            </div>

            <div className="bg-slate-900/95 border border-white/10 rounded-lg p-3 text-xs text-slate-300 space-y-1 font-mono-tabular">
              <div>Belok: A / D atau Panah · Dash: C / L</div>
              <div>Gas / Rem: W / S · NOS: Shift / N · Lompat: Space</div>
              <div>Pukul/Parry: F · Lock-Shot: R · Jebakan: T · EMP: E</div>
              <div>Klakson/Lure: Q · Panggil Polisi (Ult): P / V</div>
            </div>

            <div className="bg-slate-900/95 border border-yellow-400/25 rounded-lg p-3 flex items-center gap-3">
              <img
                src="/pwa-192x192.png"
                alt="Ikon BEGAL RUSUH"
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-xl border border-yellow-400/40 shrink-0 object-cover"
              />
              <div className="min-w-0">
                <div className="font-display font-bold text-sm text-yellow-400">BEGAL RUSUH</div>
                <p className="text-[11px] text-slate-300 leading-snug mt-0.5">
                  Game balap motor &amp; aksi survival 3D jalanan malam Indonesia. Lawan komplotan begal rusuh, selamatkan warga, modifikasi 8 motor dan 8 senjata, serta taklukkan rintangan jalanan.
                </p>
              </div>
            </div>

            <PWAInstallButton variant="card" showFallbackHint />

            <div className="pt-2 border-t border-white/10 flex flex-wrap justify-between items-center gap-2">
              <span className="text-xs text-slate-400">
                Perjalanan: {save.totalRuns} · Total Jarak: {save.totalDistance.toLocaleString()} m
              </span>
              <button
                type="button"
                onClick={onResetSave}
                className="min-h-[36px] px-3 py-1.5 bg-rose-950/75 hover:bg-rose-900 text-rose-200 text-xs font-semibold rounded-md border border-rose-500/40 cursor-pointer whitespace-nowrap"
              >
                Reset Data Simpanan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
