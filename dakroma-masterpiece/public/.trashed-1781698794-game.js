/* ══════════════════════════════════════════
   DAKROMA MASTER PIECE — CLIENT ENGINE
══════════════════════════════════════════ */

// ─── SOCKET CONNECTION ─────────────────────────────────────────
const SOCKET_URL =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
    ? undefined
    : 'https://YOUR-RENDER-BACKEND.onrender.com';

const socket = io(SOCKET_URL, {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  timeout: 20000
});

// ─── STATE ─────────────────────────────────────────────────────
let myId         = null;
let myProfile    = { username: '', color: '#a855f7', usernameLockedUntil: 0 };
let gameState    = { players: {}, leaderboard: [] };
let obstacleMap  = [];
let isInGame     = false;
let cameraX      = 0;
let keys         = { left: false, right: false, jump: false };
let lastInputTs  = 0;
let pingStart    = 0;
let countdownTmr = null;
let typingUsers  = {};
let rafId        = null;

// Canvas
let canvas, ctx;

// ─── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  canvas = document.getElementById('gameCanvas');
  ctx    = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  initHomeScreen();
  initChat();
  initBot();
  initGameControls();
  initModals();

  // Ping loop
  setInterval(() => {
    pingStart = Date.now();
    socket.emit('ping_custom');
  }, 2000);
});

// ─── SOCKET EVENTS ─────────────────────────────────────────────
socket.on('connect', () => {
  myId = socket.id;
  notify('🌍 Connected to multiplayer server', 'success');
});

socket.on('disconnect', () => {
  notify('❌ Disconnected. Reconnecting...', 'error');
});

socket.on('pong_custom', () => {
  const ping = Date.now() - pingStart;
  const el = document.getElementById('hudPing');
  if (el) el.textContent = ping;
});

socket.on('profileLoaded', (p) => {
  myProfile = { ...p };
  refreshProfileUI();
});

socket.on('nameSaved', (d) => {
  myProfile.username       = d.username;
  myProfile.color          = d.color;
  myProfile.usernameLockedUntil = d.usernameLockedUntil;
  refreshProfileUI();
  notify('✅ Name saved! Locked for 20 days.', 'success');
});

socket.on('nameSaveError', (d) => {
  notify('⚠️ ' + d.message, 'error');
});

socket.on('colorUpdated', (d) => {
  myProfile.color = d.color;
  refreshAvatarPreview();
  notify('🎨 Color updated!', 'success');
});

socket.on('obstacleMap', (obs) => {
  obstacleMap = obs;
});

socket.on('gameState', (state) => {
  gameState = state;
  refreshLeaderboard(state.leaderboard);
  refreshOnlineCount();
  // Sync my score to HUD
  const me = state.players[myId];
  if (me) {
    const sc = document.getElementById('hudScore');
    const st = document.getElementById('hudStatus');
    if (sc) sc.textContent = me.score;
    if (st) st.textContent = me.alive ? '💚 ALIVE' : '💀 DEAD';
  }
});

socket.on('gameJoined', () => {
  isInGame = true;
  showScreen('gameScreen');
  rafId = requestAnimationFrame(gameLoop);
});

socket.on('playerDied', ({ id, username, cause }) => {
  const causes = { spike:'⚠️ spiked', laser:'⚡ lasered', blade:'🌀 shredded' };
  if (id === myId) {
    notify(`💀 You were ${causes[cause] || 'killed'}!`, 'error');
    document.getElementById('deathOverlay').style.display = 'flex';
  } else {
    notify(`💀 ${username} was ${causes[cause] || 'killed'}!`, 'info');
  }
});

socket.on('chatMessage',    appendChatMsg);
socket.on('chatHistory',    (msgs) => { msgs.forEach(m => appendChatMsg(m, true)); scrollChat(); });
socket.on('userTyping',     ({ socketId, username, color }) => showTyping(socketId, username, color));
socket.on('userStopTyping', ({ socketId }) => stopTyping(socketId));
socket.on('notification',   (msg) => notify(msg, 'info'));
socket.on('onlineCount',    (n) => document.querySelectorAll('.online-count').forEach(el => el.textContent = n));

