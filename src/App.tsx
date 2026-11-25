import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BikeId,
  ControlInputState,
  GameScreen,
  GameSettings,
  HudState,
  KarmaCapStatus,
  MeleeWeaponId,
  RangedWeaponId,
  RunSummary,
  SaveData,
  SubModal,
  UpgradeKey,
} from './types/game';
import {
  ECONOMY_CONFIG,
  UPGRADE_META,
  computeEffectiveStats,
  getBikeById,
  getMeleeWeaponById,
  getRangedWeaponById,
  getUpgradeCost,
} from './data/gameCatalog';
import {
  applyExpAndLevelUps,
  createDefaultSave,
  evaluateMissionsAndAchievements,
  loadSaveData,
  persistSaveData,
} from './systems/saveSystem';
import { audioEngine } from './systems/audioEngine';
import { BegalRushEngine } from './three/BegalRushEngine';
import { MainMenu } from './components/MainMenu';
import { SponsorIntro } from './components/SponsorIntro';
import { GarageModal } from './components/GarageModal';
import { GameplayHud } from './components/GameplayHud';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal, SecondaryModals } from './components/SecondaryModals';
import { OfflineIndicator } from './components/PWAInstallButton';

const INITIAL_HUD: HudState = {
  speedKmh: 0,
  distanceMeters: 0,
  health: 100,
  maxHealth: 100,
  nosFuel: 1,
  nosActive: false,
  nosCooldownRatio: 1,
  empReadyRatio: 1,
  attackReadyRatio: 1,
  rangedAmmo: 6,
  rangedMaxAmmo: 6,
  meleeWeaponId: 'baton',
  meleeWeaponName: 'Tongkat Kejut',
  rangedWeaponId: 'flare',
  rangedWeaponName: 'Pistol Flare Pelacak',
  trapReadyRatio: 1,
  dashReadyRatio: 1,
  runCoins: 0,
  enemiesDefeated: 0,
  enemiesEngaged: 0,
  activeEnemyCount: 0,
  dangerLeft: false,
  dangerRight: false,
  dangerRear: false,
  incomingFireWarning: false,
  barricadeAhead: false,
  roadHazardWarning: null,
  bossActive: false,
  bossHealthRatio: 0,
  biomeName: 'Urban Night Corridor',
  isAirborne: false,
  isWheelie: false,
  damageFlash: 0,
  comboCount: 0,
  nearMissCount: 0,
  slipstreamActive: false,
  lockedEnemyDistance: null,
  karmaCap: 'netral',
  civiliansSaved: 0,
  civiliansIgnored: 0,
  civilianDistressActive: false,
  policeUltCharges: 0,
  policeRaidActive: false,
  pickupBossActive: false,
  pickupBossHealthRatio: 0,
  statusBanner: null,
};

