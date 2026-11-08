/**
 * 불멍 · 물멍 · 별멍 | 3D Inner Peace Sanctuary (Three.js + SSE Multiplayer)
 *
 * 1. 🔥 불멍 (fire-01 / rain-04): 소나무 숲 모닥불, 통나무 다리 굽혀 앉기, 불 가까이 손 녹이기, 마시멜로 굽기, 두 손으로 건네기
 * 2. 🏔️ 물멍 (water-02): 스위스 알프스 만년설 에메랄드 호수, 낮/밤 전환(윤슬/달빛), 캠핑 의자 또는 호숫가 수풀 앉기, 물결 명상
 * 3. 🌌 별멍 (star-03): 강원도 깊은 산골짜기 능선, 새까만 밤하늘 수천 개의 별과 별자리(선+이름), 캠핑 매트에 완전히 눕기/앉기, 망원경, 별똥별
 */

// ====================================================
// 1. IDENTITY & ROOM CONFIG
// ====================================================
const ADJECTIVES = [
  '고요한', '따스한', '평온한', '은은한', '차분한',
  '깊어가는', '별빛 닮은', '솔향기 나는', '포근한', '잔잔한',
  '투명한', '다정한', '새벽녘의', '여유로운'
];

const NOUNS = [
  '모닥불', '솔방울', '윤슬', '별똥별', '통나무',
  '산들바람', '은하수', '모래알', '보온병', '산장지기',
  '조약돌', '풀벌레', '초승달', '여행자'
];

const CAMPER_COLORS = [
  '#e07a5f', '#6b9080', '#e9c46a', '#8ecae6',
  '#b5838d', '#f4a261', '#90be6d', '#a8dadc',
  '#c77dff', '#ff9f1c', '#4ea8de', '#f28482'
];

const ROOM_META = {
  'fire-01': {
    name: '🔥 불멍 · 소나무 숲 모닥불',
    icon: '🔥',
    theme: 'fire',
    soundDefaults: { fire: 85, wind: 40, rain: 0, night: 55 }
  },
  'water-02': {
    name: '🏔️ 물멍 · 스위스 알프스 호수',
    icon: '🏔️',
    theme: 'water',
    soundDefaults: { fire: 75, wind: 55, rain: 0, night: 45 }
  },
  'star-03': {
    name: '🌌 별멍 · 강원도 산골짜기 별빛',
    icon: '🌌',
    theme: 'star',
    soundDefaults: { fire: 20, wind: 60, rain: 0, night: 85 }
  },
  'rain-04': {
    name: '⛺ 우중 불멍 · 빗소리 타프 아래',
    icon: '⛺',
    theme: 'rain',
    soundDefaults: { fire: 75, wind: 40, rain: 85, night: 30 }
  }
};

// Concept-specific Action Dock configurations for Inner Peace
const CONCEPT_DOCK_ACTIONS = {
  fire: [
    { id: 'wave', icon: '👋', label: '인사하기', key: '1' },
    { id: 'hands', icon: '🤲', label: '불 가까이 손 녹이기', key: '2' },
    { id: 'log', icon: '🪵', label: '장작 넣기', key: '3' },
    { id: 'mallow', icon: '🍡', label: '마시멜로 굽기', key: '4' },
    { id: 'giveMallow', icon: '🎁', label: '옆사람 마시멜로 건네기', key: '5' },
    { id: 'giveCoffee', icon: '☕', label: '보온병 커피 건네기', key: '6' },
    { id: 'sparkler', icon: '🎇', label: '선향불꽃 놀이', key: '7' },
    { id: 'worry', icon: '📜', label: '고민 태우기', key: '8' }
  ],
  water: [
    { id: 'toggleDayNight', icon: '☀️', label: '낮·밤 전환 (윤슬/달빛)', key: '1' },
    { id: 'toggleWaterSeat', icon: '🪑', label: '캠핑의자 ↔ 호수 수풀 앉기', key: '2' },
    { id: 'wave', icon: '👋', label: '인사하기', key: '3' },
    { id: 'giveCoffee', icon: '☕', label: '보온병 커피 건네기', key: '4' },
    { id: 'meditate', icon: '🧘', label: '호수 바라보며 명상', key: '5' },
    { id: 'lantern', icon: '🪷', label: '소원 연등 띄우기', key: '6' },
    { id: 'skipStone', icon: '🪨', label: '잔잔한 물결 만들기', key: '7' },
    { id: 'worry', icon: '📜', label: '물결에 마음 흘려보내기', key: '8' }
  ],
  star: [
    { id: 'toggleLieSit', icon: '🛌', label: '매트에 눕기 ↔ 앉기', key: '1' },
    { id: 'stargaze', icon: '🔭', label: '망원경으로 별 관찰', key: '2' },
    { id: 'shootingStar', icon: '🌠', label: '별똥별 소원 빌기', key: '3' },
    { id: 'toggleConstellation', icon: '✨', label: '별자리 선·이름 토글', key: '4' },
    { id: 'wave', icon: '👋', label: '조용히 인사하기', key: '5' },
    { id: 'giveCoffee', icon: '☕', label: '보온병 커피 건네기', key: '6' },
    { id: 'worry', icon: '📜', label: '별빛에 생각 날리기', key: '7' }
  ]
};