// ─── SCREEN MANAGEMENT ─────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ─── HOME SCREEN ───────────────────────────────────────────────
function initHomeScreen() {
  document.getElementById('playBtn').addEventListener('click', startGameFlow);
  document.getElementById('saveNameBtn').addEventListener('click', doSaveName);
  document.getElementById('editProfileBtn').addEventListener('click', openEditProfile);
  document.getElementById('navGameBtn').addEventListener('click', startGameFlow);

  document.querySelectorAll('.color-dot:not(.edit-color-dot)').forEach(dot => {
    dot.addEventListener('click', () => {
      document.querySelectorAll('.color-dot:not(.edit-color-dot)').forEach(d => d.classList.remove('selected'));
      dot.classList.add('selected');
      myProfile.color = dot.dataset.color;
      refreshAvatarPreview();
      socket.emit('updateColor', { color: myProfile.color });
    });
  });
}

function doSaveName() {
  const val = document.getElementById('usernameInput').value.trim();
  if (!val) { notify('⚠️ Enter a username first!', 'warning'); return; }
  socket.emit('saveName', { username: val, color: myProfile.color });
}

function refreshProfileUI() {
  const now    = Date.now();
  const locked = myProfile.usernameLockedUntil && now < myProfile.usernameLockedUntil;

  const inp    = document.getElementById('usernameInput');
  const saveBtn= document.getElementById('saveNameBtn');
  const lockEl = document.getElementById('lockStatus');
  const cdEl   = document.getElementById('nameCountdown');
  const warnEl = document.getElementById('nameWarning');

  if (inp)  inp.value    = myProfile.username || '';
  if (inp)  inp.disabled = locked;
  if (saveBtn) saveBtn.disabled = locked;

  if (lockEl) lockEl.textContent = locked
    ? `🔒 Locked until ${new Date(myProfile.usernameLockedUntil).toLocaleDateString()}`
    : '🟢 Name is unlocked';

  if (warnEl) warnEl.style.display = locked ? 'none' : 'block';

  if (countdownTmr) clearInterval(countdownTmr);
  if (locked) {
    countdownTmr = setInterval(() => {
      const rem = myProfile.usernameLockedUntil - Date.now();
      if (rem <= 0) { clearInterval(countdownTmr); refreshProfileUI(); return; }
      const d = Math.floor(rem / 86400000);
      const h = Math.floor((rem % 86400000) / 3600000);
      const m = Math.floor((rem % 3600000)  / 60000);
      const s = Math.floor((rem % 60000)    / 1000);
      if (cdEl) cdEl.textContent = `⏰ ${d}d ${h}h ${m}m ${s}s`;
    }, 1000);
  } else {
    if (cdEl) cdEl.textContent = '';
  }

  refreshAvatarPreview();

  // Sync color dot selection
  document.querySelectorAll('.color-dot:not(.edit-color-dot)').forEach(dot => {
    dot.classList.toggle('selected', dot.dataset.color === myProfile.color);
  });
}

function refreshAvatarPreview() {
  const c = myProfile.color || '#a855f7';
  const boxes = ['avatarPreview', 'editAvatarPreview'];
  boxes.forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.style.background = c; el.style.boxShadow = `0 0 20px ${c}`; }
  });
  const names = ['avatarName', 'editAvatarName'];
  names.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = myProfile.username || 'Player';
  });
}

// ─── EDIT PROFILE MODAL ─────────────────────────────────────────
function openEditProfile() {
  const now    = Date.now();
  const locked = myProfile.usernameLockedUntil && now < myProfile.usernameLockedUntil;
  const modal  = document.getElementById('editProfileModal');

  document.getElementById('editUsername').value    = myProfile.username || '';
  document.getElementById('editUsername').disabled = locked;
  document.getElementById('editLockInfo').textContent = locked
    ? `🔒 Locked until ${new Date(myProfile.usernameLockedUntil).toLocaleDateString()}`
    : '🟢 Name can be changed';

  refreshAvatarPreview();

  document.querySelectorAll('.edit-color-dot').forEach(dot => {
    dot.classList.toggle('selected', dot.dataset.color === myProfile.color);
    dot.onclick = () => {
      document.querySelectorAll('.edit-color-dot').forEach(d => d.classList.remove('selected'));
      dot.classList.add('selected');
      myProfile.color = dot.dataset.color;
      refreshAvatarPreview();
    };
  });

  modal.classList.add('open');
}