function mapKeyToInput(code: string): keyof ControlInputState | null {
  switch (code) {
    case 'KeyA':
    case 'ArrowLeft':
      return 'left';
    case 'KeyD':
    case 'ArrowRight':
      return 'right';
    case 'KeyW':
    case 'ArrowUp':
      return 'throttle';
    case 'KeyS':
    case 'ArrowDown':
      return 'brake';
    case 'ShiftLeft':
    case 'ShiftRight':
    case 'KeyN':
      return 'nos';
    case 'Space':
      return 'jump';
    case 'KeyF':
    case 'KeyJ':
      return 'attack';
    case 'KeyE':
    case 'KeyK':
      return 'emp';
    case 'KeyR':
    case 'KeyU':
      return 'ranged';
    case 'KeyT':
    case 'KeyX':
      return 'trap';
    case 'KeyC':
    case 'KeyL':
      return 'dash';
    case 'KeyQ':
      return 'emote';
    case 'KeyP':
    case 'KeyV':
      return 'policeUlt';
    default:
      return null;
  }
}

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<BegalRushEngine | null>(null);

  const [save, setSave] = useState<SaveData>(() => loadSaveData());
  const saveRef = useRef<SaveData>(save);
  saveRef.current = save;

  const [screen, setScreen] = useState<GameScreen>('intro');
  const screenRef = useRef<GameScreen>(screen);
  screenRef.current = screen;

  const [subModal, setSubModal] = useState<SubModal>('none');
  const subModalRef = useRef<SubModal>(subModal);
  subModalRef.current = subModal;

  const [hud, setHud] = useState<HudState>(INITIAL_HUD);
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null);
  const [contextLost, setContextLost] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canFullscreen =
    typeof document !== 'undefined' && Boolean(document.documentElement.requestFullscreen);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handleToggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore if fullscreen is blocked by embedded container or iOS Safari
    }
  }, []);

  const commitSave = useCallback((next: SaveData) => {
    saveRef.current = next;
    setSave(next);
    persistSaveData(next);
  }, []);

  const handleGameOver = useCallback(
    (stats: {
      distanceMeters: number;
      enemiesEngaged: number;
      enemiesDefeated: number;
      civiliansSaved: number;
      civiliansIgnored: number;
      karmaCap: KarmaCapStatus;
      coinsEarnedDistance: number;
      coinsEarnedCombat: number;
      nosUses: number;
      bossDefeated: boolean;
    }) => {
      const current = saveRef.current;
      const next: SaveData = {
        ...current,
        completedMissionIds: [...current.completedMissionIds],
        unlockedAchievementIds: [...current.unlockedAchievementIds],
      };

      const isNewBest = stats.distanceMeters > next.bestDistance;
      if (isNewBest) next.bestDistance = stats.distanceMeters;
      next.totalDistance += stats.distanceMeters;
      next.totalEnemiesDefeated += stats.enemiesDefeated;
      next.totalRuns += 1;

      const { newlyCompletedMissions, newlyUnlockedAchievements } =
        evaluateMissionsAndAchievements(next, {
          distanceMeters: stats.distanceMeters,
          killsRun: stats.enemiesDefeated,
          nosUsesRun: stats.nosUses,
          bossDefeatedRun: stats.bossDefeated,
        });

      let coinsEarnedMissions = 0;
      let bonusExp = 0;
      for (const m of newlyCompletedMissions) {
        coinsEarnedMissions += m.rewardCoins;
        bonusExp += m.rewardExp;
      }
      for (const a of newlyUnlockedAchievements) {
        coinsEarnedMissions += a.rewardCoins;
        bonusExp += a.rewardExp;
      }

      // Penalty based ONLY on engaged begals, capped so player never loses entire wallet
      const rawPenalty = stats.enemiesEngaged * ECONOMY_CONFIG.penaltyPerEngagedBegal;
      const penaltyCoins = Math.min(ECONOMY_CONFIG.maxPenaltyCap, rawPenalty);

      const grossEarned =
        stats.coinsEarnedDistance + stats.coinsEarnedCombat + coinsEarnedMissions;
      const netCoinsChange = grossEarned - penaltyCoins;
      next.coins = Math.max(0, next.coins + netCoinsChange);

      const expGained =
        Math.floor(stats.distanceMeters / 100) * ECONOMY_CONFIG.expPer100m +
        stats.enemiesDefeated * 28 +
        stats.civiliansSaved * 20 +
        bonusExp;
      const { leveledUp, newLevel } = applyExpAndLevelUps(next, expGained);

      commitSave(next);
      setRunSummary({
        distanceMeters: stats.distanceMeters,
        isNewBest,
        enemiesEngaged: stats.enemiesEngaged,
        enemiesDefeated: stats.enemiesDefeated,
        civiliansSaved: stats.civiliansSaved,
        civiliansIgnored: stats.civiliansIgnored,
        karmaCap: stats.karmaCap,
        coinsEarnedDistance: stats.coinsEarnedDistance,
        coinsEarnedCombat: stats.coinsEarnedCombat,
        coinsEarnedMissions,
        penaltyCoins,
        netCoinsChange,
        finalCoins: next.coins,
        expGained,
        leveledUp,
        newLevel,
        newlyCompletedMissions,
        newlyUnlockedAchievements,
      });
      setScreen('gameover');
    },
    [commitSave]
  );

  const handleEasterEggFound = useCallback(
    (eggId: string) => {
      const s = saveRef.current;
      if (s.discoveredEasterEggs.includes(eggId)) return;
      const next: SaveData = {
        ...s,
        discoveredEasterEggs: [...s.discoveredEasterEggs, eggId],
      };
      commitSave(next);
    },
    [commitSave]
  );

  // Mount isolated Three.js canvas once
  useEffect(() => {
    const mountEl = canvasMountRef.current;
    if (!mountEl) return;

    const engine = new BegalRushEngine(mountEl, {
      onHudUpdate: (nextHud) => setHud(nextHud),
      onGameOver: handleGameOver,
      onContextLost: (lost) => setContextLost(lost),
      onEasterEggFound: handleEasterEggFound,
    });

    const initialBike = getBikeById(saveRef.current.selectedBikeId);
    const initialStats = computeEffectiveStats(
      initialBike,
      saveRef.current.upgrades[initialBike.id]
    );
    engine.setSelectedWeapons(
      getMeleeWeaponById(saveRef.current.selectedMeleeWeapon),
      getRangedWeaponById(saveRef.current.selectedRangedWeapon),
      false
    );
    engine.setSelectedBike(initialBike, initialStats);
    engine.applyQualitySetting(saveRef.current.settings.graphicsQuality);
    audioEngine.updateSettings(saveRef.current.settings);

    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [handleEasterEggFound, handleGameOver]);

  const startSoloRun = useCallback(() => {
    audioEngine.unlock();
    audioEngine.playUiClick();
    const s = saveRef.current;
    const bike = getBikeById(s.selectedBikeId);
    const effective = computeEffectiveStats(bike, s.upgrades[bike.id]);
    const melee = getMeleeWeaponById(s.selectedMeleeWeapon);
    const ranged = getRangedWeaponById(s.selectedRangedWeapon);
    setRunSummary(null);
    setSubModal('none');
    setScreen('playing');
    engineRef.current?.startNewRun(bike, effective, melee, ranged);
  }, []);

  const handlePause = useCallback(() => {
    if (screenRef.current !== 'playing') return;
    engineRef.current?.clearAllInputs();
    engineRef.current?.setScreenMode('paused');
    setScreen('paused');
  }, []);

  const handleResume = useCallback(() => {
    if (screenRef.current !== 'paused') return;
    engineRef.current?.setScreenMode('playing');
    setScreen('playing');
  }, []);

  const handleReturnMenu = useCallback(() => {
    audioEngine.playUiClick();
    audioEngine.stopEngine();
    audioEngine.setMusicMode('menu');
    const s = saveRef.current;
    const bike = getBikeById(s.selectedBikeId);
    const effective = computeEffectiveStats(bike, s.upgrades[bike.id]);
    engineRef.current?.setSelectedWeapons(
      getMeleeWeaponById(s.selectedMeleeWeapon),
      getRangedWeaponById(s.selectedRangedWeapon),
      true
    );
    engineRef.current?.setSelectedBike(bike, effective);
    engineRef.current?.setScreenMode('menu');
    setScreen('menu');
  }, []);

  const handleFinishIntro = useCallback(() => {
    if (screenRef.current !== 'intro') return;
    audioEngine.unlock();
    audioEngine.setMusicMode('menu');
    engineRef.current?.setScreenMode('menu');
    setScreen('menu');
  }, []);

  const handleOpenGarage = useCallback(() => {
    audioEngine.unlock();
    audioEngine.playUiClick();
    audioEngine.setMusicMode('menu');
    setSubModal('none');
    engineRef.current?.setScreenMode('garage');
    setScreen('garage');
  }, []);

  const handleReplayIntro = useCallback(() => {
    audioEngine.unlock();
    audioEngine.playUiClick();
    setSubModal('none');
    engineRef.current?.setScreenMode('intro');
    setScreen('intro');
  }, []);

  const handleUnlockMenuSecret = useCallback((): boolean => {
    audioEngine.unlock();
    audioEngine.playSecretUnlock();
    const s = saveRef.current;
    if (s.discoveredEasterEggs.includes('egg_sultan')) {
      return false;
    }
    const next: SaveData = {
      ...s,
      coins: s.coins + 250,
      discoveredEasterEggs: [...s.discoveredEasterEggs, 'egg_sultan'],
    };
    commitSave(next);
    return true;
  }, [commitSave]);

  const konamiBufferRef = useRef<string[]>([]);

  // Keyboard Controls + Window Blur Safety
  useEffect(() => {
    const KONAMI_SEQ = [
      'ArrowUp',
      'ArrowUp',
      'ArrowDown',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'ArrowLeft',
      'ArrowRight',
    ];
    const onKeyDown = (e: KeyboardEvent) => {
      if (screenRef.current === 'menu' && subModalRef.current === 'none') {
        konamiBufferRef.current = [...konamiBufferRef.current, e.code].slice(-KONAMI_SEQ.length);
        if (KONAMI_SEQ.every((code, idx) => konamiBufferRef.current[idx] === code)) {
          konamiBufferRef.current = [];
          handleUnlockMenuSecret();
        }
      }
      if (screenRef.current === 'intro') {
        if (e.code === 'Escape' || e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          audioEngine.unlock();
          audioEngine.playUiClick();
          handleFinishIntro();
        }
        return;
      }

      if (e.code === 'Escape') {
        if (subModalRef.current !== 'none') {
          setSubModal('none');
          return;
        }
        if (screenRef.current === 'playing') {
          handlePause();
        } else if (screenRef.current === 'paused') {
          handleResume();
        } else if (screenRef.current === 'garage') {
          handleReturnMenu();
        }
        return;
      }

      if (
        screenRef.current === 'menu' &&
        subModalRef.current === 'none' &&
        (e.code === 'Enter' || e.code === 'Space')
      ) {
        e.preventDefault();
        startSoloRun();
        return;
      }

      if (screenRef.current !== 'playing') return;
      if (e.code === 'Digit1') {
        const s = saveRef.current;
        if (s.ownedMeleeWeapons.length > 1) {
          const idx = s.ownedMeleeWeapons.indexOf(s.selectedMeleeWeapon);
          const nextId = s.ownedMeleeWeapons[(idx + 1) % s.ownedMeleeWeapons.length];
          const next = { ...s, selectedMeleeWeapon: nextId };
          commitSave(next);
          audioEngine.playUiClick();
          engineRef.current?.setSelectedWeapons(
            getMeleeWeaponById(nextId),
            getRangedWeaponById(next.selectedRangedWeapon),
            true
          );
        }
        return;
      }
      if (e.code === 'Digit2') {
        const s = saveRef.current;
        if (s.ownedRangedWeapons.length > 1) {
          const idx = s.ownedRangedWeapons.indexOf(s.selectedRangedWeapon);
          const nextId = s.ownedRangedWeapons[(idx + 1) % s.ownedRangedWeapons.length];
          const next = { ...s, selectedRangedWeapon: nextId };
          commitSave(next);
          audioEngine.playUiClick();
          engineRef.current?.setSelectedWeapons(
            getMeleeWeaponById(next.selectedMeleeWeapon),
            getRangedWeaponById(nextId),
            true
          );
        }
        return;
      }

      const mapped = mapKeyToInput(e.code);
      if (mapped) {
        if (e.code === 'Space' || e.code.startsWith('Arrow')) {
          e.preventDefault();
        }
        engineRef.current?.setInputs({ [mapped]: true });
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const mapped = mapKeyToInput(e.code);
      if (mapped) {
        engineRef.current?.setInputs({ [mapped]: false });
      }
    };

    const onBlur = () => {
      engineRef.current?.clearAllInputs();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [commitSave, handleFinishIntro, handlePause, handleResume, handleReturnMenu, handleUnlockMenuSecret, startSoloRun]);

  const handleToggleMute = useCallback(() => {
    audioEngine.unlock();
    const s = saveRef.current;
    const nextSettings: GameSettings = { ...s.settings, muted: !s.settings.muted };
    const next = { ...s, settings: nextSettings };
    audioEngine.updateSettings(nextSettings);
    commitSave(next);
  }, [commitSave]);

  const handleUpdateSettings = useCallback(
    (patch: Partial<GameSettings>) => {
      const s = saveRef.current;
      const nextSettings: GameSettings = { ...s.settings, ...patch };
      const next = { ...s, settings: nextSettings };
      audioEngine.updateSettings(nextSettings);
      if (patch.graphicsQuality) {
        engineRef.current?.applyQualitySetting(patch.graphicsQuality);
      }
      commitSave(next);
    },
    [commitSave]
  );

  const handleSelectBike = useCallback(
    (bikeId: BikeId) => {
      audioEngine.playUiClick();
      const s = saveRef.current;
      if (!s.ownedBikes.includes(bikeId)) return;
      const next = { ...s, selectedBikeId: bikeId };
      commitSave(next);
      const bike = getBikeById(bikeId);
      engineRef.current?.setSelectedBike(bike, computeEffectiveStats(bike, next.upgrades[bikeId]));
    },
    [commitSave]
  );

  const handleBuyBike = useCallback(
    (bikeId: BikeId) => {
      const s = saveRef.current;
      const bike = getBikeById(bikeId);
      if (s.ownedBikes.includes(bikeId) || s.coins < bike.price) return;
      audioEngine.playCoin();
      const next: SaveData = {
        ...s,
        coins: s.coins - bike.price,
        ownedBikes: [...s.ownedBikes, bikeId],
        selectedBikeId: bikeId,
      };
      commitSave(next);
      engineRef.current?.setSelectedBike(bike, computeEffectiveStats(bike, next.upgrades[bikeId]));
    },
    [commitSave]
  );

  const handleUpgradeStat = useCallback(
    (bikeId: BikeId, key: UpgradeKey) => {
      const s = saveRef.current;
      if (!s.ownedBikes.includes(bikeId)) return;
      const currentLvl = s.upgrades[bikeId][key];
      const maxLvl = UPGRADE_META[key].maxLevel;
      if (currentLvl >= maxLvl) return;
      const cost = getUpgradeCost(key, currentLvl);
      if (s.coins < cost) return;

      audioEngine.playCoin();
      const next: SaveData = {
        ...s,
        coins: s.coins - cost,
        upgrades: {
          ...s.upgrades,
          [bikeId]: {
            ...s.upgrades[bikeId],
            [key]: currentLvl + 1,
          },
        },
      };
      commitSave(next);
      if (next.selectedBikeId === bikeId) {
        const bike = getBikeById(bikeId);
        engineRef.current?.setSelectedBike(bike, computeEffectiveStats(bike, next.upgrades[bikeId]));
      }
    },
    [commitSave]
  );

  const handlePreviewBike = useCallback((bikeId: BikeId) => {
    const s = saveRef.current;
    const bike = getBikeById(bikeId);
    engineRef.current?.setSelectedBike(bike, computeEffectiveStats(bike, s.upgrades[bikeId]));
  }, []);

  const handleSelectMelee = useCallback(
    (weaponId: MeleeWeaponId) => {
      audioEngine.playUiClick();
      const s = saveRef.current;
      if (!s.ownedMeleeWeapons.includes(weaponId)) return;
      const next = { ...s, selectedMeleeWeapon: weaponId };
      commitSave(next);
      engineRef.current?.setSelectedWeapons(
        getMeleeWeaponById(weaponId),
        getRangedWeaponById(next.selectedRangedWeapon),
        true
      );
    },
    [commitSave]
  );

  const handleBuyMelee = useCallback(
    (weaponId: MeleeWeaponId) => {
      const s = saveRef.current;
      const weapon = getMeleeWeaponById(weaponId);
      if (s.ownedMeleeWeapons.includes(weaponId) || s.coins < weapon.price) return;
      audioEngine.playCoin();
      const next: SaveData = {
        ...s,
        coins: s.coins - weapon.price,
        ownedMeleeWeapons: [...s.ownedMeleeWeapons, weaponId],
        selectedMeleeWeapon: weaponId,
      };
      commitSave(next);
      engineRef.current?.setSelectedWeapons(
        weapon,
        getRangedWeaponById(next.selectedRangedWeapon),
        true
      );
    },
    [commitSave]
  );

  const handleSelectRanged = useCallback(
    (weaponId: RangedWeaponId) => {
      audioEngine.playUiClick();
      const s = saveRef.current;
      if (!s.ownedRangedWeapons.includes(weaponId)) return;
      const next = { ...s, selectedRangedWeapon: weaponId };
      commitSave(next);
      engineRef.current?.setSelectedWeapons(
        getMeleeWeaponById(next.selectedMeleeWeapon),
        getRangedWeaponById(weaponId),
        true
      );
    },
    [commitSave]
  );

  const handleBuyRanged = useCallback(
    (weaponId: RangedWeaponId) => {
      const s = saveRef.current;
      const weapon = getRangedWeaponById(weaponId);
      if (s.ownedRangedWeapons.includes(weaponId) || s.coins < weapon.price) return;
      audioEngine.playCoin();
      const next: SaveData = {
        ...s,
        coins: s.coins - weapon.price,
        ownedRangedWeapons: [...s.ownedRangedWeapons, weaponId],
        selectedRangedWeapon: weaponId,
      };
      commitSave(next);
      engineRef.current?.setSelectedWeapons(
        getMeleeWeaponById(next.selectedMeleeWeapon),
        weapon,
        true
      );
    },
    [commitSave]
  );

  const handleCycleMelee = useCallback(() => {
    const s = saveRef.current;
    if (s.ownedMeleeWeapons.length <= 1) return;
    const idx = s.ownedMeleeWeapons.indexOf(s.selectedMeleeWeapon);
    const nextId = s.ownedMeleeWeapons[(idx + 1) % s.ownedMeleeWeapons.length];
    handleSelectMelee(nextId);
  }, [handleSelectMelee]);

  const handleCycleRanged = useCallback(() => {
    const s = saveRef.current;
    if (s.ownedRangedWeapons.length <= 1) return;
    const idx = s.ownedRangedWeapons.indexOf(s.selectedRangedWeapon);
    const nextId = s.ownedRangedWeapons[(idx + 1) % s.ownedRangedWeapons.length];
    handleSelectRanged(nextId);
  }, [handleSelectRanged]);

  const handleResetSave = useCallback(() => {
    const fresh = createDefaultSave();
    commitSave(fresh);
    const bike = getBikeById(fresh.selectedBikeId);
    engineRef.current?.setSelectedWeapons(
      getMeleeWeaponById(fresh.selectedMeleeWeapon),
      getRangedWeaponById(fresh.selectedRangedWeapon),
      true
    );
    engineRef.current?.setSelectedBike(bike, computeEffectiveStats(bike, fresh.upgrades[bike.id]));
    engineRef.current?.applyQualitySetting(fresh.settings.graphicsQuality);
    audioEngine.updateSettings(fresh.settings);
  }, [commitSave]);

  return (
    <main className="relative w-full h-dvh overflow-hidden bg-[#0B0D10]">
      <OfflineIndicator />

      {/* Isolated Full-Viewport WebGL Canvas Container */}
      <div ref={canvasMountRef} className="fixed inset-0 z-0" />

      {/* Graceful WebGL Context Loss Fallback */}
      {contextLost && (
        <div className="fixed inset-0 z-50 bg-[#0B0D10] flex flex-col items-center justify-center p-6 text-center">
          <h1 className="font-display text-2xl font-bold text-yellow-400">
            3D Graphics Context Interrupted
          </h1>
          <p className="text-sm text-slate-300 mt-2 max-w-md">
            Your browser paused WebGL rendering. Reload or close background tabs to restore the
            street chase viewport.
          </p>
        </div>
      )}

      {/* Opening Studio & Sponsor Sequence */}
      {screen === 'intro' && <SponsorIntro onComplete={handleFinishIntro} />}

      {/* Main Menu */}
      {screen === 'menu' && (
        <MainMenu
          save={save}
          onStartSolo={startSoloRun}
          onOpenGarage={handleOpenGarage}
          onOpenSubModal={(m) => {
            audioEngine.unlock();
            audioEngine.playUiClick();
            audioEngine.setMusicMode('menu');
            setSubModal(m);
          }}
          onToggleMute={handleToggleMute}
          onReplayIntro={handleReplayIntro}
          onUnlockMenuSecret={handleUnlockMenuSecret}
          canFullscreen={canFullscreen}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
        />
      )}

      {/* Garage & Tuning */}
      {screen === 'garage' && (
        <GarageModal
          save={save}
          onBack={handleReturnMenu}
          onStartRun={startSoloRun}
          onSelectBike={handleSelectBike}
          onBuyBike={handleBuyBike}
          onUpgradeStat={handleUpgradeStat}
          onPreviewBike={handlePreviewBike}
          onSelectMelee={handleSelectMelee}
          onBuyMelee={handleBuyMelee}
          onSelectRanged={handleSelectRanged}
          onBuyRanged={handleBuyRanged}
        />
      )}

      {/* Active Gameplay HUD */}
      {(screen === 'playing' || screen === 'paused') && (
        <GameplayHud
          hud={hud}
          settings={save.settings}
          isTouchDevice={isTouchDevice}
          hasMultipleMelee={save.ownedMeleeWeapons.length > 1}
          hasMultipleRanged={save.ownedRangedWeapons.length > 1}
          canFullscreen={canFullscreen}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          onCycleMelee={handleCycleMelee}
          onCycleRanged={handleCycleRanged}
          onPause={handlePause}
          onToggleMute={handleToggleMute}
          onTouchInput={(key, pressed) => engineRef.current?.setInputs({ [key]: pressed })}
        />
      )}

      {/* Pause Modal */}
      {screen === 'paused' && (
        <PauseModal
          onResume={handleResume}
          onRestart={startSoloRun}
          onQuitToMenu={handleReturnMenu}
        />
      )}

      {/* Game Over Modal */}
      {screen === 'gameover' && runSummary && (
        <GameOverModal
          summary={runSummary}
          onRetry={startSoloRun}
          onMainMenu={handleReturnMenu}
          onOpenGarage={handleOpenGarage}
        />
      )}

      {/* Secondary Modals (Missions, Achievements, Settings, Multiplayer Roadmap) */}
      <SecondaryModals
        modal={subModal}
        save={save}
        onClose={() => setSubModal('none')}
        onUpdateSettings={handleUpdateSettings}
        onResetSave={handleResetSave}
      />
    </main>
  );
}