function generateRandomNickname() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj} ${noun}`;
}

function normalizeRoomId(r) {
  if (r === 'pine-01') return 'fire-01';
  if (r === 'lake-02') return 'water-02';
  if (r === 'temple-03') return 'star-03';
  return ROOM_META[r] ? r : 'fire-01';
}

const urlParams = new URLSearchParams(window.location.search);
const state = {
  clientId: sessionStorage.getItem('bm_clientId') || `camper_${Math.random().toString(36).slice(2, 9)}`,
  myNickname: localStorage.getItem('bm_nickname') || generateRandomNickname(),
  myColor: sessionStorage.getItem('bm_color') || CAMPER_COLORS[Math.floor(Math.random() * CAMPER_COLORS.length)],
  room: normalizeRoomId(urlParams.get('room') || 'fire-01'),
  instance: Number(urlParams.get('instance') || 0),
  region: urlParams.get('region') || 'apac',
  mySeatIndex: 0,
  myAction: 'idle',
  myPosture: 'sit', // 'sit' | 'chair' | 'grass' | 'lie'
  waterDayMode: true, // Swiss lake: true = Sunny Alpine Day, false = Moonlight Night
  showConstellations: true,
  fireHeat: 680,
  auroraUntil: 0,
  enteredAt: Date.now(),
  zenMode: false,
  users: [],
  pendingGiftOffer: null // { fromSeat, actorName, giftType }
};

sessionStorage.setItem('bm_clientId', state.clientId);
sessionStorage.setItem('bm_color', state.myColor);

function getConceptType(room = state.room) {
  if (room === 'water-02') return 'water';
  if (room === 'star-03') return 'star';
  return 'fire';
}

function syncUrlParams() {
  const url = new URL(window.location.href);
  url.searchParams.set('room', state.room);
  url.searchParams.set('instance', String(state.instance));
  url.searchParams.set('region', state.region);
  window.history.replaceState({}, '', url.toString());
}
syncUrlParams();

// ====================================================
// 2. PROCEDURAL WEB AUDIO ENGINE (INNER PEACE ASMR)
// ====================================================
class InnerPeaceSoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.volumes = { fire: 0.8, wind: 0.45, rain: 0.0, night: 0.55 };
    this.nodes = {};
    this.crackleTimer = null;
    this.bowlTimer = null;
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
    this.masterGain.gain.value = 0.85;
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

    // 1. Fire rumble / Lake gentle wave lapping
    const fireRumble = this.ctx.createBufferSource();
    fireRumble.buffer = noiseBuffer;
    fireRumble.loop = true;
    const fireFilter = this.ctx.createBiquadFilter();
    fireFilter.type = 'lowpass';
    fireFilter.frequency.value = 180;
    this.nodes.fireFilter = fireFilter;
    this.nodes.fireGain = this.ctx.createGain();
    this.nodes.fireGain.gain.value = this.volumes.fire * 0.4;
    fireRumble.connect(fireFilter);
    fireFilter.connect(this.nodes.fireGain);
    this.nodes.fireGain.connect(this.masterGain);
    fireRumble.start();

    // 2. Alpine / Mountain Valley Breeze
    const windSource = this.ctx.createBufferSource();
    windSource.buffer = noiseBuffer;
    windSource.loop = true;
    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 340;
    windFilter.Q.value = 4.0;
    this.nodes.windFilter = windFilter;
    this.nodes.windGain = this.ctx.createGain();
    this.nodes.windGain.gain.value = this.volumes.wind * 0.25;
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
    rainFilter.frequency.value = 1100;
    rainFilter.Q.value = 0.8;
    this.nodes.rainGain = this.ctx.createGain();
    this.nodes.rainGain.gain.value = this.volumes.rain * 0.35;
    rainSource.connect(rainFilter);
    rainFilter.connect(this.nodes.rainGain);
    this.nodes.rainGain.connect(this.masterGain);
    rainSource.start();

    this.crackleTimer = setInterval(() => this.triggerAmbientDetail(), 120);
    this.bowlTimer = setInterval(() => {
      if (!this.isMuted && this.volumes.night > 0.15 && Math.random() < 0.38) {
        this.playSingingBowlNote();
      }
    }, 6500);
  }

  triggerAmbientDetail() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const concept = getConceptType();

    if (this.nodes.windFilter) {
      const targetFreq = 260 + Math.sin(now * 0.35) * 100;
      this.nodes.windFilter.frequency.setTargetAtTime(targetFreq, now, 0.3);
    }

    if (concept === 'water' && this.nodes.fireFilter) {
      // Gentle rhythmic lake wave shore wash
      const waveFreq = 160 + Math.sin(now * 1.1) * 90;
      this.nodes.fireFilter.frequency.setTargetAtTime(waveFreq, now, 0.4);
    } else if (concept === 'fire' && this. volumes.fire > 0.02 && Math.random() < 0.32) {
      // Cozy wood crackle
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1400 + Math.random() * 1800;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160 + Math.random() * 500, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.035);
      const amp = (0.025 + Math.random() * 0.05) * this.volumes.fire;
      gain.gain.setValueAtTime(amp, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.045);
    }

    // Crickets in mountain valley / forest night
    if (this.volumes.night > 0.05 && Math.random() < 0.08) {
      const cOsc = this.ctx.createOscillator();
      const cGain = this.ctx.createGain();
      cOsc.type = 'sine';
      cOsc.frequency.setValueAtTime(3900 + Math.random() * 200, now);
      const cAmp = 0.01 * this.volumes.night;
      cGain.gain.setValueAtTime(0.0001, now);
      cGain.gain.linearRampToValueAtTime(cAmp, now + 0.02);
      cGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      cOsc.connect(cGain);
      cGain.connect(this.masterGain);
      cOsc.start(now);
      cOsc.stop(now + 0.15);
    }
  }

  playSingingBowlNote(customFreq) {
    if (!this.ctx || this.isMuted) return;
    const freqs = [256, 288, 320, 384, 432, 512]; // Healing harmonic scale
    const baseFreq = customFreq || freqs[Math.floor(Math.random() * freqs.length)];
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.045 * Math.max(0.3, this.volumes.night), now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.8);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 5.0);
  }

  playWarmChime() {
    this.playSingingBowlNote(528);
  }

  setVolume(channel, val0to100) {
    const v = Math.max(0, Math.min(100, val0to100)) / 100;
    this.volumes[channel] = v;
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (channel === 'fire' && this.nodes.fireGain) this.nodes.fireGain.gain.setTargetAtTime(v * 0.4, now, 0.1);
    if (channel === 'wind' && this.nodes.windGain) this.nodes.windGain.gain.setTargetAtTime(v * 0.25, now, 0.1);
    if (channel === 'rain' && this.nodes.rainGain) this.nodes.rainGain.gain.setTargetAtTime(v * 0.35, now, 0.1);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.85, this.ctx.currentTime, 0.1);
    }
    return this.isMuted;
  }
}

const soundEngine = new InnerPeaceSoundEngine();

// ====================================================
// 3. THREE.JS 3D SANCTUARY WORLD (3 DISTINCT CONCEPTS)
// ====================================================
const canvas = document.getElementById('campfireCanvas');
const labelsContainer = document.getElementById('labels3DContainer');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0811);
scene.fog = new THREE.FogExp2(0x0b0811, 0.015);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 260);

const camControl = {
  theta: 0.0,
  phi: 0.42,
  radius: 14.5,
  targetTheta: 0.0,
  targetPhi: 0.42,
  targetRadius: 14.5,
  lookAtY: 1.3,
  targetLookAtY: 1.3,
  isDragging: false,
  dragMoved: false,
  lastX: 0,
  lastY: 0
};

// Lights
const hemiLight = new THREE.HemisphereLight(0x2a243b, 0x120c08, 0.55);
scene.add(hemiLight);

const sunMoonLight = new THREE.DirectionalLight(0xffeedd, 0.35);
sunMoonLight.position.set(18, 28, -25);
sunMoonLight.castShadow = true;
scene.add(sunMoonLight);

const fireLight = new THREE.PointLight(0xff7b29, 2.9, 26, 1.5);
fireLight.position.set(0, 1.8, 0);
fireLight.castShadow = true;
fireLight.shadow.mapSize.width = 1024;
fireLight.shadow.mapSize.height = 1024;
scene.add(fireLight);

// Ground Plane for Raycasting & Walking
const groundGeo = new THREE.CircleGeometry(90, 64);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x171210, roughness: 0.95, metalness: 0.04 });
const groundMesh = new THREE.Mesh(groundGeo, groundMat);
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

// Environment Concept Groups
const fireWorldGroup = new THREE.Group(); // Concept 1: Forest Campfire
const waterWorldGroup = new THREE.Group(); // Concept 2: Swiss Alpine Lake
const starWorldGroup = new THREE.Group(); // Concept 3: Gangwon-do Mountain Valley Stargazing
scene.add(fireWorldGroup);
scene.add(waterWorldGroup);
scene.add(starWorldGroup);

// ====================================================
// 3A. BUILD CONCEPT 1: 🔥 불멍 (PINE FOREST CAMPFIRE)
// ====================================================
const flameCones = [];
for (let i = 0; i < 18; i++) {
  const stoneGeo = new THREE.DodecahedronGeometry(0.28 + (i % 3) * 0.05, 1);
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x3d3835, roughness: 0.9 });
  const stone = new THREE.Mesh(stoneGeo, stoneMat);
  const angle = (i / 18) * Math.PI * 2;
  stone.position.set(Math.cos(angle) * 1.65, 0.14, Math.sin(angle) * 1.65);
  stone.scale.y = 0.65;
  stone.castShadow = true;
  fireWorldGroup.add(stone);
}

const emberBed = new THREE.Mesh(
  new THREE.CylinderGeometry(1.4, 1.5, 0.16, 24),
  new THREE.MeshBasicMaterial({ color: 0xff4500 })
);
emberBed.position.y = 0.08;
fireWorldGroup.add(emberBed);

const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a2c18, roughness: 0.9 });
for (let i = 0; i < 7; i++) {
  const log = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 2.3, 10), woodMat);
  const angle = (i / 7) * Math.PI * 2;
  log.position.set(Math.cos(angle) * 0.35, 0.34, Math.sin(angle) * 0.35);
  log.rotation.z = Math.cos(angle) * 0.55;
  log.rotation.x = Math.sin(angle) * 0.55;
  log.castShadow = true;
  fireWorldGroup.add(log);
}

const flameColors = [0xff4500, 0xff7700, 0xffaa00, 0xffdd55, 0xfff3b0];
for (let i = 0; i < 14; i++) {
  const radius = 0.42 - (i / 14) * 0.22;
  const height = 1.45 + (i % 4) * 0.42;
  const mat = new THREE.MeshBasicMaterial({
    color: flameColors[i % flameColors.length],
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 8), mat);
  const a = (i / 14) * Math.PI * 2;
  const dist = (i % 3) * 0.2;
  cone.position.set(Math.cos(a) * dist, height * 0.42 + 0.15, Math.sin(a) * dist);
  cone.userData = {
    baseX: cone.position.x,
    baseZ: cone.position.z,
    baseY: cone.position.y,
    speed: 3.2 + i * 0.35,
    phase: i * 1.1
  };
  fireWorldGroup.add(cone);
  flameCones.push(cone);
}

// Pine Trees around campfire (placed outside radius 15 so camera never clips)
const trunkMat = new THREE.MeshStandardMaterial({ color: 0x2b1d14, roughness: 0.95 });
const leafMat = new THREE.MeshStandardMaterial({ color: 0x16281e, roughness: 0.85 });
for (let i = 0; i < 42; i++) {
  const tree = new THREE.Group();
  const a = (i / 42) * Math.PI * 2 + (Math.random() - 0.5) * 0.08;
  const r = 15.5 + Math.random() * 18;
  const s = 0.85 + Math.random() * 0.8;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * s, 0.32 * s, 2.2 * s, 7), trunkMat);
  trunk.position.y = 1.1 * s;
  tree.add(trunk);
  for (let l = 0; l < 3; l++) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry((1.8 - l * 0.4) * s, (2.6 - l * 0.3) * s, 7), leafMat);
    cone.position.y = (2.3 + l * 1.35) * s;
    tree.add(cone);
  }
  tree.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
  fireWorldGroup.add(tree);
}

// ====================================================
// 3B. BUILD CONCEPT 2: 🏔️ 물멍 (SWISS ALPINE EMERALD LAKE)
// ====================================================
// Expansive Swiss Lake Water Surface in front of the shore (Z < 2.2)
const swissLakeGeo = new THREE.PlaneGeometry(160, 110, 48, 48);
const swissLakeMat = new THREE.MeshStandardMaterial({
  color: 0x1b8ca6, // Turquoise Swiss glacial lake
  roughness: 0.16,
  metalness: 0.72,
  transparent: true,
  opacity: 0.92
});
const swissLakeMesh = new THREE.Mesh(swissLakeGeo, swissLakeMat);
swissLakeMesh.rotation.x = -Math.PI / 2;
swissLakeMesh.position.set(0, 0.04, -52);
waterWorldGroup.add(swissLakeMesh);

// Sun / Moon Shimmering Reflection strip (윤슬) on the lake
const shimmerParticles = [];
const shimmerMat = new THREE.MeshBasicMaterial({
  color: 0xfff3c4,
  transparent: true,
  opacity: 0.75,
  blending: THREE.AdditiveBlending
});
for (let i = 0; i < 65; i++) {
  const shim = new THREE.Mesh(new THREE.PlaneGeometry(0.55 + Math.random() * 0.9, 0.12), shimmerMat.clone());
  shim.rotation.x = -Math.PI / 2;
  shim.position.set((Math.random() - 0.5) * 28, 0.06, -4 - Math.random() * 38);
  shim.userData = { baseX: shim.position.x, phase: Math.random() * Math.PI * 2, speed: 1.5 + Math.random() * 2 };
  waterWorldGroup.add(shim);
  shimmerParticles.push(shim);
}

// Majestic Swiss Alps Snow-Capped Mountain Range across the lake
const alpsRockMat = new THREE.MeshStandardMaterial({ color: 0x3b4d5e, roughness: 0.85 });
const alpsSnowMat = new THREE.MeshStandardMaterial({ color: 0xf4f9ff, roughness: 0.35, emissive: 0x1a2636, emissiveIntensity: 0.2 });

const alpsPeaksData = [
  { x: -42, z: -58, r: 22, h: 32 },
  { x: -22, z: -52, r: 19, h: 28 },
  { x: 0, z: -60, r: 26, h: 38 }, // Main Matterhorn/Jungfrau-inspired peak
  { x: 23, z: -54, r: 20, h: 30 },
  { x: 44, z: -58, r: 23, h: 33 },
  { x: -12, z: -46, r: 14, h: 19 },
  { x: 14, z: -46, r: 15, h: 21 }
];

alpsPeaksData.forEach((p) => {
  const peakGroup = new THREE.Group();
  const baseCone = new THREE.Mesh(new THREE.ConeGeometry(p.r, p.h, 7), alpsRockMat);
  baseCone.position.y = p.h * 0.5;
  peakGroup.add(baseCone);

  // Snow cap on upper 45%
  const snowCone = new THREE.Mesh(new THREE.ConeGeometry(p.r * 0.48, p.h * 0.48, 7), alpsSnowMat);
  snowCone.position.y = p.h * 0.77;
  peakGroup.add(snowCone);

  peakGroup.position.set(p.x, -0.5, p.z);
  peakGroup.rotation.y = Math.random() * Math.PI;
  waterWorldGroup.add(peakGroup);
});

// Swiss Wooden Pier & Shore Grass/Reeds (호수 앞 수풀)
const reedMat = new THREE.MeshStandardMaterial({ color: 0x3d6b48, roughness: 0.8 });
const grassTufts = [];
for (let i = 0; i < 90; i++) {
  const tuft = new THREE.Group();
  const tx = (Math.random() - 0.5) * 28;
  const tz = 1.6 + Math.random() * 5.5;
  for (let b = 0; b < 5; b++) {
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.45 + Math.random() * 0.35, 4), reedMat);
    blade.position.set((Math.random() - 0.5) * 0.25, 0.22, (Math.random() - 0.5) * 0.25);
    blade.rotation.z = (Math.random() - 0.5) * 0.35;
    tuft.add(blade);
  }
  tuft.position.set(tx, 0, tz);
  tuft.userData = { phase: Math.random() * Math.PI * 2 };
  waterWorldGroup.add(tuft);
  grassTufts.push(tuft);
}

// ====================================================
// 3C. BUILD CONCEPT 3: 🌌 별멍 (GANGWON-DO MOUNTAIN VALLEY STARGAZING)
// ====================================================
// Surrounding Dark Gangwon-do Mountain Valley Ridges (산골짜기 능선)
const ridgeMat = new THREE.MeshStandardMaterial({ color: 0x070a14, roughness: 0.98 });
for (let i = 0; i < 16; i++) {
  const a = (i / 16) * Math.PI * 2;
  const dist = 36 + (i % 3) * 8;
  const h = 16 + (i % 4) * 6;
  const w = 22 + (i % 2) * 6;
  const ridge = new THREE.Mesh(new THREE.ConeGeometry(w, h, 6), ridgeMat);
  ridge.position.set(Math.cos(a) * dist, h * 0.42 - 1, Math.sin(a) * dist);
  ridge.rotation.y = a;
  starWorldGroup.add(ridge);
}

// Cozy Small Tent & Warm Camp Lantern in the Valley
const tentGroup = new THREE.Group();
const tentBody = new THREE.Mesh(
  new THREE.ConeGeometry(2.2, 2.1, 4),
  new THREE.MeshStandardMaterial({ color: 0xd48b45, roughness: 0.7, emissive: 0xff7b29, emissiveIntensity: 0.28 })
);
tentBody.position.y = 1.05;
tentBody.rotation.y = Math.PI / 4;
tentGroup.add(tentBody);
tentGroup.position.set(-7.5, 0, -5.5);
starWorldGroup.add(tentGroup);

// 2,400+ Crisp Pouring Stars in Pitch-Black Sky Dome
const starCount = 2400;
const starGeo = new THREE.BufferGeometry();
const starPositions = new Float32Array(starCount * 3);
const starColors = new Float32Array(starCount * 3);
const starPalette = [
  new THREE.Color(0xffffff),
  new THREE.Color(0xcce4ff),
  new THREE.Color(0xffe8c2),
  new THREE.Color(0xd8c8ff)
];

for (let i = 0; i < starCount; i++) {
  const r = 68 + Math.random() * 45;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.random() * Math.PI * 0.47; // Upper hemisphere down to mountain ridges
  starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
  starPositions[i * 3 + 1] = Math.max(4, r * Math.cos(phi));
  starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

  const c = starPalette[i % starPalette.length];
  starColors[i * 3] = c.r;
  starColors[i * 3 + 1] = c.g;
  starColors[i * 3 + 2] = c.b;
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

const starMat = new THREE.PointsMaterial({
  size: 0.55,
  vertexColors: true,
  transparent: true,
  opacity: 0.95,
  blending: THREE.AdditiveBlending
});
const starField = new THREE.Points(starGeo, starMat);
scene.add(starField);

// Milky Way Band (은하수 성운 띠)
const milkyWayGeo = new THREE.BufferGeometry();
const mwCount = 1200;
const mwPos = new Float32Array(mwCount * 3);
for (let i = 0; i < mwCount; i++) {
  const t = (Math.random() - 0.5) * Math.PI * 0.88;
  const spread = (Math.random() - 0.5) * 14;
  const r = 65;
  mwPos[i * 3] = Math.sin(t) * r + spread;
  mwPos[i * 3 + 1] = Math.cos(t) * r * 0.85 + (Math.random() - 0.5) * 6;
  mwPos[i * 3 + 2] = -20 + spread * 1.4;
}
milkyWayGeo.setAttribute('position', new THREE.BufferAttribute(mwPos, 3));
const milkyWayMat = new THREE.PointsMaterial({
  color: 0x9bbcff,
  size: 0.85,
  transparent: true,
  opacity: 0.38,
  blending: THREE.AdditiveBlending
});
const milkyWayPoints = new THREE.Points(milkyWayGeo, milkyWayMat);
starWorldGroup.add(milkyWayPoints);

// 3D Constellations (별자리 선 & 이름표)
const constellationGroup = new THREE.Group();
starWorldGroup.add(constellationGroup);

const CONSTELLATIONS = [
  {
    name: '✨ 북두칠성 (큰곰자리)',
    points: [
      [-24, 38, -32], [-19, 40, -30], [-15, 39, -28], [-11, 37, -27],
      [-10, 33, -29], [-5, 34, -27], [-4, 38, -25]
    ]
  },
  {
    name: '✨ 카시오페이아',
    points: [
      [12, 44, -28], [16, 41, -27], [20, 43, -26], [24, 39, -25], [28, 42, -24]
    ]
  },
  {
    name: '✨ 오리온자리',
    points: [
      [-6, 30, -42], [2, 31, -42], [-2, 26, -43], [0, 26, -43], [2, 26, -43],
      [-5, 20, -44], [4, 21, -44]
    ]
  },
  {
    name: '✨ 백조자리 (데네브)',
    points: [
      [0, 50, -14], [0, 45, -18], [0, 40, -22],
      [-6, 44, -18], [0, 45, -18], [6, 46, -18]
    ]
  },
  {
    name: '✨ 거문고자리 (직녀성 베가)',
    points: [
      [-16, 47, -12], [-14, 44, -14], [-12, 45, -15], [-14, 47, -14], [-16, 47, -12]
    ]
  }
];

const constellationLabelItems = [];
const lineMat = new THREE.LineBasicMaterial({
  color: 0x8ecae6,
  transparent: true,
  opacity: 0.45
});
const brightStarMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

CONSTELLATIONS.forEach((con) => {
  const vecs = con.points.map(([x, y, z]) => new THREE.Vector3(x, y, z));
  const lGeo = new THREE.BufferGeometry().setFromPoints(vecs);
  const line = new THREE.Line(lGeo, lineMat);
  constellationGroup.add(line);

  vecs.forEach((v) => {
    const sDot = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), brightStarMat);
    sDot.position.copy(v);
    constellationGroup.add(sDot);
  });

  const labelEl = document.createElement('div');
  labelEl.className = 'constellation-label-3d';
  labelEl.textContent = con.name;
  labelsContainer.appendChild(labelEl);

  const center = vecs[Math.floor(vecs.length / 2)].clone();
  center.y += 1.8;
  constellationLabelItems.push({ el: labelEl, pos: center });
});

// ====================================================
// 4. SEATS PER CONCEPT (LOGS, CAMPING CHAIRS/GRASS, SLEEPING MATS)
// ====================================================
const MAX_SEATS = 12;
const seats = [];
const seatClickMeshes = [];

for (let i = 0; i < MAX_SEATS; i++) {
  const seatRoot = new THREE.Group();
  scene.add(seatRoot);

  // 1. Fire Concept Log Bench
  const logBench = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.32, 1.55, 12),
    new THREE.MeshStandardMaterial({ color: 0x3b2618, roughness: 0.9 })
  );
  logBench.rotation.z = Math.PI / 2;
  logBench.position.y = 0.32;
  logBench.castShadow = true;
  logBench.receiveShadow = true;
  seatRoot.add(logBench);

  // 2. Water Concept Folding Camping Chair (캠핑 의자)
  const campChairGroup = new THREE.Group();
  const chairFrameMat = new THREE.MeshStandardMaterial({ color: 0x2c2c34, metalness: 0.6, roughness: 0.4 });
  const chairFabricMat = new THREE.MeshStandardMaterial({ color: 0xd8cab8, roughness: 0.85, side: THREE.DoubleSide });
  const seatPad = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.08, 0.85), chairFabricMat);
  seatPad.position.set(0, 0.42, 0);
  campChairGroup.add(seatPad);
  const backRest = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.85, 0.08), chairFabricMat);
  backRest.position.set(0, 0.82, -0.38);
  backRest.rotation.x = -0.18;
  campChairGroup.add(backRest);
  // Armrests (wooden)
  const armMat = new THREE.MeshStandardMaterial({ color: 0x7c4d2b, roughness: 0.7 });
  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.8), armMat);
  leftArm.position.set(-0.48, 0.62, 0);
  const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.8), armMat);
  rightArm.position.set(0.48, 0.62, 0);
  campChairGroup.add(leftArm, rightArm);
  // Legs
  [[-0.42, -0.35], [0.42, -0.35], [-0.42, 0.35], [0.42, 0.35]].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 6), chairFrameMat);
    leg.position.set(lx, 0.22, lz);
    campChairGroup.add(leg);
  });
  seatRoot.add(campChairGroup);

  // 3. Star Concept Padded Camping Sleeping Mat & Pillow (캠핑 매트 & 베개)
  const sleepingMatGroup = new THREE.Group();
  const matMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 0.09, 2.2),
    new THREE.MeshStandardMaterial({ color: 0x3b4963, roughness: 0.85 })
  );
  matMesh.position.y = 0.05;
  sleepingMatGroup.add(matMesh);
  const pillowMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.14, 0.42),
    new THREE.MeshStandardMaterial({ color: 0xe6dfd5, roughness: 0.8 })
  );
  pillowMesh.position.set(0, 0.13, -0.78);
  sleepingMatGroup.add(pillowMesh);
  // Small warm mini lantern beside the mat
  const miniLantern = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 0.22, 8),
    new THREE.MeshBasicMaterial({ color: 0xffbe6b })
  );
  miniLantern.position.set(0.72, 0.12, -0.6);
  sleepingMatGroup.add(miniLantern);
  seatRoot.add(sleepingMatGroup);

  // Invisible Hitbox for easy clicking
  const hitMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 1.0, 1.8),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitMesh.position.y = 0.4;
  hitMesh.userData = { seatIndex: i };
  seatRoot.add(hitMesh);
  seatClickMeshes.push(hitMesh);

  const labelEl = document.createElement('div');
  labelEl.className = 'label-3d empty-seat-hint';
  labelEl.textContent = '빈 자리';
  labelsContainer.appendChild(labelEl);

  seats.push({
    index: i,
    root: seatRoot,
    logBench,
    campChairGroup,
    sleepingMatGroup,
    hitMesh,
    x: 0,
    z: 0,
    angle: 0,
    lookAngle: 0,
    labelEl
  });
}

function layoutSeatsForCurrentConcept() {
  const concept = getConceptType();

  for (let i = 0; i < MAX_SEATS; i++) {
    const s = seats[i];
    if (concept === 'fire') {
      // Circle around campfire (radius 4.6)
      const angle = (i / MAX_SEATS) * Math.PI * 2;
      s.x = Math.cos(angle) * 4.6;
      s.z = Math.sin(angle) * 4.6;
      s.lookAngle = angle + Math.PI; // Face center fire
      s.root.position.set(s.x, 0, s.z);
      s.root.rotation.y = -angle + Math.PI / 2;

      s.logBench.visible = true;
      s.campChairGroup.visible = false;
      s.sleepingMatGroup.visible = false;
      s.labelEl.textContent = '빈 통나무 (앉기)';
    } else if (concept === 'water') {
      // Swiss Lake Shoreline arc looking North (-Z) toward Lake & Alps
      const t = (i - (MAX_SEATS - 1) / 2);
      s.x = t * 1.95;
      s.z = 3.2 + Math.abs(t) * 0.28 + (i % 2 === 1 ? 0.6 : 0);
      s.lookAngle = Math.PI; // Face -Z (toward Swiss Lake & Alps)
      s.root.position.set(s.x, 0, s.z);
      s.root.rotation.y = Math.PI;

      s.logBench.visible = false;
      // Show chair or grass depending on occupant or default alternating
      s.campChairGroup.visible = (i % 2 === 0);
      s.sleepingMatGroup.visible = false;
      s.labelEl.textContent = i % 2 === 0 ? '빈 캠핑 의자' : '호숫가 수풀 자리';
    } else if (concept === 'star') {
      // Gangwon-do Stargazing Valley: Semi-circle of sleeping mats facing North sky (-Z)
      const row = i < 7 ? 0 : 1;
      const idxInRow = row === 0 ? i - 3 : i - 9;
      s.x = idxInRow * 2.45;
      s.z = row === 0 ? 1.5 : 4.5;
      s.lookAngle = Math.PI;
      s.root.position.set(s.x, 0, s.z);
      s.root.rotation.y = Math.PI;

      s.logBench.visible = false;
      s.campChairGroup.visible = false;
      s.sleepingMatGroup.visible = true;
      s.labelEl.textContent = '빈 캠핑 매트 (눕기/앉기)';
    }
  }
}

// ====================================================
// 5. 3D CAMPER AVATAR BUILDER (WITH VISIBLE ARTICULATED LEGS!)
// ====================================================
const camperMeshes = new Map(); // userId -> { group, labelEl, bodyParts, walkState, ... }
const camperHitMeshes = [];

function createCamper3D(user) {
  const group = new THREE.Group();
  const bodyRoot = new THREE.Group(); // Pivots for sitting vs lying flat on mat!
  group.add(bodyRoot);

  const coatColor = new THREE.Color(user.color || '#e07a5f');
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x2b3340, roughness: 0.85 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x3d271d, roughness: 0.9 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdfc4, roughness: 0.65 });
  const coatMat = new THREE.MeshStandardMaterial({ color: coatColor, roughness: 0.72 });

  // --- VISIBLE ARTICULATED LEGS (허벅지 + 종아리 + 신발) ---
  function buildLeg(sideSign) {
    const hipPivot = new THREE.Group();
    hipPivot.position.set(sideSign * 0.17, 0.52, 0);

    // Thigh (허벅지)
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.095, 0.42, 10), pantsMat);
    thigh.position.set(0, -0.19, 0);
    thigh.castShadow = true;
    hipPivot.add(thigh);

    // Knee Pivot (무릎 관절)
    const kneePivot = new THREE.Group();
    kneePivot.position.set(0, -0.38, 0);
    hipPivot.add(kneePivot);

    // Calf / Lower Leg (종아리)
    const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.075, 0.38, 10), pantsMat);
    calf.position.set(0, -0.18, 0);
    calf.castShadow = true;
    kneePivot.add(calf);

    // Shoe (캠핑 부츠/신발)
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.11, 0.26), shoeMat);
    shoe.position.set(0, -0.36, 0.05);
    shoe.castShadow = true;
    kneePivot.add(shoe);

    return { hipPivot, kneePivot };
  }

  const leftLeg = buildLeg(-1);
  const rightLeg = buildLeg(1);
  bodyRoot.add(leftLeg.hipPivot, rightLeg.hipPivot);

  // --- TORSO (상체 코트) ---
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 0.78, 14), coatMat);
  torso.position.y = 0.88;
  torso.castShadow = true;
  bodyRoot.add(torso);

  // Scarf (목도리)
  const scarf = new THREE.Mesh(
    new THREE.TorusGeometry(0.22, 0.065, 8, 16),
    new THREE.MeshStandardMaterial({ color: 0xf4e8c1, roughness: 0.8 })
  );
  scarf.rotation.x = Math.PI / 2;
  scarf.position.y = 1.26;
  bodyRoot.add(scarf);

  // --- HEAD & BEANIE (머리 & 비니 모자) ---
  const headGroup = new THREE.Group();
  headGroup.position.y = 1.48;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), skinMat);
  head.castShadow = true;
  headGroup.add(head);

  // Calm eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x221a15 });
  const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.026, 6, 6), eyeMat);
  leftEye.position.set(-0.08, 0.03, 0.22);
  const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.026, 6, 6), eyeMat);
  rightEye.position.set(0.08, 0.03, 0.22);
  headGroup.add(leftEye, rightEye);

  const beanie = new THREE.Mesh(
    new THREE.SphereGeometry(0.265, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56),
    new THREE.MeshStandardMaterial({ color: coatColor.clone().multiplyScalar(0.65), roughness: 0.9 })
  );
  beanie.position.y = 0.03;
  headGroup.add(beanie);
  bodyRoot.add(headGroup);

  // --- ARMS & HANDS (양팔 + 손) ---
  function buildArm(sideSign) {
    const shoulder = new THREE.Group();
    shoulder.position.set(sideSign * 0.28, 1.16, 0.04);
    const armCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.058, 0.42, 8), coatMat);
    armCyl.rotation.x = Math.PI / 2;
    armCyl.position.set(0, -0.04, 0.2);
    shoulder.add(armCyl);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), skinMat);
    hand.position.set(0, -0.04, 0.42);
    shoulder.add(hand);
    return shoulder;
  }

  const leftArmGroup = buildArm(-1);
  const rightArmGroup = buildArm(1);
  bodyRoot.add(leftArmGroup, rightArmGroup);

  // --- PROPS (커피 머그컵 & 보온병, 마시멜로 꼬치, 선향불꽃, 망원경) ---
  // 1. Warm Mug + Thermos Flask (보온병과 따뜻한 커피잔)
  const coffeeGroup = new THREE.Group();
  const mug = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.075, 0.17, 12),
    new THREE.MeshStandardMaterial({ color: 0xf6efe6, roughness: 0.3 })
  );
  coffeeGroup.add(mug);
  const thermos = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 0.32, 12),
    new THREE.MeshStandardMaterial({ color: 0x3a5a40, metalness: 0.4, roughness: 0.4 })
  );
  thermos.position.set(-0.28, -0.35, -0.15);
  coffeeGroup.add(thermos);
  coffeeGroup.position.set(0, 1.05, 0.56);
  coffeeGroup.visible = false;
  bodyRoot.add(coffeeGroup);

  // 2. Marshmallow Stick (마시멜로 꼬치 - 불 가까이 굽기)
  const mallowGroup = new THREE.Group();
  const stick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, 0.92, 6),
    new THREE.MeshStandardMaterial({ color: 0xd4a373 })
  );
  stick.rotation.x = Math.PI / 2;
  stick.position.z = 0.44;
  mallowGroup.add(stick);
  const mallowMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.085, 0.16, 12),
    new THREE.MeshStandardMaterial({ color: 0xfffdf7, roughness: 0.4 })
  );
  mallowMesh.rotation.x = Math.PI / 2;
  mallowMesh.position.z = 0.9;
  mallowGroup.add(mallowMesh);
  mallowGroup.position.set(0.18, 1.02, 0.36);
  mallowGroup.visible = false;
  bodyRoot.add(mallowGroup);

  // 3. Sparkler (선향불꽃)
  const sparklerGroup = new THREE.Group();
  const spWire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.01, 0.7, 6),
    new THREE.MeshBasicMaterial({ color: 0xaaaaaa })
  );
  spWire.rotation.x = Math.PI / 2.2;
  spWire.position.z = 0.34;
  sparklerGroup.add(spWire);
  const spTip = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffea79 })
  );
  spTip.position.set(0, -0.05, 0.68);
  sparklerGroup.add(spTip);
  sparklerGroup.position.set(-0.18, 1.04, 0.35);
  sparklerGroup.visible = false;
  bodyRoot.add(sparklerGroup);

  // 4. Stargazing Telescope (별멍 천체 망원경)
  const telescopeGroup = new THREE.Group();
  const tube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.1, 0.95, 12),
    new THREE.MeshStandardMaterial({ color: 0xeae2b7, metalness: 0.5, roughness: 0.3 })
  );
  tube.rotation.x = Math.PI / 3.1;
  tube.position.set(0, 1.48, 0.68);
  telescopeGroup.add(tube);
  for (let t = 0; t < 3; t++) {
    const tLeg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 1.45, 6),
      new THREE.MeshStandardMaterial({ color: 0x2b2d42 })
    );
    const ta = (t / 3) * Math.PI * 2;
    tLeg.position.set(Math.cos(ta) * 0.22, 0.68, 0.68 + Math.sin(ta) * 0.22);
    tLeg.rotation.z = Math.cos(ta) * 0.22;
    tLeg.rotation.x = Math.sin(ta) * 0.22;
    telescopeGroup.add(tLeg);
  }
  telescopeGroup.visible = false;
  group.add(telescopeGroup);

  // Hitbox for clicking camper
  const hitBox = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.55, 2.0, 8),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitBox.position.y = 1.0;
  hitBox.userData = { camperId: user.id, seatIndex: user.seatIndex };
  group.add(hitBox);
  camperHitMeshes.push(hitBox);

  const labelEl = document.createElement('div');
  labelEl.className = 'label-3d camper-tag';
  labelsContainer.appendChild(labelEl);

  scene.add(group);

  return {
    id: user.id,
    group,
    bodyRoot,
    headGroup,
    leftLeg,
    rightLeg,
    leftArmGroup,
    rightArmGroup,
    coffeeGroup,
    mallowGroup,
    mallowMesh,
    sparklerGroup,
    spTip,
    telescopeGroup,
    hitBox,
    labelEl,
    seatIndex: user.seatIndex,
    action: user.action || 'idle',
    posture: user.posture || 'sit',
    name: user.name,
    color: user.color,
    nodUntil: 0,
    waveUntil: 0,
    offeringUntil: 0,
    offeringGiftType: 'coffee',
    receivingUntil: 0,
    roastStartTime: Date.now(),
    walkState: null // { targetX, targetZ, isWalking, returnToSeatAfterOffer, onArrive }
  };
}

function syncCampers3D() {
  const activeIds = new Set();
  const occupiedSeats = new Set();
  const concept = getConceptType();

  state.users.forEach((u) => {
    activeIds.add(u.id);
    occupiedSeats.add(u.seatIndex);

    let camper = camperMeshes.get(u.id);
    if (!camper) {
      camper = createCamper3D(u);
      camperMeshes.set(u.id, camper);
    }

    const prevSeat = camper.seatIndex;
    camper.seatIndex = u.seatIndex;
    camper.action = u.action || 'idle';
    if (u.posture) {
      camper.posture = u.posture;
    } else {
      camper.posture = concept === 'star' ? 'lie' : (concept === 'water' ? (u.seatIndex % 2 === 0 ? 'chair' : 'grass') : 'sit');
    }
    camper.name = u.name;
    camper.hitBox.userData.seatIndex = u.seatIndex;

    const seat = seats[u.seatIndex] || seats[0];
    if (prevSeat !== u.seatIndex || (!camper.walkState && camper.group.position.lengthSq() < 0.01)) {
      camper.walkState = null;
      camper.group.position.set(seat.x, 0, seat.z);
      camper.group.rotation.y = seat.lookAngle;
    }

    // Update Swiss Lake chair vs grass visibility for this seat
    if (concept === 'water') {
      seat.campChairGroup.visible = (camper.posture !== 'grass');
    }

    const isMe = u.id === state.clientId;
    camper.labelEl.className = `label-3d camper-tag ${isMe ? 'is-me' : ''}`;
    const actionBadge =
      camper.action === 'coffee' ? ' ☕' :
      camper.action === 'mallow' ? ' 🍡' :
      camper.action === 'sparkler' ? ' 🎇' :
      camper.action === 'stargaze' ? ' 🔭' :
      camper.action === 'meditate' ? ' 🧘' : '';
    camper.labelEl.textContent = isMe ? `나 · ${u.name}${actionBadge}` : `${u.name}${actionBadge}`;
  });

  for (const [id, camper] of camperMeshes.entries()) {
    if (!activeIds.has(id)) {
      scene.remove(camper.group);
      camper.labelEl.remove();
      const idx = camperHitMeshes.indexOf(camper.hitBox);
      if (idx !== -1) camperHitMeshes.splice(idx, 1);
      camperMeshes.delete(id);
    }
  }

  seats.forEach((s) => {
    if (occupiedSeats.has(s.index)) {
      s.labelEl.style.opacity = '0';
    } else {
      s.labelEl.style.opacity = state.zenMode ? '0' : '0.7';
    }
  });
}

// ====================================================
// 6. GENTLE HAND-TO-HAND GIFT OFFERING & RECEIVING (NO THROWING!)
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

// Walk gently over to neighbor and hold out gift with two hands
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

  // Stand point right beside the recipient
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
      // Face the recipient and hold out cup/marshmallow with both hands
      giver.group.rotation.y = Math.atan2(targetPosSeat.x - standX, targetPosSeat.z - standZ);
      giver.offeringUntil = Date.now() + 6500;
      spawnFloatingHeartOrEmoji(targetSeat, giftType === 'coffee' ? '☕🤲' : '🍡🤲');

      // If recipient is ME, show the gentle Accept Banner!
      if (targetSeat === state.mySeatIndex && fromSeat !== state.mySeatIndex) {
        state.pendingGiftOffer = { fromSeat, giftType, actorName };
        giftOfferIcon.textContent = giftType === 'coffee' ? '☕' : '🍡';
        const itemLabel = giftType === 'coffee' ? '따뜻한 보온병 커피' : '노릇하게 구운 마시멜로';
        giftOfferMessage.innerHTML = `<strong>${actorName}</strong>님이 다가와 두 손으로 ${itemLabel}를 건넵니다.`;
        giftOfferBanner.classList.remove('hidden');
        soundEngine.playWarmChime();
      } else if (!receiver || receiver.id.startsWith('sim_')) {
        // Simulated peaceful neighbor polite auto-accept after 1.6s
        setTimeout(() => {
          completeGiftAcceptance(fromSeat, targetSeat, giftType);
        }, 1600);
      }
    }
  };
}

// Both giver and receiver bow gently and hold the warm item
function completeGiftAcceptance(fromSeat, targetSeat, giftType = 'coffee') {
  let giver = null;
  let receiver = null;
  for (const c of camperMeshes.values()) {
    if (c.seatIndex === fromSeat) giver = c;
    if (c.seatIndex === targetSeat) receiver = c;
  }

  soundEngine.playWarmChime();
  spawnFloatingHeartOrEmoji(targetSeat, giftType === 'coffee' ? '☕🙏😊' : '🍡🙏😊');

  if (receiver) {
    receiver.receivingUntil = Date.now() + 3500;
    receiver.nodUntil = Date.now() + 2400;
    receiver.action = giftType === 'coffee' ? 'coffee' : 'mallow';
  }

  if (giver) {
    giver.offeringUntil = 0;
    giver.nodUntil = Date.now() + 2000;
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
    }, 1100);
  }
}

acceptGiftBtn.addEventListener('click', () => {
  giftOfferBanner.classList.add('hidden');
  if (!state.pendingGiftOffer) return;
  const { fromSeat, giftType, actorName } = state.pendingGiftOffer;
  state.pendingGiftOffer = null;

  state.myAction = giftType === 'coffee' ? 'coffee' : 'mallow';
  sendServerAction({ type: 'pose', action: state.myAction, posture: state.myPosture });
  sendServerAction({ type: 'acceptGift', fromSeat, giftType });
  completeGiftAcceptance(fromSeat, state.mySeatIndex, giftType);
  showRitualToast(`🙏 ${actorName}님이 건넨 따뜻한 마음을 두 손으로 받았습니다.`);
});

declineGiftBtn.addEventListener('click', () => {
  giftOfferBanner.classList.add('hidden');
  state.pendingGiftOffer = null;
  showRitualToast('정중하게 마음만 받았습니다.');
});

// ====================================================
// 7. PEACEFUL 3D PARTICLE & RITUAL EFFECTS
// ====================================================
const activeEffects = [];

function spawnFloatingHeartOrEmoji(seatIndex, emojiText = '😊🙏') {
  const seat = seats[seatIndex] || seats[0];
  const el = document.createElement('div');
  el.className = 'label-3d nod-emoji';
  el.textContent = emojiText;
  labelsContainer.appendChild(el);

  const startPos = new THREE.Vector3(seat.x, 2.3, seat.z);
  const startTime = Date.now();

  activeEffects.push({
    update: () => {
      const t = (Date.now() - startTime) / 2200;
      if (t >= 1) {
        el.remove();
        return false;
      }
      const pos = startPos.clone();
      pos.y += t * 1.1;
      projectToScreen(pos, el);
      el.style.opacity = String(1 - t);
      return true;
    }
  });
}

function spawnFlyingLogEffect(fromSeatIndex) {
  const seat = seats[fromSeatIndex] || seats[0];
  const logMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.9, 8), woodMat);
  logMesh.position.set(seat.x, 1.1, seat.z);
  scene.add(logMesh);

  const startPos = logMesh.position.clone();
  const endPos = new THREE.Vector3(0, 0.45, 0);
  const startTime = Date.now();

  activeEffects.push({
    update: () => {
      const t = Math.min(1, (Date.now() - startTime) / 700);
      logMesh.position.lerpVectors(startPos, endPos, t);
      logMesh.position.y += Math.sin(t * Math.PI) * 1.6;
      logMesh.rotation.x += 0.12;
      if (t >= 1) {
        scene.remove(logMesh);
        fireLight.intensity = 4.2;
        return false;
      }
      return true;
    }
  });
}

function spawnWishLanternEffect(fromSeatIndex) {
  const seat = seats[fromSeatIndex] || seats[0];
  const group = new THREE.Group();
  const glow = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.18, 0.42, 10),
    new THREE.MeshBasicMaterial({ color: 0xffb74d, transparent: true, opacity: 0.9 })
  );
  group.add(glow);

  const concept = getConceptType();
  if (concept === 'water') {
    group.position.set(seat.x * 0.6, 0.18, 0.5);
  } else {
    group.position.set(seat.x * 0.7, 1.3, seat.z * 0.7);
  }
  scene.add(group);
  const startTime = Date.now();

  activeEffects.push({
    update: () => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed > 14) {
        scene.remove(group);
        return false;
      }
      if (concept === 'water') {
        // Drift out onto the Swiss Lake toward the Alps
        group.position.z -= 0.025;
        group.position.x += Math.sin(elapsed * 1.2) * 0.008;
        group.position.y = 0.14 + Math.sin(elapsed * 3) * 0.03;
      } else {
        group.position.y += 0.028;
        group.position.x += Math.sin(elapsed * 1.1) * 0.012;
      }
      glow.material.opacity = Math.max(0, 0.92 - elapsed / 14);
      return true;
    }
  });
}

function spawnLakeRippleEffect(fromSeatIndex) {
  const seat = seats[fromSeatIndex] || seats[0];
  const ringGeo = new THREE.RingGeometry(0.15, 0.26, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xb8f2ff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(seat.x * 0.5, 0.08, -6 - Math.random() * 6);
  scene.add(ring);

  const startTime = Date.now();
  soundEngine.playSingingBowlNote(432);

  activeEffects.push({
    update: () => {
      const t = (Date.now() - startTime) / 2800;
      if (t >= 1) {
        scene.remove(ring);
        ringGeo.dispose();
        ringMat.dispose();
        return false;
      }
      const scale = 1 + t * 14;
      ring.scale.set(scale, scale, 1);
      ringMat.opacity = (1 - t) * 0.8;
      return true;
    }
  });
}

function spawnShootingStarEffect() {
  const startX = (Math.random() - 0.5) * 55;
  const startY = 30 + Math.random() * 18;
  const startZ = -22 - Math.random() * 25;
  const endX = startX + (Math.random() > 0.5 ? 26 : -26);
  const endY = startY - 12 - Math.random() * 6;
  const endZ = startZ + (Math.random() - 0.5) * 10;

  const trailGeo = new THREE.CylinderGeometry(0.02, 0.14, 4.5, 8);
  trailGeo.rotateZ(Math.PI / 2);
  const trailMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending
  });
  const starMesh = new THREE.Mesh(trailGeo, trailMat);
  scene.add(starMesh);

  const sVec = new THREE.Vector3(startX, startY, startZ);
  const eVec = new THREE.Vector3(endX, endY, endZ);
  const startTime = Date.now();

  activeEffects.push({
    update: () => {
      const t = (Date.now() - startTime) / 950;
      if (t >= 1) {
        scene.remove(starMesh);
        trailGeo.dispose();
        trailMat.dispose();
        return false;
      }
      starMesh.position.lerpVectors(sVec, eVec, t);
      starMesh.lookAt(eVec);
      trailMat.opacity = Math.sin(t * Math.PI);
      return true;
    }
  });
}

// ====================================================
// 8. THEME & ENVIRONMENT SWITCHER (불멍 / 물멍 / 별멍)
// ====================================================
function applyRoomEnvironment(room) {
  const meta = ROOM_META[room] || ROOM_META['fire-01'];
  const concept = getConceptType(room);

  document.getElementById('currentRoomName').textContent = meta.name;
  document.getElementById('currentRegionTag').textContent = `${state.region.toUpperCase()} · #${state.instance}`;
  const miniIcon = document.getElementById('modeMiniIcon');
  if (miniIcon) miniIcon.textContent = meta.icon;

  // Highlight active tabs
  document.querySelectorAll('.concept-tab').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.room === room);
  });
  document.querySelectorAll('.mode-chip').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.switchRoom === room);
  });
  document.querySelectorAll('.room-item').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.room === room);
  });

  // Toggle 3D World Groups
  fireWorldGroup.visible = (concept === 'fire');
  waterWorldGroup.visible = (concept === 'water');
  starWorldGroup.visible = (concept === 'star');

  if (concept === 'fire') {
    const isRain = room === 'rain-04';
    const bgHex = isRain ? 0x080c14 : 0x0b0811;
    scene.background.setHex(bgHex);
    scene.fog.color.setHex(bgHex);
    scene.fog.density = 0.015;
    groundMat.color.setHex(0x181310);
    hemiLight.intensity = 0.55;
    sunMoonLight.intensity = 0.25;
    fireLight.visible = true;
    starField.visible = true;
    starMat.opacity = isRain ? 0.15 : 0.65;

    state.myPosture = 'sit';
    camControl.targetPhi = 0.42;
    camControl.targetRadius = 14.2;
    camControl.targetLookAtY = 1.25;
  } else if (concept === 'water') {
    fireLight.visible = false;
    updateSwissLakeDayNightVisuals();
    if (state.myPosture !== 'chair' && state.myPosture !== 'grass') {
      state.myPosture = state.mySeatIndex % 2 === 0 ? 'chair' : 'grass';
    }
    // Position camera behind the shoreline looking across the Swiss Lake & Alps
    camControl.targetTheta = 0.0;
    camControl.targetPhi = 0.34;
    camControl.targetRadius = 14.8;
    camControl.targetLookAtY = 1.8;
  } else if (concept === 'star') {
    // Pitch-black Gangwon-do night sky filled with pouring stars
    scene.background.setHex(0x020309);
    scene.fog.color.setHex(0x020309);
    scene.fog.density = 0.004;
    groundMat.color.setHex(0x090d16);
    hemiLight.color.setHex(0x2c3e66);
    hemiLight.groundColor.setHex(0x05070c);
    hemiLight.intensity = 0.65;
    sunMoonLight.color.setHex(0x9bbcff);
    sunMoonLight.intensity = 0.45;
    fireLight.visible = false;
    starField.visible = true;
    starMat.opacity = 1.0;

    if (state.myPosture !== 'lie' && state.myPosture !== 'sit') {
      state.myPosture = 'lie';
    }
    updateStarCameraForPosture();
  }

  layoutSeatsForCurrentConcept();
  renderConceptActionDock();
  syncCampers3D();

  // Apply peaceful default audio balance
  const sd = meta.soundDefaults;
  document.getElementById('volFire').value = sd.fire;
  document.getElementById('valFire').textContent = `${sd.fire}%`;
  document.getElementById('volWind').value = sd.wind;
  document.getElementById('valWind').textContent = `${sd.wind}%`;
  document.getElementById('volRain').value = sd.rain;
  document.getElementById('valRain').textContent = `${sd.rain}%`;
  document.getElementById('volNight').value = sd.night;
  document.getElementById('valNight').textContent = `${sd.night}%`;

  soundEngine.setVolume('fire', sd.fire);
  soundEngine.setVolume('wind', sd.wind);
  soundEngine.setVolume('rain', sd.rain);
  soundEngine.setVolume('night', sd.night);
}

