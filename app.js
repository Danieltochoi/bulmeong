/**
 * 🔥 불멍 캠핑 (BULMEONG CAMPING) — 3D Fire Ignition, Forest Hunting, Meat Skewers & Tent Customization!
 *
 * 1. 🌿 -> 🔥 Wood Gathering to Light the Fire:
 *    - Campfire starts as unlit logs/coals (or low embers); gathering wood and putting it in ignites & grows the photorealistic FBM shader fire!
 * 2. 🏹 -> 🍖 -> 🪙 Forest Animal Hunting & BBQ Meat Skewers + Coins:
 *    - 3D Mountain Animals (🐗 산멧돼지, 🐇 산토끼, 🐓 산꿩) roam the outer forest ring.
 *    - Click an animal or press "🏹 동물 사냥": Character runs out along the perimeter path, catches it -> earns +25 Coins (🪙) & +2 Meat Skewers (🍖)!
 *    - Press "🍖 꼬치 굽기": Character holds a big sizzling 3-piece BBQ meat skewer right over the fire (raw red -> sizzling golden brown -> "냠냠!").
 * 3. ⛺ Original Base Tent vs. Custom Upgraded Tent:
 *    - Every camper has an Original Base Tent behind their seat, PLUS a customizable Upgrade Tent & furniture unlocked with coins!
 * 4. 🚶 Circular Perimeter Pathfinding (Never walks through the fire!) & Forward-Facing Log Sitting.
 * 5. 📱 Mobile Pinch-to-Zoom + 4 Action-Clear Camera Views (Side Action View, Front View, Fire Close-up, Camp Wide View).
 */

// ====================================================
// 1. IDENTITY, SEASONS & STATE
// ====================================================
const ADJECTIVES = [
  '따스한', '포근한', '다정한', '용감한', '해맑은',
  '노릇노릇', '별빛 닮은', '솔향기 나는', '행복한', '든든한'
];

const NOUNS = [
  '모닥불', '사냥꾼', '솔방울', '장작불', '바비큐',
  '불꽃놀이', '다람쥐', '보온병', '산장지기', '캠퍼'
];

const CAMPER_COLORS = [
  '#ff6b4a', '#4ecdc4', '#ffb703', '#5c9ead',
  '#f28482', '#fb8500', '#8ac926', '#9b5de5'
];

const SEASONS = {
  spring: {
    id: 'spring',
    label: '🌸 봄숲',
    skyHex: 0x161224,
    fogHex: 0x161224,
    hemiSky: 0xd8a8c8,
    hemiGround: 0x2d3a20,
    groundHex: 0x24331c,
    sandHex: 0x3d2e22,
    treeColors: [0xffb3c6, 0xffc2d1, 0xff8fab, 0x426638],
    particleColor: 0xffccd5,
    particleType: 'petals',
    toast: '🌸 벚꽃잎이 흩날리는 봄밤 숲이에요!'
  },
  summer: {
    id: 'summer',
    label: '🌿 여름숲',
    skyHex: 0x0b1622,
    fogHex: 0x0b1622,
    hemiSky: 0x4a75b0,
    hemiGround: 0x182918,
    groundHex: 0x182b16,
    sandHex: 0x36291c,
    treeColors: [0x1b4332, 0x2d6a4f, 0x3b7a57],
    particleColor: 0xccff33,
    particleType: 'fireflies',
    toast: '🌿 반딧불이가 반짝이는 여름밤 숲이에요!'
  },
  autumn: {
    id: 'autumn',
    label: '🍂 가을숲',
    skyHex: 0x14101d,
    fogHex: 0x14101d,
    hemiSky: 0xc88a55,
    hemiGround: 0x362214,
    groundHex: 0x291b11,
    sandHex: 0x3d2a1d,
    treeColors: [0xc94218, 0xd97f18, 0xa82818, 0x754820],
    particleColor: 0xff8c24,
    particleType: 'leaves',
    toast: '🍂 단풍잎이 떨어지는 가을밤 숲이에요!'
  },
  winter: {
    id: 'winter',
    label: '❄️ 겨울숲',
    skyHex: 0x0f1829,
    fogHex: 0x0f1829,
    hemiSky: 0x9bb8d8,
    hemiGround: 0x485460,
    groundHex: 0x9aa8b8,
    sandHex: 0x5c6778,
    treeColors: [0xdce6f0, 0xb8cad8, 0x22382c],
    particleColor: 0xffffff,
    particleType: 'snow',
    toast: '❄️ 함박눈이 내리는 겨울밤 눈숲이에요!'
  }
};

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
  season: 'autumn',
  mySeatIndex: 0,
  myAction: 'hands', // 'hands' | 'makeSkewer' | 'skewer' | 'coffee' | 'sparkler' | 'sleep' | 'bento'
  inTent: false, // true when character is inside their tent!
  freeRoamPos: null, // { x, z } when character walked far out into the forest!
  myBranches: 2, // Start with 2 branches so user can light the fire right away or gather more!
  myRawMeat: Number(localStorage.getItem('bm_rawMeat') || 3), // Caught raw meat pieces (3 pieces -> 1 skewer!)
  myMeat: Number(localStorage.getItem('bm_meat') || 1), // Crafted meat skewers ready to roast!
  myCoins: Number(localStorage.getItem('bm_coins') || 20),
  fireLit: false, // Starts unlit until wood is put in!
  fireHeat: 0,
  logsAddedCount: 0,
  // Tent customization state
  tentLevel: Number(localStorage.getItem('bm_tentLevel') || 0), // 0: only original, 1: Bell Glamping, 2: Wood Cabin Tarp
  tentColor: localStorage.getItem('bm_tentColor') || '#d48b45',
  hasFurniture: localStorage.getItem('bm_hasFurniture') === 'true',
  hasLights: localStorage.getItem('bm_hasLights') === 'true',
  // Camera POV: 'side' (내 동작 클로즈업 - 옆모습이라 손·꼬치·장작이 완벽히 보임!) | 'front' (내 정면 보기) | 'fire' (불꽃 직관) | 'wide' (숲 전체)
  povMode: 'side',
  enableSoloCompanion: true,
  auroraUntil: 0,
  zenMode: false,
  realUsers: [],
  users: [],
  pendingGiftOffer: null
};

sessionStorage.setItem('bm_clientId', state.clientId);
sessionStorage.setItem('bm_color', state.myColor);

function saveProgress() {
  localStorage.setItem('bm_rawMeat', String(state.myRawMeat));
  localStorage.setItem('bm_meat', String(state.myMeat));
  localStorage.setItem('bm_coins', String(state.myCoins));
  localStorage.setItem('bm_tentLevel', String(state.tentLevel));
  localStorage.setItem('bm_tentColor', state.tentColor);
  localStorage.setItem('bm_hasFurniture', String(state.hasFurniture));
  localStorage.setItem('bm_hasLights', String(state.hasLights));
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
// 2. CENTER NOTIFICATION HELPER
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
// 3. WEB AUDIO ASMR & GAME SOUND ENGINE
// ====================================================
class CampfireAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.volumes = { fire: 0.9, wind: 0.35, night: 0.45 };
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
    this.masterGain.gain.value = 0.95;
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

    const fireRumble = this.ctx.createBufferSource();
    fireRumble.buffer = noiseBuffer;
    fireRumble.loop = true;
    const fireFilter = this.ctx.createBiquadFilter();
    fireFilter.type = 'lowpass';
    fireFilter.frequency.value = 185;
    this.nodes.fireGain = this.ctx.createGain();
    this.nodes.fireGain.gain.value = 0.02; // Starts quiet until fire is lit!
    fireRumble.connect(fireFilter);
    fireFilter.connect(this.nodes.fireGain);
    this.nodes.fireGain.connect(this.masterGain);
    fireRumble.start();

    const windSource = this.ctx.createBufferSource();
    windSource.buffer = noiseBuffer;
    windSource.loop = true;
    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 320;
    windFilter.Q.value = 4.0;
    this.nodes.windGain = this.ctx.createGain();
    this.nodes.windGain.gain.value = this.volumes.wind * 0.22;
    windSource.connect(windFilter);
    windFilter.connect(this.nodes.windGain);
    this.nodes.windGain.connect(this.masterGain);
    windSource.start();

    setInterval(() => this.triggerCrackle(), 95);
  }

  triggerCrackle() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const targetFireAudio = state.fireLit ? this.volumes.fire * 0.45 : 0.01;
    if (this.nodes.fireGain) {
      this.nodes.fireGain.gain.setTargetAtTime(targetFireAudio, now, 0.2);
    }

    if (state.fireLit && this.volumes.fire > 0.02 && Math.random() < 0.42) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1200 + Math.random() * 2200;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(190 + Math.random() * 600, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.038);
      const amp = (0.035 + Math.random() * 0.06) * this.volumes.fire;
      gain.gain.setValueAtTime(amp, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.044);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.048);
    }
  }

  playPickupPop() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.11);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  playCoinSound() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    [987.77, 1318.51].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.08, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.35);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.36);
    });
  }

  playWoodRoar() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.24);
    gain.gain.setValueAtTime(0.26 * this.volumes.fire, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.27);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  playHappyChime() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.05, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.9);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.95);
    });
  }

  setVolume(channel, val0to100) {
    const v = Math.max(0, Math.min(100, val0to100)) / 100;
    this.volumes[channel] = v;
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (channel === 'wind' && this.nodes.windGain) this.nodes.windGain.gain.setTargetAtTime(v * 0.22, now, 0.1);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.95, this.ctx.currentTime, 0.1);
    }
    return this.isMuted;
  }
}

const soundEngine = new CampfireAudioEngine();

// ====================================================
// 4. THREE.JS SCENE & BALANCED COZY NIGHT LIGHTING (NOT TOO BRIGHT!)
// ====================================================
const canvas = document.getElementById('campfireCanvas');
const bubbleContainer = document.getElementById('actionBubbleContainer');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08; // Balanced night exposure so the fire truly pops!

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x14101d);
scene.fog = new THREE.FogExp2(0x14101d, 0.016);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 160);

const camControl = {
  orbitOffset: 0.0,
  pitchOffset: 0.0,
  zoomOffset: 0.0,
  currentPos: new THREE.Vector3(0, 2.1, 5.2),
  currentLookAt: new THREE.Vector3(0, 1.0, 0),
  isDragging: false,
  dragMoved: false,
  lastX: 0,
  lastY: 0,
  pinchStartDist: 0,
  pinchStartZoom: 0
};

// --- BALANCED NIGHT LIGHTING (Lanterns pushed back to radius 11.8, soft ambient) ---
const hemiLight = new THREE.HemisphereLight(0xc88a55, 0x362214, 0.62);
scene.add(hemiLight);

const moonRimLight = new THREE.DirectionalLight(0xa8c4ff, 0.38);
moonRimLight.position.set(14, 24, 14);
scene.add(moonRimLight);

// Main Fire Light (Dim when unlit, blazes warmly when lit!)
const fireLight = new THREE.PointLight(0xff7b22, 0.4, 30, 1.3);
fireLight.position.set(0, 1.6, 0);
fireLight.castShadow = true;
fireLight.shadow.mapSize.width = 1024;
fireLight.shadow.mapSize.height = 1024;
fireLight.shadow.bias = -0.001;
scene.add(fireLight);

const bounceLight = new THREE.PointLight(0xffa033, 0.25, 14, 1.5);
bounceLight.position.set(0, 0.55, 0);
scene.add(bounceLight);

// Ground & Hearth Sand (Expanded to 100m radius so players can walk far out into the deep forest!)
const groundMat = new THREE.MeshStandardMaterial({ color: 0x291b11, roughness: 0.9, metalness: 0.03 });
const groundMesh = new THREE.Mesh(new THREE.CircleGeometry(100, 64), groundMat);
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

// Ground Walk Target Ring Indicator (Shows where you clicked when walking far out!)
const walkTargetRing = new THREE.Mesh(
  new THREE.RingGeometry(0.32, 0.48, 24),
  new THREE.MeshBasicMaterial({ color: 0x72efdd, side: THREE.DoubleSide, transparent: true, opacity: 0.0 })
);
walkTargetRing.rotation.x = -Math.PI / 2;
walkTargetRing.position.y = 0.04;
scene.add(walkTargetRing);

const hearthSandMat = new THREE.MeshStandardMaterial({ color: 0x3d2a1d, roughness: 0.92 });
const hearthSandMesh = new THREE.Mesh(new THREE.CircleGeometry(5.2, 48), hearthSandMat);
hearthSandMesh.rotation.x = -Math.PI / 2;
hearthSandMesh.position.y = 0.01;
hearthSandMesh.receiveShadow = true;
scene.add(hearthSandMesh);

// Outer Path Lantern Poles (Inner trail at r=12.2 + Deep Forest Exploration trail at r=21.5)
const lanternGroup = new THREE.Group();
scene.add(lanternGroup);
const poleMat = new THREE.MeshStandardMaterial({ color: 0x3d2818, roughness: 0.9 });
const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffd27d });

[12.2, 21.5].forEach((r, ringIdx) => {
  const count = ringIdx === 0 ? 6 : 8;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + ringIdx * 0.4 + 0.3;
    const px = Math.cos(a) * r;
    const pz = Math.sin(a) * r;

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 3.0, 8), poleMat);
    pole.position.set(px, 1.5, pz);
    lanternGroup.add(pole);

    const lanternBulb = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), bulbMat);
    lanternBulb.position.set(px, 2.95, pz);
    lanternGroup.add(lanternBulb);

    const pathLight = new THREE.PointLight(0xffb85c, ringIdx === 0 ? 0.42 : 0.35, 11, 1.8);
    pathLight.position.set(px, 2.7, pz);
    lanternGroup.add(pathLight);
  }
});

// Cute Glowing Forest Mushrooms & Berry Bushes along the outer forest trails (r = 9m ~ 25m)
const mushroomStemMat = new THREE.MeshStandardMaterial({ color: 0xfff3d6, roughness: 0.7 });
const mushroomCapCols = [0xff6b6b, 0xffbe0b, 0x4ecdc4];
for (let m = 0; m < 22; m++) {
  const a = (m / 22) * Math.PI * 2 + 0.17;
  const r = 9.2 + (m % 4) * 3.8;
  const mGroup = new THREE.Group();
  const capMat = new THREE.MeshStandardMaterial({
    color: mushroomCapCols[m % mushroomCapCols.length],
    emissive: mushroomCapCols[m % mushroomCapCols.length],
    emissiveIntensity: 0.28,
    roughness: 0.5
  });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.22, 8), mushroomStemMat);
  stem.position.y = 0.11;
  mGroup.add(stem);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.58), capMat);
  cap.position.y = 0.2;
  mGroup.add(cap);
  mGroup.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
  scene.add(mGroup);
}

// Starry Sky
const starsGeo = new THREE.BufferGeometry();
const starCount = 850;
const starPos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  const r = 65 + Math.random() * 25;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.random() * Math.PI * 0.42;
  starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
  starPos[i * 3 + 1] = r * Math.cos(phi) + 5;
  starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
}
starsGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
scene.add(new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: 0xfff0d8, size: 0.42, transparent: true, opacity: 0.85 })));

// ====================================================
// 4A. 4-SEASONS TREES & FALLING PARTICLES
// ====================================================
const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3b2416, roughness: 0.9 });
const treeFoliageMeshes = [];

for (let i = 0; i < 56; i++) {
  const tree = new THREE.Group();
  const a = (i / 56) * Math.PI * 2 + (Math.random() - 0.5) * 0.06;
  // Scenic mid-forest trees (15~22m) and deep outer forest boundary trees (25~42m)
  const dist = i % 3 === 0 ? (15.5 + (i % 5) * 1.6) : (24.5 + Math.random() * 16);
  const s = 0.95 + Math.random() * 0.85;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * s, 0.32 * s, 2.2 * s, 7), trunkMat);
  trunk.position.y = 1.1 * s;
  tree.add(trunk);

  const leafMat = new THREE.MeshStandardMaterial({ color: 0xc94218, roughness: 0.85 });
  for (let l = 0; l < 3; l++) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry((1.8 - l * 0.4) * s, (2.6 - l * 0.3) * s, 7), leafMat);
    cone.position.y = (2.3 + l * 1.35) * s;
    tree.add(cone);
  }
  treeFoliageMeshes.push({ mat: leafMat, index: i });
  tree.position.set(Math.cos(a) * dist, 0, Math.sin(a) * dist);
  scene.add(tree);
}

const SEASON_PARTICLE_COUNT = 160;
const seasonParticles = [];
const seasonParticleGroup = new THREE.Group();
scene.add(seasonParticleGroup);

for (let i = 0; i < SEASON_PARTICLE_COUNT; i++) {
  const mat = new THREE.MeshBasicMaterial({ color: 0xff8c24, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.13), mat);
  resetSeasonParticle(mesh, true);
  seasonParticleGroup.add(mesh);
  seasonParticles.push(mesh);
}

