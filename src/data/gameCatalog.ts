import {
  AchievementDef,
  BikeConfig,
  BikeId,
  EffectiveBikeStats,
  EnemyType,
  MeleeWeaponDef,
  MeleeWeaponId,
  MissionDef,
  RangedWeaponDef,
  RangedWeaponId,
  UpgradeKey,
  UpgradeLevels,
} from '../types/game';

export const BIKES: BikeConfig[] = [
  {
    id: 'bebek125',
    name: 'Bebek 125 Turbo',
    category: 'Underbone Street',
    description:
      'Motor bebek legendaris jalanan malam Indonesia—lincah menyalip celah sempit dan responsif.',
    price: 0,
    primaryColor: 0xfacc15,
    accentColor: 0x18181b,
    frameColor: 0x3f3f46,
    baseStats: {
      maxSpeed: 35, // ~126 km/h
      acceleration: 19,
      brakingForce: 29,
      steeringSensitivity: 12.8,
      jumpForce: 10.9,
      nosDuration: 2.7,
      nosCooldown: 6.2,
      nosSpeedMultiplier: 1.38,
      maxHealth: 105,
      attackDamage: 36,
    },
  },
  {
    id: 'vespa160',
    name: 'Scooter Klasik 160',
    category: 'Retro Mod',
    description:
      'Skuter klasik berbadan lebar gaya retro Jakarta dengan ban whitewall, tangki NOS ekstra, dan kelincahan halus.',
    price: 450,
    primaryColor: 0x2dd4bf,
    accentColor: 0xfef3c7,
    frameColor: 0x475569,
    baseStats: {
      maxSpeed: 37, // ~133 km/h
      acceleration: 20,
      brakingForce: 31,
      steeringSensitivity: 13.4,
      jumpForce: 10.8,
      nosDuration: 3.1,
      nosCooldown: 5.8,
      nosSpeedMultiplier: 1.4,
      maxHealth: 120,
      attackDamage: 38,
    },
  },
  {
    id: 'matic150',
    name: 'Matic 150 Touring',
    category: 'Maxi Scooter',
    description:
      'Skutik gambot ber-fairing tinggi dengan stabilitas mantap, armor bodi tebal, dan kapasitas NOS besar.',
    price: 750,
    primaryColor: 0x38bdf8,
    accentColor: 0x0f172a,
    frameColor: 0x334155,
    baseStats: {
      maxSpeed: 39, // ~140 km/h
      acceleration: 21,
      brakingForce: 33,
      steeringSensitivity: 11.8,
      jumpForce: 10.6,
      nosDuration: 3.4,
      nosCooldown: 5.8,
      nosSpeedMultiplier: 1.41,
      maxHealth: 145,
      attackDamage: 42,
    },
  },
  {
    id: 'trail250',
    name: 'Supermoto Trail 250',
    category: 'Dual-Sport Urban',
    description:
      'Motor trail ban aspal ber-suspensi tinggi—mampu melompat paling tinggi melewati rintangan dan Pick-Up.',
    price: 1150,
    primaryColor: 0x22c55e,
    accentColor: 0x14532d,
    frameColor: 0x27272a,
    baseStats: {
      maxSpeed: 41.5, // ~149 km/h
      acceleration: 24,
      brakingForce: 35,
      steeringSensitivity: 14.2,
      jumpForce: 13.2,
      nosDuration: 3.3,
      nosCooldown: 5.4,
      nosSpeedMultiplier: 1.42,
      maxHealth: 145,
      attackDamage: 48,
    },
  },
  {
    id: 'naked250',
    name: 'Naked 250 Fighter',
    category: 'Streetfighter',
    description:
      'Streetfighter dua silinder dengan rangka teralis terbuka, akselerasi galak, dan pukulan jarak dekat keras.',
    price: 1650,
    primaryColor: 0xef4444,
    accentColor: 0xfef08a,
    frameColor: 0x27272a,
    baseStats: {
      maxSpeed: 44, // ~158 km/h
      acceleration: 26,
      brakingForce: 37,
      steeringSensitivity: 14.0,
      jumpForce: 11.4,
      nosDuration: 3.6,
      nosCooldown: 5.2,
      nosSpeedMultiplier: 1.44,
      maxHealth: 160,
      attackDamage: 55,
    },
  },
  {
    id: 'chopper400',
    name: 'Cruiser Chopper 400',
    category: 'Heavy Street Cruiser',
    description:
      'Chopper garpu panjang dengan ban belakang lebar dan rangka baja berat—menghancurkan begal dengan daya pukul besar.',
    price: 2400,
    primaryColor: 0x991b1b,
    accentColor: 0xf59e0b,
    frameColor: 0xd4d4d8,
    baseStats: {
      maxSpeed: 45.5, // ~164 km/h
      acceleration: 24,
      brakingForce: 36,
      steeringSensitivity: 12.2,
      jumpForce: 10.5,
      nosDuration: 3.8,
      nosCooldown: 5.2,
      nosSpeedMultiplier: 1.45,
      maxHealth: 205,
      attackDamage: 68,
    },
  },
  {
    id: 'superbike600',
    name: 'Superbike 600 Interceptor',
    category: 'Apex Sport',
    description:
      'Predator 600cc bersayap aerodinamis MotoGP untuk mengejar Boss Rider dan membelah jalan tol malam.',
    price: 3400,
    primaryColor: 0xf59e0b,
    accentColor: 0x09090b,
    frameColor: 0xe4e4e7,
    baseStats: {
      maxSpeed: 50, // ~180 km/h
      acceleration: 30,
      brakingForce: 43,
      steeringSensitivity: 15.0,
      jumpForce: 11.8,
      nosDuration: 4.1,
      nosCooldown: 4.8,
      nosSpeedMultiplier: 1.49,
      maxHealth: 185,
      attackDamage: 66,
    },
  },
  {
    id: 'cyberatv',
    name: 'Armored Trike 800',
    category: 'Tactical 3-Wheeler',
    description:
      'Kendaraan tempur roda tiga ber-rollcage dengan dua roda depan stabil, armor tertebal, dan NOS ganda.',
    price: 5000,
    primaryColor: 0x6366f1,
    accentColor: 0x22d3ee,
    frameColor: 0x1e293b,
    baseStats: {
      maxSpeed: 52, // ~187 km/h
      acceleration: 31,
      brakingForce: 45,
      steeringSensitivity: 14.4,
      jumpForce: 11.5,
      nosDuration: 4.6,
      nosCooldown: 4.4,
      nosSpeedMultiplier: 1.52,
      maxHealth: 245,
      attackDamage: 78,
    },
  },
];

