import * as THREE from 'three';
import { ProceduralTextureSet } from './proceduralTextures';
import { BikeId, EnemyType, MeleeWeaponId, RangedWeaponId } from '../types/game';
import { ENEMY_SPECS } from '../data/gameCatalog';

export interface MotorcycleRig {
  root: THREE.Group;
  chassisGroup: THREE.Group;
  frontWheel: THREE.Group;
  rearWheel: THREE.Group;
  nosGlowLeft: THREE.Mesh;
  nosGlowRight: THREE.Mesh;
  riderGroup: THREE.Group;
  torsoGroup: THREE.Group;
  headGroup: THREE.Group;
  scarfMesh: THREE.Mesh;
  weaponArm?: THREE.Group;
  weaponBlade?: THREE.Mesh;
  shieldMesh?: THREE.Mesh;
  distressBeacon?: THREE.Mesh;
  hitFlashMaterials: THREE.MeshStandardMaterial[];
  contactShadow: THREE.Mesh;
}

export interface PickupRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  wheels: THREE.Mesh[];
  gunners: THREE.Group[];
  beaconLight: THREE.Mesh;
  hitFlashMaterials: THREE.MeshStandardMaterial[];
  contactShadow: THREE.Mesh;
}

export interface PoliceRig {
  root: THREE.Group;
  redStrobe: THREE.Mesh;
  blueStrobe: THREE.Mesh;
  wheels: THREE.Mesh[];
}

export interface TrafficRig {
  root: THREE.Group;
  kind:
    | 'angkot'
    | 'truck'
    | 'sedan'
    | 'bus'
    | 'barrier'
    | 'begal_barricade'
    | 'ramp'
    | 'pasar_malam'
    | 'tukang_parkir'
    | 'pesepeda';
  halfWidth: number;
  halfLength: number;
  height: number;
  isRamp: boolean;
  animatedWheels?: THREE.Object3D[];
  attendantGroup?: THREE.Group;
  batonArm?: THREE.Object3D;
  hazardLights?: THREE.Mesh[];
  stringBulbs?: THREE.Mesh[];
}

export type PowerupKind = 'heal' | 'nos' | 'magnet' | 'ammo';

function createWheel(
  radius: number,
  width: number,
  rimColor: number,
  stripeColor: number
): THREE.Group {
  const wheel = new THREE.Group();

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x111317,
    roughness: 0.86,
    metalness: 0.06,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: rimColor,
    roughness: 0.2,
    metalness: 0.9,
  });
  const stripeMat = new THREE.MeshBasicMaterial({ color: stripeColor });
  const discMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d8,
    roughness: 0.22,
    metalness: 0.94,
  });
  const caliperMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    roughness: 0.35,
    metalness: 0.65,
  });

  const tireGeo = new THREE.TorusGeometry(radius - width * 0.26, width * 0.34, 14, 26);
  const tire = new THREE.Mesh(tireGeo, tireMat);
  tire.rotation.y = Math.PI / 2;
  tire.castShadow = true;
  wheel.add(tire);

  // Sport Rim Stripe Ring
  const rimStripeGeo = new THREE.TorusGeometry(radius * 0.66, 0.015, 8, 24);
  const rimStripe = new THREE.Mesh(rimStripeGeo, stripeMat);
  rimStripe.rotation.y = Math.PI / 2;
  wheel.add(rimStripe);

  const rimGeo = new THREE.CylinderGeometry(radius * 0.56, radius * 0.56, width * 0.52, 14);
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.rotation.z = Math.PI / 2;
  wheel.add(rim);

  // 5-Spoke Y-pattern style spokes
  const spokeGeo = new THREE.BoxGeometry(width * 0.22, radius * 1.1, 0.048);
  for (let i = 0; i < 5; i++) {
    const spoke = new THREE.Mesh(spokeGeo, rimMat);
    spoke.rotation.x = (i * Math.PI) / 5;
    wheel.add(spoke);
  }

  const discGeo = new THREE.CylinderGeometry(radius * 0.45, radius * 0.45, 0.03, 18);
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.rotation.z = Math.PI / 2;
  disc.position.x = width * 0.34;
  wheel.add(disc);

  const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.11, 0.09), caliperMat);
  caliper.position.set(width * 0.36, -radius * 0.28, -radius * 0.28);
  wheel.add(caliper);

  return wheel;
}