function resetSeasonParticle(p, randomY = false) {
  const angle = Math.random() * Math.PI * 2;
  const radius = 2.0 + Math.random() * 13.5;
  p.position.set(
    Math.cos(angle) * radius,
    randomY ? 0.5 + Math.random() * 8.5 : 8.0 + Math.random() * 2.0,
    Math.sin(angle) * radius
  );
  p.userData = {
    vy: -(0.45 + Math.random() * 0.65),
    vx: (Math.random() - 0.5) * 0.4,
    vz: (Math.random() - 0.5) * 0.4,
    rotSpeed: 1.5 + Math.random() * 3.0,
    phase: Math.random() * Math.PI * 2
  };
}

function applySeasonTheme(seasonKey, showNotice = false) {
  const cfg = SEASONS[seasonKey] || SEASONS.autumn;
  state.season = cfg.id;

  scene.background.setHex(cfg.skyHex);
  scene.fog.color.setHex(cfg.fogHex);
  hemiLight.color.setHex(cfg.hemiSky);
  hemiLight.groundColor.setHex(cfg.hemiGround);
  groundMat.color.setHex(cfg.groundHex);
  hearthSandMat.color.setHex(cfg.sandHex);

  treeFoliageMeshes.forEach((item) => {
    item.mat.color.setHex(cfg.treeColors[item.index % cfg.treeColors.length]);
  });

  seasonParticles.forEach((p) => {
    p.material.color.setHex(cfg.particleColor);
  });

  document.getElementById('currentRoomName').textContent = cfg.label;
  const mobileLbl = document.getElementById('seasonMobileLabel');
  if (mobileLbl) mobileLbl.textContent = cfg.label;

  document.querySelectorAll('.season-tab').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.season === cfg.id);
  });
  document.querySelectorAll('#modalSeasonGroup .mini-pill').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.season === cfg.id);
  });

  if (showNotice) showCenterNotice(cfg.toast);
}

// ====================================================
// 4B. PHOTOREALISTIC PROCEDURAL FBM SHADER FIRE ENGINE
// ====================================================
const hearthGroup = new THREE.Group();
scene.add(hearthGroup);

const stoneMat = new THREE.MeshStandardMaterial({ color: 0x524842, roughness: 0.88 });
for (let i = 0; i < 18; i++) {
  const a = (i / 18) * Math.PI * 2;
  const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3 + (i % 3) * 0.05, 1), stoneMat);
  stone.position.set(Math.cos(a) * 1.55, 0.16, Math.sin(a) * 1.55);
  stone.scale.set(1.15, 0.72, 1.05);
  stone.rotation.y = a;
  stone.castShadow = true;
  stone.receiveShadow = true;
  hearthGroup.add(stone);
}

const coalBedMat = new THREE.MeshStandardMaterial({
  color: 0x33150a,
  emissive: 0xff4500,
  emissiveIntensity: 0.35, // Glows brighter when fire is lit!
  roughness: 0.8
});
const coalBed = new THREE.Mesh(new THREE.CylinderGeometry(1.38, 1.48, 0.2, 32), coalBedMat);
coalBed.position.y = 0.1;
hearthGroup.add(coalBed);

const barkMat = new THREE.MeshStandardMaterial({
  color: 0x4f2f1a,
  roughness: 0.88,
  emissive: 0x661a00,
  emissiveIntensity: 0.25
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

const branchWoodMat = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.88 });
function createTreeBranchBundleMesh() {
  const bGroup = new THREE.Group();
  const mainStick = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.055, 0.95, 8), branchWoodMat);
  mainStick.rotation.z = Math.PI / 2;
  mainStick.castShadow = true;
  bGroup.add(mainStick);

  const twig1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.42, 6), branchWoodMat);
  twig1.position.set(0.12, 0.08, 0.08);
  twig1.rotation.set(0.4, 0.2, Math.PI / 3);
  bGroup.add(twig1);

  const twig2 = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.028, 0.36, 6), branchWoodMat);
  twig2.position.set(-0.15, 0.06, -0.08);
  twig2.rotation.set(-0.35, -0.2, -Math.PI / 3);
  bGroup.add(twig2);

  return bGroup;
}

for (let i = 0; i < 7; i++) {
  const a = (i / 7) * Math.PI * 2;
  const log = createFirewoodLogMesh(2.15, 0.14);
  log.position.set(Math.cos(a) * 0.34, 0.34, Math.sin(a) * 0.34);
  log.rotation.z = Math.cos(a) * 0.54;
  log.rotation.x = Math.sin(a) * 0.54;
  hearthGroup.add(log);
}

const realisticFireVertexShader = `
  uniform float uTime;
  uniform float uSeed;
  uniform float uHeatScale;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float h = clamp(uv.y, 0.0, 1.0);

    float waveX = sin(uTime * 4.5 + h * 5.2 + uSeed) * 0.22 * pow(h, 1.4);
    float waveZ = cos(uTime * 3.9 + h * 4.8 + uSeed * 1.9) * 0.22 * pow(h, 1.4);
    pos.x += waveX;
    pos.z += waveZ;
    pos.y *= uHeatScale;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const realisticFireFragmentShader = `
  uniform float uTime;
  uniform float uSeed;
  uniform float uAurora;
  uniform float uLitAlpha;
  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      v += amp * noise(p);
      p *= 2.08;
      amp *= 0.5;
    }
    return v;
  }

  void main() {
    if (uLitAlpha < 0.02) discard;
    float h = clamp(vUv.y, 0.0, 1.0);
    float radialDist = abs(vUv.x - 0.5) * 2.0;

    vec2 flowUv = vec2(vUv.x * 3.8 + uSeed, vUv.y * 3.2 - uTime * 3.1);
    float n1 = fbm(flowUv);
    float n2 = fbm(flowUv * 1.9 - vec2(0.0, uTime * 2.2));
    float flameNoise = mix(n1, n2, 0.5);

    float taper = mix(0.95, 0.05, pow(h, 0.85));
    float intensity = (1.0 - smoothstep(taper * 0.3, taper, radialDist * 0.65)) * (1.15 - h * 0.92);
    intensity += (flameNoise - 0.45) * 0.85 * (1.0 - h * 0.3);
    intensity = clamp(intensity, 0.0, 1.0);

    if (intensity < 0.08) discard;

    vec3 col;
    if (uAurora > 0.5) {
      vec3 deepViolet = vec3(0.32, 0.05, 0.75);
      vec3 emerald = vec3(0.0, 0.92, 0.68);
      vec3 cyanCore = vec3(0.88, 1.0, 0.98);
      col = mix(deepViolet, emerald, smoothstep(0.1, 0.55, intensity));
      col = mix(col, cyanCore, smoothstep(0.55, 0.92, intensity));
    } else {
      vec3 darkCrimson = vec3(0.75, 0.08, 0.01);
      vec3 blazingOrange = vec3(1.0, 0.38, 0.02);
      vec3 goldenYellow = vec3(1.0, 0.78, 0.18);
      vec3 whiteHotCore = vec3(1.0, 0.98, 0.88);

      col = mix(darkCrimson, blazingOrange, smoothstep(0.08, 0.38, intensity));
      col = mix(col, goldenYellow, smoothstep(0.38, 0.70, intensity));
      col = mix(col, whiteHotCore, smoothstep(0.70, 0.95, intensity));
    }

    float alpha = smoothstep(0.08, 0.35, intensity) * (1.0 - pow(h, 2.2)) * 0.88 * uLitAlpha;
    gl_FragColor = vec4(col * 1.35, alpha);
  }
