/**
 * 불멍 · 물멍 · 별멍 (3D WebGL Digital Sanctuary)
 * Inspired by '산사, 잠깐 쉬어가요 (sansatemple.com)'
 *
 * 3 Core Concepts:
 * 1. 🔥 불멍 (fire-01 / rain-04): 3D Campfire, Log Throwing, Marshmallow Roasting & Sharing, Sparkler Fireworks
 * 2. 💧 물멍 (water-02): 3D Moonlight Mirror Pond, Expanding Water Ripples, Floating Lotus Lanterns (소원 연등), Fireflies
 * 3. ⭐ 별멍 (star-03): 3D Stargazing Observatory Hill, Personal 3D Brass Telescope (망원경 별보기), Shooting Stars (별똥별)
 *
 * Universal Social Interactions:
 * - 👋 인사하기 (Wave hand animation + bubble)
 * - ☕ 보온병 커피 주기 (Pour steaming coffee from 3D thermos and send a warm mug to another camper)
 * - 🚶 모닥불/연못/천문대 주변 걸어 다니기 (Click ground to stroll, click log bench to sit)
 */

// ==========================================
// 1. POETIC NICKNAME GENERATOR (SANSA STYLE)
// ==========================================
const ADJECTIVES = [
  '따뜻한', '고요한', '은은한', '다정한', '느긋한',
  '포근한', '잔잔한', '아늑한', '차분한', '나른한',
  '별빛 닮은', '타닥이는', '잠 못 드는', '쉬어가는', '투명한'
];

const NOUNS = [
  '불씨', '모닥불', '솔방울', '물결', '밤공기',
  '별똥별', '캠퍼', '조약돌', '초승달', '소나무',
  '담요', '마시멜로', '새벽별', '반딧불이', '온기'
];

function generatePoeticName() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj} ${noun}`;
}

// ==========================================
// 2. ROOM & 3-CONCEPT STATE MANAGEMENT
// ==========================================
const ROOM_CONFIGS = {
  'fire-01': {
    name: '🔥 불멍 · 소나무 숲터',
    concept: 'fire',
    icon: '🔥',
    fogColor: 0x080b14,
    groundColor: 0x1e1916,
    treeColor: 0x0f1c16,
    baseUsers: 28,
    defaultWind: 45,
    defaultRain: 0
  },
  'water-02': {
    name: '💧 물멍 · 달빛 거울 연못',
    concept: 'water',
    icon: '💧',
    fogColor: 0x05131e,
    groundColor: 0x132226,
    treeColor: 0x0d2622,
    baseUsers: 34,
    defaultWind: 65,
    defaultRain: 15
  },
  'star-03': {
    name: '⭐ 별멍 · 은하수 천문 언덕',
    concept: 'star',
    icon: '⭐',
    fogColor: 0x07091c,
    groundColor: 0x181b2e,
    treeColor: 0x121830,
    baseUsers: 23,
    defaultWind: 55,
    defaultRain: 0
  },
  'rain-04': {
    name: '⛺ 우중 불멍 · 빗소리 타프',
    concept: 'fire',
    theme: 'rain',
    icon: '⛺',
    fogColor: 0x080a10,
    groundColor: 0x1a1614,
    treeColor: 0x0d1512,
    baseUsers: 37,
    defaultWind: 35,
    defaultRain: 75
  }
};

// Map legacy room names gracefully
function normalizeRoomKey(r) {
  if (r === 'pine-01') return 'fire-01';
  if (r === 'beach-02') return 'water-02';
  if (r === 'snow-03') return 'star-03';
  return ROOM_CONFIGS[r] ? r : 'fire-01';
}

const camperColors = [
  '#e07a5f', '#81b29a', '#f2cc8f', '#6d9dc5',
  '#c98bb9', '#d4a373', '#98c1d9', '#e5989b',
  '#7aa095', '#f4a261', '#8e9aaf', '#b5838d'
];

const state = {
  entered: false,
  zenMode: false,
  isMultiplayerConnected: false,
  clientId: `camper_${Math.random().toString(36).slice(2, 9)}`,
  myColor: camperColors[Math.floor(Math.random() * camperColors.length)],
  room: 'fire-01',
  instance: 0,
  region: 'apac',
  myName: generatePoeticName(),
  mySeatIndex: 6,
  myAction: 'hands', // wave, hands, roast, thermos, telescope, sparkler
  roastProgress: 0,
  sparklerLitTimer: 0,
  waveTimer: 0,
  // Free Strolling / Walking state
  isWalking: false,
  walkPos: { x: 0, z: 3.55 },
  walkTarget: { x: 0, z: 3.55 },
  staySeconds: 0,
  fireHeat: 680,
  auroraTimer: 0,
  // 3D Orbit Camera Spherical Coordinates
  camYaw: 0.0,
  targetCamYaw: 0.0,
  camPitch: 0.48,
  targetCamPitch: 0.48,
  camDist: 12.2,
  targetCamDist: 12.2,
  pointer: { x: 0, y: 0, down: false, moved: false }
};

function getCurrentConcept() {
  return ROOM_CONFIGS[state.room]?.concept || 'fire';
}

function syncUrlParams(roomKey) {
  const url = new URL(window.location.href);
  if (roomKey) {
    state.room = normalizeRoomKey(roomKey);
  } else {
    const qRoom = url.searchParams.get('room');
    if (qRoom) state.room = normalizeRoomKey(qRoom);
    const qInst = url.searchParams.get('instance');
    if (qInst !== null) state.instance = parseInt(qInst, 10) || 0;
    const qReg = url.searchParams.get('region');
    if (qReg) state.region = qReg.toLowerCase();
  }

  url.searchParams.set('room', state.room);
  url.searchParams.set('instance', String(state.instance));
  url.searchParams.set('region', state.region);
  window.history.replaceState({}, '', url.toString());

  const cfg = ROOM_CONFIGS[state.room];
  document.getElementById('currentRoomName').textContent = cfg.name;
  document.getElementById('currentRegionTag').textContent = `${state.region.toUpperCase()} · #${state.instance}`;
  const miniIcon = document.getElementById('modeMiniIcon');
  if (miniIcon) miniIcon.textContent = cfg.icon;

  // Update dynamic buttons for 불멍 / 물멍 / 별멍
  const concept = cfg.concept;
  const ritualIcon = document.getElementById('ritualMainIcon');
  const ritualLabel = document.getElementById('ritualMainLabel');
  const poseIcon = document.getElementById('poseMainIcon');
  const poseLabel = document.getElementById('poseMainLabel');

  if (concept === 'fire') {
    if (ritualIcon) ritualIcon.textContent = '🪵';
    if (ritualLabel) ritualLabel.textContent = '장작 넣기';
    if (poseIcon) poseIcon.textContent = '🤲';
    if (poseLabel) poseLabel.textContent = '손 녹이기';
  } else if (concept === 'water') {
    if (ritualIcon) ritualIcon.textContent = '🪷';
    if (ritualLabel) ritualLabel.textContent = '소원 연등 띄우기';
    if (poseIcon) poseIcon.textContent = '💧';
    if (poseLabel) poseLabel.textContent = '물결 바라보기';
  } else if (concept === 'star') {
    if (ritualIcon) ritualIcon.textContent = '🌠';
    if (ritualLabel) ritualLabel.textContent = '별똥별 부르기';
    if (poseIcon) poseIcon.textContent = '🌌';
    if (poseLabel) poseLabel.textContent = '밤하늘 올려보기';
  }

  // Sync active state on top concept tabs and bottom mode chips
  document.querySelectorAll('.concept-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.room === state.room);
  });
  document.querySelectorAll('[data-switch-room]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.switchRoom === state.room);
  });
  document.querySelectorAll('.room-item').forEach(el => {
    el.classList.toggle('active', el.dataset.room === state.room);
  });

  if (!state.isMultiplayerConnected) {
    document.getElementById('onlineCount').textContent = String(cfg.baseUsers);
  }
}

// ==========================================
// 3. PROCEDURAL WEB AUDIO ASMR SYNTHESIZER
// ==========================================
class CampfireAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.volumes = { fire: 0.8, wind: 0.45, rain: 0.0, night: 0.5 };
    this.nodes = {};
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.9;
    this.masterGain.connect(this.ctx.destination);

    const bufferSize = this.ctx.sampleRate * 3;
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.2;
    }

    this._setupFireBed();
    this._setupWindBed();
    this._setupRainBed();
    this._startCrackleLoop();
    this._startNightLoop();
  }

  _setupFireBed() {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 180;
    const gain = this.ctx.createGain();
    gain.gain.value = this.volumes.fire * 0.35;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start();
    this.nodes.fireGain = gain;
  }

  _setupWindBed() {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 340;
    filter.Q.value = 2.8;
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.14;
    lfo.connect(filter.frequency);
    lfo.start();
    const gain = this.ctx.createGain();
    gain.gain.value = this.volumes.wind * 0.22;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start();
    this.nodes.windGain = gain;
  }

  _setupRainBed() {
    const bufferSize = this.ctx.sampleRate * 2;
    const rainBuf = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const out = rainBuf.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) out[i] = (Math.random() * 2 - 1) * 0.35;
    const src = this.ctx.createBufferSource();
    src.buffer = rainBuf;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1400;
    filter.Q.value = 0.7;
    const gain = this.ctx.createGain();
    gain.gain.value = this.volumes.rain * 0.25;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start();
    this.nodes.rainGain = gain;
  }

  _startCrackleLoop() {
    const triggerCrackle = () => {
      if (this.ctx && !this.isMuted && this.volumes.fire > 0.02) {
        const concept = getCurrentConcept();
        if (concept === 'fire') {
          const count = Math.random() < 0.35 ? 2 : 1;
          for (let i = 0; i < count; i++) {
            this.playWoodSnap(this.volumes.fire * (0.25 + Math.random() * 0.45));
          }
        } else if (concept === 'water' && Math.random() < 0.25) {
          this.playWaterDrop(this.volumes.fire * 0.18);
        }
      }
      setTimeout(triggerCrackle, 110 + Math.random() * 420);
    };
    triggerCrackle();
  }

  _startNightLoop() {
    const triggerNight = () => {
      if (this.ctx && !this.isMuted && this.volumes.night > 0.02) {
        if (Math.random() < 0.6) this.playCricketChirp(this.volumes.night * 0.08);
        else this.playSingingBowl(this.volumes.night * 0.12);
      }
      setTimeout(triggerNight, 3200 + Math.random() * 5500);
    };
    triggerNight();
  }

  playWoodSnap(intensity = 0.4) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const dur = 0.018 + Math.random() * 0.025;
    const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) {
      ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / ch.length, 2.4);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1600 + Math.random() * 2800;
    filter.Q.value = 3.2;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(intensity * 0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
  }

  playWaterDrop(vol = 0.15) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const startFreq = 520 + Math.random() * 340;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 1.65, now + 0.085);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.095);
  }

  playStarChime(vol = 0.14) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [1046.5, 1318.5, 1567.98, 2093.0];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gain.gain.setValueAtTime(0.0001, now + idx * 0.06);
      gain.gain.linearRampToValueAtTime(vol * 0.5, now + idx * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 1.1);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 1.15);
    });
  }

  playCricketChirp(vol = 0.06) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    for (let p = 0; p < 3; p++) {
      const start = now + p * 0.055;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(4150 + Math.random() * 120, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(vol, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.042);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + 0.045);
    }
  }

  playSingingBowl(vol = 0.12) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const freqs = [256, 384, 512, 432];
    const baseFreq = freqs[Math.floor(Math.random() * freqs.length)];
    const osc = this.ctx.createOscillator();
    const overtone = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    overtone.type = 'sine';
    overtone.frequency.setValueAtTime(baseFreq * 2.756, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 6.5);
    const overGain = this.ctx.createGain();
    overGain.gain.value = 0.15;
    osc.connect(gain);
    overtone.connect(overGain);
    overGain.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    overtone.start(now);
    osc.stop(now + 6.6);
    overtone.stop(now + 6.6);
  }

  playFireworkPop() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(1450, now + 0.45);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.5);

    setTimeout(() => {
      this.playWoodSnap(0.85);
      this.playWoodSnap(0.65);
    }, 460);
  }

  playWhoosh() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(220, now);
    filter.frequency.exponentialRampToValueAtTime(780, now + 0.25);
    filter.frequency.exponentialRampToValueAtTime(180, now + 0.85);
    filter.Q.value = 1.8;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.45 * this.volumes.fire, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
    src.stop(now + 0.95);
  }

  setVolume(channel, percent) {
    const v = Math.max(0, Math.min(1, percent / 100));
    this.volumes[channel] = v;
    if (!this.ctx) return;
    if (channel === 'fire' && this.nodes.fireGain) {
      this.nodes.fireGain.gain.setTargetAtTime(v * 0.35, this.ctx.currentTime, 0.1);
    } else if (channel === 'wind' && this.nodes.windGain) {
      this.nodes.windGain.gain.setTargetAtTime(v * 0.22, this.ctx.currentTime, 0.1);
    } else if (channel === 'rain' && this.nodes.rainGain) {
      this.nodes.rainGain.gain.setTargetAtTime(v * 0.25, this.ctx.currentTime, 0.1);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.9, this.ctx.currentTime, 0.1);
    }
    return this.isMuted;
  }
}

