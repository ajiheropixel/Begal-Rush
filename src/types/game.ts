export type GameScreen = 'intro' | 'menu' | 'garage' | 'playing' | 'paused' | 'gameover';

export type SubModal = 'none' | 'missions' | 'achievements' | 'settings' | 'multiplayer';

export type BikeId =
  | 'bebek125'
  | 'vespa160'
  | 'matic150'
  | 'trail250'
  | 'naked250'
  | 'chopper400'
  | 'superbike600'
  | 'cyberatv';

export type MeleeWeaponId = 'baton' | 'golok' | 'chain' | 'katana';

export type RangedWeaponId = 'flare' | 'shotgun' | 'smg' | 'rpg';

export type UpgradeKey =
  | 'topSpeed'
  | 'acceleration'
  | 'handling'
  | 'durability'
  | 'nosCapacity';

export type UpgradeLevels = Record<UpgradeKey, number>;

export type EnemyType =
  | 'chaser'
  | 'flanker'
  | 'interceptor'
  | 'shooter'
  | 'heavy'
  | 'boss'
  | 'pickup';

export type KarmaCapStatus = 'netral' | 'pelindung' | 'egois';

export interface BikeConfig {
  id: BikeId;
  name: string;
  category: string;
  description: string;
  price: number;
  primaryColor: number;
  accentColor: number;
  frameColor: number;
  baseStats: {
    maxSpeed: number; // m/s (1 m/s = 3.6 km/h)
    acceleration: number;
    brakingForce: number;
    steeringSensitivity: number;
    jumpForce: number;
    nosDuration: number; // seconds
    nosCooldown: number; // seconds
    nosSpeedMultiplier: number;
    maxHealth: number;
    attackDamage: number;
  };
}

export interface EffectiveBikeStats {
  maxSpeed: number;
  acceleration: number;
  brakingForce: number;
  steeringSensitivity: number;
  jumpForce: number;
  nosDuration: number;
  nosCooldown: number;
  nosSpeedMultiplier: number;
  maxHealth: number;
  attackDamage: number;
}

export interface MeleeWeaponDef {
  id: MeleeWeaponId;
  name: string;
  category: string;
  description: string;
  price: number;
  damageMult: number;
  cooldown: number;
  reachX: number;
  reachZ: number;
  knockbackMult: number;
  slashColor: number;
  reflectsBullets?: boolean;
}

export interface RangedWeaponDef {
  id: RangedWeaponId;
  name: string;
  category: string;
  description: string;
  price: number;
  maxAmmo: number;
  ammoPerPickup: number;
  fireCooldown: number;
  damageMult: number;
  pellets: number;
  spread: number;
  projectileSpeed: number;
  explosionRadius: number;
  homing: boolean;
  boltColor: number;
}

export interface MissionDef {
  id: string;
  title: string;
  description: string;
  type: 'distance_run' | 'kills_run' | 'nos_uses_run' | 'total_kills' | 'total_distance';
  target: number;
  rewardCoins: number;
  rewardExp: number;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  rewardCoins: number;
  rewardExp: number;
}

export interface GameSettings {
  muted: boolean;
  sfxVolume: number; // 0..1
  musicVolume: number; // 0..1
  graphicsQuality: 'low' | 'medium' | 'high';
  touchControls: 'auto' | 'always' | 'off';
}

export interface SaveData {
  coins: number;
  exp: number;
  level: number;
  ownedBikes: BikeId[];
  selectedBikeId: BikeId;
  ownedMeleeWeapons: MeleeWeaponId[];
  selectedMeleeWeapon: MeleeWeaponId;
  ownedRangedWeapons: RangedWeaponId[];
  selectedRangedWeapon: RangedWeaponId;
  upgrades: Record<BikeId, UpgradeLevels>;
  bestDistance: number; // meters
  totalDistance: number; // meters
  totalEnemiesDefeated: number;
  totalRuns: number;
  completedMissionIds: string[];
  unlockedAchievementIds: string[];
  discoveredEasterEggs: string[];
  settings: GameSettings;
}

export interface HudState {
  speedKmh: number;
  distanceMeters: number;
  health: number;
  maxHealth: number;
  nosFuel: number; // 0..1
  nosActive: boolean;
  nosCooldownRatio: number; // 0..1 (1 = ready)
  empReadyRatio: number; // 0..1 (1 = ready)
  attackReadyRatio: number; // 0..1 (1 = ready)
  rangedAmmo: number;
  rangedMaxAmmo: number;
  meleeWeaponId: MeleeWeaponId;
  meleeWeaponName: string;
  rangedWeaponId: RangedWeaponId;
  rangedWeaponName: string;
  trapReadyRatio: number; // 0..1 (1 = ready)
  dashReadyRatio: number; // 0..1 (1 = ready)
  runCoins: number;
  enemiesDefeated: number;
  enemiesEngaged: number;
  activeEnemyCount: number;
  dangerLeft: boolean;
  dangerRight: boolean;
  dangerRear: boolean;
  bossActive: boolean;
  bossHealthRatio: number;
  biomeName: string;
  isAirborne: boolean;
  isWheelie: boolean;
  damageFlash: number; // 0..1
  comboCount: number;
  nearMissCount: number;
  slipstreamActive: boolean;
  lockedEnemyDistance: number | null;
  karmaCap: KarmaCapStatus;
  civiliansSaved: number;
  civiliansIgnored: number;
  civilianDistressActive: boolean;
  policeUltCharges: number;
  policeRaidActive: boolean;
  pickupBossActive: boolean;
  pickupBossHealthRatio: number;
  incomingFireWarning: boolean;
  barricadeAhead: boolean;
  roadHazardWarning: 'pasar_malam' | 'tukang_parkir' | 'pesepeda' | null;
  statusBanner: string | null;
}

export interface RunSummary {
  distanceMeters: number;
  isNewBest: boolean;
  enemiesEngaged: number;
  enemiesDefeated: number;
  civiliansSaved: number;
  civiliansIgnored: number;
  karmaCap: KarmaCapStatus;
  coinsEarnedDistance: number;
  coinsEarnedCombat: number;
  coinsEarnedMissions: number;
  penaltyCoins: number;
  netCoinsChange: number;
  finalCoins: number;
  expGained: number;
  leveledUp: boolean;
  newLevel: number;
  newlyCompletedMissions: MissionDef[];
  newlyUnlockedAchievements: AchievementDef[];
}

export interface ControlInputState {
  left: boolean;
  right: boolean;
  throttle: boolean;
  brake: boolean;
  nos: boolean;
  jump: boolean;
  attack: boolean;
  emp: boolean;
  ranged: boolean;
  trap: boolean;
  dash: boolean;
  emote: boolean;
  policeUlt: boolean;
}
