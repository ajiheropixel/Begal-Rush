import React from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Coins,
  Crosshair,
  Flame,
  Maximize2,
  Minimize2,
  Navigation,
  Pause,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Swords,
  Volume2,
  VolumeX,
  Wind,
  Zap,
} from 'lucide-react';
import {
  ControlInputState,
  GameSettings,
  HudState,
  TouchButtonScale,
  TouchSideOffset,
  TouchVerticalOffset,
} from '../types/game';
import { RoomSnapshot } from '../types/multiplayer';

interface GameplayHudProps {
  hud: HudState;
  settings: GameSettings;
  isTouchDevice: boolean;
  hasMultipleMelee?: boolean;
  hasMultipleRanged?: boolean;
  canFullscreen?: boolean;
  isFullscreen?: boolean;
  multiplayerRoom?: RoomSnapshot | null;
  localPlayerId?: string | null;
  spectating?: boolean;
  onLeaveMultiplayer?: () => void;
  onToggleFullscreen?: () => void;
  onCycleMelee?: () => void;
  onCycleRanged?: () => void;
  onPause: () => void;
  onToggleMute: () => void;
  onTouchInput: (key: keyof ControlInputState, pressed: boolean) => void;
}

const TOUCH_BOTTOM_OFFSET_CLASS: Record<TouchVerticalOffset, string> = {
  0: 'pb-0',
  1: 'pb-4 sm:pb-3',
  2: 'pb-8 sm:pb-6',
  3: 'pb-12 sm:pb-10',
};

const TOUCH_SIDE_OFFSET_CLASS: Record<TouchSideOffset, string> = {
  0: 'px-0',
  1: 'px-1.5 sm:px-3',
  2: 'px-3 sm:px-6',
  3: 'px-5 sm:px-9',
};

const STEER_BTN_SIZE: Record<TouchButtonScale, string> = {
  compact: 'w-11 h-11 sm:w-13 sm:h-13',
  normal: 'w-14 h-14 sm:w-16 sm:h-16',
  large: 'w-[60px] h-[60px] sm:w-[70px] sm:h-[70px]',
};

const DASH_BTN_SIZE: Record<TouchButtonScale, string> = {
  compact: 'h-8 sm:h-9 px-2 text-[10px]',
  normal: 'h-9 sm:h-11 px-2.5 sm:px-3 text-[11px] sm:text-xs',
  large: 'h-10 sm:h-12 px-3 text-xs',
};

const CLASSIC_TOP_BTN_SIZE: Record<TouchButtonScale, string> = {
  compact: 'w-10 h-9 sm:w-12 sm:h-10 text-[8px] sm:text-[9px]',
  normal: 'w-12 h-11 sm:w-14 sm:h-12 text-[9px] sm:text-[10px]',
  large: 'w-[52px] h-12 sm:w-16 sm:h-13 text-[10px] sm:text-[11px]',
};

const CLASSIC_MAIN_BTN_SIZE: Record<TouchButtonScale, string> = {
  compact: 'w-10 h-10 sm:w-12 sm:h-12 text-[10px]',
  normal: 'w-12 h-12 sm:w-14 sm:h-14 text-[10px] sm:text-xs',
  large: 'w-[52px] h-[52px] sm:w-16 sm:h-16 text-xs',
};

const ERGO_PAD_WIDTH: Record<TouchButtonScale, string> = {
  compact: 'w-[136px] sm:w-[164px]',
  normal: 'w-[158px] sm:w-[192px]',
  large: 'w-[176px] sm:w-[216px]',
};

const ERGO_SKILL_H: Record<TouchButtonScale, string> = {
  compact: 'h-8 sm:h-9 text-[8px] sm:text-[9px]',
  normal: 'h-9 sm:h-10 text-[9px] sm:text-[10px]',
  large: 'h-10 sm:h-11 text-[10px]',
};

const ERGO_MID_H: Record<TouchButtonScale, string> = {
  compact: 'h-9 sm:h-10 text-[9px] sm:text-[10px]',
  normal: 'h-10 sm:h-12 text-[10px] sm:text-[11px]',
  large: 'h-11 sm:h-13 text-[11px] sm:text-xs',
};

const ERGO_PRIMARY_H: Record<TouchButtonScale, string> = {
  compact: 'h-12 sm:h-14 text-[11px] sm:text-xs',
  normal: 'h-[52px] sm:h-16 text-xs sm:text-sm',
  large: 'h-[60px] sm:h-[70px] text-xs sm:text-sm',
};