export const MELEE_WEAPONS: MeleeWeaponDef[] = [
  {
    id: 'baton',
    name: 'Tongkat Kejut',
    category: 'Standar Taktis',
    description: 'Tongkat listrik ringkas dengan ayunan cepat dan hentakan kejut seimbang.',
    price: 0,
    damageMult: 1.0,
    cooldown: 0.4,
    reachX: 3.5,
    reachZ: 3.7,
    knockbackMult: 1.0,
    slashColor: 0xfacc15,
  },
  {
    id: 'golok',
    name: 'Golok Baja Betawi',
    category: 'Heavy Blade',
    description: 'Bilah baja tebal bertenaga besar—menembus armor Begal Pick-Up dan Heavy Rider (+32% DMG).',
    price: 380,
    damageMult: 1.32,
    cooldown: 0.44,
    reachX: 3.8,
    reachZ: 4.0,
    knockbackMult: 1.35,
    slashColor: 0xf97316,
  },
  {
    id: 'chain',
    name: 'Rantai Besi Berduri',
    category: 'Wide Whip',
    description: 'Rantai ayun berujung bola duri dengan jangkauan ekstra lebar untuk menyapu kepungan kiri-kanan.',
    price: 680,
    damageMult: 1.18,
    cooldown: 0.42,
    reachX: 4.9,
    reachZ: 4.8,
    knockbackMult: 1.5,
    slashColor: 0xef4444,
  },
  {
    id: 'katana',
    name: 'Katana Plasma Malam',
    category: 'Cyber Blade',
    description: 'Pedang plasma ultra-cepat (+45% DMG) yang otomatis membelah/menangkis peluru begal saat ditebas!',
    price: 1250,
    damageMult: 1.45,
    cooldown: 0.28,
    reachX: 4.2,
    reachZ: 4.3,
    knockbackMult: 1.2,
    slashColor: 0x22d3ee,
    reflectsBullets: true,
  },
];