const audio = new CampfireAudioEngine();

// ==========================================
// 4. SEATS, CAMPERS & REAL-TIME MULTIPLAYER SYNC
// ==========================================
const SEAT_COUNT = 12;
const SEAT_RADIUS = 3.55;
const seats = [];
const labelsContainer = document.getElementById('labels3DContainer');

let eventSource = null;

function initSeats() {
  seats.length = 0;
  labelsContainer.innerHTML = '';

  for (let i = 0; i < SEAT_COUNT; i++) {
    const angle = (i / SEAT_COUNT) * Math.PI * 2;
    const isMe = i === state.mySeatIndex;
    const occupied = isMe || (!state.isMultiplayerConnected && Math.random() < 0.65);
    const actions = ['hands', 'roast', 'thermos', 'telescope', 'sparkler'];

    const labelEl = document.createElement('div');
    labelEl.className = 'camper-label-3d';
    labelsContainer.appendChild(labelEl);

    seats.push({
      index: i,
      angle,
      x: Math.sin(angle) * SEAT_RADIUS,
      z: Math.cos(angle) * SEAT_RADIUS,
      occupied,
      isMe,
      name: isMe ? state.myName : generatePoeticName(),
      color: isMe ? state.myColor : camperColors[i % camperColors.length],
      action: isMe ? state.myAction : actions[Math.floor(Math.random() * actions.length)],
      bobPhase: Math.random() * Math.PI * 2,
      waveUntil: 0,
      labelEl,
      meshGroup: null
    });
  }
}

function showSeatBubble(seatIndex, emojiText) {
  const seat = seats[seatIndex];
  if (!seat || !seat.labelEl) return;
  const b = document.createElement('div');
  b.className = 'camper-bubble-3d';
  b.textContent = emojiText;
  seat.labelEl.appendChild(b);
  setTimeout(() => b.remove(), 1600);
}

function applyServerSnapshot(snapshot) {
  if (!snapshot) return;
  if (typeof snapshot.instance === 'number' && snapshot.instance !== state.instance) {
    state.instance = snapshot.instance;
    syncUrlParams(state.room);
  }
  state.fireHeat = snapshot.fireHeat || state.fireHeat;
  if (snapshot.auroraActive && state.auroraTimer <= 0) {
    state.auroraTimer = 10;
  }

  document.getElementById('onlineCount').textContent = String(snapshot.roomCount || 1);

  for (let i = 0; i < SEAT_COUNT; i++) {
    seats[i].occupied = false;
    seats[i].isMe = false;
  }

  for (const u of snapshot.users || []) {
    const idx = Math.max(0, Math.min(SEAT_COUNT - 1, u.seatIndex));
    const seat = seats[idx];
    const isMe = u.id === state.clientId;
    seat.occupied = true;
    seat.isMe = isMe;
    seat.name = u.name;
    seat.color = u.color || camperColors[idx % camperColors.length];
    seat.action = u.action || 'hands';
    if (isMe) {
      state.mySeatIndex = idx;
    }
  }

  sync3DCamperMeshes();
}

function connectMultiplayerServer() {
  if (window.location.protocol === 'file:') return;

  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }

  const params = new URLSearchParams({
    room: state.room,
    instance: String(state.instance),
    region: state.region,
    clientId: state.clientId,
    name: state.myName,
    color: state.myColor
  });

  try {
    eventSource = new EventSource(`/api/stream?${params.toString()}`);

    eventSource.addEventListener('init', (e) => {
      state.isMultiplayerConnected = true;
      const data = JSON.parse(e.data);
      state.mySeatIndex = data.mySeatIndex;
      applyServerSnapshot(data.snapshot);
      focusCameraOnSeat(state.mySeatIndex);
    });

    eventSource.addEventListener('sync', (e) => {
      state.isMultiplayerConnected = true;
      const snapshot = JSON.parse(e.data);
      applyServerSnapshot(snapshot);
    });

    eventSource.addEventListener('effect', (e) => {
      const ev = JSON.parse(e.data);
      const actorSeat = seats[ev.fromSeat];

      if (ev.effect === 'throwLog') {
        if (ev.fromSeat !== state.mySeatIndex && actorSeat) {
          spawn3DFlyingLog(ev.fromSeat);
          showSeatBubble(ev.fromSeat, '🪵');
          showToast(`'${ev.actorName}'님이 모닥불에 장작을 건넸습니다 🔥`);
        }
      } else if (ev.effect === 'floatLantern') {
        if (ev.fromSeat !== state.mySeatIndex) {
          spawn3DFloatingLantern(ev.fromSeat);
          showSeatBubble(ev.fromSeat, '🪷');
          showToast(`'${ev.actorName}'님이 물 위에 소원 연등을 띄웠습니다 🪷`);
        }
      } else if (ev.effect === 'shootingStar') {
        if (ev.fromSeat !== state.mySeatIndex) {
          spawn3DShootingStar();
          showSeatBubble(ev.fromSeat, '🌠');
          showToast(`'${ev.actorName}'님이 부른 별똥별이 밤하늘을 가로지릅니다 🌠`);
        }
      } else if (ev.effect === 'aurora') {
        state.auroraTimer = 14;
        if (ev.fromSeat !== state.mySeatIndex && actorSeat) {
          audio.playSingingBowl(0.18);
          showSeatBubble(ev.fromSeat, '✨');
          showToast(`'${ev.actorName}'님이 신비로운 오로라와 반딧불이를 불렀습니다 ✨`);
        }
      } else if (ev.effect === 'wave') {
        if (actorSeat) actorSeat.waveUntil = performance.now() + 2600;
        showSeatBubble(ev.fromSeat, '👋😊');
        if (ev.fromSeat !== state.mySeatIndex) {
          showToast(`'${ev.actorName}'님이 반갑게 손인사를 건넵니다 👋`);
        }
      } else if (ev.effect === 'nod') {
        showSeatBubble(ev.fromSeat, '🙏');
        if (typeof ev.targetSeat === 'number') {
          showSeatBubble(ev.targetSeat, '🙏');
        }
      } else if (ev.effect === 'shareMallow') {
        if (ev.fromSeat !== state.mySeatIndex) {
          spawn3DSharedItem(ev.fromSeat, ev.targetSeat, 'mallow');
          showToast(`'${ev.actorName}'님이 노릇하게 구운 마시멜로를 나눠주었습니다 🍡`);
        }
      } else if (ev.effect === 'shareCoffee') {
        if (ev.fromSeat !== state.mySeatIndex) {
          spawn3DSharedItem(ev.fromSeat, ev.targetSeat, 'coffee');
          showToast(`'${ev.actorName}'님이 보온병에서 따뜻한 커피를 따라 건넸습니다 ☕`);
        }
      } else if (ev.effect === 'firework') {
        if (ev.fromSeat !== state.mySeatIndex) {
          launch3DFirework(ev.fromSeat);
          showToast(`'${ev.actorName}'님이 밤하늘에 불꽃놀이를 쏘아 올렸습니다 🎆`);
        }
      }
    });

    eventSource.onerror = () => {
      if (!state.isMultiplayerConnected && eventSource) {
        eventSource.close();
      }
    };
  } catch (_) {}
}