export function createMotorcycleModel(options: {
  primaryColor: number;
  accentColor: number;
  frameColor: number;
  bikeId?: BikeId;
  meleeWeapon?: MeleeWeaponId;
  rangedWeapon?: RangedWeaponId;
  isEnemy?: boolean;
  isCivilian?: boolean;
  civilianVariant?: 'ojol' | 'commuter';
  enemyType?: EnemyType;
  textures: ProceduralTextureSet;
}): MotorcycleRig {
  const {
    primaryColor,
    accentColor,
    frameColor,
    bikeId,
    meleeWeapon = 'baton',
    rangedWeapon = 'flare',
    isEnemy,
    isCivilian,
    civilianVariant = 'commuter',
    enemyType,
    textures,
  } = options;

  const root = new THREE.Group();
  const chassisGroup = new THREE.Group();
  root.add(chassisGroup);

  const hitFlashMaterials: THREE.MeshStandardMaterial[] = [];

  const bodyPaintMat = new THREE.MeshPhysicalMaterial({
    color: primaryColor,
    roughness: 0.18,
    metalness: 0.62,
    clearcoat: 0.96,
    clearcoatRoughness: 0.08,
  });
  const hitBodyMat = new THREE.MeshStandardMaterial({
    color: primaryColor,
    roughness: 0.26,
    metalness: 0.52,
  });
  hitFlashMaterials.push(hitBodyMat);

  const accentMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    roughness: 0.36,
    metalness: 0.44,
  });
  hitFlashMaterials.push(accentMat);

  const frameMat = new THREE.MeshStandardMaterial({
    color: frameColor,
    roughness: 0.48,
    metalness: 0.72,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe4e4e7,
    roughness: 0.12,
    metalness: 0.96,
  });

  const seatMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.84,
    metalness: 0.04,
  });

  const isTrike = bikeId === 'cyberatv';
  const isChopper = bikeId === 'chopper400';
  const isTrail = bikeId === 'trail250';
  const isVespa = bikeId === 'vespa160';

  const wheelRadius =
    enemyType === 'heavy' || enemyType === 'boss' || isTrail
      ? 0.37
      : isVespa
      ? 0.29
      : isTrike
      ? 0.36
      : 0.335;
  const wheelWidth =
    enemyType === 'heavy' || enemyType === 'boss'
      ? 0.23
      : isTrike
      ? 0.28
      : isChopper
      ? 0.2
      : 0.18;
  const rimCol = isEnemy ? 0x27272a : isCivilian ? 0x64748b : isVespa ? 0xe2e8f0 : 0x18181b;
  const stripeCol = isEnemy
    ? 0xef4444
    : isCivilian
    ? 0x38bdf8
    : isVespa
    ? 0xf8fafc
    : primaryColor;

  const frontWheelZ = isChopper ? -1.12 : isTrike ? -0.88 : isTrail ? -0.9 : -0.82;
  const rearWheelZ = isChopper ? 0.84 : isTrike ? 0.82 : 0.74;

  // Front Wheel Assembly (Twin Independent Wheels on Front Axle for 3-Wheel Trike!)
  const frontWheel = new THREE.Group();
  frontWheel.position.set(0, wheelRadius, frontWheelZ);
  if (isTrike) {
    for (const wx of [-0.62, 0.62]) {
      const w = createWheel(wheelRadius, wheelWidth * 0.95, rimCol, stripeCol);
      w.position.set(wx, 0, 0);
      frontWheel.add(w);
    }
    const frontAxle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 1.3, 10),
      frameMat
    );
    frontAxle.rotation.z = Math.PI / 2;
    frontWheel.add(frontAxle);
  } else {
    frontWheel.add(createWheel(wheelRadius, wheelWidth, rimCol, stripeCol));
  }
  chassisGroup.add(frontWheel);

  const rearWheel = createWheel(
    wheelRadius * (isChopper ? 1.04 : 1),
    wheelWidth * (isChopper || isTrike ? 1.55 : 1.18),
    rimCol,
    stripeCol
  );
  rearWheel.position.set(0, wheelRadius, rearWheelZ);
  chassisGroup.add(rearWheel);

  // Contact Shadow
  const shadowGeo = new THREE.PlaneGeometry(isTrike ? 2.15 : 1.55, isChopper ? 3.2 : 2.75);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: textures.contactShadow,
    transparent: true,
    depthWrite: false,
    opacity: 0.62,
  });
  const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.02;
  root.add(contactShadow);

  // Detailed Engine Block & Swingarm
  const engine = new THREE.Mesh(
    new THREE.BoxGeometry(isTrike ? 0.56 : 0.38, 0.36, isChopper ? 0.66 : 0.54),
    frameMat
  );
  engine.position.set(0, isTrail ? 0.52 : 0.44, 0.0);
  engine.castShadow = true;
  chassisGroup.add(engine);

  const crankCase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, isTrike ? 0.6 : 0.42, 12),
    chromeMat
  );
  crankCase.rotation.z = Math.PI / 2;
  crankCase.position.set(0, isTrail ? 0.46 : 0.38, 0.08);
  chassisGroup.add(crankCase);

  const swingarm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.09, 0.78), frameMat);
  swingarm.position.set(0, wheelRadius + 0.03, 0.38);
  chassisGroup.add(swingarm);

  // Twin Coilover Rear Shocks
  const springMat = new THREE.MeshStandardMaterial({
    color: isEnemy ? 0xef4444 : isTrail ? 0x22c55e : 0xfacc15,
    metalness: 0.75,
    roughness: 0.25,
  });
  for (const sx of [-0.15, 0.15]) {
    const shock = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.36, 8), springMat);
    shock.position.set(sx, isTrail ? 0.64 : 0.56, 0.56);
    shock.rotation.x = 0.42;
    chassisGroup.add(shock);
  }

  // Sculpted Fuel Tank & Fairing Silhouette per Vehicle Type
  const bodyShape = new THREE.Shape();
  if (isVespa) {
    // Classic wide Vespa leg-shield + rounded bulbous rear cowling
    bodyShape.moveTo(-0.74, 0.36);
    bodyShape.lineTo(-0.56, 0.98);
    bodyShape.lineTo(-0.34, 0.96);
    bodyShape.lineTo(-0.2, 0.48);
    bodyShape.lineTo(0.16, 0.48);
    bodyShape.lineTo(0.28, 0.8);
    bodyShape.lineTo(0.84, 0.76);
    bodyShape.lineTo(0.9, 0.44);
    bodyShape.lineTo(0.45, 0.32);
  } else if (bikeId === 'matic150' || isCivilian) {
    bodyShape.moveTo(-0.78, 0.48);
    bodyShape.lineTo(-0.42, 0.96);
    bodyShape.lineTo(-0.1, 0.94);
    bodyShape.lineTo(0.18, 0.56);
    bodyShape.lineTo(0.82, 0.76);
    bodyShape.lineTo(0.92, 0.58);
    bodyShape.lineTo(0.46, 0.38);
    bodyShape.lineTo(-0.64, 0.36);
  } else if (isTrail) {
    // Slim high-clearance motocross tank + raised tail
    bodyShape.moveTo(-0.84, 0.68);
    bodyShape.lineTo(-0.46, 1.06);
    bodyShape.lineTo(-0.08, 1.08);
    bodyShape.lineTo(0.32, 0.92);
    bodyShape.lineTo(0.94, 1.02);
    bodyShape.lineTo(0.98, 0.86);
    bodyShape.lineTo(0.44, 0.64);
    bodyShape.lineTo(-0.48, 0.6);
  } else if (isChopper) {
    // Low-slung Cruiser Chopper with teardrop tank & low bobtail
    bodyShape.moveTo(-0.68, 0.68);
    bodyShape.lineTo(-0.32, 0.96);
    bodyShape.lineTo(0.06, 0.88);
    bodyShape.lineTo(0.34, 0.64);
    bodyShape.lineTo(0.86, 0.7);
    bodyShape.lineTo(0.96, 0.54);
    bodyShape.lineTo(0.46, 0.38);
    bodyShape.lineTo(-0.44, 0.42);
  } else if (isTrike) {
    // Aggressive Angular Armored Combat Trike Body
    bodyShape.moveTo(-0.98, 0.48);
    bodyShape.lineTo(-0.62, 0.92);
    bodyShape.lineTo(-0.1, 1.02);
    bodyShape.lineTo(0.42, 0.84);
    bodyShape.lineTo(0.96, 0.96);
    bodyShape.lineTo(1.04, 0.66);
    bodyShape.lineTo(0.55, 0.42);
    bodyShape.lineTo(-0.74, 0.4);
  } else if (bikeId === 'superbike600') {
    bodyShape.moveTo(-0.92, 0.5);
    bodyShape.lineTo(-0.56, 0.94);
    bodyShape.lineTo(-0.08, 1.0);
    bodyShape.lineTo(0.32, 0.76);
    bodyShape.lineTo(0.92, 0.92);
    bodyShape.lineTo(1.02, 0.74);
    bodyShape.lineTo(0.45, 0.44);
    bodyShape.lineTo(-0.66, 0.42);
  } else {
    bodyShape.moveTo(-0.8, 0.52);
    bodyShape.lineTo(-0.44, 0.9);
    bodyShape.lineTo(-0.04, 0.98);
    bodyShape.lineTo(0.28, 0.76);
    bodyShape.lineTo(0.86, 0.86);
    bodyShape.lineTo(0.94, 0.7);
    bodyShape.lineTo(0.42, 0.45);
    bodyShape.lineTo(-0.58, 0.44);
  }
  bodyShape.closePath();

  const extrudeDepth = isTrike ? 0.62 : isVespa ? 0.44 : bikeId === 'superbike600' ? 0.34 : 0.28;
  const extrudeGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: extrudeDepth,
    bevelEnabled: true,
    bevelThickness: 0.048,
    bevelSize: 0.042,
    bevelSegments: 2,
  });
  extrudeGeo.center();
  extrudeGeo.rotateY(Math.PI / 2);

  const mainFairing = new THREE.Mesh(
    extrudeGeo,
    isEnemy ? hitBodyMat : bodyPaintMat
  );
  mainFairing.position.set(0, isTrail ? 0.82 : isChopper ? 0.65 : 0.71, -0.02);
  mainFairing.castShadow = true;
  chassisGroup.add(mainFairing);

  // Vehicle-Specific Silhouette Modules
  if (bikeId === 'superbike600') {
    for (const side of [-0.24, 0.24]) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 0.22), accentMat);
      wing.position.set(side, 0.82, -0.64);
      wing.rotation.z = side > 0 ? -0.18 : 0.18;
      chassisGroup.add(wing);
    }
  } else if (bikeId === 'naked250') {
    for (const side of [-0.17, 0.17]) {
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.56, 8), accentMat);
      rail.rotation.x = 1.2;
      rail.position.set(side, 0.68, -0.12);
      chassisGroup.add(rail);
    }
  } else if (isVespa) {
    // Classic Vespa wide rear cowl side pods + chrome rear luggage rack
    for (const side of [-0.27, 0.27]) {
      const pod = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), bodyPaintMat);
      pod.scale.set(0.55, 0.9, 1.55);
      pod.position.set(side, 0.58, 0.54);
      chassisGroup.add(pod);
    }
    const rack = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.04, 0.34), chromeMat);
    rack.position.set(0, 0.84, 0.92);
    chassisGroup.add(rack);
  } else if (isTrail) {
    // Motocross High Front Beak Fender
    const beak = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.055, 0.48), bodyPaintMat);
    beak.position.set(0, 0.92, -0.82);
    beak.rotation.x = 0.24;
    chassisGroup.add(beak);
  } else if (isChopper) {
    // Chrome Teardrop Fuel Tank Accent + Sissy Bar Backrest
    const tankCap = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), bodyPaintMat);
    tankCap.scale.set(1.15, 0.8, 1.65);
    tankCap.position.set(0, 0.84, -0.2);
    chassisGroup.add(tankCap);

    for (const sx of [-0.13, 0.13]) {
      const sissyPost = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.45, 6), chromeMat);
      sissyPost.position.set(sx, 0.92, 0.88);
      sissyPost.rotation.x = -0.2;
      chassisGroup.add(sissyPost);
    }
  } else if (isTrike) {
    // Front Dual A-Arms + Armored Bull Bar + Twin Front Fenders + Overhead Roll-Cage
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.16, 0.18), chromeMat);
    bumper.position.set(0, 0.48, -1.16);
    chassisGroup.add(bumper);

    for (const side of [-0.62, 0.62]) {
      const aArm = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.06, 0.12), accentMat);
      aArm.position.set(side * 0.52, 0.44, -0.86);
      chassisGroup.add(aArm);

      const mudguard = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.06, 0.54), bodyPaintMat);
      mudguard.position.set(side, wheelRadius + 0.39, frontWheelZ);
      chassisGroup.add(mudguard);
    }

    // Overhead Tactical Roll-Cage Frame
    for (const side of [-0.42, 0.42]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 1.15, 8), frameMat);
      post.position.set(side, 1.28, 0.48);
      post.rotation.x = -0.25;
      chassisGroup.add(post);

      const frontStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.95, 8), frameMat);
      frontStrut.position.set(side, 1.38, -0.25);
      frontStrut.rotation.x = 0.72;
      chassisGroup.add(frontStrut);
    }
    const roofBar = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.07, 0.45), frameMat);
    roofBar.position.set(0, 1.82, 0.18);
    chassisGroup.add(roofBar);

    const roofLeds = new THREE.Mesh(
      new THREE.BoxGeometry(0.76, 0.09, 0.08),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    roofLeds.position.set(0, 1.84, -0.05);
    chassisGroup.add(roofLeds);
  }

  // Front Mudguard Fender (for standard bikes)
  if (!isTrail && !isTrike) {
    const frontFender = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.36, 0.19, 12, 1, true, -Math.PI * 0.35, Math.PI * 0.65),
      isEnemy ? hitBodyMat : bodyPaintMat
    );
    frontFender.rotation.z = Math.PI / 2;
    frontFender.position.set(0, wheelRadius + 0.05, frontWheelZ);
    chassisGroup.add(frontFender);
  }

  // Interceptor / Boss front bull-bar
  if (isEnemy && (enemyType === 'interceptor' || enemyType === 'boss')) {
    const bullBar = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.16, 0.16), chromeMat);
    bullBar.position.set(0, 0.58, -0.98);
    chassisGroup.add(bullBar);
  }

  // Front Forks, Handlebars, Side Mirrors & Digital Speedo Dash
  const forkLen = isChopper ? 1.02 : isTrail ? 0.92 : 0.78;
  const forkRake = isChopper ? 0.62 : 0.38;
  const forkGeo = new THREE.CylinderGeometry(0.034, 0.028, forkLen, 10);
  if (!isTrike) {
    for (const side of [-0.115, 0.115]) {
      const fork = new THREE.Mesh(
        forkGeo,
        bikeId === 'superbike600' || isTrail ? springMat : chromeMat
      );
      fork.position.set(side, isTrail ? 0.74 : 0.65, isChopper ? -0.78 : -0.64);
      fork.rotation.x = forkRake;
      fork.castShadow = true;
      chassisGroup.add(fork);
    }
  }

  const barY = isChopper ? 1.12 : isTrail ? 1.07 : 0.97;
  const barZ = isChopper ? -0.34 : -0.46;
  const barWidth = isChopper || isTrail ? 0.84 : 0.72;
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, barWidth, 10), chromeMat);
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, barY, barZ);
  chassisGroup.add(bar);

  // Glowing Digital Cockpit Gauge
  const dashScreen = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.09, 0.03),
    new THREE.MeshBasicMaterial({ color: isEnemy ? 0xef4444 : 0x38bdf8 })
  );
  dashScreen.position.set(0, barY + 0.05, barZ - 0.1);
  dashScreen.rotation.x = -0.7;
  chassisGroup.add(dashScreen);

  const gripX = barWidth * 0.43;
  for (const side of [-gripX, gripX]) {
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.14, 10), seatMat);
    grip.rotation.z = Math.PI / 2;
    grip.position.set(side, barY, barZ);
    chassisGroup.add(grip);

    const guard = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.075, 0.1),
      isTrail ? bodyPaintMat : accentMat
    );
    guard.position.set(side * 1.09, barY + 0.01, barZ - 0.05);
    chassisGroup.add(guard);

    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 6), frameMat);
    stalk.position.set(side * 0.95, barY + 0.08, barZ - 0.02);
    stalk.rotation.z = side > 0 ? -0.35 : 0.35;
    chassisGroup.add(stalk);

    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.065, 0.04), seatMat);
    mirror.position.set(side * 1.08, barY + 0.16, barZ - 0.02);
    chassisGroup.add(mirror);
  }

  // Footpegs
  for (const side of [isTrike ? -0.38 : -0.25, isTrike ? 0.38 : 0.25]) {
    const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.15, 8), chromeMat);
    peg.rotation.z = Math.PI / 2;
    peg.position.set(side, isChopper ? 0.38 : 0.44, isChopper ? -0.15 : 0.16);
    chassisGroup.add(peg);
  }

  // Sculpted Seat
  const seat = new THREE.Mesh(
    new THREE.BoxGeometry(isTrike ? 0.44 : 0.3, 0.11, 0.62),
    isVespa ? new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.78 }) : seatMat
  );
  seat.position.set(0, isTrail ? 0.94 : isChopper ? 0.72 : 0.82, 0.26);
  seat.rotation.x = -0.08;
  chassisGroup.add(seat);

  // Headlights (Round Retro Lamp for Vespa/Chopper, Twin Projector for Sport/Trike)
  const headlightColor = isEnemy ? 0xff2a2a : isCivilian ? 0xfde68a : 0xfef08a;
  const headlightMat = new THREE.MeshStandardMaterial({
    color: headlightColor,
    emissive: headlightColor,
    emissiveIntensity: 2.5,
    roughness: 0.12,
  });
  if (isVespa || isChopper) {
    const roundHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.12, 14), chromeMat);
    roundHousing.rotation.x = Math.PI / 2;
    roundHousing.position.set(0, isChopper ? 0.88 : 0.92, isChopper ? -0.78 : -0.68);
    chassisGroup.add(roundHousing);

    const bulb = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 14), headlightMat);
    bulb.rotation.x = Math.PI / 2;
    bulb.position.set(0, isChopper ? 0.88 : 0.92, (isChopper ? -0.78 : -0.68) - 0.06);
    chassisGroup.add(bulb);
  } else {
    for (const hx of isTrike ? [-0.28, 0.28] : [-0.085, 0.085]) {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.08), headlightMat);
      eye.position.set(hx, isTrail ? 0.96 : 0.85, isTrike ? -0.96 : -0.78);
      chassisGroup.add(eye);
    }
    const drlBar = new THREE.Mesh(
      new THREE.BoxGeometry(isTrike ? 0.62 : 0.28, 0.035, 0.06),
      new THREE.MeshBasicMaterial({ color: isEnemy ? 0xf97316 : 0x38bdf8 })
    );
    drlBar.position.set(0, isTrail ? 1.04 : 0.93, isTrike ? -0.95 : -0.77);
    chassisGroup.add(drlBar);
  }

  if (!isChopper && !isTrail) {
    const windscreen = new THREE.Mesh(
      new THREE.BoxGeometry(
        bikeId === 'matic150' ? 0.34 : isTrike ? 0.44 : 0.27,
        bikeId === 'matic150' ? 0.34 : 0.25,
        0.04
      ),
      new THREE.MeshPhysicalMaterial({
        color: 0x0f172a,
        roughness: 0.06,
        metalness: 0.12,
        transparent: true,
        opacity: 0.7,
      })
    );
    windscreen.position.set(0, bikeId === 'matic150' ? 1.08 : 1.01, isTrike ? -0.82 : -0.7);
    windscreen.rotation.x = -0.52;
    chassisGroup.add(windscreen);
  }

  // LED Tailbar + Rear Mudguard & License Plate
  const tailMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xef4444,
    emissiveIntensity: 2.2,
    roughness: 0.2,
  });
  const taillight = new THREE.Mesh(
    new THREE.BoxGeometry(isTrike ? 0.56 : 0.28, 0.075, 0.06),
    tailMat
  );
  taillight.position.set(0, isTrail ? 0.96 : 0.84, rearWheelZ + 0.2);
  chassisGroup.add(taillight);

  const rearPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.11, 0.025),
    new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.4 })
  );
  rearPlate.position.set(0, 0.67, rearWheelZ + 0.26);
  rearPlate.rotation.x = 0.35;
  chassisGroup.add(rearPlate);

  // Exhaust Pipes & NOS Thrusters
  const exhaustGeo = new THREE.CylinderGeometry(0.05, 0.066, isChopper ? 1.05 : 0.76, 10);
  const nosGeo = new THREE.ConeGeometry(isTrike ? 0.13 : 0.09, isTrike ? 0.68 : 0.52, 10);
  nosGeo.rotateX(Math.PI / 2);
  const nosMat = new THREE.MeshBasicMaterial({
    color: isEnemy ? 0xf97316 : 0x38bdf8,
    transparent: true,
    opacity: 0.94,
  });

  const nosGlowLeft = new THREE.Mesh(nosGeo, nosMat);
  const nosGlowRight = new THREE.Mesh(nosGeo, nosMat);

  const pipeX = isTrike ? 0.34 : 0.2;
  for (const [idx, side] of [-pipeX, pipeX].entries()) {
    const pipe = new THREE.Mesh(exhaustGeo, chromeMat);
    pipe.rotation.x = Math.PI / 2 - (isTrail ? 0.32 : isChopper ? 0.02 : 0.14);
    pipe.position.set(side, isTrail ? 0.68 : isChopper ? 0.34 : 0.43, 0.58);
    chassisGroup.add(pipe);

    const glow = idx === 0 ? nosGlowLeft : nosGlowRight;
    glow.position.set(side, isTrail ? 0.78 : 0.47, rearWheelZ + 0.44);
    glow.visible = false;
    chassisGroup.add(glow);
  }

  // Civilian Ojol Thermal Box OR Commuter Top Box
  if (isCivilian) {
    const boxColor = civilianVariant === 'ojol' ? 0x10b981 : 0x334155;
    const cargoBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.34, 0.38),
      new THREE.MeshStandardMaterial({ color: boxColor, roughness: 0.55 })
    );
    cargoBox.position.set(0, 1.02, 0.78);
    cargoBox.castShadow = true;
    chassisGroup.add(cargoBox);

    const reflector = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.05, 0.03),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    reflector.position.set(0, 1.04, 0.98);
    chassisGroup.add(reflector);
  }

  // =========================================================================
  // ARTICULATED 3D RIDER CHARACTER
  // =========================================================================
  const jacketColor = isEnemy
    ? 0x18181b
    : isCivilian
    ? civilianVariant === 'ojol'
      ? 0x059669
      : 0x334155
    : 0x1e293b;
  const jacketMat = new THREE.MeshStandardMaterial({
    color: jacketColor,
    roughness: 0.68,
    metalness: 0.14,
  });
  hitFlashMaterials.push(jacketMat);

  const pantsMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.86,
    metalness: 0.05,
  });

  const bootMat = new THREE.MeshStandardMaterial({
    color: 0x09090b,
    roughness: 0.5,
    metalness: 0.28,
  });

  const helmetMat = new THREE.MeshPhysicalMaterial({
    color: isEnemy
      ? accentColor
      : isCivilian
      ? civilianVariant === 'ojol'
        ? 0x10b981
        : 0xe2e8f0
      : primaryColor,
    roughness: 0.16,
    metalness: 0.5,
    clearcoat: 0.92,
  });

  const visorMat = new THREE.MeshStandardMaterial({
    color: isEnemy ? 0xef4444 : isCivilian ? 0x94a3b8 : 0x38bdf8,
    emissive: isEnemy ? 0xb91c1c : isCivilian ? 0x1e293b : 0x0284c7,
    emissiveIntensity: isEnemy ? 1.2 : isCivilian ? 0.25 : 0.85,
    roughness: 0.06,
    metalness: 0.92,
  });

  const riderGroup = new THREE.Group();
  riderGroup.position.set(0, 0.85, 0.18);
  chassisGroup.add(riderGroup);

  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.24), pantsMat);
  pelvis.position.set(0, 0.03, 0.04);
  riderGroup.add(pelvis);

  for (const side of [-1, 1]) {
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.24, 4, 8), pantsMat);
    thigh.position.set(side * 0.17, -0.05, -0.08);
    thigh.rotation.x = 1.05;
    thigh.rotation.z = side * -0.18;
    riderGroup.add(thigh);

    const kneePad = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.12, 0.11), accentMat);
    kneePad.position.set(side * 0.22, -0.14, -0.2);
    riderGroup.add(kneePad);

    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.056, 0.22, 4, 8), pantsMat);
    shin.position.set(side * 0.21, -0.26, -0.09);
    shin.rotation.x = -0.55;
    riderGroup.add(shin);

    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.1, 0.23), bootMat);
    boot.position.set(side * 0.22, -0.37, -0.02);
    riderGroup.add(boot);
  }

  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 0.08, 0.02);
  torsoGroup.rotation.x = isCivilian ? 0.22 : 0.42;
  riderGroup.add(torsoGroup);

  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.45, 0.24), jacketMat);
  chest.position.set(0, 0.22, 0);
  chest.castShadow = true;
  torsoGroup.add(chest);

  const chestStripeMat =
    isCivilian && civilianVariant === 'ojol'
      ? new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 })
      : accentMat;
  const chestArmor = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.255), chestStripeMat);
  chestArmor.position.set(0, 0.25, 0);
  torsoGroup.add(chestArmor);

  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.08, 10), jacketMat);
  collar.position.set(0, 0.46, 0);
  torsoGroup.add(collar);

  for (const side of [-0.22, 0.22]) {
    const pauldron = new THREE.Mesh(new THREE.SphereGeometry(0.098, 10, 8), chestStripeMat);
    pauldron.scale.set(1.05, 0.85, 1.1);
    pauldron.position.set(side, 0.38, 0);
    torsoGroup.add(pauldron);
  }

  if (!isEnemy && !isCivilian) {
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.33, 0.13), frameMat);
    pack.position.set(0, 0.24, 0.155);
    torsoGroup.add(pack);

    const packStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.19, 0.05, 0.03),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    packStrip.position.set(0, 0.3, 0.225);
    torsoGroup.add(packStrip);
  } else if (isEnemy && (enemyType === 'heavy' || enemyType === 'boss')) {
    const armorPad = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.15, 0.32), accentMat);
    armorPad.position.set(0, 0.4, 0);
    torsoGroup.add(armorPad);
  }

  // Scarf / Racing Cape
  const scarfMat = new THREE.MeshStandardMaterial({
    color: isEnemy
      ? enemyType === 'boss'
        ? 0xef4444
        : accentColor
      : isCivilian
      ? civilianVariant === 'ojol'
        ? 0xfacc15
        : 0x38bdf8
      : 0xfacc15,
    roughness: 0.68,
    side: THREE.DoubleSide,
  });
  const scarfWidth = enemyType === 'boss' ? 0.38 : isCivilian ? 0.12 : 0.16;
  const scarfLen = enemyType === 'boss' ? 0.88 : isCivilian ? 0.36 : 0.58;
  const scarfGeo = new THREE.PlaneGeometry(scarfWidth, scarfLen, 1, 3);
  scarfGeo.translate(0, -scarfLen * 0.5, 0);
  const scarfMesh = new THREE.Mesh(scarfGeo, scarfMat);
  scarfMesh.position.set(0, 0.44, 0.12);
  scarfMesh.rotation.x = 1.25;
  torsoGroup.add(scarfMesh);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.56, -0.02);
  headGroup.rotation.x = isCivilian ? -0.18 : -0.34;
  torsoGroup.add(headGroup);

  const helmetShell = new THREE.Mesh(new THREE.SphereGeometry(0.168, 16, 14), helmetMat);
  helmetShell.scale.set(0.95, 1.0, 1.12);
  helmetShell.castShadow = true;
  headGroup.add(helmetShell);

  const chinGuard = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.11, 0.16), jacketMat);
  chinGuard.position.set(0, -0.07, -0.11);
  headGroup.add(chinGuard);

  const helmetFin = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.22), chestStripeMat);
  helmetFin.position.set(0, 0.15, 0.06);
  helmetFin.rotation.x = -0.25;
  headGroup.add(helmetFin);

  const helmetSpoiler = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.045, 0.1), chestStripeMat);
  helmetSpoiler.position.set(0, 0.09, 0.16);
  helmetSpoiler.rotation.x = 0.35;
  headGroup.add(helmetSpoiler);

  const visorGeo = new THREE.CylinderGeometry(0.156, 0.156, 0.095, 14, 1, false, -Math.PI * 0.34, Math.PI * 0.68);
  visorGeo.rotateY(Math.PI);
  const visor = new THREE.Mesh(visorGeo, visorMat);
  visor.position.set(0, 0.015, -0.04);
  headGroup.add(visor);

  if (isEnemy && enemyType === 'boss') {
    const crownMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xeab308,
      emissiveIntensity: 0.75,
      metalness: 0.9,
      roughness: 0.2,
    });
    for (const side of [-0.11, 0.11]) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.22, 6), crownMat);
      horn.position.set(side, 0.16, -0.04);
      horn.rotation.z = side > 0 ? -0.45 : 0.45;
      headGroup.add(horn);
    }
  }

  // Left Arm
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.22, 0.36, -0.02);
  torsoGroup.add(leftArm);

  const leftUpper = new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.2, 4, 8), jacketMat);
  leftUpper.position.set(0, -0.06, -0.14);
  leftUpper.rotation.x = 1.05;
  leftArm.add(leftUpper);

  const leftFore = new THREE.Mesh(new THREE.CapsuleGeometry(0.042, 0.2, 4, 8), jacketMat);
  leftFore.position.set(-0.04, -0.12, -0.34);
  leftFore.rotation.x = 1.45;
  leftArm.add(leftFore);

  const leftGlove = new THREE.Mesh(new THREE.SphereGeometry(0.052, 8, 8), bootMat);
  leftGlove.position.set(-0.05, -0.13, -0.46);
  leftArm.add(leftGlove);

  // Right Weapon Arm
  const weaponArm = new THREE.Group();
  weaponArm.position.set(0.22, 0.36, -0.02);
  torsoGroup.add(weaponArm);

  const rightUpper = new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.2, 4, 8), jacketMat);
  rightUpper.position.set(0, -0.06, -0.14);
  rightUpper.rotation.x = 1.05;
  weaponArm.add(rightUpper);

  const rightFore = new THREE.Mesh(new THREE.CapsuleGeometry(0.042, 0.2, 4, 8), jacketMat);
  rightFore.position.set(0.04, -0.12, -0.32);
  rightFore.rotation.x = 1.45;
  weaponArm.add(rightFore);

  const rightGlove = new THREE.Mesh(new THREE.SphereGeometry(0.052, 8, 8), bootMat);
  rightGlove.position.set(0.05, -0.13, -0.44);
  weaponArm.add(rightGlove);

  let weaponBlade: THREE.Mesh;
  if (isEnemy) {
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0xe4e4e7,
      emissive: enemyType === 'boss' ? 0xfacc15 : 0xef4444,
      emissiveIntensity: 0.35,
      roughness: 0.2,
      metalness: 0.9,
    });

    if (enemyType === 'shooter') {
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.06), bootMat);
      grip.position.set(0.05, -0.12, -0.46);
      grip.rotation.x = -0.3;
      weaponArm.add(grip);

      const barrelGeo = new THREE.CylinderGeometry(0.036, 0.046, 0.44, 10);
      barrelGeo.rotateX(Math.PI / 2);
      weaponBlade = new THREE.Mesh(barrelGeo, bladeMat);
      weaponBlade.position.set(0.05, -0.05, -0.62);
      weaponArm.add(weaponBlade);
    } else if (enemyType === 'heavy') {
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.56, 8), bootMat);
      shaft.rotation.x = Math.PI / 2;
      shaft.position.set(0.05, -0.1, -0.58);
      weaponArm.add(shaft);

      weaponBlade = new THREE.Mesh(new THREE.DodecahedronGeometry(0.13, 0), bladeMat);
      weaponBlade.position.set(0.05, -0.08, -0.84);
      weaponArm.add(weaponBlade);
    } else {
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.028, 0.22, 8), bootMat);
      handle.rotation.x = Math.PI / 2;
      handle.position.set(0.05, -0.1, -0.46);
      weaponArm.add(handle);

      const celuritShape = new THREE.Shape();
      celuritShape.moveTo(0, 0);
      celuritShape.quadraticCurveTo(0.04, 0.28, 0.28, 0.48);
      celuritShape.quadraticCurveTo(0.42, 0.56, 0.54, 0.42);
      celuritShape.quadraticCurveTo(0.36, 0.46, 0.16, 0.28);
      celuritShape.quadraticCurveTo(0.06, 0.14, 0.05, 0);
      celuritShape.closePath();

      const bladeGeo = new THREE.ExtrudeGeometry(celuritShape, {
        depth: 0.024,
        bevelEnabled: true,
        bevelThickness: 0.008,
        bevelSize: 0.006,
        bevelSegments: 1,
      });
      bladeGeo.rotateY(Math.PI / 2);
      bladeGeo.rotateX(-Math.PI * 0.35);

      weaponBlade = new THREE.Mesh(bladeGeo, bladeMat);
      weaponBlade.position.set(0.04, -0.08, -0.52);
      if (enemyType === 'boss') weaponBlade.scale.setScalar(1.35);
      weaponArm.add(weaponBlade);
    }
  } else {
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.028, 0.2, 8), bootMat);
    handle.rotation.x = Math.PI / 2;
    handle.position.set(0.06, -0.11, -0.46);
    weaponArm.add(handle);

    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 0.03), accentMat);
    guard.position.set(0.06, -0.1, -0.55);
    weaponArm.add(guard);

    if (meleeWeapon === 'golok') {
      // Wide Betawi Steel Golok Cleaver
      const golokMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        emissive: 0xf97316,
        emissiveIntensity: 0.45,
        roughness: 0.18,
        metalness: 0.92,
      });
      weaponBlade = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.14, 0.62), golokMat);
      weaponBlade.position.set(0.06, -0.07, -0.84);
      weaponArm.add(weaponBlade);
    } else if (meleeWeapon === 'chain') {
      // Spiked Chain Flail
      const chainMat = new THREE.MeshStandardMaterial({
        color: 0xd4d4d8,
        emissive: 0xef4444,
        emissiveIntensity: 0.65,
        roughness: 0.22,
        metalness: 0.9,
      });
      const chainRod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.68, 8), chromeMat);
      chainRod.rotation.x = Math.PI / 2;
      chainRod.position.set(0.06, -0.08, -0.84);
      weaponArm.add(chainRod);

      weaponBlade = new THREE.Mesh(new THREE.DodecahedronGeometry(0.13, 0), chainMat);
      weaponBlade.position.set(0.06, -0.08, -1.18);
      weaponArm.add(weaponBlade);
    } else if (meleeWeapon === 'katana') {
      // Glowing Neon Cyan Plasma Katana
      const katanaMat = new THREE.MeshStandardMaterial({
        color: 0x67e8f9,
        emissive: 0x22d3ee,
        emissiveIntensity: 1.6,
        roughness: 0.1,
        metalness: 0.85,
      });
      weaponBlade = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.055, 0.88), katanaMat);
      weaponBlade.position.set(0.06, -0.06, -0.98);
      weaponArm.add(weaponBlade);
    } else {
      // Tactical Stun Baton (Default)
      const batonMat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.85,
        roughness: 0.2,
        metalness: 0.85,
      });
      weaponBlade = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.075, 0.54), batonMat);
      weaponBlade.position.set(0.06, -0.08, -0.78);
      weaponArm.add(weaponBlade);
    }
    if (isCivilian) weaponBlade.visible = false;

    // Holstered Ranged Weapon Mount on Rider Pack / Left Flank
    if (!isCivilian && rangedWeapon !== 'flare') {
      const gunColor =
        rangedWeapon === 'rpg' ? 0x15803d : rangedWeapon === 'smg' ? 0x38bdf8 : 0xf97316;
      const gunBarrel = new THREE.Mesh(
        new THREE.CylinderGeometry(
          rangedWeapon === 'rpg' ? 0.065 : 0.036,
          rangedWeapon === 'rpg' ? 0.075 : 0.042,
          rangedWeapon === 'rpg' ? 0.72 : 0.48,
          10
        ),
        new THREE.MeshStandardMaterial({ color: gunColor, metalness: 0.7, roughness: 0.3 })
      );
      gunBarrel.rotation.x = Math.PI / 2 - 0.35;
      gunBarrel.position.set(-0.24, 0.34, 0.08);
      torsoGroup.add(gunBarrel);
    }
  }

  let shieldMesh: THREE.Mesh | undefined;
  if (!isEnemy && !isCivilian) {
    shieldMesh = new THREE.Mesh(
      new THREE.SphereGeometry(isTrike ? 1.56 : 1.38, 18, 14),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.22,
        wireframe: true,
        depthWrite: false,
      })
    );
    shieldMesh.position.set(0, 0.88, 0);
    shieldMesh.visible = false;
    chassisGroup.add(shieldMesh);
  }

  let distressBeacon: THREE.Mesh | undefined;
  if (isCivilian) {
    distressBeacon = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.3, 0),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    distressBeacon.position.set(0, 2.32, 0);
    distressBeacon.visible = false;
    root.add(distressBeacon);
  }

  if (isEnemy && enemyType) {
    const sc = ENEMY_SPECS[enemyType].scale;
    root.scale.setScalar(sc);
  }

  return {
    root,
    chassisGroup,
    frontWheel,
    rearWheel,
    nosGlowLeft,
    nosGlowRight,
    riderGroup,
    torsoGroup,
    headGroup,
    scarfMesh,
    weaponArm,
    weaponBlade,
    shieldMesh,
    distressBeacon,
    hitFlashMaterials,
    contactShadow,
  };
}

