/**
 * 🔥 불멍 (BULMEONG) — Immersive 3D Campfire Sanctuary
 *
 * - Focused 100% on pure Campfire meditation (Inner Peace)
 * - No cluttered 3D floating text tags over logs or heads; clean center notifications only when needed
 * - Large, expressive 3D character with articulated legs & arms
 * - Immersive Over-the-Shoulder / 1st-Person POV looking directly into the crackling fire
 * - Custom GLSL Volumetric Shader flames + rising 3D embers + stacked physical logs
 * - Natural smooth procedural animations for warming hands, placing logs, roasting marshmallows, pouring thermos coffee, and two-handed sharing
 * - Honest real-time online user count (optional AI companion toggleable)
 */

// ====================================================
// 1. IDENTITY & STATE
// ====================================================
const ADJECTIVES = [
  '고요한', '따스한', '평온한', '은은한', '차분한',
  '깊어가는', '별빛 닮은', '솔향기 나는', '포근한', '잔잔한'
];

const NOUNS = [
  '모닥불', '솔방울', '장작불', '불씨', '통나무',
  '산들바람', '보온병', '산장지기', '풀벌레', '여행자'
];

const CAMPER_COLORS = [
  '#d96b43', '#5c8072', '#dfa84b', '#6ba2b8',
  '#a66e7a', '#e08748', '#7fa660', '#8c7aa8'
];

function generateRandomNickname() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj} ${noun}`;
}

const urlParams = new URLSearchParams(window.location.search);
const state = {
  clientId: sessionStorage.getItem('bm_clientId') || `camper_${Math.random().toString(36).slice(2, 9)}`,
  myNickname: localStorage.getItem('bm_nickname') || generateRandomNickname(),
  myColor: sessionStorage.getItem('bm_color') || CAMPER_COLORS[Math.floor(Math.random() * CAMPER_COLORS.length)],
  room: urlParams.get('room') === 'rain-04' ? 'rain-04' : 'fire-01',
  instance: Number(urlParams.get('instance') || 0),
  region: urlParams.get('region') || 'apac',
  mySeatIndex: 0,
  myAction: 'hands', // 'hands' | 'mallow' | 'coffee' | 'sparkler' | 'idle'
  povMode: 'shoulder', // 'shoulder' (내 어깨 너머 몰입) | 'first' (1인칭 불꽃 직관) | 'wide' (전체 둘러보기)
  enableSoloCompanion: false, // Honest real user count by default!
  fireHeat: 720,
  logsAddedCount: 0,
  auroraUntil: 0,
  enteredAt: Date.now(),
  zenMode: false,
  realUsers: [],
  users: [],
  pendingGiftOffer: null
};

sessionStorage.setItem('bm_clientId', state.clientId);
sessionStorage.setItem('bm_color', state.myColor);

function syncUrlParams() {
  const url = new URL(window.location.href);
  url.searchParams.set('room', state.room);
  url.searchParams.set('instance', String(state.instance));
  url.searchParams.set('region', state.region);
  window.history.replaceState({}, '', url.toString());
}
syncUrlParams();

// ====================================================
// 2. CENTER NOTIFICATION HELPER (CLEAN & UNOBTRUSIVE)
// ====================================================
let noticeTimer = null;
function showCenterNotice(message, durationMs = 2800) {
  const el = document.getElementById('centerNotice');
  const txt = document.getElementById('centerNoticeText');
  if (!el || !txt) return;
  txt.textContent = message;
  el.classList.remove('hidden');
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => {
    el.classList.add('hidden');
  }, durationMs);
}

// ====================================================
// 3. WEB AUDIO ASMR ENGINE (CRACKLING OAK FIRE & WIND)
// ====================================================
class CampfireAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.volumes = { fire: 0.85, wind: 0.4, rain: 0.0, night: 0.5 };
    this.nodes = {};
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.9;
    this.masterGain.connect(this.ctx.destination);

    const bufferSize = this.ctx.sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.2;
    }

    // 1. Deep Warm Hearth Rumble
    const fireRumble = this.ctx.createBufferSource();
    fireRumble.buffer = noiseBuffer;
    fireRumble.loop = true;
    const fireFilter = this.ctx.createBiquadFilter();
    fireFilter.type = 'lowpass';
    fireFilter.frequency.value = 165;
    this.nodes.fireGain = this.ctx.createGain();
    this.nodes.fireGain.gain.value = this.volumes.fire * 0.42;
    fireRumble.connect(fireFilter);
    fireFilter.connect(this.nodes.fireGain);
    this.nodes.fireGain.connect(this.masterGain);
    fireRumble.start();

    // 2. Pine Forest Night Breeze
    const windSource = this.ctx.createBufferSource();
    windSource.buffer = noiseBuffer;
    windSource.loop = true;
    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 320;
    windFilter.Q.value = 4.2;
    this.nodes.windFilter = windFilter;
    this.nodes.windGain = this.ctx.createGain();
    this.nodes.windGain.gain.value = this.volumes.wind * 0.24;
    windSource.connect(windFilter);
    windFilter.connect(this.nodes.windGain);
    this.nodes.windGain.connect(this.masterGain);
    windSource.start();

    // 3. Rain
    const rainSource = this.ctx.createBufferSource();
    rainSource.buffer = noiseBuffer;
    rainSource.loop = true;
    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'bandpass';
    rainFilter.frequency.value = 1050;
    rainFilter.Q.value = 0.85;
    this.nodes.rainGain = this.ctx.createGain();
    this.nodes.rainGain.gain.value = this.volumes.rain * 0.35;
    rainSource.connect(rainFilter);
    rainFilter.connect(this.nodes.rainGain);
    this.nodes.rainGain.connect(this.masterGain);
    rainSource.start();

    setInterval(() => this.triggerCrackleAndNight(), 110);
  }

  triggerCrackleAndNight() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    if (this.nodes.windFilter) {
      this.nodes.windFilter.frequency.setTargetAtTime(250 + Math.sin(now * 0.3) * 90, now, 0.3);
    }

    // Crisp Oak Firewood Pop & Crackle
    if (this.volumes.fire > 0.02 && Math.random() < 0.36) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1350 + Math.random() * 2000;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(170 + Math.random() * 550, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.035);
      const amp = (0.03 + Math.random() * 0.055) * this.volumes.fire;
      gain.gain.setValueAtTime(amp, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.042);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.045);
    }

    // Distant Night Cricket
    if (this.volumes.night > 0.05 && Math.random() < 0.07) {
      const cOsc = this.ctx.createOscillator();
      const cGain = this.ctx.createGain();
      cOsc.type = 'sine';
      cOsc.frequency.setValueAtTime(3850 + Math.random() * 180, now);
      const cAmp = 0.009 * this.volumes.night;
      cGain.gain.setValueAtTime(0.0001, now);
      cGain.gain.linearRampToValueAtTime(cAmp, now + 0.02);
      cGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
      cOsc.connect(cGain);
      cGain.connect(this.masterGain);
      cOsc.start(now);
      cOsc.stop(now + 0.14);
    }
  }

  playWoodThud() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(135, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.14);
    gain.gain.setValueAtTime(0.18 * this.volumes.fire, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  playWarmBell() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(432, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.05, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 3.3);
  }

  setVolume(channel, val0to100) {
    const v = Math.max(0, Math.min(100, val0to100)) / 100;
    this.volumes[channel] = v;
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (channel === 'fire' && this.nodes.fireGain) this.nodes.fireGain.gain.setTargetAtTime(v * 0.42, now, 0.1);
    if (channel === 'wind' && this.nodes.windGain) this.nodes.windGain.gain.setTargetAtTime(v * 0.24, now, 0.1);
    if (channel === 'rain' && this.nodes.rainGain) this.nodes.rainGain.gain.setTargetAtTime(v * 0.35, now, 0.1);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.9, this.ctx.currentTime, 0.1);
    }
    return this.isMuted;
  }
}

const soundEngine = new CampfireAudioEngine();

// ====================================================
// 4. THREE.JS 3D CAMPFIRE SANCTUARY (SHADER FLAMES & CLOSE POV)
// ====================================================
const canvas = document.getElementById('campfireCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x09070c);
scene.fog = new THREE.FogExp2(0x09070c, 0.022);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 160);

// Smooth Camera Controller (Supports Over-the-Shoulder 1st-Person Feel + Free Orbit)
const camControl = {
  orbitOffset: 0.0, // User drag offset around the fire
  pitchOffset: 0.0,
  zoomOffset: 0.0,
  currentPos: new THREE.Vector3(0, 2.3, 6.2),
  currentLookAt: new THREE.Vector3(0, 1.05, 0),
  isDragging: false,
  dragMoved: false,
  lastX: 0,
  lastY: 0
};

// Lighting
const hemiLight = new THREE.HemisphereLight(0x282238, 0x140d08, 0.45);
scene.add(hemiLight);

const fireLight = new THREE.PointLight(0xff7722, 3.6, 24, 1.4);
fireLight.position.set(0, 1.5, 0);
fireLight.castShadow = true;
fireLight.shadow.mapSize.width = 1024;
fireLight.shadow.mapSize.height = 1024;
fireLight.shadow.bias = -0.001;
scene.add(fireLight);

const emberGlowLight = new THREE.PointLight(0xff3b00, 1.8, 9, 1.8);
emberGlowLight.position.set(0, 0.35, 0);
scene.add(emberGlowLight);

// Ground Clearing
const groundMat = new THREE.MeshStandardMaterial({ color: 0x16110e, roughness: 0.96, metalness: 0.02 });
const groundMesh = new THREE.Mesh(new THREE.CircleGeometry(65, 64), groundMat);
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

// Subtle Starry Night Sky Dome
const starsGeo = new THREE.BufferGeometry();
const starCount = 900;
const starPos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  const r = 65 + Math.random() * 25;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.random() * Math.PI * 0.42;
  starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
  starPos[i * 3 + 1] = r * Math.cos(phi) + 4;
  starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
}
starsGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
const starsMat = new THREE.PointsMaterial({ color: 0xffebd6, size: 0.35, transparent: true, opacity: 0.65 });
const starField = new THREE.Points(starsGeo, starsMat);
scene.add(starField);

// ====================================================
// 4A. DETAILED 3D CAMPFIRE HEARTH & CUSTOM GLSL SHADER FLAMES
// ====================================================
const hearthGroup = new THREE.Group();
scene.add(hearthGroup);

// Stone Ring
const stoneMat = new THREE.MeshStandardMaterial({ color: 0x3b3532, roughness: 0.92 });
for (let i = 0; i < 18; i++) {
  const a = (i / 18) * Math.PI * 2;
  const sGeo = new THREE.DodecahedronGeometry(0.28 + (i % 3) * 0.05, 1);
  const stone = new THREE.Mesh(sGeo, stoneMat);
  stone.position.set(Math.cos(a) * 1.55, 0.14, Math.sin(a) * 1.55);
  stone.scale.set(1.1, 0.68, 1.0);
  stone.rotation.y = a;
  stone.castShadow = true;
  stone.receiveShadow = true;
  hearthGroup.add(stone);
}

// Glowing Charcoal & Ash Bed
const emberBedMat = new THREE.MeshStandardMaterial({
  color: 0x2a1108,
  emissive: 0xff3d00,
  emissiveIntensity: 1.35,
  roughness: 0.85
});
const emberBed = new THREE.Mesh(new THREE.CylinderGeometry(1.32, 1.45, 0.18, 24), emberBedMat);
emberBed.position.y = 0.09;
hearthGroup.add(emberBed);

// Base Firewood Logs (Detailed Bark + Glowing Inner Core)
const barkMat = new THREE.MeshStandardMaterial({
  color: 0x3e2414,
  roughness: 0.92,
  emissive: 0x4a1200,
  emissiveIntensity: 0.35
});
const dynamicLogsGroup = new THREE.Group();
hearthGroup.add(dynamicLogsGroup);

function createFirewoodLogMesh(length = 2.1, radius = 0.14) {
  const logGroup = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.92, radius, length, 12), barkMat);
  body.castShadow = true;
  body.receiveShadow = true;
  logGroup.add(body);
  return logGroup;
}

for (let i = 0; i < 7; i++) {
  const a = (i / 7) * Math.PI * 2;
  const log = createFirewoodLogMesh(2.15, 0.14);
  log.position.set(Math.cos(a) * 0.32, 0.34, Math.sin(a) * 0.32);
  log.rotation.z = Math.cos(a) * 0.56;
  log.rotation.x = Math.sin(a) * 0.56;
  hearthGroup.add(log);
}

// Custom GLSL Volumetric Shader Flame Layers (Organic, Hypnotic Dancing Fire)
const flameVertexShader = `
  uniform float uTime;
  uniform float uSeed;
  uniform float uHeatScale;
  varying vec2 vUv;
  varying float vHeight;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float h = clamp((pos.y + 0.5) / 2.2, 0.0, 1.0);
    vHeight = h;

    // Organic wind sway & turbulent lick at higher altitudes
    float swayX = sin(uTime * 3.8 + h * 4.5 + uSeed) * 0.18 * pow(h, 1.3);
    float swayZ = cos(uTime * 3.2 + h * 4.0 + uSeed * 1.7) * 0.18 * pow(h, 1.3);
    float pinch = 1.0 - 0.35 * sin(uTime * 5.5 + h * 6.0 + uSeed) * h;

    pos.x = pos.x * pinch + swayX;
    pos.z = pos.z * pinch + swayZ;
    pos.y *= uHeatScale;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const flameFragmentShader = `
  uniform vec3 uColorCore;
  uniform vec3 uColorMid;
  uniform vec3 uColorTip;
  uniform float uOpacity;
  varying vec2 vUv;
  varying float vHeight;

  void main() {
    vec3 col = mix(uColorCore, uColorMid, smoothstep(0.0, 0.55, vHeight));
    col = mix(col, uColorTip, smoothstep(0.5, 1.0, vHeight));
    float alpha = (1.0 - smoothstep(0.65, 1.0, vHeight)) * uOpacity;
    gl_FragColor = vec4(col, alpha);
  }
`;

