import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  BikeConfig,
  ControlInputState,
  EffectiveBikeStats,
  EnemyType,
  GameScreen,
  HudState,
  KarmaCapStatus,
  MeleeWeaponDef,
  RangedWeaponDef,
  RangedWeaponId,
} from '../types/game';
import {
  DIFFICULTY_TIERS,
  ECONOMY_CONFIG,
  ENEMY_SPECS,
  getBikeById,
  getMeleeWeaponById,
  getRangedWeaponById,
} from '../data/gameCatalog';
import { createProceduralTextures, ProceduralTextureSet } from './proceduralTextures';
import {
  createBaksoCartMesh,
  createBegalPickupModel,
  createGhostScooterMesh,
  createKucingOrenMesh,
  createMotorcycleModel,
  createNasgorCartMesh,
  createOdongMesh,
  createPakOgahMesh,
  createPolicePatrolModel,
  createPowerupMesh,
  createRangedProjectileMesh,
  createRoadSegment,
  createSpikeTrapMesh,
  createTrafficVehicle,
  MotorcycleRig,
  PickupRig,
  PoliceRig,
  PowerupKind,
  TrafficRig,
} from './models';
import { audioEngine } from '../systems/audioEngine';

// Pre-allocated scratch math objects (Zero GC in render loop)
const _vec3 = new THREE.Vector3();
const _color = new THREE.Color();

const SEGMENT_LENGTH = 60;
const SEGMENT_COUNT = 6; // 360m visible corridor
const ROAD_HALF_WIDTH = 5.85;
const LANE_CENTERS = [-4.2, -1.45, 1.45, 4.2];

interface EnemyEntity {
  id: number;
  type: EnemyType;
  rig: MotorcycleRig;
  x: number;
  z: number;
  speed: number;
  hp: number;
  maxHp: number;
  damage: number;
  engaged: boolean;
  aiState: 'approach' | 'telegraph' | 'recover';
  stateTimer: number;
  flankSide: number;
  stunTimer: number;
  hitFlashTimer: number;
  shootCooldown: number;
  aimTimer: number;
  ambushCivilianId?: number;
  ambushHits?: number;
}

interface CivilianEntity {
  id: number;
  rig: MotorcycleRig;
  x: number;
  z: number;
  speed: number;
  laneTargetX: number;
  underAttack: boolean;
  ambushTimer: number;
  rescued: boolean;
  resolved: boolean;
  gifted: boolean;
}

interface BegalPickupEntity {
  rig: PickupRig;
  x: number;
  z: number;
  speed: number;
  hp: number;
  maxHp: number;
  damage: number;
  flankSide: number;
  hitFlashTimer: number;
  stunTimer: number;
  shootCooldown: number;
  ramCooldown: number;
}

interface PolicePatrolEntity {
  rig: PoliceRig;
  x: number;
  z: number;
  speed: number;
  side: number;
}

interface TrafficEntity {
  rig: TrafficRig;
  x: number;
  z: number;
  speed: number;
  hitCooldown: number;
  nearMissed: boolean;
  side?: -1 | 1;
  targetX?: number;
  attendantWorldX?: number;
  hazardTriggered?: boolean;
}

interface ProjectileEntity {
  mesh: THREE.Mesh;
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  damage: number;
  life: number;
  fromPlayer: boolean;
  targetEnemyId?: number;
  explosionRadius?: number;
  weaponId?: RangedWeaponId;
  nearMissed?: boolean;
}

interface TrapEntity {
  mesh: THREE.Group;
  x: number;
  z: number;
  life: number;
}

interface PowerupEntity {
  mesh: THREE.Group;
  kind: PowerupKind;
  x: number;
  z: number;
}

interface EasterEggProp {
  mesh: THREE.Group;
  kind: 'bakso' | 'ghost' | 'odong' | 'pakogah' | 'nasgor' | 'kucing';
  x: number;
  z: number;
  speed: number;
  triggered: boolean;
}

interface CoinPickup {
  mesh: THREE.Mesh;
  x: number;
  z: number;
}

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  active: boolean;
}

export interface EngineCallbacks {
  onHudUpdate: (hud: HudState) => void;
  onGameOver: (stats: {
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
  }) => void;
  onContextLost: (lost: boolean) => void;
  onEasterEggFound?: (eggId: string, label: string, bonusCoins: number) => void;
}

export class BegalRushEngine {
  private container: HTMLElement;
  private callbacks: EngineCallbacks;
  private isSoftwareGl: boolean;

  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private textures: ProceduralTextureSet;
  private pmremEnvTex: THREE.Texture;

  private keyLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private fog: THREE.FogExp2;

  private roadSegments: THREE.Group[] = [];
  private playerRig!: MotorcycleRig;
  private slashArcMesh!: THREE.Mesh;
  private empRingMesh!: THREE.Mesh;

  // Game mode & timing
  private screenMode: GameScreen = 'intro';
  private clock = new THREE.Clock();
  private frameId = 0;
  private disposed = false;
  private hudEmitAccum = 0;
  private showcaseAngle = 0;
  private animElapsed = 0;

  // Player state
  private currentBike: BikeConfig = getBikeById('bebek125');
  private stats: EffectiveBikeStats = getBikeById('bebek125').baseStats;
  private playerX = 1.45;
  private playerY = 0;
  private playerVelY = 0;
  private playerZ = 0;
  private playerSpeed = 0;
  private playerLean = 0;
  private playerPitch = 0;
  private health = 100;
  private invulnTimer = 0;
  private hitstopTimer = 0;
  private cameraShake = 0;
  private damageFlash = 0;

  // NOS, Jump, Combat, Dash, Trap, Ranged, Powerups
  private nosFuel = 1;
  private nosActive = false;
  private nosCooldownTimer = 0;
  private nosUsesRun = 0;
  private jumpBufferTimer = 0;

  private currentMelee: MeleeWeaponDef = getMeleeWeaponById('baton');
  private currentRanged: RangedWeaponDef = getRangedWeaponById('flare');

  private attackCooldownTimer = 0;
  private slashAnimTimer = 0;
  private playerArmSwingTimer = 0;

  private empCooldownTimer = 0;
  private empAnimTimer = 0;

  private rangedAmmo = 6;
  private rangedMaxAmmo = 6;
  private rangedFireCooldown = 0;

  private trapCooldownTimer = 0;
  private readonly trapCooldownDuration = 7.0;

  private dashCooldownTimer = 0;
  private readonly dashCooldownDuration = 2.2;
  private dashVelX = 0;
  private dashAnimTimer = 0;

  private magnetTimer = 0;
  private wheelieTimer = 0;
  private slipstreamActive = false;
  private lockedEnemyDistance: number | null = null;
  private tauntTapCount = 0;
  private tauntTapWindow = 0;
  private nextBaksoMeters = 380;
  private nextOdongMeters = 620;
  private nextPakOgahMeters = 850;
  private nextGhostMeters = 1100;
  private nextNasgorMeters = 1380;
  private nextKucingMeters = 1750;

  // Score & Run Telemetry
  private startZ = 0;
  private distanceMeters = 0;
  private lastCoinDistanceBucket = 0;
  private coinsEarnedDistance = 0;
  private coinsEarnedCombat = 0;
  private enemiesDefeated = 0;
  private enemiesEngagedTotal = 0;
  private nextEnemyId = 1;
  private bossSpawnedKm = 0;
  private bossDefeatedRun = false;
  private comboCount = 0;
  private comboTimer = 0;
  private nearMissCount = 0;
  private statusBanner: string | null = null;
  private statusBannerTimer = 0;

  // Entities & Pools
  private enemies: EnemyEntity[] = [];
  private enemySpawnTimer = 1.6;
  private civilians: CivilianEntity[] = [];
  private nextCivilianId = 1;
  private civilianSpawnTimer = 2.4;
  private civilianAmbushTimer = 9.0;
  private civiliansSaved = 0;
  private civiliansIgnored = 0;
  private karmaCap: KarmaCapStatus = 'netral';
  private pickupEnemy: BegalPickupEntity | null = null;
  private policeUnits: PolicePatrolEntity[] = [];
  private policeUltCharges = 0;
  private policeRaidTimer = 0;
  private traffic: TrafficEntity[] = [];
  private trafficSpawnTimer = 1.2;
  private barricadeSpawnTimer = 6.5;
  private streetHazardSpawnTimer = 4.8;
  private projectiles: ProjectileEntity[] = [];
  private traps: TrapEntity[] = [];
  private powerups: PowerupEntity[] = [];
  private easterEggProps: EasterEggProp[] = [];
  private powerupSpawnTimer = 4.5;
  private coins: CoinPickup[] = [];
  private coinSpawnTimer = 1.5;
  private particles: Particle[] = [];

  // Inputs
  private input: ControlInputState = {
    left: false,
    right: false,
    throttle: false,
    brake: false,
    nos: false,
    jump: false,
    attack: false,
    emp: false,
    ranged: false,
    trap: false,
    dash: false,
    emote: false,
    policeUlt: false,
  };
  private prevInput: ControlInputState = { ...this.input };