function updateSwissLakeDayNightVisuals() {
  if (getConceptType() !== 'water') return;
  if (state.waterDayMode) {
    // Sunny Swiss Alpine Emerald Lake (낮: 에메랄드 호수와 만년설)
    scene.background.setHex(0x68a6c8);
    scene.fog.color.setHex(0x8bc1db);
    scene.fog.density = 0.006;
    groundMat.color.setHex(0x2d4c2b); // Lush alpine meadow shore
    swissLakeMat.color.setHex(0x169bb8);
    alpsRockMat.color.setHex(0x4a5d70);
    alpsSnowMat.color.setHex(0xffffff);
    hemiLight.color.setHex(0xdff4ff);
    hemiLight.groundColor.setHex(0x3a5a36);
    hemiLight.intensity = 1.15;
    sunMoonLight.color.setHex(0xfff6e0);
    sunMoonLight.intensity = 1.1;
    starField.visible = false;
  } else {
    // Starry Moonlight Swiss Lake (밤: 달빛 비치는 고요한 호수)
    scene.background.setHex(0x071324);
    scene.fog.color.setHex(0x071324);
    scene.fog.density = 0.01;
    groundMat.color.setHex(0x102019);
    swissLakeMat.color.setHex(0x0b3b54);
    alpsRockMat.color.setHex(0x1d2836);
    alpsSnowMat.color.setHex(0xc8deff);
    hemiLight.color.setHex(0x3b5980);
    hemiLight.groundColor.setHex(0x0a1410);
    hemiLight.intensity = 0.65;
    sunMoonLight.color.setHex(0xa8caff);
    sunMoonLight.intensity = 0.6;
    starField.visible = true;
    starMat.opacity = 0.85;
  }
}