const shaderFlames = [];
for (let i = 0; i < 16; i++) {
  const radius = 0.52 - (i / 16) * 0.28;
  const height = 1.55 + (i % 4) * 0.48;
  const geo = new THREE.ConeGeometry(radius, height, 16, 18, false);
  geo.translate(0, height * 0.42, 0);

  const uniforms = {
    uTime: { value: 0 },
    uSeed: { value: i * 1.37 },
    uHeatScale: { value: 1.0 },
    uColorCore: { value: new THREE.Color(0xfff7cc) },
    uColorMid: { value: new THREE.Color(0xff8811) },
    uColorTip: { value: new THREE.Color(0xd92600) },
    uOpacity: { value: 0.48 - (i / 16) * 0.18 }
  };

  const mat = new THREE.ShaderMaterial({
    vertexShader: flameVertexShader,
    fragmentShader: flameFragmentShader,
    uniforms,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geo, mat);
  const a = (i / 16) * Math.PI * 2;
  const r = (i % 3) * 0.16;
  mesh.position.set(Math.cos(a) * r, 0.18, Math.sin(a) * r);
  hearthGroup.add(mesh);
  shaderFlames.push(mesh);
}

// Rising 3D Sparks / Embers Particle System
const EMBER_COUNT = 85;
const emberMeshes = [];
const emberMatBase = new THREE.MeshBasicMaterial({
  color: 0xffae42,
  transparent: true,
  opacity: 0.9,
  blending: THREE.AdditiveBlending
});

for (let i = 0; i < EMBER_COUNT; i++) {
  const sp = new THREE.Mesh(new THREE.SphereGeometry(0.024 + Math.random() * 0.02, 6, 6), emberMatBase.clone());
  resetEmberParticle(sp, true);
  hearthGroup.add(sp);
  emberMeshes.push(sp);
}

function resetEmberParticle(sp, randomY = false) {
  const a = Math.random() * Math.PI * 2;
  const r = Math.random() * 0.85;
  sp.position.set(Math.cos(a) * r, randomY ? Math.random() * 4.5 : 0.35, Math.sin(a) * r);
  sp.userData = {
    vy: 0.65 + Math.random() * 1.1,
    swaySpeed: 1.5 + Math.random() * 2.5,
    swayAmp: 0.004 + Math.random() * 0.008,
    phase: Math.random() * Math.PI * 2,
    maxY: 3.2 + Math.random() * 2.8
  };
}

// Surrounding Pine Trees (Placed outside radius 14.5 so they NEVER block the camera!)
const trunkMat = new THREE.MeshStandardMaterial({ color: 0x261911, roughness: 0.95 });
const pineLeafMat = new THREE.MeshStandardMaterial({ color: 0x13221a, roughness: 0.88 });
for (let i = 0; i < 40; i++) {
  const tree = new THREE.Group();
  const a = (i / 40) * Math.PI * 2 + (Math.random() - 0.5) * 0.06;
  const dist = 15.0 + Math.random() * 16;
  const s = 0.9 + Math.random() * 0.75;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * s, 0.32 * s, 2.2 * s, 7), trunkMat);
  trunk.position.y = 1.1 * s;
  tree.add(trunk);
  for (let l = 0; l < 3; l++) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry((1.8 - l * 0.4) * s, (2.6 - l * 0.3) * s, 7), pineLeafMat);
    cone.position.y = (2.3 + l * 1.35) * s;
    tree.add(cone);
  }
  tree.position.set(Math.cos(a) * dist, 0, Math.sin(a) * dist);
  scene.add(tree);
}