export function createBegalPickupModel(textures: ProceduralTextureSet): PickupRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const hitFlashMaterials: THREE.MeshStandardMaterial[] = [];

  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: 0x7f1d1d,
    roughness: 0.34,
    metalness: 0.54,
    clearcoat: 0.62,
  });
  hitFlashMaterials.push(bodyMat as unknown as THREE.MeshStandardMaterial);

  const armorMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.5,
    metalness: 0.74,
  });
  hitFlashMaterials.push(armorMat);

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d8,
    roughness: 0.18,
    metalness: 0.92,
  });

  const lowerFrame = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.66, 4.95), armorMat);
  lowerFrame.position.set(0, 0.72, 0);
  lowerFrame.castShadow = true;
  bodyGroup.add(lowerFrame);

  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.98, 1.06, 1.76), bodyMat);
  cab.position.set(0, 1.48, -1.15);
  cab.castShadow = true;
  bodyGroup.add(cab);

  const windshield = new THREE.Mesh(
    new THREE.BoxGeometry(1.84, 0.52, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.12, metalness: 0.85 })
  );
  windshield.position.set(0, 1.56, -2.0);
  windshield.rotation.x = 0.22;
  bodyGroup.add(windshield);

  const bedFloor = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.18, 2.55), armorMat);
  bedFloor.position.set(0, 1.05, 1.12);
  bodyGroup.add(bedFloor);

  for (const sx of [-0.95, 0.95]) {
    const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.68, 2.55), bodyMat);
    sideWall.position.set(sx, 1.38, 1.12);
    sideWall.castShadow = true;
    bodyGroup.add(sideWall);
  }
  const tailgate = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.68, 0.14), bodyMat);
  tailgate.position.set(0, 1.38, 2.38);
  bodyGroup.add(tailgate);

  const bullBar = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.48, 0.3), chromeMat);
  bullBar.position.set(0, 0.76, -2.54);
  bodyGroup.add(bullBar);

  const headMat = new THREE.MeshStandardMaterial({
    color: 0xff3b3b,
    emissive: 0xef4444,
    emissiveIntensity: 2.6,
  });
  for (const hx of [-0.72, 0.72]) {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.1), headMat);
    lamp.position.set(hx, 1.02, -2.46);
    bodyGroup.add(lamp);
  }

  const rollbar = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.55, 0.12), armorMat);
  rollbar.position.set(0, 2.22, -0.1);
  bodyGroup.add(rollbar);

  const beaconLight = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.22, 0.24),
    new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xf97316,
      emissiveIntensity: 2.4,
    })
  );
  beaconLight.position.set(0, 2.52, -0.1);
  bodyGroup.add(beaconLight);

  const wheelGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.34, 16);
  wheelGeo.rotateZ(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x111114, roughness: 0.9 });
  const wheels: THREE.Mesh[] = [];
  for (const [wx, wz] of [
    [-1.08, -1.55],
    [1.08, -1.55],
    [-1.08, 1.48],
    [1.08, 1.48],
  ]) {
    const w = new THREE.Mesh(wheelGeo, tireMat);
    w.position.set(wx, 0.46, wz);
    w.castShadow = true;
    bodyGroup.add(w);
    wheels.push(w);
  }

  const gunners: THREE.Group[] = [];
  const gunnerJacketMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7 });
  const gunnerHelmetMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0x991b1b,
    emissiveIntensity: 0.6,
  });
  for (const gx of [-0.45, 0.45]) {
    const g = new THREE.Group();
    g.position.set(gx, 1.15, 1.15);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.58, 0.26), gunnerJacketMat);
    torso.position.y = 0.42;
    g.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 10), gunnerHelmetMat);
    head.position.y = 0.88;
    g.add(head);

    const weapon = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.68, 8), chromeMat);
    weapon.rotation.x = Math.PI / 2 - 0.15;
    weapon.position.set(0.16, 0.56, -0.32);
    g.add(weapon);

    bodyGroup.add(g);
    gunners.push(g);
  }

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.0, 6.2),
    new THREE.MeshBasicMaterial({
      map: textures.contactShadow,
      transparent: true,
      depthWrite: false,
      opacity: 0.72,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  root.add(shadow);

  return {
    root,
    bodyGroup,
    wheels,
    gunners,
    beaconLight,
    hitFlashMaterials,
    contactShadow: shadow,
  };
}

export function createPolicePatrolModel(textures: ProceduralTextureSet): PoliceRig {
  const root = new THREE.Group();

  const whiteMat = new THREE.MeshPhysicalMaterial({
    color: 0xf8fafc,
    roughness: 0.18,
    metalness: 0.36,
    clearcoat: 0.92,
  });
  const blueMat = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8,
    roughness: 0.28,
    metalness: 0.52,
  });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.7, 3.7), whiteMat);
  chassis.position.y = 0.74;
  chassis.castShadow = true;
  root.add(chassis);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.54, 1.9), whiteMat);
  cabin.position.set(0, 1.33, -0.05);
  root.add(cabin);

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.2, 3.74), blueMat);
  stripe.position.y = 0.78;
  root.add(stripe);

  const bullbar = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.3, 0.16), darkMat);
  bullbar.position.set(0, 0.62, -1.9);
  root.add(bullbar);

  const redStrobe = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.16, 0.24),
    new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 3.2,
    })
  );
  redStrobe.position.set(-0.34, 1.68, 0);
  root.add(redStrobe);

  const blueStrobe = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.16, 0.24),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 3.2,
    })
  );
  blueStrobe.position.set(0.34, 1.68, 0);
  root.add(blueStrobe);

  const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.24, 14);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheels: THREE.Mesh[] = [];
  for (const [wx, wz] of [
    [-0.88, -1.15],
    [0.88, -1.15],
    [-0.88, 1.15],
    [0.88, 1.15],
  ]) {
    const w = new THREE.Mesh(wheelGeo, darkMat);
    w.position.set(wx, 0.35, wz);
    root.add(w);
    wheels.push(w);
  }

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 4.3),
    new THREE.MeshBasicMaterial({
      map: textures.contactShadow,
      transparent: true,
      depthWrite: false,
      opacity: 0.62,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  root.add(shadow);

  return { root, redStrobe, blueStrobe, wheels };
}

export function createPowerupMesh(kind: PowerupKind): THREE.Group {
  const group = new THREE.Group();

  if (kind === 'ammo') {
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x365314,
      roughness: 0.42,
      metalness: 0.48,
    });
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.85,
      roughness: 0.25,
      metalness: 0.75,
    });
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xeab308,
      emissiveIntensity: 0.55,
      roughness: 0.18,
      metalness: 0.9,
    });

    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.44, 0.54), boxMat);
    crate.position.y = 0.72;
    crate.castShadow = true;
    group.add(crate);

    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.79, 0.1, 0.57), trimMat);
    strap.position.y = 0.78;
    group.add(strap);

    // 3 upright glowing brass cartridges atop the crate for instant silhouette read
    for (const bx of [-0.18, 0, 0.18]) {
      const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.24, 8), brassMat);
      shell.position.set(bx, 1.06, 0);
      group.add(shell);

      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.052, 0.11, 8), trimMat);
      tip.position.set(bx, 1.23, 0);
      group.add(tip);
    }

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.64, 0.045, 8, 20),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.28;
    group.add(ring);

    return group;
  }

  const color = kind === 'heal' ? 0x10b981 : kind === 'nos' ? 0x38bdf8 : 0xfacc15;

  const coreMat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 1.2,
    roughness: 0.18,
    metalness: 0.72,
  });

  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), coreMat);
  core.position.y = 0.85;
  group.add(core);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.56, 0.05, 8, 20),
    new THREE.MeshBasicMaterial({ color })
  );
  ring.position.y = 0.85;
  group.add(ring);

  return group;
}