function updateStarCameraForPosture() {
  if (getConceptType() !== 'star') return;
  if (state.myPosture === 'lie') {
    // Low angle looking across the lying character up into the starry night sky & constellations
    camControl.targetTheta = 0.0;
    camControl.targetPhi = 0.16;
    camControl.targetRadius = 11.5;
    camControl.targetLookAtY = 4.2;
  } else {
    camControl.targetPhi = 0.28;
    camControl.targetRadius = 13.0;
    camControl.targetLookAtY = 2.8;
  }
}

// ====================================================
// 9. DYNAMIC CONCEPT-SPECIFIC ACTION DOCK
// ====================================================
const dockActionsContainer = document.getElementById('dockActionsContainer');
const dockHintText = document.getElementById('dockHintText');

function renderConceptActionDock() {
  const concept = getConceptType();
  const actions = CONCEPT_DOCK_ACTIONS[concept] || CONCEPT_DOCK_ACTIONS.fire;
  dockActionsContainer.innerHTML = '';

  actions.forEach((act) => {
    const btn = document.createElement('button');
    btn.className = 'action-btn';
    btn.dataset.actionId = act.id;

    // Dynamic label state
    let label = act.label;
    let icon = act.icon;
    if (act.id === 'toggleDayNight') {
      icon = state.waterDayMode ? '☀️' : '🌙';
      label = state.waterDayMode ? '스위스 낮 (윤슬)' : '스위스 밤 (달빛)';
    } else if (act.id === 'toggleWaterSeat') {
      icon = state.myPosture === 'grass' ? '🌿' : '🪑';
      label = state.myPosture === 'grass' ? '수풀 앉기 중' : '캠핑의자 앉기 중';
    } else if (act.id === 'toggleLieSit') {
      icon = state.myPosture === 'lie' ? '🛌' : '🧘';
      label = state.myPosture === 'lie' ? '매트에 누워 별보기' : '매트에 앉아 별보기';
    }

    const isActive =
      (act.id === 'hands' && state.myAction === 'hands') ||
      (act.id === 'mallow' && state.myAction === 'mallow') ||
      (act.id === 'sparkler' && state.myAction === 'sparkler') ||
      (act.id === 'meditate' && state.myAction === 'meditate') ||
      (act.id === 'stargaze' && state.myAction === 'stargaze') ||
      (act.id === 'toggleConstellation' && state.showConstellations);

    if (isActive) btn.classList.add('active-pose');

    btn.innerHTML = `
      <span class="act-icon">${icon}</span>
      <span class="act-label">${label}</span>
      <span class="act-key">${act.key}</span>
    `;
    btn.addEventListener('click', () => triggerConceptAction(act.id));
    dockActionsContainer.appendChild(btn);
  });

  if (concept === 'fire') {
    dockHintText.textContent = '통나무 클릭: 자리 이동 · 옆사람 클릭: 다가가 커피/마시멜로 두 손으로 건네기';
  } else if (concept === 'water') {
    dockHintText.textContent = '낮/밤 전환으로 스위스 호수의 에메랄드 윤슬과 달빛을 모두 느껴보세요';
  } else {
    dockHintText.textContent = '매트에 누워 밤하늘 별자리와 쏟아지는 별똥별을 바라보며 마음을 비워보세요';
  }
}