// ====================================================
// 5. LOG SEATS AROUND THE CAMPFIRE (CLOSE & COZY, NO FLOATING TEXT!)
// ====================================================
const MAX_SEATS = 12;
const SEAT_RADIUS = 3.55; // Closer to the fire so character feels warm & intimate!
const seats = [];
const seatClickMeshes = [];

const logSeatMat = new THREE.MeshStandardMaterial({ color: 0x3d2617, roughness: 0.88 });
const logEndMat = new THREE.MeshStandardMaterial({ color: 0x7a5438, roughness: 0.82 });

for (let i = 0; i < MAX_SEATS; i++) {
  const angle = (i / MAX_SEATS) * Math.PI * 2;
  const x = Math.cos(angle) * SEAT_RADIUS;
  const z = Math.sin(angle) * SEAT_RADIUS;
  const lookAngle = angle + Math.PI; // Faces center(0,0,0)

  const seatGroup = new THREE.Group();
  seatGroup.position.set(x, 0, z);
  seatGroup.rotation.y = -angle + Math.PI / 2;
  scene.add(seatGroup);

  const bench = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 1.45, 14), logSeatMat);
  bench.rotation.z = Math.PI / 2;
  bench.position.y = 0.34;
  bench.castShadow = true;
  bench.receiveShadow = true;
  seatGroup.add(bench);

  // Wood rings at ends of log
  const capL = new THREE.Mesh(new THREE.CircleGeometry(0.33, 14), logEndMat);
  capL.rotation.y = -Math.PI / 2;
  capL.position.set(-0.726, 0.34, 0);
  const capR = new THREE.Mesh(new THREE.CircleGeometry(0.33, 14), logEndMat);
  capR.rotation.y = Math.PI / 2;
  capR.position.set(0.726, 0.34, 0);
  seatGroup.add(capL, capR);

  const hitMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.55, 0.9, 1.1),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitMesh.position.y = 0.42;
  hitMesh.userData = { seatIndex: i };
  seatGroup.add(hitMesh);
  seatClickMeshes.push(hitMesh);

  seats.push({ index: i, group: seatGroup, bench, x, z, angle, lookAngle });
}

// ====================================================
// 6. LARGE, EXPRESSIVE 3D CAMPER CHARACTER (SMOOTH PROCEDURAL RIG)
// ====================================================
const camperMeshes = new Map();
const camperHitMeshes = [];

function createCamper3D(user) {
  const group = new THREE.Group();
  // Scale character up by 1.28x so they look prominent, warm, and tangible like the original design!
  group.scale.setScalar(1.28);

  const bodyRoot = new THREE.Group();
  group.add(bodyRoot);

  const coatColor = new THREE.Color(user.color || '#d96b43');
  const coatMat = new THREE.MeshStandardMaterial({ color: coatColor, roughness: 0.72 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x262c36, roughness: 0.85 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x3b2416, roughness: 0.88 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdfc4, roughness: 0.62 });

  // Articulated Legs (Thigh + Knee + Calf + Camping Boots)
  function buildLeg(sideSign) {
    const hipPivot = new THREE.Group();
    hipPivot.position.set(sideSign * 0.16, 0.48, 0);

    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.095, 0.4, 10), pantsMat);
    thigh.position.set(0, -0.18, 0);
    thigh.castShadow = true;
    hipPivot.add(thigh);

    const kneePivot = new THREE.Group();
    kneePivot.position.set(0, -0.36, 0);
    hipPivot.add(kneePivot);

    const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.075, 0.36, 10), pantsMat);
    calf.position.set(0, -0.17, 0);
    calf.castShadow = true;
    kneePivot.add(calf);

    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.11, 0.25), bootMat);
    boot.position.set(0, -0.34, 0.05);
    boot.castShadow = true;
    kneePivot.add(boot);

    return { hipPivot, kneePivot };
  }

  const leftLeg = buildLeg(-1);
  const rightLeg = buildLeg(1);
  bodyRoot.add(leftLeg.hipPivot, rightLeg.hipPivot);

  // Cozy Rounded Cloak/Coat Torso
  const torsoPivot = new THREE.Group();
  torsoPivot.position.set(0, 0.48, 0);
  bodyRoot.add(torsoPivot);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.36, 0.76, 16), coatMat);
  torso.position.y = 0.38;
  torso.castShadow = true;
  torso.receiveShadow = true;
  torsoPivot.add(torso);

  // Knit Scarf
  const scarf = new THREE.Mesh(
    new THREE.TorusGeometry(0.215, 0.068, 10, 18),
    new THREE.MeshStandardMaterial({ color: 0xf2e4c9, roughness: 0.85 })
  );
  scarf.rotation.x = Math.PI / 2;
  scarf.position.y = 0.76;
  torsoPivot.add(scarf);

  // Head + Warm Beanie Hat
  const headGroup = new THREE.Group();
  headGroup.position.y = 0.98;
  torsoPivot.add(headGroup);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.255, 18, 18), skinMat);
  head.castShadow = true;
  headGroup.add(head);

  const beanieMat = new THREE.MeshStandardMaterial({
    color: coatColor.clone().multiplyScalar(0.62),
    roughness: 0.9
  });
  const beanie = new THREE.Mesh(
    new THREE.SphereGeometry(0.27, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.58),
    beanieMat
  );
  beanie.position.y = 0.02;
  beanie.rotation.x = -0.12;
  headGroup.add(beanie);

  const pomPom = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 10), beanieMat);
  pomPom.position.set(0, 0.29, -0.04);
  headGroup.add(pomPom);

  // Articulated Arms (Shoulder + Upper Arm + Forearm + Hand)
  function buildArm(sideSign) {
    const shoulder = new THREE.Group();
    shoulder.position.set(sideSign * 0.27, 0.68, 0.04);

    const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.058, 0.38, 10), coatMat);
    upperArm.rotation.x = Math.PI / 2;
    upperArm.position.set(0, -0.02, 0.18);
    upperArm.castShadow = true;
    shoulder.add(upperArm);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.076, 12, 12), skinMat);
    hand.position.set(0, -0.02, 0.4);
    hand.castShadow = true;
    shoulder.add(hand);

    return { shoulder, hand };
  }

  const leftArm = buildArm(-1);
  const rightArm = buildArm(1);
  torsoPivot.add(leftArm.shoulder, rightArm.shoulder);

  // --- PROPS ATTACHED TO CHARACTER ---
  // 1. Firewood Log held in both hands (when placing a log onto the fire)
  const heldLogMesh = createFirewoodLogMesh(0.85, 0.11);
  heldLogMesh.rotation.z = Math.PI / 2;
  heldLogMesh.position.set(0, 0.52, 0.48);
  heldLogMesh.visible = false;
  torsoPivot.add(heldLogMesh);

  // 2. Marshmallow Skewers (Reaches right near the flames)
  const mallowGroup = new THREE.Group();
  const skewer = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.95, 8),
    new THREE.MeshStandardMaterial({ color: 0xd8a47f })
  );
  skewer.rotation.x = Math.PI / 2;
  skewer.position.z = 0.46;
  mallowGroup.add(skewer);

  const mallowMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.082, 0.082, 0.15, 14),
    new THREE.MeshStandardMaterial({ color: 0xfffdf9, roughness: 0.45 })
  );
  mallowMesh.rotation.x = Math.PI / 2;
  mallowMesh.position.z = 0.94;
  mallowGroup.add(mallowMesh);
  mallowGroup.position.set(0.16, 0.56, 0.34);
  mallowGroup.visible = false;
  torsoPivot.add(mallowGroup);

  // 3. Thermos Flask & Steaming Coffee Mug
  const coffeeGroup = new THREE.Group();
  const mug = new THREE.Mesh(
    new THREE.CylinderGeometry(0.082, 0.072, 0.16, 14),
    new THREE.MeshStandardMaterial({ color: 0xf4eee1, roughness: 0.3 })
  );
  coffeeGroup.add(mug);
  const coffeeLiquid = new THREE.Mesh(
    new THREE.CircleGeometry(0.072, 12),
    new THREE.MeshBasicMaterial({ color: 0x3b2212 })
  );
  coffeeLiquid.rotation.x = -Math.PI / 2;
  coffeeLiquid.position.y = 0.072;
  coffeeGroup.add(coffeeLiquid);
  coffeeGroup.position.set(0, 0.56, 0.46);
  coffeeGroup.visible = false;
  torsoPivot.add(coffeeGroup);

  // Thermos sitting beside the camper's log
  const thermosMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.085, 0.34, 12),
    new THREE.MeshStandardMaterial({ color: 0x2f4f3e, metalness: 0.45, roughness: 0.38 })
  );
  thermosMesh.position.set(-0.56, 0.17, 0.12);
  thermosMesh.castShadow = true;
  group.add(thermosMesh);

  // 4. Sparkler (선향불꽃)
  const sparklerGroup = new THREE.Group();
  const spRod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.01, 0.72, 6),
    new THREE.MeshBasicMaterial({ color: 0xbbbbbb })
  );
  spRod.rotation.x = Math.PI / 2.15;
  spRod.position.z = 0.35;
  sparklerGroup.add(spRod);
  const spCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.065, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xffea79 })
  );
  spCore.position.set(0, -0.04, 0.7);
  sparklerGroup.add(spCore);
  sparklerGroup.position.set(-0.16, 0.56, 0.34);
  sparklerGroup.visible = false;
  torsoPivot.add(sparklerGroup);

  // Hitbox for clicking another camper
  const hitBox = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 1.8, 8),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitBox.position.y = 0.9;
  hitBox.userData = { camperId: user.id, seatIndex: user.seatIndex };
  group.add(hitBox);
  camperHitMeshes.push(hitBox);

  scene.add(group);

  return {
    id: user.id,
    group,
    bodyRoot,
    torsoPivot,
    headGroup,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    heldLogMesh,
    mallowGroup,
    mallowMesh,
    coffeeGroup,
    sparklerGroup,
    spCore,
    hitBox,
    seatIndex: user.seatIndex,
    action: user.action || 'hands',
    name: user.name,
    color: user.color,
    roastStartTime: Date.now(),
    nodUntil: 0,
    offeringUntil: 0,
    offeringGiftType: 'coffee',
    receivingUntil: 0,
    placingLogState: null, // Smooth 3D walk-to-fire and place-log animation
    walkState: null,
    poseBlend: {
      torsoLean: 0.18,
      leftArmX: -0.45,
      leftArmY: 0.15,
      rightArmX: -0.45,
      rightArmY: -0.15,
      headX: 0.08
    }
  };
}