function sendServerAction(payload) {
  if (!state.isMultiplayerConnected) return;
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

// Simulate gentle non-verbal actions in single-player/offline mode
setInterval(() => {
  if (!state.entered || state.isMultiplayerConnected) return;
  const others = seats.filter(s => s.occupied && !s.isMe);
  if (others.length === 0) return;
  const actor = others[Math.floor(Math.random() * others.length)];
  const concept = getCurrentConcept();
  const roll = Math.random();

  if (roll < 0.22) {
    if (concept === 'fire') {
      spawn3DFlyingLog(actor.index);
      showSeatBubble(actor.index, '🪵');
    } else if (concept === 'water') {
      spawn3DFloatingLantern(actor.index);
      showSeatBubble(actor.index, '🪷');
    } else {
      spawn3DShootingStar();
      showSeatBubble(actor.index, '🌠');
    }
  } else if (roll < 0.42) {
    actor.waveUntil = performance.now() + 2500;
    showSeatBubble(actor.index, '👋');
  } else if (roll < 0.62) {
    spawn3DSharedItem(actor.index, state.mySeatIndex, Math.random() < 0.5 ? 'coffee' : 'mallow');
  }
}, 5400);

// ==========================================
// 5. THREE.JS 3D WEBGL SCENE & 3 CONCEPTS
// ==========================================
const canvas = document.getElementById('campfireCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x080b14, 0.016);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 200);

// Lighting
const ambientLight = new THREE.AmbientLight(0x2d3a59, 0.92);
scene.add(ambientLight);

const moonDirLight = new THREE.DirectionalLight(0x88a4d9, 0.5);
moonDirLight.position.set(18, 28, -22);
scene.add(moonDirLight);

const centerLight = new THREE.PointLight(0xff7b29, 4.4, 28, 1.4);
centerLight.position.set(0, 1.6, 0);
centerLight.castShadow = true;
centerLight.shadow.mapSize.width = 1024;
centerLight.shadow.mapSize.height = 1024;
centerLight.shadow.bias = -0.002;
scene.add(centerLight);

const centerFillLight = new THREE.PointLight(0xff5511, 1.8, 14);
centerFillLight.position.set(0, 0.4, 0);
scene.add(centerFillLight);

const envGroup = new THREE.Group();
scene.add(envGroup);

// Concept-specific 3D Centerpiece Groups
const fireCenterGroup = new THREE.Group();
const waterCenterGroup = new THREE.Group();
const starCenterGroup = new THREE.Group();
scene.add(fireCenterGroup, waterCenterGroup, starCenterGroup);

let groundMesh = null;
let tarpMesh = null;
let walkTargetRing = null;
let pondMirrorMesh = null;
let milkyWayPoints = null;
const waterRipples = [];
const floatingLanterns = [];
const shootingStars = [];
const seatClickTargets = [];

function build3DEnvironment() {
  // Ground Clearing
  const groundGeo = new THREE.CylinderGeometry(42, 42, 1, 64);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x1e1916,
    roughness: 0.92,
    metalness: 0.05
  });
  groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.position.y = -0.5;
  groundMesh.receiveShadow = true;
  envGroup.add(groundMesh);

  // Walk Target Ripple Indicator on Ground
  const ringGeo = new THREE.RingGeometry(0.22, 0.32, 24);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffaa4c, side: THREE.DoubleSide, transparent: true, opacity: 0.0 });
  walkTargetRing = new THREE.Mesh(ringGeo, ringMat);
  walkTargetRing.position.y = 0.03;
  scene.add(walkTargetRing);

  // ------------------------------------------
  // A. 🔥 불멍 (FIRE CENTERPIECE)
  // ------------------------------------------
  const stoneGeo = new THREE.DodecahedronGeometry(0.32, 1);
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x45413e, roughness: 0.88 });
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const stone = new THREE.Mesh(stoneGeo, stoneMat);
    stone.position.set(Math.sin(a) * 1.32, 0.15, Math.cos(a) * 1.32);
    stone.scale.set(1.1, 0.75, 1.0);
    stone.rotation.y = a;
    stone.castShadow = true;
    stone.receiveShadow = true;
    fireCenterGroup.add(stone);
  }

  const emberBedGeo = new THREE.ConeGeometry(1.18, 0.38, 24);
  const thisEmberMat = new THREE.MeshBasicMaterial({ color: 0xff5511 });
  const emberBed = new THREE.Mesh(emberBedGeo, thisEmberMat);
  emberBed.position.y = 0.15;
  fireCenterGroup.add(emberBed);
  scene.userData.emberBedMat = thisEmberMat;

  const pitLogGeo = new THREE.CylinderGeometry(0.15, 0.17, 2.0, 12);
  const pitLogMat = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.9 });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI + 0.2;
    const log = new THREE.Mesh(pitLogGeo, pitLogMat);
    log.position.set(Math.sin(a) * 0.18, 0.3 + (i % 2) * 0.12, Math.cos(a) * 0.18);
    log.rotation.z = Math.PI / 2 - 0.28;
    log.rotation.y = a;
    log.castShadow = true;
    fireCenterGroup.add(log);
  }

  // ------------------------------------------
  // B. 💧 물멍 (WATER POND CENTERPIECE)
  // ------------------------------------------
  const pondGeo = new THREE.CircleGeometry(2.65, 48);
  pondGeo.rotateX(-Math.PI / 2);
  const pondMat = new THREE.MeshStandardMaterial({
    color: 0x0b384f,
    emissive: 0x072638,
    emissiveIntensity: 0.5,
    roughness: 0.12,
    metalness: 0.75
  });
  pondMirrorMesh = new THREE.Mesh(pondGeo, pondMat);
  pondMirrorMesh.position.y = 0.03;
  waterCenterGroup.add(pondMirrorMesh);

  // Smooth river pebbles & glowing water lilies around the pond
  const pebbleMat = new THREE.MeshStandardMaterial({ color: 0x36494e, roughness: 0.6 });
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const p = new THREE.Mesh(stoneGeo, pebbleMat);
    p.position.set(Math.sin(a) * 2.68, 0.08, Math.cos(a) * 2.68);
    p.scale.set(0.95, 0.45, 0.85);
    p.rotation.y = a;
    waterCenterGroup.add(p);
  }

  // Expanding Ripple Rings on the Pond
  for (let r = 0; r < 5; r++) {
    const ripGeo = new THREE.RingGeometry(0.15, 0.2, 36);
    ripGeo.rotateX(-Math.PI / 2);
    const ripMat = new THREE.MeshBasicMaterial({
      color: 0x7ce8ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6
    });
    const rip = new THREE.Mesh(ripGeo, ripMat);
    rip.position.set((Math.random() - 0.5) * 1.6, 0.045, (Math.random() - 0.5) * 1.6);
    rip.userData = { progress: r / 5 };
    waterCenterGroup.add(rip);
    waterRipples.push(rip);
  }

  // ------------------------------------------
  // C. ⭐ 별멍 (STARGAZING ASTROLABE CENTERPIECE)
  // ------------------------------------------
  const daisGeo = new THREE.CylinderGeometry(1.75, 2.0, 0.18, 32);
  const daisMat = new THREE.MeshStandardMaterial({ color: 0x252a42, roughness: 0.6, metalness: 0.3 });
  const dais = new THREE.Mesh(daisGeo, daisMat);
  dais.position.y = 0.09;
  starCenterGroup.add(dais);

  // Glowing Constellation Astrolabe Rings floating gently above the center
  const ring1Geo = new THREE.TorusGeometry(0.85, 0.025, 12, 48);
  const ringMatGold = new THREE.MeshBasicMaterial({ color: 0xffdf80, wireframe: false });
  const astroRing1 = new THREE.Mesh(ring1Geo, ringMatGold);
  astroRing1.position.y = 1.15;
  const astroRing2 = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.02, 12, 48), new THREE.MeshBasicMaterial({ color: 0x82b1ff }));
  astroRing2.position.y = 1.15;
  const starCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), new THREE.MeshBasicMaterial({ color: 0xfff6d6 }));
  starCore.position.y = 1.15;
  starCenterGroup.add(astroRing1, astroRing2, starCore);
  starCenterGroup.userData = { astroRing1, astroRing2, starCore };

  // Surrounding 3D Pine Forest — Placed at 19.5m~32m so trees never block camera view
  const trunkGeo = new THREE.CylinderGeometry(0.22, 0.32, 1.8, 8);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x2d1d12, roughness: 0.9 });
  const leavesMat = new THREE.MeshStandardMaterial({ color: 0x0f1c16, roughness: 0.85, flatShading: true });
  scene.userData.leavesMat = leavesMat;

  for (let i = 0; i < 48; i++) {
    const angle = (i / 48) * Math.PI * 2 + (Math.random() - 0.5) * 0.08;
    const dist = 19.5 + Math.random() * 13.0;
    const tree = new THREE.Group();
    tree.position.set(Math.sin(angle) * dist, 0, Math.cos(angle) * dist);
    const s = 1.0 + Math.random() * 1.1;
    tree.scale.set(s, s, s);

    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.9;
    tree.add(trunk);

    for (let layer = 0; layer < 3; layer++) {
      const coneGeo = new THREE.ConeGeometry(1.45 - layer * 0.3, 2.4 - layer * 0.3, 7);
      const cone = new THREE.Mesh(coneGeo, leavesMat);
      cone.position.y = 2.2 + layer * 1.25;
      tree.add(cone);
    }
    envGroup.add(tree);
  }

  // Rain Tarp Shelter
  const tarpGeo = new THREE.ConeGeometry(8.5, 2.4, 4);
  const tarpMat = new THREE.MeshStandardMaterial({ color: 0x262936, roughness: 0.7, side: THREE.DoubleSide });
  tarpMesh = new THREE.Mesh(tarpGeo, tarpMat);
  tarpMesh.position.set(0, 6.6, 0);
  tarpMesh.rotation.y = Math.PI / 4;
  tarpMesh.visible = false;
  envGroup.add(tarpMesh);

  // Standard 3D Starfield Dome
  const starGeo = new THREE.BufferGeometry();
  const starCount = 600;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 0.46;
    const r = 62 + Math.random() * 15;
    starPos[i * 3] = r * Math.sin(phi) * Math.sin(theta);
    starPos[i * 3 + 1] = r * Math.cos(phi) + 3;
    starPos[i * 3 + 2] = r * Math.sin(phi) * Math.cos(theta);
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xfff4dc, size: 0.38, transparent: true, opacity: 0.9 });
  scene.add(new THREE.Points(starGeo, starMat));

  // Dense Milky Way Galaxy Band for ⭐ 별멍 Mode
  const mwGeo = new THREE.BufferGeometry();
  const mwCount = 1200;
  const mwPos = new Float32Array(mwCount * 3);
  for (let i = 0; i < mwCount; i++) {
    const along = (Math.random() - 0.5) * 95;
    const spread = (Math.random() - 0.5) * 16;
    mwPos[i * 3] = along;
    mwPos[i * 3 + 1] = 28 + Math.random() * 22 - Math.abs(along) * 0.15;
    mwPos[i * 3 + 2] = spread - 12;
  }
  mwGeo.setAttribute('position', new THREE.BufferAttribute(mwPos, 3));
  const mwMat = new THREE.PointsMaterial({ color: 0xa7c7ff, size: 0.45, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending });
  milkyWayPoints = new THREE.Points(mwGeo, mwMat);
  scene.add(milkyWayPoints);

  build3DSeatsAndCampers();
}

