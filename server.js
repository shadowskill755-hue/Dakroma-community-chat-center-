const express  = require('express');
const http     = require('http');
const { Server } = require('socket.io');
const fs       = require('fs');
const path     = require('path');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin:'*', methods:['GET','POST'] } });

const PORT        = process.env.PORT || 3000;
const NAMES_FILE  = path.join(__dirname, 'names.json');
const LB_FILE     = path.join(__dirname, 'leaderboard.json');
const COOLDOWN_MS = 20 * 24 * 60 * 60 * 1000;

// ── PERSISTENCE ───────────────────────────────────────────────
let namesData = {};
try { if (fs.existsSync(NAMES_FILE)) namesData = JSON.parse(fs.readFileSync(NAMES_FILE,'utf8')); }
catch(e) { namesData = {}; }
function saveNames() { fs.writeFileSync(NAMES_FILE, JSON.stringify(namesData,null,2)); }

// ── GLOBAL LEADERBOARD ────────────────────────────────────────
let globalLb = { distance:[], wins:[] };
try { if (fs.existsSync(LB_FILE)) globalLb = JSON.parse(fs.readFileSync(LB_FILE,'utf8')); }
catch(e) { globalLb = { distance:[], wins:[] }; }
function saveLb() { fs.writeFileSync(LB_FILE, JSON.stringify(globalLb,null,2)); }

function updateDistanceLb(username, color, dist) {
  const idx = globalLb.distance.findIndex(e=>e.username===username);
  if (idx>=0) { if (dist > globalLb.distance[idx].value) { globalLb.distance[idx].value=dist; globalLb.distance[idx].color=color; } }
  else globalLb.distance.push({username,color,value:dist});
  globalLb.distance.sort((a,b)=>b.value-a.value);
  globalLb.distance = globalLb.distance.slice(0,20);
  saveLb();
  io.emit('globalLb', globalLb);
}

function updateWinsLb(username, color) {
  const idx = globalLb.wins.findIndex(e=>e.username===username);
  if (idx>=0) { globalLb.wins[idx].value++; globalLb.wins[idx].color=color; }
  else globalLb.wins.push({username,color,value:1});
  globalLb.wins.sort((a,b)=>b.value-a.value);
  globalLb.wins = globalLb.wins.slice(0,20);
  saveLb();
  io.emit('globalLb', globalLb);
}

// ── TRACK GENERATION ─────────────────────────────────────────
function mkRng(seed) {
  let s = seed >>> 0;
  return () => { s ^= s<<13; s ^= s>>17; s ^= s<<5; return (s>>>0)/0xFFFFFFFF; };
}

function generateTrack(seed) {
  const rng = mkRng(seed);
  const pts = [];
  let x = 0, y = 380, dy = 0;
  for (let i = 0; i < 10; i++) { pts.push({x,y}); x += 80; }
  while (x < 10000) {
    dy += (rng() - 0.5) * 20;
    dy  = Math.max(-14, Math.min(14, dy));
    y  += dy;
    y   = Math.max(160, Math.min(500, y));
    pts.push({x,y});
    x += 80;
  }
  const checkpoints = [];
  for (let cx = 1500; cx < x - 500; cx += 1500) checkpoints.push(cx);
  const finishX = x - 400;

  // Generate obstacles
  const rng2 = mkRng(seed + 7);
  const obstacles = [];
  let ox = 600;
  while (ox < finishX - 200) {
    const type = Math.floor(rng2() * 5);
    const terrain = getTerrainFromPts(pts, ox);
    if (type === 0) { // ramp
      obstacles.push({ id:`obs${ox}`, type:'ramp', x:ox, y:terrain.y, w:90, h:35 });
      ox += 500 + rng2()*300;
    } else if (type === 1) { // boost pad
      obstacles.push({ id:`obs${ox}`, type:'boost', x:ox, y:terrain.y, w:70, h:14 });
      ox += 400 + rng2()*200;
    } else if (type === 2) { // laser barrier
      obstacles.push({ id:`obs${ox}`, type:'laser', x:ox, y:terrain.y-160, w:12, h:160,
        period:2500+rng2()*2000, offset:rng2()*5000 });
      ox += 600 + rng2()*400;
    } else if (type === 3) { // moving platform
      obstacles.push({ id:`obs${ox}`, type:'platform', x:ox, baseY:terrain.y-80, w:100, h:16,
        range:80, spd:0.002+rng2()*0.002, phase:rng2()*Math.PI*2 });
      ox += 500 + rng2()*300;
    } else { // gap/trap
      obstacles.push({ id:`obs${ox}`, type:'gap', x:ox, y:terrain.y, w:60 });
      ox += 700 + rng2()*400;
    }
  }

  return { points:pts, finishX, checkpoints, seed, obstacles };
}