function syncCampers3D() {
  const activeIds = new Set();

  state.users.forEach((u) => {
    activeIds.add(u.id);
    let camper = camperMeshes.get(u.id);
    if (!camper) {
      camper = createCamper3D(u);
      camperMeshes.set(u.id, camper);
    }

    const prevSeat = camper.seatIndex;
    camper.seatIndex = u.seatIndex;
    camper.action = u.action || 'hands';
    camper.name = u.name;
    camper.hitBox.userData.seatIndex = u.seatIndex;

    const seat = seats[u.seatIndex] || seats[0];
    if (prevSeat !== u.seatIndex || (!camper.walkState && !camper.placingLogState && camper.group.position.lengthSq() < 0.01)) {
      camper.walkState = null;
      camper.group.position.set(seat.x, 0, seat.z);
      camper.group.rotation.y = seat.lookAngle;
    }
  });

  for (const [id, camper] of camperMeshes.entries()) {
    if (!activeIds.has(id)) {
      scene.remove(camper.group);
      const idx = camperHitMeshes.indexOf(camper.hitBox);
      if (idx !== -1) camperHitMeshes.splice(idx, 1);
      camperMeshes.delete(id);
    }
  }
}

// ====================================================
// 7. NATURAL 3D FIREWOOD PLACEMENT & SPARK BURST
// ====================================================
const activeEffects = [];

function triggerNaturalLogPlacement(fromSeatIndex) {
  let actor = null;
  for (const c of camperMeshes.values()) {
    if (c.seatIndex === fromSeatIndex) {
      actor = c;
      break;
    }
  }

  const seat = seats[fromSeatIndex] || seats[0];
  if (!actor) return;

  // Stand up with log in both hands, take a step toward the fire edge, lean down to place it gently, and sit back down
  const fireEdgeDist = 1.95;
  const targetX = Math.cos(seat.angle) * fireEdgeDist;
  const targetZ = Math.sin(seat.angle) * fireEdgeDist;

  actor.placingLogState = {
    phase: 'walkToFire',
    startTime: Date.now(),
    startX: seat.x,
    startZ: seat.z,
    targetX,
    targetZ,
    seatAngle: seat.angle,
    lookAngle: seat.lookAngle
  };
}

function addPhysicalLogToFire(angle) {
  // Keep up to 10 extra stacked logs on the fire so it visibly builds up
  if (dynamicLogsGroup.children.length >= 10) {
    const oldest = dynamicLogsGroup.children[0];
    dynamicLogsGroup.remove(oldest);
  }

  const newLog = createFirewoodLogMesh(1.9, 0.13);
  const r = 0.22 + Math.random() * 0.25;
  newLog.position.set(Math.cos(angle) * r, 0.42 + dynamicLogsGroup.children.length * 0.04, Math.sin(angle) * r);
  newLog.rotation.z = Math.cos(angle) * 0.48 + (Math.random() - 0.5) * 0.2;
  newLog.rotation.x = Math.sin(angle) * 0.48 + (Math.random() - 0.5) * 0.2;
  newLog.rotation.y = Math.random() * Math.PI;
  dynamicLogsGroup.add(newLog);

  soundEngine.playWoodThud();

  // Burst of golden embers when the log settles onto the coals
  for (let i = 0; i < 22; i++) {
    const sp = new THREE.Mesh(
      new THREE.SphereGeometry(0.032, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xffd269, transparent: true, opacity: 1, blending: THREE.AdditiveBlending })
    );
    sp.position.set((Math.random() - 0.5) * 0.7, 0.45, (Math.random() - 0.5) * 0.7);
    scene.add(sp);
    const vx = (Math.random() - 0.5) * 1.8;
    const vy = 1.6 + Math.random() * 2.2;
    const vz = (Math.random() - 0.5) * 1.8;
    const born = Date.now();
    activeEffects.push({
      update: (dt) => {
        const age = (Date.now() - born) / 1100;
        if (age >= 1) {
          scene.remove(sp);
          return false;
        }
        sp.position.x += vx * dt;
        sp.position.y += vy * dt;
        sp.position.z += vz * dt;
        sp.material.opacity = 1 - age;
        return true;
      }
    });
  }
}

// ====================================================
// 8. GENTLE TWO-HANDED COFFEE & MARSHMALLOW SHARING
// ====================================================
const giftOfferBanner = document.getElementById('giftOfferBanner');
const giftOfferIcon = document.getElementById('giftOfferIcon');
const giftOfferMessage = document.getElementById('giftOfferMessage');
const acceptGiftBtn = document.getElementById('acceptGiftBtn');
const declineGiftBtn = document.getElementById('declineGiftBtn');

function findNearestNeighborCamper(fromSeatIndex) {
  let best = null;
  let bestDist = Infinity;
  const mySeat = seats[fromSeatIndex] || seats[0];
  for (const c of camperMeshes.values()) {
    if (c.seatIndex === fromSeatIndex) continue;
    const s = seats[c.seatIndex] || seats[0];
    const d = Math.hypot(s.x - mySeat.x, s.z - mySeat.z);
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}

function animateWalkAndOfferGift(fromSeat, targetSeat, giftType = 'coffee', actorName = '캠퍼') {
  let giver = null;
  let receiver = null;
  for (const c of camperMeshes.values()) {
    if (c.seatIndex === fromSeat) giver = c;
    if (c.seatIndex === targetSeat) receiver = c;
  }
  if (!giver) return;

  const targetPosSeat = seats[targetSeat] || seats[0];
  const giverSeat = seats[fromSeat] || seats[0];

  const dx = giverSeat.x - targetPosSeat.x;
  const dz = giverSeat.z - targetPosSeat.z;
  const dist = Math.hypot(dx, dz) || 1;
  const standX = targetPosSeat.x + (dx / dist) * 1.15;
  const standZ = targetPosSeat.z + (dz / dist) * 1.15;

  giver.offeringGiftType = giftType;
  giver.walkState = {
    targetX: standX,
    targetZ: standZ,
    isWalking: true,
    onArrive: () => {
      giver.group.rotation.y = Math.atan2(targetPosSeat.x - standX, targetPosSeat.z - standZ);
      giver.offeringUntil = Date.now() + 6000;

      if (targetSeat === state.mySeatIndex && fromSeat !== state.mySeatIndex) {
        state.pendingGiftOffer = { fromSeat, giftType, actorName };
        giftOfferIcon.textContent = giftType === 'coffee' ? '☕' : '🍡';
        const itemLabel = giftType === 'coffee' ? '따뜻한 보온병 커피' : '노릇하게 구운 마시멜로';
        giftOfferMessage.innerHTML = `<strong>${actorName}</strong>님이 다가와 두 손으로 ${itemLabel}를 건넵니다.`;
        giftOfferBanner.classList.remove('hidden');
        soundEngine.playWarmBell();
      } else if (!receiver || receiver.id.startsWith('sim_')) {
        setTimeout(() => {
          completeGiftAcceptance(fromSeat, targetSeat, giftType);
        }, 1500);
      }
    }
  };
}

function completeGiftAcceptance(fromSeat, targetSeat, giftType = 'coffee') {
  let giver = null;
  let receiver = null;
  for (const c of camperMeshes.values()) {
    if (c.seatIndex === fromSeat) giver = c;
    if (c.seatIndex === targetSeat) receiver = c;
  }

  soundEngine.playWarmBell();

  if (receiver) {
    receiver.receivingUntil = Date.now() + 3200;
    receiver.nodUntil = Date.now() + 2200;
    receiver.action = giftType === 'coffee' ? 'coffee' : 'mallow';
  }

  if (giver) {
    giver.offeringUntil = 0;
    giver.nodUntil = Date.now() + 1800;
    const homeSeat = seats[giver.seatIndex] || seats[0];
    setTimeout(() => {
      if (!giver) return;
      giver.walkState = {
        targetX: homeSeat.x,
        targetZ: homeSeat.z,
        isWalking: true,
        onArrive: () => {
          giver.group.rotation.y = homeSeat.lookAngle;
          giver.walkState = null;
        }
      };
    }, 1000);
  }
}

acceptGiftBtn.addEventListener('click', () => {
  giftOfferBanner.classList.add('hidden');
  if (!state.pendingGiftOffer) return;
  const { fromSeat, giftType, actorName } = state.pendingGiftOffer;
  state.pendingGiftOffer = null;

  state.myAction = giftType === 'coffee' ? 'coffee' : 'mallow';
  updateDockActiveButtons();
  sendServerAction({ type: 'pose', action: state.myAction });
  sendServerAction({ type: 'acceptGift', fromSeat, giftType });
  completeGiftAcceptance(fromSeat, state.mySeatIndex, giftType);
  showCenterNotice(`${actorName}님의 따뜻한 마음을 두 손으로 받았습니다.`);
});

declineGiftBtn.addEventListener('click', () => {
  giftOfferBanner.classList.add('hidden');
  state.pendingGiftOffer = null;
});

// ====================================================
// 9. ACTION BUTTON HANDLERS
// ====================================================
function updateDockActiveButtons() {
  document.querySelectorAll('#dockActionsContainer .action-btn').forEach((btn) => {
    const act = btn.dataset.action;
    btn.classList.toggle('active-pose', act === state.myAction);
  });
}

document.querySelectorAll('#dockActionsContainer .action-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    triggerCampfireAction(btn.dataset.action);
  });
});