export const RANGED_WEAPONS: RangedWeaponDef[] = [
  {
    id: 'flare',
    name: 'Pistol Flare Pelacak',
    category: 'Homing Bolt',
    description:
      'Suar pelacak otomatis ke begal di depan. Peluru terbatas — ambil kotak amunisi di jalan (+3/kotak).',
    price: 0,
    maxAmmo: 6,
    ammoPerPickup: 3,
    fireCooldown: 0.25,
    damageMult: 1.15,
    pellets: 1,
    spread: 0,
    projectileSpeed: 64,
    explosionRadius: 0,
    homing: true,
    boltColor: 0xfacc15,
  },
  {
    id: 'shotgun',
    name: 'Shotgun Paku',
    category: 'Spread Burst',
    description:
      'Melepaskan 4 proyektil sebar mematikan untuk kepungan kiri-kanan. Cari kotak amunisi (+2/kotak).',
    price: 460,
    maxAmmo: 5,
    ammoPerPickup: 2,
    fireCooldown: 0.48,
    damageMult: 0.62,
    pellets: 4,
    spread: 0.22,
    projectileSpeed: 56,
    explosionRadius: 0,
    homing: false,
    boltColor: 0xf97316,
  },
  {
    id: 'smg',
    name: 'SMG Kilat 9mm',
    category: 'Rapid Fire',
    description:
      'Senapan mesin ringan cepat berkapasitas 20 peluru. Ambil kotak amunisi di jalan (+8/kotak).',
    price: 880,
    maxAmmo: 20,
    ammoPerPickup: 8,
    fireCooldown: 0.1,
    damageMult: 0.5,
    pellets: 1,
    spread: 0.04,
    projectileSpeed: 74,
    explosionRadius: 0,
    homing: true,
    boltColor: 0x38bdf8,
  },
  {
    id: 'rpg',
    name: 'Peluncur Roket Mini',
    category: 'Explosive Launcher',
    description:
      'Roket pelacak berdaya ledak 6.5m yang mampu menghancurkan barikade & Pick-Up (+1 roket/kotak).',
    price: 1550,
    maxAmmo: 3,
    ammoPerPickup: 1,
    fireCooldown: 0.75,
    damageMult: 2.65,
    pellets: 1,
    spread: 0,
    projectileSpeed: 52,
    explosionRadius: 6.5,
    homing: true,
    boltColor: 0xef4444,
  },
];

export const UPGRADE_META: Record<
  UpgradeKey,
  { label: string; shortDesc: string; baseCost: number; maxLevel: number }
> = {
  topSpeed: {
    label: 'Top Speed',
    shortDesc: '+7% max velocity per level',
    baseCost: 140,
    maxLevel: 5,
  },
  acceleration: {
    label: 'Acceleration',
    shortDesc: '+10% throttle torque per level',
    baseCost: 130,
    maxLevel: 5,
  },
  handling: {
    label: 'Handling',
    shortDesc: '+8% lane agility & dodge response',
    baseCost: 120,
    maxLevel: 5,
  },
  durability: {
    label: 'Durability',
    shortDesc: '+22 Max HP & impact armor',
    baseCost: 150,
    maxLevel: 5,
  },
  nosCapacity: {
    label: 'NOS Capacity',
    shortDesc: '+0.45s boost & faster recharge',
    baseCost: 150,
    maxLevel: 5,
  },
};