function triggerConceptAction(actionId) {
  soundEngine.init();
  const myCamper = camperMeshes.get(state.clientId);

  switch (actionId) {
    case 'wave': {
      if (myCamper) myCamper.waveUntil = Date.now() + 2600;
      spawnFloatingHeartOrEmoji(state.mySeatIndex, '👋😊');
      sendServerAction({ type: 'wave' });
      showRitualToast('👋 주변 사람들에게 다정하게 손을 흔들어 인사합니다.');
      break;
    }
    case 'hands': {
      state.myAction = state.myAction === 'hands' ? 'idle' : 'hands';
      sendServerAction({ type: 'pose', action: state.myAction, posture: state.myPosture });
      renderConceptActionDock();
      showRitualToast(state.myAction === 'hands' ? '🤲 모닥불 가까이 두 손을 뻗어 따뜻하게 녹입니다.' : '편안한 자세로 돌아갑니다.');
      break;
    }
    case 'log': {
      spawnFlyingLogEffect(state.mySeatIndex);
      sendServerAction({ type: 'throwLog' });
      showRitualToast('🪵 모닥불에 장작을 조심스레 더해 온기를 나눕니다.');
      break;
    }
    case 'mallow': {
      state.myAction = state.myAction === 'mallow' ? 'idle' : 'mallow';
      if (myCamper) myCamper.roastStartTime = Date.now();
      sendServerAction({ type: 'pose', action: state.myAction, posture: state.myPosture });
      renderConceptActionDock();
      showRitualToast('🍡 모닥불 가까이 마시멜로를 노릇노릇하게 굽습니다.');
      break;
    }
    case 'giveMallow':
    case 'giveCoffee': {
      const giftType = actionId === 'giveCoffee' ? 'coffee' : 'mallow';
      const neighbor = findNearestNeighborCamper(state.mySeatIndex);
      const targetSeat = neighbor ? neighbor.seatIndex : (state.mySeatIndex + 1) % MAX_SEATS;
      const targetName = neighbor ? neighbor.name : '옆자리 캠퍼';

      animateWalkAndOfferGift(state.mySeatIndex, targetSeat, giftType, state.myNickname);
      sendServerAction({ type: 'offerGift', targetSeat, giftType });
      showRitualToast(
        giftType === 'coffee'
          ? `☕ ${targetName}님에게 걸어가 보온병의 따뜻한 커피를 두 손으로 건넵니다.`
          : `🎁 ${targetName}님에게 걸어가 잘 구운 마시멜로를 두 손으로 건넵니다.`
      );
      break;
    }
    case 'sparkler': {
      state.myAction = state.myAction === 'sparkler' ? 'idle' : 'sparkler';
      sendServerAction({ type: 'pose', action: state.myAction, posture: state.myPosture });
      renderConceptActionDock();
      showRitualToast('🎇 타닥타닥 잔잔하게 타오르는 선향불꽃을 바라봅니다.');
      break;
    }
    case 'toggleDayNight': {
      state.waterDayMode = !state.waterDayMode;
      updateSwissLakeDayNightVisuals();
      renderConceptActionDock();
      sendServerAction({ type: 'toggleWaterDayNight', waterDayMode: state.waterDayMode });
      showRitualToast(
        state.waterDayMode
          ? '☀️ 스위스 알프스의 맑은 낮, 에메랄드빛 호수에 윤슬이 반짝입니다.'
          : '🌙 스위스 알프스의 고요한 밤, 만년설과 호수 위에 달빛이 내려앉습니다.'
      );
      break;
    }
    case 'toggleWaterSeat': {
      state.myPosture = state.myPosture === 'grass' ? 'chair' : 'grass';
      if (myCamper) myCamper.posture = state.myPosture;
      const mySeat = seats[state.mySeatIndex];
      if (mySeat) mySeat.campChairGroup.visible = (state.myPosture === 'chair');
      sendServerAction({ type: 'posture', posture: state.myPosture });
      renderConceptActionDock();
      showRitualToast(
        state.myPosture === 'chair'
          ? '🪑 편안한 우드 캠핑 의자에 기대어 스위스 호수를 바라봅니다.'
          : '🌿 호숫가 부드러운 수풀 위에 다리를 뻗고 앉아 물결을 느낍니다.'
      );
      break;
    }
    case 'meditate': {
      state.myAction = state.myAction === 'meditate' ? 'idle' : 'meditate';
      soundEngine.playSingingBowlNote(432);
      sendServerAction({ type: 'pose', action: state.myAction, posture: state.myPosture });
      renderConceptActionDock();
      showRitualToast('🧘 깊게 숨을 들이마시고 내쉬며 내면의 평화(Inner Peace)를 느낍니다.');
      break;
    }
    case 'lantern': {
      spawnWishLanternEffect(state.mySeatIndex);
      sendServerAction({ type: 'floatLantern' });
      showRitualToast('🪷 잔잔한 스위스 호수 위로 따뜻한 소원 연등을 띄워 보냅니다.');
      break;
    }
    case 'skipStone': {
      spawnLakeRippleEffect(state.mySeatIndex);
      sendServerAction({ type: 'skipStone' });
      showRitualToast('🪨 에메랄드빛 호수 위에 맑고 고요한 물결 파문이 번져갑니다.');
      break;
    }
    case 'toggleLieSit': {
      state.myPosture = state.myPosture === 'lie' ? 'sit' : 'lie';
      if (myCamper) myCamper.posture = state.myPosture;
      updateStarCameraForPosture();
      sendServerAction({ type: 'posture', posture: state.myPosture });
      renderConceptActionDock();
      showRitualToast(
        state.myPosture === 'lie'
          ? '🛌 캠핑 매트에 편안히 누워 강원도 산골짜기 밤하늘에 쏟아지는 별을 바라봅니다.'
          : '🧘 캠핑 매트 위에 일어나 앉아 밤공기를 마십니다.'
      );
      break;
    }
    case 'stargaze': {
      state.myAction = state.myAction === 'stargaze' ? 'idle' : 'stargaze';
      if (state.myAction === 'stargaze') {
        state.myPosture = 'sit';
        updateStarCameraForPosture();
      }
      sendServerAction({ type: 'pose', action: state.myAction, posture: state.myPosture });
      renderConceptActionDock();
      showRitualToast(
        state.myAction === 'stargaze'
          ? '🔭 천체 망원경으로 밤하늘 깊은 곳의 성단과 별자리를 관측합니다.'
          : '망원경 관측을 마치고 밤하늘 전체를 바라봅니다.'
      );
      break;
    }
    case 'shootingStar': {
      spawnShootingStarEffect();
      setTimeout(spawnShootingStarEffect, 450);
      sendServerAction({ type: 'shootingStar' });
      soundEngine.playSingingBowlNote(512);
      showRitualToast('🌠 새까만 산골짜기 밤하늘을 가로지르는 별똥별에 조용히 소원을 빕니다.');
      break;
    }
    case 'toggleConstellation': {
      state.showConstellations = !state.showConstellations;
      constellationGroup.visible = state.showConstellations;
      renderConceptActionDock();
      showRitualToast(
        state.showConstellations
          ? '✨ 밤하늘의 별자리 선과 이름을 표시합니다.'
          : '✨ 별자리 선을 숨기고 순수한 밤하늘 별빛만 감상합니다.'
      );
      break;
    }
    case 'worry': {
      document.getElementById('worryModal').classList.remove('hidden');
      break;
    }
  }
}