function triggerCampfireAction(actionId) {
  soundEngine.init();
  const myCamper = camperMeshes.get(state.clientId);

  switch (actionId) {
    case 'hands': {
      state.myAction = 'hands';
      updateDockActiveButtons();
      sendServerAction({ type: 'pose', action: 'hands' });
      showCenterNotice('모닥불 가까이 두 손을 뻗어 온기를 느낍니다.');
      break;
    }
    case 'log': {
      state.logsAddedCount++;
      state.fireHeat = Math.min(1200, state.fireHeat + 38);
      document.getElementById('logsCountDisplay').textContent = `${state.logsAddedCount}개`;
      document.getElementById('fireTempDisplay').textContent = `${state.fireHeat}°C`;

      triggerNaturalLogPlacement(state.mySeatIndex);
      sendServerAction({ type: 'throwLog' });
      showCenterNotice('장작을 들고 모닥불에 조심스레 얹었습니다.');
      break;
    }
    case 'mallow': {
      state.myAction = state.myAction === 'mallow' ? 'hands' : 'mallow';
      if (myCamper) myCamper.roastStartTime = Date.now();
      updateDockActiveButtons();
      sendServerAction({ type: 'pose', action: state.myAction });
      if (state.myAction === 'mallow') {
        showCenterNotice('불꽃 가까이 마시멜로를 노릇노릇하게 굽습니다.');
      }
      break;
    }
    case 'coffee': {
      state.myAction = state.myAction === 'coffee' ? 'hands' : 'coffee';
      updateDockActiveButtons();
      sendServerAction({ type: 'pose', action: state.myAction });
      if (state.myAction === 'coffee') {
        showCenterNotice('보온병에서 따뜻한 커피를 따라 두 손으로 감싸 쥠니다.');
      }
      break;
    }
    case 'give': {
      const neighbor = findNearestNeighborCamper(state.mySeatIndex);
      if (!neighbor) {
        // Temporarily enable quiet forest companion so solo user can still experience sharing if desired
        state.enableSoloCompanion = true;
        const toggleEl = document.getElementById('soloCompanionToggle');
        if (toggleEl) toggleEl.checked = true;
        rebuildActiveUsersList();
      }
      const target = findNearestNeighborCamper(state.mySeatIndex);
      if (target) {
        const giftType = state.myAction === 'mallow' ? 'mallow' : 'coffee';
        animateWalkAndOfferGift(state.mySeatIndex, target.seatIndex, giftType, state.myNickname);
        sendServerAction({ type: 'offerGift', targetSeat: target.seatIndex, giftType });
        showCenterNotice(
          giftType === 'coffee'
            ? `${target.name}님에게 다가가 따뜻한 커피를 두 손으로 건넵니다.`
            : `${target.name}님에게 다가가 구운 마시멜로를 두 손으로 건넵니다.`
        );
      }
      break;
    }
    case 'sparkler': {
      state.myAction = state.myAction === 'sparkler' ? 'hands' : 'sparkler';
      updateDockActiveButtons();
      sendServerAction({ type: 'pose', action: state.myAction });
      if (state.myAction === 'sparkler') {
        showCenterNotice('타닥타닥 잔잔하게 타오르는 선향불꽃을 바라봅니다.');
      }
      break;
    }
    case 'aurora': {
      state.auroraUntil = Date.now() + 14000;
      sendServerAction({ type: 'aurora' });
      soundEngine.playWarmBell();
      showCenterNotice('신비로운 오로라 불꽃 가루가 모닥불을 물들입니다.');
      break;
    }
    case 'worry': {
      document.getElementById('worryModal').classList.remove('hidden');
      break;
    }
  }
}