// ─── MODALS ──────────────────────────────────────────────────────
function initModals() {
  // Close buttons
  document.getElementById('chatClose').onclick       = () => document.getElementById('chatModal').classList.remove('open');
  document.getElementById('botClose').onclick        = () => document.getElementById('botModal').classList.remove('open');
  document.getElementById('editProfileClose').onclick= () => document.getElementById('editProfileModal').classList.remove('open');

  // Open buttons
  document.getElementById('navBot').onclick  = () => document.getElementById('botModal').classList.add('open');
  document.getElementById('navChat').onclick = () => document.getElementById('chatModal').classList.add('open');

  // Edit save
  document.getElementById('editSaveBtn').onclick = () => {
    const newName = document.getElementById('editUsername').value.trim();
    const locked  = myProfile.usernameLockedUntil && Date.now() < myProfile.usernameLockedUntil;
    if (!locked && newName) {
      socket.emit('saveName', { username: newName, color: myProfile.color });
    } else {
      socket.emit('updateColor', { color: myProfile.color });
    }
    document.getElementById('editProfileModal').classList.remove('open');
  };

  // Close on backdrop click
  document.querySelectorAll('.modal').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
  });
}

// ─── LOADING → GAME ──────────────────────────────────────────────
function startGameFlow() {
  if (!myProfile.username) { notify('⚠️ Set a username first!', 'warning'); return; }

  showScreen('loadingScreen');

  const steps = [
    '🔌 CONNECTING TO SERVER...',
    '👥 FINDING PLAYERS...',
    '🌍 SYNCING WORLD...',
    '⚡ PREPARING MATCH...'
  ];
  let i = 0;
  const txtEl  = document.getElementById('loadingText');
  const barEl  = document.getElementById('loadingBar');

  function tick() {
    if (i < steps.length) {
      if (txtEl) txtEl.textContent = steps[i];
      if (barEl) barEl.style.width = `${((i + 1) / steps.length) * 100}%`;
      i++;
      setTimeout(tick, 750);
    } else {
      socket.emit('joinGame');
      // gameJoined event will switch screen
    }
  }
  tick();
}

// ─── GAME LOOP ───────────────────────────────────────────────────
function gameLoop() {
  if (!isInGame) return;
  const now = Date.now();

  if (now - lastInputTs > 50) {
    socket.emit('input', { ...keys });
    lastInputTs = now;
  }

  render(now);
  rafId = requestAnimationFrame(gameLoop);
}

function leaveGame() {
  isInGame = false;
  cancelAnimationFrame(rafId);
  socket.emit('leaveGame');
  document.getElementById('deathOverlay').style.display = 'none';
  showScreen('homeScreen');
}

// ─── CANVAS ──────────────────────────────────────────────────────
function resizeCanvas() {
  if (!canvas) return;
  const dock = 75;
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight - dock;
}

const GROUND_Y = 520;

function render(now) {
  const W = canvas.width;
  const H = canvas.height;

  // Background
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, W, H);

  const me = gameState.players[myId];
  if (me) {
    cameraX = me.x - W * 0.3;
    if (cameraX < 0) cameraX = 0;
  }

  ctx.save();
  ctx.translate(-cameraX, 0);

  drawBgGrid(W, H);
  drawGround(W);
  drawObstacles(now);
  drawPlayers();

  ctx.restore();

  // HUD on top (fixed coords)
  drawHud(me);
}