export function getUpgradeCost(key: UpgradeKey, currentLevel: number): number {
  const base = UPGRADE_META[key].baseCost;
  return Math.round(base * Math.pow(1.55, currentLevel - 1));
}

export function getBikeById(id: BikeId): BikeConfig {
  return BIKES.find((b) => b.id === id) ?? BIKES[0];
}

export function getMeleeWeaponById(id: MeleeWeaponId): MeleeWeaponDef {
  return MELEE_WEAPONS.find((w) => w.id === id) ?? MELEE_WEAPONS[0];
}

export function getRangedWeaponById(id: RangedWeaponId): RangedWeaponDef {
  return RANGED_WEAPONS.find((w) => w.id === id) ?? RANGED_WEAPONS[0];
}

export function computeEffectiveStats(
  bike: BikeConfig,
  levels: UpgradeLevels
): EffectiveBikeStats {
  const safeLevels = levels ?? {
    topSpeed: 1,
    acceleration: 1,
    handling: 1,
    durability: 1,
    nosCapacity: 1,
  };
  const spdLvl = Math.max(1, safeLevels.topSpeed) - 1;
  const accLvl = Math.max(1, safeLevels.acceleration) - 1;
  const hndLvl = Math.max(1, safeLevels.handling) - 1;
  const durLvl = Math.max(1, safeLevels.durability) - 1;
  const nosLvl = Math.max(1, safeLevels.nosCapacity) - 1;

  return {
    maxSpeed: bike.baseStats.maxSpeed * (1 + spdLvl * 0.07),
    acceleration: bike.baseStats.acceleration * (1 + accLvl * 0.1),
    brakingForce: bike.baseStats.brakingForce * (1 + hndLvl * 0.06),
    steeringSensitivity: bike.baseStats.steeringSensitivity * (1 + hndLvl * 0.08),
    jumpForce: bike.baseStats.jumpForce * (1 + hndLvl * 0.03),
    nosDuration: bike.baseStats.nosDuration + nosLvl * 0.45,
    nosCooldown: Math.max(2.6, bike.baseStats.nosCooldown - nosLvl * 0.45),
    nosSpeedMultiplier: bike.baseStats.nosSpeedMultiplier + nosLvl * 0.03,
    maxHealth: Math.round(bike.baseStats.maxHealth + durLvl * 22),
    attackDamage: Math.round(bike.baseStats.attackDamage + accLvl * 4 + durLvl * 2),
  };
}

export interface EnemySpec {
  type: EnemyType;
  label: string;
  hp: number;
  damage: number;
  speedAdvantage: number;
  coinReward: number;
  expReward: number;
  primaryColor: number;
  accentColor: number;
  scale: number;
}

