const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// ====================================================
// REAL-TIME ROOM & INSTANCE MANAGER (SANSA ARCHITECTURE)
// ====================================================
const MAX_SEATS_PER_INSTANCE = 12;
const rooms = new Map(); // key: "room:instance:region" -> RoomState

function getRoomKey(room = 'fire-01', instance = 0, region = 'apac') {
  return `${room}:${instance}:${region}`;
}

function getOrCreateRoom(room = 'fire-01', instance = 0, region = 'apac') {
  const key = getRoomKey(room, instance, region);
  if (!rooms.has(key)) {
    rooms.set(key, {
      room,
      instance: Number(instance) || 0,
      region,
      fireHeat: 680,
      auroraUntil: 0,
      waterDayMode: true, // Swiss Lake default: Daytime emerald lake
      clients: new Map() // clientId -> { id, res, name, seatIndex, action, posture, color }
    });
  }
  return rooms.get(key);
}

// Find an available instance if instance 0 is full (Auto-scaling instances like Sansa)
function findAvailableSeatIndex(roomState) {
  const taken = new Set();
  for (const c of roomState.clients.values()) {
    taken.add(c.seatIndex);
  }
  for (let i = 0; i < MAX_SEATS_PER_INSTANCE; i++) {
    if (!taken.has(i)) return i;
  }
  return Math.floor(Math.random() * MAX_SEATS_PER_INSTANCE);
}

function getPublicRoomSnapshot(roomState) {
  const users = [];
  for (const c of roomState.clients.values()) {
    users.push({
      id: c.id,
      name: c.name,
      seatIndex: c.seatIndex,
      action: c.action,
      posture: c.posture || 'sit',
      color: c.color
    });
  }

  let totalOnlineAllRooms = 0;
  for (const r of rooms.values()) {
    totalOnlineAllRooms += r.clients.size;
  }

  return {
    room: roomState.room,
    instance: roomState.instance,
    region: roomState.region,
    fireHeat: roomState.fireHeat,
    auroraActive: Date.now() < roomState.auroraUntil,
    waterDayMode: roomState.waterDayMode,
    roomCount: roomState.clients.size,
    totalOnline: totalOnlineAllRooms,
    users
  };
}

function broadcastToRoom(roomState, eventType, payload) {
  const data = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of roomState.clients.values()) {
    try {
      client.res.write(data);
    } catch (_) {
      // Ignore broken pipe; cleanup happens on 'close'
    }
  }
}

// Gentle server-side heat decay & keep-alive heartbeat every 10s
setInterval(() => {
  for (const roomState of rooms.values()) {
    if (roomState.fireHeat > 650) {
      roomState.fireHeat = Math.max(650, roomState.fireHeat - 8);
    }
    for (const client of roomState.clients.values()) {
      try {
        client.res.write(`: heartbeat\n\n`);
      } catch (_) {}
    }
  }
}, 10000);

