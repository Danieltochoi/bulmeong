/**
 * 🔥 불멍 (BULMEONG) — Photorealistic Procedural 3D Fire & Kid-Friendly Intuitive Actions
 *
 * 1. Photorealistic GLSL FBM Volumetric Fire Shader (3D simplex/value noise + blackbody radiation color gradient:
 *    white-hot 3200K core -> golden yellow 2200K -> blazing orange 1500K -> deep crimson wisps + rising smoke & 120 glowing embers)
 * 2. Bright, Warm Golden-Hour Forest Campsite (Festival string lights, glowing camp lanterns, warm twilight sky — never too dark!)
 * 3. Unmistakable, Kid-Friendly 3D Actions with Floating Status Bubbles right above the character:
 *    - 🪵 장작 넣기: Carries big log in both hands, walks to fire, tosses it in -> huge spark burst & flames roar higher!
 *    - 🤲 손 녹이기: Stretches big warm hands right near the fire with visible warm heat rings & "🤲 손이 따끈따끈해요!"
 *    - 🍡 마시멜로 굽기: Holds giant marshmallow right over the fire with live roasting gauge (0% -> 100% golden brown) + "냠냠!" eating animation!
 *    - ☕ 보온병 코코아: Pours steaming hot cocoa from green thermos into a big mug with rising 3D steam puffs & sipping animation!
 *    - 🎁 친구에게 주기: Walks over to neighbor and hands over cocoa/marshmallow with two hands & polite bow!
 *    - 🎇 불꽃놀이: Holds dazzling golden sparkler shooting 3D star sparks in all directions!
 *    - 🌈 무지개 마법불: Sprinkles magic powder that turns the realistic fire into emerald/violet aurora flames!
 */

// ====================================================
// 1. IDENTITY & STATE
// ====================================================
const ADJECTIVES = [
  '따스한', '포근한', '다정한', '반짝이는', '해맑은',
  '노릇노릇', '별빛 닮은', '솔향기 나는', '행복한', '든든한'
];

const NOUNS = [
  '모닥불', '마시멜로', '솔방울', '장작불', '코코아',
  '불꽃놀이', '다람쥐', '보온병', '산장지기', '탐험가'
];

const CAMPER_COLORS = [
  '#ff6b4a', '#4ecdc4', '#ffb703', '#5c9ead',
  '#f28482', '#fb8500', '#8ac926', '#9b5de5'
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
  myAction: 'hands', // 'hands' | 'mallow' | 'coffee' | 'sparkler'
  povMode: 'shoulder', // 'shoulder' (내 캐릭터+불꽃) | 'first' (진짜 불꽃 클로즈업) | 'wide' (캠핑장 전체)
  enableSoloCompanion: true, // Kid-friendly default: friendly forest companion sits nearby so sharing always works immediately!
  fireHeat: 750,
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
// 2. CENTER NOTIFICATION HELPER
// ====================================================
let noticeTimer = null;
function showCenterNotice(message, durationMs = 3200) {
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
// 3. REALISTIC WEB AUDIO ASMR ENGINE
// ====================================================
class CampfireAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.volumes = { fire: 0.9, wind: 0.35, rain: 0.0, night: 0.45 };
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

    // 1. Deep Warm Hearth Flame Roar
    const fireRumble = this.ctx.createBufferSource();
    fireRumble.buffer = noiseBuffer;
    fireRumble.loop = true;
    const fireFilter = this.ctx.createBiquadFilter();
    fireFilter.type = 'lowpass';
    fireFilter.frequency.value = 185;
    this.nodes.fireGain = this.ctx.createGain();
    this.nodes.fireGain.gain.value = this.volumes.fire * 0.45;
    fireRumble.connect(fireFilter);
    fireFilter.connect(this.nodes.fireGain);
    this.nodes.fireGain.connect(this.masterGain);
    fireRumble.start();

    // 2. Forest Breeze
    const windSource = this.ctx.createBufferSource();
    windSource.buffer = noiseBuffer;
    windSource.loop = true;
    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 320;
    windFilter.Q.value = 4.0;
    this.nodes.windFilter = windFilter;
    this.nodes.windGain = this.ctx.createGain();
    this.nodes.windGain.gain.value = this.volumes.wind * 0.22;
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

    setInterval(() => this.triggerCrackleAndNight(), 95);
  }

  triggerCrackleAndNight() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Crisp Oak Firewood Pop & Snap
    if (this.volumes.fire > 0.02 && Math.random() < 0.42) {
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

  playWoodRoar() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.22);
    gain.gain.setValueAtTime(0.25 * this.volumes.fire, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  playHappyChime() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);
      gain.gain.setValueAtTime(0.0001, now + idx * 0.09);
      gain.gain.linearRampToValueAtTime(0.05, now + idx * 0.09 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 1.2);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 1.25);
    });
  }

  setVolume(channel, val0to100) {
    const v = Math.max(0, Math.min(100, val0to100)) / 100;
    this.volumes[channel] = v;
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (channel === 'fire' && this.nodes.fireGain) this.nodes.fireGain.gain.setTargetAtTime(v * 0.45, now, 0.1);
    if (channel === 'wind' && this.nodes.windGain) this.nodes.windGain.gain.setTargetAtTime(v * 0.22, now, 0.1);
    if (channel === 'rain' && this.nodes.rainGain) this.nodes.rainGain.gain.setTargetAtTime(v * 0.35, now, 0.1);
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
// 4. THREE.JS BRIGHT & COZY CAMPSITE + PHOTOREALISTIC FIRE
// ====================================================
const canvas = document.getElementById('campfireCanvas');
const bubbleContainer = document.getElementById('actionBubbleContainer');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.38; // Bright, vibrant, warm exposure!

const scene = new THREE.Scene();
// Warm Twilight Indigo-Amber Sky (Never pitch-black!)
scene.background = new THREE.Color(0x1b192e);
scene.fog = new THREE.FogExp2(0x1b192e, 0.014);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 160);

const camControl = {
  orbitOffset: 0.0,
  pitchOffset: 0.0,
  zoomOffset: 0.0,
  currentPos: new THREE.Vector3(0, 2.2, 5.8),
  currentLookAt: new THREE.Vector3(0, 1.05, 0),
  isDragging: false,
  dragMoved: false,
  lastX: 0,
  lastY: 0
};

