const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const PORT = process.env.PORT || 3000;
const NAMES_FILE = path.join(__dirname, 'names.json');
const COOLDOWN_MS = 20 * 24 * 60 * 60 * 1000;

// ─── PERSISTENCE ───────────────────────────────────────────────
let namesData = {};
try {
  if (fs.existsSync(NAMES_FILE)) {
    namesData = JSON.parse(fs.readFileSync(NAMES_FILE, 'utf8'));
  }
} catch (e) { namesData = {}; }

function saveNames() {
  fs.writeFileSync(NAMES_FILE, JSON.stringify(namesData, null, 2));
}

// ─── PHYSICS CONSTANTS ─────────────────────────────────────────
const GRAVITY     = 0.8;
const JUMP_FORCE  = -15;
const MAX_SPEED   = 8;
const FRICTION    = 0.82;
const GROUND_Y    = 520;
const MIN_X       = 80;
const PLAYER_W    = 30;
const PLAYER_H    = 30;

// ─── SEEDED RANDOM ─────────────────────────────────────────────
function seededRng(seed) {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13; s ^= s >> 17; s ^= s << 5;
    return ((s >>> 0) / 0xFFFFFFFF);
  };
}
const WORLD_SEED = 99421;

// ─── OBSTACLE GENERATION ───────────────────────────────────────
function generateObstacles() {
  const rng = seededRng(WORLD_SEED);
  const obs = [];
  for (let i = 0; i < 120; i++) {
    const x = 400 + i * 160 + rng() * 80;
    const t = Math.floor(rng() * 5);
    const base = {
      id: `o${i}`, x,
      type: ['spike','laser','blade','jumppad','spike'][t]
    };
    if (base.type === 'spike') {
      obs.push({ ...base, baseY: GROUND_Y - 10, w: 28, h: 35,
        amp: 40 + rng() * 80, spd: 0.0015 + rng() * 0.002,
        phase: rng() * Math.PI * 2 });
    } else if (base.type === 'laser') {
      obs.push({ ...base, y: GROUND_Y - 220, w: 14, h: 220,
        period: 1800 + rng() * 2000, offset: rng() * 4000 });
    } else if (base.type === 'blade') {
      obs.push({ ...base, cy: GROUND_Y - 130,
        radius: 55 + rng() * 50,
        spd: 0.025 + rng() * 0.02,
        phase: rng() * Math.PI * 2, w: 22, h: 22 });
    } else {
      obs.push({ ...base, y: GROUND_Y - 12, w: 55, h: 16 });
    }
  }
  return obs;
}
const OBSTACLES = generateObstacles();

// ─── PLAYERS ───────────────────────────────────────────────────
const players = {};
const chatLog = [];

function makePlayer(id, profile) {
  return {
    id, inGame: false, alive: false,
    username: profile.username,
    color: profile.color || '#a855f7',
    x: 200, y: GROUND_Y, vx: 0, vy: 0,
    onGround: true, score: 0,
    input: { left: false, right: false, jump: false }
  };
}

// ─── COLLISION ─────────────────────────────────────────────────
function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function checkCollisions(p, now) {
  for (const o of OBSTACLES) {
    if (Math.abs(o.x - p.x) > 200) continue;

    if (o.type === 'spike') {
      const oy = o.baseY - Math.abs(Math.sin(now * o.spd + o.phase)) * o.amp;
      if (rectsOverlap(p.x, p.y - PLAYER_H, PLAYER_W, PLAYER_H, o.x, oy - o.h, o.w, o.h))
        return 'spike';
    } else if (o.type === 'laser') {
      const active = Math.sin((now + o.offset) / o.period * Math.PI * 2) > 0;
      if (active && rectsOverlap(p.x, p.y - PLAYER_H, PLAYER_W, PLAYER_H, o.x, o.y, o.w, o.h))
        return 'laser';
    } else if (o.type === 'blade') {
      const bx = o.x + Math.cos(now * o.spd + o.phase) * o.radius;
      const by = o.cy + Math.sin(now * o.spd + o.phase) * o.radius;
      if (rectsOverlap(p.x, p.y - PLAYER_H, PLAYER_W, PLAYER_H, bx - 11, by - 11, 22, 22))
        return 'blade';
    } else if (o.type === 'jumppad') {
      if (rectsOverlap(p.x, p.y - PLAYER_H, PLAYER_W, PLAYER_H, o.x, o.y, o.w, o.h))
        return 'jumppad';
    }
  }
  return null;
}

// ─── GAME TICK ─────────────────────────────────────────────────
setInterval(() => {
  const now = Date.now();
  for (const id in players) {
    const p = players[id];
    if (!p.inGame || !p.alive) continue;

    // Input
    if (p.input.left)  p.vx -= 1.8;
    if (p.input.right) p.vx += 1.8;
    p.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, p.vx)) * FRICTION;

    if (p.input.jump && p.onGround) {
      p.vy = JUMP_FORCE; p.onGround = false;
    }
    p.input.jump = false;

    p.vy += GRAVITY;
    p.x += p.vx;
    p.y += p.vy;

    if (p.y >= GROUND_Y) { p.y = GROUND_Y; p.vy = 0; p.onGround = true; }
    else p.onGround = false;

    if (p.x < MIN_X) { p.x = MIN_X; p.vx = 0; }
    p.score = Math.max(p.score, Math.floor((p.x - 200) / 10));

    const hit = checkCollisions(p, now);
    if (hit === 'jumppad') {
      p.vy = -20;
    } else if (hit) {
      p.alive = false;
      io.emit('playerDied', { id, username: p.username, cause: hit });
    }
  }

  // Build broadcast
  const snap = {};
  for (const id in players) {
    const p = players[id];
    snap[id] = {
      x: p.x, y: p.y, alive: p.alive, score: p.score,
      username: p.username, color: p.color,
      inGame: p.inGame, onGround: p.onGround
    };
  }

  const lb = Object.values(players)
    .sort((a, b) => b.score - a.score).slice(0, 5)
    .map(p => ({ username: p.username, color: p.color, score: p.score }));

  io.emit('gameState', { players: snap, leaderboard: lb, ts: now });
}, 50);