// ====================================================
// 10. MAIN ANIMATION LOOP (1ST-PERSON / OVER-THE-SHOULDER & SMOOTH RIG)
// ====================================================
const clock = new THREE.Clock();

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, clock.getDelta());
  const elapsed = clock.getElapsedTime();
  const now = Date.now();

  const mySeat = seats[state.mySeatIndex] || seats[0];
  const baseAngle = mySeat.angle + camControl.orbitOffset;

  // --- CAMERA POV CALCULATION (Focused on MY Character & the Fire!) ---
  const targetCamPos = new THREE.Vector3();
  const targetLookAt = new THREE.Vector3();

  if (state.povMode === 'first') {
    // True 1st-Person POV: Sitting right on my log looking directly into the crackling fire
    const r = Math.max(1.9, 2.75 + camControl.zoomOffset * 0.4);
    targetCamPos.set(
      Math.cos(baseAngle) * r,
      1.32 + camControl.pitchOffset * 0.8,
      Math.sin(baseAngle) * r
    );
    targetLookAt.set(0, 0.78, 0);
  } else if (state.povMode === 'shoulder') {
    // Close Over-the-Shoulder POV (Default): My character is large & clear in foreground, fire fills the center!
    const distBehind = Math.max(4.6, Math.min(9.5, 5.85 + camControl.zoomOffset));
    const shoulderSideAngle = baseAngle + 0.11; // Slight offset so character + fire are both framed
    targetCamPos.set(
      Math.cos(shoulderSideAngle) * distBehind,
      2.18 + camControl.pitchOffset * 1.4,
      Math.sin(shoulderSideAngle) * distBehind
    );
    targetLookAt.set(0, 0.96, 0);
  } else {
    // Wide Campfire Circle POV
    const distWide = Math.max(7.0, Math.min(13.5, 9.6 + camControl.zoomOffset));
    targetCamPos.set(
      Math.cos(baseAngle) * distWide,
      3.8 + camControl.pitchOffset * 1.8,
      Math.sin(baseAngle) * distWide
    );
    targetLookAt.set(0, 1.0, 0);
  }

  camControl.currentPos.lerp(targetCamPos, 0.08);
  camControl.currentLookAt.lerp(targetLookAt, 0.08);
  camera.position.copy(camControl.currentPos);
  camera.lookAt(camControl.currentLookAt);

  // --- ANIMATE VOLUMETRIC SHADER FLAMES & LIGHT ---
  const isAurora = now < state.auroraUntil;
  const heatScale = 0.88 + (state.fireHeat - 650) / 850;

  shaderFlames.forEach((mesh, idx) => {
    const u = mesh.material.uniforms;
    u.uTime.value = elapsed;
    u.uHeatScale.value = heatScale;

    if (isAurora) {
      u.uColorCore.value.setHex(0xd8fff8);
      u.uColorMid.value.setHex(idx % 2 === 0 ? 0x00d4aa : 0x8a5cf6);
      u.uColorTip.value.setHex(0x3b096c);
    } else {
      u.uColorCore.value.setHex(0xfff7cc);
      u.uColorMid.value.setHex(0xff8418);
      u.uColorTip.value.setHex(0xd92600);
    }
  });

  fireLight.color.setHex(isAurora ? 0x48e5c2 : 0xff7722);
  fireLight.intensity = (3.4 + Math.sin(elapsed * 8.2) * 0.28 + Math.cos(elapsed * 14.5) * 0.16) * heatScale;
  fireLight.position.x = Math.sin(elapsed * 5.0) * 0.08;
  fireLight.position.z = Math.cos(elapsed * 4.3) * 0.08;

  // --- ANIMATE RISING EMBERS ---
  emberMeshes.forEach((sp) => {
    const u = sp.userData;
    sp.position.y += u.vy * dt;
    sp.position.x += Math.sin(elapsed * u.swaySpeed + u.phase) * u.swayAmp;
    sp.position.z += Math.cos(elapsed * u.swaySpeed + u.phase) * u.swayAmp;
    const lifeRatio = sp.position.y / u.maxY;
    sp.material.opacity = Math.max(0, (1 - lifeRatio) * 0.9);
    if (sp.position.y >= u.maxY) {
      resetEmberParticle(sp, false);
    }
  });

  // --- ANIMATE 3D CAMPERS (SMOOTH INTERPOLATION FOR ALL ACTIONS) ---
  for (const camper of camperMeshes.values()) {
    // Hide my own head/torso only in strict 'first' POV if camera is very close
    camper.group.visible = !(camper.id === state.clientId && state.povMode === 'first');

    const isWalking = Boolean(camper.walkState && camper.walkState.isWalking);
    const isPlacingLog = Boolean(camper.placingLogState);
    const isOffering = now < camper.offeringUntil;
    const isReceiving = now < camper.receivingUntil;
    const isNodding = now < camper.nodUntil;

    let targetTorsoLean = 0.06;
    let targetLeftArmX = 0.28;
    let targetLeftArmY = 0.0;
    let targetRightArmX = 0.28;
    let targetRightArmY = 0.0;
    let targetHeadX = Math.sin(elapsed * 1.1) * 0.035;

    camper.heldLogMesh.visible = false;
    camper.mallowGroup.visible = false;
    camper.coffeeGroup.visible = false;
    camper.sparklerGroup.visible = false;

    // 1. Natural 3D Log Placement Sequence
    if (isPlacingLog) {
      const pls = camper.placingLogState;
      const stepElapsed = (now - pls.startTime) / 1000;

      if (pls.phase === 'walkToFire') {
        const t = Math.min(1, stepElapsed / 0.75);
        camper.group.position.x = lerp(pls.startX, pls.targetX, t);
        camper.group.position.z = lerp(pls.startZ, pls.targetZ, t);
        camper.group.rotation.y = pls.lookAngle;

        // Stand up & carry log with both hands
        camper.bodyRoot.position.y = lerp(0, 0.2, t);
        const swing = Math.sin(elapsed * 11) * 0.35;
        camper.leftLeg.hipPivot.rotation.set(swing, 0, 0);
        camper.leftLeg.kneePivot.rotation.set(Math.max(0, -swing * 0.5), 0, 0);
        camper.rightLeg.hipPivot.rotation.set(-swing, 0, 0);
        camper.rightLeg.kneePivot.rotation.set(Math.max(0, swing * 0.5), 0, 0);

        camper.heldLogMesh.visible = true;
        targetTorsoLean = 0.15;
        targetLeftArmX = -0.55;
        targetLeftArmY = 0.25;
        targetRightArmX = -0.55;
        targetRightArmY = -0.25;

        if (t >= 1) {
          pls.phase = 'kneelAndPlace';
          pls.startTime = now;
        }
      } else if (pls.phase === 'kneelAndPlace') {
        const t = Math.min(1, stepElapsed / 0.55);
        camper.heldLogMesh.visible = t < 0.75;
        targetTorsoLean = 0.58 * Math.sin(t * Math.PI);
        targetLeftArmX = -0.85;
        targetRightArmX = -0.85;

        if (t >= 1) {
          addPhysicalLogToFire(pls.seatAngle);
          pls.phase = 'returnToSeat';
          pls.startTime = now;
        }
      } else if (pls.phase === 'returnToSeat') {
        const t = Math.min(1, stepElapsed / 0.75);
        camper.group.position.x = lerp(pls.targetX, pls.startX, t);
        camper.group.position.z = lerp(pls.targetZ, pls.startZ, t);
        camper.bodyRoot.position.y = lerp(0.2, 0, t);

        const swing = Math.sin(elapsed * 11) * 0.3;
        camper.leftLeg.hipPivot.rotation.set(swing, 0, 0);
        camper.rightLeg.hipPivot.rotation.set(-swing, 0, 0);

        if (t >= 1) {
          camper.group.position.set(pls.startX, 0, pls.startZ);
          camper.group.rotation.y = pls.lookAngle;
          camper.placingLogState = null;
        }
      }
    } else if (isWalking) {
      // 2. Walking to another seat or neighbor
      const ws = camper.walkState;
      const dx = ws.targetX - camper.group.position.x;
      const dz = ws.targetZ - camper.group.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.07) {
        const step = Math.min(dist, 0.058);
        camper.group.position.x += (dx / dist) * step;
        camper.group.position.z += (dz / dist) * step;
        camper.group.rotation.y = Math.atan2(dx, dz);
      } else {
        camper.group.position.set(ws.targetX, 0, ws.targetZ);
        ws.isWalking = false;
        if (ws.onArrive) ws.onArrive();
      }

      camper.bodyRoot.position.y = lerp(camper.bodyRoot.position.y, 0.2, 0.15);
      const swing = Math.sin(elapsed * 9.5) * 0.45;
      camper.leftLeg.hipPivot.rotation.set(swing, 0, 0);
      camper.leftLeg.kneePivot.rotation.set(Math.max(0, -swing * 0.6), 0, 0);
      camper.rightLeg.hipPivot.rotation.set(-swing, 0, 0);
      camper.rightLeg.kneePivot.rotation.set(Math.max(0, swing * 0.6), 0, 0);
    } else {
      // 3. Seated on the Log Bench (Legs bent naturally at knees, boots resting on ground)
      camper.bodyRoot.position.y = lerp(camper.bodyRoot.position.y, 0.0, 0.12);
      camper.leftLeg.hipPivot.rotation.set(-Math.PI / 2 + 0.08, 0.07, 0);
      camper.leftLeg.kneePivot.rotation.set(Math.PI / 2 - 0.1, 0, 0);
      camper.rightLeg.hipPivot.rotation.set(-Math.PI / 2 + 0.08, -0.07, 0);
      camper.rightLeg.kneePivot.rotation.set(Math.PI / 2 - 0.1, 0, 0);

      if (isOffering) {
        camper.bodyRoot.position.y = 0.2;
        targetTorsoLean = 0.22;
        targetLeftArmX = -0.48;
        targetLeftArmY = 0.26;
        targetRightArmX = -0.48;
        targetRightArmY = -0.26;
        targetHeadX = 0.2;
        if (camper.offeringGiftType === 'coffee') camper.coffeeGroup.visible = true;
        else camper.mallowGroup.visible = true;
      } else if (isReceiving) {
        targetTorsoLean = 0.2;
        targetLeftArmX = -0.42;
        targetLeftArmY = 0.24;
        targetRightArmX = -0.42;
        targetRightArmY = -0.24;
        targetHeadX = Math.sin(elapsed * 6) * 0.18 + 0.18;
        camper.coffeeGroup.visible = (camper.action === 'coffee');
        camper.mallowGroup.visible = (camper.action === 'mallow');
      } else if (camper.action === 'hands') {
        // Leaning warmly toward the fire, rubbing/warming both hands
        targetTorsoLean = 0.22 + Math.sin(elapsed * 1.5) * 0.02;
        const rub = Math.sin(elapsed * 4.2) * 0.065;
        targetLeftArmX = -0.42 + rub;
        targetLeftArmY = 0.14;
        targetRightArmX = -0.42 - rub;
        targetRightArmY = -0.14;
        targetHeadX = 0.12;
      } else if (camper.action === 'mallow') {
        camper.mallowGroup.visible = true;
        targetTorsoLean = 0.24;
        targetRightArmX = -0.38 + Math.sin(elapsed * 2.4) * 0.035;
        targetRightArmY = -0.08;
        targetLeftArmX = 0.22;
        targetHeadX = 0.14;
        const roastRatio = Math.min(1, (now - camper.roastStartTime) / 11000);
        camper.mallowMesh.material.color.lerpColors(
          new THREE.Color(0xfffdf9),
          new THREE.Color(0xd68334),
          roastRatio
        );
      } else if (camper.action === 'coffee') {
        camper.coffeeGroup.visible = true;
        const sip = Math.sin(elapsed * 1.25) > 0.72 ? -0.28 : 0.0;
        targetTorsoLean = 0.08;
        targetLeftArmX = -0.34 + sip;
        targetLeftArmY = 0.24;
        targetRightArmX = -0.34 + sip;
        targetRightArmY = -0.24;
        targetHeadX = sip * 0.4 + 0.06;
      } else if (camper.action === 'sparkler') {
        camper.sparklerGroup.visible = true;
        targetTorsoLean = 0.16;
        targetLeftArmX = -0.35;
        targetLeftArmY = 0.08;
        camper.spCore.scale.setScalar(0.8 + Math.random() * 0.65);

        // Emit tiny sparkler sparks
        if (Math.random() < 0.45) {
          const worldTip = new THREE.Vector3();
          camper.spCore.getWorldPosition(worldTip);
          const sp = new THREE.Mesh(
            new THREE.SphereGeometry(0.018, 4, 4),
            new THREE.MeshBasicMaterial({ color: 0xffe885, transparent: true, opacity: 1 })
          );
          sp.position.copy(worldTip);
          scene.add(sp);
          const vx = (Math.random() - 0.5) * 1.1;
          const vy = (Math.random() - 0.2) * 1.1;
          const vz = (Math.random() - 0.5) * 1.1;
          const born = Date.now();
          activeEffects.push({
            update: (d) => {
              const age = (Date.now() - born) / 380;
              if (age >= 1) {
                scene.remove(sp);
                return false;
              }
              sp.position.x += vx * d;
              sp.position.y += vy * d;
              sp.position.z += vz * d;
              sp.material.opacity = 1 - age;
              return true;
            }
          });
        }
      }
    }

    if (isNodding) {
      targetHeadX = Math.sin(elapsed * 8) * 0.22 + 0.2;
    }

    // Smoothly blend all joint rotations (Zero robotic snapping!)
    const b = camper.poseBlend;
    b.torsoLean = lerp(b.torsoLean, targetTorsoLean, 0.1);
    b.leftArmX = lerp(b.leftArmX, targetLeftArmX, 0.12);
    b.leftArmY = lerp(b.leftArmY, targetLeftArmY, 0.12);
    b.rightArmX = lerp(b.rightArmX, targetRightArmX, 0.12);
    b.rightArmY = lerp(b.rightArmY, targetRightArmY, 0.12);
    b.headX = lerp(b.headX, targetHeadX, 0.12);

    // Subtle breathing chest rise
    const breathScale = 1 + Math.sin(elapsed * 1.8 + camper.seatIndex) * 0.015;
    camper.torsoPivot.scale.set(breathScale, breathScale, breathScale);
    camper.torsoPivot.rotation.x = b.torsoLean;
    camper.leftArm.shoulder.rotation.set(b.leftArmX, b.leftArmY, 0);
    camper.rightArm.shoulder.rotation.set(b.rightArmX, b.rightArmY, 0);
    camper.headGroup.rotation.x = b.headX;
  }

  // Update Active Particle Effects
  for (let i = activeEffects.length - 1; i >= 0; i--) {
    if (!activeEffects[i].update(dt)) {
      activeEffects.splice(i, 1);
    }
  }

  renderer.render(scene, camera);
}