  constructor(container: HTMLElement, callbacks: EngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    this.isSoftwareGl = (() => {
      const probe = document.createElement('canvas').getContext('webgl2');
      if (!probe) return true;
      const ext = probe.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
      const gpu = String(probe.getParameter(param));
      probe.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(
      container.clientWidth || window.innerWidth,
      container.clientHeight || window.innerHeight
    );
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const canvas = this.renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    canvas.addEventListener('webglcontextlost', this.handleContextLost);
    canvas.addEventListener('webglcontextrestored', this.handleContextRestored);

    this.scene = new THREE.Scene();
    const bgCol = new THREE.Color(0x090c14);
    this.scene.background = bgCol;
    this.fog = new THREE.FogExp2(0x090c14, 0.0085);
    this.scene.fog = this.fog;

    const aspect =
      (container.clientWidth || window.innerWidth) /
      (container.clientHeight || window.innerHeight);
    this.camera = new THREE.PerspectiveCamera(62, aspect, 0.2, 260);
    this.camera.position.set(2.4, 2.2, 5.2);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.pmremEnvTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this.pmremEnvTex;
    pmrem.dispose();

    this.hemiLight = new THREE.HemisphereLight(0x3b82f6, 0x18181b, 0.85);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xfde68a, 1.45);
    this.keyLight.position.set(16, 26, 12);
    this.keyLight.castShadow = !this.isSoftwareGl;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.keyLight.shadow.camera.near = 2;
    this.keyLight.shadow.camera.far = 85;
    const d = 22;
    this.keyLight.shadow.camera.left = -d;
    this.keyLight.shadow.camera.right = d;
    this.keyLight.shadow.camera.top = d;
    this.keyLight.shadow.camera.bottom = -d;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.02;
    this.scene.add(this.keyLight);
    this.scene.add(this.keyLight.target);

    const rimLight = new THREE.DirectionalLight(0x60a5fa, 0.55);
    rimLight.position.set(-14, 10, -20);
    this.scene.add(rimLight);

    this.textures = createProceduralTextures(this.renderer.capabilities.getMaxAnisotropy());

    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const seg = createRoadSegment(SEGMENT_LENGTH, this.textures);
      seg.position.z = -i * SEGMENT_LENGTH + SEGMENT_LENGTH * 0.5;
      this.scene.add(seg);
      this.roadSegments.push(seg);
    }

    const slashGeo = new THREE.RingGeometry(1.1, 3.3, 24, 1, -Math.PI * 0.15, Math.PI * 1.3);
    slashGeo.rotateX(-Math.PI / 2);
    this.slashArcMesh = new THREE.Mesh(
      slashGeo,
      new THREE.MeshBasicMaterial({
        color: 0xfacc15,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    this.slashArcMesh.visible = false;
    this.scene.add(this.slashArcMesh);

    const empGeo = new THREE.RingGeometry(0.6, 1.0, 32);
    empGeo.rotateX(-Math.PI / 2);
    this.empRingMesh = new THREE.Mesh(
      empGeo,
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    this.empRingMesh.visible = false;
    this.scene.add(this.empRingMesh);

    const partGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
    for (let i = 0; i < 70; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 1 });
      const mesh = new THREE.Mesh(partGeo, mat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.particles.push({ mesh, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 0.4, active: false });
    }

    this.rebuildPlayerBike(this.currentBike);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    window.addEventListener('resize', this.handleResize);
    window.addEventListener('orientationchange', this.handleResize);
    window.visualViewport?.addEventListener('resize', this.handleResize);
    this.clock.start();
    this.tick();
  }

  private handleContextLost = (e: Event) => {
    e.preventDefault();
    this.callbacks.onContextLost(true);
  };

  private handleContextRestored = () => {
    this.callbacks.onContextLost(false);
  };

  private handleResize = () => {
    if (this.disposed) return;
    const w = this.container.clientWidth || window.visualViewport?.width || window.innerWidth;
    const h = this.container.clientHeight || window.visualViewport?.height || window.innerHeight;
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public applyQualitySetting(quality: 'low' | 'medium' | 'high'): void {
    if (this.isSoftwareGl) return;
    if (quality === 'low') {
      this.renderer.setPixelRatio(1);
      this.renderer.shadowMap.enabled = false;
    } else if (quality === 'medium') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.35));
      this.renderer.shadowMap.enabled = true;
    } else {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
    }
  }

  public setSelectedBike(bike: BikeConfig, effectiveStats: EffectiveBikeStats): void {
    const bikeChanged = this.currentBike.id !== bike.id;
    this.currentBike = bike;
    this.stats = effectiveStats;
    if (bikeChanged) {
      this.rebuildPlayerBike(bike);
    }
  }

  public setSelectedWeapons(
    melee: MeleeWeaponDef,
    ranged: RangedWeaponDef,
    rebuild = true
  ): void {
    const prevMax = this.rangedMaxAmmo || 1;
    const prevRatio = this.rangedAmmo / prevMax;
    const changed =
      this.currentMelee.id !== melee.id || this.currentRanged.id !== ranged.id;

    this.currentMelee = melee;
    this.currentRanged = ranged;
    this.rangedMaxAmmo = ranged.maxAmmo;

    if (changed) {
      if (this.screenMode === 'playing') {
        this.rangedAmmo =
          this.rangedAmmo <= 0
            ? 0
            : Math.min(this.rangedMaxAmmo, Math.max(1, Math.round(prevRatio * this.rangedMaxAmmo)));
      } else {
        this.rangedAmmo = this.rangedMaxAmmo;
      }
      if (rebuild) {
        this.rebuildPlayerBike(this.currentBike);
      }
    }
  }

  private rebuildPlayerBike(bike: BikeConfig): void {
    if (this.playerRig) {
      this.scene.remove(this.playerRig.root);
    }
    this.playerRig = createMotorcycleModel({
      primaryColor: bike.primaryColor,
      accentColor: bike.accentColor,
      frameColor: bike.frameColor,
      bikeId: bike.id,
      meleeWeapon: this.currentMelee.id,
      rangedWeapon: this.currentRanged.id,
      isEnemy: false,
      textures: this.textures,
    });
    this.playerRig.root.position.set(this.playerX, this.playerY, this.playerZ);
    this.scene.add(this.playerRig.root);
  }

  public setScreenMode(mode: GameScreen): void {
    this.screenMode = mode;
    if (mode === 'intro' || mode === 'menu' || mode === 'garage') {
      this.clearDynamicEntities();
      this.playerX = 0;
      this.playerY = 0;
      this.playerZ = 0;
      this.playerSpeed = 0;
      this.playerLean = 0;
      this.playerPitch = 0;
      this.playerRig.root.position.set(0, 0, 0);
      this.playerRig.root.rotation.set(0, 0, 0);
      this.playerRig.chassisGroup.rotation.set(0, 0, 0);
      this.playerRig.torsoGroup.rotation.set(0.42, 0, 0);
      this.playerRig.headGroup.rotation.set(-0.34, 0, 0);
      this.playerRig.nosGlowLeft.visible = false;
      this.playerRig.nosGlowRight.visible = false;
      if (this.playerRig.shieldMesh) this.playerRig.shieldMesh.visible = false;
      this.repositionRoadSegments(0);
    }
  }

  public startNewRun(
    bike: BikeConfig,
    effectiveStats: EffectiveBikeStats,
    melee?: MeleeWeaponDef,
    ranged?: RangedWeaponDef
  ): void {
    const weaponChanged =
      (melee && melee.id !== this.currentMelee.id) ||
      (ranged && ranged.id !== this.currentRanged.id);
    if (melee && ranged) {
      this.currentMelee = melee;
      this.currentRanged = ranged;
    }
    this.rangedMaxAmmo = this.currentRanged.maxAmmo;
    const bikeChanged = this.currentBike.id !== bike.id;
    this.currentBike = bike;
    this.stats = effectiveStats;
    if (bikeChanged || weaponChanged) {
      this.rebuildPlayerBike(bike);
    }
    this.clearDynamicEntities();

    this.playerX = 1.45;
    this.playerY = 0;
    this.playerVelY = 0;
    this.playerZ = 0;
    this.startZ = 0;
    this.playerSpeed = effectiveStats.maxSpeed * 0.55;
    this.playerLean = 0;
    this.playerPitch = 0;

    this.health = effectiveStats.maxHealth;
    this.invulnTimer = 1.5;
    this.hitstopTimer = 0;
    this.cameraShake = 0;
    this.damageFlash = 0;

    this.nosFuel = 1;
    this.nosActive = false;
    this.nosCooldownTimer = 0;
    this.nosUsesRun = 0;
    this.jumpBufferTimer = 0;
    this.attackCooldownTimer = 0;
    this.slashAnimTimer = 0;
    this.playerArmSwingTimer = 0;
    this.empCooldownTimer = 0;
    this.empAnimTimer = 0;

    this.rangedAmmo = this.rangedMaxAmmo;
    this.rangedFireCooldown = 0;
    this.trapCooldownTimer = 0;
    this.dashCooldownTimer = 0;
    this.dashVelX = 0;
    this.dashAnimTimer = 0;
    this.magnetTimer = 0;
    this.wheelieTimer = 0;
    this.slipstreamActive = false;
    this.lockedEnemyDistance = null;
    this.tauntTapCount = 0;
    this.tauntTapWindow = 0;
    this.nextBaksoMeters = 380;
    this.nextOdongMeters = 620;
    this.nextPakOgahMeters = 850;
    this.nextGhostMeters = 1100;
    this.nextNasgorMeters = 1380;
    this.nextKucingMeters = 1750;

    this.distanceMeters = 0;
    this.lastCoinDistanceBucket = 0;
    this.coinsEarnedDistance = 0;
    this.coinsEarnedCombat = 0;
    this.enemiesDefeated = 0;
    this.enemiesEngagedTotal = 0;
    this.bossSpawnedKm = 0;
    this.bossDefeatedRun = false;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.nearMissCount = 0;
    this.enemySpawnTimer = 1.8;
    this.civilianSpawnTimer = 1.8;
    this.civilianAmbushTimer = 9.0;
    this.civiliansSaved = 0;
    this.civiliansIgnored = 0;
    this.karmaCap = 'netral';
    this.policeUltCharges = 0;
    this.policeRaidTimer = 0;
    this.trafficSpawnTimer = 1.0;
    this.barricadeSpawnTimer = 6.5;
    this.streetHazardSpawnTimer = 4.8;
    this.coinSpawnTimer = 1.2;
    this.powerupSpawnTimer = 4.5;

    this.setBanner('SURVIVE THE NIGHT', 2.2);
    this.repositionRoadSegments(0);
    this.screenMode = 'playing';
    audioEngine.startEngine();
    audioEngine.setMusicMode('gameplay');
    this.emitHud();
  }

  public setInputs(next: Partial<ControlInputState>): void {
    Object.assign(this.input, next);
  }

  public clearAllInputs(): void {
    this.input.left = false;
    this.input.right = false;
    this.input.throttle = false;
    this.input.brake = false;
    this.input.nos = false;
    this.input.jump = false;
    this.input.attack = false;
    this.input.emp = false;
    this.input.ranged = false;
    this.input.trap = false;
    this.input.dash = false;
    this.input.emote = false;
    this.input.policeUlt = false;
  }

  private setBanner(text: string, duration = 2.0): void {
    this.statusBanner = text;
    this.statusBannerTimer = duration;
  }

  private clearDynamicEntities(): void {
    for (const e of this.enemies) this.scene.remove(e.rig.root);
    this.enemies = [];
    for (const c of this.civilians) this.scene.remove(c.rig.root);
    this.civilians = [];
    if (this.pickupEnemy) {
      this.scene.remove(this.pickupEnemy.rig.root);
      this.pickupEnemy = null;
    }
    for (const pu of this.policeUnits) this.scene.remove(pu.rig.root);
    this.policeUnits = [];
    for (const t of this.traffic) this.scene.remove(t.rig.root);
    this.traffic = [];
    for (const p of this.projectiles) this.scene.remove(p.mesh);
    this.projectiles = [];
    for (const tr of this.traps) this.scene.remove(tr.mesh);
    this.traps = [];
    for (const pw of this.powerups) this.scene.remove(pw.mesh);
    this.powerups = [];
    for (const eg of this.easterEggProps) this.scene.remove(eg.mesh);
    this.easterEggProps = [];
    for (const c of this.coins) this.scene.remove(c.mesh);
    this.coins = [];
    this.slashArcMesh.visible = false;
    this.empRingMesh.visible = false;
  }

  private repositionRoadSegments(centerZ: number): void {
    for (let i = 0; i < this.roadSegments.length; i++) {
      const seg = this.roadSegments[i];
      const baseIndex = Math.floor(-centerZ / SEGMENT_LENGTH) + i - 1;
      seg.position.z = -baseIndex * SEGMENT_LENGTH;
    }
  }

  private tick = (): void => {
    if (this.disposed) return;

    const rawDt = this.clock.getDelta();
    const dt = Math.min(rawDt, 0.05);
    this.animElapsed += dt;

    if (this.screenMode === 'playing') {
      this.updatePlaying(dt);
    } else if (this.screenMode === 'intro' || this.screenMode === 'menu' || this.screenMode === 'garage') {
      this.updateShowcase(dt);
    } else if (this.screenMode === 'paused') {
      audioEngine.updateEngine(0, false, true);
    }

    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private updateShowcase(dt: number): void {
    this.showcaseAngle += dt * (this.screenMode === 'garage' ? 0.55 : 0.22);
    const isPortrait = this.camera.aspect < 0.9;
    const baseRadius = this.screenMode === 'garage' ? 3.4 : 4.1;
    const radius = isPortrait ? baseRadius * 1.28 : baseRadius;
    const height = (this.screenMode === 'garage' ? 1.5 : 1.75) + (isPortrait ? 0.22 : 0);
    const targetX = Math.sin(this.showcaseAngle) * radius;
    const targetZ = Math.cos(this.showcaseAngle) * radius;

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetX, 4.5, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, height, 4.5, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, targetZ, 4.5, dt);
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, isPortrait ? 55 : 48, 5, dt);
    this.camera.updateProjectionMatrix();

    _vec3.set(0, isPortrait ? 0.52 : 0.85, 0);
    this.camera.lookAt(_vec3);

    this.playerRig.chassisGroup.position.y = Math.sin(this.showcaseAngle * 24) * 0.004;
    this.playerRig.scarfMesh.rotation.x = 1.15 + Math.sin(this.animElapsed * 4) * 0.08;
    this.keyLight.position.set(14, 24, 10);
    this.keyLight.target.position.set(0, 0, 0);
  }

  private updatePlaying(dt: number): void {
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      this.updateParticles(dt * 0.25);
      return;
    }

    // Edge-triggered actions
    const justJump = this.input.jump && !this.prevInput.jump;
    const justAttack = this.input.attack && !this.prevInput.attack;
    const justEmp = this.input.emp && !this.prevInput.emp;
    const justNos = this.input.nos && !this.prevInput.nos;
    const justRanged = this.input.ranged && !this.prevInput.ranged;
    const justTrap = this.input.trap && !this.prevInput.trap;
    const justDash = this.input.dash && !this.prevInput.dash;
    const justEmote = this.input.emote && !this.prevInput.emote;
    const justPoliceUlt = this.input.policeUlt && !this.prevInput.policeUlt;
    this.prevInput = { ...this.input };