export const ENEMY_SPECS: Record<EnemyType, EnemySpec> = {
  chaser: {
    type: 'chaser',
    label: 'Chaser',
    hp: 65,
    damage: 14,
    speedAdvantage: 4.5,
    coinReward: 35,
    expReward: 25,
    primaryColor: 0x991b1b,
    accentColor: 0xf97316,
    scale: 1.0,
  },
  flanker: {
    type: 'flanker',
    label: 'Flanker',
    hp: 75,
    damage: 18,
    speedAdvantage: 6.5,
    coinReward: 50,
    expReward: 35,
    primaryColor: 0x7c2d12,
    accentColor: 0xfacc15,
    scale: 1.02,
  },
  interceptor: {
    type: 'interceptor',
    label: 'Interceptor',
    hp: 90,
    damage: 22,
    speedAdvantage: 9.5,
    coinReward: 70,
    expReward: 48,
    primaryColor: 0x312e81,
    accentColor: 0xef4444,
    scale: 1.05,
  },
  shooter: {
    type: 'shooter',
    label: 'Shooter',
    hp: 65,
    damage: 15,
    speedAdvantage: 5.5,
    coinReward: 65,
    expReward: 45,
    primaryColor: 0x3f3f46,
    accentColor: 0xf43f5e,
    scale: 1.0,
  },
  heavy: {
    type: 'heavy',
    label: 'Heavy Rider',
    hp: 150,
    damage: 26,
    speedAdvantage: 4.8,
    coinReward: 100,
    expReward: 70,
    primaryColor: 0x1e293b,
    accentColor: 0xeab308,
    scale: 1.2,
  },
  boss: {
    type: 'boss',
    label: 'Boss Rider',
    hp: 340,
    damage: 32,
    speedAdvantage: 8.0,
    coinReward: 320,
    expReward: 200,
    primaryColor: 0x450a0a,
    accentColor: 0xfacc15,
    scale: 1.35,
  },
  pickup: {
    type: 'pickup',
    label: 'Begal Pick-Up',
    hp: 360,
    damage: 28,
    speedAdvantage: 6.2,
    coinReward: 260,
    expReward: 240,
    primaryColor: 0x7f1d1d,
    accentColor: 0xfef08a,
    scale: 1.0,
  },
};

export const ECONOMY_CONFIG = {
  coinsPer100m: 14,
  expPer100m: 18,
  penaltyPerEngagedBegal: 40,
  maxPenaltyCap: 280,
};

export const DIFFICULTY_TIERS = [
  {
    minKm: 0,
    maxKm: 1,
    biomeName: 'Urban Night Corridor',
    maxActiveEnemies: 2,
    spawnInterval: 4.6,
    enemySpeedScale: 0.92,
    allowedTypes: ['chaser', 'shooter'] as EnemyType[],
  },
  {
    minKm: 1,
    maxKm: 3,
    biomeName: 'Suburban Bypass',
    maxActiveEnemies: 3,
    spawnInterval: 3.9,
    enemySpeedScale: 1.0,
    allowedTypes: ['chaser', 'flanker', 'shooter'] as EnemyType[],
  },
  {
    minKm: 3,
    maxKm: 5,
    biomeName: 'Industrial Ring Road',
    maxActiveEnemies: 4,
    spawnInterval: 3.4,
    enemySpeedScale: 1.08,
    allowedTypes: ['chaser', 'flanker', 'interceptor', 'shooter'] as EnemyType[],
  },
  {
    minKm: 5,
    maxKm: 8,
    biomeName: 'Outskirts Dark Highway',
    maxActiveEnemies: 5,
    spawnInterval: 2.9,
    enemySpeedScale: 1.15,
    allowedTypes: ['chaser', 'flanker', 'interceptor', 'shooter', 'heavy'] as EnemyType[],
  },
  {
    minKm: 8,
    maxKm: Infinity,
    biomeName: 'Red Zone Tollway',
    maxActiveEnemies: 6,
    spawnInterval: 2.5,
    enemySpeedScale: 1.22,
    allowedTypes: ['chaser', 'flanker', 'interceptor', 'shooter', 'heavy'] as EnemyType[],
  },
];