export function createSpikeTrapMesh(textures: ProceduralTextureSet): THREE.Group {
  const group = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 0.1, 0.75),
    new THREE.MeshStandardMaterial({ map: textures.hazardStripe, roughness: 0.5 })
  );
  base.position.y = 0.05;
  group.add(base);

  const spikeMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xef4444,
    emissiveIntensity: 0.9,
    metalness: 0.85,
    roughness: 0.2,
  });
  const spikeGeo = new THREE.ConeGeometry(0.08, 0.28, 6);
  for (let sx = -0.8; sx <= 0.81; sx += 0.4) {
    const spike = new THREE.Mesh(spikeGeo, spikeMat);
    spike.position.set(sx, 0.22, 0);
    group.add(spike);
  }

  return group;
}

export function createBaksoCartMesh(textures: ProceduralTextureSet): THREE.Group {
  const group = new THREE.Group();

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x7c4a24, roughness: 0.78 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    transparent: true,
    opacity: 0.48,
    roughness: 0.12,
    metalness: 0.2,
  });
  const potMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, roughness: 0.2, metalness: 0.9 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.6 });
  const lanternMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfacc15,
    emissiveIntensity: 2.5,
  });

  const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.85, 2.2), woodMat);
  base.position.y = 0.72;
  base.castShadow = true;
  group.add(base);

  const cabinet = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.65, 1.3), glassMat);
  cabinet.position.set(0, 1.46, -0.35);
  group.add(cabinet);

  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.38, 12), potMat);
  pot.position.set(0, 1.32, 0.65);
  group.add(pot);

  for (const [px, pz] of [
    [-0.68, -1.02],
    [0.68, -1.02],
    [-0.68, 1.02],
    [0.68, 1.02],
  ]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.25, 0.08), woodMat);
    post.position.set(px, 1.65, pz);
    group.add(post);
  }

  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.12, 2.55), roofMat);
  roof.position.y = 2.3;
  group.add(roof);

  const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), lanternMat);
  lantern.position.set(0, 1.98, 0.2);
  group.add(lantern);

  const wheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.12, 12);
  wheelGeo.rotateZ(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
  for (const sx of [-0.78, 0.78]) {
    const w = new THREE.Mesh(wheelGeo, tireMat);
    w.position.set(sx, 0.28, 0);
    group.add(w);
  }

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 2.8),
    new THREE.MeshBasicMaterial({
      map: textures.contactShadow,
      transparent: true,
      depthWrite: false,
      opacity: 0.6,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  group.add(shadow);

  return group;
}

export function createGhostScooterMesh(): THREE.Group {
  const group = new THREE.Group();
  const ghostMat = new THREE.MeshStandardMaterial({
    color: 0x67e8f9,
    emissive: 0x22d3ee,
    emissiveIntensity: 1.8,
    transparent: true,
    opacity: 0.62,
    roughness: 0.2,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.65, 1.55), ghostMat);
  body.position.y = 0.62;
  group.add(body);

  const riderTorso = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.42, 4, 8), ghostMat);
  riderTorso.position.set(0, 1.25, 0.1);
  riderTorso.rotation.x = 0.3;
  group.add(riderTorso);

  const riderHead = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), ghostMat);
  riderHead.position.set(0, 1.68, 0.02);
  group.add(riderHead);

  return group;
}