function drawBgGrid(W, H) {
  const gs = 90;
  const sx = Math.floor(cameraX / gs) * gs;
  ctx.strokeStyle = 'rgba(168,85,247,0.04)';
  ctx.lineWidth = 1;
  for (let x = sx; x < cameraX + W + gs; x += gs) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H + 20); ctx.stroke();
  }
  for (let y = gs; y < H + 20; y += gs) {
    ctx.beginPath(); ctx.moveTo(cameraX, y); ctx.lineTo(cameraX + W + gs, y); ctx.stroke();
  }
  // Distant glow
  const grad = ctx.createLinearGradient(cameraX, 0, cameraX, H);
  grad.addColorStop(0, 'rgba(168,85,247,0.06)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(cameraX, 0, W + 20, H);
}

function drawGround(W) {
  // Ground fill
  ctx.fillStyle = '#0f0f1a';
  ctx.fillRect(cameraX - 10, GROUND_Y, W + 20, 300);
  // Glow line
  ctx.save();
  ctx.shadowBlur = 18; ctx.shadowColor = '#a855f7';
  ctx.fillStyle  = '#a855f7';
  ctx.fillRect(cameraX - 10, GROUND_Y, W + 20, 3);
  ctx.shadowBlur = 6; ctx.shadowColor = 'rgba(168,85,247,0.4)';
  ctx.fillStyle  = 'rgba(168,85,247,0.2)';
  ctx.fillRect(cameraX - 10, GROUND_Y + 3, W + 20, 12);
  ctx.restore();
}

function drawObstacles(now) {
  for (const o of obstacleMap) {
    if (o.x < cameraX - 120 || o.x > cameraX + canvas.width + 120) continue;

    if (o.type === 'spike') {
      const oy = o.baseY - Math.abs(Math.sin(now * o.spd + o.phase)) * o.amp;
      ctx.save();
      ctx.shadowBlur = 18; ctx.shadowColor = '#ff4d4d';
      ctx.fillStyle = '#ff4d4d';
      ctx.beginPath();
      ctx.moveTo(o.x + o.w / 2, oy - o.h);
      ctx.lineTo(o.x,            oy);
      ctx.lineTo(o.x + o.w,     oy);
      ctx.closePath(); ctx.fill();
      // Inner bright
      ctx.fillStyle = '#ff9999';
      ctx.beginPath();
      ctx.moveTo(o.x + o.w / 2, oy - o.h + 6);
      ctx.lineTo(o.x + o.w / 2 - 4, oy - 4);
      ctx.lineTo(o.x + o.w / 2 + 4, oy - 4);
      ctx.closePath(); ctx.fill();
      ctx.restore();

    } else if (o.type === 'laser') {
      const active = Math.sin((now + o.offset) / o.period * Math.PI * 2) > 0;
      ctx.save();
      if (active) {
        ctx.shadowBlur = 28; ctx.shadowColor = '#ff4d4d';
        ctx.fillStyle = 'rgba(255,77,77,0.85)';
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.strokeStyle = '#ffaaaa'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(o.x + o.w/2, o.y); ctx.lineTo(o.x + o.w/2, o.y + o.h); ctx.stroke();
        // Warning ticks
        ctx.fillStyle = '#ff6666';
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(o.x - 6, o.y + (o.h / 4) * i, 6, 2);
          ctx.fillRect(o.x + o.w, o.y + (o.h / 4) * i, 6, 2);
        }
      } else {
        ctx.fillStyle = 'rgba(255,77,77,0.12)';
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.strokeStyle = 'rgba(255,77,77,0.2)'; ctx.lineWidth = 1;
        ctx.strokeRect(o.x, o.y, o.w, o.h);
      }
      ctx.restore();

    } else if (o.type === 'blade') {
      const angle = now * o.spd + o.phase;
      const bx = o.x + Math.cos(angle) * o.radius;
      const by = o.cy + Math.sin(angle) * o.radius;
      ctx.save();
      ctx.translate(bx, by); ctx.rotate(angle * 2);
      ctx.shadowBlur = 24; ctx.shadowColor = '#ffeb3b';
      ctx.fillStyle = '#ffeb3b';
      for (let i = 0; i < 4; i++) {
        ctx.save(); ctx.rotate(Math.PI / 2 * i);
        ctx.fillRect(-2, -13, 4, 13);
        ctx.restore();
      }
      ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; ctx.fill();
      ctx.restore();
      // Orbit hint
      ctx.save();
      ctx.strokeStyle = 'rgba(255,235,59,0.08)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(o.x, o.cy, o.radius, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();

    } else if (o.type === 'jumppad') {
      ctx.save();
      ctx.shadowBlur = 20; ctx.shadowColor = '#4caf50';
      ctx.fillStyle = '#1a4a1a';
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.fillStyle = '#4caf50';
      ctx.fillRect(o.x, o.y, o.w, 3);
      const pulse = 0.7 + Math.sin(Date.now() * 0.005) * 0.3;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = 'rgba(76,175,80,0.3)';
      ctx.fillRect(o.x, o.y - 10, o.w, 10);
      ctx.globalAlpha = 1;
      ctx.font = '11px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#4caf50';
      ctx.fillText('🚀', o.x + o.w / 2, o.y + o.h + 1);
      ctx.restore();
    }
  }
}