function getTerrainFromPts(pts, x) {
  for (let i=0;i<pts.length-1;i++) {
    if (x>=pts[i].x && x<pts[i+1].x) {
      const t=(x-pts[i].x)/(pts[i+1].x-pts[i].x);
      const y=pts[i].y*(1-t)+pts[i+1].y*t;
      const angle=Math.atan2(pts[i+1].y-pts[i].y,pts[i+1].x-pts[i].x);
      return {y,angle};
    }
  }
  return {y:pts[pts.length-1]?.y||400,angle:0};
}

// ── PHYSICS ───────────────────────────────────────────────────
const GRAVITY=0.5, ENGINE=0.3, BRAKE_F=0.5, MAX_SPD=10, FRIC=0.97;
const W_RADIUS=14, CAR_W=52;

function getTerrainAt(track, x) { return getTerrainFromPts(track.points, x); }

function checkObstacleHit(track, p, now) {
  for (const o of track.obstacles) {
    if (Math.abs(o.x - p.x) > 200) continue;
    if (o.type === 'boost') {
      if (p.x+CAR_W > o.x && p.x < o.x+o.w && Math.abs(p.y - o.y) < 30) {
        return 'boost';
      }
    } else if (o.type === 'laser') {
      const on = Math.sin((now+o.offset)/o.period*Math.PI*2) > 0;
      if (on && p.x+CAR_W > o.x && p.x < o.x+o.w && p.y > o.y && p.y < o.y+o.h) {
        return 'laser';
      }
    } else if (o.type === 'ramp') {
      if (p.x+CAR_W > o.x && p.x < o.x+o.w) {
        const rampProgress = (p.x - o.x) / o.w;
        const rampY = o.y - rampProgress * o.h;
        if (Math.abs(p.y - rampY) < 20) return 'ramp';
      }
    }
  }
  return null;
}

// ── RACE SYSTEM ───────────────────────────────────────────────
let race = null;
const lobby   = new Map();
const chatLog = [];
const MIN_TO_START = 1;
const LOBBY_WAIT   = 8000;

function newRace() {
  const seed = Math.floor(Math.random()*999999)+1;
  return { seed, track:generateTrack(seed), state:'waiting',
    players:new Map(), results:[], startTs:null, lobbyTimer:null, raceTimer:null };
}

function startCountdown() {
  if (!race||race.state!=='waiting') return;
  race.state='countdown';
  let n=3; io.emit('countdown',{n});
  const iv=setInterval(()=>{
    n--;
    if(n>0){io.emit('countdown',{n});}
    else{clearInterval(iv);beginRace();}
  },1000);
}

function beginRace() {
  if(!race)return;
  race.state='racing'; race.startTs=Date.now();
  let lane=0;
  for(const[id,p]of race.players){
    const sp=race.track.points[4];
    p.x=sp.x+lane*70; p.y=sp.y-W_RADIUS*2-12;
    p.vx=0;p.vy=0;p.angle=0;p.wheelAngle=0;
    p.alive=true;p.finished=false;p.checkpoint=0;p.progress=0;
    p.boosting=false;p.boostTs=0;
    lane++;
  }
  io.emit('raceBegin',{seed:race.seed,track:race.track,startTs:race.startTs});
  race.raceTimer=setTimeout(finishRace,180000);
}

function finishRace() {
  if(!race)return;
  clearTimeout(race.raceTimer);
  race.state='finished';
  const extra=[];
  for(const[id,p]of race.players){
    if(!race.results.find(r=>r.id===id))
      extra.push({id,username:p.username,color:p.color,time:null,progress:p.progress});
    // Update global distance lb
    updateDistanceLb(p.username,p.color,p.progress);
  }
  extra.sort((a,b)=>b.progress-a.progress);
  const allResults=[...race.results,...extra];
  io.emit('raceOver',{results:allResults});
  // Update wins for P1
  if(race.results.length>0){
    const winner=race.results[0];
    updateWinsLb(winner.username,winner.color);
    io.emit('sysMessage',`🏆 ${winner.username} WON THE RACE!`);
  }
  setTimeout(()=>{
    race=newRace();
    for(const[id,profile]of lobby) addToRace(id,profile);
    io.emit('lobbyUpdate',lobbyInfo());
  },8000);
}