export function createOdongMesh(textures: ProceduralTextureSet): THREE.Group {
  const group = new THREE.Group();
  const baseMat = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.35, metalness: 0.4 });
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xca8a04,
    emissiveIntensity: 0.7,
  });

  const base = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.48, 2.8), baseMat);
  base.position.y = 0.56;
  group.add(base);

  const seatColors = [0x38bdf8, 0xfacc15, 0x4ade80];
  seatColors.forEach((col, idx) => {
    const pod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.36, 0.55, 10),
      new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.65 })
    );
    pod.position.set(0, 1.05, -0.85 + idx * 0.85);
    group.add(pod);
  });

  for (const [px, pz] of [
    [-0.62, -1.25],
    [0.62, -1.25],
    [-0.62, 1.25],
    [0.62, 1.25],
  ]) {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 1.35, 6),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc })
    );
    pole.position.set(px, 1.45, pz);
    group.add(pole);
  }

  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.18, 3.0), roofMat);
  roof.position.y = 2.15;
  group.add(roof);

  // Rainbow disco orbs along roof edges
  const discoColors = [0x22d3ee, 0xf43f5e, 0xa855f7, 0xfacc15];
  discoColors.forEach((col, idx) => {
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 8),
      new THREE.MeshBasicMaterial({ color: col })
    );
    orb.position.set(idx % 2 === 0 ? -0.78 : 0.78, 2.15, -1.1 + idx * 0.72);
    group.add(orb);
  });

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.1, 3.2),
    new THREE.MeshBasicMaterial({
      map: textures.contactShadow,
      transparent: true,
      depthWrite: false,
      opacity: 0.6,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  group.add(shadow);

  return group;
}

export function createPakOgahMesh(textures: ProceduralTextureSet): THREE.Group {
  const group = new THREE.Group();
  const vestMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xca8a04,
    emissiveIntensity: 0.9,
    roughness: 0.4,
  });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });

  // Traffic Cone beside Pak Ogah
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.28, 0.65, 10),
    new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 0.5 })
  );
  cone.position.set(-0.6, 0.33, 0);
  group.add(cone);

  const legs = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.85, 0.25), pantsMat);
  legs.position.y = 0.43;
  group.add(legs);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.68, 0.32), vestMat);
  torso.position.y = 1.18;
  group.add(torso);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.45 })
  );
  head.position.y = 1.72;
  group.add(head);

  // Glowing Red Traffic Baton
  const wand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.62, 8),
    new THREE.MeshBasicMaterial({ color: 0xef4444 })
  );
  wand.position.set(0.36, 1.52, -0.15);
  wand.rotation.z = -0.55;
  group.add(wand);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 1.8),
    new THREE.MeshBasicMaterial({
      map: textures.contactShadow,
      transparent: true,
      depthWrite: false,
      opacity: 0.55,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  group.add(shadow);

  return group;
}

export function createNasgorCartMesh(textures: ProceduralTextureSet): THREE.Group {
  const group = new THREE.Group();
  const baseMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.6 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.85, roughness: 0.25 });
  const fireMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });

  const cart = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 2.2), baseMat);
  cart.position.y = 0.72;
  group.add(cart);

  const wok = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), steelMat);
  wok.position.set(0, 1.32, -0.45);
  group.add(wok);

  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.52, 8), fireMat);
  flame.position.set(0, 1.48, -0.45);
  group.add(flame);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.14, 2.45),
    new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0x9a3412, emissiveIntensity: 0.6 })
  );
  roof.position.y = 2.28;
  group.add(roof);

  for (const [px, pz] of [
    [-0.68, -0.98],
    [0.68, -0.98],
    [-0.68, 0.98],
    [0.68, 0.98],
  ]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.25, 0.08), steelMat);
    post.position.set(px, 1.65, pz);
    group.add(post);
  }

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 2.8),
    new THREE.MeshBasicMaterial({
      map: textures.contactShadow,
      transparent: true,
      depthWrite: false,
      opacity: 0.6,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  group.add(shadow);

  return group;
}

export function createKucingOrenMesh(textures: ProceduralTextureSet): THREE.Group {
  const group = new THREE.Group();
  const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.4 });
  const orangeMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    emissive: 0xea580c,
    emissiveIntensity: 0.45,
    roughness: 0.35,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xeab308,
    emissiveIntensity: 0.8,
    metalness: 0.85,
  });

  const pedestal = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 1.6), pedestalMat);
  pedestal.position.y = 0.28;
  group.add(pedestal);

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.62, 14, 12), orangeMat);
  body.scale.set(0.95, 1.15, 0.9);
  body.position.y = 1.12;
  group.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 12), orangeMat);
  head.position.set(0, 1.92, -0.04);
  group.add(head);

  for (const side of [-0.3, 0.3]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.34, 4), orangeMat);
    ear.position.set(side, 2.38, -0.02);
    ear.rotation.z = side > 0 ? -0.22 : 0.22;
    group.add(ear);
  }

  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), goldMat);
  bell.position.set(0, 1.54, -0.52);
  group.add(bell);

  // Raised beckoning paw!
  const paw = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.36, 4, 8), orangeMat);
  paw.position.set(0.46, 1.72, -0.26);
  paw.rotation.z = -0.35;
  group.add(paw);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 2.2),
    new THREE.MeshBasicMaterial({
      map: textures.contactShadow,
      transparent: true,
      depthWrite: false,
      opacity: 0.6,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  group.add(shadow);

  return group;
}

export function createRangedProjectileMesh(weaponId: RangedWeaponId, color: number): THREE.Mesh {
  if (weaponId === 'rpg') {
    const rocketGeo = new THREE.CylinderGeometry(0.11, 0.14, 0.72, 10);
    rocketGeo.rotateX(Math.PI / 2);
    const rocketMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xf97316,
      emissiveIntensity: 1.8,
      roughness: 0.25,
      metalness: 0.7,
    });
    return new THREE.Mesh(rocketGeo, rocketMat);
  }
  if (weaponId === 'smg') {
    const tracerGeo = new THREE.BoxGeometry(0.1, 0.1, 0.55);
    return new THREE.Mesh(tracerGeo, new THREE.MeshBasicMaterial({ color }));
  }
  if (weaponId === 'shotgun') {
    return new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 8, 8),
      new THREE.MeshBasicMaterial({ color })
    );
  }
  return new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 10, 10),
    new THREE.MeshBasicMaterial({ color })
  );
}

