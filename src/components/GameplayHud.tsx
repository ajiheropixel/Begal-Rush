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
import { ControlInputState, GameSettings, HudState } from '../types/game';

interface GameplayHudProps {
  hud: HudState;
  settings: GameSettings;
  isTouchDevice: boolean;
  hasMultipleMelee?: boolean;
  hasMultipleRanged?: boolean;
  canFullscreen?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onCycleMelee?: () => void;
  onCycleRanged?: () => void;
  onPause: () => void;
  onToggleMute: () => void;
  onTouchInput: (key: keyof ControlInputState, pressed: boolean) => void;
}

export const GameplayHud: React.FC<GameplayHudProps> = ({
  hud,
  settings,
  isTouchDevice,
  hasMultipleMelee = false,
  hasMultipleRanged = false,
  canFullscreen = false,
  isFullscreen = false,
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

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between pt-[max(0.6rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.6rem,env(safe-area-inset-left))] pr-[max(0.6rem,env(safe-area-inset-right))] sm:p-5">
      {/* Impact Damage Vignette */}
      {hud.damageFlash > 0.02 && (
        <div
          className="fixed inset-0 pointer-events-none border-[10px] border-red-600/85 transition-opacity"
          style={{ opacity: hud.damageFlash * 0.78 }}
        />
      )}

      {/* Side Flank Warning Indicators */}
      {hud.dangerLeft && (
        <div className="fixed left-2 top-1/2 -translate-y-1/2 bg-red-600/95 border border-red-300/60 text-white px-2.5 py-3 rounded-r-lg flex items-center gap-1.5 font-display text-xs font-bold shadow-lg">
          <AlertTriangle className="w-4 h-4" />
          BEGAL KIRI
        </div>
      )}
      {hud.dangerRight && (
        <div className="fixed right-2 top-1/2 -translate-y-1/2 bg-red-600/95 border border-red-300/60 text-white px-2.5 py-3 rounded-l-lg flex items-center gap-1.5 font-display text-xs font-bold shadow-lg">
          BEGAL KANAN
          <AlertTriangle className="w-4 h-4" />
        </div>
      )}

      {/* Top HUD Telemetry Row */}
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        {/* Top-Left: Bike Armor, NOS Tank, Tactical Gadget Grid & Street Reputation Cap */}
        <div className="hud-panel hud-chamfer-sm p-2 sm:p-3 w-[166px] sm:w-64 shrink-0">
          {/* HP Telemetry */}
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] mb-1">
            <span className="font-semibold tracking-wider text-slate-300">ARMOR</span>
            <span className="font-mono-tabular font-bold text-white">
              {hud.health}/{hud.maxHealth}
            </span>
          </div>
          <div className="h-2.5 bg-slate-900 rounded-xs overflow-hidden border border-white/10">
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
          <div className="flex items-center justify-between text-[11px] mt-2 mb-1">
            <span className="font-semibold text-sky-300 flex items-center gap-1 tracking-wider">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              NOS TURBO
            </span>
            <span
              className={`font-mono-tabular text-[10px] font-bold ${
                hud.nosActive
                  ? 'text-yellow-300'
                  : hud.nosCooldownRatio >= 1
                  ? 'text-sky-300'
                  : 'text-slate-400'
              }`}
            >
              {hud.nosActive ? 'BOOSTING' : hud.nosCooldownRatio >= 1 ? 'SIAP' : 'ISI ULANG'}
            </span>
          </div>
          <div className="h-2 bg-slate-900 rounded-xs overflow-hidden border border-white/10">
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
          <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[10px]">
            <button
              type="button"
              onClick={hasMultipleMelee ? onCycleMelee : undefined}
              disabled={!hasMultipleMelee}
              className={`pointer-events-auto bg-slate-900/95 border border-white/10 rounded px-1.5 sm:px-2 py-1 text-left transition-colors ${
                hasMultipleMelee ? 'hover:border-yellow-400/50 cursor-pointer' : 'cursor-default'
              }`}
              title={hasMultipleMelee ? 'Ketuk untuk Ganti Senjata Melee [1]' : hud.meleeWeaponName}
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1">
                  <Swords className="w-3 h-3 text-amber-400" />
                  <span className="hidden sm:inline">[F]</span>
                </span>
                {hasMultipleMelee && (
                  <span className="text-yellow-400 font-mono-tabular text-[9px]">SWAP</span>
                )}
              </div>
              <div className="font-semibold text-white truncate mt-0.5">{hud.meleeWeaponName}</div>
            </button>

            <button
              type="button"
              onClick={hasMultipleRanged ? onCycleRanged : undefined}
              disabled={!hasMultipleRanged}
              className={`pointer-events-auto rounded px-1.5 sm:px-2 py-1 text-left transition-colors border ${
                hud.rangedAmmo <= 0
                  ? 'bg-rose-950/75 border-rose-500/75'
                  : 'bg-slate-900/95 border-white/10'
              } ${
                hasMultipleRanged ? 'hover:border-sky-400/50 cursor-pointer' : 'cursor-default'
              }`}
              title={hasMultipleRanged ? 'Ketuk untuk Ganti Senjata Tembak [2]' : hud.rangedWeaponName}
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1">
                  <Crosshair
                    className={`w-3 h-3 ${hud.rangedAmmo <= 0 ? 'text-rose-400' : 'text-sky-400'}`}
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
                {hud.rangedAmmo <= 0 ? 'HABIS · CARI AMUNISI' : hud.rangedWeaponName}
              </div>
            </button>
          </div>

          {/* Compact Tactical Ability Matrix */}
          <div className="mt-1.5 grid grid-cols-3 gap-1.5 text-[10px]">
            <div className="bg-slate-900/90 border border-white/8 rounded px-1.5 py-1 flex items-center justify-between">
              <span className="flex items-center gap-1 text-slate-300">
                <Shield className="w-3 h-3 text-cyan-400" />
                [E]
              </span>
              <span
                className={`font-mono-tabular font-bold ${
                  hud.empReadyRatio >= 1 ? 'text-cyan-300' : 'text-slate-500'
                }`}
              >
                {hud.empReadyRatio >= 1 ? 'RDY' : `${Math.round(hud.empReadyRatio * 100)}%`}
              </span>
            </div>

            <div className="bg-slate-900/90 border border-white/8 rounded px-1.5 py-1 flex items-center justify-between">
              <span className="flex items-center gap-1 text-slate-300">
                <Zap className="w-3 h-3 text-rose-400" />
                [T]
              </span>
              <span
                className={`font-mono-tabular font-bold ${
                  hud.trapReadyRatio >= 1 ? 'text-yellow-300' : 'text-slate-500'
                }`}
              >
                {hud.trapReadyRatio >= 1 ? 'RDY' : `${Math.round(hud.trapReadyRatio * 100)}%`}
              </span>
            </div>

            <div className="bg-slate-900/90 border border-white/8 rounded px-1.5 py-1 flex items-center justify-between">
              <span className="flex items-center gap-1 text-slate-300">
                <Wind className="w-3 h-3 text-emerald-400" />
                [C]
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
          <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 font-display font-bold tracking-wide">
              {hud.karmaCap === 'pelindung' ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">CAP PELINDUNG</span>
                </>
              ) : hud.karmaCap === 'egois' ? (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-red-300">CAP EGOIS</span>
                </>
              ) : (
                <>
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-300">CAP NETRAL</span>
                </>
              )}
            </span>
            <span className="font-mono-tabular text-slate-400" title="Warga Ditolong / Diabaikan">
              {hud.civiliansSaved}T · {hud.civiliansIgnored}A
            </span>
          </div>
        </div>

        {/* Top-Center: Distance Odometer, Zone Tag & Dynamic Combat Banners */}
        <div className="flex flex-col items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="hud-panel hud-chamfer-sm px-2.5 sm:px-5 py-1.5 sm:py-2 text-center min-w-[90px] sm:min-w-[144px]">
            <div className="font-display text-lg sm:text-3xl font-bold text-white tabular-nums leading-none tracking-tight">
              {hud.distanceMeters >= 1000
                ? `${(hud.distanceMeters / 1000).toFixed(2)} km`
                : `${hud.distanceMeters} m`}
            </div>
            <div className="text-[8px] sm:text-[10px] uppercase tracking-[0.12em] sm:tracking-[0.16em] text-amber-300 font-semibold mt-1 truncate max-w-[96px] sm:max-w-none">
              {hud.biomeName}
            </div>
          </div>

          <div className="fixed top-[148px] sm:static left-1/2 -translate-x-1/2 sm:translate-x-0 z-10 w-[calc(100vw-1.5rem)] max-w-xs sm:w-auto sm:max-w-none flex flex-col items-center gap-1.5 pointer-events-none text-center">

          {hud.bossActive && (
            <div className="bg-red-950/95 border border-red-400/70 rounded-lg px-4 py-1.5 w-52 sm:w-72 shadow-lg">
              <div className="flex items-center justify-between text-[11px] font-display font-bold text-red-200 mb-1">
                <span>BOSS RIDER</span>
                <span className="font-mono-tabular">{Math.round(hud.bossHealthRatio * 100)}%</span>
              </div>
              <div className="h-2 bg-black/60 rounded-xs overflow-hidden border border-red-500/40">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-rose-400"
                  style={{ width: `${Math.round(hud.bossHealthRatio * 100)}%` }}
                />
              </div>
            </div>
          )}

          {hud.pickupBossActive && (
            <div className="bg-orange-950/95 border border-orange-400/80 rounded-lg px-4 py-1.5 w-56 sm:w-72 shadow-lg">
              <div className="flex items-center justify-between text-[11px] font-display font-bold text-orange-200 mb-1">
                <span>ARMORED BEGAL PICK-UP</span>
                <span className="font-mono-tabular">
                  {Math.round(hud.pickupBossHealthRatio * 100)}%
                </span>
              </div>
              <div className="h-2 bg-black/60 rounded-xs overflow-hidden border border-orange-500/40">
                <div
                  className="h-full bg-gradient-to-r from-orange-600 to-amber-400"
                  style={{ width: `${Math.round(hud.pickupBossHealthRatio * 100)}%` }}
                />
              </div>
            </div>
          )}

          {hud.civilianDistressActive && (
            <div className="bg-amber-400 text-slate-950 font-display font-bold text-xs px-3.5 py-1 rounded shadow-md tracking-wider">
              WARGA DIBEGAL! SERANG BEGALNYA
            </div>
          )}

          {hud.policeRaidActive && (
            <div className="bg-sky-400 text-slate-950 font-display font-bold text-xs px-3.5 py-1 rounded shadow-md tracking-wider">
              RAZIYA POLISI AKTIF — JALAN DIBERSIHKAN
            </div>
          )}

          {hud.slipstreamActive && (
            <div className="bg-cyan-400 text-slate-950 font-display font-bold text-xs px-3 py-1 rounded tracking-wider flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5" />
              SLIPSTREAM +22% SPD
            </div>
          )}

          {!hud.slipstreamActive && hud.lockedEnemyDistance !== null && (
            <div className="hud-panel border-yellow-400/60 text-yellow-300 font-mono-tabular font-semibold text-[11px] px-3 py-1 rounded">
              BEGAL DI DEPAN {hud.lockedEnemyDistance}m · [R] LOCK-SHOT · [Q] LURE
            </div>
          )}

          {hud.incomingFireWarning && (
            <div className="bg-rose-600 text-white border border-rose-300/70 font-display font-bold text-xs px-3.5 py-1 rounded shadow-md tracking-wider flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5" />
              TEMBAKAN MUSUH! HINDAR [A/D/C/SPACE]
            </div>
          )}

          {hud.barricadeAhead && (
            <div className="bg-orange-500 text-slate-950 border border-orange-200/70 font-display font-bold text-xs px-3.5 py-1 rounded shadow-md tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              BARIKADE BEGAL DI DEPAN! LOMPAT / BELOK
            </div>
          )}

          {!hud.barricadeAhead && hud.roadHazardWarning && (
            <div
              className={`border font-display font-bold text-xs px-3.5 py-1 rounded shadow-md tracking-wider flex items-center gap-1.5 ${
                hud.roadHazardWarning === 'pasar_malam'
                  ? 'bg-fuchsia-500 text-white border-fuchsia-200/70'
                  : hud.roadHazardWarning === 'tukang_parkir'
                  ? 'bg-amber-400 text-slate-950 border-amber-100/70'
                  : 'bg-emerald-400 text-slate-950 border-emerald-100/70'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {hud.roadHazardWarning === 'pasar_malam'
                ? 'PASAR MALAM DI PINGGIR! AMBIL LAJUR TENGAH'
                : hud.roadHazardWarning === 'tukang_parkir'
                ? 'TUKANG PARKIR: MOBIL KELUAR DARI PINGGIR!'
                : 'PESEPEDA DI PINGGIR JALAN! HATI-HATI'}
            </div>
          )}

          {hud.statusBanner && (
            <div className="bg-yellow-400 text-slate-950 font-display font-bold text-[11px] sm:text-sm px-3 sm:px-4 py-1 rounded shadow-lg tracking-wider">
              {hud.statusBanner}
            </div>
          )}
          </div>
        </div>

        {/* Top-Right: Audio/Fullscreen/Pause, Run Score, Mobile Speedometer & Police Ult */}
        <div className="flex flex-col items-end gap-1.5 sm:gap-2 shrink-0">
          <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
            {canFullscreen && onToggleFullscreen && (
              <button
                type="button"
                onClick={onToggleFullscreen}
                aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                className="min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] hud-panel rounded-lg flex items-center justify-center text-slate-200 hover:text-yellow-400 cursor-pointer"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            )}
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={settings.muted ? 'Unmute' : 'Mute'}
              className="min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] hud-panel rounded-lg flex items-center justify-center text-slate-200 hover:text-yellow-400 cursor-pointer"
            >
              {settings.muted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            <button
              type="button"
              onClick={onPause}
              aria-label="Pause Game"
              className="min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] hud-panel rounded-lg flex items-center justify-center text-slate-200 hover:text-yellow-400 cursor-pointer"
            >
              <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          <div className="hud-panel rounded-lg px-2.5 sm:px-3.5 py-1.5 sm:py-2 flex items-center gap-2.5 sm:gap-3.5 text-[11px] sm:text-xs">
            <div className="flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400" />
              <span className="font-mono-tabular font-bold text-white">+{hud.runCoins}</span>
            </div>
            <div className="flex items-center gap-1">
              <Swords className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
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
            <div className="sm:hidden hud-panel-amber hud-chamfer-sm px-2.5 py-1.5 text-right min-w-[96px]">
              <div className="flex items-baseline justify-end gap-1">
                <span
                  className={`font-display text-xl font-bold tabular-nums leading-none ${
                    hud.nosActive ? 'text-yellow-300' : 'text-white'
                  }`}
                >
                  {hud.speedKmh}
                </span>
                <span className="text-[9px] font-mono-tabular text-amber-300 font-semibold">KM/H</span>
              </div>
              <div className="mt-1 h-1 w-full bg-slate-900 rounded-xs overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-400 via-amber-400 to-rose-500"
                  style={{ width: `${speedPct}%` }}
                />
              </div>
            </div>
          )}

          {hud.policeUltCharges > 0 && (
            <button
              type="button"
              {...bindTouch('policeUlt')}
              className="pointer-events-auto min-h-[40px] sm:min-h-[44px] px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-gradient-to-r from-sky-400 to-cyan-300 hover:from-sky-300 hover:to-cyan-200 active:bg-yellow-400 text-slate-950 font-display font-bold text-[11px] sm:text-xs rounded-lg border-2 border-white/80 cursor-pointer flex items-center gap-1.5 whitespace-nowrap shadow-lg shadow-sky-500/30 touch-none select-none"
            >
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              POLISI ({hud.policeUltCharges}x)
            </button>
          )}
        </div>
      </div>

      {/* Bottom Telemetry & Controls Row */}
      <div className="flex items-end justify-between gap-2 sm:gap-4">
        {showTouch ? (
          <div className="pointer-events-auto flex flex-col gap-1.5 sm:gap-2 touch-none select-none">
            <button
              type="button"
              {...bindTouch('dash')}
              className={`h-9 sm:h-11 px-2.5 sm:px-3 rounded-lg border text-[11px] sm:text-xs font-bold whitespace-nowrap touch-none select-none ${
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
                className="w-14 h-14 sm:w-16 sm:h-16 hud-panel active:bg-yellow-400 active:text-slate-950 border border-white/25 rounded-xl flex items-center justify-center text-white touch-none select-none"
              >
                <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" />
              </button>
              <button
                type="button"
                {...bindTouch('right')}
                aria-label="Steer Right"
                className="w-14 h-14 sm:w-16 sm:h-16 hud-panel active:bg-yellow-400 active:text-slate-950 border border-white/25 rounded-xl flex items-center justify-center text-white touch-none select-none"
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
          className={`hud-panel-amber hud-chamfer-sm px-4 py-2.5 text-right ml-auto min-w-[155px] ${
            showTouch ? 'hidden sm:block' : ''
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

        {/* Right Touch Controls */}
        {showTouch && (
          <div className="pointer-events-auto grid grid-cols-3 gap-1.5 sm:gap-2 touch-none select-none">
            <button
              type="button"
              {...bindTouch('ranged')}
              className={`w-12 h-11 sm:w-14 sm:h-12 border rounded-lg text-[9px] sm:text-[10px] font-bold touch-none select-none ${
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
              className={`w-12 h-11 sm:w-14 sm:h-12 border rounded-lg text-[10px] sm:text-[11px] font-bold touch-none select-none ${
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
              className={`w-12 h-11 sm:w-14 sm:h-12 border rounded-lg text-[10px] sm:text-[11px] font-bold touch-none select-none ${
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
              className="w-12 h-11 sm:w-14 sm:h-12 bg-slate-900/95 active:bg-yellow-400 active:text-slate-950 border border-white/20 rounded-lg text-[9px] sm:text-[11px] font-bold text-slate-200 touch-none select-none"
            >
              KLAKSON
            </button>
            <button
              type="button"
              {...bindTouch('nos')}
              className={`w-12 h-11 sm:w-14 sm:h-12 border rounded-lg text-[10px] sm:text-[11px] font-bold touch-none select-none ${
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
              className="w-12 h-11 sm:w-14 sm:h-12 bg-slate-800/95 active:bg-yellow-400 active:text-slate-950 border border-white/20 rounded-lg flex flex-col items-center justify-center text-[9px] sm:text-[10px] font-bold text-white touch-none select-none"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              LOMPAT
            </button>

            <button
              type="button"
              {...bindTouch('brake')}
              className="w-12 h-12 sm:w-14 sm:h-14 bg-red-950/90 active:bg-red-500 border border-red-500/45 rounded-lg text-[11px] sm:text-xs font-bold text-red-200 touch-none select-none"
            >
              REM
            </button>
            <button
              type="button"
              {...bindTouch('throttle')}
              className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-600/90 active:bg-emerald-500 border border-emerald-400/45 rounded-lg text-[11px] sm:text-xs font-bold text-white touch-none select-none"
            >
              GAS
            </button>
            <button
              type="button"
              {...bindTouch('attack')}
              className="w-12 h-12 sm:w-14 sm:h-14 bg-yellow-400 active:bg-yellow-300 text-slate-950 rounded-lg flex flex-col items-center justify-center text-[9px] sm:text-[10px] font-bold touch-none select-none"
            >
              <Swords className="w-4 h-4" />
              PUKUL
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