function build3DSeatsAndCampers() {
  seatClickTargets.length = 0;

  const benchGeo = new THREE.CylinderGeometry(0.28, 0.28, 1.25, 14);
  benchGeo.rotateZ(Math.PI / 2);

  for (const seat of seats) {
    const group = new THREE.Group();
    group.position.set(seat.x, 0, seat.z);
    group.lookAt(0, 0, 0);

    const benchMat = new THREE.MeshStandardMaterial({ color: 0x563723, roughness: 0.88 });
    const bench = new THREE.Mesh(benchGeo, benchMat);
    bench.position.y = 0.28;
    bench.castShadow = true;
    bench.receiveShadow = true;
    bench.userData = { seatIndex: seat.index };
    group.add(bench);
    seatClickTargets.push(bench);

    // 3D Cute Camper Character Group
    const camper = new THREE.Group();
    camper.position.set(seat.x, 0.48, seat.z);
    camper.lookAt(0, 0.48, 0);

    // Cute Feet
    const footGeo = new THREE.SphereGeometry(0.11, 10, 10);
    const footMat = new THREE.MeshStandardMaterial({ color: 0x3b281e });
    const leftFoot = new THREE.Mesh(footGeo, footMat);
    leftFoot.position.set(-0.16, 0.0, 0.05);
    const rightFoot = new THREE.Mesh(footGeo, footMat);
    rightFoot.position.set(0.16, 0.0, 0.05);
    camper.add(leftFoot, rightFoot);

    // Cozy Blanket / Torso Cone
    const bodyGeo = new THREE.ConeGeometry(0.45, 1.0, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(seat.color), roughness: 0.75 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.45;
    body.castShadow = true;
    body.receiveShadow = true;
    body.userData = { seatIndex: seat.index };
    camper.add(body);
    seatClickTargets.push(body);

    // Head Sphere
    const headGeo = new THREE.SphereGeometry(0.3, 20, 20);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffdfc4, roughness: 0.55 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.05;
    head.castShadow = true;
    head.userData = { seatIndex: seat.index };
    camper.add(head);
    seatClickTargets.push(head);

    // Cute Knit Beanie Dome + Pom-pom
    const hatGeo = new THREE.SphereGeometry(0.315, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.58);
    const hatMat = new THREE.MeshStandardMaterial({ color: seat.isMe ? 0xff7b29 : 0x3b4d6b, roughness: 0.85 });
    const hat = new THREE.Mesh(hatGeo, hatMat);
    hat.position.y = 1.07;
    hat.rotation.x = -0.12;
    camper.add(hat);

    const pomGeo = new THREE.SphereGeometry(0.09, 12, 12);
    const pom = new THREE.Mesh(pomGeo, hatMat);
    pom.position.set(0, 1.39, -0.05);
    camper.add(pom);

    // Calm Eyes
    const eyeGeo = new THREE.BoxGeometry(0.06, 0.02, 0.02);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x2b1911 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.1, 1.03, 0.28);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.1, 1.03, 0.28);
    camper.add(leftEye, rightEye);

    // Props Container
    const propsGroup = new THREE.Group();
    camper.add(propsGroup);

    const armGeo = new THREE.CylinderGeometry(0.065, 0.08, 0.58, 10);
    armGeo.rotateX(Math.PI / 2);
    const handGeo = new THREE.SphereGeometry(0.115, 14, 14);
    const warmHandMat = new THREE.MeshStandardMaterial({
      color: 0xffdfc4,
      emissive: 0xff6a1a,
      emissiveIntensity: 0.35,
      roughness: 0.5
    });

    // 1. Outstretched Arms + Warm Hands (손 녹이기 / 물결·밤하늘 바라보기)
    const handsProp = new THREE.Group();
    const lArm = new THREE.Mesh(armGeo, bodyMat);
    lArm.position.set(-0.22, 0.62, 0.35);
    lArm.rotation.y = -0.18;
    const rArm = new THREE.Mesh(armGeo, bodyMat);
    rArm.position.set(0.22, 0.62, 0.35);
    rArm.rotation.y = 0.18;
    const lHand = new THREE.Mesh(handGeo, warmHandMat);
    lHand.position.set(-0.16, 0.66, 0.68);
    lHand.scale.set(0.85, 1.15, 0.65);
    const rHand = new THREE.Mesh(handGeo, warmHandMat);
    rHand.position.set(0.16, 0.66, 0.68);
    rHand.scale.set(0.85, 1.15, 0.65);
    handsProp.add(lArm, rArm, lHand, rHand);
    propsGroup.add(handsProp);

    // 2. Waving Hand Prop (👋 인사하기)
    const waveProp = new THREE.Group();
    const waveArm = new THREE.Mesh(armGeo, bodyMat);
    waveArm.position.set(0.32, 0.95, 0.2);
    waveArm.rotation.x = -Math.PI / 3;
    const waveHand = new THREE.Mesh(handGeo, warmHandMat);
    waveHand.position.set(0.38, 1.25, 0.32);
    waveProp.add(waveArm, waveHand);
    waveProp.visible = false;
    propsGroup.add(waveProp);

    // 3. Stainless Thermos Bottle + Steaming Coffee Mug Prop (☕ 보온병 커피)
    const thermosProp = new THREE.Group();
    const bottleGeo = new THREE.CylinderGeometry(0.085, 0.09, 0.42, 14);
    const bottleMat = new THREE.MeshStandardMaterial({ color: 0x3d5a6c, metalness: 0.6, roughness: 0.3 });
    const bottle = new THREE.Mesh(bottleGeo, bottleMat);
    bottle.position.set(-0.18, 0.72, 0.52);
    bottle.rotation.z = -0.35; // Tilted pouring pose
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.075, 0.08, 12), new THREE.MeshStandardMaterial({ color: 0xd94e34 }));
    cap.position.set(-0.11, 0.92, 0.52);
    cap.rotation.z = -0.35;

    const mugGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.21, 14);
    const mugMat = new THREE.MeshStandardMaterial({ color: 0xf5efe6, roughness: 0.35 });
    const mug = new THREE.Mesh(mugGeo, mugMat);
    mug.position.set(0.14, 0.68, 0.54);
    thermosProp.add(lArm.clone(), rArm.clone(), bottle, cap, mug);
    propsGroup.add(thermosProp);

    // 4. Brass Stargazing Telescope on Tripod Prop (🔭 망원경으로 별보기)
    const telescopeProp = new THREE.Group();
    const tubeGeo = new THREE.CylinderGeometry(0.065, 0.095, 0.95, 16);
    tubeGeo.rotateX(Math.PI / 2);
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xe6b85c, metalness: 0.7, roughness: 0.25 });
    const scopeTube = new THREE.Mesh(tubeGeo, brassMat);
    scopeTube.position.set(0, 1.05, 0.72);
    scopeTube.rotation.x = -0.48; // Tilted up at the starry sky!

    const legGeo = new THREE.CylinderGeometry(0.02, 0.015, 0.95, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x4a321f });
    for (let l = -1; l <= 1; l++) {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(l * 0.18, 0.45, 0.68 + (l === 0 ? 0.18 : 0));
      leg.rotation.z = l * 0.22;
      leg.rotation.x = l === 0 ? -0.22 : 0.12;
      telescopeProp.add(leg);
    }
    telescopeProp.add(scopeTube);
    propsGroup.add(telescopeProp);

    // 5. Sparkler (🎇 불꽃놀이) Prop
    const sparklerProp = new THREE.Group();
    const sparkStickGeo = new THREE.CylinderGeometry(0.016, 0.016, 1.1, 8);
    sparkStickGeo.rotateX(Math.PI / 2);
    const sparkStick = new THREE.Mesh(sparkStickGeo, new THREE.MeshBasicMaterial({ color: 0xb0b0b0 }));
    sparkStick.position.set(0.14, 0.68, 0.82);

    const sparkTipGeo = new THREE.OctahedronGeometry(0.19, 1);
    const sparkTipMat = new THREE.MeshBasicMaterial({ color: 0xffe57f, wireframe: true });
    const sparkTip = new THREE.Mesh(sparkTipGeo, sparkTipMat);
    sparkTip.position.set(0.14, 0.68, 1.38);
    sparklerProp.add(rArm.clone(), sparkStick, sparkTip);
    propsGroup.add(sparklerProp);

    // 6. Roast Marshmallow Prop (🍡 마시멜로)
    const roastProp = new THREE.Group();
    const roastStickGeo = new THREE.CylinderGeometry(0.02, 0.024, 1.65, 8);
    roastStickGeo.rotateX(Math.PI / 2);
    const roastStick = new THREE.Mesh(roastStickGeo, new THREE.MeshStandardMaterial({ color: 0x8d6239 }));
    roastStick.position.set(0.0, 0.64, 1.05);

    const mallowGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.24, 16);
    mallowGeo.rotateX(Math.PI / 2);
    const mallowMat = new THREE.MeshStandardMaterial({
      color: 0xfffaf2,
      emissive: 0xff7711,
      emissiveIntensity: 0.18,
      roughness: 0.45
    });
    const mallow = new THREE.Mesh(mallowGeo, mallowMat);
    mallow.position.set(0.0, 0.64, 1.88);
    roastProp.add(lArm.clone(), rArm.clone(), roastStick, mallow);
    propsGroup.add(roastProp);

    camper.userData = {
      bodyMat,
      hatMat,
      head,
      leftFoot,
      rightFoot,
      handsProp,
      lHand,
      rHand,
      waveProp,
      waveHand,
      thermosProp,
      telescopeProp,
      sparklerProp,
      sparkTip,
      roastProp,
      mallowMat
    };

    scene.add(group);
    scene.add(camper);

    seat.meshGroup = group;
    seat.camperGroup = camper;
    seat.benchMat = benchMat;
  }

  sync3DCamperMeshes();
}

function sync3DCamperMeshes() {
  for (const seat of seats) {
    if (!seat.camperGroup) continue;
    seat.camperGroup.visible = seat.occupied;
    seat.benchMat.color.setHex(seat.isMe ? 0x85522d : 0x523522);

    if (seat.occupied) {
      const ud = seat.camperGroup.userData;
      ud.bodyMat.color.set(seat.color);
      ud.hatMat.color.setHex(seat.isMe ? 0xff7b29 : 0x3b4d6b);

      const act = seat.isMe ? state.myAction : seat.action;
      ud.handsProp.visible = act === 'hands';
      ud.thermosProp.visible = act === 'thermos' || act === 'coffee';
      ud.telescopeProp.visible = act === 'telescope';
      ud.sparklerProp.visible = act === 'sparkler';
      ud.roastProp.visible = act === 'roast';

      seat.labelEl.style.display = 'block';
      seat.labelEl.className = `camper-label-3d ${seat.isMe ? 'is-me' : ''}`;
      seat.labelEl.textContent = seat.isMe ? `나 · ${seat.name}` : seat.name;

      if (!seat.isMe || !state.isWalking) {
        seat.camperGroup.position.x = seat.x;
        seat.camperGroup.position.z = seat.z;
        seat.camperGroup.lookAt(0, seat.camperGroup.position.y, 0);
      }
    } else {
      seat.labelEl.style.display = 'none';
    }
  }
}

function applyRoom3DTheme() {
  const cfg = ROOM_CONFIGS[state.room];
  const concept = cfg.concept;

  scene.fog.color.setHex(cfg.fogColor);
  renderer.setClearColor(cfg.fogColor);
  if (groundMesh) groundMesh.material.color.setHex(cfg.groundColor);
  if (scene.userData.leavesMat) scene.userData.leavesMat.color.setHex(cfg.treeColor);
  if (tarpMesh) tarpMesh.visible = cfg.theme === 'rain';

  // Toggle 3D Centerpieces for 불멍 / 물멍 / 별멍
  fireCenterGroup.visible = concept === 'fire';
  waterCenterGroup.visible = concept === 'water';
  starCenterGroup.visible = concept === 'star';
  if (milkyWayPoints) milkyWayPoints.visible = concept === 'star';

  // Automatically equip Telescope when entering 별멍 mode!
  if (concept === 'star' && state.myAction === 'hands') {
    setPoseAction('telescope');
  } else if (concept !== 'star' && state.myAction === 'telescope') {
    setPoseAction('hands');
  }
}

// ==========================================
// 6. 3D PARTICLES, LANTERNS, SHOOTING STARS & GIFTS
// ==========================================
const flameMeshes = [];
const emberMeshes = [];
const flyingLogs3D = [];
const sharedItems3D = [];
const fireworks3D = [];
const burningNotes3D = [];
const weatherMeshes = [];