// ====================================================
// HTTP + SSE REAL-TIME SERVER (ZERO EXTERNAL PACKAGES)
// ====================================================
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // CORS headers for easy deployment
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. Real-time Stream Endpoint (SSE)
  if (pathname === '/api/stream' && req.method === 'GET') {
    const room = parsedUrl.searchParams.get('room') || 'pine-01';
    let instance = Number(parsedUrl.searchParams.get('instance') || 0);
    const region = parsedUrl.searchParams.get('region') || 'apac';
    const clientId = parsedUrl.searchParams.get('clientId') || `camper_${Math.random().toString(36).slice(2, 9)}`;
    const name = parsedUrl.searchParams.get('name') || '따뜻한 불씨';
    const color = parsedUrl.searchParams.get('color') || '#e07a5f';

    // Auto-scale to next instance (#1, #2...) if current 12-seat campfire is full
    let roomState = getOrCreateRoom(room, instance, region);
    while (roomState.clients.size >= MAX_SEATS_PER_INSTANCE && !roomState.clients.has(clientId) && instance < 99) {
      instance++;
      roomState = getOrCreateRoom(room, instance, region);
    }
    const seatIndex = findAvailableSeatIndex(roomState);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    const clientObj = {
      id: clientId,
      res,
      name,
      seatIndex,
      action: 'idle',
      posture: room === 'star-03' ? 'lie' : (room === 'water-02' ? (seatIndex % 2 === 0 ? 'chair' : 'grass') : 'sit'),
      color
    };

    roomState.clients.set(clientId, clientObj);

    // Send initial state to newly connected user
    const snapshot = getPublicRoomSnapshot(roomState);
    res.write(`event: init\ndata: ${JSON.stringify({ myId: clientId, mySeatIndex: seatIndex, snapshot })}\n\n`);

    // Notify everyone in the room that a new camper sat down
    broadcastToRoom(roomState, 'sync', getPublicRoomSnapshot(roomState));

    req.on('close', () => {
      roomState.clients.delete(clientId);
      broadcastToRoom(roomState, 'sync', getPublicRoomSnapshot(roomState));
    });
    return;
  }

  // 2. Real-time Action Endpoint (Throw Log, Change Pose, Move Seat, Aurora Powder, Nod)
  if (pathname === '/api/action' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e4) req.socket.destroy();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const roomState = getOrCreateRoom(data.room, data.instance, data.region);
        const client = roomState.clients.get(data.clientId);

        if (client) {
          if (data.type === 'pose' && data.action) {
            client.action = data.action;
            if (data.posture) client.posture = data.posture;
            broadcastToRoom(roomState, 'sync', getPublicRoomSnapshot(roomState));
          } else if (data.type === 'posture' && data.posture) {
            client.posture = data.posture;
            broadcastToRoom(roomState, 'sync', getPublicRoomSnapshot(roomState));
          } else if (data.type === 'toggleWaterDayNight') {
            roomState.waterDayMode = typeof data.waterDayMode === 'boolean' ? data.waterDayMode : !roomState.waterDayMode;
            broadcastToRoom(roomState, 'effect', {
              effect: 'waterDayNight',
              waterDayMode: roomState.waterDayMode,
              actorName: client.name
            });
          } else if (data.type === 'name' && data.name) {
            client.name = String(data.name).slice(0, 20);
            broadcastToRoom(roomState, 'sync', getPublicRoomSnapshot(roomState));
          } else if (data.type === 'moveSeat' && typeof data.seatIndex === 'number') {
            client.seatIndex = Math.max(0, Math.min(MAX_SEATS_PER_INSTANCE - 1, data.seatIndex));
            if (data.posture) client.posture = data.posture;
            broadcastToRoom(roomState, 'sync', getPublicRoomSnapshot(roomState));
          } else if (data.type === 'throwLog') {
            roomState.fireHeat = Math.min(1200, roomState.fireHeat + 38);
            broadcastToRoom(roomState, 'effect', {
              effect: 'throwLog',
              fromSeat: client.seatIndex,
              actorName: client.name,
              fireHeat: roomState.fireHeat
            });
          } else if (data.type === 'aurora') {
            roomState.auroraUntil = Date.now() + 14000;
            broadcastToRoom(roomState, 'effect', {
              effect: 'aurora',
              fromSeat: client.seatIndex,
              actorName: client.name
            });
          } else if (data.type === 'nod') {
            broadcastToRoom(roomState, 'effect', {
              effect: 'nod',
              fromSeat: client.seatIndex,
              targetSeat: data.targetSeat
            });
          } else if (data.type === 'offerGift') {
            broadcastToRoom(roomState, 'effect', {
              effect: 'offerGift',
              giftType: data.giftType || 'coffee',
              fromSeat: client.seatIndex,
              targetSeat: data.targetSeat,
              actorName: client.name
            });
          } else if (data.type === 'acceptGift') {
            broadcastToRoom(roomState, 'effect', {
              effect: 'acceptGift',
              giftType: data.giftType || 'coffee',
              fromSeat: data.fromSeat,
              targetSeat: client.seatIndex,
              actorName: client.name
            });
          } else if (data.type === 'firework') {
            broadcastToRoom(roomState, 'effect', {
              effect: 'firework',
              fromSeat: client.seatIndex,
              actorName: client.name
            });
          } else if (data.type === 'wave') {
            broadcastToRoom(roomState, 'effect', {
              effect: 'wave',
              fromSeat: client.seatIndex,
              actorName: client.name
            });
          } else if (data.type === 'floatLantern') {
            broadcastToRoom(roomState, 'effect', {
              effect: 'floatLantern',
              fromSeat: client.seatIndex,
              actorName: client.name
            });
          } else if (data.type === 'skipStone') {
            broadcastToRoom(roomState, 'effect', {
              effect: 'skipStone',
              fromSeat: client.seatIndex,
              actorName: client.name
            });
          } else if (data.type === 'shootingStar') {
            broadcastToRoom(roomState, 'effect', {
              effect: 'shootingStar',
              fromSeat: client.seatIndex,
              actorName: client.name
            });
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false }));
      }
    });
    return;
  }

  // 3. Room Occupancy Summary API
  if (pathname === '/api/rooms' && req.method === 'GET') {
    const counts = {};
    for (const [k, r] of rooms.entries()) {
      counts[r.room] = (counts[r.room] || 0) + r.clients.size;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ counts }));
    return;
  }

  // 4. Static File Serving (index.html, style.css, app.js)
  let safePath = pathname === '/' ? '/index.html' : pathname;
  safePath = path.normalize(safePath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(__dirname, safePath);

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`\n🔥 [불멍 멀티플레이 서버 가동 완료]`);
  console.log(`👉 로컬 접속 주소: http://localhost:${PORT}/?room=pine-01&instance=0&region=apac\n`);
});
