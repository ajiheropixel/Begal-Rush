import React from 'react';
import {
  Award,
  Crown,
  Home,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Target,
  Users,
  Wrench,
} from 'lucide-react';
import { RunSummary } from '../types/game';
import { RoomSnapshot } from '../types/multiplayer';

interface GameOverModalProps {
  summary: RunSummary;
  multiplayerRoom?: RoomSnapshot | null;
  localPlayerId?: string | null;
  onRematch?: () => void;
  onRetry: () => void;
  onMainMenu: () => void;
  onOpenGarage: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  summary,
  multiplayerRoom = null,
  localPlayerId = null,
  onRematch,
  onRetry,
  onMainMenu,
  onOpenGarage,
}) => {
  const grossEarned =
    summary.coinsEarnedDistance +
    summary.coinsEarnedCombat +
    summary.coinsEarnedMissions;

  return (
    <div className="fixed inset-0 z-30 bg-black/80 flex items-start sm:items-center justify-center pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] px-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg hud-panel-amber hud-chamfer p-4 sm:p-6 text-slate-100 my-auto">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="text-[11px] font-mono-tabular font-bold tracking-[0.18em] uppercase text-rose-400">
              {multiplayerRoom
                ? `MULTIPLAYER ${multiplayerRoom.mode === 'coop' ? 'CO-OP' : 'DUEL'} · SELESAI`
                : 'MOTOR HANCUR · RUN SELESAI'}
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mt-0.5 tracking-wide">
              {multiplayerRoom ? 'HASIL PODIUM RONDE' : 'LAPORAN PERJALANAN'}
            </h2>
            {multiplayerRoom?.finishReason && (
              <p className="text-xs text-amber-300 mt-1">{multiplayerRoom.finishReason}</p>
            )}
          </div>
          {summary.isNewBest && (
            <div className="px-3 py-1 bg-yellow-400 text-slate-950 font-display font-bold text-xs rounded shrink-0">
              REKOR BARU
            </div>
          )}
        </div>

        {/* Multiplayer Podium Standings */}
        {multiplayerRoom && (
          <div className="mt-4 bg-slate-900/95 border border-yellow-400/30 rounded-xl p-3 space-y-2">
            <div className="text-[11px] font-display font-bold text-yellow-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> KLASEMEN ROOM #{multiplayerRoom.code}
            </div>
            <div className="space-y-1.5">
              {[...multiplayerRoom.players]
                .sort((a, b) => {
                  if (a.finishOrder !== null && b.finishOrder !== null) {
                    return a.finishOrder - b.finishOrder;
                  }
                  if (a.finishOrder !== null) return -1;
                  if (b.finishOrder !== null) return 1;
                  return b.distanceMeters - a.distanceMeters;
                })
                .map((p, idx) => {
                  const isWinner = p.id === multiplayerRoom.winnerId;
                  const isMe = p.id === localPlayerId;
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs ${
                        isWinner
                          ? 'bg-yellow-400/15 border-yellow-400/50 text-yellow-200'
                          : isMe
                          ? 'bg-sky-500/15 border-sky-400/40 text-sky-100'
                          : 'bg-slate-950/80 border-white/8 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-display font-bold w-5">#{idx + 1}</span>
                        {isWinner && <Crown className="w-3.5 h-3.5 text-yellow-400 shrink-0" />}
                        <span className="font-semibold truncate">
                          {p.name} {isMe ? '(Kamu)' : ''}
                        </span>
                      </div>
                      <div className="font-mono-tabular text-[11px] shrink-0">
                        {p.distanceMeters}m · {p.enemiesDefeated} KO
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Core Distance & Combat Metrics */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-slate-900/95 border border-white/8 rounded-lg p-3">
            <div className="text-[11px] text-slate-400">Total Jarak</div>
            <div className="font-mono-tabular text-lg font-bold text-white mt-0.5">
              {summary.distanceMeters.toLocaleString()} m
            </div>
          </div>
          <div className="bg-slate-900/95 border border-white/8 rounded-lg p-3">
            <div className="text-[11px] text-slate-400">Begal Hadir</div>
            <div className="font-mono-tabular text-lg font-bold text-rose-400 mt-0.5">
              {summary.enemiesEngaged}
            </div>
          </div>
          <div className="bg-slate-900/95 border border-white/8 rounded-lg p-3">
            <div className="text-[11px] text-slate-400">Dilumpuhkan</div>
            <div className="font-mono-tabular text-lg font-bold text-yellow-400 mt-0.5">
              {summary.enemiesDefeated}
            </div>
          </div>
        </div>

        {/* Street Reputation Cap & Civilian Tally */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 bg-slate-900/95 border border-white/10 rounded-lg px-4 py-2.5 text-xs">
          <span className="font-display font-bold flex items-center gap-1.5">
            {summary.karmaCap === 'pelindung' ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            ) : summary.karmaCap === 'egois' ? (
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            ) : (
              <Shield className="w-4 h-4 text-slate-400" />
            )}
            <span>CAP JALANAN:</span>
            <span
              className={
                summary.karmaCap === 'pelindung'
                  ? 'text-emerald-400'
                  : summary.karmaCap === 'egois'
                  ? 'text-rose-400'
                  : 'text-slate-300'
              }
            >
              {summary.karmaCap === 'pelindung'
                ? 'PELINDUNG WARGA'
                : summary.karmaCap === 'egois'
                ? 'EGOIS (INCERAN PICK-UP)'
                : 'NETRAL'}
            </span>
          </span>
          <span className="font-mono-tabular text-slate-300">
            Ditolong {summary.civiliansSaved} · Diabaikan {summary.civiliansIgnored}
          </span>
        </div>

        {/* Economy & Engaged-Begal Penalty Breakdown */}
        <div className="mt-4 bg-slate-900/95 border border-white/10 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Bonus Jarak</span>
            <span className="font-mono-tabular text-white">+{summary.coinsEarnedDistance}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Aksi Tempur & Koin Jalan</span>
            <span className="font-mono-tabular text-white">+{summary.coinsEarnedCombat}</span>
          </div>
          {summary.coinsEarnedMissions > 0 && (
            <div className="flex justify-between">
              <span className="text-yellow-400">Misi & Prestasi</span>
              <span className="font-mono-tabular text-yellow-400">
                +{summary.coinsEarnedMissions}
              </span>
            </div>
          )}
          <div className="flex justify-between border-t border-white/10 pt-2">
            <span className="text-rose-400">
              Denda Kejaran ({summary.enemiesEngaged} begal terlibat)
            </span>
            <span className="font-mono-tabular text-rose-400">-{summary.penaltyCoins}</span>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-2 font-bold text-base">
            <span className="text-white">
              Hasil Bersih ({grossEarned - summary.penaltyCoins >= 0 ? 'Untung' : 'Rugi'})
            </span>
            <span
              className={`font-mono-tabular ${
                summary.netCoinsChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {summary.netCoinsChange >= 0 ? `+${summary.netCoinsChange}` : summary.netCoinsChange}{' '}
              Coins
            </span>
          </div>
          <div className="flex justify-between text-xs text-slate-400 pt-1">
            <span>Total Saldo</span>
            <span className="font-mono-tabular text-yellow-400 font-bold">
              {summary.finalCoins.toLocaleString()} Coins
            </span>
          </div>
        </div>

        {/* EXP & Level Up */}
        <div className="mt-3 flex items-center justify-between bg-slate-900/95 border border-white/8 rounded-lg px-4 py-2.5 text-xs">
          <span className="text-slate-300">
            EXP Diperoleh: <strong className="font-mono-tabular text-white">+{summary.expGained}</strong>
          </span>
          <span className="font-display font-bold text-yellow-400">
            {summary.leveledUp ? `NAIK LEVEL -> LV ${summary.newLevel}!` : `RIDER LV ${summary.newLevel}`}
          </span>
        </div>

        {/* Newly Completed Missions / Achievements */}
        {(summary.newlyCompletedMissions.length > 0 ||
          summary.newlyUnlockedAchievements.length > 0) && (
          <div className="mt-3 space-y-1.5">
            {summary.newlyCompletedMissions.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between text-xs bg-yellow-400/10 border border-yellow-400/35 rounded-md px-3 py-1.5 text-yellow-200"
              >
                <span className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-yellow-400" />
                  Misi: {m.title}
                </span>
                <span className="font-mono-tabular">+{m.rewardCoins} C</span>
              </div>
            ))}
            {summary.newlyUnlockedAchievements.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between text-xs bg-emerald-400/10 border border-emerald-400/35 rounded-md px-3 py-1.5 text-emerald-200"
              >
                <span className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                  Prestasi: {a.title}
                </span>
                <span className="font-mono-tabular">+{a.rewardCoins} C</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        {multiplayerRoom ? (
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onMainMenu}
              className="min-h-[44px] px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Home className="w-4 h-4" />
              Keluar Room
            </button>
            <button
              type="button"
              onClick={onRematch}
              className="min-h-[44px] px-3 py-2.5 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 text-slate-950 font-display font-bold text-sm rounded-lg flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              REMATCH DI LOBI
            </button>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={onMainMenu}
              className="min-h-[44px] px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Home className="w-4 h-4" />
              Menu
            </button>
            <button
              type="button"
              onClick={onOpenGarage}
              className="min-h-[44px] px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Wrench className="w-4 h-4 text-yellow-400" />
              Garasi
            </button>
            <button
              type="button"
              onClick={onRetry}
              className="min-h-[44px] px-3 py-2.5 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 text-slate-950 font-display font-bold text-sm rounded-lg flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              GAS LAGI
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