function drawPlayers() {
  for (const id in gameState.players) {
    const p = gameState.players[id];
    if (!p.inGame || !p.alive) continue;
    const isMe = id === myId;
    drawPlayer(p, isMe);
  }
}

function drawPlayer(p, isMe) {
  const pw = 30, ph = 30;
  const px = p.x, py = p.y - ph;

  ctx.save();
  ctx.shadowBlur  = isMe ? 30 : 18;
  ctx.shadowColor = p.color;

  // Body
  ctx.fillStyle = p.color;
  ctx.fillRect(px, py, pw, ph);

  // Inner face
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(px + 5, py + 5, 8, 8);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(px + 6, py + 6, 3, 3);
  ctx.fillRect(px + 16, py + 6, 3, 3);

  // Outline
  ctx.strokeStyle = isMe ? '#fff' : p.color;
  ctx.lineWidth   = isMe ? 2 : 1;
  ctx.globalAlpha = isMe ? 1 : 0.7;
  ctx.strokeRect(px, py, pw, ph);
  ctx.globalAlpha = 1;

  // Me indicator
  if (isMe) {
    ctx.fillStyle  = '#fff';
    ctx.shadowBlur = 5; ctx.shadowColor = '#fff';
    ctx.beginPath(); ctx.arc(px + pw/2, py - 8, 4, 0, Math.PI * 2); ctx.fill();
  }

  ctx.restore();

  // Username tag
  const tagY = py - (isMe ? 14 : 10);
  ctx.save();
  ctx.font      = `bold ${isMe ? 13 : 11}px monospace`;
  ctx.textAlign = 'center';
  ctx.shadowBlur= 8; ctx.shadowColor = p.color;
  ctx.fillStyle = isMe ? '#fff' : p.color;
  ctx.fillText(p.username || 'Player', px + pw/2, tagY);
  // Score
  if (isMe) {
    ctx.font = '10px monospace'; ctx.fillStyle = '#ffeb3b';
    ctx.shadowColor = '#ffeb3b';
    ctx.fillText(`⭐${p.score}`, px + pw/2, tagY - 14);
  }
  ctx.restore();
}

function drawHud(me) {
  if (!me) return;
  ctx.save();
  ctx.font = 'bold 14px monospace'; ctx.textAlign = 'left';
  ctx.shadowBlur = 12;

  // Connection badge
  ctx.shadowColor = '#4caf50'; ctx.fillStyle = '#4caf50';
  ctx.fillText('🌍 MULTIPLAYER', 12, 28);

  // Player name
  ctx.shadowColor = myProfile.color; ctx.fillStyle = myProfile.color;
  ctx.fillText(myProfile.username || 'Player', 12, 48);

  ctx.restore();
}

// ─── GAME SETUP ──────────────────────────────────────────────────
function initGameControls() {
  document.getElementById('leaveGameBtn').addEventListener('click', leaveGame);
  document.getElementById('leaveFromDeathBtn').addEventListener('click', leaveGame);
  document.getElementById('respawnBtn').addEventListener('click', () => {
    socket.emit('respawn');
    document.getElementById('deathOverlay').style.display = 'none';
  });

  // Keyboard
  document.addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft'  || e.code === 'KeyA') { keys.left = true; e.preventDefault(); }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') { keys.right = true; e.preventDefault(); }
    if ((e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') && !keys.jump) {
      keys.jump = true; e.preventDefault();
    }
  });
  document.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft'  || e.code === 'KeyA') keys.left  = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
    if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') keys.jump = false;
  });

  // Touch buttons
  makeTouchBtn('btnLeft',  () => keys.left  = true, () => keys.left  = false);
  makeTouchBtn('btnRight', () => keys.right = true, () => keys.right = false);
  makeTouchBtn('btnJump',  () => keys.jump  = true, () => keys.jump  = false);
}

