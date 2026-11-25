import React from 'react';
import {
  Award,
  Coins,
  Crosshair,
  Film,
  Flame,
  Gauge,
  Maximize2,
  Minimize2,
  Play,
  Settings,
  Shield,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Users,
  Volume2,
  VolumeX,
  Wrench,
} from 'lucide-react';
import { BegalLogoSvg } from './BegalLogoSvg';
import { PWAInstallButton } from './PWAInstallButton';
import { SaveData, SubModal } from '../types/game';
import { expForLevel } from '../systems/saveSystem';
import {
  BIKES,
  EASTER_EGGS,
  computeEffectiveStats,
  getBikeById,
  getMeleeWeaponById,
  getRangedWeaponById,
} from '../data/gameCatalog';

interface MainMenuProps {
  save: SaveData;
  onStartSolo: () => void;
  onOpenGarage: () => void;
  onOpenSubModal: (modal: SubModal) => void;
  onToggleMute: () => void;
  onReplayIntro: () => void;
  onUnlockMenuSecret: () => boolean;
  canFullscreen?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  save,
  onStartSolo,
  onOpenGarage,
  onOpenSubModal,
  onToggleMute,
  onReplayIntro,
  onUnlockMenuSecret,
  canFullscreen = false,
  isFullscreen = false,
  onToggleFullscreen,
}) => {
  const [logoTaps, setLogoTaps] = React.useState(0);
  const [secretMessage, setSecretMessage] = React.useState<string | null>(null);
  const nextExp = expForLevel(save.level);
  const expPct = Math.min(100, Math.round((save.exp / nextExp) * 100));
  const selectedBike = getBikeById(save.selectedBikeId);
  const bikeStats = computeEffectiveStats(selectedBike, save.upgrades[selectedBike.id]);
  const equippedMelee = getMeleeWeaponById(save.selectedMeleeWeapon);
  const equippedRanged = getRangedWeaponById(save.selectedRangedWeapon);
  const totalSecrets = EASTER_EGGS.length;
  const foundSecrets = save.discoveredEasterEggs.length;

  const handleLogoTap = () => {
    const next = logoTaps + 1;
    if (next >= 5) {
      setLogoTaps(0);
      const unlockedNew = onUnlockMenuSecret();
      setSecretMessage(
        unlockedNew ? 'SECRET UNLOCKED: SULTAN JALANAN (+250 COINS)' : 'SECRET CODE ACTIVE · RIDE HARD!'
      );
      window.setTimeout(() => setSecretMessage(null), 3200);
    } else {
      setLogoTaps(next);
    }
  };

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between gap-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:p-7 overflow-y-auto hud-scroll">
      {/* Top Telemetry Strip: Rider Progression, Wallet, Best Distance & Quick Controls */}
      <div className="flex flex-wrap items-start justify-between gap-2.5 sm:gap-3 shrink-0">
        <div className="pointer-events-auto hud-panel hud-chamfer-sm px-3 sm:px-4 py-2 sm:py-2.5 flex flex-wrap items-center gap-3 sm:gap-6">
          {/* Rider Level */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Rider Rank
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-display text-base sm:text-xl font-bold text-yellow-400 tabular-nums">
                LV {save.level}
              </span>
              <div className="w-16 sm:w-28 h-2 bg-slate-800/90 rounded-xs overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-300"
                  style={{ width: `${expPct}%` }}
                />
              </div>
              <span className="font-mono-tabular text-[10px] sm:text-[11px] text-slate-400 hidden sm:inline">
                {save.exp}/{nextExp}
              </span>
            </div>
          </div>

          <div className="h-7 w-px bg-white/10 hidden sm:block" />

          {/* Coins */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Coins className="w-4 h-4 text-yellow-400 shrink-0" />
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Saldo
              </div>
              <div className="font-mono-tabular text-xs sm:text-base font-bold text-white">
                {save.coins.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="h-7 w-px bg-white/10 hidden sm:block" />

          {/* Best Run */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Trophy className="w-4 h-4 text-sky-400 shrink-0" />
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Rekor
              </div>
              <div className="font-mono-tabular text-xs sm:text-base font-bold text-white">
                {save.bestDistance.toLocaleString()} m
              </div>
            </div>
          </div>

          <div className="h-7 w-px bg-white/10 hidden md:block" />

          {/* Easter Eggs Counter */}
          <button
            type="button"
            onClick={() => onOpenSubModal('achievements')}
            className="flex items-center gap-1.5 sm:gap-2 text-left hover:opacity-85 transition-opacity cursor-pointer"
            title="Lihat Daftar Easter Egg"
          >
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Egg
              </div>
              <div className="font-mono-tabular text-xs sm:text-sm font-bold text-emerald-300">
                {foundSecrets}/{totalSecrets}
              </div>
            </div>
          </button>
        </div>

        {/* Top-Right System Buttons */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
          <PWAInstallButton variant="compact" />
          <button
            type="button"
            onClick={onReplayIntro}
            aria-label="Replay Opening Sponsors"
            title="Putar Ulang Opening Studio"
            className="min-h-[42px] sm:min-h-[44px] min-w-[42px] sm:min-w-[44px] px-2.5 sm:px-3 hud-panel rounded-lg flex items-center justify-center gap-2 text-slate-200 hover:text-yellow-400 hover:border-yellow-400/50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Film className="w-4 h-4" />
            <span className="hidden xl:inline text-xs font-semibold">Opening</span>
          </button>
          {canFullscreen && onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
              className="min-h-[42px] sm:min-h-[44px] min-w-[42px] sm:min-w-[44px] hud-panel rounded-lg flex items-center justify-center text-slate-200 hover:text-yellow-400 hover:border-yellow-400/50 transition-colors cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={save.settings.muted ? 'Unmute audio' : 'Mute audio'}
            className="min-h-[42px] sm:min-h-[44px] min-w-[42px] sm:min-w-[44px] hud-panel rounded-lg flex items-center justify-center text-slate-200 hover:text-yellow-400 hover:border-yellow-400/50 transition-colors cursor-pointer"
          >
            {save.settings.muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={() => onOpenSubModal('settings')}
            aria-label="Settings"
            className="min-h-[42px] sm:min-h-[44px] min-w-[42px] sm:min-w-[44px] hud-panel rounded-lg flex items-center justify-center text-slate-200 hover:text-yellow-400 hover:border-yellow-400/50 transition-colors cursor-pointer"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom Row: Left Command Deck (leaving center-right 3D showcase motorcycle wide open) */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 shrink-0">
        <div className="pointer-events-auto w-full max-w-[440px] hud-panel-amber hud-chamfer p-4 sm:p-6">
          <div className="flex items-center justify-between gap-2 text-[10px] font-mono-tabular uppercase tracking-[0.18em] text-amber-300/90 mb-2">
            <span>JAKARTA NIGHT STREET SURVIVAL</span>
            <span className="text-slate-400">{save.totalRuns} RUNS</span>
          </div>

          <div className="flex items-center gap-3">
            <img
              src="/pwa-192x192.png"
              alt="Ikon BEGAL RUSUH"
              referrerPolicy="no-referrer"
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border border-yellow-400/45 shadow-md shrink-0 object-cover"
            />
            <div
              onClick={handleLogoTap}
              className="cursor-pointer transition-transform active:scale-[0.99] min-w-0"
              title="BEGAL RUSUH"
            >
              <BegalLogoSvg />
            </div>
          </div>

          <p className="mt-2.5 text-xs text-slate-300/90 leading-relaxed">
            Balap motor &amp; aksi survival malam Indonesia — hajar komplotan begal rusuh, tolong warga, taklukkan rintangan jalanan, dan kumpulkan 8 motor &amp; 8 senjata.
          </p>

          {secretMessage && (
            <div className="mt-2 px-3 py-1.5 bg-yellow-400/15 border border-yellow-400/40 rounded text-xs font-mono-tabular font-bold text-yellow-300">
              {secretMessage}
            </div>
          )}

          {/* Active Motorcycle & Arsenal Quick Strip */}
          <div className="mt-4 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-display font-bold text-yellow-400 tracking-wide">
                {selectedBike.name}
              </span>
              <span className="text-slate-400 font-mono-tabular">
                {save.ownedBikes.length}/{BIKES.length} Kendaraan
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono-tabular text-slate-300">
              <span className="flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-sky-400" />
                {Math.round(bikeStats.maxSpeed * 3.6)} KM/H
              </span>
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                {bikeStats.maxHealth} HP
              </span>
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                {bikeStats.attackDamage} DMG
              </span>
              <span className="text-slate-400">{save.totalEnemiesDefeated} Takedowns</span>
            </div>
            <div className="mt-2 pt-2 border-t border-white/8 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-300">
              <span className="flex items-center gap-1.5">
                <Swords className="w-3.5 h-3.5 text-amber-400" />
                {equippedMelee.name}
              </span>
              <span className="flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-sky-400" />
                {equippedRanged.name}
              </span>
            </div>
          </div>

          {/* Primary Play + 2x2 Action Deck */}
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onStartSolo}
              className="col-span-2 min-h-[52px] px-5 py-3 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-300 hover:from-yellow-300 hover:to-amber-300 active:scale-[0.99] text-slate-950 font-display font-bold text-lg tracking-wider hud-chamfer-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-lg shadow-amber-500/20 whitespace-nowrap"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              MULAI BALAP SURVIVAL
            </button>

            <button
              type="button"
              onClick={onOpenGarage}
              className="min-h-[44px] px-3.5 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm rounded-lg border border-white/12 hover:border-yellow-400/40 flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Wrench className="w-4 h-4 text-yellow-400 shrink-0" />
              Garasi & Tune
            </button>

            <button
              type="button"
              onClick={() => onOpenSubModal('multiplayer')}
              className="min-h-[44px] px-3.5 py-2.5 bg-slate-900/95 hover:bg-slate-800 text-slate-200 font-semibold text-xs sm:text-sm rounded-lg border border-white/10 hover:border-red-400/40 flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Users className="w-4 h-4 text-red-400 shrink-0" />
              Multiplayer
            </button>

            <button
              type="button"
              onClick={() => onOpenSubModal('missions')}
              className="min-h-[44px] px-3.5 py-2.5 bg-slate-900/95 hover:bg-slate-800 text-slate-200 font-medium text-xs sm:text-sm rounded-lg border border-white/10 hover:border-yellow-400/40 flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Target className="w-4 h-4 text-yellow-400 shrink-0" />
              Misi ({save.completedMissionIds.length})
            </button>

            <button
              type="button"
              onClick={() => onOpenSubModal('achievements')}
              className="min-h-[44px] px-3.5 py-2.5 bg-slate-900/95 hover:bg-slate-800 text-slate-200 font-medium text-xs sm:text-sm rounded-lg border border-white/10 hover:border-emerald-400/40 flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Award className="w-4 h-4 text-emerald-400 shrink-0" />
              Prestasi & Egg
            </button>
          </div>

          <div className="mt-2.5 empty:hidden">
            <PWAInstallButton variant="card" />
          </div>
        </div>

        {/* Bottom-Right Compact Controls Strip */}
        <div className="pointer-events-auto hud-panel rounded-lg px-4 py-2.5 text-[11px] text-slate-300 font-mono-tabular hidden sm:flex items-center gap-3 max-w-full">
          <span className="text-yellow-400 font-bold shrink-0">KONTROL</span>
          <span className="truncate">
            A/D Belok · C Dash · Shift NOS · Space Lompat · F Pukul · R Tembak · T Jebakan · E EMP · Q Klakson · P Polisi
          </span>
        </div>
      </div>
    </div>
  );
};