// ====================================================
// 10. ANIMATION LOOP (3D LEGS, LYING POSTURE, WATER, STARS)
// ====================================================
const clock = new THREE.Clock();

function projectToScreen(pos3D, domElem) {
  const v = pos3D.clone().project(camera);
  if (v.z > 1) {
    domElem.style.opacity = '0';
    return;
  }
  const x = (v.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-(v.y * 0.5) + 0.5) * window.innerHeight;
  domElem.style.left = `${x}px`;
  domElem.style.top = `${y}px`;
}

function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();
  const now = Date.now();
  const concept = getConceptType();

  // Smooth Camera Interpolation
  camControl.theta += (camControl.targetTheta - camControl.theta) * 0.07;
  camControl.phi += (camControl.targetPhi - camControl.phi) * 0.07;
  camControl.radius += (camControl.targetRadius - camControl.radius) * 0.07;
  camControl.lookAtY += (camControl.targetLookAtY - camControl.lookAtY) * 0.07;

  const camX = camControl.radius * Math.sin(camControl.theta) * Math.cos(camControl.phi);
  const camY = Math.max(0.8, camControl.radius * Math.sin(camControl.phi));
  const camZ = camControl.radius * Math.cos(camControl.theta) * Math.cos(camControl.phi);
  camera.position.set(camX, camY, camZ);
  camera.lookAt(0, camControl.lookAtY, concept === 'water' ? -6 : (concept === 'star' ? -8 : 0));

  // Concept 1: Animate Campfire Flames
  if (concept === 'fire') {
    const heatScale = 0.85 + (state.fireHeat - 650) / 900;
    flameCones.forEach((cone) => {
      const u = cone.userData;
      cone.scale.y = heatScale * (1 + Math.sin(elapsed * u.speed + u.phase) * 0.22);
      cone.position.x = u.baseX + Math.sin(elapsed * 2.5 + u.phase) * 0.05;
      cone.position.z = u.baseZ + Math.cos(elapsed * 2.2 + u.phase) * 0.05;
    });
    fireLight.intensity = 2.6 + Math.sin(elapsed * 7.5) * 0.25 + Math.cos(elapsed * 13.0) * 0.15;
  }

  // Concept 2: Animate Swiss Lake Shimmer & Shore Reeds
  if (concept === 'water') {
    shimmerParticles.forEach((sh) => {
      sh.position.x = sh.userData.baseX + Math.sin(elapsed * sh.userData.speed + sh.userData.phase) * 0.35;
      sh.material.opacity = (state.waterDayMode ? 0.65 : 0.35) * (0.5 + 0.5 * Math.sin(elapsed * 3 + sh.userData.phase));
    });
    grassTufts.forEach((tuft) => {
      tuft.rotation.z = Math.sin(elapsed * 1.4 + tuft.userData.phase) * 0.08;
    });
  }

  // Concept 3: Occasional natural shooting stars in Gangwon-do sky
  if (concept === 'star') {
    starField.rotation.y = elapsed * 0.004;
    if (Math.random() < 0.005) {
      spawnShootingStarEffect();
    }
  }

  // Constellation Labels projection
  constellationLabelItems.forEach((item) => {
    if (concept === 'star' && state.showConstellations && !state.zenMode) {
      projectToScreen(item.pos, item.el);
      item.el.style.opacity = '0.82';
    } else {
      item.el.style.opacity = '0';
    }
  });

  // Update Seat Labels
  seats.forEach((s) => {
    projectToScreen(new THREE.Vector3(s.x, 0.7, s.z), s.labelEl);
  });

  // Update Campers (Walking, Sitting, Grass Sitting, Lying on Mat, Two-Hand Offering/Receiving)
  for (const camper of camperMeshes.values()) {
    const isWalking = Boolean(camper.walkState && camper.walkState.isWalking);
    const isOffering = now < camper.offeringUntil;
    const isReceiving = now < camper.receivingUntil;
    const isNodding = now < camper.nodUntil;
    const isWaving = now < camper.waveUntil;

    // 1. Walking Movement
    if (isWalking) {
      const ws = camper.walkState;
      const dx = ws.targetX - camper.group.position.x;
      const dz = ws.targetZ - camper.group.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.08) {
        const step = Math.min(dist, 0.065);
        camper.group.position.x += (dx / dist) * step;
        camper.group.position.z += (dz / dist) * step;
        camper.group.rotation.y = Math.atan2(dx, dz);
      } else {
        camper.group.position.set(ws.targetX, 0, ws.targetZ);
        ws.isWalking = false;
        if (ws.onArrive) ws.onArrive();
      }
    }

    // 2. Body Posture & Visible 3D Legs Articulation
    if (isWalking || isOffering) {
      // Standing upright
      camper.bodyRoot.position.set(0, 0.22, 0);
      camper.bodyRoot.rotation.set(0, 0, 0);
      const swing = isWalking ? Math.sin(elapsed * 9) * 0.45 : 0;
      camper.leftLeg.hipPivot.rotation.set(swing, 0, 0);
      camper.leftLeg.kneePivot.rotation.set(Math.max(0, -swing * 0.6), 0, 0);
      camper.rightLeg.hipPivot.rotation.set(-swing, 0, 0);
      camper.rightLeg.kneePivot.rotation.set(Math.max(0, swing * 0.6), 0, 0);
    } else if (concept === 'star' && camper.posture === 'lie' && camper.action !== 'stargaze') {
      // Lying flat on back on the camping mat looking up at the starry sky!
      camper.bodyRoot.position.set(0, 0.24, -0.58);
      camper.bodyRoot.rotation.set(-Math.PI / 2 + 0.14, 0, 0);
      // Legs stretched comfortably along the mat
      camper.leftLeg.hipPivot.rotation.set(0.08, 0, -0.06);
      camper.leftLeg.kneePivot.rotation.set(0.12, 0, 0);
      camper.rightLeg.hipPivot.rotation.set(0.08, 0, 0.06);
      camper.rightLeg.kneePivot.rotation.set(0.12, 0, 0);
    } else if (concept === 'water' && camper.posture === 'grass') {
      // Sitting directly in lakeside grass/reeds with legs stretched forward
      camper.bodyRoot.position.set(0, -0.18, 0);
      camper.bodyRoot.rotation.set(-0.08, 0, 0);
      camper.leftLeg.hipPivot.rotation.set(-Math.PI / 2 + 0.18, 0.12, 0);
      camper.leftLeg.kneePivot.rotation.set(0.25, 0, 0);
      camper.rightLeg.hipPivot.rotation.set(-Math.PI / 2 + 0.18, -0.12, 0);
      camper.rightLeg.kneePivot.rotation.set(0.25, 0, 0);
    } else {
      // Sitting on Log Bench or Swiss Camping Chair (Thighs horizontal, knees bent 90 deg, boots on ground)
      const isChair = concept === 'water' && camper.posture === 'chair';
      camper.bodyRoot.position.set(0, isChair ? 0.06 : 0.0, 0);
      // Lean forward closer to campfire when warming hands or roasting marshmallow!
      const leanForward = (concept === 'fire' && (camper.action === 'hands' || camper.action === 'mallow')) ? 0.24 : (isChair ? -0.1 : 0);
      camper.bodyRoot.rotation.set(leanForward, 0, 0);

      camper.leftLeg.hipPivot.rotation.set(-Math.PI / 2 + 0.08, 0.06, 0);
      camper.leftLeg.kneePivot.rotation.set(Math.PI / 2 - 0.1, 0, 0);
      camper.rightLeg.hipPivot.rotation.set(-Math.PI / 2 + 0.08, -0.06, 0);
      camper.rightLeg.kneePivot.rotation.set(Math.PI / 2 - 0.1, 0, 0);
    }

    // 3. Arms, Head & Props Animation
    camper.coffeeGroup.visible = false;
    camper.mallowGroup.visible = false;
    camper.sparklerGroup.visible = false;
    camper.telescopeGroup.visible = false;

    if (isOffering) {
      // Holding out gift politely with BOTH hands + gentle bow
      camper.leftArmGroup.rotation.set(-0.45, 0.28, 0);
      camper.rightArmGroup.rotation.set(-0.45, -0.28, 0);
      camper.headGroup.rotation.x = 0.22;
      if (camper.offeringGiftType === 'coffee') {
        camper.coffeeGroup.visible = true;
      } else {
        camper.mallowGroup.visible = true;
      }
    } else if (isReceiving) {
      // Receiving with two hands and bowing warmly
      camper.leftArmGroup.rotation.set(-0.4, 0.25, 0);
      camper.rightArmGroup.rotation.set(-0.4, -0.25, 0);
      camper.headGroup.rotation.x = Math.sin(elapsed * 6) * 0.2 + 0.2;
      camper.coffeeGroup.visible = (camper.action === 'coffee');
      camper.mallowGroup.visible = (camper.action === 'mallow');
    } else if (isWaving) {
      camper.rightArmGroup.rotation.set(-0.9, 0, Math.sin(elapsed * 12) * 0.45 - 0.4);
      camper.leftArmGroup.rotation.set(0.2, 0, 0);
    } else if (camper.action === 'hands' && concept === 'fire') {
      // Stretch both hands clearly forward toward the campfire flames
      const rub = Math.sin(elapsed * 4.5) * 0.06;
      camper.leftArmGroup.rotation.set(-0.35 + rub, 0.15, 0);
      camper.rightArmGroup.rotation.set(-0.35 - rub, -0.15, 0);
    } else if (camper.action === 'mallow') {
      camper.mallowGroup.visible = true;
      camper.rightArmGroup.rotation.set(-0.32 + Math.sin(elapsed * 2.5) * 0.04, -0.1, 0);
      camper.leftArmGroup.rotation.set(0.25, 0, 0);
      // Gradually toast marshmallow to golden brown
      const roastProgress = Math.min(1, (now - camper.roastStartTime) / 12000);
      camper.mallowMesh.material.color.lerpColors(new THREE.Color(0xfffdf7), new THREE.Color(0xd98a3c), roastProgress);
    } else if (camper.action === 'coffee') {
      camper.coffeeGroup.visible = true;
      const sip = Math.sin(elapsed * 1.4) > 0.7 ? -0.25 : 0;
      camper.leftArmGroup.rotation.set(-0.3 + sip, 0.25, 0);
      camper.rightArmGroup.rotation.set(-0.3 + sip, -0.25, 0);
    } else if (camper.action === 'sparkler') {
      camper.sparklerGroup.visible = true;
      camper.leftArmGroup.rotation.set(-0.3, 0, 0);
      camper.spTip.scale.setScalar(0.8 + Math.random() * 0.6);
    } else if (camper.action === 'stargaze' && concept === 'star') {
      camper.telescopeGroup.visible = true;
      camper.leftArmGroup.rotation.set(-0.5, 0.2, 0);
      camper.rightArmGroup.rotation.set(-0.5, -0.2, 0);
      camper.headGroup.rotation.x = -0.35;
    } else {
      // Relaxed breathing idle
      camper.leftArmGroup.rotation.set(0.32, 0, 0);
      camper.rightArmGroup.rotation.set(0.32, 0, 0);
      camper.headGroup.rotation.x = isNodding
        ? Math.sin(elapsed * 8) * 0.25 + 0.2
        : (concept === 'star' ? -0.25 : Math.sin(elapsed * 1.2) * 0.04);
    }

    // Floating Name Tag Position
    const tagPos = camper.group.position.clone();
    tagPos.y += (concept === 'star' && camper.posture === 'lie' && !isWalking) ? 1.1 : 2.15;
    projectToScreen(tagPos, camper.labelEl);
    if (state.zenMode) camper.labelEl.style.opacity = '0';
    else camper.labelEl.style.opacity = '1';
  }

  // Update Active Ritual Effects
  for (let i = activeEffects.length - 1; i >= 0; i--) {
    if (!activeEffects[i].update()) {
      activeEffects.splice(i, 1);
    }
  }

  renderer.render(scene, camera);
}