// --- BRIGHT, COZY CAMPSITE LIGHTING ---
// 1. Warm Sky + Earth Hemisphere Light
const hemiLight = new THREE.HemisphereLight(0x6b78b4, 0x4d3522, 1.15);
scene.add(hemiLight);

// 2. Warm Sunset/Moon Rim Light so characters & trees are always clearly visible
const rimLight = new THREE.DirectionalLight(0xffdcb8, 0.75);
rimLight.position.set(12, 22, 14);
scene.add(rimLight);

// 3. Intense Real-Time Fire Point Light
const fireLight = new THREE.PointLight(0xff8024, 5.2, 34, 1.25);
fireLight.position.set(0, 1.65, 0);
fireLight.castShadow = true;
fireLight.shadow.mapSize.width = 1024;
fireLight.shadow.mapSize.height = 1024;
fireLight.shadow.bias = -0.001;
scene.add(fireLight);

// 4. Secondary Low Ember Bounce Light (illuminates faces, hands, and boots warmly)
const bounceLight = new THREE.PointLight(0xffaa44, 2.6, 16, 1.4);
bounceLight.position.set(0, 0.55, 0);
scene.add(bounceLight);

// Warm Forest Ground with Golden Firelight Reflection Ring
const groundMat = new THREE.MeshStandardMaterial({ color: 0x33271e, roughness: 0.88, metalness: 0.04 });
const groundMesh = new THREE.Mesh(new THREE.CircleGeometry(65, 64), groundMat);
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

// Warm Sandy Hearth Circle around the fire
const hearthSandMesh = new THREE.Mesh(
  new THREE.CircleGeometry(5.5, 48),
  new THREE.MeshStandardMaterial({ color: 0x4a3626, roughness: 0.9 })
);
hearthSandMesh.rotation.x = -Math.PI / 2;
hearthSandMesh.position.y = 0.01;
hearthSandMesh.receiveShadow = true;
scene.add(hearthSandMesh);

// Cozy Camping String Lights / Warm Lantern Poles around the clearing
const lanternGroup = new THREE.Group();
scene.add(lanternGroup);
const poleMat = new THREE.MeshStandardMaterial({ color: 0x4a3220, roughness: 0.85 });
const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe299 });

for (let i = 0; i < 6; i++) {
  const a = (i / 6) * Math.PI * 2 + 0.25;
  const r = 6.4;
  const px = Math.cos(a) * r;
  const pz = Math.sin(a) * r;

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 2.8, 8), poleMat);
  pole.position.set(px, 1.4, pz);
  lanternGroup.add(pole);

  const lanternBulb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), bulbMat);
  lanternBulb.position.set(px, 2.75, pz);
  lanternGroup.add(lanternBulb);
}

// Starry Sky
const starsGeo = new THREE.BufferGeometry();
const starCount = 800;
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
const starsMat = new THREE.PointsMaterial({ color: 0xfff0d8, size: 0.42, transparent: true, opacity: 0.8 });
scene.add(new THREE.Points(starsGeo, starsMat));

// ====================================================
// 4A. PHOTOREALISTIC PROCEDURAL FBM SHADER FIRE ENGINE
// ====================================================
const hearthGroup = new THREE.Group();
scene.add(hearthGroup);

// Stone Ring
const stoneMat = new THREE.MeshStandardMaterial({ color: 0x5c524b, roughness: 0.85 });
for (let i = 0; i < 18; i++) {
  const a = (i / 18) * Math.PI * 2;
  const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3 + (i % 3) * 0.05, 1), stoneMat);
  stone.position.set(Math.cos(a) * 1.62, 0.16, Math.sin(a) * 1.62);
  stone.scale.set(1.15, 0.72, 1.05);
  stone.rotation.y = a;
  stone.castShadow = true;
  stone.receiveShadow = true;
  hearthGroup.add(stone);
}

// Incandescent White-Orange Glowing Coal Bed
const coalBedMat = new THREE.MeshStandardMaterial({
  color: 0xff4500,
  emissive: 0xff5500,
  emissiveIntensity: 2.2,
  roughness: 0.7
});
const coalBed = new THREE.Mesh(new THREE.CylinderGeometry(1.42, 1.55, 0.22, 32), coalBedMat);
coalBed.position.y = 0.1;
hearthGroup.add(coalBed);

//Glowing Chunks of Burning Charcoal
const coalChunkMat = new THREE.MeshBasicMaterial({ color: 0xffaa33 });
for (let i = 0; i < 24; i++) {
  const chunk = new THREE.Mesh(new THREE.DodecahedronGeometry(0.11 + Math.random() * 0.08, 0), coalChunkMat);
  const a = Math.random() * Math.PI * 2;
  const r = Math.random() * 1.1;
  chunk.position.set(Math.cos(a) * r, 0.2, Math.sin(a) * r);
  hearthGroup.add(chunk);
}

// Base Oak Firewood Logs with Incandescent Burning Undersides
const barkMat = new THREE.MeshStandardMaterial({
  color: 0x4f2f1a,
  roughness: 0.88,
  emissive: 0x802200,
  emissiveIntensity: 0.65
});
const dynamicLogsGroup = new THREE.Group();
hearthGroup.add(dynamicLogsGroup);

function createFirewoodLogMesh(length = 2.2, radius = 0.15) {
  const logGroup = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.92, radius, length, 12), barkMat);
  body.castShadow = true;
  body.receiveShadow = true;
  logGroup.add(body);
  return logGroup;
}

for (let i = 0; i < 8; i++) {
  const a = (i / 8) * Math.PI * 2;
  const log = createFirewoodLogMesh(2.25, 0.15);
  log.position.set(Math.cos(a) * 0.36, 0.36, Math.sin(a) * 0.36);
  log.rotation.z = Math.cos(a) * 0.54;
  log.rotation.x = Math.sin(a) * 0.54;
  hearthGroup.add(log);
}