function makeTouchBtn(id, down, up) {
  const el = document.getElementById(id);
  if (!el) return;
  const onDown = (e) => { e.preventDefault(); down(); el.classList.add('pressed'); };
  const onUp   = (e) => { e.preventDefault(); up();   el.classList.remove('pressed'); };
  el.addEventListener('touchstart', onDown, { passive: false });
  el.addEventListener('touchend',   onUp,   { passive: false });
  el.addEventListener('touchcancel',onUp,   { passive: false });
  el.addEventListener('mousedown',  onDown);
  el.addEventListener('mouseup',    onUp);
  el.addEventListener('mouseleave', onUp);
}

// ─── LEADERBOARD ─────────────────────────────────────────────────
function refreshLeaderboard(lb) {
  if (!lb) return;
  const html = lb.length
    ? lb.map((p, i) => `
        <div class="lb-row">
          <span class="lb-rank">${['🥇','🥈','🥉','4️⃣','5️⃣'][i] || (i+1)}</span>
          <span class="lb-name" style="color:${p.color}">${escHtml(p.username)}</span>
          <span class="lb-score">${p.score}</span>
        </div>`).join('')
    : '<div class="lb-empty">No players yet</div>';

  ['homeLeaderboard', 'gameLeaderboard'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  });
}

function refreshOnlineCount() {
  const total  = Object.keys(gameState.players || {}).length;
  const inGame = Object.values(gameState.players || {}).filter(p => p.inGame).length;
  document.querySelectorAll('.online-count').forEach(el => el.textContent = total);
  document.querySelectorAll('.ingame-count').forEach(el => el.textContent = inGame);
}

// ─── CHAT ────────────────────────────────────────────────────────
let chatTypeTmr = null;

function initChat() {
  const inp = document.getElementById('chatInput');
  const btn = document.getElementById('chatSendBtn');
  if (!inp || !btn) return;

  btn.addEventListener('click', doSendChat);
  inp.addEventListener('keypress', e => { if (e.key === 'Enter') doSendChat(); });
  inp.addEventListener('input', () => {
    socket.emit('typing');
    clearTimeout(chatTypeTmr);
    chatTypeTmr = setTimeout(() => socket.emit('stopTyping'), 2000);
  });
}

function doSendChat() {
  const inp = document.getElementById('chatInput');
  if (!inp || !inp.value.trim()) return;
  socket.emit('chatMessage', { message: inp.value });
  socket.emit('stopTyping');
  inp.value = '';
}

function appendChatMsg(msg, hist = false) {
  const container = document.getElementById('chatMessages');
  if (!container) return;
  const isMe = msg.socketId === myId;
  const d = document.createElement('div');
  d.className = `chat-message ${isMe ? 'mine' : 'theirs'}`;
  const t = new Date(msg.ts).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
  d.innerHTML = `
    <div class="msg-username" style="color:${msg.color}">${escHtml(msg.username)}</div>
    <div class="msg-bubble">${msg.message}</div>
    <div class="msg-time">${t}</div>`;
  container.appendChild(d);
  if (!hist) scrollChat();
}

function scrollChat() {
  const el = document.getElementById('chatMessages');
  if (el) el.scrollTop = el.scrollHeight;
}

function showTyping(id, username, color) {
  typingUsers[id] = { username, color, ts: Date.now() };
  renderTyping();
  clearTimeout(typingUsers[id]?.tmr);
  typingUsers[id].tmr = setTimeout(() => { delete typingUsers[id]; renderTyping(); }, 3000);
}

function stopTyping(id) { delete typingUsers[id]; renderTyping(); }