`;

const fireShaderPlanes = [];
const NUM_FIRE_VOLUMES = 18;
for (let i = 0; i < NUM_FIRE_VOLUMES; i++) {
  const w = 1.65 + (i % 3) * 0.35;
  const h = 2.45 + (i % 4) * 0.45;
  const geo = new THREE.ConeGeometry(w * 0.48, h, 20, 24, true);
  geo.translate(0, h * 0.45, 0);

  const uniforms = {
    uTime: { value: 0 },
    uSeed: { value: i * 2.17 },
    uHeatScale: { value: 0.1 },
    uAurora: { value: 0.0 },
    uLitAlpha: { value: 0.0 }
  };

  const mat = new THREE.ShaderMaterial({
    vertexShader: realisticFireVertexShader,
    fragmentShader: realisticFireFragmentShader,
    uniforms,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geo, mat);
  const a = (i / NUM_FIRE_VOLUMES) * Math.PI * 2;
  const r = (i % 3) * 0.14;
  mesh.position.set(Math.cos(a) * r, 0.15, Math.sin(a) * r);
  mesh.rotation.y = a;
  hearthGroup.add(mesh);
  fireShaderPlanes.push(mesh);
}

const coreGlowMat = new THREE.MeshBasicMaterial({
  color: 0xffaa33,
  transparent: true,
  opacity: 0.0,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});
const coreGlowSphere = new THREE.Mesh(new THREE.SphereGeometry(0.95, 16, 16), coreGlowMat);
coreGlowSphere.position.set(0, 0.65, 0);
hearthGroup.add(coreGlowSphere);

const EMBER_COUNT = 110;
const emberMeshes = [];
const emberMatBase = new THREE.MeshBasicMaterial({
  color: 0xffc44d,
  transparent: true,
  opacity: 0.0,
  blending: THREE.AdditiveBlending
});

for (let i = 0; i < EMBER_COUNT; i++) {
  const sp = new THREE.Mesh(new THREE.SphereGeometry(0.026 + Math.random() * 0.022, 6, 6), emberMatBase.clone());
  resetEmberParticle(sp, true);
  hearthGroup.add(sp);
  emberMeshes.push(sp);
}

function resetEmberParticle(sp, randomY = false) {
  const a = Math.random() * Math.PI * 2;
  const r = Math.random() * 0.9;
  sp.position.set(Math.cos(a) * r, randomY ? Math.random() * 5.0 : 0.3, Math.sin(a) * r);
  sp.userData = {
    vy: 0.8 + Math.random() * 1.4,
    swaySpeed: 1.8 + Math.random() * 2.8,
    swayAmp: 0.006 + Math.random() * 0.01,
    phase: Math.random() * Math.PI * 2,
    maxY: 3.5 + Math.random() * 3.2
  };
}

// ====================================================
// 4C. FORAGEABLE 3D TREE BRANCHES ON THE FOREST FLOOR (NEAR & FAR)
// ====================================================
const MAX_FORAGE_BRANCHES = 14;
const forageBranches = [];
const forageBranchHitMeshes = [];

for (let i = 0; i < MAX_FORAGE_BRANCHES; i++) {
  const itemGroup = new THREE.Group();
  const branchMesh = createTreeBranchBundleMesh();
  branchMesh.position.y = 0.08;
  itemGroup.add(branchMesh);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.32, 0.42, 20),
    new THREE.MeshBasicMaterial({ color: 0xa8ff8e, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  itemGroup.add(ring);

  const hitBox = new THREE.Mesh(
    new THREE.CylinderGeometry(0.75, 0.75, 0.9, 8),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitBox.position.y = 0.35;
  hitBox.userData = { branchIndex: i };
  itemGroup.add(hitBox);
  forageBranchHitMeshes.push(hitBox);

  const angle = (i / MAX_FORAGE_BRANCHES) * Math.PI * 2 + 0.25;
  const dist = i < 8 ? (5.5 + (i % 2) * 1.4) : (12.0 + (i % 3) * 3.5);
  const bx = Math.cos(angle) * dist;
  const bz = Math.sin(angle) * dist;
  itemGroup.position.set(bx, 0, bz);
  itemGroup.rotation.y = Math.random() * Math.PI * 2;
  scene.add(itemGroup);

  forageBranches.push({
    index: i,
    group: itemGroup,
    ring,
    hitBox,
    angle,
    dist,
    x: bx,
    z: bz,
    available: true
  });
}

// ====================================================
// 4D. ADORABLE CHUBBY 3D FOREST ANIMALS (아기 산토끼 / 아기 꽃멧돼지 / 아기 꽃사슴 / 아기 산새)
// ====================================================
const ANIMAL_TYPES = [
  { type: 'rabbit', name: '🐇 아기 산토끼', color: 0xfffaf2, bellyColor: 0xffffff, scale: 0.95, speed: 0.38 },
  { type: 'boar', name: '🐗 아기 꽃멧돼지', color: 0x8d5b3e, bellyColor: 0xb88666, scale: 1.05, speed: 0.28 },
  { type: 'deer', name: '🦌 아기 꽃사슴', color: 0xd98a4e, bellyColor: 0xffebd6, scale: 1.05, speed: 0.34 },
  { type: 'pheasant', name: '🐤 아기 산새', color: 0xffb703, bellyColor: 0xfff0b8, scale: 0.9, speed: 0.36 }
];

const MAX_ANIMALS = 10;
const forestAnimals = [];
const animalHitMeshes = [];

function buildAnimal3D(cfg) {
  const root = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.65 });
  const bellyMat = new THREE.MeshStandardMaterial({ color: cfg.bellyColor || 0xfff8eb, roughness: 0.7 });
  const darkEyeMat = new THREE.MeshBasicMaterial({ color: 0x18120e });
  const eyeSparkleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const blushMat = new THREE.MeshBasicMaterial({ color: 0xff758f, transparent: true, opacity: 0.78 });
  const pinkMat = new THREE.MeshStandardMaterial({ color: 0xff9ebb, roughness: 0.5 });

  // 1. Plump, Chubby Round Body (Sphere scaled into an adorable pudding/capsule shape!)
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.36, 18, 16), bodyMat);
  body.scale.set(1.0, 0.88, 1.25);
  body.position.set(0, 0.36, 0);
  body.castShadow = true;
  root.add(body);

  // Cute round cream belly patch
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 12), bellyMat);
  belly.scale.set(0.88, 0.75, 1.1);
  belly.position.set(0, 0.28, 0.05);
  root.add(belly);

  // 2. Big Cute Round Head (Chibi proportions -> big head = super cute!)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.54, 0.38);
  root.add(headGroup);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.29, 18, 16), bodyMat);
  head.scale.set(1.06, 0.96, 0.98);
  head.castShadow = true;
  headGroup.add(head);

  // Big Shiny Eyes + White Catchlight Sparkles + Rosy Pink Cheeks!
  [-1, 1].forEach((s) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 10), darkEyeMat);
    eye.position.set(s * 0.13, 0.04, 0.24);
    headGroup.add(eye);

    // Shiny white sparkle inside the eye!
    const sparkle = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), eyeSparkleMat);
    sparkle.position.set(s * 0.115, 0.062, 0.278);
    headGroup.add(sparkle);

    // Rosy blushing cheek!
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.052, 10, 10), blushMat);
    cheek.scale.set(1.2, 0.75, 0.5);
    cheek.position.set(s * 0.19, -0.04, 0.22);
    headGroup.add(cheek);
  });

  // 3. Species-Specific Cute Details
  const ears = [];
  if (cfg.type === 'rabbit') {
    // Long floppy/bouncy bunny ears with pink inner ears!
    [-1, 1].forEach((s) => {
      const earPivot = new THREE.Group();
      earPivot.position.set(s * 0.11, 0.22, -0.02);
      earPivot.rotation.z = -s * 0.18;
      const outerEar = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 12), bodyMat);
      outerEar.scale.set(0.85, 2.6, 0.45);
      outerEar.position.y = 0.16;
      earPivot.add(outerEar);
      const innerEar = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), pinkMat);
      innerEar.scale.set(0.75, 2.2, 0.35);
      innerEar.position.set(0, 0.15, 0.025);
      earPivot.add(innerEar);
      headGroup.add(earPivot);
      ears.push(earPivot);
    });
    // Cute pink button nose
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.036, 8, 8), pinkMat);
    nose.position.set(0, -0.01, 0.285);
    headGroup.add(nose);
    // Fluffy cotton-ball tail!
    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), bellyMat);
    tail.position.set(0, 0.38, -0.45);
    root.add(tail);
  } else if (cfg.type === 'boar') {
    // Cute round pink piglet snout + nostrils!
    const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.105, 0.08, 14), pinkMat);
    snout.rotation.x = Math.PI / 2;
    snout.position.set(0, -0.03, 0.27);
    headGroup.add(snout);
    [-1, 1].forEach((s) => {
      const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), darkEyeMat);
      nostril.position.set(s * 0.035, -0.03, 0.312);
      headGroup.add(nostril);
      // Tiny baby tusks
      const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.09, 8), bellyMat);
      tusk.position.set(s * 0.11, -0.06, 0.26);
      tusk.rotation.x = Math.PI / 5;
      headGroup.add(tusk);
      // Cute round ears
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), bodyMat);
      ear.scale.set(1.0, 1.3, 0.45);
      ear.position.set(s * 0.21, 0.20, 0.0);
      ear.rotation.z = -s * 0.4;
      headGroup.add(ear);
    });
    // Cute cream baby-boar stripes on its back!
    [-0.12, 0, 0.12].forEach((sx) => {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.03, 0.52), bellyMat);
      stripe.position.set(sx, 0.66, -0.02);
      root.add(stripe);
    });
    // Little round tail
    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), bodyMat);
    tail.position.set(0, 0.42, -0.46);
    root.add(tail);
  } else if (cfg.type === 'deer') {
    // Cute Baby Spotted Fawn with cream spots & tiny antlers!
    [-1, 1].forEach((s) => {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), bodyMat);
      ear.scale.set(1.5, 0.7, 0.4);
      ear.position.set(s * 0.24, 0.16, -0.02);
      ear.rotation.z = s * 0.25;
      headGroup.add(ear);

      const antler = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, 0.14, 6), bellyMat);
      antler.position.set(s * 0.09, 0.29, -0.02);
      antler.rotation.z = -s * 0.2;
      headGroup.add(antler);
    });
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), darkEyeMat);
    nose.position.set(0, -0.01, 0.285);
    headGroup.add(nose);
    // Cute white spots on back!
    [[-0.14, 0.62, 0.05], [0.14, 0.62, -0.05], [-0.12, 0.58, -0.22], [0.12, 0.58, 0.18]].forEach(([sx, sy, sz]) => {
      const spot = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), bellyMat);
      spot.position.set(sx, sy, sz);
      root.add(spot);
    });
    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), bellyMat);
    tail.position.set(0, 0.44, -0.45);
    root.add(tail);
  } else {
    // Plump Chubby Baby Forest Bird (🐤 아기 산새)
    const beak = new THREE.Mesh(
      new THREE.ConeGeometry(0.055, 0.12, 8),
      new THREE.MeshStandardMaterial({ color: 0xff7b00 })
    );
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, -0.02, 0.31);
    headGroup.add(beak);

    // Cute red head tuft
    const crest = new THREE.Mesh(
      new THREE.SphereGeometry(0.065, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xff4d6d })
    );
    crest.scale.set(0.8, 1.5, 0.9);
    crest.position.set(0, 0.28, 0.04);
    headGroup.add(crest);

    // Chubby little flapping side wings
    [-1, 1].forEach((s) => {
      const wing = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), bodyMat);
      wing.scale.set(0.45, 0.85, 1.3);
      wing.position.set(s * 0.34, 0.38, 0.02);
      root.add(wing);
    });
  }

  // 4 Stubby Cute Round Paws/Legs
  const legs = [];
  [[-0.17, 0.22], [0.17, 0.22], [-0.17, -0.22], [0.17, -0.22]].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.24, 10), bodyMat);
    leg.position.set(lx, 0.12, lz);
    root.add(leg);
    legs.push(leg);
  });

  root.scale.setScalar(cfg.scale);
  return { root, headGroup, ears, legs };
}

for (let i = 0; i < MAX_ANIMALS; i++) {
  const cfg = ANIMAL_TYPES[i % ANIMAL_TYPES.length];
  const { root, headGroup, ears, legs } = buildAnimal3D(cfg);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.38, 0.48, 20),
    new THREE.MeshBasicMaterial({ color: 0xffb703, side: THREE.DoubleSide, transparent: true, opacity: 0.42 })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  root.add(ring);

  const hitBox = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 0.95, 1.2, 8),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitBox.position.y = 0.5;
  hitBox.userData = { animalIndex: i };
  root.add(hitBox);
  animalHitMeshes.push(hitBox);

  const angle = (i / MAX_ANIMALS) * Math.PI * 2 + 0.4;
  // Roam across both near forest (7.8~10.5m) and deep outer forest (13.5~21.0m)!
  const dist = i < 5 ? (8.0 + (i % 2) * 1.8) : (13.8 + (i % 3) * 3.2);
  root.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
  scene.add(root);

  forestAnimals.push({
    index: i,
    cfg,
    group: root,
    headGroup,
    ears,
    legs,
    ring,
    hitBox,
    angle,
    dist,
    dir: i % 2 === 0 ? 1 : -1,
    x: root.position.x,
    z: root.position.z,
    available: true
  });
}

// ====================================================
// 5. LOG SEATS, ORIGINAL TENT & UPGRADED CUSTOM TENT
// ====================================================
const MAX_SEATS = 12;
const SEAT_RADIUS = 3.5;
const seats = [];
const seatClickMeshes = [];
const tentClickMeshes = [];

const logSeatMat = new THREE.MeshStandardMaterial({ color: 0x593a24, roughness: 0.85 });
const logEndMat = new THREE.MeshStandardMaterial({ color: 0x996b45, roughness: 0.8 });

function buildInteriorBedding(scale = 1.0) {
  const bedGroup = new THREE.Group();
  // Cozy quilted sleeping mat / mattress
  const matMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.95 * scale, 0.1 * scale, 1.55 * scale),
    new THREE.MeshStandardMaterial({ color: 0x3b6e52, roughness: 0.8 })
  );
  matMesh.position.set(0, 0.06, 0);
  bedGroup.add(matMesh);

  // Soft warm blanket on lower half of sleeping bag
  const blanketMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.98 * scale, 0.14 * scale, 0.92 * scale),
    new THREE.MeshStandardMaterial({ color: 0xe07a5f, roughness: 0.75 })
  );
  blanketMesh.position.set(0, 0.12, 0.25 * scale);
  bedGroup.add(blanketMesh);

  // Fluffy white camping pillow at the back (-Z)
  const pillowMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.62 * scale, 0.14 * scale, 0.34 * scale),
    new THREE.MeshStandardMaterial({ color: 0xfff8eb, roughness: 0.65 })
  );
  pillowMesh.position.set(0, 0.15, -0.52 * scale);
  bedGroup.add(pillowMesh);

  // Warm interior hanging tent lantern
  const lanternBulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.09 * scale, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xffe58f })
  );
  lanternBulb.position.set(0, 1.15 * scale, 0);
  bedGroup.add(lanternBulb);

  return bedGroup;
}

function buildSeatTents(seatIndex) {
  const tentZone = new THREE.Group();
  // Located behind the seat (in local seat coordinates, -Z is away from the fire, +Z is toward the fire)
  tentZone.position.set(0, 0, -2.5);

  // 1. ORIGINAL BASE TENT (원본 기본 삼각 텐트 — 항상 기본으로 유지!)
  const origGroup = new THREE.Group();
  origGroup.position.set(-1.35, 0, -0.3);
  const origMat = new THREE.MeshStandardMaterial({
    color: 0x8d775f,
    roughness: 0.85,
    transparent: true,
    opacity: 1.0,
    side: THREE.DoubleSide
  });
  const origBody = new THREE.Mesh(new THREE.ConeGeometry(1.15, 1.55, 4), origMat);
  origBody.position.y = 0.77;
  origBody.rotation.y = Math.PI / 4;
  origBody.castShadow = true;
  origGroup.add(origBody);

  // Interior sleeping bag + pillow inside Original Tent
  const origBed = buildInteriorBedding(0.85);
  origGroup.add(origBed);

  // Click hitbox for Original Tent
  const origHit = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 1.6, 1.6),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  origHit.position.y = 0.8;
  origHit.userData = { seatIndex, tentType: 'orig' };
  origGroup.add(origHit);
  tentClickMeshes.push(origHit);

  tentZone.add(origGroup);

  // 2. CUSTOM UPGRADABLE TENT (꾸미기/업그레이드 전용 텐트 — 원본 텐트 옆에 멋지게 지어짐!)
  const customGroup = new THREE.Group();
  customGroup.position.set(0.55, 0, -0.2);
  customGroup.visible = false;

  const customTentMat = new THREE.MeshStandardMaterial({
    color: 0xd48b45,
    roughness: 0.72,
    emissive: 0xff8833,
    emissiveIntensity: 0.18,
    transparent: true,
    opacity: 1.0,
    side: THREE.DoubleSide
  });

  // Level 1: Bell Glamping Tent
  const bellBase = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.45, 0.75, 12), customTentMat);
  bellBase.position.y = 0.375;
  bellBase.castShadow = true;
  customGroup.add(bellBase);

  const bellRoof = new THREE.Mesh(new THREE.ConeGeometry(1.5, 1.35, 12), customTentMat);
  bellRoof.position.y = 1.4;
  bellRoof.castShadow = true;
  customGroup.add(bellRoof);

  // Interior spacious glamping bed + pillow inside Custom Tent
  const customBed = buildInteriorBedding(1.12);
  customGroup.add(customBed);

  // Warm interior PointLight when camper is inside the tent
  const interiorLight = new THREE.PointLight(0xffcb6b, 0.0, 5.5, 1.5);
  interiorLight.position.set(0, 1.1, -0.2);
  tentZone.add(interiorLight);

  // Click hitbox for Custom Tent
  const customHit = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.5, 2.1, 10),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  customHit.position.y = 1.05;
  customHit.userData = { seatIndex, tentType: 'custom' };
  customGroup.add(customHit);
  tentClickMeshes.push(customHit);

  // Level 2 Extra: Wooden Cabin Tarp & Stove Chimney
  const tarpGroup = new THREE.Group();
  tarpGroup.visible = false;
  const tarpRoof = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 0.08, 2.4),
    new THREE.MeshStandardMaterial({ color: 0x5c3d28, roughness: 0.85 })
  );
  tarpRoof.position.set(0, 2.15, 0.3);
  tarpRoof.rotation.x = 0.15;
  tarpGroup.add(tarpRoof);

  const chimney = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 2.6, 8),
    new THREE.MeshStandardMaterial({ color: 0x2b2d42, metalness: 0.6 })
  );
  chimney.position.set(0.95, 1.3, 0);
  tarpGroup.add(chimney);
  customGroup.add(tarpGroup);

  // Optional Furniture Set (Wooden Table + Golden Lantern)
  const furnitureGroup = new THREE.Group();
  furnitureGroup.position.set(0, 0, 1.45);
  furnitureGroup.visible = false;
  const tableTop = new THREE.Mesh(
    new THREE.CylinderGeometry(0.48, 0.48, 0.06, 12),
    new THREE.MeshStandardMaterial({ color: 0x7c4d2b })
  );
  tableTop.position.y = 0.52;
  furnitureGroup.add(tableTop);
  const tableLeg = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.1, 0.52, 8),
    new THREE.MeshStandardMaterial({ color: 0x4a2c18 })
  );
  tableLeg.position.y = 0.26;
  furnitureGroup.add(tableLeg);
  const tableLantern = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 0.22, 8),
    new THREE.MeshBasicMaterial({ color: 0xffe066 })
  );
  tableLantern.position.y = 0.66;
  furnitureGroup.add(tableLantern);
  customGroup.add(furnitureGroup);

  // Optional String Lights & Flag Garland on Tent
  const lightsGroup = new THREE.Group();
  lightsGroup.visible = false;
  for (let b = 0; b < 8; b++) {
    const a = (b / 8) * Math.PI * 2;
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.065, 8, 8),
      new THREE.MeshBasicMaterial({ color: b % 2 === 0 ? 0xffe066 : 0xff7b54 })
    );
    bulb.position.set(Math.cos(a) * 1.42, 0.82, Math.sin(a) * 1.42);
    lightsGroup.add(bulb);
  }
  const topFlag = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 0.35, 4),
    new THREE.MeshBasicMaterial({ color: 0xffbe0b })
  );
  topFlag.position.y = 2.2;
  lightsGroup.add(topFlag);
  customGroup.add(lightsGroup);

  tentZone.add(customGroup);

  return {
    tentZone,
    origGroup,
    origMat,
    customGroup,
    customTentMat,
    interiorLight,
    tarpGroup,
    furnitureGroup,
    lightsGroup
  };
}

for (let i = 0; i < MAX_SEATS; i++) {
  const angle = (i / MAX_SEATS) * Math.PI * 2;
  const x = Math.cos(angle) * SEAT_RADIUS;
  const z = Math.sin(angle) * SEAT_RADIUS;
  // EXACT inward rotation so character ALWAYS sits facing directly into the campfire (0,0,0)!
  const lookAngle = Math.atan2(-x, -z);

  const seatGroup = new THREE.Group();
  seatGroup.position.set(x, 0, z);
  seatGroup.rotation.y = lookAngle; // +Z of seatGroup points straight to the campfire!
  scene.add(seatGroup);

  // Log Bench perpendicular to the fire sightline
  const bench = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.5, 14), logSeatMat);
  bench.rotation.z = Math.PI / 2;
  bench.position.y = 0.35;
  bench.castShadow = true;
  bench.receiveShadow = true;
  seatGroup.add(bench);

  const capL = new THREE.Mesh(new THREE.CircleGeometry(0.34, 14), logEndMat);
  capL.rotation.y = -Math.PI / 2;
  capL.position.set(-0.751, 0.35, 0);
  const capR = new THREE.Mesh(new THREE.CircleGeometry(0.34, 14), logEndMat);
  capR.rotation.y = Math.PI / 2;
  capR.position.set(0.751, 0.35, 0);
  seatGroup.add(capL, capR);

  // Personal Firewood Pile beside the log
  const woodPileGroup = new THREE.Group();
  woodPileGroup.position.set(1.05, 0, 0.15);
  seatGroup.add(woodPileGroup);

  // Seat Tents (Original Base Tent + Custom Upgraded Tent)
  const tentParts = buildSeatTents(i);
  seatGroup.add(tentParts.tentZone);
  tentParts.tentZone.visible = false; // Shown only for occupied seats!

  const hitMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.55, 0.9, 1.1),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitMesh.position.y = 0.42;
  hitMesh.userData = { seatIndex: i };
  seatGroup.add(hitMesh);
  seatClickMeshes.push(hitMesh);

  seats.push({
    index: i,
    group: seatGroup,
    bench,
    woodPileGroup,
    tentParts,
    x,
    z,
    angle,
    lookAngle
  });
}

function updateHUDCounters() {
  document.getElementById('myBranchesDisplay').textContent = `${state.myBranches}개`;
  const rawEl = document.getElementById('myRawMeatDisplay');
  if (rawEl) rawEl.textContent = `${state.myRawMeat}점`;
  document.getElementById('myMeatDisplay').textContent = `${state.myMeat}개`;
  document.getElementById('myCoinDisplay').textContent = `${state.myCoins}`;
  const shopCoin = document.getElementById('shopCoinDisplay');
  if (shopCoin) shopCoin.textContent = `${state.myCoins}`;

  const exploreLbl = document.getElementById('exploreBtnLabel');
  if (exploreLbl) {
    exploreLbl.textContent = state.freeRoamPos ? '모닥불로 귀환' : '멀리 산책하기';
  }

  const fireTempEl = document.getElementById('fireTempDisplay');
  const fireBtnLabel = document.getElementById('fireBtnLabel');
  if (!state.fireLit) {
    fireTempEl.textContent = '점화 전';
    if (fireBtnLabel) fireBtnLabel.textContent = '불 피우기!';
  } else {
    fireTempEl.textContent = `${state.fireHeat}°C`;
    if (fireBtnLabel) fireBtnLabel.textContent = '장작 넣기';
  }

  // Update My Woodpile Visual
  seats.forEach((s) => {
    while (s.woodPileGroup.children.length > 0) {
      s.woodPileGroup.remove(s.woodPileGroup.children[0]);
    }
  });
  const mySeat = seats[state.mySeatIndex] || seats[0];
  const count = Math.min(12, state.myBranches);
  for (let i = 0; i < count; i++) {
    const b = createTreeBranchBundleMesh();
    b.scale.setScalar(0.65);
    const row = Math.floor(i / 2);
    const col = i % 2;
    b.position.set((col - 0.5) * 0.22, 0.06 + row * 0.09, 0);
    sRot(b, i);
    mySeat.woodPileGroup.add(b);
  }
}

function sRot(mesh, i) {
  mesh.rotation.y = i % 2 === 0 ? 0.15 : -0.15;
}

function getSeatTentWorldPos(seatIndex, useCustomTent = false) {
  const seat = seats[seatIndex] || seats[0];
  seat.group.updateMatrixWorld(true);
  const targetVec = new THREE.Vector3();
  if (useCustomTent) {
    seat.tentParts.customGroup.getWorldPosition(targetVec);
  } else {
    seat.tentParts.origGroup.getWorldPosition(targetVec);
  }
  return targetVec;
}

function syncTentsForUsers() {
  seats.forEach((s) => {
    s.tentParts.tentZone.visible = false;
  });

  state.users.forEach((u) => {
    const seat = seats[u.seatIndex];
    if (!seat) return;
    const tp = seat.tentParts;
    tp.tentZone.visible = true; // Original base tent is ALWAYS visible behind occupied seat!

    const isMe = u.id === state.clientId;
    const tLevel = isMe ? state.tentLevel : (u.tentLevel || 0);
    const tColor = isMe ? state.tentColor : (u.tentColor || '#d48b45');
    const hasFurn = isMe ? state.hasFurniture : Boolean(u.hasFurniture);
    const hasLight = isMe ? state.hasLights : Boolean(u.hasLights);
    const inTent = isMe ? state.inTent : Boolean(u.inTent || u.action === 'sleep');

    const hasCustom = tLevel >= 1 || hasFurn || hasLight;
    tp.customGroup.visible = hasCustom;
    tp.customTentMat.color.set(tColor);
    tp.tarpGroup.visible = tLevel >= 2;
    tp.furnitureGroup.visible = hasFurn;
    tp.lightsGroup.visible = hasLight;

    // When camper is inside the tent, make the active tent softly see-through (cutaway view) & light up the interior!
    tp.origMat.opacity = (inTent && !hasCustom) ? 0.36 : 1.0;
    tp.customTentMat.opacity = (inTent && hasCustom) ? 0.36 : 1.0;
    tp.interiorLight.intensity = inTent ? 2.4 : 0.35;
  });
}

// ====================================================
// 6. 3D CAMPER CHARACTER + MULTI-CHUNK MEAT SKEWER PROP
// ====================================================
const camperMeshes = new Map();
const camperHitMeshes = [];

function createCamper3D(user) {
  const group = new THREE.Group();
  group.scale.setScalar(1.32);

  const bodyRoot = new THREE.Group();
  group.add(bodyRoot);

  const coatColor = new THREE.Color(user.color || '#ff6b4a');
  const coatMat = new THREE.MeshStandardMaterial({ color: coatColor, roughness: 0.65 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x323c4d, roughness: 0.8 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x4f311c, roughness: 0.85 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffe3c8, roughness: 0.55 });

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

    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.12, 0.26), bootMat);
    boot.position.set(0, -0.34, 0.05);
    boot.castShadow = true;
    kneePivot.add(boot);

    return { hipPivot, kneePivot };
  }

  const leftLeg = buildLeg(-1);
  const rightLeg = buildLeg(1);
  bodyRoot.add(leftLeg.hipPivot, rightLeg.hipPivot);

  const torsoPivot = new THREE.Group();
  torsoPivot.position.set(0, 0.48, 0);
  bodyRoot.add(torsoPivot);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.36, 0.76, 16), coatMat);
  torso.position.y = 0.38;
  torso.castShadow = true;
  torsoPivot.add(torso);

  const scarf = new THREE.Mesh(
    new THREE.TorusGeometry(0.22, 0.07, 10, 18),
    new THREE.MeshStandardMaterial({ color: 0xfff0d4, roughness: 0.8 })
  );
  scarf.rotation.x = Math.PI / 2;
  scarf.position.y = 0.76;
  torsoPivot.add(scarf);

  const headGroup = new THREE.Group();
  headGroup.position.y = 0.98;
  torsoPivot.add(headGroup);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 18), skinMat);
  head.castShadow = true;
  headGroup.add(head);

  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1e1610 });
  const cheekMat = new THREE.MeshBasicMaterial({ color: 0xff8577, transparent: true, opacity: 0.65 });
  [-1, 1].forEach((s) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), eyeMat);
    eye.position.set(s * 0.085, 0.03, 0.235);
    headGroup.add(eye);
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), cheekMat);
    cheek.position.set(s * 0.13, -0.03, 0.22);
    headGroup.add(cheek);
  });

  const beanieMat = new THREE.MeshStandardMaterial({
    color: coatColor.clone().multiplyScalar(0.75),
    roughness: 0.85
  });
  const beanie = new THREE.Mesh(
    new THREE.SphereGeometry(0.275, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.58),
    beanieMat
  );
  beanie.position.y = 0.02;
  beanie.rotation.x = -0.12;
  headGroup.add(beanie);

  const pomPom = new THREE.Mesh(new THREE.SphereGeometry(0.072, 10, 10), new THREE.MeshStandardMaterial({ color: 0xfff8eb }));
  pomPom.position.set(0, 0.3, -0.04);
  headGroup.add(pomPom);

  function buildArm(sideSign) {
    const shoulder = new THREE.Group();
    shoulder.position.set(sideSign * 0.28, 0.68, 0.04);

    const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.062, 0.42, 10), coatMat);
    upperArm.rotation.x = Math.PI / 2;
    upperArm.position.set(0, -0.02, 0.2);
    upperArm.castShadow = true;
    shoulder.add(upperArm);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), skinMat);
    hand.position.set(0, -0.02, 0.44);
    hand.castShadow = true;
    shoulder.add(hand);

    return { shoulder, hand };
  }

  const leftArm = buildArm(-1);
  const rightArm = buildArm(1);
  torsoPivot.add(leftArm.shoulder, rightArm.shoulder);

  // 1. Hand Warm Glow
  const handWarmGlow = new THREE.Mesh(
    new THREE.RingGeometry(0.12, 0.28, 24),
    new THREE.MeshBasicMaterial({ color: 0xffaa33, side: THREE.DoubleSide, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending })
  );
  handWarmGlow.position.set(0, 0.56, 0.65);
  torsoPivot.add(handWarmGlow);

  // 2. Held Firewood Log & Branch Bundle
  const heldLogMesh = createFirewoodLogMesh(0.95, 0.13);
  heldLogMesh.rotation.z = Math.PI / 2;
  heldLogMesh.position.set(0, 0.54, 0.52);
  heldLogMesh.visible = false;
  torsoPivot.add(heldLogMesh);

  const heldBranchMesh = createTreeBranchBundleMesh();
  heldBranchMesh.position.set(0, 0.54, 0.52);
  heldBranchMesh.visible = false;
  torsoPivot.add(heldBranchMesh);

  // 3. Big Sizzling BBQ Meat Skewer (숲속 사냥 바비큐 꼬치구이!)
  const skewerGroup = new THREE.Group();
  const stick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.016, 1.25, 8),
    new THREE.MeshStandardMaterial({ color: 0xd8a47f })
  );
  stick.rotation.x = Math.PI / 2;
  stick.position.z = 0.6;
  skewerGroup.add(stick);

  const meatChunks = [];
  for (let m = 0; m < 3; m++) {
    const chunkMat = new THREE.MeshStandardMaterial({
      color: 0xd9483b, // Raw savory meat red -> roasts to golden BBQ brown!
      roughness: 0.45
    });
    const chunk = new THREE.Mesh(new THREE.DodecahedronGeometry(0.105, 1), chunkMat);
    chunk.scale.set(1.15, 0.95, 0.85);
    chunk.position.z = 0.86 + m * 0.16;
    skewerGroup.add(chunk);
    meatChunks.push(chunk);
  }
  skewerGroup.position.set(0.14, 0.56, 0.36);
  skewerGroup.visible = false;
  torsoPivot.add(skewerGroup);

  // 3B. Raw Meat Chunk held in Left Hand when threading onto the Skewer (🍢 꼬치 끼우기!)
  const threadingMeatMesh = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.11, 1),
    new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.42 })
  );
  threadingMeatMesh.scale.set(1.2, 0.95, 0.85);
  threadingMeatMesh.position.set(0.04, -0.02, 0.46);
  threadingMeatMesh.visible = false;
  leftArm.shoulder.add(threadingMeatMesh);

  // 4. Steaming Cocoa Mug
  const coffeeGroup = new THREE.Group();
  const mug = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.095, 0.22, 16),
    new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.25 })
  );
  coffeeGroup.add(mug);
  const cocoaTop = new THREE.Mesh(
    new THREE.CircleGeometry(0.098, 14),
    new THREE.MeshBasicMaterial({ color: 0x4a2511 })
  );
  cocoaTop.rotation.x = -Math.PI / 2;
  cocoaTop.position.y = 0.105;
  coffeeGroup.add(cocoaTop);

  const steamRings = [];
  for (let s = 0; s < 3; s++) {
    const steam = new THREE.Mesh(
      new THREE.TorusGeometry(0.045 + s * 0.015, 0.012, 6, 12),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.65 })
    );
    steam.rotation.x = Math.PI / 2;
    steam.position.y = 0.16 + s * 0.09;
    coffeeGroup.add(steam);
    steamRings.push(steam);
  }
  coffeeGroup.position.set(0, 0.58, 0.52);
  coffeeGroup.visible = false;
  torsoPivot.add(coffeeGroup);

  // 5. Sparkler Wand
  const sparklerGroup = new THREE.Group();
  const spRod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, 0.85, 6),
    new THREE.MeshBasicMaterial({ color: 0xdddddd })
  );
  spRod.rotation.x = Math.PI / 2.15;
  spRod.position.z = 0.42;
  sparklerGroup.add(spRod);
  const spCore = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.11, 1),
    new THREE.MeshBasicMaterial({ color: 0xfff380 })
  );
  spCore.position.set(0, -0.04, 0.85);
  sparklerGroup.add(spCore);
  sparklerGroup.position.set(-0.16, 0.58, 0.36);
  sparklerGroup.visible = false;
  torsoPivot.add(sparklerGroup);

  // 6. 3D Multi-Compartment Camping Bento Lunchbox (도시락 + 젓가락!)
  const bentoGroup = new THREE.Group();
  // Outer wooden/red lacquer bento box tray
  const bentoBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.08, 0.30),
    new THREE.MeshStandardMaterial({ color: 0xc93b2b, roughness: 0.45 })
  );
  bentoGroup.add(bentoBox);
  // Inner dark tray rim
  const bentoInner = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.084, 0.26),
    new THREE.MeshStandardMaterial({ color: 0x261c18, roughness: 0.7 })
  );
  bentoGroup.add(bentoInner);
  // Fluffy white steamed rice compartment (left half)
  const riceBed = new THREE.Mesh(
    new THREE.BoxGeometry(0.17, 0.05, 0.23),
    new THREE.MeshStandardMaterial({ color: 0xfffcf5, roughness: 0.85 })
  );
  riceBed.position.set(-0.09, 0.032, 0);
  bentoGroup.add(riceBed);
  // Red plum / sesame topping on rice
  const plumDot = new THREE.Mesh(
    new THREE.SphereGeometry(0.025, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xd62828 })
  );
  plumDot.position.set(-0.09, 0.06, 0);
  bentoGroup.add(plumDot);
  // Golden rolled egg (계란말이) & grilled sausages + broccoli (right half)
  const eggRoll = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.05, 0.07),
    new THREE.MeshStandardMaterial({ color: 0xffca3a, roughness: 0.6 })
  );
  eggRoll.position.set(0.09, 0.035, -0.06);
  bentoGroup.add(eggRoll);
  const sausage = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.028, 0.13, 8),
    new THREE.MeshStandardMaterial({ color: 0xb5442e, roughness: 0.5 })
  );
  sausage.rotation.z = Math.PI / 2;
  sausage.position.set(0.09, 0.038, 0.02);
  bentoGroup.add(sausage);
  const broccoli = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.04, 1),
    new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.8 })
  );
  broccoli.position.set(0.09, 0.042, 0.085);
  bentoGroup.add(broccoli);

  bentoGroup.position.set(0, 0.50, 0.48);
  bentoGroup.visible = false;
  torsoPivot.add(bentoGroup);

  // Wooden Chopsticks held in Right Hand when eating Bento!
  const chopstickGroup = new THREE.Group();
  [-0.015, 0.015].forEach((offset, idx) => {
    const stickMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.005, 0.28, 6),
      new THREE.MeshStandardMaterial({ color: 0xe0a96d })
    );
    stickMesh.rotation.z = idx === 0 ? 0.08 : -0.08;
    stickMesh.position.x = offset;
    chopstickGroup.add(stickMesh);
  });
  // Bite of food on the chopstick tip!
  const biteFood = new THREE.Mesh(
    new THREE.SphereGeometry(0.032, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xffca3a })
  );
  biteFood.position.set(0, -0.13, 0);
  chopstickGroup.add(biteFood);
  chopstickGroup.position.set(-0.04, -0.02, 0.46);
  chopstickGroup.rotation.x = Math.PI / 3;
  chopstickGroup.visible = false;
  rightArm.shoulder.add(chopstickGroup);

  const hitBox = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.55, 1.9, 8),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitBox.position.y = 0.95;
  hitBox.userData = { camperId: user.id, seatIndex: user.seatIndex };
  group.add(hitBox);
  camperHitMeshes.push(hitBox);

  const bubbleEl = document.createElement('div');
  bubbleEl.className = 'char-action-bubble';
  bubbleContainer.appendChild(bubbleEl);

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
    handWarmGlow,
    heldLogMesh,
    heldBranchMesh,
    skewerGroup,
    meatChunks,
    threadingMeatMesh,
    coffeeGroup,
    steamRings,
    sparklerGroup,
    spCore,
    bentoGroup,
    chopstickGroup,
    hitBox,
    bubbleEl,
    seatIndex: user.seatIndex,
    action: user.action || 'hands',
    inTent: Boolean(user.inTent || user.action === 'sleep'),
    tentWalkState: null,
    freeRoamPos: null,
    makingSkewerStartTime: 0,
    lastSkewerPopStep: 0,
    name: user.name,
    color: user.color,
    roastStartTime: Date.now(),
    nodUntil: 0,
    offeringUntil: 0,
    offeringGiftType: 'skewer',
    receivingUntil: 0,
    placingLogState: null,
    gatheringState: null,
    huntingState: null,
    arcWalkState: null, // Circular pathfinding around the campfire (never walks through fire!)
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

// Helper: Start a circular perimeter walk so the character NEVER walks across the fire (0,0,0)!
function startSafePerimeterWalk(camper, targetX, targetZ, onArrive) {
  const startX = camper.group.position.x;
  const startZ = camper.group.position.z;
  const startAngle = Math.atan2(startZ, startX);
  const endAngle = Math.atan2(targetZ, targetX);
  const startRadius = Math.max(3.4, Math.hypot(startX, startZ));
  const endRadius = Math.max(3.4, Math.hypot(targetX, targetZ));

  // Shortest angular difference (-PI to +PI)
  let deltaAngle = endAngle - startAngle;
  while (deltaAngle > Math.PI) deltaAngle -= Math.PI * 2;
  while (deltaAngle < -Math.PI) deltaAngle += Math.PI * 2;

  const arcDist = Math.abs(deltaAngle) * ((startRadius + endRadius) * 0.5) + Math.abs(endRadius - startRadius);
  const duration = Math.max(0.45, Math.min(2.2, arcDist / 4.2));

  camper.arcWalkState = {
    startTime: Date.now(),
    duration: duration * 1000,
    startAngle,
    deltaAngle,
    startRadius,
    endRadius,
    targetX,
    targetZ,
    onArrive
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
    camper.inTent = u.id === state.clientId ? state.inTent : Boolean(u.inTent || u.action === 'sleep');
    camper.name = u.name;
    camper.hitBox.userData.seatIndex = u.seatIndex;

    const seat = seats[u.seatIndex] || seats[0];
    if (prevSeat !== u.seatIndex && !camper.arcWalkState && !camper.tentWalkState) {
      camper.group.position.set(seat.x, 0, seat.z);
      camper.group.rotation.y = seat.lookAngle;
    } else if (!camper.arcWalkState && !camper.tentWalkState && !camper.placingLogState && !camper.gatheringState && !camper.huntingState && camper.group.position.lengthSq() < 0.01) {
      camper.group.position.set(seat.x, 0, seat.z);
      camper.group.rotation.y = seat.lookAngle;
    }
  });

  for (const [id, camper] of camperMeshes.entries()) {
    if (!activeIds.has(id)) {
      scene.remove(camper.group);
      if (camper.bubbleEl) camper.bubbleEl.remove();
      const idx = camperHitMeshes.indexOf(camper.hitBox);
      if (idx !== -1) camperHitMeshes.splice(idx, 1);
      camperMeshes.delete(id);
    }
  }

  updateHUDCounters();
  syncTentsForUsers();
}

// ====================================================
// 7. WOOD GATHERING, FIRE IGNITION & ANIMAL HUNTING
// ====================================================
const activeEffects = [];
let fireRoarSurgeUntil = 0;

function triggerGatherBranchAnimation(fromSeatIndex, specificBranchIndex = null, isMe = false) {
  let actor = null;
  for (const c of camperMeshes.values()) {
    if (c.seatIndex === fromSeatIndex) {
      actor = c;
      break;
    }
  }
  const seat = seats[fromSeatIndex] || seats[0];
  if (!actor) return;

  let targetBranch = null;
  if (typeof specificBranchIndex === 'number' && forageBranches[specificBranchIndex] && forageBranches[specificBranchIndex].available) {
    targetBranch = forageBranches[specificBranchIndex];
  } else {
    let bestDist = Infinity;
    for (const b of forageBranches) {
      if (!b.available) continue;
      const d = Math.hypot(b.x - seat.x, b.z - seat.z);
      if (d < bestDist) {
        bestDist = d;
        targetBranch = b;
      }
    }
  }

  if (!targetBranch) {
    forageBranches.forEach((b) => {
      b.available = true;
      b.group.visible = true;
    });
    targetBranch = forageBranches[0];
  }

  actor.placingLogState = null;
  actor.huntingState = null;
  actor.gatheringState = { phase: 'walkingOut', branch: targetBranch };

  if (isMe) {
    sendServerAction({ type: 'gatherBranch', branchIndex: targetBranch.index });
    showCenterNotice('🌿 나무를 주우러 걸어갑니다!');
  }

  startSafePerimeterWalk(actor, targetBranch.x, targetBranch.z, () => {
    if (!actor.gatheringState) return;
    actor.gatheringState.phase = 'pickup';
    actor.gatheringState.pickupTime = Date.now();
    targetBranch.available = false;
    targetBranch.group.visible = false;
    soundEngine.playPickupPop();

    setTimeout(() => {
      targetBranch.available = true;
      targetBranch.group.visible = true;
    }, 12000);

    setTimeout(() => {
      if (!actor.gatheringState) return;
      actor.gatheringState.phase = 'walkingBack';
      startSafePerimeterWalk(actor, seat.x, seat.z, () => {
        actor.group.position.set(seat.x, 0, seat.z);
        actor.group.rotation.y = seat.lookAngle;
        actor.gatheringState = null;
        if (isMe) {
          state.myBranches++;
          updateHUDCounters();
          soundEngine.playHappyChime();
          showCenterNotice(`🌿 나무 +1 획득! (보유: ${state.myBranches}개) 이제 '🔥 불 피우기'를 눌러보세요!`);
        }
      });
    }, 450);
  });
}

// 🏹 Forest Animal Hunting Sequence (Earns +25 Coins & +2 Meat Skewers!)
function triggerHuntAnimalAnimation(fromSeatIndex, specificAnimalIndex = null, isMe = false) {
  let actor = null;
  for (const c of camperMeshes.values()) {
    if (c.seatIndex === fromSeatIndex) {
      actor = c;
      break;
    }
  }
  const seat = seats[fromSeatIndex] || seats[0];
  if (!actor) return;

  let targetAnimal = null;
  if (typeof specificAnimalIndex === 'number' && forestAnimals[specificAnimalIndex] && forestAnimals[specificAnimalIndex].available) {
    targetAnimal = forestAnimals[specificAnimalIndex];
  } else {
    let bestDist = Infinity;
    for (const a of forestAnimals) {
      if (!a.available) continue;
      const d = Math.hypot(a.x - seat.x, a.z - seat.z);
      if (d < bestDist) {
        bestDist = d;
        targetAnimal = a;
      }
    }
  }

  if (!targetAnimal) {
    forestAnimals.forEach((a) => {
      a.available = true;
      a.group.visible = true;
    });
    targetAnimal = forestAnimals[0];
  }

  actor.placingLogState = null;
  actor.gatheringState = null;
  actor.huntingState = { phase: 'chasing', animal: targetAnimal };

  if (isMe) {
    sendServerAction({ type: 'huntAnimal', animalIndex: targetAnimal.index });
    showCenterNotice(`🏹 ${targetAnimal.cfg.name} 사냥하러 출동!`);
  }

  startSafePerimeterWalk(actor, targetAnimal.x, targetAnimal.z, () => {
    if (!actor.huntingState) return;
    actor.huntingState.phase = 'catching';
    targetAnimal.available = false;
    targetAnimal.group.visible = false;
    soundEngine.playCoinSound();

    setTimeout(() => {
      targetAnimal.available = true;
      targetAnimal.group.visible = true;
    }, 14000);

    setTimeout(() => {
      if (!actor.huntingState) return;
      actor.huntingState.phase = 'returning';
      startSafePerimeterWalk(actor, seat.x, seat.z, () => {
        actor.group.position.set(seat.x, 0, seat.z);
        actor.group.rotation.y = seat.lookAngle;
        actor.huntingState = null;
        if (isMe) {
          state.freeRoamPos = null;
          state.myRawMeat += 3;
          state.myCoins += 25;
          saveProgress();
          updateHUDCounters();
          updateDockActiveButtons();
          showCenterNotice(
            `🏹 ${targetAnimal.cfg.name} 사냥 성공! 🥩 생고기 +3점, 🪙 +25코인 획득! 이제 [🍢 꼬치 끼우기]로 꼬치를 만들어보세요!`
          );
        }
      });
    }, 450);
  });
}

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

  const fireEdgeDist = 1.95;
  const targetX = Math.cos(seat.angle) * fireEdgeDist;
  const targetZ = Math.sin(seat.angle) * fireEdgeDist;

  actor.gatheringState = null;
  actor.huntingState = null;
  actor.arcWalkState = null;
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
  if (dynamicLogsGroup.children.length >= 12) {
    dynamicLogsGroup.remove(dynamicLogsGroup.children[0]);
  }

  const newPiece = createTreeBranchBundleMesh();
  const r = 0.22 + Math.random() * 0.25;
  newPiece.position.set(Math.cos(angle) * r, 0.42 + dynamicLogsGroup.children.length * 0.04, Math.sin(angle) * r);
  newPiece.rotation.y = Math.random() * Math.PI;
  dynamicLogsGroup.add(newPiece);

  soundEngine.playWoodRoar();
  fireRoarSurgeUntil = Date.now() + 3800;

  for (let i = 0; i < 36; i++) {
    const sp = new THREE.Mesh(
      new THREE.SphereGeometry(0.042, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 1, blending: THREE.AdditiveBlending })
    );
    sp.position.set((Math.random() - 0.5) * 0.8, 0.5, (Math.random() - 0.5) * 0.8);
    scene.add(sp);
    const vx = (Math.random() - 0.5) * 2.5;
    const vy = 2.3 + Math.random() * 2.8;
    const vz = (Math.random() - 0.5) * 2.5;
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
// 8. GENTLE TWO-HANDED SHARING (AROUND THE PERIMETER!)
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

function animateWalkAndOfferGift(fromSeat, targetSeat, giftType = 'skewer', actorName = '캠퍼') {
  let giver = null;
  let receiver = null;
  for (const c of camperMeshes.values()) {
    if (c.seatIndex === fromSeat) giver = c;
    if (c.seatIndex === targetSeat) receiver = c;
  }
  if (!giver) return;

  const targetPosSeat = seats[targetSeat] || seats[0];
  const standAngle = targetPosSeat.angle - 0.24;
  const standX = Math.cos(standAngle) * SEAT_RADIUS;
  const standZ = Math.sin(standAngle) * SEAT_RADIUS;

  giver.offeringGiftType = giftType;
  startSafePerimeterWalk(giver, standX, standZ, () => {
    giver.group.rotation.y = Math.atan2(targetPosSeat.x - standX, targetPosSeat.z - standZ);
    giver.offeringUntil = Date.now() + 6000;

    if (targetSeat === state.mySeatIndex && fromSeat !== state.mySeatIndex) {
      state.pendingGiftOffer = { fromSeat, giftType, actorName };
      giftOfferIcon.textContent = giftType === 'coffee' ? '☕' : '🍖';
      const itemLabel = giftType === 'coffee' ? '따뜻한 코코아' : '노릇한 바비큐 꼬치';
      giftOfferMessage.innerHTML = `<strong>${actorName}</strong>님이 ${itemLabel}를 건넵니다!`;
      giftOfferBanner.classList.remove('hidden');
      soundEngine.playHappyChime();
    } else if (!receiver || receiver.id.startsWith('sim_')) {
      setTimeout(() => {
        completeGiftAcceptance(fromSeat, targetSeat, giftType);
      }, 1500);
    }
  });
}

function completeGiftAcceptance(fromSeat, targetSeat, giftType = 'skewer') {
  let giver = null;
  let receiver = null;
  for (const c of camperMeshes.values()) {
    if (c.seatIndex === fromSeat) giver = c;
    if (c.seatIndex === targetSeat) receiver = c;
  }

  soundEngine.playHappyChime();

  if (receiver) {
    receiver.receivingUntil = Date.now() + 3200;
    receiver.nodUntil = Date.now() + 2200;
    receiver.action = giftType === 'coffee' ? 'coffee' : 'skewer';
    receiver.roastStartTime = Date.now() - 8000;
  }

  if (giver) {
    giver.offeringUntil = 0;
    giver.nodUntil = Date.now() + 1800;
    const homeSeat = seats[giver.seatIndex] || seats[0];
    setTimeout(() => {
      if (!giver) return;
      startSafePerimeterWalk(giver, homeSeat.x, homeSeat.z, () => {
        giver.group.position.set(homeSeat.x, 0, homeSeat.z);
        giver.group.rotation.y = homeSeat.lookAngle;
      });
    }, 900);
  }
}

acceptGiftBtn.addEventListener('click', () => {
  giftOfferBanner.classList.add('hidden');
  if (!state.pendingGiftOffer) return;
  const { fromSeat, giftType, actorName } = state.pendingGiftOffer;
  state.pendingGiftOffer = null;

  state.myAction = giftType === 'coffee' ? 'coffee' : 'skewer';
  updateDockActiveButtons();
  sendServerAction({ type: 'pose', action: state.myAction });
  sendServerAction({ type: 'acceptGift', fromSeat, giftType });
  completeGiftAcceptance(fromSeat, state.mySeatIndex, giftType);
  showCenterNotice(`🙏 ${actorName}님의 선물을 받았습니다!`);
});

declineGiftBtn.addEventListener('click', () => {
  giftOfferBanner.classList.add('hidden');
  state.pendingGiftOffer = null;
});

// ====================================================
// 9. ACTION BUTTON HANDLERS & TENT SHOP
// ====================================================
function updateDockActiveButtons() {
  document.querySelectorAll('#dockActionsContainer .action-btn').forEach((btn) => {
    const act = btn.dataset.action;
    if (act === 'enterTent') {
      btn.classList.toggle('active-pose', state.inTent);
    } else {
      btn.classList.toggle('active-pose', act === state.myAction);
    }
  });
  const enterIcon = document.getElementById('enterTentIcon');
  const enterLabel = document.getElementById('enterTentLabel');
  if (enterIcon && enterLabel) {
    enterIcon.textContent = state.inTent ? '🔥' : '🏕️';
    enterLabel.textContent = state.inTent ? '모닥불로 나오기' : '텐트 들어가기';
  }
}

document.querySelectorAll('#dockActionsContainer .action-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    triggerCampfireAction(btn.dataset.action);
  });
});

// Helper: Smoothly walk character between their log seat and inside their tent!
function startTentTransitionWalk(camper, toInsideTent, onComplete) {
  if (!camper) return;
  const seat = seats[camper.seatIndex] || seats[0];
  const isMe = camper.id === state.clientId;
  const useCustom = isMe
    ? (state.tentLevel >= 1 || state.hasFurniture || state.hasLights)
    : true;
  const tentPos = getSeatTentWorldPos(camper.seatIndex, useCustom);

  const startX = camper.group.position.x;
  const startZ = camper.group.position.z;
  const targetX = toInsideTent ? tentPos.x : seat.x;
  const targetZ = toInsideTent ? tentPos.z : seat.z;

  camper.arcWalkState = null;
  camper.placingLogState = null;
  camper.gatheringState = null;
  camper.huntingState = null;

  camper.tentWalkState = {
    startTime: Date.now(),
    duration: 750,
    startX,
    startZ,
    targetX,
    targetZ,
    lookAngle: seat.lookAngle,
    onComplete
  };
}

function exitTentIfNeeded(myCamper) {
  if (!state.inTent && !state.freeRoamPos) return;
  state.inTent = false;
  state.freeRoamPos = null;
  walkTargetRing.material.opacity = 0.0;
  if (myCamper) {
    myCamper.inTent = false;
    myCamper.freeRoamPos = null;
    myCamper.bodyRoot.position.set(0, 0, 0);
  }
  syncTentsForUsers();
  updateHUDCounters();
  updateDockActiveButtons();
}

// Helper: Walk freely out to any point (targetX, targetZ) in the wide forest!
function startFreeRoamWalkTo(targetX, targetZ) {
  const myCamper = camperMeshes.get(state.clientId);
  if (!myCamper) return;

  if (state.inTent) {
    state.inTent = false;
    myCamper.inTent = false;
    myCamper.bodyRoot.position.set(0, 0, 0);
    syncTentsForUsers();
  }

  state.freeRoamPos = { x: targetX, z: targetZ };
  myCamper.freeRoamPos = { x: targetX, z: targetZ };
  walkTargetRing.position.set(targetX, 0.04, targetZ);
  walkTargetRing.material.opacity = 0.75;
  updateHUDCounters();
  updateDockActiveButtons();

  startSafePerimeterWalk(myCamper, targetX, targetZ, () => {
    myCamper.group.position.set(targetX, 0, targetZ);
    // Face slightly toward the campfire or outward scenic view
    myCamper.group.rotation.y = Math.atan2(-targetX, -targetZ);
    walkTargetRing.material.opacity = 0.25;
    soundEngine.playPickupPop();
  });
}

function triggerCampfireAction(actionId) {
  soundEngine.init();
  const myCamper = camperMeshes.get(state.clientId);

  switch (actionId) {
    case 'explore': {
      if (state.freeRoamPos) {
        // Walk back to campfire log seat!
        const homeSeat = seats[state.mySeatIndex] || seats[0];
        state.freeRoamPos = null;
        walkTargetRing.material.opacity = 0.0;
        if (myCamper) {
          myCamper.freeRoamPos = null;
          startSafePerimeterWalk(myCamper, homeSeat.x, homeSeat.z, () => {
            myCamper.group.position.set(homeSeat.x, 0, homeSeat.z);
            myCamper.group.rotation.y = homeSeat.lookAngle;
          });
        }
        updateHUDCounters();
        updateDockActiveButtons();
        showCenterNotice('🔥 숲속 산책을 마치고 모닥불 통나무 자리로 돌아왔습니다!');
      } else {
        // Pick a scenic outer forest spot (radius 13.5m ~ 20.5m) and walk out there!
        const mySeat = seats[state.mySeatIndex] || seats[0];
        const roamAngle = mySeat.angle + (Math.random() * 1.4 - 0.7);
        const roamRadius = 14.0 + Math.random() * 6.5;
        const tx = Math.cos(roamAngle) * roamRadius;
        const tz = Math.sin(roamAngle) * roamRadius;
        startFreeRoamWalkTo(tx, tz);
        showCenterNotice('🥾 깊은 숲속으로 멀리 산책을 나갑니다! (숲 바닥 어디든 클릭해도 걸어갈 수 있어요!)');
      }
      break;
    }
    case 'makeSkewer': {
      if (state.myRawMeat <= 0) {
        showCenterNotice('🥩 꼬치에 끼울 생고기가 없어요! 먼저 [🏹 동물 사냥]으로 고기를 잡아오세요!');
        exitTentIfNeeded(myCamper);
        triggerHuntAnimalAnimation(state.mySeatIndex, null, true);
        return;
      }
      state.myAction = 'makeSkewer';
      if (myCamper) {
        myCamper.makingSkewerStartTime = Date.now();
        myCamper.lastSkewerPopStep = 0;
      }
      updateDockActiveButtons();
      soundEngine.playPickupPop();
      sendServerAction({ type: 'pose', action: 'makeSkewer', inTent: state.inTent });
      showCenterNotice('🍢 잡은 생고기를 꼬치 막대에 한 점씩 쏙쏙 끼웁니다! (1/3 → 2/3 → 3/3)');
      break;
    }
    case 'enterTent': {
      state.freeRoamPos = null;
      walkTargetRing.material.opacity = 0.0;
      if (myCamper) myCamper.freeRoamPos = null;
      const goingIn = !state.inTent;
      state.inTent = goingIn;
      if (goingIn && state.myAction === 'hands') {
        state.myAction = 'bento'; // Cozy default inside tent!
      } else if (!goingIn && state.myAction === 'sleep') {
        state.myAction = 'hands';
      }
      if (myCamper) myCamper.inTent = goingIn;
      syncTentsForUsers();
      updateHUDCounters();
      updateDockActiveButtons();
      sendServerAction({ type: 'pose', action: state.myAction, inTent: state.inTent });

      if (myCamper) {
        startTentTransitionWalk(myCamper, goingIn, () => {
          soundEngine.playPickupPop();
        });
      }
      showCenterNotice(
        goingIn
          ? '🏕️ 포근한 내 텐트 안으로 들어왔어요! 안에서 [잠자기]나 [도시락 먹기]를 해보세요!'
          : '🔥 텐트 밖으로 나와 모닥불 통나무 자리에 앉았습니다!'
      );
      break;
    }
    case 'sleep': {
      state.freeRoamPos = null;
      walkTargetRing.material.opacity = 0.0;
      if (myCamper) myCamper.freeRoamPos = null;
      const wasOutside = !state.inTent;
      state.inTent = true;
      state.myAction = 'sleep';
      if (myCamper) myCamper.inTent = true;
      syncTentsForUsers();
      updateHUDCounters();
      updateDockActiveButtons();
      sendServerAction({ type: 'pose', action: 'sleep', inTent: true });

      if (myCamper && wasOutside) {
        startTentTransitionWalk(myCamper, true, () => {
          soundEngine.playHappyChime();
        });
      } else {
        soundEngine.playHappyChime();
      }
      showCenterNotice('🛌 텐트 안 푹신한 침낭에 누워 쿨쿨 꿀잠을 잡니다... 💤');
      break;
    }
    case 'bento': {
      state.myAction = 'bento';
      updateDockActiveButtons();
      soundEngine.playPickupPop();
      sendServerAction({ type: 'pose', action: 'bento', inTent: state.inTent });
      showCenterNotice(
        state.inTent
          ? '🍱 아늑한 텐트 안에서 맛있는 캠핑 도시락을 까먹습니다! 냠냠!'
          : state.freeRoamPos
            ? '🍱 깊은 숲속 소풍 자리에서 맛있는 도시락을 먹습니다! 꿀맛!'
            : '🍱 모닥불 앞에서 맛있는 수제 캠핑 도시락을 먹습니다! 꿀맛!'
      );
      break;
    }
    case 'gather': {
      exitTentIfNeeded(myCamper);
      triggerGatherBranchAnimation(state.mySeatIndex, null, true);
      break;
    }
    case 'log': {
      exitTentIfNeeded(myCamper);
      if (state.myBranches <= 0) {
        showCenterNotice('🌿 나무가 부족해요! 먼저 [🌿 나무 줍기]를 눌러 나무를 모아오세요!');
        triggerGatherBranchAnimation(state.mySeatIndex, null, true);
        return;
      }
      state.myBranches--;
      const wasUnlit = !state.fireLit;
      state.fireLit = true;
      state.logsAddedCount++;
      state.fireHeat = wasUnlit ? 750 : Math.min(1300, state.fireHeat + 60);
      updateHUDCounters();

      triggerNaturalLogPlacement(state.mySeatIndex);
      sendServerAction({ type: 'throwLog' });
      showCenterNotice(
        wasUnlit
          ? '🔥 모아온 나무에 불을 붙여 모닥불이 활활 타오르기 시작합니다!'
          : `🔥 나무를 넣어 불꽃이 더 크게 타오릅니다! (${state.fireHeat}°C)`
      );
      break;
    }
    case 'hunt': {
      exitTentIfNeeded(myCamper);
      triggerHuntAnimalAnimation(state.mySeatIndex, null, true);
      break;
    }
    case 'skewer': {
      exitTentIfNeeded(myCamper);
      if (state.myMeat <= 0) {
        if (state.myRawMeat > 0) {
          showCenterNotice('🍢 생고기를 먼저 꼬치에 끼워야 해요! [🍢 꼬치 끼우기]를 시작합니다!');
          triggerCampfireAction('makeSkewer');
          return;
        }
        showCenterNotice('🍖 구울 꼬치가 없어요! 먼저 [🏹 동물 사냥]으로 고기를 구해오세요!');
        triggerHuntAnimalAnimation(state.mySeatIndex, null, true);
        return;
      }
      if (!state.fireLit) {
        showCenterNotice('🔥 먼저 [불 피우기]로 모닥불을 켜야 꼬치를 구울 수 있어요!');
        return;
      }
      state.myAction = 'skewer';
      if (myCamper) {
        myCamper.roastStartTime = Date.now();
        myCamper.meatChunks.forEach((c) => { c.visible = true; });
      }
      updateDockActiveButtons();
      sendServerAction({ type: 'pose', action: 'skewer', inTent: false });
      showCenterNotice('🍖 직접 끼운 고기 꼬치를 모닥불에 노릇노릇하게 굽습니다!');
      break;
    }
    case 'tent': {
      openTentShopModal();
      break;
    }
    case 'hands': {
      exitTentIfNeeded(myCamper);
      state.myAction = 'hands';
      updateDockActiveButtons();
      sendServerAction({ type: 'pose', action: 'hands', inTent: false });
      showCenterNotice('🤲 모닥불에 두 손을 따뜻하게 녹입니다.');
      break;
    }
    case 'coffee': {
      state.myAction = 'coffee';
      updateDockActiveButtons();
      sendServerAction({ type: 'pose', action: 'coffee', inTent: state.inTent });
      showCenterNotice('☕ 김이 모락모락 나는 따뜻한 코코아를 마십니다.');
      break;
    }
    case 'give': {
      exitTentIfNeeded(myCamper);
      if (state.users.length <= 1) {
        state.enableSoloCompanion = true;
        rebuildActiveUsersList();
      }
      const target = findNearestNeighborCamper(state.mySeatIndex);
      if (target) {
        const giftType = state.myAction === 'coffee' ? 'coffee' : 'skewer';
        animateWalkAndOfferGift(state.mySeatIndex, target.seatIndex, giftType, state.myNickname);
        sendServerAction({ type: 'offerGift', targetSeat: target.seatIndex, giftType });
        showCenterNotice(`🎁 ${target.name}에게 걸어가 선물을 건넵니다!`);
      }
      break;
    }
    case 'sparkler': {
      exitTentIfNeeded(myCamper);
      state.myAction = 'sparkler';
      updateDockActiveButtons();
      sendServerAction({ type: 'pose', action: 'sparkler', inTent: false });
      showCenterNotice('🎇 반짝반짝 불꽃놀이를 합니다!');
      break;
    }
  }
}

// --- TENT CUSTOMIZATION SHOP LOGIC ---
function openTentShopModal() {
  updateTentShopUI();
  document.getElementById('tentModal').classList.remove('hidden');
}

function updateTentShopUI() {
  document.getElementById('shopCoinDisplay').textContent = `${state.myCoins}`;

  const lv1Btn = document.getElementById('buyTentLv1Btn');
  if (state.tentLevel >= 1) {
    lv1Btn.textContent = '설치됨 ✓';
    lv1Btn.classList.add('owned');
  } else {
    lv1Btn.textContent = '🪙 30 구매';
    lv1Btn.classList.remove('owned');
  }

  const lv2Btn = document.getElementById('buyTentLv2Btn');
  if (state.tentLevel >= 2) {
    lv2Btn.textContent = '설치됨 ✓';
    lv2Btn.classList.add('owned');
  } else {
    lv2Btn.textContent = '🪙 60 구매';
    lv2Btn.classList.remove('owned');
  }

  const furnBtn = document.getElementById('buyFurnitureBtn');
  if (state.hasFurniture) {
    furnBtn.textContent = '설치됨 ✓';
    furnBtn.classList.add('owned');
  } else {
    furnBtn.textContent = '🪙 25 구매';
    furnBtn.classList.remove('owned');
  }

  const lightBtn = document.getElementById('buyLightsBtn');
  if (state.hasLights) {
    lightBtn.textContent = '설치됨 ✓';
    lightBtn.classList.add('owned');
  } else {
    lightBtn.textContent = '🪙 20 구매';
    lightBtn.classList.remove('owned');
  }

  document.querySelectorAll('#tentColorSwatches .color-swatch').forEach((sw) => {
    sw.classList.toggle('active', sw.dataset.color === state.tentColor);
  });
}

function broadcastTentUpdate() {
  saveProgress();
  updateHUDCounters();
  updateTentShopUI();
  syncTentsForUsers();
  sendServerAction({
    type: 'updateTent',
    tentLevel: state.tentLevel,
    tentColor: state.tentColor,
    hasFurniture: state.hasFurniture,
    hasLights: state.hasLights
  });
}

document.getElementById('openTentShopChip').addEventListener('click', openTentShopModal);

document.getElementById('buyTentLv1Btn').addEventListener('click', () => {
  if (state.tentLevel >= 1) return;
  if (state.myCoins < 30) {
    showCenterNotice('🪙 코인이 부족해요! [🏹 동물 사냥]으로 코인을 모아보세요!');
    return;
  }
  state.myCoins -= 30;
  state.tentLevel = 1;
  soundEngine.playHappyChime();
  broadcastTentUpdate();
  showCenterNotice('🎪 원본 텐트 옆에 멋진 대형 벨 글램핑 텐트가 설치되었습니다!');
});

document.getElementById('buyTentLv2Btn').addEventListener('click', () => {
  if (state.tentLevel >= 2) return;
  if (state.myCoins < 60) {
    showCenterNotice('🪙 코인이 부족해요! [🏹 동물 사냥]으로 코인을 모아보세요!');
    return;
  }
  state.myCoins -= 60;
  state.tentLevel = 2;
  soundEngine.playHappyChime();
  broadcastTentUpdate();
  showCenterNotice('🏕️ 우드 타프와 화목난로 연통이 있는 최고급 오두막 텐트가 완성되었습니다!');
});

document.getElementById('buyFurnitureBtn').addEventListener('click', () => {
  if (state.hasFurniture) return;
  if (state.myCoins < 25) {
    showCenterNotice('🪙 코인이 부족해요! [🏹 동물 사냥]으로 코인을 모아보세요!');
    return;
  }
  state.myCoins -= 25;
  state.hasFurniture = true;
  if (state.tentLevel === 0) state.tentLevel = 1;
  soundEngine.playHappyChime();
  broadcastTentUpdate();
  showCenterNotice('🪑 내 텐트 앞에 통나무 테이블과 황금 랜턴이 배치되었습니다!');
});

document.getElementById('buyLightsBtn').addEventListener('click', () => {
  if (state.hasLights) return;
  if (state.myCoins < 20) {
    showCenterNotice('🪙 코인이 부족해요! [🏹 동물 사냥]으로 코인을 모아보세요!');
    return;
  }
  state.myCoins -= 20;
  state.hasLights = true;
  if (state.tentLevel === 0) state.tentLevel = 1;
  soundEngine.playHappyChime();
  broadcastTentUpdate();
  showCenterNotice('✨ 내 텐트에 반짝이는 별빛 알전구 줄조명이 켜졌습니다!');
});

document.querySelectorAll('#tentColorSwatches .color-swatch').forEach((sw) => {
  sw.addEventListener('click', () => {
    state.tentColor = sw.dataset.color;
    if (state.tentLevel === 0) state.tentLevel = 1;
    broadcastTentUpdate();
    showCenterNotice('🎨 내 텐트 색상을 변경했습니다!');
  });
});

// ====================================================
// 10. MAIN ANIMATION LOOP (CLEAR ACTION CAMERA VIEWS!)
// ====================================================
const clock = new THREE.Clock();

function lerp(a, b, t) {
  return a + (b - a) * t;
}

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
  const dt = Math.min(0.05, clock.getDelta());
  const elapsed = clock.getElapsedTime();
  const now = Date.now();

  const mySeat = seats[state.mySeatIndex] || seats[0];
  const myCamperObj = camperMeshes.get(state.clientId);
  const baseAngle = mySeat.angle + camControl.orbitOffset;

  // --- 4 DISTINCT CAMERA POV MODES + TENT INTERIOR + FOREST EXPLORATION FOLLOW CAM ---
  const targetCamPos = new THREE.Vector3();
  const targetLookAt = new THREE.Vector3();

  // Check if player character is currently out exploring/walking in the outer forest (> 4.2m from center)
  const charDistFromFire = myCamperObj
    ? Math.hypot(myCamperObj.group.position.x, myCamperObj.group.position.z)
    : SEAT_RADIUS;
  const isOutInForest = myCamperObj && !state.inTent && (Boolean(state.freeRoamPos) || charDistFromFire > 4.25);

  if (state.inTent && (state.povMode === 'side' || state.povMode === 'front')) {
    // TENT INTERIOR CLOSE-UP: Looks right inside your cozy see-through tent at your sleeping bag & bento!
    const useCustom = state.tentLevel >= 1 || state.hasFurniture || state.hasLights;
    const tentWorld = getSeatTentWorldPos(state.mySeatIndex, useCustom);
    const camDistFromTent = Math.max(1.8, Math.min(5.5, 2.75 + camControl.zoomOffset * 0.5));
    // Position camera slightly toward the campfire side + angled so we clearly see inside the tent
    const viewAngle = mySeat.angle + Math.PI + 0.35 + camControl.orbitOffset;
    targetCamPos.set(
      tentWorld.x + Math.cos(viewAngle) * camDistFromTent,
      1.55 + camControl.pitchOffset * 0.9,
      tentWorld.z + Math.sin(viewAngle) * camDistFromTent
    );
    targetLookAt.set(tentWorld.x, 0.65, tentWorld.z);
  } else if (isOutInForest && state.povMode !== 'fire') {
    // FOREST EXPLORATION FOLLOW CAMERA: Smoothly follows your character as you walk far out into the woods!
    const cx = myCamperObj.group.position.x;
    const cz = myCamperObj.group.position.z;
    const charAngle = Math.atan2(cz, cx) + 0.55 + camControl.orbitOffset;
    const followDist = Math.max(2.6, Math.min(12.0, 4.2 + camControl.zoomOffset * 0.7));
    targetCamPos.set(
      cx + Math.cos(charAngle) * followDist,
      2.1 + camControl.pitchOffset * 1.4,
      cz + Math.sin(charAngle) * followDist
    );
    targetLookAt.set(cx, 1.0, cz);
  } else if (state.povMode === 'side') {
    // 1. SIDE ACTION CLOSE-UP (내 동작 클로즈업 - 기본):
    // Angled 52 degrees to the side so the character's face, hands, meat skewer, cocoa mug, AND the campfire are all in plain sight!
    const dist = Math.max(3.2, Math.min(10.5, 4.85 + camControl.zoomOffset));
    const sideAngle = baseAngle + 0.62;
    targetCamPos.set(
      Math.cos(sideAngle) * dist,
      1.85 + camControl.pitchOffset * 1.3,
      Math.sin(sideAngle) * dist
    );
    // Look midway between my character's hands and the campfire center
    targetLookAt.set(mySeat.x * 0.45, 0.95, mySeat.z * 0.45);
  } else if (state.povMode === 'front') {
    // 2. FRONT CHARACTER & TENT VIEW (내 정면+텐트 보기):
    // Looks from the fire side toward my character's face and my tents behind me!
    const dist = Math.max(1.2, Math.min(6.0, 1.8 + camControl.zoomOffset * 0.5));
    const frontAngle = baseAngle + 0.22;
    targetCamPos.set(
      Math.cos(frontAngle) * dist,
      1.55 + camControl.pitchOffset * 0.9,
      Math.sin(frontAngle) * dist
    );
    targetLookAt.set(mySeat.x * 1.15, 1.05, mySeat.z * 1.15);
  } else if (state.povMode === 'fire') {
    // 3. FIRE CLOSE-UP (불꽃 직관)
    const r = Math.max(2.0, 2.8 + camControl.zoomOffset * 0.4);
    targetCamPos.set(
      Math.cos(baseAngle) * r,
      1.35 + camControl.pitchOffset * 0.8,
      Math.sin(baseAngle) * r
    );
    targetLookAt.set(0, 0.85, 0);
  } else {
    // 4. WIDE CAMP & HUNTING VIEW (캠핑장 전체/사냥터 보기)
    const distWide = Math.max(6.5, Math.min(16.0, 10.8 + camControl.zoomOffset));
    targetCamPos.set(
      Math.cos(baseAngle) * distWide,
      4.8 + camControl.pitchOffset * 2.0,
      Math.sin(baseAngle) * distWide
    );
    targetLookAt.set(0, 0.8, 0);
  }

  camControl.currentPos.lerp(targetCamPos, 0.09);
  camControl.currentLookAt.lerp(targetLookAt, 0.09);
  camera.position.copy(camControl.currentPos);
  camera.lookAt(camControl.currentLookAt);

  // --- ANIMATE SEASONAL PARTICLES ---
  const seasonCfg = SEASONS[state.season] || SEASONS.autumn;
  seasonParticles.forEach((p) => {
    const u = p.userData;
    if (seasonCfg.particleType === 'fireflies') {
      p.position.y += Math.sin(elapsed * 2.0 + u.phase) * 0.008;
      p.position.x += Math.cos(elapsed * 1.3 + u.phase) * 0.01;
      p.position.z += Math.sin(elapsed * 1.5 + u.phase) * 0.01;
      p.lookAt(camera.position);
      p.material.opacity = 0.25 + 0.7 * Math.pow(0.5 + 0.5 * Math.sin(elapsed * 3.5 + u.phase), 2);
    } else {
      p.position.y += u.vy * dt;
      p.position.x += (u.vx + Math.sin(elapsed * 1.8 + u.phase) * 0.35) * dt;
      p.position.z += (u.vz + Math.cos(elapsed * 1.6 + u.phase) * 0.35) * dt;
      p.rotation.x += u.rotSpeed * dt;
      p.rotation.y += u.rotSpeed * 0.8 * dt;
      if (p.position.y <= 0.05) resetSeasonParticle(p, false);
    }
  });

  // --- ANIMATE ADORABLE ROAMING FOREST ANIMALS ---
  forestAnimals.forEach((an, idx) => {
    if (!an.available) return;
    an.angle += an.dir * an.cfg.speed * 0.12 * dt;
    const hopAmp = an.cfg.type === 'rabbit' ? 0.22 : 0.08;
    const hop = Math.abs(Math.sin(elapsed * 6.5 + idx)) * hopAmp;
    an.x = Math.cos(an.angle) * an.dist;
    an.z = Math.sin(an.angle) * an.dist;
    an.group.position.set(an.x, hop, an.z);
    // Face tangent direction of movement
    an.group.rotation.y = Math.atan2(-Math.sin(an.angle) * an.dir, Math.cos(an.angle) * an.dir);

    // Cute head bob & bunny ear wiggle!
    if (an.headGroup) {
      an.headGroup.rotation.z = Math.sin(elapsed * 5 + idx) * 0.08;
      an.headGroup.rotation.x = Math.cos(elapsed * 6.5 + idx) * 0.06;
    }
    if (an.ears && an.ears.length === 2) {
      an.ears[0].rotation.x = Math.sin(elapsed * 7 + idx) * 0.18;
      an.ears[1].rotation.x = -Math.sin(elapsed * 7 + idx) * 0.18;
    }

    const legSwing = Math.sin(elapsed * 8.5 + idx) * 0.38;
    an.legs[0].rotation.x = legSwing;
    an.legs[1].rotation.x = -legSwing;
    an.legs[2].rotation.x = -legSwing;
    an.legs[3].rotation.x = legSwing;
  });

  // --- ANIMATE PHOTOREALISTIC FBM SHADER FLAMES (RESPONDS TO fireLit!) ---
  const isAurora = now < state.auroraUntil;
  const surgeBoost = now < fireRoarSurgeUntil ? 0.38 : 0.0;
  const targetLitAlpha = state.fireLit ? 1.0 : 0.0;
  const heatScale = state.fireLit ? (0.92 + (state.fireHeat - 680) / 700 + surgeBoost) : 0.15;

  fireShaderPlanes.forEach((mesh) => {
    const u = mesh.material.uniforms;
    u.uTime.value = elapsed;
    u.uHeatScale.value = lerp(u.uHeatScale.value, heatScale, 0.08);
    u.uLitAlpha.value = lerp(u.uLitAlpha.value, targetLitAlpha, 0.06);
    u.uAurora.value = isAurora ? 1.0 : 0.0;
  });

  coalBedMat.emissiveIntensity = lerp(coalBedMat.emissiveIntensity, state.fireLit ? 2.2 : 0.25, 0.06);
  coreGlowMat.opacity = lerp(coreGlowMat.opacity, state.fireLit ? 0.42 : 0.0, 0.06);
  coreGlowSphere.scale.setScalar((0.95 + Math.sin(elapsed * 9) * 0.08) * heatScale);

  const targetFireIntensity = state.fireLit
    ? (4.8 + Math.sin(elapsed * 8.5) * 0.4 + Math.cos(elapsed * 14.0) * 0.25) * heatScale
    : 0.3;
  fireLight.intensity = lerp(fireLight.intensity, targetFireIntensity, 0.08);
  bounceLight.intensity = lerp(bounceLight.intensity, state.fireLit ? 2.2 : 0.2, 0.08);

  // Rising Embers (Only visible when fire is lit!)
  emberMeshes.forEach((sp) => {
    const u = sp.userData;
    sp.position.y += u.vy * dt * (1 + surgeBoost);
    sp.position.x += Math.sin(elapsed * u.swaySpeed + u.phase) * u.swayAmp;
    sp.position.z += Math.cos(elapsed * u.swaySpeed + u.phase) * u.swayAmp;
    const lifeRatio = sp.position.y / u.maxY;
    sp.material.opacity = state.fireLit ? Math.max(0, (1 - lifeRatio) * 0.95) : 0;
    if (sp.position.y >= u.maxY) resetEmberParticle(sp, false);
  });

  // --- ANIMATE CAMPERS (CIRCULAR PATHFINDING + CLEAR SITTING & PROPS) ---
  for (const camper of camperMeshes.values()) {
    const isMe = camper.id === state.clientId;
    camper.group.visible = !(isMe && state.povMode === 'fire');

    const isArcWalking = Boolean(camper.arcWalkState);
    const isTentWalking = Boolean(camper.tentWalkState);
    const isPlacingLog = Boolean(camper.placingLogState);
    const isOffering = now < camper.offeringUntil;
    const isReceiving = now < camper.receivingUntil;
    const isNodding = now < camper.nodUntil;

    let targetTorsoLean = 0.08;
    let targetLeftArmX = 0.28;
    let targetLeftArmY = 0.0;
    let targetRightArmX = 0.28;
    let targetRightArmY = 0.0;
    let targetHeadX = Math.sin(elapsed * 1.2) * 0.04;

    camper.handWarmGlow.visible = false;
    camper.heldLogMesh.visible = false;
    camper.heldBranchMesh.visible = false;
    camper.skewerGroup.visible = false;
    camper.threadingMeatMesh.visible = false;
    camper.coffeeGroup.visible = false;
    camper.sparklerGroup.visible = false;
    camper.bentoGroup.visible = false;
    camper.chopstickGroup.visible = false;

    let bubbleHTML = '';

    // 1. Circular Perimeter Walk (Never crosses through the fire!)
    if (isArcWalking) {
      const aws = camper.arcWalkState;
      const t = Math.min(1, (now - aws.startTime) / aws.duration);
      const curAngle = aws.startAngle + aws.deltaAngle * t;
      const curRadius = lerp(aws.startRadius, aws.endRadius, t);

      const nextX = Math.cos(curAngle) * curRadius;
      const nextZ = Math.sin(curAngle) * curRadius;
      const moveDx = nextX - camper.group.position.x;
      const moveDz = nextZ - camper.group.position.z;
      if (Math.hypot(moveDx, moveDz) > 0.001) {
        camper.group.rotation.y = Math.atan2(moveDx, moveDz);
      }
      camper.group.position.set(nextX, 0, nextZ);

      camper.bodyRoot.position.set(0, lerp(camper.bodyRoot.position.y, 0.2, 0.2), 0);
      const swing = Math.sin(elapsed * 11) * 0.45;
      camper.leftLeg.hipPivot.rotation.set(swing, 0, 0);
      camper.leftLeg.kneePivot.rotation.set(Math.max(0, -swing * 0.6), 0, 0);
      camper.rightLeg.hipPivot.rotation.set(-swing, 0, 0);
      camper.rightLeg.kneePivot.rotation.set(Math.max(0, swing * 0.6), 0, 0);

      if (camper.gatheringState) {
        if (camper.gatheringState.phase === 'walkingBack') {
          camper.heldBranchMesh.visible = true;
          targetLeftArmX = -0.52;
          targetRightArmX = -0.52;
          bubbleHTML = `🌿 나무 들고 자리로 가는 중!`;
        } else {
          bubbleHTML = `🌿 나무 주우러 가는 중!`;
        }
      } else if (camper.huntingState) {
        bubbleHTML = camper.huntingState.phase === 'returning' ? `🍖 사냥 성공! 돌아가는 중!` : `🏹 동물 사냥하러 가는 중!`;
      } else {
        bubbleHTML = `👣 총총 이동 중...`;
      }

      if (t >= 1) {
        const cb = aws.onArrive;
        camper.arcWalkState = null;
        if (cb) cb();
      }
    } else if (isTentWalking) {
      // 1B. Walking Into or Out of the Tent!
      const tws = camper.tentWalkState;
      const t = Math.min(1, (now - tws.startTime) / tws.duration);
      const nextX = lerp(tws.startX, tws.targetX, t);
      const nextZ = lerp(tws.startZ, tws.targetZ, t);
      const moveDx = tws.targetX - tws.startX;
      const moveDz = tws.targetZ - tws.startZ;
      if (Math.hypot(moveDx, moveDz) > 0.001) {
        camper.group.rotation.y = Math.atan2(moveDx, moveDz);
      }
      camper.group.position.set(nextX, 0, nextZ);
      camper.bodyRoot.position.set(0, 0.18, 0);

      const swing = Math.sin(elapsed * 11) * 0.42;
      camper.leftLeg.hipPivot.rotation.set(swing, 0, 0);
      camper.leftLeg.kneePivot.rotation.set(Math.max(0, -swing * 0.5), 0, 0);
      camper.rightLeg.hipPivot.rotation.set(-swing, 0, 0);
      camper.rightLeg.kneePivot.rotation.set(Math.max(0, swing * 0.5), 0, 0);

      bubbleHTML = camper.inTent ? `🏕️ 텐트 안으로 들어가는 중...` : `🔥 모닥불 자리로 나오는 중...`;

      if (t >= 1) {
        camper.group.rotation.y = tws.lookAngle;
        const cb = tws.onComplete;
        camper.tentWalkState = null;
        if (cb) cb();
      }
    } else if (isPlacingLog) {
      // 2. Placing Wood into Fire
      const pls = camper.placingLogState;
      const stepElapsed = (now - pls.startTime) / 1000;
      bubbleHTML = `🔥 모닥불에 나무 넣는 중!`;

      if (pls.phase === 'walkToFire') {
        const t = Math.min(1, stepElapsed / 0.65);
        camper.group.position.x = lerp(pls.startX, pls.targetX, t);
        camper.group.position.z = lerp(pls.startZ, pls.targetZ, t);
        camper.group.rotation.y = pls.lookAngle;
        camper.bodyRoot.position.set(0, lerp(0, 0.2, t), 0);
        camper.heldBranchMesh.visible = true;
        targetLeftArmX = -0.55;
        targetRightArmX = -0.55;
        if (t >= 1) {
          pls.phase = 'kneelAndPlace';
          pls.startTime = now;
        }
      } else if (pls.phase === 'kneelAndPlace') {
        const t = Math.min(1, stepElapsed / 0.45);
        camper.heldBranchMesh.visible = t < 0.7;
        targetTorsoLean = 0.6 * Math.sin(t * Math.PI);
        targetLeftArmX = -0.85;
        targetRightArmX = -0.85;
        if (t >= 1) {
          addPhysicalLogToFire(pls.seatAngle);
          pls.phase = 'returnToSeat';
          pls.startTime = now;
        }
      } else if (pls.phase === 'returnToSeat') {
        const t = Math.min(1, stepElapsed / 0.65);
        camper.group.position.x = lerp(pls.targetX, pls.startX, t);
        camper.group.position.z = lerp(pls.targetZ, pls.startZ, t);
        camper.bodyRoot.position.set(0, lerp(0.2, 0, t), 0);
        if (t >= 1) {
          camper.group.position.set(pls.startX, 0, pls.startZ);
          camper.group.rotation.y = pls.lookAngle;
          camper.placingLogState = null;
        }
      }
    } else {
      // 3. Inside Tent, Out in the Deep Forest, OR Seated Naturally on the Log Facing Forward into the Fire!
      const homeSeat = seats[camper.seatIndex] || seats[0];
      const inTentNow = Boolean(camper.inTent || camper.action === 'sleep');
      const freeRoamNow = !inTentNow && Boolean(camper.freeRoamPos);

      if (inTentNow) {
        const useCustom = isMe
          ? (state.tentLevel >= 1 || state.hasFurniture || state.hasLights)
          : true;
        const tentWorld = getSeatTentWorldPos(camper.seatIndex, useCustom);
        camper.group.position.set(tentWorld.x, 0, tentWorld.z);
        camper.group.rotation.y = homeSeat.lookAngle;
      } else if (freeRoamNow) {
        camper.group.position.set(camper.freeRoamPos.x, 0, camper.freeRoamPos.z);
      } else if (!isOffering) {
        camper.group.position.set(homeSeat.x, 0, homeSeat.z);
        camper.group.rotation.y = homeSeat.lookAngle;
      }

      if (camper.action === 'sleep') {
        // Lying down comfortably on the sleeping bag/mat inside the tent with head on the pillow!
        camper.bodyRoot.position.x = 0;
        camper.bodyRoot.position.y = lerp(camper.bodyRoot.position.y, -0.26, 0.15);
        camper.bodyRoot.position.z = lerp(camper.bodyRoot.position.z || 0, 0.16, 0.15);

        const breath = Math.sin(elapsed * 2.0) * 0.04;
        targetTorsoLean = -Math.PI / 2 + 0.12 + breath;
        targetHeadX = 0.15;
        targetLeftArmX = 0.25;
        targetLeftArmY = 0.38;
        targetRightArmX = 0.25;
        targetRightArmY = -0.38;

        // Stretch legs out straight under the blanket!
        camper.leftLeg.hipPivot.rotation.set(-0.08, 0.05, 0);
        camper.leftLeg.kneePivot.rotation.set(0.08, 0, 0);
        camper.rightLeg.hipPivot.rotation.set(-0.08, -0.05, 0);
        camper.rightLeg.kneePivot.rotation.set(0.08, 0, 0);

        bubbleHTML = `🛌 텐트 안에서 코오~ 꿀잠 자는 중... 💤`;
      } else {
        // Sitting posture (on sleeping mat inside tent, on forest grass picnic, or on log bench)
        const targetBodyY = (inTentNow || freeRoamNow) ? -0.20 : 0.0;
        camper.bodyRoot.position.x = 0;
        camper.bodyRoot.position.y = lerp(camper.bodyRoot.position.y, targetBodyY, 0.15);
        camper.bodyRoot.position.z = lerp(camper.bodyRoot.position.z || 0, 0.0, 0.15);

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
          if (camper.offeringGiftType === 'coffee') {
            camper.coffeeGroup.visible = true;
            bubbleHTML = `☕ "따뜻한 코코아 드세요!"`;
          } else {
            camper.skewerGroup.visible = true;
            bubbleHTML = `🍖 "바비큐 꼬치 드세요!"`;
          }
        } else if (isReceiving) {
          targetTorsoLean = 0.2;
          targetLeftArmX = -0.42;
          targetRightArmX = -0.42;
          camper.coffeeGroup.visible = (camper.action === 'coffee');
          camper.skewerGroup.visible = (camper.action === 'skewer');
          bubbleHTML = `🙏 "고맙습니다! 맛있게 먹을게요!"`;
        } else if (camper.action === 'makeSkewer') {
          // 🍢 3D SKEWER THREADING ANIMATION: Threading 3 pieces of caught raw meat onto the bamboo skewer stick one by one!
          camper.skewerGroup.visible = true;
          camper.skewerGroup.position.set(0.10, 0.56, 0.28);
          targetTorsoLean = 0.18;

          const makeElapsed = (now - (camper.makingSkewerStartTime || now)) / 1000;
          const step = Math.min(3, Math.floor(makeElapsed / 0.85) + 1); // 1, 2, 3
          const stepProgress = (makeElapsed % 0.85) / 0.85;

          // Reset meatChunks to raw savory red while threading!
          camper.meatChunks.forEach((chunk, idx) => {
            chunk.material.color.setHex(0xd9483b);
            if (makeElapsed < 2.55) {
              chunk.visible = idx < step;
              if (idx === step - 1) {
                // Slide the new chunk down the stick from the tip!
                chunk.position.z = lerp(1.22, 0.86 + idx * 0.16, Math.min(1, stepProgress * 1.4));
              } else {
                chunk.position.z = 0.86 + idx * 0.16;
              }
            } else {
              chunk.visible = true;
              chunk.position.z = 0.86 + idx * 0.16;
            }
          });

          if (makeElapsed < 2.55) {
            camper.threadingMeatMesh.visible = stepProgress < 0.65;
            // Right hand holds the bamboo skewer stick steady
            targetRightArmX = -0.46;
            targetRightArmY = -0.14;
            // Left hand pushes each raw meat chunk onto the stick ("쏙! 쏙! 쏙!")
            const pushMotion = Math.sin(stepProgress * Math.PI);
            targetLeftArmX = -0.52 - pushMotion * 0.22;
            targetLeftArmY = 0.12 + pushMotion * 0.24;
            targetHeadX = 0.16;

            if (isMe && camper.lastSkewerPopStep !== step) {
              camper.lastSkewerPopStep = step;
              soundEngine.playPickupPop();
            }
            bubbleHTML = `🍢 생고기를 꼬치에 끼우는 중! (${step}/3 쏙!)`;
          } else {
            // Completed threading all 3 chunks!
            targetRightArmX = -0.58;
            targetRightArmY = -0.05;
            targetLeftArmX = -0.35;
            targetLeftArmY = 0.20;
            if (isMe && camper.lastSkewerPopStep < 4) {
              camper.lastSkewerPopStep = 4;
              const usedRaw = Math.min(state.myRawMeat, 3);
              if (usedRaw > 0) {
                state.myRawMeat = Math.max(0, state.myRawMeat - usedRaw);
                state.myMeat += 1;
                saveProgress();
                updateHUDCounters();
                soundEngine.playHappyChime();
                showCenterNotice(`🍢 고기꼬치 +1개 완성! (보유 꼬치: ${state.myMeat}개) 이제 [🍖 꼬치 굽기]로 구워보세요!`);
              }
            }
            bubbleHTML = `🍢 수제 고기꼬치 완성! [🍖 꼬치 굽기]를 눌러보세요!`;
          }
        } else if (camper.action === 'bento') {
          // Eating 3D Multi-Compartment Camping Bento Box with Chopsticks!
          camper.bentoGroup.visible = true;
          camper.chopstickGroup.visible = true;
          targetTorsoLean = 0.15;
          // Left hand holds the bento box steadily
          targetLeftArmX = -0.44;
          targetLeftArmY = 0.22;
          // Right hand moves chopsticks between the bento box and mouth!
          const eatPhase = Math.sin(elapsed * 3.8);
          const toMouth = Math.max(0, eatPhase);
          targetRightArmX = -0.42 - toMouth * 0.42;
          targetRightArmY = -0.15 - toMouth * 0.20;
          targetHeadX = toMouth * 0.14;
          bubbleHTML = inTentNow
            ? `🍱 텐트 안에서 맛있는 도시락 냠냠! 😋`
            : freeRoamNow
              ? `🍱 숲속 소풍 자리에서 도시락 냠냠! 😋`
              : `🍱 모닥불 보며 캠핑 도시락 냠냠! 😋`;
        } else if (camper.action === 'hands') {
          camper.handWarmGlow.visible = state.fireLit && !inTentNow && !freeRoamNow;
          camper.handWarmGlow.scale.setScalar(0.85 + Math.sin(elapsed * 5) * 0.18);
          targetTorsoLean = 0.24;
          const rub = Math.sin(elapsed * 5.0) * 0.09;
          targetLeftArmX = -0.48 + rub;
          targetLeftArmY = 0.15;
          targetRightArmX = -0.48 - rub;
          targetRightArmY = -0.15;
          if (isMe) {
            if (inTentNow) {
              bubbleHTML = `🏕️ 아늑한 내 텐트 안에서 쉬는 중!`;
            } else if (freeRoamNow) {
              bubbleHTML = `🌲 깊은 숲속 산책 중! (바닥을 클릭해 더 걸어가거나 [모닥불로 귀환]을 누르세요)`;
            } else {
              bubbleHTML = state.fireLit ? `🤲 불꽃에 손 녹이는 중 (따끈따끈!)` : `🌿 [불 피우기]로 모닥불을 켜보세요!`;
            }
          }
        } else if (camper.action === 'skewer') {
          camper.skewerGroup.visible = true;
          camper.meatChunks.forEach((c, idx) => {
            c.visible = true;
            c.position.z = 0.86 + idx * 0.16;
          });
          const roastElapsed = (now - camper.roastStartTime) / 1000;
          const roastPct = Math.min(100, Math.floor((roastElapsed / 8.0) * 100));
          const isEating = roastElapsed > 9.5 && roastElapsed < 11.5;

          if (roastElapsed >= 11.5) {
            camper.roastStartTime = now;
            if (isMe && state.myMeat > 0) {
              state.myMeat = Math.max(0, state.myMeat - 1);
              saveProgress();
              updateHUDCounters();
            }
          }

          if (isEating) {
            targetTorsoLean = 0.06;
            targetRightArmX = -0.78;
            targetRightArmY = 0.25;
            camper.skewerGroup.position.set(0.04, 0.76, 0.16);
            bubbleHTML = `😋 노릇한 바비큐 꼬치 냠냠! 최고예요!`;
          } else {
            targetTorsoLean = 0.24;
            targetRightArmX = -0.42 + Math.sin(elapsed * 3.5) * 0.05;
            targetRightArmY = -0.06;
            camper.skewerGroup.position.set(0.14, 0.56, 0.36);

            const ratio = roastPct / 100;
            camper.meatChunks.forEach((chunk) => {
              chunk.material.color.lerpColors(
                new THREE.Color(0xd9483b), // Raw red meat
                new THREE.Color(0x8c3b14), // Golden-brown roasted BBQ!
                ratio
              );
            });

            if (isMe) {
              bubbleHTML = roastPct < 100
                ? `🍖 꼬치 굽기 ${roastPct}% <span class="roast-bar"><span class="roast-fill" style="width:${roastPct}%"></span></span>`
                : `✨ 바비큐 꼬치 완성! 맛있는 냄새!`;
            }
          }
        } else if (camper.action === 'coffee') {
          camper.coffeeGroup.visible = true;
          camper.steamRings.forEach((st, idx) => {
            const cycle = (elapsed * 0.9 + idx * 0.33) % 1;
            st.position.y = 0.14 + cycle * 0.32;
            st.scale.setScalar(0.7 + cycle * 0.8);
            st.material.opacity = (1 - cycle) * 0.65;
          });
          const isSipping = Math.sin(elapsed * 1.4) > 0.65;
          const sipAngle = isSipping ? -0.32 : 0.0;
          targetLeftArmX = -0.36 + sipAngle;
          targetLeftArmY = 0.24;
          targetRightArmX = -0.36 + sipAngle;
          targetRightArmY = -0.24;
          if (isMe) bubbleHTML = isSipping ? `☕ 후루룩~ 달콤한 코코아!` : `☕ 따뜻한 보온병 코코아`;
        } else if (camper.action === 'sparkler') {
          camper.sparklerGroup.visible = true;
          const wave = Math.sin(elapsed * 4.5) * 0.28;
          targetLeftArmX = -0.45 + Math.cos(elapsed * 4.5) * 0.12;
          targetLeftArmY = wave;
          camper.spCore.scale.setScalar(0.85 + Math.random() * 0.75);
          if (isMe) bubbleHTML = `🎇 반짝반짝 불꽃놀이!`;
        }
      }
    }

    if (isNodding) {
      targetHeadX = Math.sin(elapsed * 8) * 0.22 + 0.2;
    }

    const b = camper.poseBlend;
    b.torsoLean = lerp(b.torsoLean, targetTorsoLean, 0.14);
    b.leftArmX = lerp(b.leftArmX, targetLeftArmX, 0.15);
    b.leftArmY = lerp(b.leftArmY, targetLeftArmY, 0.15);
    b.rightArmX = lerp(b.rightArmX, targetRightArmX, 0.15);
    b.rightArmY = lerp(b.rightArmY, targetRightArmY, 0.15);
    b.headX = lerp(b.headX, targetHeadX, 0.15);

    camper.torsoPivot.rotation.x = b.torsoLean;
    camper.leftArm.shoulder.rotation.set(b.leftArmX, b.leftArmY, 0);
    camper.rightArm.shoulder.rotation.set(b.rightArmX, b.rightArmY, 0);
    camper.headGroup.rotation.x = b.headX;

    if (camper.bubbleEl) {
      if (bubbleHTML && !state.zenMode && camper.group.visible) {
        camper.bubbleEl.innerHTML = bubbleHTML;
        const topPos = camper.group.position.clone();
        topPos.y += camper.action === 'sleep' ? 1.45 : (camper.inTent ? 1.85 : 2.32);
        projectToScreen(topPos, camper.bubbleEl);
        camper.bubbleEl.style.opacity = '1';
      } else {
        camper.bubbleEl.style.opacity = '0';
      }
    }
  }

  for (let i = activeEffects.length - 1; i >= 0; i--) {
    if (!activeEffects[i].update(dt)) {
      activeEffects.splice(i, 1);
    }
  }

  renderer.render(scene, camera);
}

// ====================================================
// 11. POINTER & MOBILE PINCH-TO-ZOOM CONTROLS
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
  if (Math.abs(dx) > 4 || Math.abs(dy) > 4) camControl.dragMoved = true;

  camControl.orbitOffset -= dx * 0.006;
  camControl.pitchOffset = Math.max(-0.4, Math.min(0.85, camControl.pitchOffset + dy * 0.004));
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

  // 1. Clicked a 3D Forest Animal? -> Hunt it!
  const animalHits = raycaster.intersectObjects(animalHitMeshes, false);
  if (animalHits.length > 0) {
    const aIdx = animalHits[0].object.userData.animalIndex;
    if (typeof aIdx === 'number' && forestAnimals[aIdx] && forestAnimals[aIdx].available) {
      soundEngine.init();
      triggerHuntAnimalAnimation(state.mySeatIndex, aIdx, true);
      return;
    }
  }

  // 2. Clicked a 3D Tree Branch on the ground? -> Pick it up!
  const branchHits = raycaster.intersectObjects(forageBranchHitMeshes, false);
  if (branchHits.length > 0) {
    const bIdx = branchHits[0].object.userData.branchIndex;
    if (typeof bIdx === 'number' && forageBranches[bIdx] && forageBranches[bIdx].available) {
      soundEngine.init();
      triggerGatherBranchAnimation(state.mySeatIndex, bIdx, true);
      return;
    }
  }

  // 3. Clicked another camper? -> Walk around perimeter and give gift!
  const camperHits = raycaster.intersectObjects(camperHitMeshes, false);
  if (camperHits.length > 0) {
    const hitData = camperHits[0].object.userData;
    if (hitData.seatIndex !== undefined && hitData.seatIndex !== state.mySeatIndex) {
      const giftType = state.myAction === 'coffee' ? 'coffee' : 'skewer';
      animateWalkAndOfferGift(state.mySeatIndex, hitData.seatIndex, giftType, state.myNickname);
      sendServerAction({ type: 'offerGift', targetSeat: hitData.seatIndex, giftType });
      showCenterNotice('🎁 친구에게 걸어가 선물을 건넵니다!');
      return;
    }
  }

  // 3B. Clicked my 3D Tent? -> Enter or exit the tent!
  const tentHits = raycaster.intersectObjects(tentClickMeshes, false);
  if (tentHits.length > 0) {
    const tData = tentHits[0].object.userData;
    if (tData.seatIndex === state.mySeatIndex) {
      triggerCampfireAction('enterTent');
      return;
    }
  }

  // 4. Clicked a Log Bench? -> Walk around perimeter (never through fire!) and sit facing forward!
  const seatHits = raycaster.intersectObjects(seatClickMeshes, false);
  if (seatHits.length > 0) {
    const newSeat = seatHits[0].object.userData.seatIndex;
    if (typeof newSeat === 'number') {
      if (newSeat === state.mySeatIndex && state.inTent) {
        triggerCampfireAction('enterTent');
        return;
      }
      if (newSeat === state.mySeatIndex && state.freeRoamPos) {
        triggerCampfireAction('explore');
        return;
      }
      if (newSeat !== state.mySeatIndex) {
        const myCamper = camperMeshes.get(state.clientId);
        exitTentIfNeeded(myCamper);
        state.mySeatIndex = newSeat;
        camControl.orbitOffset = 0; // Camera smoothly follows to your new seat!
        const targetS = seats[newSeat];
        if (myCamper && targetS) {
          startSafePerimeterWalk(myCamper, targetS.x, targetS.z, () => {
            myCamper.group.position.set(targetS.x, 0, targetS.z);
            myCamper.group.rotation.y = targetS.lookAngle;
            updateHUDCounters();
            syncTentsForUsers();
            sendServerAction({ type: 'moveSeat', seatIndex: newSeat });
          });
        } else {
          updateHUDCounters();
          syncTentsForUsers();
          sendServerAction({ type: 'moveSeat', seatIndex: newSeat });
        }
        showCenterNotice('👣 모닥불 둘레를 따라 선택한 통나무 자리로 이동합니다!');
      }
      return;
    }
  }

  // 5. Clicked anywhere on the Forest Ground outside the campfire? -> Walk freely out into the forest (up to 28m away)!
  const groundHits = raycaster.intersectObject(groundMesh, false);
  if (groundHits.length > 0) {
    const pt = groundHits[0].point;
    const clickRadius = Math.hypot(pt.x, pt.z);
    if (clickRadius >= 4.2 && clickRadius <= 28.5) {
      soundEngine.init();
      startFreeRoamWalkTo(pt.x, pt.z);
      showCenterNotice('🥾 선택한 숲속 위치로 걸어갑니다! (돌아오려면 [모닥불로 귀환] 또는 통나무 의자를 클릭하세요)');
    }
  }
});

// Mouse Wheel Zoom (Wider range so players can zoom out far into the forest!)
window.addEventListener('wheel', (e) => {
  camControl.zoomOffset = Math.max(-2.4, Math.min(9.5, camControl.zoomOffset + e.deltaY * 0.004));
}, { passive: true });

// Mobile 2-Finger Pinch-to-Zoom!
canvas.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2) {
    camControl.isDragging = false;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    camControl.pinchStartDist = Math.hypot(dx, dy);
    camControl.pinchStartZoom = camControl.zoomOffset;
  }
}, { passive: true });

canvas.addEventListener('touchmove', (e) => {
  if (e.touches.length === 2 && camControl.pinchStartDist > 0) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.hypot(dx, dy);
    const delta = (camControl.pinchStartDist - dist) * 0.018;
    camControl.zoomOffset = Math.max(-2.4, Math.min(9.5, camControl.pinchStartZoom + delta));
  }
}, { passive: true });

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ====================================================
// 12. REAL-TIME MULTIPLAYER & FRIENDLY COMPANION
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
        color: state.myColor,
        tentLevel: state.tentLevel,
        tentColor: state.tentColor,
        hasFurniture: state.hasFurniture,
        hasLights: state.hasLights
      }];

  document.getElementById('onlineCount').textContent = String(realList.length);

  if (state.enableSoloCompanion && realList.length === 1) {
    const companionSeat = (state.mySeatIndex + 2) % MAX_SEATS;
    state.users = [
      ...realList,
      {
        id: 'sim_forest_companion',
        name: '숲속 친구',
        seatIndex: companionSeat,
        action: 'skewer',
        color: '#4ecdc4',
        tentLevel: 1,
        tentColor: '#3b7a57',
        hasFurniture: true,
        hasLights: false
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
    broadcastTentUpdate();
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
      color: state.myColor,
      tentLevel: state.tentLevel,
      tentColor: state.tentColor,
      hasFurniture: state.hasFurniture,
      hasLights: state.hasLights
    }];
    rebuildActiveUsersList();
  };
}

function applyRoomSnapshot(snapshot) {
  if (!snapshot) return;
  if (snapshot.season && SEASONS[snapshot.season] && snapshot.season !== state.season) {
    applySeasonTheme(snapshot.season, false);
  }

  state.realUsers = snapshot.users || [];
  const me = state.realUsers.find((u) => u.id === state.clientId);
  if (me) state.mySeatIndex = me.seatIndex;

  rebuildActiveUsersList();
}

function handleIncomingRoomEffect(eff) {
  if (!eff) return;
  if (eff.effect === 'throwLog') {
    state.fireLit = true;
    state.fireHeat = eff.fireHeat || Math.max(750, state.fireHeat + 50);
    updateHUDCounters();
    if (eff.fromSeat !== state.mySeatIndex) {
      triggerNaturalLogPlacement(eff.fromSeat);
      showCenterNotice(`🔥 ${eff.actorName}님이 나무를 넣어 불을 키웠습니다!`);
    }
  } else if (eff.effect === 'gatherBranch') {
    if (eff.fromSeat !== state.mySeatIndex) {
      triggerGatherBranchAnimation(eff.fromSeat, eff.branchIndex, false);
    }
  } else if (eff.effect === 'huntAnimal') {
    if (eff.fromSeat !== state.mySeatIndex) {
      triggerHuntAnimalAnimation(eff.fromSeat, eff.animalIndex, false);
    }
  } else if (eff.effect === 'changeSeason' && eff.season) {
    applySeasonTheme(eff.season, true);
  } else if (eff.effect === 'offerGift') {
    if (eff.fromSeat !== state.mySeatIndex) {
      animateWalkAndOfferGift(eff.fromSeat, eff.targetSeat, eff.giftType, eff.actorName);
    }
  } else if (eff.effect === 'acceptGift') {
    if (eff.targetSeat !== state.mySeatIndex) {
      completeGiftAcceptance(eff.fromSeat, eff.targetSeat, eff.giftType);
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
// 13. UI CONTROLS & CAMERA VIEW SWITCHER
// ====================================================
function selectSeason(seasonKey) {
  soundEngine.init();
  soundEngine.playHappyChime();
  applySeasonTheme(seasonKey, true);
  sendServerAction({ type: 'changeSeason', season: seasonKey });
}

document.querySelectorAll('.season-tab').forEach((btn) => {
  btn.addEventListener('click', () => selectSeason(btn.dataset.season));
});

document.querySelectorAll('#modalSeasonGroup .mini-pill').forEach((btn) => {
  btn.addEventListener('click', () => selectSeason(btn.dataset.season));
});

const seasonOrder = ['spring', 'summer', 'autumn', 'winter'];
document.getElementById('seasonCycleMobileBtn').addEventListener('click', () => {
  const nextIdx = (seasonOrder.indexOf(state.season) + 1) % seasonOrder.length;
  selectSeason(seasonOrder[nextIdx]);
});

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
  connectMultiplayerRoom();
  showCenterNotice('🔥 [불 피우기]로 모닥불을 켜고, [동물 사냥]과 [텐트 꾸미기]를 즐겨보세요!');
});

// 4-Mode Camera POV Switcher (내 동작 클로즈업 ↔ 내 정면+텐트 ↔ 불꽃 가까이 ↔ 숲 전체)
const povLabel = document.getElementById('povLabel');
document.getElementById('cameraPovBtn').addEventListener('click', () => {
  camControl.orbitOffset = 0;
  camControl.pitchOffset = 0;
  camControl.zoomOffset = 0;

  if (state.povMode === 'side') {
    state.povMode = 'front';
    povLabel.textContent = '내 정면+텐트';
    showCenterNotice('📷 내 정면+텐트 보기: 내 캐릭터의 앞모습과 내 자리 뒤의 텐트들을 봅니다!');
  } else if (state.povMode === 'front') {
    state.povMode = 'fire';
    povLabel.textContent = '불꽃 클로즈업';
    showCenterNotice('📷 불꽃 클로즈업: 타오르는 모닥불 불꽃만 가까이서 봅니다!');
  } else if (state.povMode === 'fire') {
    state.povMode = 'wide';
    povLabel.textContent = '캠핑장 전체';
    showCenterNotice('📷 캠핑장 전체 보기: 숲속을 뛰어다니는 동물들과 나뭇가지를 한눈에 봅니다!');
  } else {
    state.povMode = 'side';
    povLabel.textContent = '내 동작 클로즈업';
    showCenterNotice('📷 내 동작 클로즈업: 꼬치 굽기·손 녹이기·코코아 마시기 동작이 가장 잘 보이는 시점입니다!');
  }
});

const soloCompanionToggle = document.getElementById('soloCompanionToggle');
if (soloCompanionToggle) {
  soloCompanionToggle.addEventListener('change', (e) => {
    state.enableSoloCompanion = e.target.checked;
    rebuildActiveUsersList();
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

document.querySelectorAll('#instanceGroup .mini-pill').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#instanceGroup .mini-pill').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.instance = Number(btn.dataset.instance);
    document.getElementById('currentRegionTag').textContent = `#${state.instance}`;
    connectMultiplayerRoom();
  });
});

document.getElementById('copyRoomLinkBtn').addEventListener('click', () => {
  navigator.clipboard.writeText(window.location.href).then(() => {
    showCenterNotice('🔗 방 주소가 복사되었어요!');
  });
});

['Fire', 'Wind', 'Night'].forEach((ch) => {
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

// Initialize
applySeasonTheme(state.season, false);
rebuildActiveUsersList();
animate();