// ====================================================
// 11. POINTER INTERACTION (ORBIT CAMERA, CLICK SEAT, CLICK NEIGHBOR)
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

  camControl.targetTheta -= dx * 0.0065;
  camControl.targetPhi = Math.max(0.1, Math.min(1.15, camControl.targetPhi + dy * 0.0055));
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

  // 1. Clicked another camper? -> Gently walk over and offer warm coffee or marshmallow!
  const camperHits = raycaster.intersectObjects(camperHitMeshes, false);
  if (camperHits.length > 0) {
    const hitData = camperHits[0].object.userData;
    if (hitData.seatIndex !== undefined && hitData.seatIndex !== state.mySeatIndex) {
      const giftType = state.myAction === 'mallow' ? 'mallow' : 'coffee';
      animateWalkAndOfferGift(state.mySeatIndex, hitData.seatIndex, giftType, state.myNickname);
      sendServerAction({ type: 'offerGift', targetSeat: hitData.seatIndex, giftType });
      showRitualToast(
        giftType === 'coffee'
          ? '☕ 옆 사람에게 다가가 따뜻한 보온병 커피를 두 손으로 건넵니다.'
          : '🎁 옆 사람에게 다가가 노릇하게 구운 마시멜로를 두 손으로 건넵니다.'
      );
      return;
    }
  }

  // 2. Clicked a Seat (Log, Camping Chair/Grass, or Sleeping Mat)? -> Move seat
  const seatHits = raycaster.intersectObjects(seatClickMeshes, false);
  if (seatHits.length > 0) {
    const newSeat = seatHits[0].object.userData.seatIndex;
    if (typeof newSeat === 'number' && newSeat !== state.mySeatIndex) {
      state.mySeatIndex = newSeat;
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
            sendServerAction({ type: 'moveSeat', seatIndex: newSeat, posture: state.myPosture });
          }
        };
      } else {
        sendServerAction({ type: 'moveSeat', seatIndex: newSeat, posture: state.myPosture });
      }
      showRitualToast('선택한 자리로 천천히 걸어가 앉습니다.');
      return;
    }
  }

  // 3. Clicked Ground? -> Peaceful stroll to that spot
  const groundHits = raycaster.intersectObject(groundMesh, false);
  if (groundHits.length > 0) {
    const pt = groundHits[0].point;
    const r = Math.hypot(pt.x, pt.z);
    if (r > 2.2 && r < 14) {
      const myCamper = camperMeshes.get(state.clientId);
      if (myCamper) {
        myCamper.walkState = {
          targetX: pt.x,
          targetZ: pt.z,
          isWalking: true,
          onArrive: () => {}
        };
      }
    }
  }
});