function init3DParticles() {
  const flameGeo = new THREE.OctahedronGeometry(0.42, 1);
  for (let i = 0; i < 38; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff8822,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const m = new THREE.Mesh(flameGeo, mat);
    resetFlameMesh(m, true);
    scene.add(m);
    flameMeshes.push(m);
  }

  const emberGeo = new THREE.SphereGeometry(0.048, 6, 6);
  for (let i = 0; i < 45; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffbb55,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const m = new THREE.Mesh(emberGeo, mat);
    resetEmberMesh(m, true);
    scene.add(m);
    emberMeshes.push(m);
  }

  const wGeo = new THREE.SphereGeometry(0.06, 6, 6);
  const wMat = new THREE.MeshBasicMaterial({ color: 0xdceeff, transparent: true, opacity: 0.65 });
  for (let i = 0; i < 120; i++) {
    const m = new THREE.Mesh(wGeo, wMat);
    m.position.set((Math.random() - 0.5) * 26, Math.random() * 14, (Math.random() - 0.5) * 26);
    m.userData = { speedY: 1.5 + Math.random() * 2.0, phase: Math.random() * Math.PI * 2 };
    scene.add(m);
    weatherMeshes.push(m);
  }
}

function resetFlameMesh(mesh, randomStart = false) {
  const heatScale = Math.min(1.65, Math.max(0.75, state.fireHeat / 680));
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.random() * 0.62 * heatScale;
  mesh.position.set(Math.cos(angle) * radius, randomStart ? Math.random() * 1.8 : 0.28, Math.sin(angle) * radius);
  mesh.userData = {
    life: randomStart ? Math.random() : 0,
    speed: (0.75 + Math.random() * 0.65) * heatScale,
    swayPhase: Math.random() * Math.PI * 2,
    baseScale: (0.65 + Math.random() * 0.75) * heatScale
  };
}

function resetEmberMesh(mesh, randomStart = false) {
  const concept = getCurrentConcept();
  const maxR = concept === 'water' ? 3.2 : 0.85;
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.random() * maxR;
  mesh.position.set(
    Math.cos(angle) * radius,
    randomStart ? Math.random() * 6.5 : 0.35,
    Math.sin(angle) * radius
  );
  mesh.userData = {
    life: randomStart ? Math.random() : 0,
    speedY: concept === 'water' ? (0.3 + Math.random() * 0.5) : (1.1 + Math.random() * 1.8),
    driftX: (Math.random() - 0.5) * 0.8,
    driftZ: (Math.random() - 0.5) * 0.8,
    phase: Math.random() * Math.PI * 2
  };
}

function spawn3DFlyingLog(fromSeatIndex) {
  const seat = seats[fromSeatIndex] || seats[state.mySeatIndex];
  const startX = (seat.isMe && state.isWalking) ? state.walkPos.x : seat.x;
  const startZ = (seat.isMe && state.isWalking) ? state.walkPos.z : seat.z;

  const logGeo = new THREE.CylinderGeometry(0.13, 0.14, 0.85, 10);
  const logMat = new THREE.MeshStandardMaterial({ color: 0x6b3e23, roughness: 0.85 });
  const mesh = new THREE.Mesh(logGeo, logMat);
  mesh.castShadow = true;
  scene.add(mesh);

  flyingLogs3D.push({ mesh, startX, startZ, progress: 0 });
}

// 💧 물멍: Spawn a glowing Lotus Wish Lantern floating on the pond!
function spawn3DFloatingLantern(fromSeatIndex) {
  const seat = seats[fromSeatIndex] || seats[state.mySeatIndex];
  audio.playWaterDrop(0.25);

  const lanternGroup = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.16, 0.08, 12),
    new THREE.MeshStandardMaterial({ color: 0xff8a9e })
  );
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xffe49e })
  );
  core.position.y = 0.09;
  lanternGroup.add(base, core);

  const startAngle = seat.angle;
  lanternGroup.position.set(Math.sin(startAngle) * 2.1, 0.06, Math.cos(startAngle) * 2.1);
  waterCenterGroup.add(lanternGroup);

  floatingLanterns.push({
    mesh: lanternGroup,
    angle: startAngle,
    radius: 2.1,
    life: 0
  });
}

// ⭐ 별멍: Spawn a dazzling 3D Shooting Star across the night sky!
function spawn3DShootingStar() {
  audio.playStarChime(0.18);
  const trailGeo = new THREE.CylinderGeometry(0.01, 0.12, 3.8, 8);
  trailGeo.rotateZ(Math.PI / 2);
  const trailMat = new THREE.MeshBasicMaterial({
    color: 0xd8f0ff,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending
  });
  const mesh = new THREE.Mesh(trailGeo, trailMat);
  const startX = -18 + Math.random() * 12;
  const startY = 14 + Math.random() * 8;
  const startZ = -16 - Math.random() * 10;
  mesh.position.set(startX, startY, startZ);
  mesh.rotation.z = -0.35;
  scene.add(mesh);

  shootingStars.push({
    mesh,
    vx: 22 + Math.random() * 8,
    vy: -8 - Math.random() * 4,
    vz: 6 + Math.random() * 4,
    progress: 0
  });
}

// Share Marshmallow OR Thermos Coffee Mug with another camper!
function spawn3DSharedItem(fromSeatIndex, targetSeatIndex, itemType = 'mallow') {
  const fromSeat = seats[fromSeatIndex] || seats[state.mySeatIndex];
  let toSeat = seats[targetSeatIndex];
  if (!toSeat) {
    const others = seats.filter(s => s.occupied && s.index !== fromSeatIndex);
    toSeat = others.length > 0 ? others[Math.floor(Math.random() * others.length)] : seats[(fromSeatIndex + 6) % SEAT_COUNT];
  }

  let mesh;
  if (itemType === 'coffee') {
    const cupGroup = new THREE.Group();
    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.09, 0.24, 14),
      new THREE.MeshStandardMaterial({ color: 0xf5efe6 })
    );
    const coffeeTop = new THREE.Mesh(
      new THREE.CircleGeometry(0.095, 12),
      new THREE.MeshBasicMaterial({ color: 0x4a2c18 })
    );
    coffeeTop.rotation.x = -Math.PI / 2;
    coffeeTop.position.y = 0.121;
    cupGroup.add(cup, coffeeTop);
    mesh = cupGroup;
  } else {
    mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.25, 14),
      new THREE.MeshStandardMaterial({ color: 0xe89b48, emissive: 0xff7711, emissiveIntensity: 0.35 })
    );
  }
  scene.add(mesh);

  sharedItems3D.push({
    mesh,
    itemType,
    startX: fromSeat.x,
    startZ: fromSeat.z,
    endX: toSeat.x,
    endZ: toSeat.z,
    targetIndex: toSeat.index,
    progress: 0
  });
}

function launch3DFirework(fromSeatIndex) {
  const seat = seats[fromSeatIndex] || seats[state.mySeatIndex];
  audio.playFireworkPop();

  const colors = [0xffcf56, 0xff6b6b, 0x48dbfb, 0xff9ff3, 0x1dd1a1];
  const burstColor = colors[Math.floor(Math.random() * colors.length)];

  const rocketGeo = new THREE.SphereGeometry(0.09, 8, 8);
  const rocketMat = new THREE.MeshBasicMaterial({ color: burstColor });
  const rocket = new THREE.Mesh(rocketGeo, rocketMat);
  rocket.position.set(seat.x * 0.4, 0.8, seat.z * 0.4);
  scene.add(rocket);

  fireworks3D.push({
    phase: 'launch',
    rocket,
    targetX: (Math.random() - 0.5) * 4.5,
    targetY: 5.8 + Math.random() * 2.2,
    targetZ: (Math.random() - 0.5) * 4.5,
    color: burstColor,
    progress: 0,
    sparks: []
  });
}

function spawn3DBurningNote(text) {
  const el = document.createElement('div');
  el.className = 'burning-note-3d';
  el.textContent = text.length > 26 ? text.slice(0, 26) + '…' : text;
  labelsContainer.appendChild(el);

  burningNotes3D.push({
    el,
    progress: 0,
    pos: new THREE.Vector3(0, 0.9, 0)
  });
}

function focusCameraOnSeat(seatIndex) {
  const seat = seats[seatIndex];
  if (!seat) return;
  state.targetCamYaw = seat.angle + 0.32;
}

// ==========================================
// 7. MAIN 3D ANIMATION & RENDERING LOOP
// ==========================================
let lastTime = performance.now();
const tempVec = new THREE.Vector3();