// --- HIGH-TECH GLSL PROCEDURAL FBM VOLUMETRIC FIRE SHADER ---
// Uses multi-octave procedural noise + cellular flame tongues + Kelvin blackbody radiation curve
const realisticFireVertexShader = `
  uniform float uTime;
  uniform float uSeed;
  uniform float uHeatScale;
  varying vec2 vUv;
  varying vec3 vLocalPos;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float h = clamp(uv.y, 0.0, 1.0);

    // Organic rising convection wave
    float waveX = sin(uTime * 4.5 + h * 5.2 + uSeed) * 0.22 * pow(h, 1.4);
    float waveZ = cos(uTime * 3.9 + h * 4.8 + uSeed * 1.9) * 0.22 * pow(h, 1.4);
    pos.x += waveX;
    pos.z += waveZ;
    pos.y *= uHeatScale;

    vLocalPos = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const realisticFireFragmentShader = `
  uniform float uTime;
  uniform float uSeed;
  uniform float uAurora;
  varying vec2 vUv;
  varying vec3 vLocalPos;

  // High-speed 2D Procedural Hash & Value Noise for Real Flame Turbulence
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

  // 4-Octave Fractal Brownian Motion (FBM) for Realistic Licking Flame Tongues
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
    float h = clamp(vUv.y, 0.0, 1.0);
    float radialDist = abs(vUv.x - 0.5) * 2.0;

    // Advect UV upward rapidly to simulate rising hot gas
    vec2 flowUv = vec2(vUv.x * 3.8 + uSeed, vUv.y * 3.2 - uTime * 3.1);
    float n1 = fbm(flowUv);
    float n2 = fbm(flowUv * 1.9 - vec2(0.0, uTime * 2.2));
    float flameNoise = mix(n1, n2, 0.5);

    // Shape mask: wide at base, tapering & breaking into individual flame tongues at top
    float taper = mix(0.95, 0.05, pow(h, 0.85));
    float intensity = (1.0 - smoothstep(taper * 0.3, taper, radialDist * 0.65)) * (1.15 - h * 0.92);
    intensity += (flameNoise - 0.45) * 0.85 * (1.0 - h * 0.3);
    intensity = clamp(intensity, 0.0, 1.0);

    // Discard cold outer pixels so flame edges look crisp & organic
    if (intensity < 0.08) discard;

    // Blackbody Radiation Color Curve (Real Fire Physics)
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

    float alpha = smoothstep(0.08, 0.35, intensity) * (1.0 - pow(h, 2.2)) * 0.88;
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
    uHeatScale: { value: 1.0 },
    uAurora: { value: 0.0 }
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

// Bright Inner Core Glow Sphere (Gives intense incandescent heart to the fire)
const coreGlowMat = new THREE.MeshBasicMaterial({
  color: 0xffaa33,
  transparent: true,
  opacity: 0.42,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});
const coreGlowSphere = new THREE.Mesh(new THREE.SphereGeometry(0.95, 16, 16), coreGlowMat);
coreGlowSphere.position.set(0, 0.65, 0);
hearthGroup.add(coreGlowSphere);