export function createTrafficVehicle(
  kind: TrafficRig['kind'],
  textures: ProceduralTextureSet,
  side: -1 | 1 = 1
): TrafficRig {
  const root = new THREE.Group();

  if (kind === 'sedan') {
    const sedanColors = [0x94a3b8, 0x1e3a8a, 0x7f1d1d, 0x1e293b];
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: sedanColors[Math.floor(Math.random() * sedanColors.length)],
      roughness: 0.22,
      metalness: 0.65,
      clearcoat: 0.9,
    });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.08, metalness: 0.8 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.88 });

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.62, 4.15), bodyMat);
    chassis.position.y = 0.62;
    chassis.castShadow = true;
    root.add(chassis);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.54, 0.52, 2.05), bodyMat);
    cabin.position.set(0, 1.15, 0.12);
    cabin.castShadow = true;
    root.add(cabin);

    const windows = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.36, 1.88), glassMat);
    windows.position.set(0, 1.14, 0.12);
    root.add(windows);

    const tailMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 2.2,
    });
    for (const sx of [-0.66, 0.66]) {
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.06), tailMat);
      tail.position.set(sx, 0.72, 2.08);
      root.add(tail);
    }

    const wheelGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.22, 14);
    wheelGeo.rotateZ(Math.PI / 2);
    for (const [wx, wz] of [
      [-0.86, -1.25],
      [0.86, -1.25],
      [-0.86, 1.25],
      [0.86, 1.25],
    ]) {
      const w = new THREE.Mesh(wheelGeo, tireMat);
      w.position.set(wx, 0.33, wz);
      root.add(w);
    }

    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.3, 4.6),
      new THREE.MeshBasicMaterial({ map: textures.contactShadow, transparent: true, depthWrite: false, opacity: 0.6 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    root.add(shadow);

    return { root, kind, halfWidth: 0.94, halfLength: 2.1, height: 1.45, isRamp: false };
  }

  if (kind === 'bus') {
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: 0xd97706,
      roughness: 0.34,
      metalness: 0.35,
      clearcoat: 0.55,
    });
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.45 });
    const winMat = new THREE.MeshBasicMaterial({ color: 0xfef3c7 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(2.26, 2.32, 6.2), bodyMat);
    body.position.y = 1.62;
    body.castShadow = true;
    root.add(body);

    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.36, 6.24), stripeMat);
    stripe.position.y = 1.05;
    root.add(stripe);

    const sideWins = new THREE.Mesh(new THREE.BoxGeometry(2.31, 0.72, 5.2), winMat);
    sideWins.position.set(0, 2.05, 0.15);
    root.add(sideWins);

    const tailMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 2.2,
    });
    for (const sx of [-0.82, 0.82]) {
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.08), tailMat);
      tail.position.set(sx, 0.85, 3.12);
      root.add(tail);
    }

    const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.32, 14);
    wheelGeo.rotateZ(Math.PI / 2);
    for (const [wx, wz] of [
      [-1.08, -1.95],
      [1.08, -1.95],
      [-1.08, 1.95],
      [1.08, 1.95],
    ]) {
      const w = new THREE.Mesh(wheelGeo, tireMat);
      w.position.set(wx, 0.45, wz);
      root.add(w);
    }

    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(3.0, 6.9),
      new THREE.MeshBasicMaterial({ map: textures.contactShadow, transparent: true, depthWrite: false, opacity: 0.68 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    root.add(shadow);

    return { root, kind, halfWidth: 1.18, halfLength: 3.15, height: 2.8, isRamp: false };
  }

  if (kind === 'angkot') {
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      roughness: 0.32,
      metalness: 0.38,
      clearcoat: 0.65,
    });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.72 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.88 });

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.0, 3.85), bodyMat);
    chassis.position.y = 0.82;
    chassis.castShadow = true;
    root.add(chassis);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.65, 3.22), roofMat);
    cabin.position.set(0, 1.62, 0.05);
    cabin.castShadow = true;
    root.add(cabin);

    const rack = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.08, 2.2), tireMat);
    rack.position.set(0, 1.98, 0.08);
    root.add(rack);

    const windows = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.44, 2.9), glassMat);
    windows.position.set(0, 1.6, 0.02);
    root.add(windows);

    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(1.79, 0.18, 3.87),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.45 })
    );
    stripe.position.y = 0.88;
    root.add(stripe);

    const tailMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 1.8,
    });
    for (const sx of [-0.65, 0.65]) {
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.08), tailMat);
      tail.position.set(sx, 0.75, 1.93);
      root.add(tail);
    }

    const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.24, 14);
    wheelGeo.rotateZ(Math.PI / 2);
    for (const [wx, wz] of [
      [-0.86, -1.15],
      [0.86, -1.15],
      [-0.86, 1.15],
      [0.86, 1.15],
    ]) {
      const w = new THREE.Mesh(wheelGeo, tireMat);
      w.position.set(wx, 0.34, wz);
      root.add(w);
    }

    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 4.4),
      new THREE.MeshBasicMaterial({ map: textures.contactShadow, transparent: true, depthWrite: false, opacity: 0.6 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    root.add(shadow);

    return { root, kind, halfWidth: 0.95, halfLength: 1.95, height: 1.95, isRamp: false };
  }

  if (kind === 'truck') {
    const cabMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.36, metalness: 0.38 });
    const boxMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.65, metalness: 0.12 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });

    const cargo = new THREE.Mesh(new THREE.BoxGeometry(2.15, 2.0, 4.4), boxMat);
    cargo.position.set(0, 1.65, 0.65);
    cargo.castShadow = true;
    root.add(cargo);

    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.95, 1.55, 1.65), cabMat);
    cab.position.set(0, 1.25, -2.35);
    cab.castShadow = true;
    root.add(cab);

    const rearWarning = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.28, 0.06),
      new THREE.MeshStandardMaterial({ map: textures.hazardStripe, roughness: 0.5 })
    );
    rearWarning.position.set(0, 0.72, 2.86);
    root.add(rearWarning);

    const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 14);
    wheelGeo.rotateZ(Math.PI / 2);
    for (const [wx, wz] of [
      [-1.0, -2.1],
      [1.0, -2.1],
      [-1.0, 1.6],
      [1.0, 1.6],
    ]) {
      const w = new THREE.Mesh(wheelGeo, tireMat);
      w.position.set(wx, 0.42, wz);
      root.add(w);
    }

    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.8, 6.4),
      new THREE.MeshBasicMaterial({ map: textures.contactShadow, transparent: true, depthWrite: false, opacity: 0.65 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    root.add(shadow);

    return { root, kind, halfWidth: 1.15, halfLength: 2.9, height: 2.7, isRamp: false };
  }

  if (kind === 'ramp') {
    const rampMat = new THREE.MeshStandardMaterial({
      map: textures.hazardStripe,
      roughness: 0.45,
      metalness: 0.25,
    });
    const rampShape = new THREE.Shape();
    rampShape.moveTo(0, 0);
    rampShape.lineTo(3.2, 0);
    rampShape.lineTo(3.2, 0.85);
    rampShape.closePath();

    const geo = new THREE.ExtrudeGeometry(rampShape, {
      depth: 2.1,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 1,
    });
    geo.center();
    geo.rotateY(Math.PI / 2);
    const rampMesh = new THREE.Mesh(geo, rampMat);
    rampMesh.position.y = 0.44;
    rampMesh.castShadow = true;
    root.add(rampMesh);

    const beacon = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 0.12, 0.14),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xfacc15, emissiveIntensity: 1.6 })
    );
    beacon.position.set(0, 0.86, -1.55);
    root.add(beacon);

    return { root, kind, halfWidth: 1.05, halfLength: 1.65, height: 0.9, isRamp: true };
  }

  if (kind === 'begal_barricade') {
    const ironMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.48,
      metalness: 0.78,
    });
    const drumMat = new THREE.MeshStandardMaterial({
      color: 0x7f1d1d,
      roughness: 0.55,
      metalness: 0.4,
    });
    const emberMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xef4444,
      emissiveIntensity: 2.8,
      roughness: 0.25,
    });
    const hazardMat = new THREE.MeshStandardMaterial({
      map: textures.hazardStripe,
      roughness: 0.5,
    });

    // Main Welded Crossbar & Armor Plank
    const beam = new THREE.Mesh(new THREE.BoxGeometry(2.68, 0.52, 0.28), hazardMat);
    beam.position.set(0, 0.66, 0);
    beam.castShadow = true;
    root.add(beam);

    // Lower Steel Tire-Spike Rail
    const spikeRail = new THREE.Mesh(new THREE.BoxGeometry(2.74, 0.14, 0.52), ironMat);
    spikeRail.position.set(0, 0.1, 0.12);
    root.add(spikeRail);

    // Jagged Welded Steel Spikes Along Top & Front
    const spikeGeo = new THREE.ConeGeometry(0.08, 0.34, 5);
    for (let sx = -1.1; sx <= 1.11; sx += 0.36) {
      const topSpike = new THREE.Mesh(spikeGeo, emberMat);
      topSpike.position.set(sx, 1.02, 0);
      root.add(topSpike);

      const frontSpike = new THREE.Mesh(spikeGeo, ironMat);
      frontSpike.rotation.x = Math.PI * 0.4;
      frontSpike.position.set(sx, 0.22, 0.35);
      root.add(frontSpike);
    }

    // Flank Burning Gang Oil Drums
    for (const dx of [-1.24, 1.24]) {
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.34, 0.92, 12), drumMat);
      drum.position.set(dx, 0.46, 0);
      drum.castShadow = true;
      root.add(drum);

      const fireCore = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 0), emberMat);
      fireCore.position.set(dx, 1.04, 0);
      root.add(fireCore);
    }

    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(3.3, 1.4),
      new THREE.MeshBasicMaterial({
        map: textures.contactShadow,
        transparent: true,
        depthWrite: false,
        opacity: 0.65,
      })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    root.add(shadow);

    return {
      root,
      kind: 'begal_barricade',
      halfWidth: 1.48,
      halfLength: 0.55,
      height: 1.12,
      isRamp: false,
    };
  }

  if (kind === 'pasar_malam') {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.75, roughness: 0.35 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x7c4a24, roughness: 0.8 });
    const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.55 });
    const blueMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.55 });
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 });

    // Striped Tent Canopy (3 colorful tarpaulin panels)
    const stripeMats = [redMat, yellowMat, blueMat, redMat];
    stripeMats.forEach((mat, idx) => {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.1, 1.12), mat);
      strip.position.set(0, 2.38, -1.68 + idx * 1.12);
      strip.rotation.z = side * 0.08;
      strip.castShadow = true;
      root.add(strip);
    });

    // 4 Corner Steel Tent Poles
    for (const [px, pz] of [
      [-1.22, -2.15],
      [1.22, -2.15],
      [-1.22, 2.15],
      [1.22, 2.15],
    ]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 2.35, 8), poleMat);
      pole.position.set(px, 1.18, pz);
      root.add(pole);
    }

    // Wooden Display Counter & Stacked Wares
    const table = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.85, 3.85), woodMat);
    table.position.set(side * 0.12, 0.43, 0);
    table.castShadow = true;
    root.add(table);

    const crateColors = [0xf97316, 0x22c55e, 0xec4899, 0x38bdf8, 0xfacc15];
    for (let i = 0; i < 5; i++) {
      const crate = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.34, 0.58),
        new THREE.MeshStandardMaterial({ color: crateColors[i], roughness: 0.55 })
      );
      crate.position.set(side * 0.08, 1.02, -1.4 + i * 0.7);
      root.add(crate);
    }

    // Vendor Silhouette Behind Counter
    const vendorTorso = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.18, 0.42, 4, 8),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.7 })
    );
    vendorTorso.position.set(side * 0.82, 1.18, 0.25);
    root.add(vendorTorso);

    const vendorHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.55 })
    );
    vendorHead.position.set(side * 0.82, 1.62, 0.25);
    root.add(vendorHead);

    // Festive Night Market Bulb String Along Street-Facing Eave
    const stringBulbs: THREE.Mesh[] = [];
    const bulbCols = [0xfacc15, 0xf43f5e, 0x22d3ee, 0x4ade80, 0xf97316, 0xfacc15];
    for (let i = 0; i < bulbCols.length; i++) {
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        new THREE.MeshBasicMaterial({ color: bulbCols[i] })
      );
      bulb.position.set(-side * 1.24, 2.26, -1.85 + i * 0.74);
      root.add(bulb);
      stringBulbs.push(bulb);
    }

    // Glowing Orange Market Marker Cone on Road-Facing Corner
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.24, 0.62, 10),
      new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 0.75 })
    );
    cone.position.set(-side * 1.2, 0.31, 2.15);
    root.add(cone);

    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 5.1),
      new THREE.MeshBasicMaterial({ map: textures.contactShadow, transparent: true, depthWrite: false, opacity: 0.62 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    root.add(shadow);

    return {
      root,
      kind,
      halfWidth: 1.4,
      halfLength: 2.32,
      height: 2.45,
      isRamp: false,
      stringBulbs,
    };
  }

  if (kind === 'tukang_parkir') {
    const carColors = [0xf8fafc, 0x94a3b8, 0x0f766e, 0x1d4ed8];
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: carColors[Math.floor(Math.random() * carColors.length)],
      roughness: 0.24,
      metalness: 0.58,
      clearcoat: 0.85,
    });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.8 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.88 });

    // Exiting Car Group Angled Outward From Roadside Parking Toward Active Lane
    const carGroup = new THREE.Group();
    carGroup.rotation.y = side * 0.24;
    root.add(carGroup);

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.62, 4.05), bodyMat);
    chassis.position.y = 0.62;
    chassis.castShadow = true;
    carGroup.add(chassis);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.54, 0.52, 2.0), bodyMat);
    cabin.position.set(0, 1.15, 0.1);
    cabin.castShadow = true;
    carGroup.add(cabin);

    const windows = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.36, 1.82), glassMat);
    windows.position.set(0, 1.14, 0.1);
    carGroup.add(windows);

    // Bright Headlights + Reverse/Hazard Blinkers
    const hazardLights: THREE.Mesh[] = [];
    for (const [hx, hz] of [
      [-0.7, 2.04],
      [0.7, 2.04],
      [-0.7, -2.04],
      [0.7, -2.04],
    ]) {
      const hazardMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.14, 0.08), hazardMat);
      lamp.position.set(hx, 0.72, hz);
      carGroup.add(lamp);
      hazardLights.push(lamp);
    }

    const wheelGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.22, 14);
    wheelGeo.rotateZ(Math.PI / 2);
    for (const [wx, wz] of [
      [-0.86, -1.2],
      [0.86, -1.2],
      [-0.86, 1.2],
      [0.86, 1.2],
    ]) {
      const w = new THREE.Mesh(wheelGeo, tireMat);
      w.position.set(wx, 0.33, wz);
      carGroup.add(w);
    }

    const carShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 4.5),
      new THREE.MeshBasicMaterial({ map: textures.contactShadow, transparent: true, depthWrite: false, opacity: 0.6 })
    );
    carShadow.rotation.x = -Math.PI / 2;
    carShadow.position.y = 0.02;
    carGroup.add(carShadow);

    // Tukang Parkir Attendant Standing on Curb Waving Glowing Baton!
    const attendantGroup = new THREE.Group();
    attendantGroup.position.set(side * 1.45, 0, 1.4);
    root.add(attendantGroup);

    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.82 });
    const vestMat = new THREE.MeshStandardMaterial({
      color: 0xa3e635,
      emissive: 0x65a30d,
      emissiveIntensity: 0.95,
      roughness: 0.35,
    });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.55 });
    const capMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.65 });

    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.82, 0.24), pantsMat);
    legs.position.y = 0.41;
    attendantGroup.add(legs);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.66, 0.3), vestMat);
    torso.position.y = 1.15;
    attendantGroup.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 10), skinMat);
    head.position.y = 1.68;
    attendantGroup.add(head);

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.19, 0.1, 10), capMat);
    cap.position.y = 1.8;
    attendantGroup.add(cap);

    const batonArm = new THREE.Group();
    batonArm.position.set(-side * 0.28, 1.38, 0);
    attendantGroup.add(batonArm);

    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.32, 4, 8), vestMat);
    sleeve.position.set(-side * 0.12, 0.16, 0);
    sleeve.rotation.z = side * 0.55;
    batonArm.add(sleeve);

    const baton = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.042, 0.64, 8),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    baton.position.set(-side * 0.24, 0.46, 0);
    baton.rotation.z = side * 0.35;
    batonArm.add(baton);

    return {
      root,
      kind,
      halfWidth: 1.0,
      halfLength: 2.05,
      height: 1.48,
      isRamp: false,
      attendantGroup,
      batonArm,
      hazardLights,
    };
  }

  if (kind === 'pesepeda') {
    const animatedWheels: THREE.Object3D[] = [];
    const frameColors = [0x0ea5e9, 0x22c55e];
    const jerseyColors = [0x38bdf8, 0xf97316];
    const helmetColors = [0xf8fafc, 0xfacc15];
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.25 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.55 });
    const shortsMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8 });
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const headLampMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

    const offsets: Array<[number, number]> = [
      [-side * 0.22, -1.15],
      [side * 0.24, 1.15],
    ];

    offsets.forEach(([ox, oz], idx) => {
      const bike = new THREE.Group();
      bike.position.set(ox, 0, oz);
      root.add(bike);

      const frameMat = new THREE.MeshStandardMaterial({
        color: frameColors[idx],
        roughness: 0.3,
        metalness: 0.65,
      });
      const jerseyMat = new THREE.MeshStandardMaterial({
        color: jerseyColors[idx],
        emissive: jerseyColors[idx],
        emissiveIntensity: 0.3,
        roughness: 0.55,
      });

      // Bicycle Front & Rear Wheels
      for (const wz of [-0.52, 0.52]) {
        const wGroup = new THREE.Group();
        wGroup.position.set(0, 0.34, wz);
        const tire = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.036, 8, 20), tireMat);
        tire.rotation.y = Math.PI / 2;
        wGroup.add(tire);

        const spokeA = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.58, 0.018), rimMat);
        const spokeB = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, 0.58), rimMat);
        wGroup.add(spokeA, spokeB);
        bike.add(wGroup);
        animatedWheels.push(wGroup);
      }

      // Slim Bicycle Diamond Frame + Handlebar
      const topTube = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.72, 6), frameMat);
      topTube.rotation.x = Math.PI / 2;
      topTube.position.set(0, 0.68, 0);
      bike.add(topTube);

      const downTube = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.76, 6), frameMat);
      downTube.rotation.x = Math.PI / 3.1;
      downTube.position.set(0, 0.5, -0.14);
      bike.add(downTube);

      const seatTube = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.58, 6), frameMat);
      seatTube.position.set(0, 0.58, 0.24);
      seatTube.rotation.x = -0.22;
      bike.add(seatTube);

      const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.62, 6), frameMat);
      fork.position.set(0, 0.58, -0.44);
      fork.rotation.x = -0.25;
      bike.add(fork);

      const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.52, 6), rimMat);
      handlebar.rotation.z = Math.PI / 2;
      handlebar.position.set(0, 0.88, -0.4);
      bike.add(handlebar);

      // Night Visibility Lights on Bicycle
      const tailLight = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), tailMat);
      tailLight.position.set(0, 0.68, 0.52);
      bike.add(tailLight);

      const frontLight = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), headLampMat);
      frontLight.position.set(0, 0.86, -0.46);
      bike.add(frontLight);

      // Cyclist Rider Leaning Forward
      const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.24), shortsMat);
      pelvis.position.set(0, 0.92, 0.22);
      bike.add(pelvis);

      for (const lx of [-0.11, 0.11]) {
        const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.42, 4, 8), skinMat);
        leg.position.set(lx, 0.62, 0.12);
        leg.rotation.x = lx > 0 ? 0.35 : -0.35;
        bike.add(leg);
      }

      const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.38, 4, 8), jerseyMat);
      torso.position.set(0, 1.24, 0.04);
      torso.rotation.x = 0.58;
      bike.add(torso);

      for (const ax of [-0.18, 0.18]) {
        const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.42, 4, 8), jerseyMat);
        arm.position.set(ax, 1.12, -0.22);
        arm.rotation.x = 0.95;
        bike.add(arm);
      }

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), skinMat);
      head.position.set(0, 1.54, -0.14);
      bike.add(head);

      const helmet = new THREE.Mesh(
        new THREE.SphereGeometry(0.155, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.6),
        new THREE.MeshStandardMaterial({ color: helmetColors[idx], roughness: 0.35 })
      );
      helmet.position.set(0, 1.57, -0.15);
      bike.add(helmet);
    });

    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 4.2),
      new THREE.MeshBasicMaterial({ map: textures.contactShadow, transparent: true, depthWrite: false, opacity: 0.52 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    root.add(shadow);

    return {
      root,
      kind,
      halfWidth: 0.72,
      halfLength: 1.95,
      height: 1.65,
      isRamp: false,
      animatedWheels,
    };
  }

  const barrierMat = new THREE.MeshStandardMaterial({
    map: textures.hazardStripe,
    roughness: 0.55,
  });
  const barrier = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.78, 0.65), barrierMat);
  barrier.position.y = 0.39;
  barrier.castShadow = true;
  root.add(barrier);

  const lightMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xef4444,
    emissiveIntensity: 2.0,
  });
  for (const bx of [-0.9, 0.9]) {
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), lightMat);
    bulb.position.set(bx, 0.86, 0);
    root.add(bulb);
  }

  return { root, kind: 'barrier', halfWidth: 1.25, halfLength: 0.4, height: 0.85, isRamp: false };
}