function animate3D(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  const time = now * 0.001;
  const concept = getCurrentConcept();

  // Smoothly interpolate 3D Orbit Camera
  state.camYaw += (state.targetCamYaw - state.camYaw) * 0.08;
  state.camPitch += (state.targetCamPitch - state.camPitch) * 0.08;
  state.camDist += (state.targetCamDist - state.camDist) * 0.08;

  const camX = Math.sin(state.camYaw) * Math.cos(state.camPitch) * state.camDist;
  const camY = Math.sin(state.camPitch) * state.camDist;
  const camZ = Math.cos(state.camYaw) * Math.cos(state.camPitch) * state.camDist;
  camera.position.set(camX, camY, camZ);
  camera.lookAt(0, concept === 'star' ? 1.45 : 0.85, 0);

  if (state.fireHeat > 650) {
    state.fireHeat = Math.max(650, state.fireHeat - dt * 5);
  }
  if (state.auroraTimer > 0) {
    state.auroraTimer = Math.max(0, state.auroraTimer - dt);
  }
  if (state.sparklerLitTimer > 0) {
    state.sparklerLitTimer = Math.max(0, state.sparklerLitTimer - dt);
  }

  const isAurora = state.auroraTimer > 0;
  const heatRatio = Math.min(1.6, state.fireHeat / 680);

  // Concept-aware Center Lighting
  if (concept === 'fire') {
    const flicker = Math.sin(time * 11) * 0.35 + Math.cos(time * 17) * 0.25;
    centerLight.intensity = (4.2 + flicker) * heatRatio;
    centerLight.color.setHex(isAurora ? 0x2ce8c6 : 0xff7b29);
    centerFillLight.color.setHex(isAurora ? 0x7c4dff : 0xff4d12);
  } else if (concept === 'water') {
    centerLight.intensity = 3.2 + Math.sin(time * 3) * 0.3;
    centerLight.color.setHex(isAurora ? 0x64ffda : 0x38b6ff);
    centerFillLight.color.setHex(0x1a759f);
  } else {
    // Star mode
    centerLight.intensity = 2.6 + Math.sin(time * 2.5) * 0.25;
    centerLight.color.setHex(0x9bb8ff);
    centerFillLight.color.setHex(0x5e60ce);
  }

  // Update 3D Volumetric Flames (Only visible in 불멍 mode)
  for (const m of flameMeshes) {
    m.visible = concept === 'fire';
    if (!m.visible) continue;

    const ud = m.userData;
    ud.life += dt * ud.speed;
    if (ud.life >= 1) {
      resetFlameMesh(m, false);
      continue;
    }

    const t = ud.life;
    m.position.y = 0.28 + t * 2.35 * heatRatio;
    m.position.x += Math.sin(time * 7 + ud.swayPhase) * 0.008;
    m.position.z += Math.cos(time * 6 + ud.swayPhase) * 0.008;
    m.rotation.y += dt * 3;

    const scale = ud.baseScale * Math.sin(t * Math.PI);
    m.scale.set(scale * 0.85, scale * 1.35, scale * 0.85);
    m.material.opacity = (1 - t) * 0.78;

    if (isAurora) {
      if (t < 0.35) m.material.color.setHex(0xd6fff6);
      else if (t < 0.7) m.material.color.setHex(0x2ce8c6);
      else m.material.color.setHex(0x8844ff);
    } else {
      if (t < 0.3) m.material.color.setHex(0xfff3b8);
      else if (t < 0.68) m.material.color.setHex(0xff7b22);
      else m.material.color.setHex(0xd92609);
    }
  }

  // Update 💧 물멍 Water Ripples & Floating Wish Lanterns
  if (concept === 'water') {
    for (const rip of waterRipples) {
      rip.userData.progress += dt * 0.38;
      if (rip.userData.progress >= 1) {
        rip.userData.progress = 0;
        rip.position.set((Math.random() - 0.5) * 1.5, 0.045, (Math.random() - 0.5) * 1.5);
      }
      const p = rip.userData.progress;
      rip.scale.setScalar(1 + p * 7.5);
      rip.material.opacity = (1 - p) * 0.55;
    }

    for (let i = floatingLanterns.length - 1; i >= 0; i--) {
      const fl = floatingLanterns[i];
      fl.life += dt * 0.08;
      fl.angle += dt * 0.35;
      fl.radius = Math.max(0.35, fl.radius - dt * 0.18);
      fl.mesh.position.set(
        Math.sin(fl.angle) * fl.radius,
        0.06 + Math.sin(time * 3 + i) * 0.02,
        Math.cos(fl.angle) * fl.radius
      );
      if (fl.life >= 1) {
        waterCenterGroup.remove(fl.mesh);
        floatingLanterns.splice(i, 1);
      }
    }
  }

  // Update ⭐ 별멍 Astrolabe & Shooting Stars
  if (concept === 'star' && starCenterGroup.userData.astroRing1) {
    starCenterGroup.userData.astroRing1.rotation.x = time * 0.6;
    starCenterGroup.userData.astroRing1.rotation.y = time * 0.4;
    starCenterGroup.userData.astroRing2.rotation.y = -time * 0.7;
    starCenterGroup.userData.astroRing2.rotation.z = time * 0.5;
    starCenterGroup.userData.starCore.rotation.y = time * 1.2;
  }

  for (let i = shootingStars.length - 1; i >= 0; i--) {
    const ss = shootingStars[i];
    ss.progress += dt * 1.2;
    ss.mesh.position.x += ss.vx * dt;
    ss.mesh.position.y += ss.vy * dt;
    ss.mesh.position.z += ss.vz * dt;
    ss.mesh.material.opacity = Math.max(0, 1 - ss.progress);
    if (ss.progress >= 1) {
      scene.remove(ss.mesh);
      shootingStars.splice(i, 1);
    }
  }

  // Update 3D Embers / Fireflies (반딧불이 in Water/Star mode)
  for (const e of emberMeshes) {
    const ud = e.userData;
    ud.life += dt * (concept === 'fire' ? 0.32 : 0.18);
    if (ud.life >= 1) {
      resetEmberMesh(e, false);
      continue;
    }
    e.position.y += ud.speedY * dt;
    e.position.x += (ud.driftX + Math.sin(time * 3 + ud.phase) * 0.5) * dt;
    e.position.z += (ud.driftZ + Math.cos(time * 3 + ud.phase) * 0.5) * dt;
    e.material.opacity = (1 - ud.life) * 0.9;
    if (concept === 'water') {
      e.material.color.setHex(0xa8ff78); // Glowing green-gold fireflies over pond
    } else if (concept === 'star') {
      e.material.color.setHex(0x82b1ff); // Starlight dust
    } else {
      e.material.color.setHex(isAurora ? 0x64ffda : 0xffbb44);
    }
  }

  // Update Flying 3D Logs
  for (let i = flyingLogs3D.length - 1; i >= 0; i--) {
    const fl = flyingLogs3D[i];
    fl.progress += dt * 1.9;
    if (fl.progress >= 1) {
      scene.remove(fl.mesh);
      flyingLogs3D.splice(i, 1);
      state.fireHeat = Math.min(1200, state.fireHeat + 38);
      audio.playWhoosh();
      continue;
    }
    const t = fl.progress;
    fl.mesh.position.set(
      fl.startX * (1 - t),
      0.8 + Math.sin(t * Math.PI) * 2.5,
      fl.startZ * (1 - t)
    );
    fl.mesh.rotation.x += dt * 7;
    fl.mesh.rotation.z += dt * 5;
  }

  // Update Flying Shared Items (Marshmallows & Thermos Coffee Mugs!)
  for (let i = sharedItems3D.length - 1; i >= 0; i--) {
    const si = sharedItems3D[i];
    si.progress += dt * 1.35;
    if (si.progress >= 1) {
      scene.remove(si.mesh);
      sharedItems3D.splice(i, 1);
      showSeatBubble(si.targetIndex, si.itemType === 'coffee' ? '☕😊' : '🍡😋');
      continue;
    }
    const t = si.progress;
    si.mesh.position.set(
      si.startX + (si.endX - si.startX) * t,
      1.1 + Math.sin(t * Math.PI) * 2.1,
      si.startZ + (si.endZ - si.startZ) * t
    );
    si.mesh.rotation.y += dt * 5;
  }

  // Update 3D Sky Fireworks
  for (let i = fireworks3D.length - 1; i >= 0; i--) {
    const fw = fireworks3D[i];
    if (fw.phase === 'launch') {
      fw.progress += dt * 2.1;
      const t = Math.min(1, fw.progress);
      fw.rocket.position.x += (fw.targetX - fw.rocket.position.x) * 0.1;
      fw.rocket.position.y = 0.8 + t * (fw.targetY - 0.8);
      fw.rocket.position.z += (fw.targetZ - fw.rocket.position.z) * 0.1;

      if (fw.progress >= 1) {
        scene.remove(fw.rocket);
        fw.phase = 'burst';
        fw.progress = 0;
        const sparkGeo = new THREE.SphereGeometry(0.075, 6, 6);
        for (let s = 0; s < 32; s++) {
          const sMat = new THREE.MeshBasicMaterial({
            color: fw.color,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending
          });
          const sp = new THREE.Mesh(sparkGeo, sMat);
          sp.position.set(fw.targetX, fw.targetY, fw.targetZ);
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI;
          const speed = 1.8 + Math.random() * 2.6;
          sp.userData = {
            vx: Math.sin(phi) * Math.cos(theta) * speed,
            vy: Math.cos(phi) * speed,
            vz: Math.sin(phi) * Math.sin(theta) * speed
          };
          scene.add(sp);
          fw.sparks.push(sp);
        }
      }
    } else {
      fw.progress += dt * 0.85;
      for (const sp of fw.sparks) {
        sp.position.x += sp.userData.vx * dt;
        sp.position.y += sp.userData.vy * dt;
        sp.position.z += sp.userData.vz * dt;
        sp.userData.vy -= 2.4 * dt;
        sp.material.opacity = Math.max(0, 1 - fw.progress);
      }
      if (fw.progress >= 1) {
        for (const sp of fw.sparks) scene.remove(sp);
        fireworks3D.splice(i, 1);
      }
    }
  }

  // Update 3D Burning Worry / Wish Notes
  for (let i = burningNotes3D.length - 1; i >= 0; i--) {
    const bn = burningNotes3D[i];
    bn.progress += dt * 0.32;
    if (bn.progress >= 1) {
      bn.el.remove();
      burningNotes3D.splice(i, 1);
      continue;
    }
    bn.pos.y = 0.9 + bn.progress * 3.8;
    bn.pos.x = Math.sin(bn.progress * 8) * 0.4;
    tempVec.copy(bn.pos).project(camera);
    const sx = (tempVec.x * 0.5 + 0.5) * window.innerWidth;
    const sy = (-tempVec.y * 0.5 + 0.5) * window.innerHeight;
    bn.el.style.transform = `translate(-50%, -50%) translate3d(${sx}px, ${sy}px, 0) scale(${1 - bn.progress * 0.35})`;
    bn.el.style.opacity = String(1 - bn.progress);
  }

  // Update Rain Weather
  const cfg = ROOM_CONFIGS[state.room];
  const showRain = cfg.theme === 'rain';
  for (const w of weatherMeshes) {
    w.visible = showRain;
    if (!showRain) continue;
    w.scale.set(0.3, 4.5, 0.3);
    w.position.y -= w.userData.speedY * 5.5 * dt;
    if (w.position.y < 0.2) {
      w.position.y = 13;
      w.position.x = (Math.random() - 0.5) * 26;
      w.position.z = (Math.random() - 0.5) * 26;
    }
  }

  if (walkTargetRing && walkTargetRing.material.opacity > 0) {
    walkTargetRing.material.opacity = Math.max(0, walkTargetRing.material.opacity - dt * 0.9);
    walkTargetRing.scale.setScalar(1 + (1 - walkTargetRing.material.opacity) * 0.6);
  }

  // Update Campers (Walking, Leaning, Waving, Telescope Stargazing, Toasting)
  for (const seat of seats) {
    if (!seat.occupied || !seat.camperGroup) continue;
    const camper = seat.camperGroup;
    const ud = camper.userData;
    const act = seat.isMe ? state.myAction : seat.action;
    const isWavingNow = now < (seat.waveUntil || 0);

    ud.waveProp.visible = isWavingNow;
    if (isWavingNow) {
      ud.waveHand.position.x = 0.38 + Math.sin(time * 16) * 0.12;
    }

    if (seat.isMe && state.isWalking) {
      const dx = state.walkTarget.x - state.walkPos.x;
      const dz = state.walkTarget.z - state.walkPos.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 0.08) {
        const moveStep = Math.min(dist, dt * 3.4);
        state.walkPos.x += (dx / dist) * moveStep;
        state.walkPos.z += (dz / dist) * moveStep;
        camper.position.x = state.walkPos.x;
        camper.position.z = state.walkPos.z;

        camper.lookAt(state.walkTarget.x, camper.position.y, state.walkTarget.z);
        camper.position.y = 0.42 + Math.abs(Math.sin(time * 11)) * 0.14;
        ud.leftFoot.position.z = Math.sin(time * 11) * 0.14;
        ud.rightFoot.position.z = -Math.sin(time * 11) * 0.14;
      } else {
        camper.position.x = state.walkPos.x;
        camper.position.z = state.walkPos.z;
        camper.position.y = 0.42 + Math.sin(time * 2.5) * 0.03;
        camper.lookAt(0, camper.position.y, 0);
        ud.leftFoot.position.z = 0.05;
        ud.rightFoot.position.z = 0.05;
      }
    } else {
      const bob = Math.sin(time * 2.4 + seat.bobPhase) * 0.032;
      camper.position.y = 0.48 + bob;
      ud.leftFoot.position.z = 0.05;
      ud.rightFoot.position.z = 0.05;

      const isLeaning = (act === 'hands' && concept === 'fire') || act === 'roast' || (seat.isMe && state.sparklerLitTimer > 0);
      const leanFactor = isLeaning ? 0.34 : 0.0;
      camper.position.x = seat.x * (1 - leanFactor * 0.12);
      camper.position.z = seat.z * (1 - leanFactor * 0.12);

      // Look slightly up when stargazing or using telescope!
      const lookY = (act === 'telescope' || concept === 'star') ? (camper.position.y + 0.35) : (camper.position.y - (isLeaning ? 0.25 : 0));
      camper.lookAt(0, lookY, 0);
    }

    if (ud.handsProp.visible) {
      ud.lHand.position.y = 0.66 + Math.sin(time * 5.5 + seat.bobPhase) * 0.045;
      ud.rHand.position.y = 0.66 - Math.sin(time * 5.5 + seat.bobPhase) * 0.045;
    }

    if (ud.roastProp.visible && seat.isMe) {
      state.roastProgress = Math.min(1, state.roastProgress + dt * 0.08);
      const col = new THREE.Color(0xfffaf2).lerp(new THREE.Color(0xd97724), state.roastProgress);
      ud.mallowMat.color.copy(col);
    }

    if (ud.sparkTip && ud.sparklerProp.visible) {
      ud.sparkTip.rotation.z += dt * 14;
      ud.sparkTip.rotation.x += dt * 11;
      ud.sparkTip.scale.setScalar(0.85 + Math.sin(time * 22) * 0.35);
    }

    tempVec.set(camper.position.x, camper.position.y + 1.78, camper.position.z);
    tempVec.project(camera);

    if (tempVec.z > 1) {
      seat.labelEl.style.opacity = '0';
    } else {
      const sx = (tempVec.x * 0.5 + 0.5) * window.innerWidth;
      const sy = (-tempVec.y * 0.5 + 0.5) * window.innerHeight;
      seat.labelEl.style.opacity = '1';
      seat.labelEl.style.transform = `translate(-50%, -100%) translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0)`;
    }
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate3D);
}