export const MISSIONS: MissionDef[] = [
  {
    id: 'm_dist_1000',
    title: 'Midnight Escape',
    description: 'Survive at least 1,000 meters in a single run.',
    type: 'distance_run',
    target: 1000,
    rewardCoins: 180,
    rewardExp: 120,
  },
  {
    id: 'm_kill_3',
    title: 'Street Defender',
    description: 'Knock out 3 begals in a single run.',
    type: 'kills_run',
    target: 3,
    rewardCoins: 200,
    rewardExp: 140,
  },
  {
    id: 'm_nos_3',
    title: 'Nitro Junkie',
    description: 'Activate NOS boost 3 times in a single run.',
    type: 'nos_uses_run',
    target: 3,
    rewardCoins: 150,
    rewardExp: 100,
  },
  {
    id: 'm_dist_3000',
    title: 'Outrun the Ambush',
    description: 'Reach 3,000 meters in a single run.',
    type: 'distance_run',
    target: 3000,
    rewardCoins: 420,
    rewardExp: 300,
  },
  {
    id: 'm_total_kills_15',
    title: 'Syndicate Sweeper',
    description: 'Defeat 15 begals across all runs.',
    type: 'total_kills',
    target: 15,
    rewardCoins: 500,
    rewardExp: 360,
  },
  {
    id: 'm_total_dist_15000',
    title: 'Long Haul Survivor',
    description: 'Accumulate 15,000 meters total riding distance.',
    type: 'total_distance',
    target: 15000,
    rewardCoins: 650,
    rewardExp: 450,
  },
];

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'ach_first_blood',
    title: 'First Takedown',
    description: 'Defeat your first begal rider on the road.',
    rewardCoins: 100,
    rewardExp: 80,
  },
  {
    id: 'ach_flank_survive',
    title: 'Kilometer One',
    description: 'Break past 1 km without wrecking.',
    rewardCoins: 150,
    rewardExp: 110,
  },
  {
    id: 'ach_red_zone',
    title: 'Red Zone Challenger',
    description: 'Reach 5 km in a single run.',
    rewardCoins: 450,
    rewardExp: 320,
  },
  {
    id: 'ach_boss_slayer',
    title: 'Boss Breaker',
    description: 'Defeat a Boss Rider during a pursuit.',
    rewardCoins: 750,
    rewardExp: 500,
  },
  {
    id: 'ach_collector',
    title: 'Garage Built',
    description: 'Own at least 2 vehicles in your garage.',
    rewardCoins: 250,
    rewardExp: 180,
  },
];

export interface EasterEggDef {
  id: string;
  title: string;
  hint: string;
  rewardCoins: number;
}

export const EASTER_EGGS: EasterEggDef[] = [
  {
    id: 'egg_sultan',
    title: 'Sultan Jalanan',
    hint: 'Ketuk logo BEGAL RUSUH 5x atau masukkan Konami Code di Menu Utama.',
    rewardCoins: 250,
  },
  {
    id: 'egg_telolet',
    title: 'Om Telolet Om!',
    hint: 'Tekan tombol Klakson/Taunt [Q] 3x dengan cepat saat berkendara.',
    rewardCoins: 75,
  },
  {
    id: 'egg_bakso',
    title: 'Bakso Malam Sakti',
    hint: 'Bunyikan klakson [Q] saat melewati Gerobak Bakso di pinggir jalan.',
    rewardCoins: 100,
  },
  {
    id: 'egg_ghost',
    title: 'Penunggu Malam',
    hint: 'Berani melintas dekat di samping Skuter Hantu biru malam.',
    rewardCoins: 150,
  },
  {
    id: 'egg_odong',
    title: 'Odong-Odong Disko',
    hint: 'Dekati atau klakson [Q] dekat Odong-Odong neon warna-warni.',
    rewardCoins: 140,
  },
  {
    id: 'egg_pakogah',
    title: 'Pak Ogah Emas',
    hint: 'Klakson [Q] saat melintas dekat Pak Ogah berbaju rompi menyala.',
    rewardCoins: 180,
  },
  {
    id: 'egg_nasgor',
    title: 'Nasgor Api Turbo',
    hint: 'Lakukan Jump [Space] atau Taunt [Q] di dekat Gerobak Nasi Goreng.',
    rewardCoins: 120,
  },
  {
    id: 'egg_kucing',
    title: 'Berkah Kucing Oren',
    hint: 'Melintas dekat patung Kucing Oren raksasa atau Dash [C] di sisinya.',
    rewardCoins: 200,
  },
];