// ─── SOCKET EVENTS ─────────────────────────────────────────────
io.on('connection', socket => {
  console.log(`✅ ${socket.id} connected`);

  // Load / create profile
  if (!namesData[socket.id]) {
    namesData[socket.id] = {
      username: `Racer_${socket.id.slice(0,5)}`,
      usernameLockedUntil: 0, usernameChangedAt: 0,
      color: '#a855f7'
    };
    saveNames();
  }
  const profile = namesData[socket.id];
  players[socket.id] = makePlayer(socket.id, profile);

  socket.emit('profileLoaded', { ...profile, socketId: socket.id, now: Date.now() });
  socket.emit('chatHistory', chatLog.slice(-60));
  socket.emit('obstacleMap', OBSTACLES);
  io.emit('onlineCount', Object.keys(players).length);

  // ── Save name
  socket.on('saveName', ({ username, color }) => {
    const now = Date.now();
    const d = namesData[socket.id] || {};
    if (!username || username.trim().length < 2 || username.trim().length > 20) {
      return socket.emit('nameSaveError', { message: '⚠️ Username must be 2–20 characters.' });
    }
    if (d.usernameLockedUntil && now < d.usernameLockedUntil) {
      return socket.emit('nameSaveError', {
        message: `🔒 Locked until ${new Date(d.usernameLockedUntil).toLocaleDateString()}`,
        lockedUntil: d.usernameLockedUntil
      });
    }
    const clean = username.trim().replace(/[<>"']/g, '').slice(0, 20);
    namesData[socket.id] = {
      ...d, username: clean, color: color || d.color || '#a855f7',
      usernameLockedUntil: now + COOLDOWN_MS,
      usernameChangedAt: now
    };
    saveNames();
    players[socket.id].username = clean;
    players[socket.id].color = namesData[socket.id].color;
    socket.emit('nameSaved', { ...namesData[socket.id], now });
    io.emit('notification', `✨ ${clean} joined the arena!`);
  });

  // ── Color only
  socket.on('updateColor', ({ color }) => {
    if (!color) return;
    if (namesData[socket.id]) { namesData[socket.id].color = color; saveNames(); }
    if (players[socket.id]) players[socket.id].color = color;
    socket.emit('colorUpdated', { color });
  });

  // ── Join game
  socket.on('joinGame', () => {
    const p = players[socket.id];
    if (!p) return;
    p.inGame = true; p.alive = true;
    p.x = 200; p.y = GROUND_Y; p.vx = 0; p.vy = 0; p.score = 0;
    socket.emit('gameJoined');
    io.emit('notification', `🏁 ${p.username} joined the race!`);
  });

  // ── Leave game
  socket.on('leaveGame', () => {
    if (players[socket.id]) { players[socket.id].inGame = false; players[socket.id].alive = false; }
  });

  // ── Respawn
  socket.on('respawn', () => {
    const p = players[socket.id];
    if (p && p.inGame) {
      p.alive = true; p.x = 200; p.y = GROUND_Y; p.vx = 0; p.vy = 0;
    }
  });

  // ── Input
  socket.on('input', inp => {
    const p = players[socket.id];
    if (!p || !p.alive) return;
    p.input.left  = !!inp.left;
    p.input.right = !!inp.right;
    if (inp.jump) p.input.jump = true;
  });

  // ── Chat
  socket.on('chatMessage', ({ message }) => {
    if (!message?.trim() || message.length > 200) return;
    const p = players[socket.id];
    const msg = {
      id: `${socket.id}_${Date.now()}`,
      socketId: socket.id,
      username: p?.username || 'Unknown',
      color: p?.color || '#a855f7',
      message: message.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;'),
      ts: Date.now()
    };
    chatLog.push(msg);
    if (chatLog.length > 200) chatLog.shift();
    io.emit('chatMessage', msg);
  });

  socket.on('ping_custom', () => socket.emit('pong_custom'));

  socket.on('typing',     () => socket.broadcast.emit('userTyping',     { socketId: socket.id, username: players[socket.id]?.username, color: players[socket.id]?.color }));
  socket.on('stopTyping', () => socket.broadcast.emit('userStopTyping', { socketId: socket.id }));

  // ── Disconnect
  socket.on('disconnect', () => {
    const name = players[socket.id]?.username || socket.id;
    console.log(`❌ ${name} disconnected`);
    delete players[socket.id];
    io.emit('notification', `💨 ${name} left`);
    io.emit('onlineCount', Object.keys(players).length);
  });
});

app.use(express.static(path.join(__dirname, 'public')));

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🔥 ═══════════════════════════════════════`);
  console.log(`🎮  DAKROMA MASTER PIECE`);
  console.log(`🔥 ═══════════════════════════════════════`);
  console.log(`🌍  http://localhost:${PORT}`);
  console.log(`🔥 ═══════════════════════════════════════\n`);
});