export function createRoadSegment(segmentLength: number, textures: ProceduralTextureSet): THREE.Group {
  const seg = new THREE.Group();

  // Main Wet Asphalt Surface
  const roadGeo = new THREE.PlaneGeometry(14.2, segmentLength);
  roadGeo.rotateX(-Math.PI / 2);
  const roadMat = new THREE.MeshStandardMaterial({
    map: textures.roadAlbedo,
    roughnessMap: textures.roadRoughness,
    roughness: 0.64,
    metalness: 0.14,
  });
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.receiveShadow = true;
  seg.add(road);

  // Glowing Cat-Eye Road Reflector Studs along center yellow divider
  const studMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const studGeo = new THREE.BoxGeometry(0.14, 0.03, 0.22);
  for (let sz = -segmentLength * 0.45; sz <= segmentLength * 0.45; sz += 10) {
    const stud = new THREE.Mesh(studGeo, studMat);
    stud.position.set(0, 0.02, sz);
    seg.add(stud);
  }

  // City Urban Ground Skirt
  const groundGeo = new THREE.PlaneGeometry(220, segmentLength);
  groundGeo.rotateX(-Math.PI / 2);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x0d1118,
    roughness: 0.95,
    metalness: 0.0,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.position.y = -0.05;
  seg.add(ground);

  // Curbs + Sidewalks
  const curbGeo = new THREE.BoxGeometry(0.55, 0.24, segmentLength);
  const curbMat = new THREE.MeshStandardMaterial({ map: textures.curbAlbedo, roughness: 0.68 });
  const sidewalkGeo = new THREE.BoxGeometry(5.0, 0.18, segmentLength);
  const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x222731, roughness: 0.85 });

  for (const side of [-1, 1]) {
    const curb = new THREE.Mesh(curbGeo, curbMat);
    curb.position.set(side * 7.35, 0.1, 0);
    seg.add(curb);

    const walk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
    walk.position.set(side * 10.1, 0.07, 0);
    seg.add(walk);
  }

  // Sodium Streetlights + Light Pools + Guard Posts
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x52525b, roughness: 0.45, metalness: 0.8 });
  const lampBulbMat = new THREE.MeshStandardMaterial({
    color: 0xfde68a,
    emissive: 0xf59e0b,
    emissiveIntensity: 2.8,
  });
  const poolMat = new THREE.MeshBasicMaterial({
    color: 0xf59e0b,
    transparent: true,
    opacity: 0.085,
    depthWrite: false,
  });

  for (const zOff of [-segmentLength * 0.25, segmentLength * 0.25]) {
    for (const side of [-1, 1]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 6.6, 8), poleMat);
      pole.position.set(side * 7.8, 3.3, zOff);
      seg.add(pole);

      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.1, 0.1), poleMat);
      arm.position.set(side * 6.9, 6.5, zOff);
      seg.add(arm);

      const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.26), lampBulbMat);
      bulb.position.set(side * 6.1, 6.42, zOff);
      seg.add(bulb);

      const lightPool = new THREE.Mesh(new THREE.CircleGeometry(4.0, 16), poolMat);
      lightPool.rotation.x = -Math.PI / 2;
      lightPool.position.set(side * 5.2, 0.025, zOff);
      seg.add(lightPool);
    }
  }

  // Overhead Highway Sign Gantry on every 3rd segment feel (deterministic ~35% chance)
  if (Math.random() < 0.36) {
    for (const side of [-7.7, 7.7]) {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 7.6, 8), poleMat);
      pillar.position.set(side, 3.8, 0);
      seg.add(pillar);
    }
    const truss = new THREE.Mesh(new THREE.BoxGeometry(15.8, 0.36, 0.36), poleMat);
    truss.position.set(0, 7.4, 0);
    seg.add(truss);

    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(8.2, 1.9, 0.14),
      new THREE.MeshStandardMaterial({
        map: textures.gantrySign,
        emissive: 0x064e3b,
        emissiveIntensity: 0.35,
        roughness: 0.4,
      })
    );
    signBoard.position.set(0, 7.1, 0.2);
    seg.add(signBoard);
  }

  // Roadside Neon Baliho Billboard
  if (Math.random() < 0.5) {
    const bSide = Math.random() < 0.5 ? -1 : 1;
    const bPost = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 5.4, 8), poleMat);
    bPost.position.set(bSide * 10.6, 2.7, -segmentLength * 0.18);
    seg.add(bPost);

    const bPanel = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 2.1, 0.16),
      new THREE.MeshStandardMaterial({
        map: textures.billboardSign,
        emissive: 0x1e293b,
        emissiveIntensity: 0.65,
        roughness: 0.35,
      })
    );
    bPanel.position.set(bSide * 10.6, 5.2, -segmentLength * 0.18);
    bPanel.rotation.y = bSide * -0.45;
    seg.add(bPanel);
  }

  // Multi-Tier Indonesian Rukos + Rooftop Details + Distant City Skyline Towers
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3f2e21, roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.8 });
  const parapetMat = new THREE.MeshStandardMaterial({ color: 0x181c24, roughness: 0.7 });
  const skylineMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.6,
    metalness: 0.3,
  });
  const skyWinMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

  for (const side of [-1, 1]) {
    // 3 Roadside Ruko Shop-Houses per side
    for (let i = 0; i < 3; i++) {
      const zPos = -segmentLength * 0.34 + i * (segmentLength * 0.33);
      const facadeTex =
        textures.buildingFacades[Math.floor(Math.random() * textures.buildingFacades.length)];
      const h = 8.2 + Math.random() * 6.2;
      const w = 7.4 + Math.random() * 2.5;
      const d = 14 + Math.random() * 3.5;

      const bldgMat = new THREE.MeshStandardMaterial({
        map: facadeTex,
        roughness: 0.75,
        metalness: 0.12,
      });
      const bx = side * (16.2 + w * 0.35);
      const bldg = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bldgMat);
      bldg.position.set(bx, h * 0.5, zPos);
      seg.add(bldg);

      // Rooftop Concrete Cap + AC unit silhouette
      const cap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.35, 0.36, d + 0.35), parapetMat);
      cap.position.set(bx, h + 0.18, zPos);
      seg.add(cap);
    }

    // Distant High-Rise City Skyline Towers behind the Rukos
    for (let k = 0; k < 2; k++) {
      const towerH = 24 + Math.random() * 24;
      const towerW = 10 + Math.random() * 6;
      const towerD = 12 + Math.random() * 6;
      const tx = side * (32 + Math.random() * 14);
      const tz = -segmentLength * 0.25 + k * (segmentLength * 0.5);

      const tower = new THREE.Mesh(new THREE.BoxGeometry(towerW, towerH, towerD), skylineMat);
      tower.position.set(tx, towerH * 0.5, tz);
      seg.add(tower);

      // Glowing Skyline Crown Strip
      const crown = new THREE.Mesh(
        new THREE.BoxGeometry(towerW + 0.2, 0.35, towerD + 0.2),
        skyWinMat
      );
      crown.position.set(tx, towerH - 1.2, tz);
      seg.add(crown);
    }

    // Lush Tropical Street Trees
    for (const tz of [-segmentLength * 0.42, 0, segmentLength * 0.42]) {
      const tree = new THREE.Group();
      tree.position.set(side * 10.9, 0, tz);

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 3.0, 7), trunkMat);
      trunk.position.y = 1.5;
      tree.add(trunk);

      const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(1.55, 0), leafMat);
      crown.position.y = 3.4;
      crown.scale.set(1.15, 0.85, 1.15);
      tree.add(crown);

      seg.add(tree);
    }
  }

  return seg;
}
