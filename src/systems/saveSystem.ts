import {
  ACHIEVEMENTS,
  BIKES,
  MELEE_WEAPONS,
  MISSIONS,
  RANGED_WEAPONS,
} from '../data/gameCatalog';
import {
  AchievementDef,
  BikeId,
  MeleeWeaponId,
  MissionDef,
  RangedWeaponId,
  SaveData,
  UpgradeLevels,
} from '../types/game';

const STORAGE_KEY = 'begal_rush_save_v1';

const DEFAULT_UPGRADES: UpgradeLevels = {
  topSpeed: 1,
  acceleration: 1,
  handling: 1,
  durability: 1,
  nosCapacity: 1,
};

export function createDefaultSave(): SaveData {
  const upgrades = {} as Record<BikeId, UpgradeLevels>;
  for (const bike of BIKES) {
    upgrades[bike.id] = { ...DEFAULT_UPGRADES };
  }

  return {
    coins: 250,
    exp: 0,
    level: 1,
    ownedBikes: ['bebek125'],
    selectedBikeId: 'bebek125',
    ownedMeleeWeapons: ['baton'],
    selectedMeleeWeapon: 'baton',
    ownedRangedWeapons: ['flare'],
    selectedRangedWeapon: 'flare',
    upgrades,
    bestDistance: 0,
    totalDistance: 0,
    totalEnemiesDefeated: 0,
    totalRuns: 0,
    completedMissionIds: [],
    unlockedAchievementIds: [],
    discoveredEasterEggs: [],
    settings: {
      muted: false,
      sfxVolume: 0.75,
      musicVolume: 0.45,
      graphicsQuality: 'high',
      touchControls: 'auto',
    },
  };
}

export function expForLevel(level: number): number {
  return Math.round(150 * Math.pow(1.28, level - 1));
}

export function loadSaveData(): SaveData {
  const fallback = createDefaultSave();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<SaveData>;

    const upgrades = { ...fallback.upgrades };
    if (parsed.upgrades) {
      for (const bike of BIKES) {
        if (parsed.upgrades[bike.id]) {
          upgrades[bike.id] = {
            ...DEFAULT_UPGRADES,
            ...parsed.upgrades[bike.id],
          };
        }
      }
    }

    const validBikeIds = new Set(BIKES.map((b) => b.id));
    const ownedBikes =
      Array.isArray(parsed.ownedBikes) && parsed.ownedBikes.length > 0
        ? (parsed.ownedBikes.filter((id) => validBikeIds.has(id as BikeId)) as BikeId[])
        : fallback.ownedBikes;
    if (ownedBikes.length === 0) ownedBikes.push('bebek125');

    const selectedBikeId =
      parsed.selectedBikeId && ownedBikes.includes(parsed.selectedBikeId)
        ? parsed.selectedBikeId
        : ownedBikes[0];

    const validMeleeIds = new Set(MELEE_WEAPONS.map((w) => w.id));
    const ownedMeleeWeapons =
      Array.isArray(parsed.ownedMeleeWeapons) && parsed.ownedMeleeWeapons.length > 0
        ? (parsed.ownedMeleeWeapons.filter((id) => validMeleeIds.has(id as MeleeWeaponId)) as MeleeWeaponId[])
        : fallback.ownedMeleeWeapons;
    if (!ownedMeleeWeapons.includes('baton')) ownedMeleeWeapons.unshift('baton');

    const selectedMeleeWeapon =
      parsed.selectedMeleeWeapon && ownedMeleeWeapons.includes(parsed.selectedMeleeWeapon)
        ? parsed.selectedMeleeWeapon
        : ownedMeleeWeapons[0];

    const validRangedIds = new Set(RANGED_WEAPONS.map((w) => w.id));
    const ownedRangedWeapons =
      Array.isArray(parsed.ownedRangedWeapons) && parsed.ownedRangedWeapons.length > 0
        ? (parsed.ownedRangedWeapons.filter((id) => validRangedIds.has(id as RangedWeaponId)) as RangedWeaponId[])
        : fallback.ownedRangedWeapons;
    if (!ownedRangedWeapons.includes('flare')) ownedRangedWeapons.unshift('flare');

    const selectedRangedWeapon =
      parsed.selectedRangedWeapon && ownedRangedWeapons.includes(parsed.selectedRangedWeapon)
        ? parsed.selectedRangedWeapon
        : ownedRangedWeapons[0];

    return {
      coins: typeof parsed.coins === 'number' && parsed.coins >= 0 ? Math.floor(parsed.coins) : fallback.coins,
      exp: typeof parsed.exp === 'number' && parsed.exp >= 0 ? Math.floor(parsed.exp) : 0,
      level: typeof parsed.level === 'number' && parsed.level >= 1 ? Math.floor(parsed.level) : 1,
      ownedBikes,
      selectedBikeId,
      ownedMeleeWeapons,
      selectedMeleeWeapon,
      ownedRangedWeapons,
      selectedRangedWeapon,
      upgrades,
      bestDistance: typeof parsed.bestDistance === 'number' ? Math.max(0, Math.floor(parsed.bestDistance)) : 0,
      totalDistance: typeof parsed.totalDistance === 'number' ? Math.max(0, Math.floor(parsed.totalDistance)) : 0,
      totalEnemiesDefeated:
        typeof parsed.totalEnemiesDefeated === 'number' ? Math.max(0, Math.floor(parsed.totalEnemiesDefeated)) : 0,
      totalRuns: typeof parsed.totalRuns === 'number' ? Math.max(0, Math.floor(parsed.totalRuns)) : 0,
      completedMissionIds: Array.isArray(parsed.completedMissionIds) ? parsed.completedMissionIds : [],
      unlockedAchievementIds: Array.isArray(parsed.unlockedAchievementIds) ? parsed.unlockedAchievementIds : [],
      discoveredEasterEggs: Array.isArray(parsed.discoveredEasterEggs) ? parsed.discoveredEasterEggs : [],
      settings: {
        ...fallback.settings,
        ...(parsed.settings ?? {}),
      },
    };
  } catch {
    return fallback;
  }
}