    if (justJump) this.jumpBufferTimer = 0.14;
    else this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);

    // Cooldowns & timers
    if (this.invulnTimer > 0) this.invulnTimer -= dt;
    if (this.attackCooldownTimer > 0) this.attackCooldownTimer -= dt;
    if (this.playerArmSwingTimer > 0) this.playerArmSwingTimer -= dt;
    if (this.empCooldownTimer > 0) this.empCooldownTimer -= dt;
    if (this.rangedFireCooldown > 0) this.rangedFireCooldown -= dt;
    if (this.trapCooldownTimer > 0) this.trapCooldownTimer -= dt;
    if (this.dashCooldownTimer > 0) this.dashCooldownTimer -= dt;
    if (this.dashAnimTimer > 0) this.dashAnimTimer -= dt;
    if (this.magnetTimer > 0) this.magnetTimer -= dt;
    if (this.wheelieTimer > 0) this.wheelieTimer -= dt;
    if (this.damageFlash > 0) this.damageFlash = Math.max(0, this.damageFlash - dt * 2.8);
    if (this.cameraShake > 0) this.cameraShake = Math.max(0, this.cameraShake - dt * 3.5);
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.comboCount = 0;
    }
    if (this.statusBannerTimer > 0) {
      this.statusBannerTimer -= dt;
      if (this.statusBannerTimer <= 0) this.statusBanner = null;
    }

    // NOS System
    if (this.nosActive) {
      this.nosFuel -= dt / this.stats.nosDuration;
      if (this.nosFuel <= 0 || (!this.input.nos && this.nosFuel < 0.72 && this.input.brake)) {
        this.nosFuel = Math.max(0, this.nosFuel);
        this.nosActive = false;
        this.nosCooldownTimer = this.stats.nosCooldown;
      }
    } else {
      if (this.nosCooldownTimer > 0) {
        this.nosCooldownTimer = Math.max(0, this.nosCooldownTimer - dt);
        this.nosFuel = 1 - this.nosCooldownTimer / this.stats.nosCooldown;
      } else {
        this.nosFuel = 1;
        if ((justNos || this.input.nos) && this.playerSpeed > 10) {
          this.nosActive = true;
          this.nosUsesRun += 1;
          audioEngine.playNos();
        }
      }
    }

    // Detect Slipstream Drafting & Enemies Ahead
    let drafting = false;
    let maxAheadDist: number | null = null;
    for (const e of this.enemies) {
      const dz = e.z - this.playerZ; // negative = enemy is ahead
      if (dz < -2.5 && dz > -62 && Math.abs(e.x - this.playerX) < 2.25) {
        drafting = true;
      }
      if (dz < -10) {
        const dMeters = Math.round(Math.abs(dz));
        if (maxAheadDist === null || dMeters > maxAheadDist) {
          maxAheadDist = dMeters;
        }
      }
    }
    if (this.pickupEnemy) {
      const dz = this.pickupEnemy.z - this.playerZ;
      if (dz < -3 && dz > -65 && Math.abs(this.pickupEnemy.x - this.playerX) < 2.8) {
        drafting = true;
      }
      if (dz < -10) {
        const dMeters = Math.round(Math.abs(dz));
        if (maxAheadDist === null || dMeters > maxAheadDist) {
          maxAheadDist = dMeters;
        }
      }
    }
    this.slipstreamActive = drafting;
    this.lockedEnemyDistance = maxAheadDist;

    // Speed & Throttle Physics (with Slipstream Catch-Up Boost!)
    const slipstreamMult = this.slipstreamActive ? 1.22 : 1.0;
    const targetTopSpeed =
      (this.nosActive
        ? this.stats.maxSpeed * this.stats.nosSpeedMultiplier
        : this.stats.maxSpeed) * slipstreamMult;
    const minCruiseSpeed = this.stats.maxSpeed * 0.42;

    if (this.nosActive) {
      this.playerSpeed += this.stats.acceleration * 1.9 * slipstreamMult * dt;
    } else if (this.input.brake) {
      this.playerSpeed -= this.stats.brakingForce * dt;
    } else if (this.input.throttle || this.slipstreamActive) {
      this.playerSpeed += this.stats.acceleration * (this.slipstreamActive ? 1.45 : 1.0) * dt;
    } else {
      const cruiseTarget = this.stats.maxSpeed * 0.78;
      this.playerSpeed = THREE.MathUtils.damp(this.playerSpeed, cruiseTarget, 1.8, dt);
    }
    this.playerSpeed = THREE.MathUtils.clamp(this.playerSpeed, minCruiseSpeed, targetTopSpeed);

    if (this.slipstreamActive && Math.random() < 0.45) {
      this.spawnParticles(this.playerX, 0.85, this.playerZ - 0.8, 0x38bdf8, 1, 3.5);
    }

    // Side-Evade Dash
    const steerInput = (this.input.right ? 1 : 0) - (this.input.left ? 1 : 0);
    if (justDash && this.dashCooldownTimer <= 0) {
      this.performEvadeDash(steerInput);
    }
    this.dashVelX = THREE.MathUtils.damp(this.dashVelX, 0, 12, dt);

    // Steering & Lean
    const speedSteerFactor = 0.65 + (this.playerSpeed / this.stats.maxSpeed) * 0.45;
    this.playerX += (steerInput * this.stats.steeringSensitivity * speedSteerFactor + this.dashVelX) * dt;
    if (this.playerX < -ROAD_HALF_WIDTH) {
      this.playerX = -ROAD_HALF_WIDTH;
    } else if (this.playerX > ROAD_HALF_WIDTH) {
      this.playerX = ROAD_HALF_WIDTH;
    }

    const targetLean = -steerInput * 0.36 - THREE.MathUtils.clamp(this.dashVelX * 0.025, -0.25, 0.25);
    this.playerLean = THREE.MathUtils.damp(this.playerLean, targetLean, 12, dt);

    // Jump System (no double jump)
    if (this.jumpBufferTimer > 0 && this.playerY <= 0.02) {
      this.playerVelY = this.stats.jumpForce;
      this.playerY = 0.03;
      this.jumpBufferTimer = 0;
      audioEngine.playJump();
      this.spawnParticles(this.playerX, 0.2, this.playerZ + 0.6, 0xe2e8f0, 8, 3);

      // Jump Easter Egg: Nasgor Api Turbo or Kucing Oren Jump Blessing!
      for (const eg of this.easterEggProps) {
        if (!eg.triggered && Math.hypot(eg.x - this.playerX, eg.z - this.playerZ) < 18) {
          if (eg.kind === 'nasgor') {
            eg.triggered = true;
            this.coinsEarnedCombat += 120;
            this.nosCooldownTimer = 0;
            this.nosFuel = 1;
            this.nosActive = true;
            audioEngine.playSecretUnlock();
            this.spawnParticles(eg.x, 1.4, eg.z, 0xf97316, 22, 7);
            this.setBanner('EASTER EGG: NASGOR API TURBO! +120C', 2.4);
            this.callbacks.onEasterEggFound?.('egg_nasgor', 'Nasgor Api Turbo', 120);
          } else if (eg.kind === 'kucing') {
            eg.triggered = true;
            this.coinsEarnedCombat += 200;
            this.health = Math.min(this.stats.maxHealth, this.health + 30);
            this.invulnTimer = Math.max(this.invulnTimer, 5.0);
            audioEngine.playSecretUnlock();
            this.spawnParticles(eg.x, 1.8, eg.z, 0xfacc15, 24, 7);
            this.setBanner('EASTER EGG: BERKAH KUCING OREN! +200C', 2.5);
            this.callbacks.onEasterEggFound?.('egg_kucing', 'Berkah Kucing Oren', 200);
          }
        }
      }
    }

    if (this.playerY > 0 || this.playerVelY > 0) {
      this.playerVelY -= 26 * dt;
      this.playerY += this.playerVelY * dt;
      if (this.playerY <= 0) {
        this.playerY = 0;
        if (this.playerVelY < -6) {
          this.cameraShake = Math.max(this.cameraShake, 0.14);
          this.spawnParticles(this.playerX, 0.1, this.playerZ + 0.5, 0x94a3b8, 6, 2.5);
        }
        this.playerVelY = 0;
      }
    }

    // Taunt / Horn Emote + Easter Egg Triggers (Om Telolet Om, Bakso Honk, Taunt-Lure Enemies Ahead)
    if (this.tauntTapWindow > 0) {
      this.tauntTapWindow -= dt;
      if (this.tauntTapWindow <= 0) this.tauntTapCount = 0;
    }

    if (justEmote) {
      this.tauntTapCount += 1;
      this.tauntTapWindow = 1.9;

      // Easter Egg Check: Honk near Bakso, Pak Ogah Emas, Odong-Odong, or Nasgor Cart!
      let honoredBakso = false;
      for (const eg of this.easterEggProps) {
        if (!eg.triggered && Math.hypot(eg.x - this.playerX, eg.z - this.playerZ) < 18) {
          if (eg.kind === 'bakso') {
            eg.triggered = true;
            honoredBakso = true;
            this.health = Math.min(this.stats.maxHealth, this.health + 45);
            this.nosCooldownTimer = 0;
            this.nosFuel = 1;
            this.rangedAmmo = this.rangedMaxAmmo;
            this.coinsEarnedCombat += 100;
            audioEngine.playSecretUnlock();
            this.spawnParticles(eg.x, 1.4, eg.z, 0xfacc15, 18, 6);
            this.setBanner('EASTER EGG: BAKSO SAKTI +45HP +100C', 2.4);
            this.callbacks.onEasterEggFound?.('egg_bakso', 'Bakso Malam Sakti', 100);
            break;
          } else if (eg.kind === 'pakogah') {
            eg.triggered = true;
            honoredBakso = true;
            this.coinsEarnedCombat += 180;
            this.health = Math.min(this.stats.maxHealth, this.health + 25);
            audioEngine.playSecretUnlock();
            this.spawnParticles(eg.x, 1.6, eg.z, 0xfacc15, 22, 6);
            this.setBanner('EASTER EGG: PAK OGAH EMAS +180C +25HP', 2.4);
            this.callbacks.onEasterEggFound?.('egg_pakogah', 'Pak Ogah Emas', 180);
            break;
          } else if (eg.kind === 'odong') {
            eg.triggered = true;
            honoredBakso = true;
            this.coinsEarnedCombat += 140;
            this.nosCooldownTimer = 0;
            this.nosFuel = 1;
            this.magnetTimer = Math.max(this.magnetTimer, 10);
            audioEngine.playTeloletHorn();
            this.spawnParticles(eg.x, 1.6, eg.z, 0xec4899, 22, 6);
            this.setBanner('EASTER EGG: ODONG-ODONG DISKO +140C', 2.4);
            this.callbacks.onEasterEggFound?.('egg_odong', 'Odong-Odong Disko', 140);
            break;
          } else if (eg.kind === 'nasgor') {
            eg.triggered = true;
            honoredBakso = true;
            this.coinsEarnedCombat += 120;
            this.nosCooldownTimer = 0;
            this.nosFuel = 1;
            this.nosActive = true;
            audioEngine.playSecretUnlock();
            this.spawnParticles(eg.x, 1.4, eg.z, 0xf97316, 22, 7);
            this.setBanner('EASTER EGG: NASGOR API TURBO! +120C', 2.4);
            this.callbacks.onEasterEggFound?.('egg_nasgor', 'Nasgor Api Turbo', 120);
            break;
          }
        }
      }

      if (!honoredBakso && this.tauntTapCount >= 3) {
        // Easter Egg: OM TELOLET OM!!
        this.tauntTapCount = 0;
        this.tauntTapWindow = 0;
        audioEngine.playTeloletHorn();
        this.coinsEarnedCombat += 75;
        this.setBanner('EASTER EGG: OM TELOLET OM! +75C', 2.3);
        this.callbacks.onEasterEggFound?.('egg_telolet', 'Om Telolet Om!', 75);
        for (const e of this.enemies) {
          if (Math.abs(e.z - this.playerZ) < 35) {
            e.stunTimer = Math.max(e.stunTimer, 1.6);
          }
        }
      } else if (!honoredBakso) {
        // Taunt-Lure: Provoke fleeing enemies ahead so they brake and come back to fight!
        let luredCount = 0;
        for (const e of this.enemies) {
          const dz = e.z - this.playerZ;
          if (dz < -8 && dz > -95) {
            e.speed = Math.min(e.speed, this.playerSpeed - 14);
            e.aiState = 'approach';
            luredCount++;
          }
        }
        if (this.wheelieTimer <= 0 && this.playerY <= 0.02) {
          this.wheelieTimer = 1.1;
          this.coinsEarnedCombat += 15;
        }
        audioEngine.playHornTaunt();
        this.setBanner(
          luredCount > 0 ? `TAUNT LURED ${luredCount} BEGAL!` : 'TAUNT +15 STYLE',
          1.2
        );
      }
    }

    // Combat Actions
    if (justAttack && this.attackCooldownTimer <= 0) {
      this.performMeleeAttack();
    }
    if (justEmp && this.empCooldownTimer <= 0) {
      this.performEmpDefense();
    }
    if (justRanged && this.rangedFireCooldown <= 0) {
      if (this.rangedAmmo > 0) {
        this.performRangedShot();
      } else {
        this.rangedFireCooldown = 0.35;
        audioEngine.playEmptyClip();
        this.setBanner('PELURU HABIS! CARI KOTAK AMUNISI DI JALAN!', 1.5);
      }
    }
    if (justTrap && this.trapCooldownTimer <= 0) {
      this.deployRearTrap();
    }
    if (justPoliceUlt && this.policeUltCharges > 0 && this.policeRaidTimer <= 0) {
      this.activatePoliceUlt();
    }

    // Advance Player Along -Z
    this.playerZ -= this.playerSpeed * dt;
    this.distanceMeters = Math.max(0, Math.floor(this.startZ - this.playerZ));

    const bucket = Math.floor(this.distanceMeters / 100);
    if (bucket > this.lastCoinDistanceBucket) {
      const deltaBuckets = bucket - this.lastCoinDistanceBucket;
      this.lastCoinDistanceBucket = bucket;
      this.coinsEarnedDistance += deltaBuckets * ECONOMY_CONFIG.coinsPer100m;
    }

    // Update Bike & Articulated Rider Character Animation
    this.playerRig.root.position.set(this.playerX, this.playerY, this.playerZ);
    const targetPitch =
      this.wheelieTimer > 0
        ? 0.38
        : this.playerY > 0.05
        ? THREE.MathUtils.clamp(this.playerVelY * 0.03, -0.25, 0.28)
        : this.nosActive
        ? 0.07
        : this.input.brake
        ? -0.06
        : 0;
    this.playerPitch = THREE.MathUtils.damp(this.playerPitch, targetPitch, 10, dt);
    this.playerRig.chassisGroup.rotation.set(this.playerPitch, 0, this.playerLean);

    // Rider Aero Tuck + Head Look + Scarf Wind Flutter + Baton Swing
    const speedRatio = this.playerSpeed / this.stats.maxSpeed;
    const targetTuck = this.nosActive ? 0.68 : 0.36 + speedRatio * 0.2;
    this.playerRig.torsoGroup.rotation.x = THREE.MathUtils.damp(
      this.playerRig.torsoGroup.rotation.x,
      targetTuck,
      10,
      dt
    );
    this.playerRig.torsoGroup.rotation.z = THREE.MathUtils.damp(
      this.playerRig.torsoGroup.rotation.z,
      -steerInput * 0.16,
      10,
      dt
    );
    this.playerRig.headGroup.rotation.y = THREE.MathUtils.damp(
      this.playerRig.headGroup.rotation.y,
      -steerInput * 0.25,
      12,
      dt
    );

    const flutterFreq = 14 + speedRatio * 18;
    this.playerRig.scarfMesh.rotation.x = 1.32 + Math.sin(this.animElapsed * flutterFreq) * 0.18;
    this.playerRig.scarfMesh.rotation.z = Math.cos(this.animElapsed * flutterFreq * 0.7) * 0.14;

    if (this.playerRig.weaponArm) {
      const targetArmYaw = this.playerArmSwingTimer > 0 ? Math.sin(this.playerArmSwingTimer * 28) * 1.4 : 0;
      const targetArmLift = this.playerArmSwingTimer > 0 ? -0.55 : 0;
      this.playerRig.weaponArm.rotation.y = THREE.MathUtils.damp(
        this.playerRig.weaponArm.rotation.y,
        targetArmYaw,
        18,
        dt
      );
      this.playerRig.weaponArm.rotation.x = THREE.MathUtils.damp(
        this.playerRig.weaponArm.rotation.x,
        targetArmLift,
        18,
        dt
      );
    }

    if (this.playerRig.shieldMesh) {
      this.playerRig.shieldMesh.visible = this.invulnTimer > 0.2;
      if (this.playerRig.shieldMesh.visible) {
        this.playerRig.shieldMesh.rotation.y += dt * 3.5;
      }
    }

    this.playerRig.contactShadow.position.y = 0.02 - this.playerY;
    const shadowMat = this.playerRig.contactShadow.material as THREE.MeshBasicMaterial;
    shadowMat.opacity = THREE.MathUtils.clamp(0.55 - this.playerY * 0.14, 0.15, 0.55);

    const wheelSpin = (this.playerSpeed / 0.33) * dt;
    this.playerRig.frontWheel.rotation.x -= wheelSpin;
    this.playerRig.rearWheel.rotation.x -= wheelSpin;

    this.playerRig.nosGlowLeft.visible = this.nosActive;
    this.playerRig.nosGlowRight.visible = this.nosActive;
    if (this.nosActive) {
      const flicker = 0.85 + Math.random() * 0.55;
      this.playerRig.nosGlowLeft.scale.set(1, 1, flicker);
      this.playerRig.nosGlowRight.scale.set(1, 1, flicker);
      if (Math.random() < 0.65) {
        this.spawnParticles(this.playerX, this.playerY + 0.45, this.playerZ + 1.2, 0x38bdf8, 1, 2.2);
      }
    }

    if (this.slashAnimTimer > 0) {
      this.slashAnimTimer -= dt;
      this.slashArcMesh.position.set(this.playerX, this.playerY + 0.78, this.playerZ - 0.3);
      this.slashArcMesh.rotation.y += dt * 18;
      if (this.slashAnimTimer <= 0) this.slashArcMesh.visible = false;
    }
    if (this.empAnimTimer > 0) {
      this.empAnimTimer -= dt;
      const progress = 1 - this.empAnimTimer / 0.45;
      this.empRingMesh.position.set(this.playerX, 0.25, this.playerZ);
      this.empRingMesh.scale.setScalar(1 + progress * 7.5);
      (this.empRingMesh.material as THREE.MeshBasicMaterial).opacity = (1 - progress) * 0.9;
      if (this.empAnimTimer <= 0) this.empRingMesh.visible = false;
    }

    this.updateRoadRecycling();
    this.updateBiomeAtmosphere(dt);
    this.updateTraffic(dt);
    this.updateCivilians(dt);
    this.updateCoins(dt);
    this.updatePowerups(dt);
    this.updateEasterEggs(dt);
    this.updateTraps(dt);
    this.updateEnemies(dt);
    this.updateBegalPickup(dt);
    this.updatePoliceRaid(dt);
    this.updateProjectiles(dt);
    this.updateParticles(dt);

    // Chase Camera (adapts FOV & pullback smoothly for mobile portrait screens)
    const shakeX = (Math.random() - 0.5) * this.cameraShake;
    const shakeY = (Math.random() - 0.5) * this.cameraShake * 0.7;
    const portraitFactor =
      this.camera.aspect < 0.95 ? THREE.MathUtils.clamp((0.95 - this.camera.aspect) / 0.5, 0, 1) : 0;

    const camTargetX = this.playerX * (0.68 - portraitFactor * 0.14) + shakeX;
    const camTargetY = 2.65 + portraitFactor * 0.55 + this.playerY * 0.45 + shakeY;
    const camTargetZ = this.playerZ + 5.8 + portraitFactor * 1.45 + (this.nosActive ? 0.55 : 0);

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, camTargetX, 11, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, camTargetY, 9, dt);
    this.camera.position.z = camTargetZ;

    const baseTargetFov = this.nosActive
      ? 75
      : this.dashAnimTimer > 0
      ? 70
      : 62 + speedRatio * 5;
    const targetFov = baseTargetFov + portraitFactor * 16;
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 7, dt);
    this.camera.updateProjectionMatrix();

    _vec3.set(this.playerX * 0.78, this.playerY + 0.95, this.playerZ - 9.0);
    this.camera.lookAt(_vec3);
    this.camera.rotation.z = THREE.MathUtils.damp(
      this.camera.rotation.z,
      -this.playerLean * 0.14,
      8,
      dt
    );

    this.keyLight.position.set(this.playerX + 16, 26, this.playerZ + 12);
    this.keyLight.target.position.set(this.playerX, 0, this.playerZ - 12);

    audioEngine.updateEngine(speedRatio, this.nosActive, false);

    this.hudEmitAccum += dt;
    if (this.hudEmitAccum >= 0.05) {
      this.hudEmitAccum = 0;
      this.emitHud();
    }
  }

  private updateRoadRecycling(): void {
    const recycleThreshold = this.playerZ + SEGMENT_LENGTH * 1.25;
    let minZ = Infinity;
    for (const seg of this.roadSegments) {
      if (seg.position.z < minZ) minZ = seg.position.z;
    }
    for (const seg of this.roadSegments) {
      if (seg.position.z > recycleThreshold) {
        minZ -= SEGMENT_LENGTH;
        seg.position.z = minZ;
      }
    }
  }

  private getCurrentTier() {
    const km = this.distanceMeters / 1000;
    return (
      DIFFICULTY_TIERS.find((t) => km >= t.minKm && km < t.maxKm) ??
      DIFFICULTY_TIERS[DIFFICULTY_TIERS.length - 1]
    );
  }

  private updateBiomeAtmosphere(dt: number): void {
    const km = this.distanceMeters / 1000;
    if (km >= 8) _color.setHex(0x16090c);
    else if (km >= 5) _color.setHex(0x070912);
    else if (km >= 3) _color.setHex(0x0b1018);
    else _color.setHex(0x090c14);

    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.lerp(_color, Math.min(1, dt * 1.5));
      this.fog.color.copy(this.scene.background);
    }
  }

  private performEvadeDash(steerInput: number): void {
    this.dashCooldownTimer = this.dashCooldownDuration;
    this.dashAnimTimer = 0.28;
    this.invulnTimer = Math.max(this.invulnTimer, 0.42);
    let dir = steerInput;
    if (dir === 0) {
      dir = this.playerX > 0 ? -1 : 1;
    }
    this.dashVelX = dir * 24;
    audioEngine.playDash();
    this.spawnParticles(this.playerX, 0.5, this.playerZ, 0x38bdf8, 10, 4.5);
  }

  private performMeleeAttack(): void {
    const w = this.currentMelee;
    this.attackCooldownTimer = w.cooldown;
    this.slashAnimTimer = Math.min(0.24, w.cooldown * 0.65);
    this.playerArmSwingTimer = Math.min(0.28, w.cooldown * 0.72);
    (this.slashArcMesh.material as THREE.MeshBasicMaterial).color.setHex(w.slashColor);
    this.slashArcMesh.scale.setScalar(w.reachX / 3.5);
    this.slashArcMesh.visible = true;
    if (w.id === 'katana') {
      audioEngine.playKatanaSlash();
    } else {
      audioEngine.playAttack();
    }

    const baseDmg = Math.round(this.stats.attackDamage * w.damageMult);
    let hitAny = false;
    let parriedAny = false;
    let reflectedCount = 0;

    // Katana Plasma bullet deflection!
    if (w.reflectsBullets) {
      for (const p of this.projectiles) {
        if (!p.fromPlayer && Math.hypot(p.x - this.playerX, p.z - this.playerZ) < 5.2) {
          p.fromPlayer = true;
          p.vx = -p.vx * 1.35;
          p.vz = -(this.playerSpeed + 58);
          p.damage = Math.round(baseDmg * 1.15);
          p.life = 1.8;
          (p.mesh.material as THREE.MeshBasicMaterial).color.setHex(0x22d3ee);
          this.spawnParticles(p.x, p.y, p.z, 0x22d3ee, 8, 5);
          reflectedCount++;
        }
      }
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const dx = e.x - this.playerX;
      const dz = e.z - this.playerZ;
      if (Math.abs(dx) < w.reachX && Math.abs(dz) < w.reachZ) {
        hitAny = true;
        if (e.aiState === 'telegraph') {
          parriedAny = true;
          e.aiState = 'recover';
          e.stateTimer = 1.6;
          e.stunTimer = 1.3;
          this.coinsEarnedCombat += 35;
          this.damageEnemy(
            e,
            Math.round(baseDmg * 1.8),
            Math.sign(dx || 1) * 6.5 * w.knockbackMult
          );
        } else {
          this.damageEnemy(e, baseDmg, Math.sign(dx || 1) * 4.5 * w.knockbackMult);
        }
      }
    }

    if (this.pickupEnemy) {
      const pk = this.pickupEnemy;
      const dx = pk.x - this.playerX;
      const dz = pk.z - this.playerZ;
      if (Math.abs(dx) < w.reachX + 0.85 && Math.abs(dz) < w.reachZ + 1.1) {
        hitAny = true;
        this.damageBegalPickup(baseDmg, Math.sign(dx || 1) * 2.2 * w.knockbackMult);
      }
    }

    if (reflectedCount > 0) {
      this.hitstopTimer = 0.05;
      this.cameraShake = Math.max(this.cameraShake, 0.28);
      audioEngine.playParry();
      this.setBanner(`KATANA TANGKIS ${reflectedCount} PELURU!`, 1.4);
    } else if (parriedAny) {
      this.hitstopTimer = 0.065;
      this.cameraShake = Math.max(this.cameraShake, 0.36);
      audioEngine.playParry();
      this.setBanner('COUNTER PARRY +35C', 1.4);
    } else if (hitAny) {
      this.hitstopTimer = 0.042;
      this.cameraShake = Math.max(this.cameraShake, 0.25);
      audioEngine.playImpact(false);
    }
  }

  private performRangedShot(): void {
    const w = this.currentRanged;
    this.rangedFireCooldown = w.fireCooldown;
    this.rangedAmmo = Math.max(0, this.rangedAmmo - 1);

    if (w.id === 'shotgun') audioEngine.playShotgun();
    else if (w.id === 'smg') audioEngine.playSmg();
    else if (w.id === 'rpg') audioEngine.playRocketLaunch();
    else audioEngine.playShoot();

    // Prioritize locking onto enemies ahead (up to 95m) so fleeing enemies can always be caught!
    let targetEnemy: EnemyEntity | null = null;
    let targetPickup = false;
    let bestScore = Infinity;
    for (const e of this.enemies) {
      const dz = e.z - this.playerZ; // negative = ahead
      const dist = Math.hypot(e.x - this.playerX, dz);
      if (dz < 12 && dist < 95) {
        const priorityScore = dz < -8 ? dist * 0.72 : dist;
        if (priorityScore < bestScore) {
          bestScore = priorityScore;
          targetEnemy = e;
        }
      }
    }

    if (this.pickupEnemy) {
      const pk = this.pickupEnemy;
      const dz = pk.z - this.playerZ;
      const dist = Math.hypot(pk.x - this.playerX, dz);
      if (dz < 14 && dist < 95) {
        const score = dz < -6 ? dist * 0.65 : dist * 0.85;
        if (score < bestScore) {
          targetPickup = true;
          targetEnemy = null;
        }
      }
    }

    let aimDirX = 0;
    let aimDirZ = -1;
    if (w.homing && targetPickup && this.pickupEnemy) {
      const dx = this.pickupEnemy.x - this.playerX;
      const dz = this.pickupEnemy.z - this.playerZ - 1.2;
      const len = Math.max(1, Math.hypot(dx, dz));
      aimDirX = dx / len;
      aimDirZ = dz / len;
    } else if (w.homing && targetEnemy) {
      const dx = targetEnemy.x - this.playerX;
      const dz = targetEnemy.z - this.playerZ - 1.2;
      const len = Math.max(1, Math.hypot(dx, dz));
      aimDirX = dx / len;
      aimDirZ = dz / len;
    }

    const boltColor = targetEnemy || targetPickup ? w.boltColor : 0x38bdf8;
    const perPelletDmg = Math.round(this.stats.attackDamage * w.damageMult);

    for (let pIdx = 0; pIdx < w.pellets; pIdx++) {
      const mesh = createRangedProjectileMesh(w.id, boltColor);
      mesh.position.set(this.playerX + 0.25, this.playerY + 0.95, this.playerZ - 0.9);
      this.scene.add(mesh);

      const spreadAngle =
        w.pellets > 1
          ? (pIdx - (w.pellets - 1) / 2) * w.spread
          : (Math.random() - 0.5) * w.spread;
      const cosA = Math.cos(spreadAngle);
      const sinA = Math.sin(spreadAngle);
      const rotX = aimDirX * cosA - aimDirZ * sinA;
      const rotZ = aimDirX * sinA + aimDirZ * cosA;

      this.projectiles.push({
        mesh,
        x: mesh.position.x,
        y: mesh.position.y,
        z: mesh.position.z,
        vx: rotX * w.projectileSpeed,
        vz: -this.playerSpeed + rotZ * w.projectileSpeed,
        damage: perPelletDmg,
        life: w.id === 'rpg' ? 2.4 : 2.0,
        fromPlayer: true,
        targetEnemyId: w.homing ? (targetPickup ? -999 : targetEnemy?.id) : undefined,
        explosionRadius: w.explosionRadius,
        weaponId: w.id,
      });
    }
  }

  private deployRearTrap(): void {
    this.trapCooldownTimer = this.trapCooldownDuration;
    audioEngine.playTrapDrop();
    const mesh = createSpikeTrapMesh(this.textures);
    const tx = this.playerX;
    const tz = this.playerZ + 1.8;
    mesh.position.set(tx, 0, tz);
    this.scene.add(mesh);
    this.traps.push({ mesh, x: tx, z: tz, life: 12 });
    this.setBanner('SPIKE TRAP DEPLOYED', 1.1);
  }

  private performEmpDefense(): void {
    this.empCooldownTimer = 8.5;
    this.empAnimTimer = 0.45;
    this.invulnTimer = Math.max(this.invulnTimer, 1.35);
    this.empRingMesh.visible = true;
    audioEngine.playEmp();
    this.setBanner('EMP GUARD PULSE', 1.2);

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      if (!this.projectiles[i].fromPlayer) {
        this.scene.remove(this.projectiles[i].mesh);
        this.projectiles.splice(i, 1);
      }
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const dx = e.x - this.playerX;
      const dz = e.z - this.playerZ;
      const dist = Math.hypot(dx, dz);
      if (dist < 8.8) {
        e.stunTimer = 1.7;
        this.damageEnemy(e, Math.round(this.stats.attackDamage * 0.8), Math.sign(dx || 1) * 5.2);
      }
    }

    if (this.pickupEnemy) {
      const pk = this.pickupEnemy;
      const dx = pk.x - this.playerX;
      const dz = pk.z - this.playerZ;
      if (Math.hypot(dx, dz) < 10.5) {
        pk.stunTimer = 1.5;
        this.damageBegalPickup(Math.round(this.stats.attackDamage * 1.1), Math.sign(dx || 1) * 2.5);
      }
    }
  }

  private damageEnemy(e: EnemyEntity, dmg: number, knockX: number): void {
    e.hp -= dmg;
    e.hitFlashTimer = 0.15;
    e.x = THREE.MathUtils.clamp(e.x + knockX * 0.45, -ROAD_HALF_WIDTH, ROAD_HALF_WIDTH);
    e.speed -= 4;
    this.spawnParticles(e.x, 0.85, e.z, 0xfacc15, 10, 5.5);

    if (e.ambushCivilianId !== undefined) {
      e.ambushHits = (e.ambushHits ?? 0) + 1;
      const civ = this.civilians.find((c) => c.id === e.ambushCivilianId && c.underAttack);
      if (civ) {
        if (e.hp <= 0 || e.stunTimer > 0.6 || e.ambushHits >= 2) {
          e.ambushCivilianId = undefined;
          this.rescueCivilian(civ);
        } else {
          this.setBanner('BEGAL DIALIHKAN! HABISI SEKARANG!', 1.2);
        }
      }
    }

    if (e.hp <= 0) {
      const spec = ENEMY_SPECS[e.type];
      this.enemiesDefeated += 1;
      this.comboCount += 1;
      this.comboTimer = 4.5;
      const bonus = this.comboCount > 1 ? (this.comboCount - 1) * 10 : 0;
      const mult = this.magnetTimer > 0 ? 2 : 1;
      this.coinsEarnedCombat += (spec.coinReward + bonus) * mult;

      if (e.type === 'boss') {
        this.bossDefeatedRun = true;
        this.setBanner(`BOSS DEFEATED +${spec.coinReward * mult} COINS`, 2.4);
      } else if (this.comboCount >= 2) {
        this.setBanner(`${this.comboCount}X TAKEDOWN`, 1.2);
      }

      this.spawnParticles(e.x, 0.9, e.z, 0xef4444, 18, 7.5);
      audioEngine.playImpact(true);
      this.scene.remove(e.rig.root);
      const idx = this.enemies.indexOf(e);
      if (idx !== -1) this.enemies.splice(idx, 1);
    }
  }

  private applyPlayerDamage(amount: number, sourceLabel: string): void {
    if (this.invulnTimer > 0 || this.screenMode !== 'playing') return;

    const finalDmg = this.karmaCap === 'pelindung' ? Math.max(1, Math.round(amount * 0.8)) : amount;
    this.health = Math.max(0, this.health - finalDmg);
    this.invulnTimer = 0.75;
    this.damageFlash = 1.0;
    this.cameraShake = Math.max(this.cameraShake, 0.42);
    this.hitstopTimer = 0.048;
    audioEngine.playImpact(true);
    this.spawnParticles(this.playerX, this.playerY + 0.8, this.playerZ, 0xef4444, 12, 6);

    if (this.health <= 0) {
      this.triggerGameOver();
    } else {
      this.setBanner(sourceLabel, 1.0);
    }
  }

  private triggerGameOver(): void {
    this.screenMode = 'gameover';
    audioEngine.stopEngine();
    audioEngine.setMusicMode('menu');
    this.emitHud();
    this.callbacks.onGameOver({
      distanceMeters: this.distanceMeters,
      enemiesEngaged: this.enemiesEngagedTotal,
      enemiesDefeated: this.enemiesDefeated,
      civiliansSaved: this.civiliansSaved,
      civiliansIgnored: this.civiliansIgnored,
      karmaCap: this.karmaCap,
      coinsEarnedDistance: this.coinsEarnedDistance,
      coinsEarnedCombat: this.coinsEarnedCombat,
      nosUses: this.nosUsesRun,
      bossDefeated: this.bossDefeatedRun,
    });
  }

  private spawnBegalBarricadeWave(): void {
    const tier = this.getCurrentTier();
    const km = this.distanceMeters / 1000;
    const count = km >= 4.5 ? (Math.random() < 0.45 ? 3 : 2) : km >= 1.5 ? 2 : 1;
    const lanes = [...LANE_CENTERS];
    for (let i = lanes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
    }
    const chosenLanes = lanes.slice(0, count); // Always leaves at least 1-3 escape lanes!
    const spawnZ = this.playerZ - 148;

    for (const laneX of chosenLanes) {
      const rig = createTrafficVehicle('begal_barricade', this.textures);
      rig.root.position.set(laneX, 0, spawnZ);
      this.scene.add(rig.root);
      this.traffic.push({
        rig,
        x: laneX,
        z: spawnZ,
        speed: 0,
        hitCooldown: 0,
        nearMissed: false,
      });
    }

    this.barricadeSpawnTimer = Math.max(5.5, 10.5 - tier.minKm * 0.35) + Math.random() * 3.5;
    if (this.statusBannerTimer <= 0) {
      this.setBanner('AWAS BARIKADE PEMBEGAL DI DEPAN!', 1.8);
    }
  }

  private spawnStreetHazard(): void {
    const roll = Math.random();
    const kind: 'pasar_malam' | 'tukang_parkir' | 'pesepeda' =
      roll < 0.34 ? 'pasar_malam' : roll < 0.68 ? 'tukang_parkir' : 'pesepeda';
    const side: -1 | 1 = Math.random() < 0.5 ? -1 : 1;
    const spawnZ = this.playerZ - 148 - Math.random() * 14;

    const blockedOnSide = this.traffic.some(
      (t) => Math.abs(t.z - spawnZ) < 16 && Math.sign(t.x || side) === side
    );
    const chosenSide: -1 | 1 = blockedOnSide ? (-side as -1 | 1) : side;

    const rig = createTrafficVehicle(kind, this.textures, chosenSide);
    const startX =
      kind === 'pasar_malam'
        ? chosenSide * 4.55
        : kind === 'tukang_parkir'
        ? chosenSide * 5.65
        : chosenSide * 4.65;
    const targetX = kind === 'tukang_parkir' ? chosenSide * 3.72 : startX;
    const speed = kind === 'pesepeda' ? 7.5 : kind === 'tukang_parkir' ? 2.2 : 0;

    rig.root.position.set(startX, 0, spawnZ);
    this.scene.add(rig.root);

    this.traffic.push({
      rig,
      x: startX,
      z: spawnZ,
      speed,
      hitCooldown: 0,
      nearMissed: false,
      side: chosenSide,
      targetX,
      attendantWorldX: kind === 'tukang_parkir' ? chosenSide * 6.95 : undefined,
      hazardTriggered: false,
    });

    this.streetHazardSpawnTimer = 6.5 + Math.random() * 4.2;
  }

  private updateTraffic(dt: number): void {
    this.barricadeSpawnTimer -= dt;
    if (this.barricadeSpawnTimer <= 0 && this.traffic.length < 10) {
      this.spawnBegalBarricadeWave();
    }

    this.streetHazardSpawnTimer -= dt;
    if (this.streetHazardSpawnTimer <= 0 && this.traffic.length < 11) {
      this.spawnStreetHazard();
    }

    this.trafficSpawnTimer -= dt;
    if (this.trafficSpawnTimer <= 0 && this.traffic.length < 9) {
      const tier = this.getCurrentTier();
      this.trafficSpawnTimer = Math.max(0.85, 2.2 - tier.minKm * 0.12) + Math.random() * 1.1;

      const roll = Math.random();
      const kind: TrafficRig['kind'] =
        roll < 0.24
          ? 'angkot'
          : roll < 0.44
          ? 'sedan'
          : roll < 0.58
          ? 'bus'
          : roll < 0.74
          ? 'barrier'
          : roll < 0.88
          ? 'truck'
          : 'ramp';
      const rig = createTrafficVehicle(kind, this.textures);
      const laneX = LANE_CENTERS[Math.floor(Math.random() * LANE_CENTERS.length)];
      const spawnZ = this.playerZ - 145 - Math.random() * 25;
      rig.root.position.set(laneX, 0, spawnZ);
      this.scene.add(rig.root);

      const tSpeed =
        kind === 'sedan'
          ? 21
          : kind === 'angkot'
          ? 15
          : kind === 'bus'
          ? 13
          : kind === 'truck'
          ? 11
          : 0;
      this.traffic.push({ rig, x: laneX, z: spawnZ, speed: tSpeed, hitCooldown: 0, nearMissed: false });
    }

    for (let i = this.traffic.length - 1; i >= 0; i--) {
      const t = this.traffic[i];
      if (t.hitCooldown > 0) t.hitCooldown -= dt;
      t.z -= t.speed * dt;

      // Dynamic behaviors & animations for Indonesian street hazards
      if (t.rig.kind === 'tukang_parkir') {
        if (t.z > this.playerZ - 70 && t.z < this.playerZ - 4) {
          if (!t.hazardTriggered) {
            t.hazardTriggered = true;
            audioEngine.playParkingWhistle();
            if (this.statusBannerTimer <= 0) {
              this.setBanner('TUKANG PARKIR: MOBIL KELUAR!', 1.5);
            }
          }
          if (t.targetX !== undefined) {
            t.x = THREE.MathUtils.damp(t.x, t.targetX, 2.2, dt);
          }
        }
        if (t.rig.attendantGroup && t.attendantWorldX !== undefined) {
          t.rig.attendantGroup.position.x = t.attendantWorldX - t.x;
        }
        if (t.rig.batonArm) {
          t.rig.batonArm.rotation.z =
            Math.sin(this.animElapsed * (t.hazardTriggered ? 14 : 6)) * 0.55;
        }
        if (t.rig.hazardLights) {
          const blink = Math.floor(this.animElapsed * 8) % 2 === 0;
          for (const hl of t.rig.hazardLights) {
            hl.visible = blink;
          }
        }
      } else if (t.rig.kind === 'pesepeda') {
        if (t.rig.animatedWheels) {
          const spin = (t.speed / 0.34) * dt;
          for (const w of t.rig.animatedWheels) {
            w.rotation.x -= spin;
          }
        }
        if (t.z > this.playerZ - 36 && t.z < this.playerZ - 4 && !t.hazardTriggered) {
          t.hazardTriggered = true;
          audioEngine.playBikeBell();
        }
      } else if (t.rig.kind === 'pasar_malam' && t.rig.stringBulbs) {
        t.rig.stringBulbs.forEach((b, idx) => {
          const s = 0.85 + Math.sin(this.animElapsed * 9 + idx * 1.1) * 0.28;
          b.scale.setScalar(s);
        });
      }

      t.rig.root.position.set(t.x, 0, t.z);

      if (t.z > this.playerZ + 22) {
        this.scene.remove(t.rig.root);
        this.traffic.splice(i, 1);
        continue;
      }

      const dx = Math.abs(this.playerX - t.x);
      const dz = Math.abs(this.playerZ - t.z);

      // Collision check
      if (dx < t.rig.halfWidth + 0.42 && dz < t.rig.halfLength + 0.85) {
        if (t.rig.isRamp) {
          if (this.playerY < 0.6) {
            this.playerVelY = this.stats.jumpForce * 1.28;
            this.playerY = 0.4;
            audioEngine.playJump();
            this.setBanner('RAMP STUNT +25C', 1.1);
            if (t.hitCooldown <= 0) {
              this.coinsEarnedCombat += 25;
              this.nosCooldownTimer = Math.max(0, this.nosCooldownTimer - 1.2);
              t.hitCooldown = 2;
            }
          }
        } else if (this.playerY < t.rig.height - 0.15 && t.hitCooldown <= 0) {
          t.hitCooldown = 0.85;
          t.nearMissed = true;
          const pushDir = this.playerX >= t.x ? 1 : -1;
          this.playerX = THREE.MathUtils.clamp(
            this.playerX + pushDir * 1.1,
            -ROAD_HALF_WIDTH,
            ROAD_HALF_WIDTH
          );
          if (t.rig.kind === 'begal_barricade') {
            this.playerSpeed *= 0.56;
            audioEngine.playBarricadeCrash();
            this.spawnParticles(t.x, 0.8, t.z, 0xf97316, 18, 7.5);
            this.applyPlayerDamage(28, 'NABRAK BARIKADE BEGAL!');
          } else if (t.rig.kind === 'pasar_malam') {
            this.playerSpeed *= 0.62;
            this.spawnParticles(t.x, 1.0, t.z, 0xfacc15, 16, 6.5);
            this.applyPlayerDamage(22, 'NABRAK LAPAK PASAR MALAM!');
          } else if (t.rig.kind === 'tukang_parkir') {
            this.playerSpeed *= 0.62;
            this.applyPlayerDamage(20, 'NABRAK MOBIL KELUAR PARKIR!');
          } else if (t.rig.kind === 'pesepeda') {
            this.playerSpeed *= 0.72;
            this.applyPlayerDamage(18, 'NABRAK PESEPEDA PINGGIR JALAN!');
          } else {
            this.playerSpeed *= 0.68;
            this.applyPlayerDamage(
              t.rig.kind === 'truck' || t.rig.kind === 'bus' ? 24 : 16,
              'TRAFFIC COLLISION'
            );
          }
        }
      } else if (
        !t.nearMissed &&
        !t.rig.isRamp &&
        t.hitCooldown <= 0 &&
        t.z > this.playerZ &&
        t.z < this.playerZ + 2.8 &&
        dx < t.rig.halfWidth + 1.35
      ) {
        // Near-Miss Slipstream Bonus!
        t.nearMissed = true;
        this.nearMissCount += 1;
        this.coinsEarnedCombat += this.magnetTimer > 0 ? 30 : 15;
        if (!this.nosActive) {
          this.nosCooldownTimer = Math.max(0, this.nosCooldownTimer - this.stats.nosCooldown * 0.2);
        }
        audioEngine.playNearMiss();
        this.setBanner('NEAR MISS +15C · +NOS', 1.0);
      }
    }
  }

  private updateCoins(dt: number): void {
    this.coinSpawnTimer -= dt;
    if (this.coinSpawnTimer <= 0 && this.coins.length < 12) {
      this.coinSpawnTimer = 1.5 + Math.random() * 1.1;
      const laneX = LANE_CENTERS[Math.floor(Math.random() * LANE_CENTERS.length)];
      const baseZ = this.playerZ - 125;
      const geo = new THREE.CylinderGeometry(0.42, 0.42, 0.1, 14);
      geo.rotateX(Math.PI / 2);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        emissive: 0xeab308,
        emissiveIntensity: 0.7,
        roughness: 0.2,
        metalness: 0.85,
      });

      for (let k = 0; k < 3; k++) {
        const mesh = new THREE.Mesh(geo, mat);
        const cz = baseZ - k * 3.5;
        mesh.position.set(laneX, 0.75, cz);
        this.scene.add(mesh);
        this.coins.push({ mesh, x: laneX, z: cz });
      }
    }

    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      c.mesh.rotation.y += dt * 3.5;

      // Magnetic coin pull when magnet powerup is active
      if (this.magnetTimer > 0) {
        const dist = Math.hypot(this.playerX - c.x, this.playerZ - c.z);
        if (dist < 14) {
          c.x = THREE.MathUtils.damp(c.x, this.playerX, 9, dt);
          c.z = THREE.MathUtils.damp(c.z, this.playerZ, 9, dt);
          c.mesh.position.set(c.x, 0.75, c.z);
        }
      }

      if (c.z > this.playerZ + 14) {
        this.scene.remove(c.mesh);
        this.coins.splice(i, 1);
        continue;
      }

      if (
        Math.abs(c.x - this.playerX) < 1.2 &&
        Math.abs(c.z - this.playerZ) < 1.4 &&
        this.playerY < 1.9
      ) {
        this.coinsEarnedCombat += this.magnetTimer > 0 ? 20 : 10;
        audioEngine.playCoin();
        this.spawnParticles(c.x, 0.8, c.z, 0xfacc15, 6, 3.2);
        this.scene.remove(c.mesh);
        this.coins.splice(i, 1);
      }
    }
  }

  private updatePowerups(dt: number): void {
    const lowAmmo = this.rangedAmmo <= Math.ceil(this.rangedMaxAmmo * 0.3);
    this.powerupSpawnTimer -= dt;
    if (this.powerupSpawnTimer <= 0 && this.powerups.length < 3) {
      this.powerupSpawnTimer = lowAmmo ? 3.5 + Math.random() * 2.2 : 5.5 + Math.random() * 3.0;
      const roll = Math.random();
      const ammoThreshold = lowAmmo ? 0.78 : 0.58;
      const kind: PowerupKind =
        roll < ammoThreshold
          ? 'ammo'
          : roll < ammoThreshold + 0.16
          ? 'heal'
          : roll < ammoThreshold + 0.3
          ? 'nos'
          : 'magnet';
      const mesh = createPowerupMesh(kind);
      const lz = this.playerZ - 140;
      const safeLanes = LANE_CENTERS.filter(
        (lx) =>
          !this.traffic.some(
            (t) =>
              t.rig.kind === 'begal_barricade' &&
              Math.abs(t.x - lx) < 1.5 &&
              Math.abs(t.z - lz) < 14
          )
      );
      const pool = safeLanes.length > 0 ? safeLanes : LANE_CENTERS;
      const lx = pool[Math.floor(Math.random() * pool.length)];
      mesh.position.set(lx, 0, lz);
      this.scene.add(mesh);
      this.powerups.push({ mesh, kind, x: lx, z: lz });
    }

    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const pw = this.powerups[i];
      pw.mesh.rotation.y += dt * 2.8;
      if (pw.z > this.playerZ + 16) {
        this.scene.remove(pw.mesh);
        this.powerups.splice(i, 1);
        continue;
      }

      if (
        Math.abs(pw.x - this.playerX) < 1.35 &&
        Math.abs(pw.z - this.playerZ) < 1.5 &&
        this.playerY < 2.0
      ) {
        if (pw.kind === 'ammo') {
          audioEngine.playAmmoPickup();
          const added = Math.min(
            this.rangedMaxAmmo - this.rangedAmmo,
            this.currentRanged.ammoPerPickup
          );
          this.rangedAmmo += added;
          if (added > 0) {
            this.setBanner(`AMUNISI +${added} (${this.rangedAmmo}/${this.rangedMaxAmmo})`, 1.4);
          } else {
            this.coinsEarnedCombat += 25;
            this.setBanner('AMUNISI PENUH! +25C', 1.4);
          }
          this.spawnParticles(pw.x, 0.9, pw.z, 0xf59e0b, 14, 5);
        } else {
          audioEngine.playPickup();
          if (pw.kind === 'heal') {
            this.health = Math.min(this.stats.maxHealth, this.health + 30);
            this.setBanner('REPAIR KIT +30 HP', 1.4);
            this.spawnParticles(pw.x, 0.9, pw.z, 0x10b981, 14, 5);
          } else if (pw.kind === 'nos') {
            this.nosCooldownTimer = 0;
            this.nosFuel = 1;
            this.setBanner('NITRO CELL REFILLED', 1.4);
            this.spawnParticles(pw.x, 0.9, pw.z, 0x38bdf8, 14, 5);
          } else {
            this.magnetTimer = 10;
            this.setBanner('MAGNET + 2X COINS (10S)', 1.5);
            this.spawnParticles(pw.x, 0.9, pw.z, 0xfacc15, 14, 5);
          }
        }
        this.scene.remove(pw.mesh);
        this.powerups.splice(i, 1);
      }
    }
  }

  private updateEasterEggs(dt: number): void {
    // 1. Roadside Gerobak Bakso Malam
    if (this.distanceMeters >= this.nextBaksoMeters) {
      this.nextBaksoMeters += 680 + Math.floor(Math.random() * 260);
      const mesh = createBaksoCartMesh(this.textures);
      const side = Math.random() < 0.5 ? -1 : 1;
      const bx = side * 6.4;
      const bz = this.playerZ - 135;
      mesh.position.set(bx, 0, bz);
      this.scene.add(mesh);
      this.easterEggProps.push({
        mesh,
        kind: 'bakso',
        x: bx,
        z: bz,
        speed: 0,
        triggered: false,
      });
    }

    // 2. Odong-Odong Neon Malam
    if (this.distanceMeters >= this.nextOdongMeters) {
      this.nextOdongMeters += 760 + Math.floor(Math.random() * 320);
      const mesh = createOdongMesh(this.textures);
      const ox = LANE_CENTERS[Math.random() < 0.5 ? 0 : 3];
      const oz = this.playerZ - 130;
      mesh.position.set(ox, 0, oz);
      this.scene.add(mesh);
      this.easterEggProps.push({
        mesh,
        kind: 'odong',
        x: ox,
        z: oz,
        speed: 12,
        triggered: false,
      });
    }

    // 3. Pak Ogah Emas
    if (this.distanceMeters >= this.nextPakOgahMeters) {
      this.nextPakOgahMeters += 820 + Math.floor(Math.random() * 320);
      const mesh = createPakOgahMesh(this.textures);
      const side = Math.random() < 0.5 ? -1 : 1;
      const px = side * 5.6;
      const pz = this.playerZ - 135;
      mesh.position.set(px, 0, pz);
      this.scene.add(mesh);
      this.easterEggProps.push({
        mesh,
        kind: 'pakogah',
        x: px,
        z: pz,
        speed: 0,
        triggered: false,
      });
    }

    // 4. Spectral Midnight Ghost Scooter
    if (this.distanceMeters >= this.nextGhostMeters) {
      this.nextGhostMeters += 950 + Math.floor(Math.random() * 450);
      const mesh = createGhostScooterMesh();
      const gx = LANE_CENTERS[Math.floor(Math.random() * LANE_CENTERS.length)];
      const gz = this.playerZ - 115;
      mesh.position.set(gx, 0, gz);
      this.scene.add(mesh);
      this.easterEggProps.push({
        mesh,
        kind: 'ghost',
        x: gx,
        z: gz,
        speed: Math.max(18, this.playerSpeed * 0.72),
        triggered: false,
      });
    }

    // 5. Gerobak Nasgor Api Turbo
    if (this.distanceMeters >= this.nextNasgorMeters) {
      this.nextNasgorMeters += 880 + Math.floor(Math.random() * 340);
      const mesh = createNasgorCartMesh(this.textures);
      const side = Math.random() < 0.5 ? -1 : 1;
      const nx = side * 6.4;
      const nz = this.playerZ - 135;
      mesh.position.set(nx, 0, nz);
      this.scene.add(mesh);
      this.easterEggProps.push({
        mesh,
        kind: 'nasgor',
        x: nx,
        z: nz,
        speed: 0,
        triggered: false,
      });
    }

    // 6. Kucing Oren Penguasa Jalan
    if (this.distanceMeters >= this.nextKucingMeters) {
      this.nextKucingMeters += 1100 + Math.floor(Math.random() * 420);
      const mesh = createKucingOrenMesh(this.textures);
      const side = Math.random() < 0.5 ? -1 : 1;
      const kx = side * 6.5;
      const kz = this.playerZ - 135;
      mesh.position.set(kx, 0, kz);
      this.scene.add(mesh);
      this.easterEggProps.push({
        mesh,
        kind: 'kucing',
        x: kx,
        z: kz,
        speed: 0,
        triggered: false,
      });
    }

    for (let i = this.easterEggProps.length - 1; i >= 0; i--) {
      const eg = this.easterEggProps[i];
      if (eg.kind === 'ghost') {
        eg.z -= eg.speed * dt;
        eg.mesh.position.set(eg.x, Math.sin(this.animElapsed * 5) * 0.14, eg.z);

        if (
          !eg.triggered &&
          Math.abs(eg.x - this.playerX) < 2.6 &&
          Math.abs(eg.z - this.playerZ) < 3.0
        ) {
          eg.triggered = true;
          this.coinsEarnedCombat += 150;
          this.magnetTimer = Math.max(this.magnetTimer, 8);
          this.invulnTimer = Math.max(this.invulnTimer, 4.0);
          audioEngine.playGhostChime();
          this.spawnParticles(eg.x, 1.0, eg.z, 0x22d3ee, 20, 6);
          this.setBanner('EASTER EGG: PENUNGGU MALAM +150C', 2.4);
          this.callbacks.onEasterEggFound?.('egg_ghost', 'Penunggu Malam', 150);
        }
      } else if (eg.kind === 'odong') {
        eg.z -= eg.speed * dt;
        eg.mesh.position.set(eg.x, Math.sin(this.animElapsed * 8) * 0.06, eg.z);

        if (
          !eg.triggered &&
          Math.abs(eg.x - this.playerX) < 2.8 &&
          Math.abs(eg.z - this.playerZ) < 3.4
        ) {
          eg.triggered = true;
          this.coinsEarnedCombat += 140;
          this.nosCooldownTimer = 0;
          this.nosFuel = 1;
          this.magnetTimer = Math.max(this.magnetTimer, 10);
          audioEngine.playTeloletHorn();
          this.spawnParticles(eg.x, 1.5, eg.z, 0xec4899, 22, 6);
          this.setBanner('EASTER EGG: ODONG-ODONG DISKO +140C', 2.4);
          this.callbacks.onEasterEggFound?.('egg_odong', 'Odong-Odong Disko', 140);
        }
      } else if (eg.kind === 'kucing') {
        eg.mesh.rotation.y = Math.sin(this.animElapsed * 2.5) * 0.12;
        if (
          !eg.triggered &&
          Math.abs(eg.x - this.playerX) < 3.6 &&
          Math.abs(eg.z - this.playerZ) < 3.8
        ) {
          eg.triggered = true;
          this.coinsEarnedCombat += 200;
          this.health = Math.min(this.stats.maxHealth, this.health + 30);
          this.invulnTimer = Math.max(this.invulnTimer, 5.0);
          audioEngine.playSecretUnlock();
          this.spawnParticles(eg.x, 1.8, eg.z, 0xfacc15, 24, 7);
          this.setBanner('EASTER EGG: BERKAH KUCING OREN! +200C', 2.5);
          this.callbacks.onEasterEggFound?.('egg_kucing', 'Berkah Kucing Oren', 200);
        } else if (!eg.triggered && Math.abs(eg.z - this.playerZ) < 24 && eg.z < this.playerZ) {
          if (this.statusBannerTimer <= 0) {
            this.setBanner('KUCING OREN! LOMPAT / DEKATI PINGGIR', 1.4);
          }
        }
      } else if (!eg.triggered && Math.abs(eg.z - this.playerZ) < 24 && eg.z < this.playerZ) {
        if (this.statusBannerTimer <= 0) {
          const hintText =
            eg.kind === 'bakso'
              ? 'WARUNG BAKSO! KLAKSON [Q]'
              : eg.kind === 'pakogah'
              ? 'PAK OGAH! KLAKSON [Q]'
              : 'NASGOR MALAM! KLAKSON [Q] / JUMP';
          this.setBanner(hintText, 1.4);
        }
      }

      if (eg.z > this.playerZ + 28) {
        this.scene.remove(eg.mesh);
        this.easterEggProps.splice(i, 1);
      }
    }
  }

  private updateTraps(dt: number): void {
    for (let i = this.traps.length - 1; i >= 0; i--) {
      const tr = this.traps[i];
      tr.life -= dt;
      if (tr.life <= 0 || tr.z > this.playerZ + 45) {
        this.scene.remove(tr.mesh);
        this.traps.splice(i, 1);
        continue;
      }

      if (
        this.pickupEnemy &&
        Math.abs(this.pickupEnemy.x - tr.x) < 2.25 &&
        Math.abs(this.pickupEnemy.z - tr.z) < 2.5
      ) {
        this.pickupEnemy.stunTimer = 2.1;
        this.damageBegalPickup(95, (Math.random() < 0.5 ? -1 : 1) * 3.0);
        this.setBanner('PICK-UP KENA RANJAU! +95 DMG', 1.3);
        this.scene.remove(tr.mesh);
        this.traps.splice(i, 1);
        continue;
      }

      // Check collision with pursuing enemies
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        if (Math.abs(e.x - tr.x) < 1.45 && Math.abs(e.z - tr.z) < 1.1) {
          e.stunTimer = 1.9;
          this.damageEnemy(e, 50, (Math.random() < 0.5 ? -1 : 1) * 5.5);
          this.setBanner('TRAP HIT!', 1.0);
          this.scene.remove(tr.mesh);
          this.traps.splice(i, 1);
          break;
        }
      }
    }
  }

  private updateEnemies(dt: number): void {
    const tier = this.getCurrentTier();
    const km = this.distanceMeters / 1000;

    const hasBoss = this.enemies.some((e) => e.type === 'boss');
    if (km >= 8 && Math.floor((km - 8) / 4) + 1 > this.bossSpawnedKm && !hasBoss) {
      this.bossSpawnedKm += 1;
      this.spawnEnemy('boss');
      audioEngine.playBossSiren();
      this.setBanner('WARNING: BOSS RIDER INCOMING', 2.8);
    }

    this.enemySpawnTimer -= dt;
    if (this.enemySpawnTimer <= 0 && this.enemies.length < tier.maxActiveEnemies) {
      this.enemySpawnTimer = tier.spawnInterval * (0.8 + Math.random() * 0.45);
      const chosenType = tier.allowedTypes[Math.floor(Math.random() * tier.allowedTypes.length)];
      this.spawnEnemy(chosenType);
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const spec = ENEMY_SPECS[e.type];

      if (e.hitFlashTimer > 0) {
        e.hitFlashTimer -= dt;
        const flashOn = e.hitFlashTimer > 0;
        for (const m of e.rig.hitFlashMaterials) {
          m.emissive.setHex(flashOn ? 0xffffff : 0x000000);
          m.emissiveIntensity = flashOn ? 0.9 : 0;
        }
      }

      // Flutter enemy scarf/cape
      e.rig.scarfMesh.rotation.x = 1.3 + Math.sin(this.animElapsed * 20 + e.id) * 0.18;

      if (e.stunTimer > 0) {
        e.stunTimer -= dt;
        e.speed = THREE.MathUtils.damp(e.speed, this.playerSpeed * 0.65, 6, dt);
        e.z -= e.speed * dt;
        e.rig.root.position.set(e.x, 0, e.z);
        e.rig.chassisGroup.rotation.z = Math.sin(e.stunTimer * 24) * 0.22;
        if (e.z > this.playerZ + 48) {
          this.scene.remove(e.rig.root);
          this.enemies.splice(i, 1);
        }
        continue;
      }

      const dz = e.z - this.playerZ;
      const dist = Math.hypot(e.x - this.playerX, dz);

      if (!e.engaged && dist < 32) {
        e.engaged = true;
        this.enemiesEngagedTotal += 1;
      }

      let desiredX = this.playerX;
      let desiredSpeed = this.playerSpeed + spec.speedAdvantage * tier.enemySpeedScale;

      const ambushCiv =
        e.ambushCivilianId !== undefined
          ? this.civilians.find((c) => c.id === e.ambushCivilianId && c.underAttack)
          : undefined;

      if (ambushCiv) {
        desiredX = THREE.MathUtils.clamp(
          ambushCiv.x + e.flankSide * 1.4,
          -ROAD_HALF_WIDTH,
          ROAD_HALF_WIDTH
        );
        const civDz = ambushCiv.z - e.z;
        desiredSpeed = ambushCiv.speed + THREE.MathUtils.clamp(-civDz * 0.9, -4, 10);
      } else if (e.type === 'chaser' || e.type === 'heavy' || e.type === 'boss') {
        desiredX = this.playerX + e.flankSide * 1.15;
        if (dz > -0.6) desiredSpeed = this.playerSpeed + 6.5;
        else if (dz < -2.8) desiredSpeed = this.playerSpeed - 1.5;
        else desiredSpeed = this.playerSpeed;
      } else if (e.type === 'flanker') {
        desiredX = THREE.MathUtils.clamp(
          this.playerX + e.flankSide * 1.55,
          -ROAD_HALF_WIDTH,
          ROAD_HALF_WIDTH
        );
        if (dz > -0.8) desiredSpeed = this.playerSpeed + 7.0;
        else if (dz < -3.0) desiredSpeed = this.playerSpeed - 2.0;
        else desiredSpeed = this.playerSpeed;
      } else if (e.type === 'interceptor') {
        if (dz > -9) {
          desiredX = this.playerX + (dz > -2 ? e.flankSide * 2.4 : 0);
          desiredSpeed = this.playerSpeed + 12;
        } else {
          desiredX = this.playerX;
          desiredSpeed = this.playerSpeed - 3.5;
        }
      } else if (e.type === 'shooter') {
        // Shooter holds formation IN FRONT of player (-11m to -19m) so player can see, dodge, and shoot back!
        desiredX = THREE.MathUtils.clamp(
          this.playerX + e.flankSide * 2.1,
          -ROAD_HALF_WIDTH,
          ROAD_HALF_WIDTH
        );
        if (dz > -11) desiredSpeed = this.playerSpeed + 9.5;
        else if (dz < -19) desiredSpeed = this.playerSpeed - 3.0;
        else desiredSpeed = this.playerSpeed;
      }

      // Enemy ranged gunfire: ONLY allowed when enemy is IN FRONT of player (dz < -2.5 && dz > -36)
      const isInFrontForShot = dz < -2.5 && dz > -36;
      const canShoot =
        !ambushCiv &&
        e.aiState !== 'telegraph' &&
        isInFrontForShot &&
        (e.type !== 'chaser' || this.distanceMeters > 220);
      if (canShoot) {
        if (e.aimTimer > 0) {
          e.aimTimer -= dt;
          if (e.rig.weaponArm) {
            e.rig.weaponArm.rotation.x = THREE.MathUtils.damp(e.rig.weaponArm.rotation.x, -1.25, 14, dt);
          }
          if (e.rig.weaponBlade) {
            (e.rig.weaponBlade.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.8;
          }
          if (e.aimTimer <= 0) {
            this.fireEnemyProjectile(e);
            if (e.rig.weaponBlade) {
              (e.rig.weaponBlade.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.35;
            }
          }
        } else {
          e.shootCooldown -= dt;
          if (e.shootCooldown <= 0) {
            e.aimTimer = 0.52;
            e.shootCooldown =
              e.type === 'shooter'
                ? 2.2 + Math.random() * 0.7
                : 3.4 + Math.random() * 1.6;
          }
        }
      } else if (e.aimTimer > 0) {
        e.aimTimer = 0;
        if (e.rig.weaponBlade) {
          (e.rig.weaponBlade.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.35;
        }
      }

      // Anti-runaway rubberband: if an enemy gets far ahead, ease throttle and weave so player can catch up!
      if (!ambushCiv && dz < -28) {
        desiredSpeed = Math.min(desiredSpeed, this.playerSpeed - 7.5);
        desiredX = Math.sin(this.animElapsed * 2.2 + e.id) * 3.2;
      }

      e.speed = THREE.MathUtils.damp(e.speed, desiredSpeed, 4.5, dt);
      const prevX = e.x;
      e.x = THREE.MathUtils.damp(
        e.x,
        THREE.MathUtils.clamp(desiredX, -ROAD_HALF_WIDTH, ROAD_HALF_WIDTH),
        4.2,
        dt
      );
      e.z -= e.speed * dt;

      const latVel = (e.x - prevX) / Math.max(0.001, dt);
      e.rig.root.position.set(e.x, 0, e.z);
      e.rig.chassisGroup.rotation.z = THREE.MathUtils.clamp(-latVel * 0.04, -0.32, 0.32);

      const spin = (e.speed / 0.33) * dt;
      e.rig.frontWheel.rotation.x -= spin;
      e.rig.rearWheel.rotation.x -= spin;

      // Melee strike only triggers when enemy is beside or ahead of player (never from behind)
      const inStrikeRange = Math.abs(e.x - this.playerX) < 1.9 && dz <= 0.4 && dz > -2.5;
      if (e.aiState === 'approach') {
        if (e.rig.weaponArm && e.aimTimer <= 0) {
          e.rig.weaponArm.rotation.x = THREE.MathUtils.damp(e.rig.weaponArm.rotation.x, 0.2, 8, dt);
        }
        if (inStrikeRange) {
          e.aiState = 'telegraph';
          e.stateTimer = 0.62;
        }
      } else if (e.aiState === 'telegraph') {
        e.stateTimer -= dt;
        if (e.rig.weaponArm) {
          e.rig.weaponArm.rotation.x = THREE.MathUtils.damp(
            e.rig.weaponArm.rotation.x,
            -1.65,
            14,
            dt
          );
        }
        if (e.rig.weaponBlade) {
          (e.rig.weaponBlade.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.6;
        }
        if (e.stateTimer <= 0) {
          if (
            Math.abs(e.x - this.playerX) < 1.85 &&
            e.z - this.playerZ <= 0.5 &&
            e.z - this.playerZ > -2.4 &&
            this.playerY < 1.0
          ) {
            this.applyPlayerDamage(e.damage, `${spec.label.toUpperCase()} STRIKE`);
          }
          e.aiState = 'recover';
          e.stateTimer = 1.25;
        }
      } else if (e.aiState === 'recover') {
        e.stateTimer -= dt;
        if (e.rig.weaponArm) {
          e.rig.weaponArm.rotation.x = THREE.MathUtils.damp(e.rig.weaponArm.rotation.x, 0.45, 10, dt);
        }
        if (e.rig.weaponBlade) {
          (e.rig.weaponBlade.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.35;
        }
        if (e.stateTimer <= 0) {
          e.aiState = 'approach';
        }
      }

      if (e.z > this.playerZ + 52 || e.z < this.playerZ - 130) {
        this.scene.remove(e.rig.root);
        this.enemies.splice(i, 1);
      }
    }
  }

  private spawnEnemy(type: EnemyType): void {
    const spec = ENEMY_SPECS[type];
    const rig = createMotorcycleModel({
      primaryColor: spec.primaryColor,
      accentColor: spec.accentColor,
      frameColor: 0x18181b,
      isEnemy: true,
      enemyType: type,
      textures: this.textures,
    });

    const flankSide = Math.random() < 0.5 ? -1 : 1;
    const spawnX = THREE.MathUtils.clamp(
      this.playerX + flankSide * (2.2 + Math.random() * 2.5),
      -ROAD_HALF_WIDTH,
      ROAD_HALF_WIDTH
    );
    const spawnAhead = type === 'shooter' || type === 'interceptor' || Math.random() < 0.45;
    const spawnZ = spawnAhead
      ? this.playerZ - (34 + Math.random() * 16)
      : this.playerZ + 28 + Math.random() * 8;
    const initialSpeed = spawnAhead ? this.playerSpeed * 0.85 : this.playerSpeed + 16;

    rig.root.position.set(spawnX, 0, spawnZ);
    this.scene.add(rig.root);

    this.enemies.push({
      id: this.nextEnemyId++,
      type,
      rig,
      x: spawnX,
      z: spawnZ,
      speed: initialSpeed,
      hp: spec.hp,
      maxHp: spec.hp,
      damage: spec.damage,
      engaged: false,
      aiState: 'approach',
      stateTimer: 0,
      flankSide,
      stunTimer: 0,
      hitFlashTimer: 0,
      shootCooldown: 1.6 + Math.random() * 1.4,
      aimTimer: 0,
    });
  }

  private fireEnemyProjectile(e: EnemyEntity): void {
    audioEngine.playEnemyShot();
    const muzzleX = e.x;
    const muzzleZ = e.z + 0.7;
    const dx = this.playerX - muzzleX;
    const dz = this.playerZ - muzzleZ;
    const len = Math.max(1, Math.hypot(dx, dz));
    const boltSpeed = 27;
    const vx = (dx / len) * boltSpeed;
    const relVz = (dz / len) * boltSpeed;

    const geo = new THREE.BoxGeometry(0.18, 0.18, 1.05);
    const mat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(muzzleX, 0.88, muzzleZ);
    mesh.rotation.y = Math.atan2(vx, relVz);
    this.scene.add(mesh);

    this.spawnParticles(muzzleX, 0.92, muzzleZ, 0xfb7185, 5, 3.2);

    this.projectiles.push({
      mesh,
      x: muzzleX,
      y: 0.88,
      z: muzzleZ,
      vx,
      vz: -this.playerSpeed + relVz,
      damage: e.type === 'shooter' ? ENEMY_SPECS.shooter.damage : 12,
      life: 2.3,
      fromPlayer: false,
      nearMissed: false,
    });
  }

  private updateCivilians(dt: number): void {
    this.civilianSpawnTimer -= dt;
    if (this.civilianSpawnTimer <= 0 && this.civilians.length < 3) {
      this.civilianSpawnTimer = 4.2 + Math.random() * 2.6;
      this.spawnCivilian(false);
    }

    const hasDistress = this.civilians.some((c) => c.underAttack);
    if (!hasDistress) {
      this.civilianAmbushTimer -= dt;
      if (this.civilianAmbushTimer <= 0) {
        this.civilianAmbushTimer = 15.5 + Math.random() * 6.0;
        this.triggerCivilianAmbush();
      }
    }

    for (let i = this.civilians.length - 1; i >= 0; i--) {
      const c = this.civilians[i];
      if (c.underAttack) {
        c.ambushTimer -= dt;
        // Keep civilian moving slightly slower ahead so player can reach and defend them
        const dzToPlayer = c.z - this.playerZ;
        const targetCivSpeed = dzToPlayer < -32 ? this.playerSpeed * 0.55 : this.playerSpeed * 0.88;
        c.speed = THREE.MathUtils.damp(c.speed, targetCivSpeed, 3.5, dt);

        if (c.rig.distressBeacon) {
          c.rig.distressBeacon.visible = true;
          c.rig.distressBeacon.rotation.y += dt * 4.5;
          const pulse = 1 + Math.sin(this.animElapsed * 10) * 0.25;
          c.rig.distressBeacon.scale.setScalar(pulse);
          (c.rig.distressBeacon.material as THREE.MeshBasicMaterial).color.setHex(
            Math.floor(this.animElapsed * 6) % 2 === 0 ? 0xfacc15 : 0xef4444
          );
        }

        // Did player abandon/ignore the mugged civilian?
        if (c.z > this.playerZ + 22 || c.ambushTimer <= 0) {
          this.ignoreCivilian(c);
        }
      } else {
        if (c.rig.distressBeacon) c.rig.distressBeacon.visible = false;
        const desiredSpeed = c.rescued ? this.playerSpeed * 1.12 : 16;
        c.speed = THREE.MathUtils.damp(c.speed, desiredSpeed, 3.0, dt);

        // Cap Pelindung perk: passing friendly NPCs toss coins & NOS boost!
        if (
          !c.gifted &&
          this.karmaCap === 'pelindung' &&
          Math.abs(c.x - this.playerX) < 3.4 &&
          Math.abs(c.z - this.playerZ) < 4.0
        ) {
          c.gifted = true;
          this.coinsEarnedCombat += 20;
          this.nosCooldownTimer = Math.max(0, this.nosCooldownTimer - 1.5);
          audioEngine.playCoin();
          this.setBanner('WARGA BERTERIMA KASIH +20C · +NOS', 1.3);
        }
      }

      // Smart civilian lane obstacle avoidance so NPCs steer around barriers/trucks!
      if (!c.underAttack) {
        for (const t of this.traffic) {
          const dzT = c.z - t.z; // positive when traffic is ahead of civilian
          if (dzT > 2 && dzT < 16 && Math.abs(c.x - t.x) < 1.9) {
            c.laneTargetX = LANE_CENTERS.find((lx) => Math.abs(lx - t.x) > 2.2) ?? c.laneTargetX;
            break;
          }
        }
      }

      const prevX = c.x;
      c.x = THREE.MathUtils.damp(c.x, c.laneTargetX, 2.5, dt);
      c.z -= c.speed * dt;
      const latVel = (c.x - prevX) / Math.max(0.001, dt);

      c.rig.root.position.set(c.x, 0, c.z);
      c.rig.chassisGroup.rotation.z = THREE.MathUtils.clamp(-latVel * 0.04, -0.25, 0.25);
      c.rig.scarfMesh.rotation.x = 1.25 + Math.sin(this.animElapsed * 12 + c.id) * 0.14;
      const spin = (c.speed / 0.33) * dt;
      c.rig.frontWheel.rotation.x -= spin;
      c.rig.rearWheel.rotation.x -= spin;

      if (c.z > this.playerZ + 32 || c.z < this.playerZ - 165) {
        this.scene.remove(c.rig.root);
        this.civilians.splice(i, 1);
      }
    }
  }

  private spawnCivilian(forAmbush: boolean): CivilianEntity {
    const isOjol = Math.random() < 0.52;
    const civColors = [0x0ea5e9, 0x3b82f6, 0xf97316, 0x94a3b8, 0xe2e8f0];
    const primary = isOjol
      ? 0x10b981
      : civColors[Math.floor(Math.random() * civColors.length)];
    const rig = createMotorcycleModel({
      primaryColor: primary,
      accentColor: isOjol ? 0xfacc15 : 0xf8fafc,
      frameColor: 0x334155,
      bikeId: isOjol ? 'matic150' : Math.random() < 0.5 ? 'matic150' : 'bebek125',
      isCivilian: true,
      civilianVariant: isOjol ? 'ojol' : 'commuter',
      textures: this.textures,
    });

    const laneX = LANE_CENTERS[Math.floor(Math.random() * LANE_CENTERS.length)];
    const spawnZ = this.playerZ - (forAmbush ? 44 : 115 + Math.random() * 25);
    rig.root.position.set(laneX, 0, spawnZ);
    this.scene.add(rig.root);

    const entity: CivilianEntity = {
      id: this.nextCivilianId++,
      rig,
      x: laneX,
      z: spawnZ,
      speed: forAmbush ? Math.max(18, this.playerSpeed * 0.85) : 16 + Math.random() * 3,
      laneTargetX: laneX,
      underAttack: false,
      ambushTimer: 0,
      rescued: false,
      resolved: false,
      gifted: false,
    };
    this.civilians.push(entity);
    return entity;
  }

  private triggerCivilianAmbush(): void {
    let civ = this.civilians.find(
      (c) => !c.underAttack && !c.resolved && c.z < this.playerZ - 24 && c.z > this.playerZ - 75
    );
    if (!civ) {
      civ = this.spawnCivilian(true);
    }

    civ.underAttack = true;
    civ.ambushTimer = 13.5;

    // Spawn a begal right alongside this civilian!
    const type: EnemyType = Math.random() < 0.5 ? 'chaser' : 'flanker';
    const spec = ENEMY_SPECS[type];
    const rig = createMotorcycleModel({
      primaryColor: spec.primaryColor,
      accentColor: spec.accentColor,
      frameColor: 0x18181b,
      isEnemy: true,
      enemyType: type,
      textures: this.textures,
    });
    const flankSide = civ.x > 0 ? -1 : 1;
    const ex = THREE.MathUtils.clamp(civ.x + flankSide * 1.45, -ROAD_HALF_WIDTH, ROAD_HALF_WIDTH);
    const ez = civ.z - 0.5;
    rig.root.position.set(ex, 0, ez);
    this.scene.add(rig.root);

    this.enemies.push({
      id: this.nextEnemyId++,
      type,
      rig,
      x: ex,
      z: ez,
      speed: civ.speed,
      hp: spec.hp,
      maxHp: spec.hp,
      damage: spec.damage,
      engaged: false,
      aiState: 'approach',
      stateTimer: 0,
      flankSide,
      stunTimer: 0,
      hitFlashTimer: 0,
      shootCooldown: 2.4,
      aimTimer: 0,
      ambushCivilianId: civ.id,
      ambushHits: 0,
    });

    this.setBanner('WARGA DIBEGAL! TOLONG SEKARANG!', 2.6);
  }

  private rescueCivilian(c: CivilianEntity): void {
    if (c.resolved) return;
    c.underAttack = false;
    c.rescued = true;
    c.resolved = true;
    if (c.rig.distressBeacon) c.rig.distressBeacon.visible = false;

    this.civiliansSaved += 1;
    this.coinsEarnedCombat += 60;
    this.health = Math.min(this.stats.maxHealth, this.health + 20);
    if (this.civiliansSaved >= this.civiliansIgnored) {
      this.karmaCap = 'pelindung';
    }

    audioEngine.playCivilianSaved();
    audioEngine.playCapStamped(false);
    this.spawnParticles(c.x, 1.4, c.z, 0x10b981, 18, 6);
    this.setBanner('WARGA SELAMAT! CAP PELINDUNG (+60C +20HP)', 2.4);
  }

  private ignoreCivilian(c: CivilianEntity): void {
    if (c.resolved) return;
    c.underAttack = false;
    c.resolved = true;
    if (c.rig.distressBeacon) c.rig.distressBeacon.visible = false;

    // Detach any remaining mugger from this civilian so it rejoins pursuit
    for (const e of this.enemies) {
      if (e.ambushCivilianId === c.id) {
        e.ambushCivilianId = undefined;
      }
    }

    this.civiliansIgnored += 1;
    this.karmaCap = 'egois';
    audioEngine.playCapStamped(true);
    this.setBanner('CAP EGOIS! MUSUH MENGIRA KITA KUAT SENDIRI!', 2.8);

    // Consequence of Cap Egois: Heavy Armored Begal Pick-Up ambushes you!
    if (!this.pickupEnemy) {
      this.spawnBegalPickup();
    }
  }

  private spawnBegalPickup(): void {
    if (this.pickupEnemy) return;
    const spec = ENEMY_SPECS.pickup;
    const rig = createBegalPickupModel(this.textures);
    const spawnX = 0;
    const spawnZ = this.playerZ - 58;
    rig.root.position.set(spawnX, 0, spawnZ);
    this.scene.add(rig.root);

    this.pickupEnemy = {
      rig,
      x: spawnX,
      z: spawnZ,
      speed: this.playerSpeed + 4,
      hp: spec.hp,
      maxHp: spec.hp,
      damage: spec.damage,
      flankSide: 1,
      hitFlashTimer: 0,
      stunTimer: 0,
      shootCooldown: 2.2,
      ramCooldown: 4.0,
    };

    audioEngine.playBossSiren();
    this.setBanner('ARMORED BEGAL PICK-UP MENYERBU!', 2.8);
  }

  private updateBegalPickup(dt: number): void {
    const pk = this.pickupEnemy;
    if (!pk) return;

    if (pk.hitFlashTimer > 0) {
      pk.hitFlashTimer -= dt;
      const flashOn = pk.hitFlashTimer > 0;
      for (const m of pk.rig.hitFlashMaterials) {
        m.emissive.setHex(flashOn ? 0xffffff : 0x000000);
        m.emissiveIntensity = flashOn ? 0.9 : 0;
      }
    }

    // Flash roof beacon & animate gunners aiming
    const beaconMat = pk.rig.beaconLight.material as THREE.MeshStandardMaterial;
    beaconMat.emissiveIntensity = 1.2 + Math.abs(Math.sin(this.animElapsed * 14)) * 2.2;
    for (const g of pk.rig.gunners) {
      g.rotation.y = Math.sin(this.animElapsed * 3) * 0.25;
    }

    if (pk.stunTimer > 0) {
      pk.stunTimer -= dt;
      pk.speed = THREE.MathUtils.damp(pk.speed, this.playerSpeed * 0.68, 6, dt);
      pk.z -= pk.speed * dt;
      pk.rig.root.position.set(pk.x, 0, pk.z);
      pk.rig.bodyGroup.rotation.z = Math.sin(pk.stunTimer * 18) * 0.1;
      for (const w of pk.rig.wheels) w.rotation.x -= (pk.speed / 0.46) * dt;
      return;
    }

    const dz = pk.z - this.playerZ; // negative = ahead of player
    let desiredSpeed = this.playerSpeed;
    if (dz < -18) {
      desiredSpeed = this.playerSpeed - 6.5;
    } else if (dz > -6) {
      desiredSpeed = this.playerSpeed + 6.5;
    } else {
      desiredSpeed = this.playerSpeed + Math.sin(this.animElapsed * 1.4) * 3.0;
    }

    pk.ramCooldown -= dt;
    if (pk.ramCooldown <= 0) {
      pk.ramCooldown = 5.5;
      pk.flankSide = -pk.flankSide;
    }
    const desiredX = THREE.MathUtils.clamp(
      this.playerX + Math.sin(this.animElapsed * 1.1) * 2.4,
      -ROAD_HALF_WIDTH + 0.8,
      ROAD_HALF_WIDTH - 0.8
    );

    pk.speed = THREE.MathUtils.damp(pk.speed, desiredSpeed, 4.0, dt);
    const prevX = pk.x;
    pk.x = THREE.MathUtils.damp(pk.x, desiredX, 2.6, dt);
    pk.z -= pk.speed * dt;
    const latVel = (pk.x - prevX) / Math.max(0.001, dt);

    pk.rig.root.position.set(pk.x, 0, pk.z);
    pk.rig.bodyGroup.rotation.z = THREE.MathUtils.clamp(-latVel * 0.025, -0.14, 0.14);
    for (const w of pk.rig.wheels) w.rotation.x -= (pk.speed / 0.46) * dt;

    // Gunner flare burst from truck bed (only fires when Pick-Up is IN FRONT of player)
    pk.shootCooldown -= dt;
    if (pk.shootCooldown <= 0 && dz < -3.0 && dz > -38) {
      pk.shootCooldown = 2.1;
      audioEngine.playEnemyShot();
      const geo = new THREE.SphereGeometry(0.26, 8, 8);
      const mat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(pk.x, 1.5, pk.z + 1.4);
      this.scene.add(mesh);

      const dx = this.playerX - pk.x;
      const pDz = this.playerZ - (pk.z + 1.4);
      const len = Math.max(1, Math.hypot(dx, pDz));
      const boltSpeed = 29;
      this.projectiles.push({
        mesh,
        x: mesh.position.x,
        y: 1.35,
        z: mesh.position.z,
        vx: (dx / len) * boltSpeed,
        vz: -this.playerSpeed + (pDz / len) * boltSpeed,
        damage: 18,
        life: 2.4,
        fromPlayer: false,
      });
    }

    // Ram collision check against player
    if (
      Math.abs(pk.x - this.playerX) < 1.55 &&
      Math.abs(pk.z - this.playerZ) < 2.9 &&
      this.playerY < 1.3
    ) {
      const pushDir = this.playerX >= pk.x ? 1 : -1;
      this.playerX = THREE.MathUtils.clamp(
        this.playerX + pushDir * 1.4,
        -ROAD_HALF_WIDTH,
        ROAD_HALF_WIDTH
      );
      this.applyPlayerDamage(pk.damage, 'PICK-UP BEGAL RAM');
    }
  }

  private damageBegalPickup(dmg: number, knockX: number): void {
    const pk = this.pickupEnemy;
    if (!pk) return;
    pk.hp -= dmg;
    pk.hitFlashTimer = 0.16;
    pk.x = THREE.MathUtils.clamp(pk.x + knockX * 0.25, -ROAD_HALF_WIDTH + 0.8, ROAD_HALF_WIDTH - 0.8);
    this.spawnParticles(pk.x, 1.2, pk.z, 0xfacc15, 12, 6);

    if (pk.hp <= 0) {
      const spec = ENEMY_SPECS.pickup;
      const mult = this.magnetTimer > 0 ? 2 : 1;
      this.enemiesDefeated += 1;
      this.coinsEarnedCombat += spec.coinReward * mult;
      this.policeUltCharges = 1; // Rare single-use Police Raid Ultimate!

      this.spawnParticles(pk.x, 1.3, pk.z, 0xef4444, 28, 9);
      audioEngine.playImpact(true);
      audioEngine.playSecretUnlock();
      this.scene.remove(pk.rig.root);
      this.pickupEnemy = null;
      this.setBanner(`PICK-UP KALAH! ULTI [P] PANGGIL POLISI AKTIF!`, 3.0);
    }
  }

  private activatePoliceUlt(): void {
    if (this.policeUltCharges <= 0) return;
    this.policeUltCharges = 0;
    this.policeRaidTimer = 3.8;
    this.invulnTimer = Math.max(this.invulnTimer, 4.0);
    audioEngine.playPoliceSiren();
    this.cameraShake = Math.max(this.cameraShake, 0.35);

    // Spawn 2 Police Patrol cruisers flanking left & right sweeping the whole road!
    for (const side of [-1, 1]) {
      const rig = createPolicePatrolModel(this.textures);
      const px = THREE.MathUtils.clamp(this.playerX + side * 3.4, -ROAD_HALF_WIDTH, ROAD_HALF_WIDTH);
      const pz = this.playerZ + 12;
      rig.root.position.set(px, 0, pz);
      this.scene.add(rig.root);
      this.policeUnits.push({
        rig,
        x: px,
        z: pz,
        speed: this.playerSpeed + 28,
        side,
      });
    }

    // Arrest and remove ALL regular begals along the road immediately!
    let arrestedCount = 0;
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.ambushCivilianId !== undefined) {
        const civ = this.civilians.find((c) => c.id === e.ambushCivilianId && c.underAttack);
        if (civ) this.rescueCivilian(civ);
      }
      const spec = ENEMY_SPECS[e.type];
      this.enemiesDefeated += 1;
      this.coinsEarnedCombat += spec.coinReward;
      if (e.type === 'boss') this.bossDefeatedRun = true;
      this.spawnParticles(e.x, 0.9, e.z, 0x38bdf8, 14, 7);
      this.scene.remove(e.rig.root);
      this.enemies.splice(i, 1);
      arrestedCount++;
    }

    // Clear hostile projectiles & stun/damage pickup if present
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      if (!this.projectiles[i].fromPlayer) {
        this.scene.remove(this.projectiles[i].mesh);
        this.projectiles.splice(i, 1);
      }
    }
    if (this.pickupEnemy) {
      this.damageBegalPickup(220, 0);
    }

    this.setBanner(`RAZIYA POLISI! ${arrestedCount} PEMBEGAL DITANGKAP!`, 3.0);
  }

  private updatePoliceRaid(dt: number): void {
    if (this.policeRaidTimer > 0) {
      this.policeRaidTimer -= dt;
      // Continuously intercept any newly spawned begals during the sweep
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const e = this.enemies[i];
        this.enemiesDefeated += 1;
        this.coinsEarnedCombat += ENEMY_SPECS[e.type].coinReward;
        this.spawnParticles(e.x, 0.9, e.z, 0x38bdf8, 10, 6);
        this.scene.remove(e.rig.root);
        this.enemies.splice(i, 1);
      }
    }

    for (let i = this.policeUnits.length - 1; i >= 0; i--) {
      const pu = this.policeUnits[i];
      pu.speed = this.playerSpeed + (this.policeRaidTimer > 0 ? 22 : 36);
      pu.z -= pu.speed * dt;
      pu.x = THREE.MathUtils.damp(
        pu.x,
        THREE.MathUtils.clamp(this.playerX + pu.side * 3.6, -ROAD_HALF_WIDTH, ROAD_HALF_WIDTH),
        4,
        dt
      );
      pu.rig.root.position.set(pu.x, 0, pu.z);

      const redOn = Math.floor(this.animElapsed * 14) % 2 === 0;
      (pu.rig.redStrobe.material as THREE.MeshStandardMaterial).emissiveIntensity = redOn ? 4.0 : 0.3;
      (pu.rig.blueStrobe.material as THREE.MeshStandardMaterial).emissiveIntensity = redOn ? 0.3 : 4.0;
      for (const w of pu.rig.wheels) w.rotation.x -= (pu.speed / 0.34) * dt;

      if (this.policeRaidTimer <= 0 && pu.z < this.playerZ - 110) {
        this.scene.remove(pu.rig.root);
        this.policeUnits.splice(i, 1);
      }
    }
  }

  private updateProjectiles(dt: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;

      // Active homing steer for player Lock-On Shots!
      if (p.fromPlayer && p.targetEnemyId !== undefined) {
        const tgt =
          p.targetEnemyId === -999
            ? this.pickupEnemy
            : this.enemies.find((e) => e.id === p.targetEnemyId);
        if (tgt) {
          const dx = tgt.x - p.x;
          const dz = tgt.z - p.z;
          const len = Math.max(0.5, Math.hypot(dx, dz));
          const homeSpeed = 66;
          p.vx = THREE.MathUtils.damp(p.vx, (dx / len) * homeSpeed, 14, dt);
          p.vz = THREE.MathUtils.damp(p.vz, -this.playerSpeed + (dz / len) * homeSpeed, 14, dt);
        }
      }

      p.x += p.vx * dt;
      p.z += p.vz * dt;
      p.mesh.position.set(p.x, p.y, p.z);
      if (p.weaponId === 'rpg' && Math.random() < 0.75) {
        this.spawnParticles(p.x, p.y, p.z + 0.35, 0xf97316, 1, 2.2);
      }

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
        continue;
      }

      if (p.fromPlayer) {
        let hitEnemy = false;
        if (
          this.pickupEnemy &&
          Math.abs(p.x - this.pickupEnemy.x) < 2.15 &&
          Math.abs(p.z - this.pickupEnemy.z) < 3.2
        ) {
          const wasAhead = this.pickupEnemy.z - this.playerZ < -9;
          if (wasAhead) {
            this.pickupEnemy.speed -= 10;
            this.pickupEnemy.stunTimer = Math.max(this.pickupEnemy.stunTimer, 0.85);
            this.damageBegalPickup(Math.round(p.damage * 1.35), Math.sign(p.vx || 1) * 2.5);
          } else {
            this.damageBegalPickup(p.damage, Math.sign(p.vx || 1) * 2.5);
          }
          if (p.explosionRadius && p.explosionRadius > 0) {
            this.triggerRocketExplosion(p.x, p.z, p.damage, p.explosionRadius, -999);
          } else {
            audioEngine.playImpact(false);
          }
          hitEnemy = true;
        } else {
          for (let j = this.enemies.length - 1; j >= 0; j--) {
            const e = this.enemies[j];
            if (Math.abs(p.x - e.x) < 1.35 && Math.abs(p.z - e.z) < 1.75) {
              const directId = e.id;
              const wasAhead = e.z - this.playerZ < -9;
              if (wasAhead) {
                // SNIPE CATCH: Slows & stuns fleeing enemy ahead so player catches up!
                e.speed -= 14;
                e.stunTimer = Math.max(e.stunTimer, 1.0);
                this.damageEnemy(e, Math.round(p.damage * 1.35), Math.sign(p.vx || 1) * 3.5);
                if (!p.explosionRadius) {
                  this.setBanner('SNIPE CATCH! ENEMY SLOWED', 1.2);
                }
              } else {
                this.damageEnemy(e, p.damage, Math.sign(p.vx || 1) * 3.5);
              }
              if (p.explosionRadius && p.explosionRadius > 0) {
                this.triggerRocketExplosion(p.x, p.z, p.damage, p.explosionRadius, directId);
              } else {
                audioEngine.playImpact(false);
              }
              hitEnemy = true;
              break;
            }
          }
        }
        if (hitEnemy) {
          this.scene.remove(p.mesh);
          this.projectiles.splice(i, 1);
        }
      } else {
        if (
          Math.abs(p.x - this.playerX) < 0.88 &&
          Math.abs(p.z - this.playerZ) < 1.1 &&
          this.playerY < 1.15
        ) {
          this.scene.remove(p.mesh);
          this.projectiles.splice(i, 1);
          this.applyPlayerDamage(p.damage, 'TERTEMBAK PEMBEGAL!');
        } else if (
          !p.nearMissed &&
          p.z > this.playerZ + 0.65 &&
          Math.abs(p.x - this.playerX) < 2.8
        ) {
          p.nearMissed = true;
          this.coinsEarnedCombat += 10;
          if (this.statusBannerTimer <= 0) {
            this.setBanner('HINDAR TEMBAKAN +10C', 0.9);
          }
        }
      }
    }
  }

  private triggerRocketExplosion(
    ex: number,
    ez: number,
    baseDmg: number,
    radius: number,
    excludeId?: number
  ): void {
    audioEngine.playExplosion();
    this.cameraShake = Math.max(this.cameraShake, 0.45);
    this.spawnParticles(ex, 1.1, ez, 0xf97316, 26, 9.5);
    this.spawnParticles(ex, 1.3, ez, 0xfacc15, 16, 7.0);
    this.setBanner('ROKET MELEDAK! AREA BLAST', 1.5);

    const splashDmg = Math.round(baseDmg * 0.85);
    for (let j = this.enemies.length - 1; j >= 0; j--) {
      const e = this.enemies[j];
      if (e.id === excludeId) continue;
      if (Math.hypot(e.x - ex, e.z - ez) <= radius) {
        e.stunTimer = Math.max(e.stunTimer, 1.4);
        this.damageEnemy(e, splashDmg, Math.sign(e.x - ex || 1) * 5.0);
      }
    }

    for (let j = this.traffic.length - 1; j >= 0; j--) {
      const t = this.traffic[j];
      if (t.rig.kind === 'begal_barricade' && Math.hypot(t.x - ex, t.z - ez) <= radius + 1.5) {
        this.coinsEarnedCombat += 45;
        this.spawnParticles(t.x, 1.0, t.z, 0xf97316, 18, 7.5);
        this.scene.remove(t.rig.root);
        this.traffic.splice(j, 1);
      }
    }

    if (
      this.pickupEnemy &&
      excludeId !== -999 &&
      Math.hypot(this.pickupEnemy.x - ex, this.pickupEnemy.z - ez) <= radius + 1.4
    ) {
      this.pickupEnemy.stunTimer = Math.max(this.pickupEnemy.stunTimer, 1.2);
      this.damageBegalPickup(splashDmg, Math.sign(this.pickupEnemy.x - ex || 1) * 2.5);
    }
  }

  private spawnParticles(
    x: number,
    y: number,
    z: number,
    colorHex: number,
    count: number,
    speed: number
  ): void {
    let spawned = 0;
    for (const p of this.particles) {
      if (p.active) continue;
      p.active = true;
      p.life = 0.35 + Math.random() * 0.25;
      p.maxLife = p.life;
      p.mesh.position.set(x, y, z);
      p.mesh.visible = true;
      p.mesh.scale.setScalar(1);
      (p.mesh.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = 1;
      p.vx = (Math.random() - 0.5) * speed * 2;
      p.vy = Math.random() * speed * 1.1 + 1.2;
      p.vz = (Math.random() - 0.5) * speed * 2;
      spawned++;
      if (spawned >= count) break;
    }
  }

  private updateParticles(dt: number): void {
    for (const p of this.particles) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }
      p.vy -= 14 * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y = Math.max(0.05, p.mesh.position.y + p.vy * dt);
      p.mesh.position.z += p.vz * dt;
      const ratio = p.life / p.maxLife;
      p.mesh.scale.setScalar(ratio);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = ratio;
    }
  }

  private emitHud(): void {
    let dangerLeft = false;
    let dangerRight = false;
    let dangerRear = false;
    let bossActive = false;
    let bossHealthRatio = 0;

    for (const e of this.enemies) {
      const dx = e.x - this.playerX;
      const dz = e.z - this.playerZ;
      if (Math.abs(dz) < 12) {
        if (dx < -0.5 && dx > -4.5) dangerLeft = true;
        if (dx > 0.5 && dx < 4.5) dangerRight = true;
      }
      if (dz > 2 && dz < 18) dangerRear = true;
      if (e.type === 'boss') {
        bossActive = true;
        bossHealthRatio = Math.max(0, e.hp / e.maxHp);
      }
    }

    const tier = this.getCurrentTier();
    const incomingFireWarning = this.projectiles.some(
      (p) => !p.fromPlayer && p.z < this.playerZ + 2 && p.z > this.playerZ - 34
    );
    const barricadeAhead = this.traffic.some(
      (t) => t.rig.kind === 'begal_barricade' && t.z < this.playerZ - 3 && t.z > this.playerZ - 75
    );
    let roadHazardWarning: HudState['roadHazardWarning'] = null;
    for (const t of this.traffic) {
      if (t.z < this.playerZ - 4 && t.z > this.playerZ - 78) {
        if (
          t.rig.kind === 'pasar_malam' ||
          t.rig.kind === 'tukang_parkir' ||
          t.rig.kind === 'pesepeda'
        ) {
          roadHazardWarning = t.rig.kind;
          break;
        }
      }
    }

    this.callbacks.onHudUpdate({
      speedKmh: Math.round(this.playerSpeed * 3.6),
      distanceMeters: this.distanceMeters,
      health: Math.ceil(this.health),
      maxHealth: this.stats.maxHealth,
      nosFuel: this.nosFuel,
      nosActive: this.nosActive,
      nosCooldownRatio:
        this.nosCooldownTimer <= 0 ? 1 : 1 - this.nosCooldownTimer / this.stats.nosCooldown,
      empReadyRatio: this.empCooldownTimer <= 0 ? 1 : 1 - this.empCooldownTimer / 8.5,
      attackReadyRatio:
        this.attackCooldownTimer <= 0 ? 1 : 1 - this.attackCooldownTimer / this.currentMelee.cooldown,
      rangedAmmo: this.rangedAmmo,
      rangedMaxAmmo: this.rangedMaxAmmo,
      meleeWeaponId: this.currentMelee.id,
      meleeWeaponName: this.currentMelee.name,
      rangedWeaponId: this.currentRanged.id,
      rangedWeaponName: this.currentRanged.name,
      trapReadyRatio:
        this.trapCooldownTimer <= 0 ? 1 : 1 - this.trapCooldownTimer / this.trapCooldownDuration,
      dashReadyRatio:
        this.dashCooldownTimer <= 0 ? 1 : 1 - this.dashCooldownTimer / this.dashCooldownDuration,
      runCoins: this.coinsEarnedDistance + this.coinsEarnedCombat,
      enemiesDefeated: this.enemiesDefeated,
      enemiesEngaged: this.enemiesEngagedTotal,
      activeEnemyCount: this.enemies.length + (this.pickupEnemy ? 1 : 0),
      dangerLeft,
      dangerRight,
      dangerRear,
      incomingFireWarning,
      barricadeAhead,
      roadHazardWarning,
      bossActive,
      bossHealthRatio,
      biomeName: tier.biomeName,
      isAirborne: this.playerY > 0.1,
      isWheelie: this.wheelieTimer > 0,
      damageFlash: this.damageFlash,
      comboCount: this.comboCount,
      nearMissCount: this.nearMissCount,
      slipstreamActive: this.slipstreamActive,
      lockedEnemyDistance: this.lockedEnemyDistance,
      karmaCap: this.karmaCap,
      civiliansSaved: this.civiliansSaved,
      civiliansIgnored: this.civiliansIgnored,
      civilianDistressActive: this.civilians.some((c) => c.underAttack),
      policeUltCharges: this.policeUltCharges,
      policeRaidActive: this.policeRaidTimer > 0,
      pickupBossActive: this.pickupEnemy !== null,
      pickupBossHealthRatio: this.pickupEnemy
        ? Math.max(0, this.pickupEnemy.hp / this.pickupEnemy.maxHp)
        : 0,
      statusBanner: this.statusBanner,
    });
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('orientationchange', this.handleResize);
    window.visualViewport?.removeEventListener('resize', this.handleResize);
    audioEngine.stopEngine();

    const canvas = this.renderer.domElement;
    canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    canvas.removeEventListener('webglcontextrestored', this.handleContextRestored);

    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material?.dispose();
        }
      }
    });

    this.textures.dispose();
    this.pmremEnvTex.dispose();
    this.renderer.dispose();
    if (canvas.parentElement === this.container) {
      this.container.removeChild(canvas);
    }
  }
}
