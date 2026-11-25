import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Coins,
  Crosshair,
  Flame,
  Gauge,
  Lock,
  Play,
  Shield,
  Swords,
  Wrench,
  Zap,
} from 'lucide-react';
import {
  BIKES,
  MELEE_WEAPONS,
  RANGED_WEAPONS,
  UPGRADE_META,
  computeEffectiveStats,
  getBikeById,
  getMeleeWeaponById,
  getRangedWeaponById,
  getUpgradeCost,
} from '../data/gameCatalog';
import { BikeId, MeleeWeaponId, RangedWeaponId, SaveData, UpgradeKey } from '../types/game';

interface GarageModalProps {
  save: SaveData;
  onBack: () => void;
  onStartRun: () => void;
  onSelectBike: (bikeId: BikeId) => void;
  onBuyBike: (bikeId: BikeId) => void;
  onUpgradeStat: (bikeId: BikeId, key: UpgradeKey) => void;
  onPreviewBike: (bikeId: BikeId) => void;
  onSelectMelee: (id: MeleeWeaponId) => void;
  onBuyMelee: (id: MeleeWeaponId) => void;
  onSelectRanged: (id: RangedWeaponId) => void;
  onBuyRanged: (id: RangedWeaponId) => void;
}

const UPGRADE_KEYS: UpgradeKey[] = [
  'topSpeed',
  'acceleration',
  'handling',
  'durability',
  'nosCapacity',
];

const SHORT_BIKE_LABEL: Record<BikeId, string> = {
  bebek125: 'Bebek 125',
  vespa160: 'Vespa 160',
  matic150: 'Matic 150',
  trail250: 'Trail 250',
  naked250: 'Naked 250',
  chopper400: 'Chopper',
  superbike600: 'Sport 600',
  cyberatv: 'Trike 800',
};