window.addEventListener('wheel', (e) => {
  camControl.targetRadius = Math.max(7.5, Math.min(24, camControl.targetRadius + e.deltaY * 0.01));
}, { passive: true });

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ====================================================
// 12. REAL-TIME MULTIPLAYER SSE & SIMULATED COMPANIONS
// ====================================================
let sseSource = null;

function getSimulatedCompanions() {
  const concept = getConceptType();
  const neighborSeat = (state.mySeatIndex + 1) % MAX_SEATS;
  const secondSeat = (state.mySeatIndex + 10) % MAX_SEATS;
  return [
    {
      id: 'sim_companion_1',
      name: concept === 'water' ? '윤슬 닮은 여행자' : (concept === 'star' ? '별빛 헤는 산장지기' : '고요한 솔방울'),
      seatIndex: neighborSeat,
      action: concept === 'fire' ? 'hands' : (concept === 'water' ? 'coffee' : 'idle'),
      posture: concept === 'star' ? 'lie' : (concept === 'water' ? 'chair' : 'sit'),
      color: '#6b9080'
    },
    {
      id: 'sim_companion_2',
      name: concept === 'star' ? '은하수 여행자' : '따스한 모닥불',
      seatIndex: secondSeat,
      action: concept === 'star' ? 'stargaze' : 'idle',
      posture: concept === 'star' ? 'sit' : (concept === 'water' ? 'grass' : 'sit'),
      color: '#e9c46a'
    }
  ];
}

function connectMultiplayerRoom() {
  if (sseSource) {
    sseSource.close();
    sseSource = null;
  }

  syncUrlParams();
  applyRoomEnvironment(state.room);

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
    // Fallback offline peaceful companions if server temporarily unreachable
    state.users = [
      {
        id: state.clientId,
        name: state.myNickname,
        seatIndex: state.mySeatIndex,
        action: state.myAction,
        posture: state.myPosture,
        color: state.myColor
      },
      ...getSimulatedCompanions()
    ];
    syncCampers3D();
  };
}

function applyRoomSnapshot(snapshot) {
  if (!snapshot) return;
  state.fireHeat = snapshot.fireHeat || 680;
  if (typeof snapshot.waterDayMode === 'boolean' && snapshot.waterDayMode !== state.waterDayMode) {
    state.waterDayMode = snapshot.waterDayMode;
    updateSwissLakeDayNightVisuals();
    renderConceptActionDock();
  }

  const realUsers = snapshot.users || [];
  const me = realUsers.find((u) => u.id === state.clientId);
  if (me) state.mySeatIndex = me.seatIndex;

  // Ensure at least 1 peaceful neighbor is present so user can always experience hand-to-hand coffee/marshmallow sharing
  if (realUsers.length <= 1) {
    state.users = [...realUsers, ...getSimulatedCompanions()];
  } else {
    state.users = realUsers;
  }

  document.getElementById('onlineCount').textContent = String(state.users.length);
  syncCampers3D();
}

function handleIncomingRoomEffect(eff) {
  if (!eff) return;
  if (eff.effect === 'throwLog') {
    state.fireHeat = eff.fireHeat || state.fireHeat + 35;
    if (eff.fromSeat !== state.mySeatIndex) spawnFlyingLogEffect(eff.fromSeat);
  } else if (eff.effect === 'wave') {
    for (const c of camperMeshes.values()) {
      if (c.seatIndex === eff.fromSeat) c.waveUntil = Date.now() + 2500;
    }
    spawnFloatingHeartOrEmoji(eff.fromSeat, '👋😊');
  } else if (eff.effect === 'offerGift') {
    if (eff.fromSeat !== state.mySeatIndex) {
      animateWalkAndOfferGift(eff.fromSeat, eff.targetSeat, eff.giftType, eff.actorName);
    }
  } else if (eff.effect === 'acceptGift') {
    if (eff.targetSeat !== state.mySeatIndex) {
      completeGiftAcceptance(eff.fromSeat, eff.targetSeat, eff.giftType);
      showRitualToast(`🙏 ${eff.actorName}님이 건넨 선물을 두 손으로 받았습니다.`);
    }
  } else if (eff.effect === 'floatLantern') {
    if (eff.fromSeat !== state.mySeatIndex) spawnWishLanternEffect(eff.fromSeat);
  } else if (eff.effect === 'skipStone') {
    if (eff.fromSeat !== state.mySeatIndex) spawnLakeRippleEffect(eff.fromSeat);
  } else if (eff.effect === 'shootingStar') {
    if (eff.fromSeat !== state.mySeatIndex) spawnShootingStarEffect();
  } else if (eff.effect === 'waterDayNight') {
    state.waterDayMode = eff.waterDayMode;
    updateSwissLakeDayNightVisuals();
    renderConceptActionDock();
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
// 13. UI WIRING & MODALS
// ====================================================
const previewNickname = document.getElementById('previewNickname');
const myNicknameDisplay = document.getElementById('myNicknameDisplay');
previewNickname.textContent = state.myNickname;
myNicknameDisplay.textContent = state.myNickname;

document.getElementById('rerollNameBtn').addEventListener('click', () => {
  state.myNickname = generateRandomNickname();
  localStorage.setItem('bm_nickname', state.myNickname);
  previewNickname.textContent = state.myNickname;
  myNicknameDisplay.textContent = state.myNickname;
});

document.getElementById('enterCampBtn').addEventListener('click', () => {
  soundEngine.init();
  document.getElementById('entryOverlay').classList.add('hidden');
  document.getElementById('topBar').classList.remove('hidden');
  document.getElementById('bottomDock').classList.remove('hidden');
  state.enteredAt = Date.now();
  connectMultiplayerRoom();
  showRitualToast('고요한 쉼터에 입장했습니다. 마음이 차분해지는 시간을 보내세요.');
});

// Concept Switching (Top Tabs, Bottom Chips, Room Modal)
function switchConceptRoom(newRoom) {
  state.room = normalizeRoomId(newRoom);
  state.myAction = 'idle';
  document.getElementById('roomModal').classList.add('hidden');
  connectMultiplayerRoom();
}

document.querySelectorAll('.concept-tab').forEach((btn) => {
  btn.addEventListener('click', () => switchConceptRoom(btn.dataset.room));
});
document.querySelectorAll('.mode-chip').forEach((btn) => {
  btn.addEventListener('click', () => switchConceptRoom(btn.dataset.switchRoom));
});
document.querySelectorAll('.room-item').forEach((btn) => {
  btn.addEventListener('click', () => switchConceptRoom(btn.dataset.room));
});

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

// Region & Instance Selectors
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
    showRitualToast('🔗 현재 쉼터 주소가 복사되었습니다. 친구에게 전달해 함께 쉬어보세요.');
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

// Worry Burn / Let Go Modal
const worryInput = document.getElementById('worryInput');
const worryCount = document.getElementById('worryCount');
worryInput.addEventListener('input', () => {
  worryCount.textContent = `${worryInput.value.length} / 120자`;
});

document.getElementById('burnWorrySubmitBtn').addEventListener('click', () => {
  const text = worryInput.value.trim();
  worryInput.value = '';
  worryCount.textContent = '0 / 120자';
  document.getElementById('worryModal').classList.add('hidden');
  soundEngine.playWarmChime();

  const concept = getConceptType();
  if (concept === 'water') {
    spawnWishLanternEffect(state.mySeatIndex);
    showRitualToast(text ? '✨ 적어주신 무거운 마음이 스위스 호수 물결을 따라 멀리 흘러갑니다.' : '✨ 마음속 생각이 잔잔한 물결 속으로 조용히 사라집니다.');
  } else if (concept === 'star') {
    spawnShootingStarEffect();
    showRitualToast('🌠 마음속 생각이 강원도 밤하늘 별빛 속으로 가볍게 흩어집니다.');
  } else {
    spawnFlyingLogEffect(state.mySeatIndex);
    showRitualToast('🔥 무거운 고민이 따뜻한 모닥불 속에서 조용히 타올라 사라집니다.');
  }
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

// Toast helper
let toastTimer = null;
function showRitualToast(msg) {
  const toast = document.getElementById('ritualToast');
  const text = document.getElementById('ritualToastText');
  text.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 3600);
}

// Keyboard shortcuts (1~8)
window.addEventListener('keydown', (e) => {
  if (document.activeElement === worryInput) return;
  const concept = getConceptType();
  const actions = CONCEPT_DOCK_ACTIONS[concept] || [];
  const idx = Number(e.key) - 1;
  if (idx >= 0 && idx < actions.length) {
    triggerConceptAction(actions[idx].id);
  }
});

// Initialize 3D Scene & Start Loop
applyRoomEnvironment(state.room);
animate();