export const GameplayHud: React.FC<GameplayHudProps> = ({
  hud,
  settings,
  isTouchDevice,
  hasMultipleMelee = false,
  hasMultipleRanged = false,
  canFullscreen = false,
  isFullscreen = false,
  multiplayerRoom = null,
  localPlayerId = null,
  spectating = false,
  onLeaveMultiplayer,
  onToggleFullscreen,
  onCycleMelee,
  onCycleRanged,
  onPause,
  onToggleMute,
  onTouchInput,
}) => {
  const hpPct = Math.max(0, Math.min(100, (hud.health / Math.max(1, hud.maxHealth)) * 100));
  const nosPct = Math.max(0, Math.min(100, hud.nosFuel * 100));
  const speedPct = Math.max(4, Math.min(100, Math.round((hud.speedKmh / 240) * 100)));
  const showTouch =
    settings.touchControls === 'always' ||
    (settings.touchControls === 'auto' && isTouchDevice);

  const touchScale = settings.touchScale ?? 'normal';
  const touchVerticalOffset = settings.touchVerticalOffset ?? 1;
  const touchSideOffset = settings.touchSideOffset ?? 0;
  const touchPadLayout = settings.touchPadLayout ?? 'ergo';
  const hudAlertMode = settings.hudAlertMode ?? 'compact';

  const bindTouch = (key: keyof ControlInputState) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      onTouchInput(key, true);
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      onTouchInput(key, false);
    },
    onPointerCancel: () => onTouchInput(key, false),
    onPointerLeave: () => onTouchInput(key, false),
  });

  // Pick single non-obstructive priority top alert pill so alerts never stack over the road horizon
  let priorityAlert: {
    text: string;
    toneClass: string;
    icon: 'fire' | 'hazard' | 'nav' | 'shield' | null;
  } | null = null;

  if (hudAlertMode !== 'off') {
    if (hud.incomingFireWarning) {
      priorityAlert = {
        text: 'TEMBAKAN MUSUH · HINDAR!',
        toneClass: 'bg-rose-950/80 border-rose-400/75 text-rose-200',
        icon: 'fire',
      };
    } else if (hud.barricadeAhead) {
      priorityAlert = {
        text: 'BARIKADE BEGAL · BELOK / LOMPAT',
        toneClass: 'bg-orange-950/80 border-orange-400/75 text-orange-200',
        icon: 'hazard',
      };
    } else if (hud.roadHazardWarning) {
      priorityAlert = {
        text:
          hud.roadHazardWarning === 'pasar_malam'
            ? 'PASAR MALAM · AMBIL TENGAH'
            : hud.roadHazardWarning === 'tukang_parkir'
            ? 'AWAS MOBIL KELUAR PARKIR!'
            : 'PESEPEDA DI PINGGIR JALAN',
        toneClass:
          hud.roadHazardWarning === 'pasar_malam'
            ? 'bg-fuchsia-950/80 border-fuchsia-400/70 text-fuchsia-200'
            : hud.roadHazardWarning === 'tukang_parkir'
            ? 'bg-amber-950/80 border-amber-400/70 text-amber-200'
            : 'bg-emerald-950/80 border-emerald-400/70 text-emerald-200',
        icon: 'hazard',
      };
    } else if (hud.civilianDistressActive) {
      priorityAlert = {
        text: 'WARGA DIBEGAL · BANTU SERANG!',
        toneClass: 'bg-amber-950/80 border-amber-400/75 text-amber-200',
        icon: 'hazard',
      };
    } else if (hud.policeRaidActive) {
      priorityAlert = {
        text: 'RAZIYA POLISI AKTIF',
        toneClass: 'bg-sky-950/80 border-sky-400/75 text-sky-200',
        icon: 'shield',
      };
    } else if (hudAlertMode === 'compact') {
      if (hud.statusBanner) {
        priorityAlert = {
          text: hud.statusBanner,
          toneClass: 'bg-slate-950/78 border-yellow-400/65 text-yellow-200',
          icon: null,
        };
      } else if (hud.slipstreamActive) {
        priorityAlert = {
          text: 'SLIPSTREAM +22% SPEED',
          toneClass: 'bg-cyan-950/78 border-cyan-400/65 text-cyan-200',
          icon: 'nav',
        };
      } else if (hud.lockedEnemyDistance !== null) {
        priorityAlert = {
          text: `LOCK BEGAL ${hud.lockedEnemyDistance}m · TEMBAK [R]`,
          toneClass: 'bg-slate-950/72 border-amber-400/50 text-amber-200',
          icon: 'fire',
        };
      }
    }
  }

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.65rem,env(safe-area-inset-bottom))] pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] sm:p-5">
      {/* Impact Damage Vignette */}
      {hud.damageFlash > 0.02 && (
        <div
          className="fixed inset-0 pointer-events-none border-[8px] border-red-600/80 transition-opacity"
          style={{ opacity: hud.damageFlash * 0.72 }}
        />
      )}

      {/* Side Flank Warning Indicators */}
      {hud.dangerLeft && (
        <div className="fixed left-1.5 top-1/2 -translate-y-1/2 bg-red-600/80 border border-red-300/60 text-white px-1.5 sm:px-2.5 py-2 sm:py-3 rounded-r-lg flex items-center gap-1 font-display text-[10px] sm:text-xs font-bold shadow-md">
          <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          BEGAL KIRI
        </div>
      )}
      {hud.dangerRight && (
        <div className="fixed right-1.5 top-1/2 -translate-y-1/2 bg-red-600/80 border border-red-300/60 text-white px-1.5 sm:px-2.5 py-2 sm:py-3 rounded-l-lg flex items-center gap-1 font-display text-[10px] sm:text-xs font-bold shadow-md">
          BEGAL KANAN
          <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
      )}

      {/* Top HUD Telemetry Row */}
      <div className="flex items-start justify-between gap-1.5 sm:gap-3">
        {/* Top-Left: Bike Armor, NOS Tank, Tactical Gadget Grid & Street Reputation Cap */}
        <div className="hud-panel hud-chamfer-sm p-1.5 sm:p-3 w-[144px] sm:w-64 shrink-0">
          {/* HP Telemetry */}
          <div className="flex items-center justify-between text-[9px] sm:text-[11px] mb-0.5 sm:mb-1">
            <span className="font-semibold tracking-wider text-slate-300">ARMOR</span>
            <span className="font-mono-tabular font-bold text-white">
              {hud.health}/{hud.maxHealth}
            </span>
          </div>
          <div className="h-1.5 sm:h-2.5 bg-slate-900 rounded-xs overflow-hidden border border-white/10">
            <div
              className={`h-full transition-all duration-100 ${
                hpPct > 55
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-300'
                  : hpPct > 28
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-300'
                  : 'bg-gradient-to-r from-red-600 to-rose-400'
              }`}
              style={{ width: `${hpPct}%` }}
            />
          </div>

          {/* NOS Telemetry */}
          <div className="flex items-center justify-between text-[9px] sm:text-[11px] mt-1 sm:mt-2 mb-0.5 sm:mb-1">
            <span className="font-semibold text-sky-300 flex items-center gap-1 tracking-wider">
              <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
              NOS
            </span>
            <span
              className={`font-mono-tabular text-[9px] sm:text-[10px] font-bold ${
                hud.nosActive
                  ? 'text-yellow-300'
                  : hud.nosCooldownRatio >= 1
                  ? 'text-sky-300'
                  : 'text-slate-400'
              }`}
            >
              {hud.nosActive ? 'BOOST' : hud.nosCooldownRatio >= 1 ? 'SIAP' : 'CHARGING'}
            </span>
          </div>
          <div className="h-1.5 sm:h-2 bg-slate-900 rounded-xs overflow-hidden border border-white/10">
            <div
              className={`h-full transition-all duration-75 ${
                hud.nosActive
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-200'
                  : hud.nosCooldownRatio >= 1
                  ? 'bg-gradient-to-r from-sky-500 to-cyan-300'
                  : 'bg-sky-800'
              }`}
              style={{ width: `${nosPct}%` }}
            />
          </div>

          {/* Equipped Arsenal Strip */}
          <div className="mt-1.5 sm:mt-2.5 grid grid-cols-2 gap-1 sm:gap-1.5 text-[9px] sm:text-[10px]">
            <button
              type="button"
              onClick={hasMultipleMelee ? onCycleMelee : undefined}
              disabled={!hasMultipleMelee}
              className={`pointer-events-auto bg-slate-900/95 border border-white/10 rounded px-1 sm:px-2 py-0.5 sm:py-1 text-left transition-colors ${
                hasMultipleMelee ? 'hover:border-yellow-400/50 cursor-pointer' : 'cursor-default'
              }`}
              title={hasMultipleMelee ? 'Ketuk untuk Ganti Senjata Melee [1]' : hud.meleeWeaponName}
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-0.5 sm:gap-1">
                  <Swords className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
                  <span className="hidden sm:inline">[F]</span>
                </span>
                {hasMultipleMelee && (
                  <span className="text-yellow-400 font-mono-tabular text-[8px] sm:text-[9px]">SWAP</span>
                )}
              </div>
              <div className="font-semibold text-white truncate mt-0.5">{hud.meleeWeaponName}</div>
            </button>

            <button
              type="button"
              onClick={hasMultipleRanged ? onCycleRanged : undefined}
              disabled={!hasMultipleRanged}
              className={`pointer-events-auto rounded px-1 sm:px-2 py-0.5 sm:py-1 text-left transition-colors border ${
                hud.rangedAmmo <= 0
                  ? 'bg-rose-950/75 border-rose-500/75'
                  : 'bg-slate-900/95 border-white/10'
              } ${
                hasMultipleRanged ? 'hover:border-sky-400/50 cursor-pointer' : 'cursor-default'
              }`}
              title={hasMultipleRanged ? 'Ketuk untuk Ganti Senjata Tembak [2]' : hud.rangedWeaponName}
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-0.5 sm:gap-1">
                  <Crosshair
                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${hud.rangedAmmo <= 0 ? 'text-rose-400' : 'text-sky-400'}`}
                  />
                  <span className="hidden sm:inline">[R]</span>
                </span>
                <span
                  className={`font-mono-tabular font-bold ${
                    hud.rangedAmmo <= 0
                      ? 'text-rose-400'
                      : hud.rangedAmmo <= 2
                      ? 'text-amber-300'
                      : 'text-white'
                  }`}
                >
                  {hud.rangedAmmo}/{hud.rangedMaxAmmo}
                </span>
              </div>
              <div
                className={`font-semibold truncate mt-0.5 ${
                  hud.rangedAmmo <= 0 ? 'text-amber-300' : 'text-sky-200'
                }`}
              >
                {hud.rangedAmmo <= 0 ? 'HABIS' : hud.rangedWeaponName}
              </div>
            </button>
          </div>

          {/* Compact Tactical Ability Matrix */}
          <div className="mt-1 sm:mt-1.5 grid grid-cols-3 gap-1 sm:gap-1.5 text-[8px] sm:text-[10px]">
            <div className="bg-slate-900/90 border border-white/8 rounded px-1 sm:px-1.5 py-0.5 sm:py-1 flex items-center justify-between">
              <span className="flex items-center gap-0.5 text-slate-300">
                <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-cyan-400" />
                <span className="hidden sm:inline">[E]</span>
              </span>
              <span
                className={`font-mono-tabular font-bold ${
                  hud.empReadyRatio >= 1 ? 'text-cyan-300' : 'text-slate-500'
                }`}
              >
                {hud.empReadyRatio >= 1 ? 'RDY' : `${Math.round(hud.empReadyRatio * 100)}%`}
              </span>
            </div>

            <div className="bg-slate-900/90 border border-white/8 rounded px-1 sm:px-1.5 py-0.5 sm:py-1 flex items-center justify-between">
              <span className="flex items-center gap-0.5 text-slate-300">
                <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-rose-400" />
                <span className="hidden sm:inline">[T]</span>
              </span>
              <span
                className={`font-mono-tabular font-bold ${
                  hud.trapReadyRatio >= 1 ? 'text-yellow-300' : 'text-slate-500'
                }`}
              >
                {hud.trapReadyRatio >= 1 ? 'RDY' : `${Math.round(hud.trapReadyRatio * 100)}%`}
              </span>
            </div>

            <div className="bg-slate-900/90 border border-white/8 rounded px-1 sm:px-1.5 py-0.5 sm:py-1 flex items-center justify-between">
              <span className="flex items-center gap-0.5 text-slate-300">
                <Wind className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400" />
                <span className="hidden sm:inline">[C]</span>
              </span>
              <span
                className={`font-mono-tabular font-bold ${
                  hud.dashReadyRatio >= 1 ? 'text-emerald-300' : 'text-slate-500'
                }`}
              >
                {hud.dashReadyRatio >= 1 ? 'RDY' : `${Math.round(hud.dashReadyRatio * 100)}%`}
              </span>
            </div>
          </div>

          {/* Cap Jalanan / Reputation Stamp */}
          <div className="mt-1 sm:mt-2 pt-1 sm:pt-2 border-t border-white/10 flex items-center justify-between text-[9px] sm:text-[11px]">
            <span className="flex items-center gap-1 font-display font-bold tracking-wide truncate">
              {hud.karmaCap === 'pelindung' ? (
                <>
                  <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-emerald-300 truncate">PELINDUNG</span>
                </>
              ) : hud.karmaCap === 'egois' ? (
                <>
                  <ShieldAlert className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-400 shrink-0" />
                  <span className="text-red-300 truncate">EGOIS</span>
                </>
              ) : (
                <>
                  <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-300 truncate">NETRAL</span>
                </>
              )}
            </span>
            <span className="font-mono-tabular text-slate-400 shrink-0" title="Warga Ditolong / Diabaikan">
              {hud.civiliansSaved}T · {hud.civiliansIgnored}A
            </span>
          </div>
        </div>

        {/* Top-Center: Distance Odometer, Zone Tag & Non-Intrusive Slim Top Alert */}
        <div className="flex flex-col items-center gap-1 min-w-0">
          <div className="hud-panel hud-chamfer-sm px-2 sm:px-5 py-1 sm:py-2 text-center min-w-[78px] sm:min-w-[144px]">
            <div className="font-display text-base sm:text-3xl font-bold text-white tabular-nums leading-none tracking-tight">
              {hud.distanceMeters >= 1000
                ? `${(hud.distanceMeters / 1000).toFixed(2)} km`
                : `${hud.distanceMeters} m`}
            </div>
            <div className="text-[8px] sm:text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.16em] text-amber-300 font-semibold mt-0.5 sm:mt-1 truncate max-w-[82px] sm:max-w-none">
              {hud.biomeName}
            </div>
          </div>

          <div className="fixed top-[max(7.6rem,calc(env(safe-area-inset-top)+7.1rem))] sm:static left-1/2 -translate-x-1/2 sm:translate-x-0 z-10 w-[calc(100vw-1.5rem)] max-w-xs sm:w-auto sm:max-w-md flex flex-col items-center gap-1 pointer-events-none text-center">
            {hud.bossActive && (
              <div className="bg-red-950/75 backdrop-blur-xs border border-red-400/60 rounded-md px-3 py-1 w-44 sm:w-64 shadow-sm">
                <div className="flex items-center justify-between text-[9px] sm:text-[11px] font-display font-bold text-red-200 mb-0.5">
                  <span>BOSS RIDER</span>
                  <span className="font-mono-tabular">{Math.round(hud.bossHealthRatio * 100)}%</span>
                </div>
                <div className="h-1.5 bg-black/60 rounded-xs overflow-hidden border border-red-500/40">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 to-rose-400"
                    style={{ width: `${Math.round(hud.bossHealthRatio * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {hud.pickupBossActive && (
              <div className="bg-orange-950/75 backdrop-blur-xs border border-orange-400/65 rounded-md px-3 py-1 w-48 sm:w-64 shadow-sm">
                <div className="flex items-center justify-between text-[9px] sm:text-[11px] font-display font-bold text-orange-200 mb-0.5">
                  <span>BEGAL PICK-UP</span>
                  <span className="font-mono-tabular">
                    {Math.round(hud.pickupBossHealthRatio * 100)}%
                  </span>
                </div>
                <div className="h-1.5 bg-black/60 rounded-xs overflow-hidden border border-orange-500/40">
                  <div
                    className="h-full bg-gradient-to-r from-orange-600 to-amber-400"
                    style={{ width: `${Math.round(hud.pickupBossHealthRatio * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {priorityAlert && (
              <div
                className={`backdrop-blur-xs border font-display font-semibold text-[10px] sm:text-xs px-3 py-0.5 sm:py-1 rounded-full shadow-sm tracking-wide flex items-center gap-1.5 max-w-full ${priorityAlert.toneClass}`}
              >
                {priorityAlert.icon === 'fire' && <Crosshair className="w-3 h-3 shrink-0" />}
                {priorityAlert.icon === 'hazard' && <AlertTriangle className="w-3 h-3 shrink-0" />}
                {priorityAlert.icon === 'nav' && <Navigation className="w-3 h-3 shrink-0" />}
                {priorityAlert.icon === 'shield' && <Shield className="w-3 h-3 shrink-0" />}
                <span className="truncate">{priorityAlert.text}</span>
              </div>
            )}
          </div>
        </div>

        {/* Top-Right: Audio/Fullscreen/Pause, Run Score, Mobile Speedometer & Police Ult */}
        <div className="flex flex-col items-end gap-1 sm:gap-2 shrink-0">
          <div className="pointer-events-auto flex items-center gap-1 sm:gap-2">
            {canFullscreen && onToggleFullscreen && (
              <button
                type="button"
                onClick={onToggleFullscreen}
                aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                className="min-h-[36px] min-w-[36px] sm:min-h-[44px] sm:min-w-[44px] hud-panel rounded-lg flex items-center justify-center text-slate-200 hover:text-yellow-400 cursor-pointer"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            )}
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={settings.muted ? 'Unmute' : 'Mute'}
              className="min-h-[36px] min-w-[36px] sm:min-h-[44px] sm:min-w-[44px] hud-panel rounded-lg flex items-center justify-center text-slate-200 hover:text-yellow-400 cursor-pointer"
            >
              {settings.muted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            <button
              type="button"
              onClick={onPause}
              aria-label="Pause Game"
              className="min-h-[36px] min-w-[36px] sm:min-h-[44px] sm:min-w-[44px] hud-panel rounded-lg flex items-center justify-center text-slate-200 hover:text-yellow-400 cursor-pointer"
            >
              <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          <div className="hud-panel rounded-lg px-2 sm:px-3.5 py-1 sm:py-2 flex items-center gap-2 sm:gap-3.5 text-[10px] sm:text-xs">
            <div className="flex items-center gap-1">
              <Coins className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
              <span className="font-mono-tabular font-bold text-white">+{hud.runCoins}</span>
            </div>
            <div className="flex items-center gap-1">
              <Swords className="w-3 h-3 sm:w-4 sm:h-4 text-rose-400" />
              <span className="font-mono-tabular font-bold text-white">{hud.enemiesDefeated}</span>
            </div>
            {hud.comboCount > 1 && (
              <div className="font-display font-bold text-amber-300">
                {hud.comboCount}x
              </div>
            )}
            <div className="text-[11px] font-mono-tabular text-sky-300 hidden sm:block">
              {hud.nearMissCount} Near
            </div>
          </div>

          {showTouch && (
            <div className="sm:hidden hud-panel-amber hud-chamfer-sm px-2 py-1 text-right min-w-[84px]">
              <div className="flex items-baseline justify-end gap-1">
                <span
                  className={`font-display text-lg font-bold tabular-nums leading-none ${
                    hud.nosActive ? 'text-yellow-300' : 'text-white'
                  }`}
                >
                  {hud.speedKmh}
                </span>
                <span className="text-[8px] font-mono-tabular text-amber-300 font-semibold">KM/H</span>
              </div>
              <div className="mt-0.5 h-1 w-full bg-slate-900 rounded-xs overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-400 via-amber-400 to-rose-500"
                  style={{ width: `${speedPct}%` }}
                />
              </div>
            </div>
          )}

          {hud.policeUltCharges > 0 && !spectating && (
            <button
              type="button"
              {...bindTouch('policeUlt')}
              className="pointer-events-auto min-h-[36px] sm:min-h-[44px] px-2.5 sm:px-3.5 py-1 sm:py-2 bg-gradient-to-r from-sky-400 to-cyan-300 hover:from-sky-300 hover:to-cyan-200 active:bg-yellow-400 text-slate-950 font-display font-bold text-[10px] sm:text-xs rounded-lg border-2 border-white/80 cursor-pointer flex items-center gap-1 whitespace-nowrap shadow-lg shadow-sky-500/30 touch-none select-none"
            >
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              POLISI ({hud.policeUltCharges}x)
            </button>
          )}

          {/* Compact Multiplayer Live Standings Strip */}
          {multiplayerRoom && (
            <div className="hud-panel rounded-lg px-2 py-1.5 w-[132px] sm:w-48 space-y-0.5 text-[9px] sm:text-[10px]">
              <div className="flex items-center justify-between text-amber-300 font-display font-bold border-b border-white/10 pb-0.5 mb-0.5">
                <span>{multiplayerRoom.mode === 'coop' ? 'CO-OP' : 'DUEL'}</span>
                <span className="font-mono-tabular">
                  {multiplayerRoom.targetDistance > 0
                    ? `${multiplayerRoom.targetDistance}m`
                    : `#${multiplayerRoom.code}`}
                </span>
              </div>
              {[...multiplayerRoom.players]
                .sort((a, b) => b.distanceMeters - a.distanceMeters)
                .map((p, idx) => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between gap-1 ${
                      p.id === localPlayerId ? 'text-yellow-300 font-bold' : 'text-slate-300'
                    } ${!p.alive ? 'opacity-50 line-through' : ''}`}
                  >
                    <span className="truncate">
                      {idx + 1}. {p.name}
                    </span>
                    <span className="font-mono-tabular shrink-0">{p.distanceMeters}m</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Spectate Banner (when local rider crashes early while multiplayer match continues) */}
      {spectating && multiplayerRoom && (
        <div className="pointer-events-auto mx-auto hud-panel-amber rounded-xl px-4 py-3 text-center max-w-xs space-y-2">
          <div className="font-display text-sm font-bold text-amber-300">
            MOTOR TUMBANG · MENONTON RIDER LAIN
          </div>
          <p className="text-[11px] text-slate-300">
            Menunggu rider lain mencapai garis finis atau hasil akhir ronde...
          </p>
          {onLeaveMultiplayer && (
            <button
              type="button"
              onClick={onLeaveMultiplayer}
              className="min-h-[36px] px-4 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-200 text-xs font-semibold rounded-lg cursor-pointer"
            >
              Keluar Room Sekarang
            </button>
          )}
        </div>
      )}

      {/* Bottom Telemetry & Controls Row (Customizable Android Touch Layout & Offsets) */}
      <div
        className={`flex items-end justify-between gap-2 sm:gap-4 ${
          showTouch && settings.touchSwapped ? 'flex-row-reverse' : ''
        } ${
          showTouch
            ? `${TOUCH_BOTTOM_OFFSET_CLASS[touchVerticalOffset]} ${TOUCH_SIDE_OFFSET_CLASS[touchSideOffset]}`
            : ''
        }`}
      >
        {showTouch ? (
          <div className="pointer-events-auto flex flex-col gap-1.5 sm:gap-2 touch-none select-none">
            <button
              type="button"
              {...bindTouch('dash')}
              className={`${DASH_BTN_SIZE[touchScale]} rounded-lg border font-bold whitespace-nowrap touch-none select-none ${
                hud.dashReadyRatio >= 1
                  ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 active:bg-emerald-400 active:text-slate-950'
                  : 'bg-slate-900/80 border-white/10 text-slate-500'
              }`}
            >
              EVADE DASH
            </button>
            <div className="flex items-center gap-2 sm:gap-2.5">
              <button
                type="button"
                {...bindTouch('left')}
                aria-label="Steer Left"
                className={`${STEER_BTN_SIZE[touchScale]} hud-panel active:bg-yellow-400 active:text-slate-950 border border-white/25 rounded-xl flex items-center justify-center text-white touch-none select-none`}
              >
                <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" />
              </button>
              <button
                type="button"
                {...bindTouch('right')}
                aria-label="Steer Right"
                className={`${STEER_BTN_SIZE[touchScale]} hud-panel active:bg-yellow-400 active:text-slate-950 border border-white/25 rounded-xl flex items-center justify-center text-white touch-none select-none`}
              >
                <ArrowRight className="w-6 h-6 sm:w-7 sm:h-7" />
              </button>
            </div>
          </div>
        ) : (
          <div className="hud-panel rounded-lg px-3.5 py-1.5 text-[11px] font-mono-tabular text-slate-300 hidden md:block">
            A/D Belok · C Dash · Shift NOS · Space Lompat · F Pukul · R Tembak · 1/2 Senjata · T Trap · E EMP · Q Klakson · P Polisi
          </div>
        )}

        {/* Digital Tachometer Speedometer (Desktop & Tablet/Landscape; Mobile Touch uses Top-Right Speedometer) */}
        <div
          className={`hud-panel-amber hud-chamfer-sm px-4 py-2.5 text-right min-w-[155px] ${
            showTouch ? 'hidden sm:block mx-auto' : 'ml-auto'
          }`}
        >
          <div className="flex items-baseline justify-end gap-1.5">
            <span
              className={`font-display text-3xl sm:text-4xl font-bold tabular-nums leading-none ${
                hud.nosActive ? 'text-yellow-300' : 'text-white'
              }`}
            >
              {hud.speedKmh}
            </span>
            <span className="text-[11px] font-mono-tabular text-amber-300 font-semibold">KM/H</span>
          </div>
          {/* Progressive Tachometer Strip */}
          <div className="mt-1.5 h-1.5 w-full bg-slate-900 rounded-xs overflow-hidden border border-white/10">
            <div
              className={`h-full transition-all duration-75 ${
                hud.nosActive
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-white'
                  : 'bg-gradient-to-r from-sky-400 via-amber-400 to-rose-500'
              }`}
              style={{ width: `${speedPct}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono-tabular">
            {hud.activeEnemyCount} Aktif · {hud.enemiesEngaged} Terlibat
          </div>
        </div>

        {/* Action Touch Controls (Ergo Thumb Layout or Classic 3x3 Grid) */}
        {showTouch &&
          (touchPadLayout === 'ergo' ? (
            <div
              className={`pointer-events-auto flex flex-col gap-1.5 touch-none select-none ${ERGO_PAD_WIDTH[touchScale]}`}
            >
              {/* Row 1: Compact Tactical Skills */}
              <div className="grid grid-cols-4 gap-1">
                <button
                  type="button"
                  {...bindTouch('ranged')}
                  className={`${ERGO_SKILL_H[touchScale]} border rounded-lg font-bold touch-none select-none ${
                    hud.rangedAmmo > 0
                      ? 'bg-sky-500/30 border-sky-400 text-sky-200 active:bg-sky-400 active:text-slate-950'
                      : 'bg-rose-950/80 border-rose-500/60 text-rose-300'
                  }`}
                >
                  {hud.rangedAmmo > 0 ? `SHT(${hud.rangedAmmo})` : 'HABIS'}
                </button>
                <button
                  type="button"
                  {...bindTouch('trap')}
                  className={`${ERGO_SKILL_H[touchScale]} border rounded-lg font-bold touch-none select-none ${
                    hud.trapReadyRatio >= 1
                      ? 'bg-red-500/30 border-red-400 text-red-200 active:bg-red-400 active:text-slate-950'
                      : 'bg-slate-900/80 border-white/10 text-slate-500'
                  }`}
                >
                  TRAP
                </button>
                <button
                  type="button"
                  {...bindTouch('emp')}
                  className={`${ERGO_SKILL_H[touchScale]} border rounded-lg font-bold touch-none select-none ${
                    hud.empReadyRatio >= 1
                      ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 active:bg-cyan-400 active:text-slate-950'
                      : 'bg-slate-900/80 border-white/10 text-slate-500'
                  }`}
                >
                  EMP
                </button>
                <button
                  type="button"
                  {...bindTouch('emote')}
                  className={`${ERGO_SKILL_H[touchScale]} bg-slate-900/95 active:bg-yellow-400 active:text-slate-950 border border-white/20 rounded-lg font-bold text-slate-200 touch-none select-none`}
                >
                  KLK
                </button>
              </div>

              {/* Row 2: Brake, NOS & Jump */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  {...bindTouch('brake')}
                  className={`${ERGO_MID_H[touchScale]} bg-red-950/90 active:bg-red-500 border border-red-500/45 rounded-lg font-bold text-red-200 touch-none select-none`}
                >
                  REM
                </button>
                <button
                  type="button"
                  {...bindTouch('nos')}
                  className={`${ERGO_MID_H[touchScale]} border rounded-lg font-bold touch-none select-none ${
                    hud.nosCooldownRatio >= 1
                      ? 'bg-yellow-400/30 border-yellow-400 text-yellow-300 active:bg-yellow-400 active:text-slate-950'
                      : 'bg-slate-900/80 border-white/10 text-slate-500'
                  }`}
                >
                  NOS
                </button>
                <button
                  type="button"
                  {...bindTouch('jump')}
                  className={`${ERGO_MID_H[touchScale]} bg-slate-800/95 active:bg-yellow-400 active:text-slate-950 border border-white/20 rounded-lg flex items-center justify-center gap-0.5 font-bold text-white touch-none select-none`}
                >
                  <ArrowUp className="w-3 h-3" />
                  LOMPAT
                </button>
              </div>

              {/* Row 3: Oversized Primary Thumb Buttons (GAS & PUKUL) */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  {...bindTouch('throttle')}
                  className={`${ERGO_PRIMARY_H[touchScale]} bg-emerald-600/90 active:bg-emerald-500 border border-emerald-400/55 rounded-xl font-display font-bold text-white touch-none select-none shadow-md`}
                >
                  GAS
                </button>
                <button
                  type="button"
                  {...bindTouch('attack')}
                  className={`${ERGO_PRIMARY_H[touchScale]} bg-yellow-400 active:bg-yellow-300 text-slate-950 rounded-xl flex items-center justify-center gap-1.5 font-display font-bold touch-none select-none shadow-md`}
                >
                  <Swords className="w-4 h-4" />
                  PUKUL
                </button>
              </div>
            </div>
          ) : (
            <div className="pointer-events-auto grid grid-cols-3 gap-1.5 sm:gap-2 touch-none select-none">
              <button
                type="button"
                {...bindTouch('ranged')}
                className={`${CLASSIC_TOP_BTN_SIZE[touchScale]} border rounded-lg font-bold touch-none select-none ${
                  hud.rangedAmmo > 0
                    ? 'bg-sky-500/30 border-sky-400 text-sky-200 active:bg-sky-400 active:text-slate-950'
                    : 'bg-rose-950/80 border-rose-500/60 text-rose-300'
                }`}
              >
                {hud.rangedAmmo > 0 ? `SHOT (${hud.rangedAmmo})` : 'HABIS (0)'}
              </button>
              <button
                type="button"
                {...bindTouch('trap')}
                className={`${CLASSIC_TOP_BTN_SIZE[touchScale]} border rounded-lg font-bold touch-none select-none ${
                  hud.trapReadyRatio >= 1
                    ? 'bg-red-500/30 border-red-400 text-red-200 active:bg-red-400 active:text-slate-950'
                    : 'bg-slate-900/80 border-white/10 text-slate-500'
                }`}
              >
                TRAP
              </button>
              <button
                type="button"
                {...bindTouch('emp')}
                className={`${CLASSIC_TOP_BTN_SIZE[touchScale]} border rounded-lg font-bold touch-none select-none ${
                  hud.empReadyRatio >= 1
                    ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 active:bg-cyan-400 active:text-slate-950'
                    : 'bg-slate-900/80 border-white/10 text-slate-500'
                }`}
              >
                EMP
              </button>

              <button
                type="button"
                {...bindTouch('emote')}
                className={`${CLASSIC_TOP_BTN_SIZE[touchScale]} bg-slate-900/95 active:bg-yellow-400 active:text-slate-950 border border-white/20 rounded-lg font-bold text-slate-200 touch-none select-none`}
              >
                KLAKSON
              </button>
              <button
                type="button"
                {...bindTouch('nos')}
                className={`${CLASSIC_TOP_BTN_SIZE[touchScale]} border rounded-lg font-bold touch-none select-none ${
                  hud.nosCooldownRatio >= 1
                    ? 'bg-yellow-400/30 border-yellow-400 text-yellow-300 active:bg-yellow-400 active:text-slate-950'
                    : 'bg-slate-900/80 border-white/10 text-slate-500'
                }`}
              >
                NOS
              </button>
              <button
                type="button"
                {...bindTouch('jump')}
                className={`${CLASSIC_TOP_BTN_SIZE[touchScale]} bg-slate-800/95 active:bg-yellow-400 active:text-slate-950 border border-white/20 rounded-lg flex flex-col items-center justify-center font-bold text-white touch-none select-none`}
              >
                <ArrowUp className="w-3.5 h-3.5" />
                LOMPAT
              </button>

              <button
                type="button"
                {...bindTouch('brake')}
                className={`${CLASSIC_MAIN_BTN_SIZE[touchScale]} bg-red-950/90 active:bg-red-500 border border-red-500/45 rounded-lg font-bold text-red-200 touch-none select-none`}
              >
                REM
              </button>
              <button
                type="button"
                {...bindTouch('throttle')}
                className={`${CLASSIC_MAIN_BTN_SIZE[touchScale]} bg-emerald-600/90 active:bg-emerald-500 border border-emerald-400/45 rounded-lg font-bold text-white touch-none select-none`}
              >
                GAS
              </button>
              <button
                type="button"
                {...bindTouch('attack')}
                className={`${CLASSIC_MAIN_BTN_SIZE[touchScale]} bg-yellow-400 active:bg-yellow-300 text-slate-950 rounded-lg flex flex-col items-center justify-center font-bold touch-none select-none`}
              >
                <Swords className="w-4 h-4" />
                PUKUL
              </button>
            </div>
          ))}
      </div>
    </div>
  );
};