// 120 Rising Glowing Embers / Sparks
const EMBER_COUNT = 120;
const emberMeshes = [];
const emberMatBase = new THREE.MeshBasicMaterial({
  color: 0xffc44d,
  transparent: true,
  opacity: 0.95,
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

// Pine Trees surrounding the campsite (Warmly lit, outside radius 15)
const trunkMat = new THREE.MeshStandardMaterial({ color: 0x422a1b, roughness: 0.9 });
const pineLeafMat = new THREE.MeshStandardMaterial({ color: 0x213d2e, roughness: 0.82 });
for (let i = 0; i < 38; i++) {
  const tree = new THREE.Group();
  const a = (i / 38) * Math.PI * 2 + (Math.random() - 0.5) * 0.06;
  const dist = 15.2 + Math.random() * 14;
  const s = 0.95 + Math.random() * 0.7;
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
// 5. LOG SEATS AROUND THE CAMPFIRE
// ====================================================
const MAX_SEATS = 12;
const SEAT_RADIUS = 3.5;
const seats = [];
const seatClickMeshes = [];

const logSeatMat = new THREE.MeshStandardMaterial({ color: 0x593a24, roughness: 0.85 });
const logEndMat = new THREE.MeshStandardMaterial({ color: 0x996b45, roughness: 0.8 });

for (let i = 0; i < MAX_SEATS; i++) {
  const angle = (i / MAX_SEATS) * Math.PI * 2;
  const x = Math.cos(angle) * SEAT_RADIUS;
  const z = Math.sin(angle) * SEAT_RADIUS;
  const lookAngle = angle + Math.PI;

  const seatGroup = new THREE.Group();
  seatGroup.position.set(x, 0, z);
  seatGroup.rotation.y = -angle + Math.PI / 2;
  scene.add(seatGroup);

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
// 6. CUTE, LARGE, KID-FRIENDLY 3D CHARACTER + CLEAR PROPS
// ====================================================
const camperMeshes = new Map();
const camperHitMeshes = [];

function createCamper3D(user) {
  const group = new THREE.Group();
  group.scale.setScalar(1.32); // Large, friendly character!

  const bodyRoot = new THREE.Group();
  group.add(bodyRoot);

  const coatColor = new THREE.Color(user.color || '#ff6b4a');
  const coatMat = new THREE.MeshStandardMaterial({ color: coatColor, roughness: 0.65 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x323c4d, roughness: 0.8 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x4f311c, roughness: 0.85 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffe3c8, roughness: 0.55 });

  // Articulated Legs
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

  // Torso
  const torsoPivot = new THREE.Group();
  torsoPivot.position.set(0, 0.48, 0);
  bodyRoot.add(torsoPivot);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.36, 0.76, 16), coatMat);
  torso.position.y = 0.38;
  torso.castShadow = true;
  torsoPivot.add(torso);

  // Scarf
  const scarf = new THREE.Mesh(
    new THREE.TorusGeometry(0.22, 0.07, 10, 18),
    new THREE.MeshStandardMaterial({ color: 0xfff0d4, roughness: 0.8 })
  );
  scarf.rotation.x = Math.PI / 2;
  scarf.position.y = 0.76;
  torsoPivot.add(scarf);

  // Head + Rosy Cheeks + Beanie
  const headGroup = new THREE.Group();
  headGroup.position.y = 0.98;
  torsoPivot.add(headGroup);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 18), skinMat);
  head.castShadow = true;
  headGroup.add(head);

  // Cute Eyes & Rosy Cheeks (Visible when turning or in 3/4 view)
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

  // Arms & Big Expressive Hands
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

  // --- CRYSTAL-CLEAR, OVERSIZED 3D PROPS SO KIDS & ADULTS INSTANTLY SEE WHAT IS HAPPENING! ---
  // 1. Warm Heat Glow Rings around hands when warming hands (손 녹이기 온기 이펙트)
  const handWarmGlow = new THREE.Mesh(
    new THREE.RingGeometry(0.12, 0.28, 24),
    new THREE.MeshBasicMaterial({ color: 0xffaa33, side: THREE.DoubleSide, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending })
  );
  handWarmGlow.position.set(0, 0.56, 0.65);
  torsoPivot.add(handWarmGlow);

  // 2. Big Firewood Log held in both hands
  const heldLogMesh = createFirewoodLogMesh(0.95, 0.13);
  heldLogMesh.rotation.z = Math.PI / 2;
  heldLogMesh.position.set(0, 0.54, 0.52);
  heldLogMesh.visible = false;
  torsoPivot.add(heldLogMesh);

  // 3. Giant Marshmallow on Skewer (stretches right into the firelight!)
  const mallowGroup = new THREE.Group();
  const skewer = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.016, 1.15, 8),
    new THREE.MeshStandardMaterial({ color: 0xe0a96d })
  );
  skewer.rotation.x = Math.PI / 2;
  skewer.position.z = 0.55;
  mallowGroup.add(skewer);

  const mallowMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.125, 0.125, 0.22, 16), // Big, unmistakable marshmallow!
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, emissive: 0x331a00, emissiveIntensity: 0.2 })
  );
  mallowMesh.rotation.x = Math.PI / 2;
  mallowMesh.position.z = 1.12;
  mallowGroup.add(mallowMesh);
  mallowGroup.position.set(0.16, 0.56, 0.36);
  mallowGroup.visible = false;
  torsoPivot.add(mallowGroup);

  // 4. Big Bright Cocoa/Coffee Mug + Rising 3D Steam Puffs
  const coffeeGroup = new THREE.Group();
  const mug = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.095, 0.22, 16),
    new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.25 }) // Cheerful warm yellow camp mug!
  );
  coffeeGroup.add(mug);
  const cocoaTop = new THREE.Mesh(
    new THREE.CircleGeometry(0.098, 14),
    new THREE.MeshBasicMaterial({ color: 0x4a2511 })
  );
  cocoaTop.rotation.x = -Math.PI / 2;
  cocoaTop.position.y = 0.105;
  coffeeGroup.add(cocoaTop);

  // 3D Rising Steam Rings above the mug
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

  // Green Classic Thermos standing beside the camper
  const thermosMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.095, 0.095, 0.38, 12),
    new THREE.MeshStandardMaterial({ color: 0x2d6a4f, metalness: 0.4, roughness: 0.35 })
  );
  thermosMesh.position.set(-0.58, 0.19, 0.14);
  thermosMesh.castShadow = true;
  group.add(thermosMesh);

  // 5. Dazzling Sparkler Wand (불꽃놀이 스파클러)
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
  sparklerGroup.position.set(-0.18, 0.58, 0.36);
  sparklerGroup.visible = false;
  torsoPivot.add(sparklerGroup);

  // Hitbox for clicking camper
  const hitBox = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.55, 1.9, 8),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitBox.position.y = 0.95;
  hitBox.userData = { camperId: user.id, seatIndex: user.seatIndex };
  group.add(hitBox);
  camperHitMeshes.push(hitBox);

  // Floating Action Status Bubble (Clear, kid-friendly badge right above the character!)
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
    mallowGroup,
    mallowMesh,
    coffeeGroup,
    steamRings,
    sparklerGroup,
    spCore,
    hitBox,
    bubbleEl,
    seatIndex: user.seatIndex,
    action: user.action || 'hands',
    name: user.name,
    color: user.color,
    roastStartTime: Date.now(),
    nodUntil: 0,
    offeringUntil: 0,
    offeringGiftType: 'coffee',
    receivingUntil: 0,
    placingLogState: null,
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
      if (camper.bubbleEl) camper.bubbleEl.remove();
      const idx = camperHitMeshes.indexOf(camper.hitBox);
      if (idx !== -1) camperHitMeshes.splice(idx, 1);
      camperMeshes.delete(id);
    }
  }
}