function renderTyping() {
  const el = document.getElementById('typingIndicator');
  if (!el) return;
  const names = Object.values(typingUsers);
  if (!names.length) { el.innerHTML = ''; return; }
  const { username, color } = names[0];
  el.innerHTML = `<span class="typing-dots">
    <span style="color:${color}">${escHtml(username)}</span> is typing
    <span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
  </span>`;
}

// ─── BOT ─────────────────────────────────────────────────────────
const BOT_ANSWERS = {
  controls: '🎮 CONTROLS\n━━━━━━━━━━━━\nDesktop:\n  Arrow Keys or WASD to move\n  SPACE / UP to jump\n\nMobile:\n  ◀ ▶ to move  ⬆ to jump\n  Buttons at bottom of screen',
  tips: '💡 TIPS & TRICKS\n━━━━━━━━━━━━━━━\n• Land on 🚀 jump pads for big boosts!\n• ⚡ Lasers flash — time your pass\n• ⚠️ Spikes move in sin waves\n• 🌀 Blades orbit a fixed point\n• Score = how far right you run!',
  rules: '📜 RULES\n━━━━━━━\n• Touch any hazard = death\n• Respawn at start, keep high score\n• Name locks 20 days after saving\n• Color can always be changed\n• Top 5 scores shown live',
  whatsapp: '📱 WhatsApp: https://wa.me/2349018841424',
  tiktok: '🎵 TikTok: https://www.tiktok.com/@shadowdriod',
  help: '🤖 I can answer:\n  controls   tips   rules\n  whatsapp   tiktok\n\nType one of these!',
  hi: '👋 Hey there! Welcome to DAKROMA MASTER PIECE!\nType "help" to see what I can answer.',
  hello: '👋 Hello! Ready to race? Type "controls" to learn how to play!'
};

function initBot() {
  const inp = document.getElementById('botInput');
  const btn = document.getElementById('botSendBtn');
  if (!inp || !btn) return;

  btn.addEventListener('click', doSendBot);
  inp.addEventListener('keypress', e => { if (e.key === 'Enter') doSendBot(); });

  setTimeout(() => {
    appendBotMsg('👺', '👋 Hey! I\'m the DAKROMA BOT!\nAsk me: controls, tips, rules, whatsapp, tiktok\n\nType "help" for the full list.');
  }, 600);
}

function doSendBot() {
  const inp = document.getElementById('botInput');
  if (!inp || !inp.value.trim()) return;
  const txt = inp.value.trim();
  inp.value = '';

  appendBotMsg('👤', txt, true);

  const typingEl = document.getElementById('botTyping');
  if (typingEl) typingEl.style.display = 'block';

  setTimeout(() => {
    if (typingEl) typingEl.style.display = 'none';
    const key = txt.toLowerCase().split(/\s+/)[0];
    const ans = BOT_ANSWERS[key] || `🤔 I don't know "${escHtml(txt.slice(0,20))}"\nType "help" to see what I know!`;
    appendBotMsg('👺', ans);
  }, 800);
}

function appendBotMsg(avatar, text, isUser = false) {
  const c = document.getElementById('botMessages');
  if (!c) return;
  const d = document.createElement('div');
  d.className = `bot-message ${isUser ? 'user-msg' : 'bot-msg'}`;
  d.innerHTML = `<span class="bot-avatar">${avatar}</span><span class="bot-text">${escHtml(text).replace(/\n/g,'<br>')}</span>`;
  c.appendChild(d);
  c.scrollTop = c.scrollHeight;
}

// ─── NOTIFICATIONS ───────────────────────────────────────────────
function notify(msg, type = 'info') {
  const c = document.getElementById('notifContainer');
  if (!c) return;
  const el = document.createElement('div');
  el.className = `notif notif-${type}`;
  el.textContent = msg;
  c.appendChild(el);
  requestAnimationFrame(() => el.classList.add('visible'));
  setTimeout(() => {
    el.classList.remove('visible');
    setTimeout(() => el.remove(), 400);
  }, 3000);
}

// ─── UTILS ───────────────────────────────────────────────────────
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