// ==========================================
// 8. UI & 3D RAYCASTING INTERACTIONS
// ==========================================
const raycaster = new THREE.Raycaster();
const mouseNDC = new THREE.Vector2();

function showToast(msg) {
  const toast = document.getElementById('ritualToast');
  const text = document.getElementById('ritualToastText');
  text.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.add('hidden'), 3200);
}

function setPoseAction(actName, labelMsg) {
  state.myAction = actName;
  if (actName === 'roast') state.roastProgress = 0;
  const mySeat = seats[state.mySeatIndex];
  if (mySeat) mySeat.action = actName;
  sync3DCamperMeshes();

  document.querySelectorAll('.action-btn[data-action]').forEach(btn => {
    btn.classList.toggle('active-pose', btn.dataset.action === actName);
  });

  sendServerAction({ type: 'pose', action: actName });
  if (labelMsg) showToast(labelMsg);
}

function switchRoomConcept(roomKey) {
  syncUrlParams(roomKey);
  applyRoom3DTheme();
  connectMultiplayerServer();

  const cfg = ROOM_CONFIGS[state.room];
  document.getElementById('volWind').value = cfg.defaultWind;
  document.getElementById('valWind').textContent = `${cfg.defaultWind}%`;
  audio.setVolume('wind', cfg.defaultWind);

  document.getElementById('volRain').value = cfg.defaultRain;
  document.getElementById('valRain').textContent = `${cfg.defaultRain}%`;
  audio.setVolume('rain', cfg.defaultRain);

  showToast(`'${cfg.name}' 공간으로 이동했습니다.`);
}

function bindEvents() {
  document.getElementById('previewNickname').textContent = state.myName;
  document.getElementById('myNicknameDisplay').textContent = state.myName;

  document.getElementById('rerollNameBtn').addEventListener('click', () => {
    state.myName = generatePoeticName();
    document.getElementById('previewNickname').textContent = state.myName;
    document.getElementById('myNicknameDisplay').textContent = state.myName;
    if (seats[state.mySeatIndex]) seats[state.mySeatIndex].name = state.myName;
    sync3DCamperMeshes();
    sendServerAction({ type: 'name', name: state.myName });
  });

  document.getElementById('enterCampBtn').addEventListener('click', () => {
    state.entered = true;
    audio.init();
    connectMultiplayerServer();
    document.getElementById('entryOverlay').classList.add('hidden');
    document.getElementById('topBar').classList.remove('hidden');
    document.getElementById('bottomDock').classList.remove('hidden');
    focusCameraOnSeat(state.mySeatIndex);
    showToast(`'${state.myName}'님, 쉼터에 자리를 잡았습니다.`);
  });

  // Top & Bottom Quick Concept Switchers (불멍 / 물멍 / 별멍)
  document.querySelectorAll('.concept-tab').forEach(btn => {
    btn.addEventListener('click', () => switchRoomConcept(btn.dataset.room));
  });
  document.querySelectorAll('[data-switch-room]').forEach(btn => {
    btn.addEventListener('click', () => switchRoomConcept(btn.dataset.switchRoom));
  });

  // 1. 👋 인사하기 (Wave Hand)
  document.getElementById('actWave')?.addEventListener('click', () => {
    const mySeat = seats[state.mySeatIndex];
    if (mySeat) mySeat.waveUntil = performance.now() + 2600;
    showSeatBubble(state.mySeatIndex, '👋😊');
    sendServerAction({ type: 'wave' });
    showToast('주변 사람들에게 반갑게 손인사를 건넸습니다 👋');
  });

  // 2. 🤲 손 녹이기 / 물결·밤하늘 바라보기
  document.getElementById('actHands').addEventListener('click', () => {
    const c = getCurrentConcept();
    const msg = c === 'fire'
      ? '모닥불 가까이 두 손을 내밀어 따뜻하게 녹입니다 🤲'
      : c === 'water'
        ? '달빛이 비치는 고요한 물결을 가만히 바라봅니다 💧'
        : '쏟아지는 은하수 밤하늘을 편안히 올려다봅니다 🌌';
    setPoseAction('hands', msg);
  });

  // 3. Main Concept Ritual: 🪵 장작 넣기 (불멍) / 🪷 소원 연등 띄우기 (물멍) / 🌠 별똥별 부르기 (별멍)
  document.getElementById('actMainRitual')?.addEventListener('click', () => {
    const c = getCurrentConcept();
    if (c === 'fire') {
      spawn3DFlyingLog(state.mySeatIndex);
      showSeatBubble(state.mySeatIndex, '🪵');
      sendServerAction({ type: 'throwLog' });
      showToast('장작을 하나 건네 모닥불이 더 따뜻해졌습니다 🔥');
    } else if (c === 'water') {
      spawn3DFloatingLantern(state.mySeatIndex);
      showSeatBubble(state.mySeatIndex, '🪷');
      sendServerAction({ type: 'floatLantern' });
      showToast('거울 연못 위에 따뜻한 소원 연등을 띄웠습니다 🪷');
    } else {
      spawn3DShootingStar();
      showSeatBubble(state.mySeatIndex, '🌠');
      sendServerAction({ type: 'shootingStar' });
      showToast('밤하늘을 가로지르는 반짝이는 별똥별을 불렀습니다 🌠');
    }
  });

  // 4. 🍡 마시멜로 굽기
  document.getElementById('actRoast').addEventListener('click', () => {
    setPoseAction('roast', '꼬치에 낀 마시멜로를 노릇노릇하게 굽습니다 🍡');
  });

  // 5. 🎁 마시멜로 건네기
  document.getElementById('actShareMallow')?.addEventListener('click', () => {
    const others = seats.filter(s => s.occupied && !s.isMe);
    const targetSeat = others.length > 0 ? others[Math.floor(Math.random() * others.length)] : seats[(state.mySeatIndex + 6) % SEAT_COUNT];
    spawn3DSharedItem(state.mySeatIndex, targetSeat.index, 'mallow');
    showSeatBubble(state.mySeatIndex, '🎁');
    sendServerAction({ type: 'shareMallow', targetSeat: targetSeat.index });
    showToast(`구운 마시멜로를 '${targetSeat.name || '이웃 캠퍼'}'님에게 건넸습니다 🍡`);
  });

  // 6. ☕ 보온병에서 커피 따라 건네기
  document.getElementById('actShareThermos')?.addEventListener('click', () => {
    setPoseAction('thermos');
    const others = seats.filter(s => s.occupied && !s.isMe);
    const targetSeat = others.length > 0 ? others[Math.floor(Math.random() * others.length)] : seats[(state.mySeatIndex + 6) % SEAT_COUNT];
    spawn3DSharedItem(state.mySeatIndex, targetSeat.index, 'coffee');
    showSeatBubble(state.mySeatIndex, '☕');
    sendServerAction({ type: 'shareCoffee', targetSeat: targetSeat.index });
    showToast(`보온병에서 따뜻한 커피를 따라 '${targetSeat.name || '이웃 캠퍼'}'님에게 건넸습니다 ☕`);
  });

  // 7. 🔭 망원경으로 별보기
  document.getElementById('actTelescope')?.addEventListener('click', () => {
    setPoseAction('telescope', '황동 천체 망원경으로 밤하늘의 별자리와 은하수를 관측합니다 🔭');
    if (getCurrentConcept() === 'star') spawn3DShootingStar();
  });

  // 8. 🎇 불꽃놀이
  document.getElementById('actSparkler').addEventListener('click', () => {
    state.sparklerLitTimer = 1.8;
    setPoseAction('sparkler', '불을 붙여 밤하늘로 아름다운 불꽃놀이를 쏘아 올립니다 🎇');
    launch3DFirework(state.mySeatIndex);
    sendServerAction({ type: 'firework' });
  });

  // 9. ✨ 오로라 / 반딧불이
  document.getElementById('actMagicPowder').addEventListener('click', () => {
    state.auroraTimer = 14;
    audio.playSingingBowl(0.18);
    showSeatBubble(state.mySeatIndex, '✨');
    sendServerAction({ type: 'aurora' });
    showToast('신비로운 오로라 빛깔과 반딧불이가 공간을 채웁니다 ✨');
  });

  // 0. 📜 고민 태우기 / 소원 띄우기
  const worryModal = document.getElementById('worryModal');
  const worryInput = document.getElementById('worryInput');
  document.getElementById('actBurnWorry').addEventListener('click', () => {
    worryModal.classList.remove('hidden');
    worryInput.focus();
  });

  worryInput.addEventListener('input', () => {
    document.getElementById('worryCount').textContent = `${worryInput.value.length} / 120자`;
  });

  document.getElementById('burnWorrySubmitBtn').addEventListener('click', () => {
    const val = worryInput.value.trim() || '오늘의 마음속 이야기';
    spawn3DBurningNote(val);
    if (getCurrentConcept() === 'water') spawn3DFloatingLantern(state.mySeatIndex);
    else if (getCurrentConcept() === 'star') spawn3DShootingStar();
    else audio.playWhoosh();

    worryInput.value = '';
    document.getElementById('worryCount').textContent = '0 / 120자';
    worryModal.classList.add('hidden');
    showToast('적어주신 마음이 밤하늘의 별빛이 되어 날아갑니다 ✨');
  });

  // Room & Server Channel Selector
  const roomModal = document.getElementById('roomModal');
  const refreshRoomOccupancyUI = () => {
    fetch('/api/rooms')
      .then(r => r.json())
      .then(data => {
        if (!data || !data.counts) return;
        document.querySelectorAll('[data-occ]').forEach(el => {
          const rKey = el.dataset.occ;
          const cnt = data.counts[rKey] || 0;
          el.textContent = cnt > 0 ? `${cnt}명 쉬는 중` : '조용함 (0명)';
        });
      })
      .catch(() => {});
  };

  document.getElementById('roomSelectBtn').addEventListener('click', () => {
    roomModal.classList.toggle('hidden');
    document.getElementById('soundModal').classList.add('hidden');
    if (!roomModal.classList.contains('hidden')) {
      refreshRoomOccupancyUI();
    }
  });

  document.querySelectorAll('#regionGroup .mini-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.region === state.region);
    btn.addEventListener('click', () => {
      document.querySelectorAll('#regionGroup .mini-pill').forEach(el => el.classList.remove('active'));
      btn.classList.add('active');
      state.region = btn.dataset.region;
      syncUrlParams(state.room);
      connectMultiplayerServer();
      showToast(`'${state.region.toUpperCase()}' 지역 서버로 연결했습니다.`);
    });
  });

  document.querySelectorAll('#instanceGroup .mini-pill').forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.instance) === state.instance);
    btn.addEventListener('click', () => {
      document.querySelectorAll('#instanceGroup .mini-pill').forEach(el => el.classList.remove('active'));
      btn.classList.add('active');
      state.instance = Number(btn.dataset.instance);
      syncUrlParams(state.room);
      connectMultiplayerServer();
      showToast(`#${state.instance}번 채널로 자리를 옮겼습니다.`);
    });
  });

  document.getElementById('copyRoomLinkBtn')?.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      showToast('현재 쉼터 주소가 복사되었습니다! 친구에게 보내 함께 쉬어보세요 🔗');
    });
  });

  document.querySelectorAll('.room-item').forEach(item => {
    item.addEventListener('click', () => {
      roomModal.classList.add('hidden');
      switchRoomConcept(item.dataset.room);
    });
  });

  // Sound Mixer
  const soundModal = document.getElementById('soundModal');
  document.getElementById('soundToggleBtn').addEventListener('click', () => {
    soundModal.classList.toggle('hidden');
    roomModal.classList.add('hidden');
  });

  const bindSlider = (id, labelId, channel) => {
    const el = document.getElementById(id);
    el.addEventListener('input', () => {
      document.getElementById(labelId).textContent = `${el.value}%`;
      audio.setVolume(channel, Number(el.value));
    });
  };
  bindSlider('volFire', 'valFire', 'fire');
  bindSlider('volWind', 'valWind', 'wind');
  bindSlider('volRain', 'valRain', 'rain');
  bindSlider('volNight', 'valNight', 'night');

  document.getElementById('muteAllBtn').addEventListener('click', () => {
    const muted = audio.toggleMute();
    document.getElementById('soundToggleBtn').textContent = muted ? '🔇' : '🔊';
    showToast(muted ? '소리를 잠시 껐습니다.' : '자연의 소리를 다시 켰습니다.');
  });

  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById(btn.dataset.close).classList.add('hidden');
    });
  });

  // Zen Mode
  const toggleZen = (forceState) => {
    state.zenMode = typeof forceState === 'boolean' ? forceState : !state.zenMode;
    document.getElementById('topBar').classList.toggle('hidden', state.zenMode);
    document.getElementById('bottomDock').classList.toggle('hidden', state.zenMode);
    document.getElementById('labels3DContainer')?.classList.toggle('hidden', state.zenMode);
    document.getElementById('exitZenBtn').classList.toggle('hidden', !state.zenMode);
    roomModal.classList.add('hidden');
    soundModal.classList.add('hidden');
  };
  document.getElementById('zenModeBtn').addEventListener('click', () => toggleZen(true));
  document.getElementById('exitZenBtn').addEventListener('click', () => toggleZen(false));

  document.getElementById('myInfoPill').addEventListener('click', () => {
    state.isWalking = false;
    sync3DCamperMeshes();
    focusCameraOnSeat(state.mySeatIndex);
    showSeatBubble(state.mySeatIndex, '👋');
  });

  // 3D Orbit Camera Drag + 3D Raycast Click
  canvas.addEventListener('pointerdown', (e) => {
    state.pointer.down = true;
    state.pointer.moved = false;
    state.pointer.x = e.clientX;
    state.pointer.y = e.clientY;
  });

  window.addEventListener('pointermove', (e) => {
    if (!state.pointer.down) return;
    const dx = e.clientX - state.pointer.x;
    const dy = e.clientY - state.pointer.y;
    if (Math.hypot(dx, dy) > 5) state.pointer.moved = true;
    state.pointer.x = e.clientX;
    state.pointer.y = e.clientY;

    state.targetCamYaw -= dx * 0.0065;
    state.targetCamPitch = Math.max(0.18, Math.min(1.12, state.targetCamPitch + dy * 0.005));
  });

  window.addEventListener('pointerup', (e) => {
    if (state.pointer.down && !state.pointer.moved) {
      handle3DClick(e.clientX, e.clientY);
    }
    state.pointer.down = false;
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    state.targetCamDist = Math.max(7.2, Math.min(17.5, state.targetCamDist + e.deltaY * 0.01));
  }, { passive: false });

  window.addEventListener('keydown', (e) => {
    if (document.activeElement === worryInput || !state.entered) return;
    if (e.key === '1') document.getElementById('actWave')?.click();
    if (e.key === '2') document.getElementById('actHands').click();
    if (e.key === '3') document.getElementById('actMainRitual')?.click();
    if (e.key === '4') document.getElementById('actRoast').click();
    if (e.key === '5') document.getElementById('actShareMallow')?.click();
    if (e.key === '6') document.getElementById('actShareThermos')?.click();
    if (e.key === '7') document.getElementById('actTelescope')?.click();
    if (e.key === '8') document.getElementById('actSparkler').click();
    if (e.key === '9') document.getElementById('actMagicPowder').click();
    if (e.key === '0') document.getElementById('actBurnWorry').click();
    if (e.key === 'Escape') {
      worryModal.classList.add('hidden');
      if (state.zenMode) toggleZen(false);
    }
  });

  setInterval(() => {
    if (!state.entered) return;
    state.staySeconds++;
    const m = String(Math.floor(state.staySeconds / 60)).padStart(2, '0');
    const s = String(state.staySeconds % 60).padStart(2, '0');
    document.getElementById('stayTimer').textContent = `${m}:${s}`;
  }, 1000);
}