export const GarageModal: React.FC<GarageModalProps> = ({
  save,
  onBack,
  onStartRun,
  onSelectBike,
  onBuyBike,
  onUpgradeStat,
  onPreviewBike,
  onSelectMelee,
  onBuyMelee,
  onSelectRanged,
  onBuyRanged,
}) => {
  const [garageTab, setGarageTab] = useState<'vehicles' | 'weapons'>('vehicles');
  const [inspectId, setInspectId] = useState<BikeId>(save.selectedBikeId);

  const inspectedBike = getBikeById(inspectId);
  const isOwned = save.ownedBikes.includes(inspectId);
  const isEquipped = save.selectedBikeId === inspectId;
  const levels = save.upgrades[inspectId];
  const stats = computeEffectiveStats(inspectedBike, levels);

  const equippedMelee = getMeleeWeaponById(save.selectedMeleeWeapon);
  const equippedRanged = getRangedWeaponById(save.selectedRangedWeapon);

  const handleBikeChipClick = (id: BikeId) => {
    setInspectId(id);
    onPreviewBike(id);
  };

  const speedKmH = Math.round(stats.maxSpeed * 3.6);
  const speedBar = Math.min(100, Math.round((speedKmH / 240) * 100));
  const hpBar = Math.min(100, Math.round((stats.maxHealth / 280) * 100));
  const dmgBar = Math.min(100, Math.round((stats.attackDamage / 110) * 100));
  const nosBar = Math.min(100, Math.round((stats.nosDuration / 6.2) * 100));

  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between gap-2 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:p-6">
      {/* Top Showroom Header + Vehicles/Weapons Segmented Switch */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 shrink-0">
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              onPreviewBike(save.selectedBikeId);
              onBack();
            }}
            className="min-h-[40px] sm:min-h-[44px] px-3 sm:px-4 py-2 hud-panel hover:border-yellow-400/50 text-white rounded-lg flex items-center gap-1.5 text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Menu Utama</span>
            <span className="sm:hidden">Menu</span>
          </button>

          {/* Segmented Tab Switch: Vehicles vs Arsenal */}
          <div className="hud-panel p-1 rounded-lg flex items-center gap-1">
            <button
              type="button"
              onClick={() => setGarageTab('vehicles')}
              className={`min-h-[34px] sm:min-h-[36px] px-2.5 sm:px-3.5 py-1.5 rounded-md font-display font-bold text-[11px] sm:text-xs flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                garageTab === 'vehicles'
                  ? 'bg-yellow-400 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              Motor ({BIKES.length})
            </button>
            <button
              type="button"
              onClick={() => setGarageTab('weapons')}
              className={`min-h-[34px] sm:min-h-[36px] px-2.5 sm:px-3.5 py-1.5 rounded-md font-display font-bold text-[11px] sm:text-xs flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                garageTab === 'weapons'
                  ? 'bg-yellow-400 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              Senjata (8)
            </button>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2 sm:gap-3 ml-auto">
          <div className="hud-panel rounded-lg px-3 sm:px-4 py-2 flex items-center gap-1.5 sm:gap-2">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="font-mono-tabular text-xs sm:text-sm font-bold text-white">
              {save.coins.toLocaleString()}
            </span>
          </div>
          <button
            type="button"
            onClick={onStartRun}
            className="min-h-[40px] sm:min-h-[44px] px-3.5 sm:px-5 py-2 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 text-slate-950 font-display font-bold text-xs sm:text-sm tracking-wide rounded-lg flex items-center gap-1.5 sm:gap-2 transition-colors cursor-pointer whitespace-nowrap shadow-lg shadow-amber-500/20"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            GAS SEKARANG
          </button>
        </div>
      </div>

      {/* Bottom Panels leaving center 3D bike turntable clear (scrollable on compact mobile viewports) */}
      {garageTab === 'vehicles' ? (
        <div className="pointer-events-auto lg:pointer-events-none flex flex-col lg:flex-row items-stretch lg:items-end justify-between gap-3 sm:gap-4 max-h-[58dvh] lg:max-h-none overflow-y-auto lg:overflow-visible hud-scroll pr-0.5 lg:pr-0">
          {/* Left: 8 Vehicles Selector & Spec Telemetry */}
          <div className="pointer-events-auto w-full lg:w-[420px] hud-panel-amber hud-chamfer p-4 sm:p-5">
            <div className="grid grid-cols-4 gap-1.5 pb-2">
              {BIKES.map((bike) => {
                const active = bike.id === inspectId;
                const owned = save.ownedBikes.includes(bike.id);
                const equipped = save.selectedBikeId === bike.id;
                return (
                  <button
                    key={bike.id}
                    type="button"
                    onClick={() => handleBikeChipClick(bike.id)}
                    className={`min-h-[36px] px-2 py-1 rounded-md text-[11px] font-display font-bold whitespace-nowrap border transition-colors cursor-pointer truncate ${
                      active
                        ? 'bg-yellow-400 text-slate-950 border-yellow-300'
                        : equipped
                        ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40 hover:border-emerald-400'
                        : 'bg-slate-900/95 text-slate-300 border-white/10 hover:text-white hover:border-white/25'
                    }`}
                    title={bike.name}
                  >
                    {SHORT_BIKE_LABEL[bike.id]} {!owned ? '· 🔒' : ''}
                  </button>
                );
              })}
            </div>

            <div className="mt-1">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-display text-xl font-bold text-white">{inspectedBike.name}</h2>
                <span className="text-xs text-amber-300 font-semibold whitespace-nowrap">
                  {inspectedBike.category}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {inspectedBike.description}
              </p>
            </div>

            {/* 4-Metric Spec Bars */}
            <div className="mt-3.5 grid grid-cols-2 gap-2.5 text-xs">
              <div className="bg-slate-900/90 border border-white/8 rounded-lg p-2.5">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-sky-400" /> Top Speed
                  </span>
                  <span className="font-mono-tabular font-bold text-white">{speedKmH} km/h</span>
                </div>
                <div className="mt-1.5 h-1.5 bg-slate-800 rounded-xs overflow-hidden">
                  <div className="h-full bg-sky-400" style={{ width: `${speedBar}%` }} />
                </div>
              </div>

              <div className="bg-slate-900/90 border border-white/8 rounded-lg p-2.5">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" /> Armor
                  </span>
                  <span className="font-mono-tabular font-bold text-white">
                    {stats.maxHealth} HP
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 bg-slate-800 rounded-xs overflow-hidden">
                  <div className="h-full bg-emerald-400" style={{ width: `${hpBar}%` }} />
                </div>
              </div>

              <div className="bg-slate-900/90 border border-white/8 rounded-lg p-2.5">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1">
                    <Swords className="w-3.5 h-3.5 text-rose-400" /> Power
                  </span>
                  <span className="font-mono-tabular font-bold text-white">
                    {stats.attackDamage} DMG
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 bg-slate-800 rounded-xs overflow-hidden">
                  <div className="h-full bg-rose-400" style={{ width: `${dmgBar}%` }} />
                </div>
              </div>

              <div className="bg-slate-900/90 border border-white/8 rounded-lg p-2.5">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-400" /> NOS
                  </span>
                  <span className="font-mono-tabular font-bold text-white">
                    {stats.nosDuration.toFixed(1)}s
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 bg-slate-800 rounded-xs overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: `${nosBar}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-3.5">
              {isOwned ? (
                <button
                  type="button"
                  disabled={isEquipped}
                  onClick={() => onSelectBike(inspectId)}
                  className={`w-full min-h-[44px] rounded-lg font-display font-bold text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
                    isEquipped
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/45 cursor-default'
                      : 'bg-yellow-400 hover:bg-yellow-300 text-slate-950 cursor-pointer'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  {isEquipped ? 'TERPASANG UNTUK BALAP' : 'PILIH KENDARAAN INI'}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={save.coins < inspectedBike.price}
                  onClick={() => onBuyBike(inspectId)}
                  className={`w-full min-h-[44px] rounded-lg font-display font-bold text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
                    save.coins >= inspectedBike.price
                      ? 'bg-yellow-400 hover:bg-yellow-300 text-slate-950 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  BELI {inspectedBike.price.toLocaleString()} COINS
                </button>
              )}
            </div>
          </div>

          {/* Right: 5 Performance Upgrades + Active Weapon Strip */}
          <div className="pointer-events-auto w-full lg:w-[445px] hud-panel hud-chamfer p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-sm uppercase tracking-wider text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                Upgrade Performa
              </h3>
              <button
                type="button"
                onClick={() => setGarageTab('weapons')}
                className="text-[11px] text-amber-300 hover:text-yellow-200 underline underline-offset-2 cursor-pointer"
              >
                {equippedMelee.name} + {equippedRanged.name} →
              </button>
            </div>

            <div className="space-y-2.5">
              {UPGRADE_KEYS.map((key) => {
                const meta = UPGRADE_META[key];
                const lvl = levels[key];
                const isMax = lvl >= meta.maxLevel;
                const cost = getUpgradeCost(key, lvl);
                const canAfford = isOwned && !isMax && save.coins >= cost;

                return (
                  <div
                    key={key}
                    className="bg-slate-900/90 border border-white/8 rounded-lg px-3 py-2 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-white">{meta.label}</span>
                        <span className="font-mono-tabular text-[11px] text-yellow-400">
                          LVL {lvl}/{meta.maxLevel}
                        </span>
                      </div>
                      <div className="mt-1.5 flex gap-1">
                        {Array.from({ length: meta.maxLevel }).map((_, idx) => (
                          <div
                            key={idx}
                            className={`h-1.5 flex-1 rounded-xs ${
                              idx < lvl
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-300'
                                : 'bg-slate-800'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => onUpgradeStat(inspectId, key)}
                      className={`min-h-[40px] px-3 py-1.5 rounded-md font-mono-tabular text-xs font-bold whitespace-nowrap shrink-0 transition-colors ${
                        isMax
                          ? 'bg-slate-800 text-emerald-400 cursor-default'
                          : canAfford
                          ? 'bg-yellow-400 hover:bg-yellow-300 text-slate-950 cursor-pointer'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {isMax ? 'MAX' : `${cost} C`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Weapons Arsenal View: Left = Melee [F], Right = Ranged [R] (center 3D rider stays visible!) */
        <div className="pointer-events-auto lg:pointer-events-none flex flex-col lg:flex-row items-stretch lg:items-end justify-between gap-3 sm:gap-4 max-h-[58dvh] lg:max-h-none overflow-y-auto lg:overflow-visible hud-scroll pr-0.5 lg:pr-0">
          {/* Left: 4 Melee Weapons */}
          <div className="pointer-events-auto w-full lg:w-[445px] hud-panel-amber hud-chamfer p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-sm uppercase tracking-wider text-yellow-400 flex items-center gap-2">
                <Swords className="w-4 h-4" />
                Senjata Jarak Dekat [F]
              </h3>
              <span className="text-[11px] font-mono-tabular text-slate-400">
                {save.ownedMeleeWeapons.length}/{MELEE_WEAPONS.length} Terbuka
              </span>
            </div>

            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1 hud-scroll">
              {MELEE_WEAPONS.map((w) => {
                const owned = save.ownedMeleeWeapons.includes(w.id);
                const equipped = save.selectedMeleeWeapon === w.id;
                const canAfford = save.coins >= w.price;
                return (
                  <div
                    key={w.id}
                    className={`rounded-lg border p-3 transition-colors ${
                      equipped
                        ? 'bg-emerald-950/35 border-emerald-400/50'
                        : 'bg-slate-900/90 border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display font-bold text-sm text-white">
                            {w.name}
                          </span>
                          <span className="text-[10px] font-mono-tabular text-amber-300 uppercase">
                            {w.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                          {w.description}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-3 text-[10px] font-mono-tabular text-slate-300">
                          <span>DMG {Math.round(w.damageMult * 100)}%</span>
                          <span>Jarak {w.reachX.toFixed(1)}m</span>
                          <span>CD {w.cooldown.toFixed(2)}s</span>
                          {w.reflectsBullets && (
                            <span className="text-cyan-300 font-bold">Tangkis Peluru</span>
                          )}
                        </div>
                      </div>

                      {owned ? (
                        <button
                          type="button"
                          disabled={equipped}
                          onClick={() => onSelectMelee(w.id)}
                          className={`min-h-[38px] px-3 rounded-md font-display font-bold text-xs whitespace-nowrap shrink-0 ${
                            equipped
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/45 cursor-default'
                              : 'bg-yellow-400 hover:bg-yellow-300 text-slate-950 cursor-pointer'
                          }`}
                        >
                          {equipped ? 'DIPAKAI' : 'PAKAI'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => onBuyMelee(w.id)}
                          className={`min-h-[38px] px-3 rounded-md font-mono-tabular font-bold text-xs whitespace-nowrap shrink-0 ${
                            canAfford
                              ? 'bg-yellow-400 hover:bg-yellow-300 text-slate-950 cursor-pointer'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {w.price} C
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: 4 Ranged Weapons */}
          <div className="pointer-events-auto w-full lg:w-[445px] hud-panel hud-chamfer p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-sm uppercase tracking-wider text-sky-400 flex items-center gap-2">
                <Crosshair className="w-4 h-4" />
                Senjata Jarak Jauh [R]
              </h3>
              <span className="text-[11px] font-mono-tabular text-slate-400">
                {save.ownedRangedWeapons.length}/{RANGED_WEAPONS.length} Terbuka
              </span>
            </div>

            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1 hud-scroll">
              {RANGED_WEAPONS.map((w) => {
                const owned = save.ownedRangedWeapons.includes(w.id);
                const equipped = save.selectedRangedWeapon === w.id;
                const canAfford = save.coins >= w.price;
                return (
                  <div
                    key={w.id}
                    className={`rounded-lg border p-3 transition-colors ${
                      equipped
                        ? 'bg-sky-950/35 border-sky-400/50'
                        : 'bg-slate-900/90 border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display font-bold text-sm text-white">
                            {w.name}
                          </span>
                          <span className="text-[10px] font-mono-tabular text-sky-300 uppercase">
                            {w.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                          {w.description}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-3 text-[10px] font-mono-tabular text-slate-300">
                          <span>Kapasitas {w.maxAmmo}</span>
                          <span>
                            DMG {Math.round(w.damageMult * 100)}%
                            {w.pellets > 1 ? ` ×${w.pellets}` : ''}
                          </span>
                          <span className="text-amber-300">+{w.ammoPerPickup} / Kotak</span>
                          {w.explosionRadius > 0 && (
                            <span className="text-orange-300 font-bold">
                              Ledak {w.explosionRadius}m
                            </span>
                          )}
                        </div>
                      </div>

                      {owned ? (
                        <button
                          type="button"
                          disabled={equipped}
                          onClick={() => onSelectRanged(w.id)}
                          className={`min-h-[38px] px-3 rounded-md font-display font-bold text-xs whitespace-nowrap shrink-0 ${
                            equipped
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/45 cursor-default'
                              : 'bg-sky-400 hover:bg-sky-300 text-slate-950 cursor-pointer'
                          }`}
                        >
                          {equipped ? 'DIPAKAI' : 'PAKAI'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => onBuyRanged(w.id)}
                          className={`min-h-[38px] px-3 rounded-md font-mono-tabular font-bold text-xs whitespace-nowrap shrink-0 ${
                            canAfford
                              ? 'bg-sky-400 hover:bg-sky-300 text-slate-950 cursor-pointer'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {w.price} C
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