function addToRace(id,profile){
  if(!race)return;
  const sp=race.track.points[4];
  race.players.set(id,{
    id,username:profile.username,color:profile.color||'#00ffff',
    x:sp.x,y:sp.y-60,vx:0,vy:0,angle:0,wheelAngle:0,
    alive:false,finished:false,checkpoint:0,progress:0,
    boosting:false,boostTs:0,
    input:{gas:false,brake:false}
  });
}

function lobbyInfo(){
  const plist=[...(race?.players.values()||[])].map(p=>({id:p.id,username:p.username,color:p.color}));
  return{state:race?.state||'waiting',playerCount:plist.length,players:plist,
    seed:race?.seed,waitingFor:Math.max(0,5-plist.length)};
}

race=newRace();

// ── PHYSICS TICK ──────────────────────────────────────────────
setInterval(()=>{
  if(!race||race.state!=='racing')return;
  const now=Date.now(); const snap={};
  for(const[id,p]of race.players){
    if(!p.alive||p.finished){snap[id]=serP(p);continue;}
    const t=getTerrainAt(race.track,p.x+CAR_W/2);
    const boostMult=p.boosting?1.8:1;
    if(p.input.gas){p.vx+=Math.cos(t.angle)*ENGINE*boostMult;p.vy+=Math.sin(t.angle)*ENGINE*0.4;}
    if(p.input.brake){p.vx-=Math.sign(p.vx)*BRAKE_F;if(Math.abs(p.vx)<.1)p.vx=0;}
    p.vy+=GRAVITY; p.vx*=FRIC; p.vy*=.92;
    const spd=Math.hypot(p.vx,p.vy);
    const maxS=MAX_SPD*(p.boosting?1.6:1);
    if(spd>maxS){p.vx=p.vx/spd*maxS;p.vy=p.vy/spd*maxS;}
    p.x+=p.vx; p.y+=p.vy;
    const gY=t.y-W_RADIUS*2-4;
    if(p.y>=gY){p.y=gY;p.vy=0;p.angle=t.angle;}
    p.wheelAngle=((p.wheelAngle||0)+p.vx*0.1)%(Math.PI*2);
    if(p.x<0){p.x=0;p.vx=0;}
    p.progress=Math.round(p.x);

    // Boost cooldown
    if(p.boosting&&now-p.boostTs>2000){p.boosting=false;}

    // Obstacle hits
    const hit=checkObstacleHit(race.track,p,now);
    if(hit==='boost'&&!p.boosting){p.boosting=true;p.boostTs=now;io.to(id).emit('boostActivated');}
    else if(hit==='laser'){p.alive=false;io.emit('playerDied',{id,username:p.username,cause:'laser'});}

    // Checkpoints
    const cps=race.track.checkpoints;
    for(let ci=p.checkpoint;ci<cps.length;ci++){
      if(p.x>=cps[ci]){
        p.checkpoint=ci+1;
        io.to(id).emit('cp',{index:ci,x:cps[ci],time:Math.round((now-race.startTs)/100)/10});
        break;
      }
    }

    // Finish
    if(p.x>=race.track.finishX&&!p.finished){
      p.finished=true;
      const t2=Math.round((now-race.startTs)/100)/10;
      const pos=race.results.length+1;
      race.results.push({id,username:p.username,color:p.color,time:t2,position:pos});
      io.emit('playerFinish',{id,username:p.username,color:p.color,time:t2,position:pos});
      if([...race.players.values()].every(pl=>pl.finished))finishRace();
    }
    snap[id]=serP(p);
  }
  const lb=[...race.players.values()].sort((a,b)=>b.progress-a.progress).slice(0,5)
    .map(p=>({username:p.username,color:p.color,progress:p.progress,finished:p.finished}));
  io.emit('raceState',{players:snap,leaderboard:lb,ts:now,
    elapsed:race.startTs?Math.round((now-race.startTs)/1000):0});
},50);

function serP(p){
  return{x:p.x,y:p.y,angle:p.angle,wheelAngle:p.wheelAngle,vx:p.vx,vy:p.vy,
    alive:p.alive,finished:p.finished,checkpoint:p.checkpoint,
    username:p.username,color:p.color,progress:p.progress,boosting:p.boosting};
}