// ====================================================
// 7. NATURAL 3D FIREWOOD PLACEMENT & ROARING FLAME SURGE
// ====================================================
const activeEffects = [];
let fireRoarSurgeUntil = 0;

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
  if (dynamicLogsGroup.children.length >= 10) {
    dynamicLogsGroup.remove(dynamicLogsGroup.children[0]);
  }

  const newLog = createFirewoodLogMesh(1.95, 0.14);
  const r = 0.22 + Math.random() * 0.26;
  newLog.position.set(Math.cos(angle) * r, 0.44 + dynamicLogsGroup.children.length * 0.04, Math.sin(angle) * r);
  newLog.rotation.z = Math.cos(angle) * 0.48 + (Math.random() - 0.5) * 0.2;
  newLog.rotation.x = Math.sin(angle) * 0.48 + (Math.random() - 0.5) * 0.2;
  newLog.rotation.y = Math.random() * Math.PI;
  dynamicLogsGroup.add(newLog);

  soundEngine.playWoodRoar();
  fireRoarSurgeUntil = Date.now() + 3500;

  // Spectacular 35-Spark Fountain Burst!
  for (let i = 0; i < 35; i++) {
    const sp = new THREE.Mesh(
      new THREE.SphereGeometry(0.042, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 1, blending: THREE.AdditiveBlending })
    );
    sp.position.set((Math.random() - 0.5) * 0.8, 0.5, (Math.random() - 0.5) * 0.8);
    scene.add(sp);
    const vx = (Math.random() - 0.5) * 2.4;
    const vy = 2.2 + Math.random() * 2.8;
    const vz = (Math.random() - 0.5) * 2.4;
    const born = Date.now();
    activeEffects.push({
      update: (dt) => {
        const age = (Date.now() - born) / 1200;
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
// 8. GENTLE TWO-HANDED SHARING (COFFEE & MARSHMALLOW)
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
        const itemLabel = giftType === 'coffee' ? '따뜻한 코코아' : '노릇하게 구운 마시멜로';
        giftOfferMessage.innerHTML = `<strong>${actorName}</strong>님이 다가와 두 손으로 ${itemLabel}를 건넵니다!`;
        giftOfferBanner.classList.remove('hidden');
        soundEngine.playHappyChime();
      } else if (!receiver || receiver.id.startsWith('sim_')) {
        setTimeout(() => {
          completeGiftAcceptance(fromSeat, targetSeat, giftType);
        }, 1600);
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

  soundEngine.playHappyChime();

  if (receiver) {
    receiver.receivingUntil = Date.now() + 3400;
    receiver.nodUntil = Date.now() + 2400;
    receiver.action = giftType === 'coffee' ? 'coffee' : 'mallow';
    receiver.roastStartTime = Date.now() - 10000;
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
  showCenterNotice(`🙏 ${actorName}님의 따뜻한 선물을 두 손으로 받았습니다!`);
});

declineGiftBtn.addEventListener('click', () => {
  giftOfferBanner.classList.add('hidden');
  state.pendingGiftOffer = null;
});

// ====================================================
// 9. INTUITIVE KID-FRIENDLY ACTION BUTTON HANDLERS
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
    case 'log': {
      state.logsAddedCount++;
      state.fireHeat = Math.min(1250, state.fireHeat + 45);
      document.getElementById('logsCountDisplay').textContent = `${state.logsAddedCount}개`;
      document.getElementById('fireTempDisplay').textContent = `${state.fireHeat}°C`;

      triggerNaturalLogPlacement(state.mySeatIndex);
      sendServerAction({ type: 'throwLog' });
      showCenterNotice('🪵 영차! 큰 장작을 들고 가서 모닥불에 넣습니다. 불꽃이 활짝 커져요!');
      break;
    }
    case 'hands': {
      state.myAction = 'hands';
      updateDockActiveButtons();
      sendServerAction({ type: 'pose', action: 'hands' });
      showCenterNotice('🤲 모닥불 가까이 두 손을 뻗어 따끈따끈하게 손을 녹여요!');
      break;
    }
    case 'mallow': {
      state.myAction = 'mallow';
      if (myCamper) myCamper.roastStartTime = Date.now();
      updateDockActiveButtons();
      sendServerAction({ type: 'pose', action: 'mallow' });
      showCenterNotice('🍡 커다란 마시멜로를 불꽃에 구워요! 노릇노릇 익어가는 걸 보세요!');
      break;
    }
    case 'coffee': {
      state.myAction = 'coffee';
      updateDockActiveButtons();
      sendServerAction({ type: 'pose', action: 'coffee' });
      showCenterNotice('☕ 보온병에서 김이 모락모락 나는 달콤한 코코아를 따라 마셔요!');
      break;
    }
    case 'give': {
      if (state.users.length <= 1) {
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
            ? `🎁 옆자리 ${target.name}에게 걸어가 따뜻한 코코아를 두 손으로 건네줘요!`
            : `🎁 옆자리 ${target.name}에게 걸어가 잘 구운 마시멜로를 두 손으로 건네줘요!`
        );
      }
      break;
    }
    case 'sparkler': {
      state.myAction = 'sparkler';
      updateDockActiveButtons();
      sendServerAction({ type: 'pose', action: 'sparkler' });
      showCenterNotice('🎇 치지직! 반짝반짝 별빛이 튀는 불꽃놀이를 해요!');
      break;
    }
    case 'aurora': {
      state.auroraUntil = Date.now() < state.auroraUntil ? 0 : Date.now() + 18000;
      sendServerAction({ type: 'aurora' });
      soundEngine.playHappyChime();
      showCenterNotice(
        Date.now() < state.auroraUntil
          ? '🌈 우와! 마법 가루를 뿌려 모닥불이 에메랄드·보라색 오로라 불꽃으로 변했어요!'
          : '🔥 원래의 따뜻한 황금빛 모닥불로 돌아왔어요!'
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
// 10. MAIN ANIMATION LOOP
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
  const baseAngle = mySeat.angle + camControl.orbitOffset;

  // --- CAMERA POV ---
  const targetCamPos = new THREE.Vector3();
  const targetLookAt = new THREE.Vector3();

  if (state.povMode === 'first') {
    const r = Math.max(2.1, 2.95 + camControl.zoomOffset * 0.4);
    targetCamPos.set(
      Math.cos(baseAngle) * r,
      1.35 + camControl.pitchOffset * 0.8,
      Math.sin(baseAngle) * r
    );
    targetLookAt.set(0, 0.9, 0);
  } else if (state.povMode === 'shoulder') {
    const distBehind = Math.max(4.5, Math.min(9.2, 5.6 + camControl.zoomOffset));
    const sideAngle = baseAngle + 0.14;
    targetCamPos.set(
      Math.cos(sideAngle) * distBehind,
      2.22 + camControl.pitchOffset * 1.4,
      Math.sin(sideAngle) * distBehind
    );
    targetLookAt.set(0, 0.98, 0);
  } else {
    const distWide = Math.max(6.8, Math.min(13.0, 9.2 + camControl.zoomOffset));
    targetCamPos.set(
      Math.cos(baseAngle) * distWide,
      3.7 + camControl.pitchOffset * 1.8,
      Math.sin(baseAngle) * distWide
    );
    targetLookAt.set(0, 1.0, 0);
  }

  camControl.currentPos.lerp(targetCamPos, 0.08);
  camControl.currentLookAt.lerp(targetLookAt, 0.08);
  camera.position.copy(camControl.currentPos);
  camera.lookAt(camControl.currentLookAt);

  // --- ANIMATE PHOTOREALISTIC FBM SHADER FLAMES ---
  const isAurora = now < state.auroraUntil;
  const surgeBoost = now < fireRoarSurgeUntil ? 0.38 : 0.0;
  const heatScale = 0.95 + (state.fireHeat - 680) / 700 + surgeBoost;

  fireShaderPlanes.forEach((mesh) => {
    const u = mesh.material.uniforms;
    u.uTime.value = elapsed;
    u.uHeatScale.value = lerp(u.uHeatScale.value, heatScale, 0.08);
    u.uAurora.value = isAurora ? 1.0 : 0.0;
  });

  coreGlowMat.color.setHex(isAurora ? 0x00f5d4 : 0xffaa33);
  coreGlowSphere.scale.setScalar((0.95 + Math.sin(elapsed * 9) * 0.08) * heatScale);

  fireLight.color.setHex(isAurora ? 0x48e5c2 : 0xff8024);
  fireLight.intensity = (5.0 + Math.sin(elapsed * 8.5) * 0.4 + Math.cos(elapsed * 14.0) * 0.25) * heatScale;
  fireLight.position.x = Math.sin(elapsed * 5.0) * 0.09;
  fireLight.position.z = Math.cos(elapsed * 4.3) * 0.09;

  // --- ANIMATE RISING EMBERS ---
  emberMeshes.forEach((sp) => {
    const u = sp.userData;
    sp.position.y += u.vy * dt * (1 + surgeBoost);
    sp.position.x += Math.sin(elapsed * u.swaySpeed + u.phase) * u.swayAmp;
    sp.position.z += Math.cos(elapsed * u.swaySpeed + u.phase) * u.swayAmp;
    const lifeRatio = sp.position.y / u.maxY;
    sp.material.opacity = Math.max(0, (1 - lifeRatio) * 0.95);
    if (sp.position.y >= u.maxY) {
      resetEmberParticle(sp, false);
    }
  });

  // --- ANIMATE CAMPERS & FLOATING ACTION BUBBLES ---
  for (const camper of camperMeshes.values()) {
    const isMe = camper.id === state.clientId;
    camper.group.visible = !(isMe && state.povMode === 'first');

    const isWalking = Boolean(camper.walkState && camper.walkState.isWalking);
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
    camper.mallowGroup.visible = false;
    camper.coffeeGroup.visible = false;
    camper.sparklerGroup.visible = false;

    let bubbleHTML = '';

    // 1. Placing Firewood Log Sequence
    if (isPlacingLog) {
      const pls = camper.placingLogState;
      const stepElapsed = (now - pls.startTime) / 1000;
      bubbleHTML = `🪵 영차! 장작 넣는 중!`;

      if (pls.phase === 'walkToFire') {
        const t = Math.min(1, stepElapsed / 0.7);
        camper.group.position.x = lerp(pls.startX, pls.targetX, t);
        camper.group.position.z = lerp(pls.startZ, pls.targetZ, t);
        camper.group.rotation.y = pls.lookAngle;

        camper.bodyRoot.position.y = lerp(0, 0.2, t);
        const swing = Math.sin(elapsed * 11) * 0.38;
        camper.leftLeg.hipPivot.rotation.set(swing, 0, 0);
        camper.rightLeg.hipPivot.rotation.set(-swing, 0, 0);

        camper.heldLogMesh.visible = true;
        targetTorsoLean = 0.16;
        targetLeftArmX = -0.55;
        targetLeftArmY = 0.25;
        targetRightArmX = -0.55;
        targetRightArmY = -0.25;

        if (t >= 1) {
          pls.phase = 'kneelAndPlace';
          pls.startTime = now;
        }
      } else if (pls.phase === 'kneelAndPlace') {
        const t = Math.min(1, stepElapsed / 0.5);
        camper.heldLogMesh.visible = t < 0.75;
        targetTorsoLean = 0.6 * Math.sin(t * Math.PI);
        targetLeftArmX = -0.85;
        targetRightArmX = -0.85;

        if (t >= 1) {
          addPhysicalLogToFire(pls.seatAngle);
          pls.phase = 'returnToSeat';
          pls.startTime = now;
        }
      } else if (pls.phase === 'returnToSeat') {
        const t = Math.min(1, stepElapsed / 0.7);
        camper.group.position.x = lerp(pls.targetX, pls.startX, t);
        camper.group.position.z = lerp(pls.targetZ, pls.startZ, t);
        camper.bodyRoot.position.y = lerp(0.2, 0, t);

        const swing = Math.sin(elapsed * 11) * 0.32;
        camper.leftLeg.hipPivot.rotation.set(swing, 0, 0);
        camper.rightLeg.hipPivot.rotation.set(-swing, 0, 0);

        if (t >= 1) {
          camper.group.position.set(pls.startX, 0, pls.startZ);
          camper.group.rotation.y = pls.lookAngle;
          camper.placingLogState = null;
        }
      }
    } else if (isWalking) {
      // 2. Walking to Neighbor or Seat
      const ws = camper.walkState;
      const dx = ws.targetX - camper.group.position.x;
      const dz = ws.targetZ - camper.group.position.z;
      const dist = Math.hypot(dx, dz);
      bubbleHTML = `👣 총총 걸어가는 중...`;

      if (dist > 0.07) {
        const step = Math.min(dist, 0.062);
        camper.group.position.x += (dx / dist) * step;
        camper.group.position.z += (dz / dist) * step;
        camper.group.rotation.y = Math.atan2(dx, dz);
      } else {
        camper.group.position.set(ws.targetX, 0, ws.targetZ);
        ws.isWalking = false;
        if (ws.onArrive) ws.onArrive();
      }

      camper.bodyRoot.position.y = lerp(camper.bodyRoot.position.y, 0.2, 0.15);
      const swing = Math.sin(elapsed * 10) * 0.45;
      camper.leftLeg.hipPivot.rotation.set(swing, 0, 0);
      camper.leftLeg.kneePivot.rotation.set(Math.max(0, -swing * 0.6), 0, 0);
      camper.rightLeg.hipPivot.rotation.set(-swing, 0, 0);
      camper.rightLeg.kneePivot.rotation.set(Math.max(0, swing * 0.6), 0, 0);
    } else {
      // 3. Seated on Log Bench
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
        if (camper.offeringGiftType === 'coffee') {
          camper.coffeeGroup.visible = true;
          bubbleHTML = `☕ "따뜻한 코코아 드세요!" 🤲`;
        } else {
          camper.mallowGroup.visible = true;
          bubbleHTML = `🍡 "구운 마시멜로 드세요!" 🤲`;
        }
      } else if (isReceiving) {
        targetTorsoLean = 0.2;
        targetLeftArmX = -0.42;
        targetLeftArmY = 0.24;
        targetRightArmX = -0.42;
        targetRightArmY = -0.24;
        targetHeadX = Math.sin(elapsed * 6) * 0.18 + 0.18;
        camper.coffeeGroup.visible = (camper.action === 'coffee');
        camper.mallowGroup.visible = (camper.action === 'mallow');
        bubbleHTML = `🙏 "고맙습니다! 잘 먹을게요!" 😊`;
      } else if (camper.action === 'hands') {
        // Warming hands with visible golden warmth rings
        camper.handWarmGlow.visible = true;
        camper.handWarmGlow.scale.setScalar(0.85 + Math.sin(elapsed * 5) * 0.18);
        camper.handWarmGlow.material.opacity = 0.45 + Math.sin(elapsed * 5) * 0.2;

        targetTorsoLean = 0.24 + Math.sin(elapsed * 1.6) * 0.02;
        const rub = Math.sin(elapsed * 5.0) * 0.085;
        targetLeftArmX = -0.46 + rub;
        targetLeftArmY = 0.15;
        targetRightArmX = -0.46 - rub;
        targetRightArmY = -0.15;
        targetHeadX = 0.12;
        if (isMe) bubbleHTML = `🤲 불 가까이 손 녹이는 중 (따끈따끈!)`;
      } else if (camper.action === 'mallow') {
        camper.mallowGroup.visible = true;
        const roastElapsed = (now - camper.roastStartTime) / 1000;
        const roastPct = Math.min(100, Math.floor((roastElapsed / 9.0) * 100));

        // When 100% roasted, occasionally bring it to mouth ("냠냠!") then roast a fresh one!
        const isEating = roastElapsed > 10.5 && roastElapsed < 12.5;
        if (roastElapsed >= 12.5) {
          camper.roastStartTime = now;
        }

        if (isEating) {
          targetTorsoLean = 0.06;
          targetRightArmX = -0.78;
          targetRightArmY = 0.25;
          camper.mallowGroup.position.set(0.05, 0.75, 0.18);
          bubbleHTML = `😋 다 구워진 마시멜로 냠냠! 달콤해요!`;
        } else {
          targetTorsoLean = 0.24;
          targetRightArmX = -0.4 + Math.sin(elapsed * 3.0) * 0.04;
          targetRightArmY = -0.08;
          camper.mallowGroup.position.set(0.16, 0.56, 0.36);

          const ratio = roastPct / 100;
          camper.mallowMesh.material.color.lerpColors(
            new THREE.Color(0xffffff),
            new THREE.Color(0xd97f2b),
            ratio
          );
          camper.mallowMesh.scale.setScalar(1.0 + ratio * 0.18); // Puffs up as it roasts!

          if (isMe) {
            bubbleHTML = roastPct < 100
              ? `🍡 마시멜로 굽기 ${roastPct}% <span class="roast-bar"><span class="roast-fill" style="width:${roastPct}%"></span></span>`
              : `✨ 노릇노릇 100% 완성! 곧 맛봐요!`;
          }
        }
      } else if (camper.action === 'coffee') {
        camper.coffeeGroup.visible = true;
        // Animate rising 3D steam rings above the mug
        camper.steamRings.forEach((st, idx) => {
          const cycle = (elapsed * 0.9 + idx * 0.33) % 1;
          st.position.y = 0.14 + cycle * 0.32;
          st.scale.setScalar(0.7 + cycle * 0.8);
          st.material.opacity = (1 - cycle) * 0.65;
        });

        const isSipping = Math.sin(elapsed * 1.4) > 0.65;
        const sipAngle = isSipping ? -0.32 : 0.0;
        targetTorsoLean = 0.08;
        targetLeftArmX = -0.36 + sipAngle;
        targetLeftArmY = 0.24;
        targetRightArmX = -0.36 + sipAngle;
        targetRightArmY = -0.24;
        targetHeadX = sipAngle * 0.4 + 0.06;
        if (isMe) bubbleHTML = isSipping ? `☕ 후루룩~ 따뜻한 코코아 마시는 중!` : `☕ 보온병 코코아 (김이 모락모락~)`;
      } else if (camper.action === 'sparkler') {
        camper.sparklerGroup.visible = true;
        targetTorsoLean = 0.16;
        // Wave sparkler joyfully left and right!
        const wave = Math.sin(elapsed * 4.5) * 0.28;
        targetLeftArmX = -0.45 + Math.cos(elapsed * 4.5) * 0.12;
        targetLeftArmY = wave;
        camper.spCore.scale.setScalar(0.85 + Math.random() * 0.75);
        if (isMe) bubbleHTML = `🎇 치지직! 반짝반짝 불꽃놀이 중!`;

        // Shoot bright multi-colored sparkler stars
        for (let s = 0; s < 2; s++) {
          const worldTip = new THREE.Vector3();
          camper.spCore.getWorldPosition(worldTip);
          const sparkColors = [0xfff380, 0xff9f1c, 0xff6b6b, 0x70e000];
          const sp = new THREE.Mesh(
            new THREE.SphereGeometry(0.025, 4, 4),
            new THREE.MeshBasicMaterial({
              color: sparkColors[Math.floor(Math.random() * sparkColors.length)],
              transparent: true,
              opacity: 1
            })
          );
          sp.position.copy(worldTip);
          scene.add(sp);
          const vx = (Math.random() - 0.5) * 1.8;
          const vy = (Math.random() - 0.1) * 1.8;
          const vz = (Math.random() - 0.5) * 1.8;
          const born = Date.now();
          activeEffects.push({
            update: (d) => {
              const age = (Date.now() - born) / 420;
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

    const b = camper.poseBlend;
    b.torsoLean = lerp(b.torsoLean, targetTorsoLean, 0.12);
    b.leftArmX = lerp(b.leftArmX, targetLeftArmX, 0.14);
    b.leftArmY = lerp(b.leftArmY, targetLeftArmY, 0.14);
    b.rightArmX = lerp(b.rightArmX, targetRightArmX, 0.14);
    b.rightArmY = lerp(b.rightArmY, targetRightArmY, 0.14);
    b.headX = lerp(b.headX, targetHeadX, 0.14);

    const breathScale = 1 + Math.sin(elapsed * 2.0 + camper.seatIndex) * 0.016;
    camper.torsoPivot.scale.set(breathScale, breathScale, breathScale);
    camper.torsoPivot.rotation.x = b.torsoLean;
    camper.leftArm.shoulder.rotation.set(b.leftArmX, b.leftArmY, 0);
    camper.rightArm.shoulder.rotation.set(b.rightArmX, b.rightArmY, 0);
    camper.headGroup.rotation.x = b.headX;

    // Update Floating Action Bubble above the character
    if (camper.bubbleEl) {
      if (bubbleHTML && !state.zenMode && camper.group.visible) {
        camper.bubbleEl.innerHTML = bubbleHTML;
        const topPos = camper.group.position.clone();
        topPos.y += 2.35;
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

  // 1. Clicked another camper? -> Walk over and give gift!
  const camperHits = raycaster.intersectObjects(camperHitMeshes, false);
  if (camperHits.length > 0) {
    const hitData = camperHits[0].object.userData;
    if (hitData.seatIndex !== undefined && hitData.seatIndex !== state.mySeatIndex) {
      const giftType = state.myAction === 'mallow' ? 'mallow' : 'coffee';
      animateWalkAndOfferGift(state.mySeatIndex, hitData.seatIndex, giftType, state.myNickname);
      sendServerAction({ type: 'offerGift', targetSeat: hitData.seatIndex, giftType });
      showCenterNotice('🎁 친구에게 걸어가 두 손으로 선물을 건네줘요!');
      return;
    }
  }

  // 2. Clicked a Log Bench? -> Move seat
  const seatHits = raycaster.intersectObjects(seatClickMeshes, false);
  if (seatHits.length > 0) {
    const newSeat = seatHits[0].object.userData.seatIndex;
    if (typeof newSeat === 'number' && newSeat !== state.mySeatIndex) {
      state.mySeatIndex = newSeat;
      camControl.orbitOffset = 0;
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
      showCenterNotice('👣 선택한 통나무 자리로 총총 걸어가 앉아요!');
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
        color: state.myColor
      }];

  document.getElementById('onlineCount').textContent = String(realList.length);

  if (state.enableSoloCompanion && realList.length === 1) {
    const companionSeat = (state.mySeatIndex + 1) % MAX_SEATS; // Sit right next to the user!
    state.users = [
      ...realList,
      {
        id: 'sim_forest_companion',
        name: '다정한 숲속친구',
        seatIndex: companionSeat,
        action: 'coffee',
        color: '#4ecdc4'
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
  state.fireHeat = snapshot.fireHeat || 750;
  document.getElementById('fireTempDisplay').textContent = `${state.fireHeat}°C`;

  state.realUsers = snapshot.users || [];
  const me = state.realUsers.find((u) => u.id === state.clientId);
  if (me) state.mySeatIndex = me.seatIndex;

  rebuildActiveUsersList();
}

function handleIncomingRoomEffect(eff) {
  if (!eff) return;
  if (eff.effect === 'throwLog') {
    state.fireHeat = eff.fireHeat || state.fireHeat + 45;
    document.getElementById('fireTempDisplay').textContent = `${state.fireHeat}°C`;
    if (eff.fromSeat !== state.mySeatIndex) {
      triggerNaturalLogPlacement(eff.fromSeat);
      showCenterNotice(`🪵 ${eff.actorName}님이 모닥불에 큰 장작을 넣었어요!`);
    }
  } else if (eff.effect === 'aurora') {
    state.auroraUntil = Date.now() + 18000;
    if (eff.fromSeat !== state.mySeatIndex) {
      soundEngine.playHappyChime();
      showCenterNotice(`🌈 ${eff.actorName}님이 무지개 마법불 가루를 뿌렸어요!`);
    }
  } else if (eff.effect === 'offerGift') {
    if (eff.fromSeat !== state.mySeatIndex) {
      animateWalkAndOfferGift(eff.fromSeat, eff.targetSeat, eff.giftType, eff.actorName);
    }
  } else if (eff.effect === 'acceptGift') {
    if (eff.targetSeat !== state.mySeatIndex) {
      completeGiftAcceptance(eff.fromSeat, eff.targetSeat, eff.giftType);
      showCenterNotice(`🙏 ${eff.actorName}님이 선물을 두 손으로 기쁘게 받았어요!`);
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
  document.getElementById('currentRoomName').textContent = isRain ? '⛺ 빗소리 캠핑 모닥불' : '🌲 노을빛 소나무 숲';
  document.getElementById('currentRegionTag').textContent = `채널 #${state.instance}`;

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
  showCenterNotice('🔥 따뜻한 모닥불 앞에 앉았어요! 아래 버튼들을 하나씩 눌러보세요!');
});

// Camera POV Toggle
const povLabel = document.getElementById('povLabel');
document.getElementById('cameraPovBtn').addEventListener('click', () => {
  camControl.orbitOffset = 0;
  camControl.pitchOffset = 0;
  camControl.zoomOffset = 0;

  if (state.povMode === 'shoulder') {
    state.povMode = 'first';
    povLabel.textContent = '불꽃 가까이 보기';
    showCenterNotice('📷 불꽃 가까이 보기: 눈앞에서 타오르는 진짜 불꽃만 가득 채워 봐요!');
  } else if (state.povMode === 'first') {
    state.povMode = 'wide';
    povLabel.textContent = '캠핑장 전체 보기';
    showCenterNotice('📷 전체 보기: 밝고 아늑한 소나무 숲 캠핑장 전체를 둘러봐요!');
  } else {
    state.povMode = 'shoulder';
    povLabel.textContent = '내 캐릭터+불꽃';
    showCenterNotice('📷 내 캐릭터+불꽃 보기: 내 캐릭터가 행동하는 모습과 불꽃을 함께 봐요!');
  }
});

// Solo AI Companion Toggle
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
    showCenterNotice('🔗 모닥불 방 주소가 복사되었어요! 친구에게 보내 함께 앉아보세요!');
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
  worryCount.textContent = `${worryInput.value.length} / 100자`;
});

document.getElementById('burnWorrySubmitBtn').addEventListener('click', () => {
  worryInput.value = '';
  worryCount.textContent = '0 / 100자';
  document.getElementById('worryModal').classList.add('hidden');
  triggerNaturalLogPlacement(state.mySeatIndex);
  soundEngine.playHappyChime();
  showCenterNotice('🔥 걱정이 모닥불 불꽃 속으로 날아가 반짝이는 별똥별 불티가 되어 사라졌어요!');
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
const KEY_MAP = ['log', 'hands', 'mallow', 'coffee', 'give', 'sparkler', 'aurora', 'worry'];
window.addEventListener('keydown', (e) => {
  if (document.activeElement === worryInput) return;
  const idx = Number(e.key) - 1;
  if (idx >= 0 && idx < KEY_MAP.length) {
    triggerCampfireAction(KEY_MAP[idx]);
  }
});

// Initialize
rebuildActiveUsersList();
animate();