export function persistSaveData(data: SaveData): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota errors in restricted sandboxes
  }
}

export function applyExpAndLevelUps(save: SaveData, gainedExp: number): { leveledUp: boolean; newLevel: number } {
  let exp = save.exp + Math.max(0, Math.floor(gainedExp));
  let level = save.level;
  let leveledUp = false;

  while (exp >= expForLevel(level)) {
    exp -= expForLevel(level);
    level += 1;
    leveledUp = true;
  }

  save.exp = exp;
  save.level = level;
  return { leveledUp, newLevel: level };
}

export function evaluateMissionsAndAchievements(
  save: SaveData,
  runStats: {
    distanceMeters: number;
    killsRun: number;
    nosUsesRun: number;
    bossDefeatedRun: boolean;
  }
): {
  newlyCompletedMissions: MissionDef[];
  newlyUnlockedAchievements: AchievementDef[];
} {
  const newlyCompletedMissions: MissionDef[] = [];
  const newlyUnlockedAchievements: AchievementDef[] = [];

  for (const m of MISSIONS) {
    if (save.completedMissionIds.includes(m.id)) continue;
    let passed = false;
    if (m.type === 'distance_run') passed = runStats.distanceMeters >= m.target;
    else if (m.type === 'kills_run') passed = runStats.killsRun >= m.target;
    else if (m.type === 'nos_uses_run') passed = runStats.nosUsesRun >= m.target;
    else if (m.type === 'total_kills') passed = save.totalEnemiesDefeated >= m.target;
    else if (m.type === 'total_distance') passed = save.totalDistance >= m.target;

    if (passed) {
      save.completedMissionIds.push(m.id);
      newlyCompletedMissions.push(m);
    }
  }

  const checkAch = (id: string, condition: boolean) => {
    if (!condition || save.unlockedAchievementIds.includes(id)) return;
    const def = ACHIEVEMENTS.find((a) => a.id === id);
    if (def) {
      save.unlockedAchievementIds.push(id);
      newlyUnlockedAchievements.push(def);
    }
  };

  checkAch('ach_first_blood', save.totalEnemiesDefeated >= 1);
  checkAch('ach_flank_survive', runStats.distanceMeters >= 1000);
  checkAch('ach_red_zone', runStats.distanceMeters >= 5000);
  checkAch('ach_boss_slayer', runStats.bossDefeatedRun);
  checkAch('ach_collector', save.ownedBikes.length >= 2);

  return { newlyCompletedMissions, newlyUnlockedAchievements };
}
