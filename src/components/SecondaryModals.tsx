import React, { useState } from 'react';
import { Award, CheckCircle2, Lock, Shield, Sparkles, Target, Users, X } from 'lucide-react';
import { ACHIEVEMENTS, EASTER_EGGS, MISSIONS } from '../data/gameCatalog';
import { GameSettings, SaveData, SubModal } from '../types/game';
import { PWAInstallButton } from './PWAInstallButton';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onQuitToMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onQuitToMenu,
}) => {
  return (
    <div className="fixed inset-0 z-30 bg-black/75 flex items-center justify-center p-4">
      <div className="w-full max-w-sm hud-panel-amber hud-chamfer p-6 text-center">
        <div className="text-[10px] font-mono-tabular uppercase tracking-[0.2em] text-amber-300">
          BEGAL RUSH · PAUSED
        </div>
        <h2 className="font-display text-2xl font-bold text-white mt-1">ISTIRAHAT SEJENAK</h2>
        <p className="text-xs text-slate-400 mt-1">
          Siapkan refleks sebelum kembali menerobos malam.
        </p>

        <div className="mt-5 space-y-2.5">
          <button
            type="button"
            onClick={onResume}
            className="w-full min-h-[44px] bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 text-slate-950 font-display font-bold text-sm rounded-lg cursor-pointer whitespace-nowrap"
          >
            LANJUTKAN BALAP
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="w-full min-h-[44px] bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm rounded-lg cursor-pointer whitespace-nowrap"
          >
            Ulangi Perjalanan
          </button>
          <button
            type="button"
            onClick={onQuitToMenu}
            className="w-full min-h-[44px] bg-slate-900 hover:bg-slate-800 border border-white/12 text-slate-300 font-semibold text-sm rounded-lg cursor-pointer whitespace-nowrap"
          >
            Kembali ke Menu Utama
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

export const SecondaryModals: React.FC<SecondaryModalsProps> = ({
  modal,
  save,
  onClose,
  onUpdateSettings,
  onResetSave,
}) => {
  const [achTab, setAchTab] = useState<'achievements' | 'secrets'>('achievements');

  if (modal === 'none') return null;

  return (
    <div className="fixed inset-0 z-30 bg-black/80 flex items-start sm:items-center justify-center pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] px-3 sm:p-4 overflow-y-auto">
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
            {modal === 'multiplayer' && (
              <>
                <Users className="w-5 h-5 text-rose-400" /> MULTIPLAYER CO-OP (ROADMAP)
              </>
            )}
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

        {modal === 'multiplayer' && (
          <div className="mt-4 space-y-4 text-sm text-slate-300">
            <div className="bg-rose-950/40 border border-rose-500/35 rounded-lg p-3.5 text-xs text-rose-200 leading-relaxed">
              Mode co-op daring disiapkan untuk fase jaringan berikutnya. Mode Solo Survival sudah
              aktif penuh beserta NPC warga, bos Begal Pick-Up, dan 8 Easter Egg interaktif.
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="bg-slate-900/95 border border-white/10 rounded-lg p-3.5">
                <div className="font-display font-bold text-yellow-400 text-sm">
                  PERAN 1: PENGEMUDI
                </div>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Mengendalikan manuver motor, gas, rem, NOS turbo, lompatan, serta menghindari lalu
                  lintas malam.
                </p>
              </div>
              <div className="bg-slate-900/95 border border-white/10 rounded-lg p-3.5">
                <div className="font-display font-bold text-sky-400 text-sm flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  PERAN 2: PELINDUNG
                </div>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Boncenger aktif yang membidik Flare Shot, menangkis serangan jarak dekat, dan
                  meledakkan gelombang EMP.
                </p>
              </div>
            </div>
          </div>
        )}

        {modal === 'settings' && (
          <div className="mt-4 space-y-4 text-sm">
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

            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-slate-300">Tombol Sentuh Android</span>
              <div className="flex gap-1.5">
                {(['auto', 'always', 'off'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onUpdateSettings({ touchControls: mode })}
                    className={`min-h-[34px] px-3 py-1.5 rounded-md text-xs font-semibold capitalize cursor-pointer whitespace-nowrap ${
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

            <div className="bg-slate-900/95 border border-white/10 rounded-lg p-3 text-xs text-slate-300 space-y-1 font-mono-tabular">
              <div>Belok: A / D atau Panah · Dash: C / L</div>
              <div>Gas / Rem: W / S · NOS: Shift / N · Lompat: Space</div>
              <div>Pukul/Parry: F · Lock-Shot: R · Jebakan: T · EMP: E</div>
              <div>Klakson/Lure: Q · Panggil Polisi (Ult): P / V</div>
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