// ── SOCKETS ───────────────────────────────────────────────────
io.on('connection',socket=>{
  console.log(`[+] ${socket.id}`);
  if(!namesData[socket.id]){
    namesData[socket.id]={username:`Racer_${socket.id.slice(0,5)}`,
      usernameLockedUntil:0,usernameChangedAt:0,color:'#00ffff'};
    saveNames();
  }
  lobby.set(socket.id,namesData[socket.id]);
  socket.emit('profileLoaded',{...namesData[socket.id],socketId:socket.id,now:Date.now()});
  socket.emit('chatHistory',chatLog.slice(-80));
  socket.emit('lobbyUpdate',lobbyInfo());
  socket.emit('globalLb',globalLb);
  io.emit('onlineCount',lobby.size);

  socket.on('saveName',({username,color})=>{
    const now=Date.now(),d=namesData[socket.id]||{};
    if(!username||username.trim().length<2||username.trim().length>20)
      return socket.emit('nameSaveError',{message:'Username must be 2–20 characters.'});
    if(d.usernameLockedUntil&&now<d.usernameLockedUntil)
      return socket.emit('nameSaveError',{message:`LOCKED until ${new Date(d.usernameLockedUntil).toLocaleDateString()}`});
    const clean=username.trim().replace(/[<>"']/g,'').slice(0,20);
    namesData[socket.id]={...d,username:clean,color:color||d.color||'#00ffff',
      usernameLockedUntil:now+COOLDOWN_MS,usernameChangedAt:now};
    saveNames();
    lobby.set(socket.id,namesData[socket.id]);
    if(race?.players.has(socket.id)){race.players.get(socket.id).username=clean;race.players.get(socket.id).color=namesData[socket.id].color;}
    socket.emit('nameSaved',{...namesData[socket.id],now});
    io.emit('sysMessage',`RACER ${clean} IDENTIFIED`);
  });

  socket.on('updateColor',({color})=>{
    if(!color)return;
    if(namesData[socket.id]){namesData[socket.id].color=color;saveNames();}
    lobby.set(socket.id,namesData[socket.id]);
    if(race?.players.has(socket.id))race.players.get(socket.id).color=color;
    socket.emit('colorUpdated',{color});
  });

  socket.on('joinRace',()=>{
    if(!race)race=newRace();
    if(race.state==='racing'){socket.emit('spectating',{track:race.track,seed:race.seed});return;}
    addToRace(socket.id,namesData[socket.id]);
    socket.emit('joinedLobby',{track:race.track,seed:race.seed,state:race.state});
    io.emit('lobbyUpdate',lobbyInfo());
    io.emit('sysMessage',`RACER ${namesData[socket.id].username} JOINED LOBBY`);
    if(race.state==='waiting'&&race.players.size>=MIN_TO_START&&!race.lobbyTimer){
      race.lobbyTimer=setTimeout(()=>{if(race&&race.state==='waiting'&&race.players.size>=MIN_TO_START)startCountdown();},LOBBY_WAIT);
    }
  });

  socket.on('leaveRace',()=>{race?.players.delete(socket.id);io.emit('lobbyUpdate',lobbyInfo());});
  socket.on('input',inp=>{
    const p=race?.players.get(socket.id);if(!p)return;
    p.input.gas=!!inp.gas;p.input.brake=!!inp.brake;
    if(!p.alive&&race?.state==='racing')p.alive=true;
  });

  socket.on('chatMessage',({message})=>{
    if(!message?.trim()||message.length>200)return;
    const pr=namesData[socket.id];
    const msg={id:`${socket.id}_${Date.now()}`,socketId:socket.id,
      username:pr?.username||'UNKNOWN',color:pr?.color||'#00ffff',
      message:message.trim().replace(/</g,'&lt;').replace(/>/g,'&gt;'),ts:Date.now()};
    chatLog.push(msg);if(chatLog.length>200)chatLog.shift();
    io.emit('chatMessage',msg);
  });

  socket.on('typing',()=>socket.broadcast.emit('userTyping',{socketId:socket.id,username:namesData[socket.id]?.username,color:namesData[socket.id]?.color}));
  socket.on('stopTyping',()=>socket.broadcast.emit('userStopTyping',{socketId:socket.id}));
  socket.on('ping_custom',()=>socket.emit('pong_custom'));

  socket.on('disconnect',()=>{
    const name=namesData[socket.id]?.username||socket.id;
    lobby.delete(socket.id);race?.players.delete(socket.id);
    io.emit('sysMessage',`RACER ${name} LEFT`);
    io.emit('onlineCount',lobby.size);io.emit('lobbyUpdate',lobbyInfo());
    console.log(`[-] ${name}`);
  });
});

app.use(express.static(path.join(__dirname,'public')));
server.listen(PORT,'0.0.0.0',()=>{
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  DAKROMA MASTER PIECE v7 — CYBER RACING  ║');
  console.log('║  Engine by Claude · Coded by David K     ║');
  console.log(`║  http://localhost:${PORT}                    ║`);
  console.log('╚══════════════════════════════════════════╝\n');
});
