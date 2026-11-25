import * as THREE from 'three';

export interface ProceduralTextureSet {
  roadAlbedo: THREE.CanvasTexture;
  roadRoughness: THREE.CanvasTexture;
  curbAlbedo: THREE.CanvasTexture;
  buildingFacades: THREE.CanvasTexture[];
  gantrySign: THREE.CanvasTexture;
  billboardSign: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  hazardStripe: THREE.CanvasTexture;
  dispose: () => void;
}

export function createProceduralTextures(maxAnisotropy: number): ProceduralTextureSet {
  const aniso = Math.min(8, Math.max(1, maxAnisotropy));

  // 1. Indonesian 4-Lane Asphalt Road (High-res 512x1024 SRGB Albedo)
  const roadCanvas = document.createElement('canvas');
  roadCanvas.width = 512;
  roadCanvas.height = 1024;
  const rCtx = roadCanvas.getContext('2d')!;

  rCtx.fillStyle = '#181c24';
  rCtx.fillRect(0, 0, 512, 1024);

  // Fine asphalt mineral aggregate & micro-cracks
  for (let i = 0; i < 12000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 1024;
    const v = 20 + Math.floor(Math.random() * 26);
    rCtx.fillStyle = `rgb(${v},${v + 2},${v + 6})`;
    rCtx.fillRect(x, y, 2, 2);
  }

  // Subtle dark rubber tire wear streaks per lane
  const laneCenters = [85, 192, 320, 427];
  for (const cx of laneCenters) {
    const grad = rCtx.createLinearGradient(cx - 34, 0, cx + 34, 0);
    grad.addColorStop(0, 'rgba(8,10,14,0)');
    grad.addColorStop(0.5, 'rgba(6,8,12,0.52)');
    grad.addColorStop(1, 'rgba(8,10,14,0)');
    rCtx.fillStyle = grad;
    rCtx.fillRect(cx - 34, 0, 68, 1024);
  }

  // Gutter asphalt darker border
  rCtx.fillStyle = '#101318';
  rCtx.fillRect(0, 0, 14, 1024);
  rCtx.fillRect(498, 0, 14, 1024);

  // Crisp outer solid white shoulder lines
  rCtx.fillStyle = '#e2e8f0';
  rCtx.fillRect(16, 0, 7, 1024);
  rCtx.fillRect(489, 0, 7, 1024);

  // Double amber-yellow Indonesian arterial center divider lines
  rCtx.fillStyle = '#facc15';
  rCtx.fillRect(248, 0, 5, 1024);
  rCtx.fillRect(259, 0, 5, 1024);

  // Dashed lane lines with reflective road studs
  for (let y = 24; y < 1024; y += 128) {
    rCtx.fillStyle = '#cbd5e1';
    rCtx.fillRect(136, y, 6, 68);
    rCtx.fillRect(370, y, 6, 68);

    // Subtle yellow cat-eye marker beside center line
    rCtx.fillStyle = '#fef08a';
    rCtx.fillRect(253, y + 20, 6, 8);
  }

  const roadAlbedo = new THREE.CanvasTexture(roadCanvas);
  roadAlbedo.colorSpace = THREE.SRGBColorSpace;
  roadAlbedo.wrapS = THREE.ClampToEdgeWrapping;
  roadAlbedo.wrapT = THREE.RepeatWrapping;
  roadAlbedo.repeat.set(1, 2);
  roadAlbedo.anisotropy = aniso;

  // 2. Road Roughness Map (wet night rain puddles reflect street lamps & neon)
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = 256;
  roughCanvas.height = 512;
  const rgCtx = roughCanvas.getContext('2d')!;
  rgCtx.fillStyle = '#c4c4c4';
  rgCtx.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 28; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 512;
    const rad = 16 + Math.random() * 44;
    const g = rgCtx.createRadialGradient(x, y, 2, x, y, rad);
    g.addColorStop(0, 'rgba(38,38,38,0.78)');
    g.addColorStop(1, 'rgba(200,200,200,0)');
    rgCtx.fillStyle = g;
    rgCtx.beginPath();
    rgCtx.arc(x, y, rad, 0, Math.PI * 2);
    rgCtx.fill();
  }
  const roadRoughness = new THREE.CanvasTexture(roughCanvas);
  roadRoughness.wrapS = THREE.ClampToEdgeWrapping;
  roadRoughness.wrapT = THREE.RepeatWrapping;
  roadRoughness.repeat.set(1, 2);
  roadRoughness.anisotropy = aniso;

  // 3. Indonesian Black & Yellow / White Curb Texture
  const curbCanvas = document.createElement('canvas');
  curbCanvas.width = 128;
  curbCanvas.height = 256;
  const cCtx = curbCanvas.getContext('2d')!;
  for (let y = 0; y < 256; y += 64) {
    cCtx.fillStyle = (y / 64) % 2 === 0 ? '#facc15' : '#18181b';
    cCtx.fillRect(0, y, 128, 64);
  }
  const curbAlbedo = new THREE.CanvasTexture(curbCanvas);
  curbAlbedo.colorSpace = THREE.SRGBColorSpace;
  curbAlbedo.wrapS = THREE.RepeatWrapping;
  curbAlbedo.wrapT = THREE.RepeatWrapping;
  curbAlbedo.repeat.set(1, 12);
  curbAlbedo.anisotropy = aniso;

  // 4. Rich Multi-Shop Ruko / Convenience Mart / Street Facades (5 distinct Indonesian themes)
  const buildingFacades: THREE.CanvasTexture[] = [];
  const facadeThemes = [
    { wall: '#232834', sign: '#f59e0b', text: 'WARTEG BAHARI 24J', accent: '#ef4444', lit: '#fde68a' },
    { wall: '#1d272b', sign: '#10b981', text: 'BENGKEL BALAP', accent: '#facc15', lit: '#bbf7d0' },
    { wall: '#2a2228', sign: '#ef4444', text: 'KOPI MALAM JAYA', accent: '#fef08a', lit: '#fecaca' },
    { wall: '#1f2937', sign: '#0284c7', text: 'MART 24 JAM', accent: '#facc15', lit: '#bae6fd' },
    { wall: '#272433', sign: '#eab308', text: 'DISTRO & HELM', accent: '#38bdf8', lit: '#fef08a' },
  ];

  for (const theme of facadeThemes) {
    const bCanvas = document.createElement('canvas');
    bCanvas.width = 256;
    bCanvas.height = 512;
    const bCtx = bCanvas.getContext('2d')!;

    bCtx.fillStyle = theme.wall;
    bCtx.fillRect(0, 0, 256, 512);

    // Concrete floor slabs
    bCtx.fillStyle = '#11151d';
    bCtx.fillRect(0, 145, 256, 8);
    bCtx.fillRect(0, 290, 256, 8);

    // Floor 2 & 3 apartment/ruko windows
    for (const fy of [28, 175]) {
      for (let wx = 24; wx < 220; wx += 74) {
        const isLit = Math.random() > 0.35;
        bCtx.fillStyle = isLit ? theme.lit : '#0f172a';
        bCtx.fillRect(wx, fy, 46, 86);
        bCtx.strokeStyle = '#090d14';
        bCtx.lineWidth = 4;
        bCtx.strokeRect(wx, fy, 46, 86);
        bCtx.fillStyle = '#0f172a';
        bCtx.fillRect(wx, fy + 40, 46, 4);
      }
    }

    // Glowing shop awning / signboard
    bCtx.fillStyle = theme.sign;
    bCtx.fillRect(10, 314, 236, 42);
    bCtx.fillStyle = '#09090b';
    bCtx.font = 'bold 18px sans-serif';
    bCtx.textAlign = 'center';
    bCtx.textBaseline = 'middle';
    bCtx.fillText(theme.text, 128, 335);

    // Ground floor open glass storefront or shutter
    bCtx.fillStyle = '#14171f';
    bCtx.fillRect(18, 368, 220, 140);
    bCtx.fillStyle = theme.accent;
    bCtx.fillRect(18, 362, 220, 6);
    bCtx.fillStyle = 'rgba(253, 224, 71, 0.22)';
    bCtx.fillRect(28, 382, 92, 118);
    bCtx.fillStyle = '#27272a';
    for (let sy = 382; sy < 504; sy += 12) {
      bCtx.fillRect(132, sy, 98, 4);
    }

    const tex = new THREE.CanvasTexture(bCanvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = aniso;
    buildingFacades.push(tex);
  }

  // 5. Indonesian Highway Green Overhead Gantry Signboard
  const gCanvas = document.createElement('canvas');
  gCanvas.width = 512;
  gCanvas.height = 128;
  const gCtx = gCanvas.getContext('2d')!;
  gCtx.fillStyle = '#065f46';
  gCtx.fillRect(0, 0, 512, 128);
  gCtx.strokeStyle = '#f8fafc';
  gCtx.lineWidth = 6;
  gCtx.strokeRect(8, 8, 496, 112);
  gCtx.fillStyle = '#f8fafc';
  gCtx.font = 'bold 28px sans-serif';
  gCtx.textAlign = 'center';
  gCtx.fillText('SUDIRMAN  ·  KOTA TUA  ·  PANTURA ↑', 256, 54);
  gCtx.fillStyle = '#facc15';
  gCtx.font = 'bold 20px sans-serif';
  gCtx.fillText('ZONA RAWAN BEGAL — WASPADA & GAS TERUS', 256, 94);
  const gantrySign = new THREE.CanvasTexture(gCanvas);
  gantrySign.colorSpace = THREE.SRGBColorSpace;
  gantrySign.anisotropy = aniso;

  // 6. Roadside Neon Baliho Billboard Texture
  const blCanvas = document.createElement('canvas');
  blCanvas.width = 256;
  blCanvas.height = 128;
  const blCtx = blCanvas.getContext('2d')!;
  blCtx.fillStyle = '#0f172a';
  blCtx.fillRect(0, 0, 256, 128);
  blCtx.strokeStyle = '#facc15';
  blCtx.lineWidth = 5;
  blCtx.strokeRect(4, 4, 248, 120);
  blCtx.fillStyle = '#facc15';
  blCtx.font = 'bold 24px sans-serif';
  blCtx.textAlign = 'center';
  blCtx.fillText('AJIVA MOTOR', 128, 50);
  blCtx.fillStyle = '#38bdf8';
  blCtx.font = 'bold 16px sans-serif';
  blCtx.fillText('SERVICE · TUNE UP · NOS', 128, 88);
  const billboardSign = new THREE.CanvasTexture(blCanvas);
  billboardSign.colorSpace = THREE.SRGBColorSpace;
  billboardSign.anisotropy = aniso;

  // 7. Radial Contact Shadow Texture
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const sCtx = shadowCanvas.getContext('2d')!;
  const sGrad = sCtx.createRadialGradient(64, 64, 6, 64, 64, 60);
  sGrad.addColorStop(0, 'rgba(0,0,0,0.88)');
  sGrad.addColorStop(0.55, 'rgba(0,0,0,0.45)');
  sGrad.addColorStop(1, 'rgba(0,0,0,0)');
  sCtx.fillStyle = sGrad;
  sCtx.fillRect(0, 0, 128, 128);
  const contactShadow = new THREE.CanvasTexture(shadowCanvas);

  // 8. Hazard Stripe Texture
  const hazCanvas = document.createElement('canvas');
  hazCanvas.width = 128;
  hazCanvas.height = 128;
  const hCtx = hazCanvas.getContext('2d')!;
  hCtx.fillStyle = '#facc15';
  hCtx.fillRect(0, 0, 128, 128);
  hCtx.fillStyle = '#18181b';
  for (let i = -128; i < 256; i += 32) {
    hCtx.beginPath();
    hCtx.moveTo(i, 0);
    hCtx.lineTo(i + 16, 0);
    hCtx.lineTo(i - 48, 128);
    hCtx.lineTo(i - 64, 128);
    hCtx.closePath();
    hCtx.fill();
  }
  const hazardStripe = new THREE.CanvasTexture(hazCanvas);
  hazardStripe.colorSpace = THREE.SRGBColorSpace;
  hazardStripe.wrapS = THREE.RepeatWrapping;
  hazardStripe.wrapT = THREE.RepeatWrapping;
  hazardStripe.anisotropy = aniso;

  return {
    roadAlbedo,
    roadRoughness,
    curbAlbedo,
    buildingFacades,
    gantrySign,
    billboardSign,
    contactShadow,
    hazardStripe,
    dispose: () => {
      roadAlbedo.dispose();
      roadRoughness.dispose();
      curbAlbedo.dispose();
      buildingFacades.forEach((t) => t.dispose());
      gantrySign.dispose();
      billboardSign.dispose();
      contactShadow.dispose();
      hazardStripe.dispose();
    },
  };
}