// ====================================================
// 11. POINTER & CAMERA CONTROLS
// ====================================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

canvas.addEventListener('pointerdown', (e) => {
  camControl.isDragging = true;
  camControl.dragMoved = false;
  camControl.lastX = e.clientX;
  camControl.lastY = e.clientY;
});

window.addEventListener('pointermove', (e) => {
  if (!camControl.isDragging) return;
  const dx = e.clientX - camControl.lastX;
  const dy = e.clientY - camControl.lastY;
  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) camControl.dragMoved = true;

  camControl.orbitOffset -= dx * 0.006;
  camControl.pitchOffset = Math.max(-0.45, Math.min(0.85, camControl.pitchOffset + dy * 0.004));
  camControl.lastX = e.clientX;
  camControl.lastY = e.clientY;
});

window.addEventListener('pointerup', (e) => {
  if (!camControl.isDragging) return;
  camControl.isDragging = false;
  if (camControl.dragMoved) return;

  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  // 1. Clicked another camper? -> Walk over and offer coffee or marshmallow
  const camperHits = raycaster.intersectObjects(camperHitMeshes, false);
  if (camperHits.length > 0) {
    const hitData = camperHits[0].object.userData;
    if (hitData.seatIndex !== undefined && hitData.seatIndex !== state.mySeatIndex) {
      const giftType = state.myAction === 'mallow' ? 'mallow' : 'coffee';
      animateWalkAndOfferGift(state.mySeatIndex, hitData.seatIndex, giftType, state.myNickname);
      sendServerAction({ type: 'offerGift', targetSeat: hitData.seatIndex, giftType });
      showCenterNotice(
        giftType === 'coffee'
          ? '옆 사람에게 다가가 따뜻한 커피를 두 손으로 건넵니다.'
          : '옆 사람에게 다가가 구운 마시멜로를 두 손으로 건넵니다.'
      );
      return;
    }
  }

  // 2. Clicked another Log Bench? -> Walk over and sit there
  const seatHits = raycaster.intersectObjects(seatClickMeshes, false);
  if (seatHits.length > 0) {
    const newSeat = seatHits[0].object.userData.seatIndex;
    if (typeof newSeat === 'number' && newSeat !== state.mySeatIndex) {
      state.mySeatIndex = newSeat;
      camControl.orbitOffset = 0; // Smoothly rotate camera behind new seat!
      const myCamper = camperMeshes.get(state.clientId);
      const targetS = seats[newSeat];
      if (myCamper && targetS) {
        myCamper.walkState = {
          targetX: targetS.x,
          targetZ: targetS.z,
          isWalking: true,
          onArrive: () => {
            myCamper.group.rotation.y = targetS.lookAngle;
            myCamper.walkState = null;
            sendServerAction({ type: 'moveSeat', seatIndex: newSeat });
          }
        };
      } else {
        sendServerAction({ type: 'moveSeat', seatIndex: newSeat });
      }
      showCenterNotice('선택한 통나무 자리로 걸어가 앉습니다.');
    }
  }
});

window.addEventListener('wheel', (e) => {
  camControl.zoomOffset = Math.max(-1.8, Math.min(3.5, camControl.zoomOffset + e.deltaY * 0.004));
}, { passive: true });

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ====================================================
// 12. REAL-TIME MULTIPLAYER & HONEST USER COUNT
// ====================================================
let sseSource = null;

function rebuildActiveUsersList() {
  const realList = state.realUsers.length > 0
    ? state.realUsers
    : [{
        id: state.clientId,
        name: state.myNickname,
        seatIndex: state.mySeatIndex,
        action: state.myAction,
        color: state.myColor
      }];

  // Online badge ALWAYS displays the exact number of real connected people!
  document.getElementById('onlineCount').textContent = String(realList.length);

  if (state.enableSoloCompanion && realList.length === 1) {
    const companionSeat = (state.mySeatIndex + 2) % MAX_SEATS;
    state.users = [
      ...realList,
      {
        id: 'sim_forest_companion',
        name: '고요한 산장지기 (AI)',
        seatIndex: companionSeat,
        action: 'coffee',
        color: '#5c8072'
      }
    ];
  } else {
    state.users = realList;
  }

  syncCampers3D();
}

function connectMultiplayerRoom() {
  if (sseSource) {
    sseSource.close();
    sseSource = null;
  }

  syncUrlParams();
  applyRoomAtmosphere();

  const q = new URLSearchParams({
    room: state.room,
    instance: String(state.instance),
    region: state.region,
    clientId: state.clientId,
    name: state.myNickname,
    color: state.myColor
  });

  sseSource = new EventSource(`/api/stream?${q.toString()}`);

  sseSource.addEventListener('init', (ev) => {
    const data = JSON.parse(ev.data);
    state.mySeatIndex = data.mySeatIndex;
    applyRoomSnapshot(data.snapshot);
  });

  sseSource.addEventListener('sync', (ev) => {
    const snapshot = JSON.parse(ev.data);
    applyRoomSnapshot(snapshot);
  });

  sseSource.addEventListener('effect', (ev) => {
    const eff = JSON.parse(ev.data);
    handleIncomingRoomEffect(eff);
  });

  sseSource.onerror = () => {
    state.realUsers = [{
      id: state.clientId,
      name: state.myNickname,
      seatIndex: state.mySeatIndex,
      action: state.myAction,
      color: state.myColor
    }];
    rebuildActiveUsersList();
  };
}

function applyRoomSnapshot(snapshot) {
  if (!snapshot) return;
  state.fireHeat = snapshot.fireHeat || 720;
  document.getElementById('fireTempDisplay').textContent = `${state.fireHeat}°C`;

  state.realUsers = snapshot.users || [];
  const me = state.realUsers.find((u) => u.id === state.clientId);
  if (me) state.mySeatIndex = me.seatIndex;

  rebuildActiveUsersList();
}