function handle3DClick(clientX, clientY) {
  mouseNDC.x = (clientX / window.innerWidth) * 2 - 1;
  mouseNDC.y = -(clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouseNDC, camera);

  // 1. Check if clicked a Log Bench or Camper
  const hits = raycaster.intersectObjects(seatClickTargets, false);
  if (hits.length > 0) {
    const seatIndex = hits[0].object.userData.seatIndex;
    const seat = seats[seatIndex];
    if (!seat) return;

    if (!seat.occupied) {
      const oldSeat = seats[state.mySeatIndex];
      oldSeat.occupied = false;
      oldSeat.isMe = false;

      seat.occupied = true;
      seat.isMe = true;
      seat.name = state.myName;
      seat.color = state.myColor;
      seat.action = state.myAction;
      state.mySeatIndex = seat.index;
      state.isWalking = false;

      sync3DCamperMeshes();
      focusCameraOnSeat(seat.index);
      sendServerAction({ type: 'moveSeat', seatIndex: seat.index });
      showToast('통나무 자리에 앉았습니다.');
    } else if (seat.isMe) {
      if (state.isWalking) {
        state.isWalking = false;
        sync3DCamperMeshes();
        showToast('다시 내 통나무 자리에 앉았습니다.');
      } else {
        seat.waveUntil = performance.now() + 2500;
        showSeatBubble(seat.index, '👋');
        sendServerAction({ type: 'wave' });
      }
    } else {
      // Clicked another camper: share coffee if holding thermos, share mallow if roasting, otherwise wave/nod!
      if (state.myAction === 'thermos') {
        spawn3DSharedItem(state.mySeatIndex, seat.index, 'coffee');
        sendServerAction({ type: 'shareCoffee', targetSeat: seat.index });
        showToast(`'${seat.name}'님에게 보온병 커피를 따라 건넸습니다 ☕`);
      } else if (state.myAction === 'roast') {
        spawn3DSharedItem(state.mySeatIndex, seat.index, 'mallow');
        sendServerAction({ type: 'shareMallow', targetSeat: seat.index });
        showToast(`'${seat.name}'님에게 구운 마시멜로를 건넸습니다 🍡`);
      } else {
        const mySeat = seats[state.mySeatIndex];
        if (mySeat) mySeat.waveUntil = performance.now() + 2500;
        seat.waveUntil = performance.now() + 2500;
        showSeatBubble(seat.index, '👋😊');
        showSeatBubble(state.mySeatIndex, '👋');
        sendServerAction({ type: 'wave' });
        showToast(`'${seat.name}'님과 반갑게 손인사를 나누었습니다 👋`);
      }
    }
    return;
  }

  // 2. Check if clicked on Ground Clearing to Walk / Stroll around
  if (groundMesh) {
    const groundHits = raycaster.intersectObject(groundMesh, false);
    if (groundHits.length > 0) {
      const pt = groundHits[0].point;
      const distFromCenter = Math.hypot(pt.x, pt.z);
      const concept = getCurrentConcept();

      if (distFromCenter < (concept === 'water' ? 2.75 : 1.65)) {
        if (concept === 'water') {
          spawn3DFloatingLantern(state.mySeatIndex);
          sendServerAction({ type: 'floatLantern' });
        } else if (concept === 'star') {
          spawn3DShootingStar();
          sendServerAction({ type: 'shootingStar' });
        } else {
          audio.playWoodSnap(0.8);
        }
        return;
      }

      if (distFromCenter <= 8.5) {
        const mySeat = seats[state.mySeatIndex];
        if (!state.isWalking && mySeat) {
          state.walkPos.x = mySeat.x;
          state.walkPos.z = mySeat.z;
        }
        state.isWalking = true;
        state.walkTarget.x = pt.x;
        state.walkTarget.z = pt.z;

        if (walkTargetRing) {
          walkTargetRing.position.set(pt.x, 0.03, pt.z);
          walkTargetRing.material.opacity = 0.85;
        }
        showToast('주변을 천천히 산책합니다 (통나무를 누르면 다시 자리에 앉아요)');
      }
    }
  }
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initialize Everything
syncUrlParams();
initSeats();
build3DEnvironment();
init3DParticles();
applyRoom3DTheme();
bindEvents();
setPoseAction('hands');
focusCameraOnSeat(state.mySeatIndex);
requestAnimationFrame(animate3D);