function handleIncomingRoomEffect(eff) {
  if (!eff) return;
  if (eff.effect === 'throwLog') {
    state.fireHeat = eff.fireHeat || state.fireHeat + 38;
    document.getElementById('fireTempDisplay').textContent = `${state.fireHeat}°C`;
    if (eff.fromSeat !== state.mySeatIndex) {
      triggerNaturalLogPlacement(eff.fromSeat);
      showCenterNotice(`${eff.actorName}님이 모닥불에 장작을 얹었습니다.`);
    }
  } else if (eff.effect === 'aurora') {
    state.auroraUntil = Date.now() + 14000;
    if (eff.fromSeat !== state.mySeatIndex) {
      soundEngine.playWarmBell();
      showCenterNotice(`${eff.actorName}님이 오로라 불꽃 가루를 뿌렸습니다.`);
    }
  } else if (eff.effect === 'offerGift') {
    if (eff.fromSeat !== state.mySeatIndex) {
      animateWalkAndOfferGift(eff.fromSeat, eff.targetSeat, eff.giftType, eff.actorName);
    }
  } else if (eff.effect === 'acceptGift') {
    if (eff.targetSeat !== state.mySeatIndex) {
      completeGiftAcceptance(eff.fromSeat, eff.targetSeat, eff.giftType);
      showCenterNotice(`${eff.actorName}님이 따뜻한 선물을 두 손으로 받았습니다.`);
    }
  }
}

function sendServerAction(payload) {
  fetch('/api/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      room: state.room,
      instance: state.instance,
      region: state.region,
      clientId: state.clientId,
      ...payload
    })
  }).catch(() => {});
}

// ====================================================
// 13. UI CONTROLS & EVENT LISTENERS
// ====================================================
function applyRoomAtmosphere() {
  const isRain = state.room === 'rain-04';
  document.getElementById('currentRoomName').textContent = isRain ? '우중 캠핑 모닥불' : '소나무 숲 모닥불';
  document.getElementById('currentRegionTag').textContent = `${state.region.toUpperCase()} · #${state.instance}`;

  document.querySelectorAll('.room-item').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.room === state.room);
  });

  const rainVol = isRain ? 75 : 0;
  document.getElementById('volRain').value = rainVol;
  document.getElementById('valRain').textContent = `${rainVol}%`;
  soundEngine.setVolume('rain', rainVol);
}

const previewNickname = document.getElementById('previewNickname');
previewNickname.textContent = state.myNickname;

document.getElementById('rerollNameBtn').addEventListener('click', () => {
  state.myNickname = generateRandomNickname();
  localStorage.setItem('bm_nickname', state.myNickname);
  previewNickname.textContent = state.myNickname;
});

document.getElementById('enterCampBtn').addEventListener('click', () => {
  soundEngine.init();
  document.getElementById('entryOverlay').classList.add('hidden');
  document.getElementById('topBar').classList.remove('hidden');
  document.getElementById('bottomDock').classList.remove('hidden');
  state.enteredAt = Date.now();
  connectMultiplayerRoom();
  showCenterNotice('타닥거리는 모닥불 앞에 앉았습니다.');
});

// Camera POV Toggle (내 어깨 너머 ↔ 1인칭 불꽃 집중 ↔ 전체 시점)
const povLabel = document.getElementById('povLabel');
document.getElementById('cameraPovBtn').addEventListener('click', () => {
  camControl.orbitOffset = 0;
  camControl.pitchOffset = 0;
  camControl.zoomOffset = 0;

  if (state.povMode === 'shoulder') {
    state.povMode = 'first';
    povLabel.textContent = '1인칭 불꽃 직관';
    showCenterNotice('1인칭 시점: 모닥불 바로 앞에서 불꽃에 온전히 집중합니다.');
  } else if (state.povMode === 'first') {
    state.povMode = 'wide';
    povLabel.textContent = '모닥불 전체';
    showCenterNotice('전체 시점: 모닥불 터 전체를 넓게 바라봅니다.');
  } else {
    state.povMode = 'shoulder';
    povLabel.textContent = '내 어깨 너머';
    showCenterNotice('내 어깨 너머 시점: 내 캐릭터와 모닥불을 함께 바라봅니다.');
  }
});

// Solo AI Companion Toggle
const soloCompanionToggle = document.getElementById('soloCompanionToggle');
if (soloCompanionToggle) {
  soloCompanionToggle.addEventListener('change', (e) => {
    state.enableSoloCompanion = e.target.checked;
    rebuildActiveUsersList();
    showCenterNotice(
      state.enableSoloCompanion
        ? '조용한 숲속 동행(AI 캠퍼)이 맞은편 통나무에 함께 앉았습니다.'
        : '혼자만의 고요한 모닥불 시간으로 전환했습니다.'
    );
  });
}

document.getElementById('roomSelectBtn').addEventListener('click', () => {
  document.getElementById('roomModal').classList.toggle('hidden');
  document.getElementById('soundModal').classList.add('hidden');
});

document.getElementById('soundToggleBtn').addEventListener('click', () => {
  document.getElementById('soundModal').classList.toggle('hidden');
  document.getElementById('roomModal').classList.add('hidden');
});

document.querySelectorAll('.close-panel-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.close);
    if (target) target.classList.add('hidden');
  });
});

document.querySelectorAll('.room-item').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.room = btn.dataset.room;
    document.getElementById('roomModal').classList.add('hidden');
    connectMultiplayerRoom();
  });
});

document.querySelectorAll('#regionGroup .mini-pill').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#regionGroup .mini-pill').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.region = btn.dataset.region;
    connectMultiplayerRoom();
  });
});

document.querySelectorAll('#instanceGroup .mini-pill').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#instanceGroup .mini-pill').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.instance = Number(btn.dataset.instance);
    connectMultiplayerRoom();
  });
});

document.getElementById('copyRoomLinkBtn').addEventListener('click', () => {
  navigator.clipboard.writeText(window.location.href).then(() => {
    showCenterNotice('현재 모닥불 주소가 복사되었습니다. 친구에게 공유해 함께 불멍하세요.');
  });
});

// Sound Sliders
['Fire', 'Wind', 'Rain', 'Night'].forEach((ch) => {
  const slider = document.getElementById(`vol${ch}`);
  const label = document.getElementById(`val${ch}`);
  if (!slider) return;
  slider.addEventListener('input', () => {
    label.textContent = `${slider.value}%`;
    soundEngine.setVolume(ch.toLowerCase(), Number(slider.value));
  });
});

document.getElementById('muteAllBtn').addEventListener('click', () => {
  const muted = soundEngine.toggleMute();
  document.getElementById('soundToggleBtn').textContent = muted ? '🔇' : '🔊';
});

// Worry Burn Modal
const worryInput = document.getElementById('worryInput');
const worryCount = document.getElementById('worryCount');
worryInput.addEventListener('input', () => {
  worryCount.textContent = `${worryInput.value.length} / 120자`;
});

document.getElementById('burnWorrySubmitBtn').addEventListener('click', () => {
  worryInput.value = '';
  worryCount.textContent = '0 / 120자';
  document.getElementById('worryModal').classList.add('hidden');
  triggerNaturalLogPlacement(state.mySeatIndex);
  soundEngine.playWarmBell();
  showCenterNotice('적어주신 무거운 고민이 모닥불 불꽃 속에서 조용히 타올라 사라집니다.');
});

// Zen Mode
document.getElementById('zenModeBtn').addEventListener('click', () => {
  state.zenMode = true;
  document.getElementById('topBar').classList.add('hidden');
  document.getElementById('bottomDock').classList.add('hidden');
  document.getElementById('exitZenBtn').classList.remove('hidden');
});

document.getElementById('exitZenBtn').addEventListener('click', () => {
  state.zenMode = false;
  document.getElementById('topBar').classList.remove('hidden');
  document.getElementById('bottomDock').classList.remove('hidden');
  document.getElementById('exitZenBtn').classList.add('hidden');
});

// Stay Timer
setInterval(() => {
  const sec = Math.floor((Date.now() - state.enteredAt) / 1000);
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  const el = document.getElementById('stayTimer');
  if (el) el.textContent = `${m}:${s}`;
}, 1000);

// Keyboard Shortcuts (1~8)
const KEY_MAP = ['hands', 'log', 'mallow', 'coffee', 'give', 'sparkler', 'aurora', 'worry'];
window.addEventListener('keydown', (e) => {
  if (document.activeElement === worryInput) return;
  const idx = Number(e.key) - 1;
  if (idx >= 0 && idx < KEY_MAP.length) {
    triggerCampfireAction(KEY_MAP[idx]);
  }
});

// Start 3D Loop
rebuildActiveUsersList();
animate();
