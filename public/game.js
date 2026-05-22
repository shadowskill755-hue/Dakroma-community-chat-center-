/* ═══════════════════════════════════════════════
   DAKROMA MASTER PIECE v7 — CYBER HILL RACING
   ═══════════════════════════════════════════════ */

const SOCKET_URL =
  window.location.hostname==='localhost'||window.location.hostname==='127.0.0.1'
    ? undefined : 'https://YOUR-RENDER-BACKEND.onrender.com';

const socket = io(SOCKET_URL,{
  reconnection:true,reconnectionAttempts:Infinity,
  reconnectionDelay:1000,timeout:20000
});

// ── STATE ─────────────────────────────────────────────────────
let myId=null, myProfile={username:'',color:'#00ffff',usernameLockedUntil:0};
let raceState={players:{},leaderboard:[]};
let track=null, inRace=false;
let cameraX=0, targetCamX=0;
let keys={gas:false,brake:false};
let lastInpTs=0, pingTs=0, cdTimer=null;
let typingMap={}, raf=null;
let bestTime=null, checkpoint=0, elapsed=0;
let lobbyData={state:'waiting',playerCount:0,players:[],waitingFor:5};
let globalLb={distance:[],wins:[]};
let raceResults=[];
const interp={};
// Day/night
let worldTime=0; // 0=day, 0.5=night, cycles
const DAY_SPEED=0.0002;
let boostActive=false, boostTs=0;

let canvas, ctx, pCanvas, pCtx;
const particles=[];
const exhaustParticles=[];

// ── PARTICLES ─────────────────────────────────────────────────
function initParticles(){
  pCanvas=document.getElementById('particleCanvas');if(!pCanvas)return;
  pCtx=pCanvas.getContext('2d');
  resizePCanvas();window.addEventListener('resize',resizePCanvas);
  for(let i=0;i<50;i++)spawnP();animP();
}
function resizePCanvas(){if(pCanvas){pCanvas.width=innerWidth;pCanvas.height=innerHeight;}}
function spawnP(){particles.push({x:Math.random()*innerWidth,y:Math.random()*innerHeight,
  r:Math.random()*1.4+.3,vx:(Math.random()-.5)*.35,vy:-Math.random()*.45-.1,
  a:Math.random()*.8,c:Math.random()>.5?'#00ffff':'#00ff88'});}
function animP(){
  if(!pCtx)return;pCtx.clearRect(0,0,pCanvas.width,pCanvas.height);
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];p.x+=p.vx;p.y+=p.vy;p.a-=.0025;
    if(p.a<=0||p.y<-10){particles.splice(i,1);spawnP();continue;}
    pCtx.save();pCtx.globalAlpha=p.a*.55;pCtx.shadowBlur=5;pCtx.shadowColor=p.c;
    pCtx.fillStyle=p.c;pCtx.beginPath();pCtx.arc(p.x,p.y,p.r,0,Math.PI*2);pCtx.fill();pCtx.restore();
  }
  requestAnimationFrame(animP);
}

// ── INTRO ─────────────────────────────────────────────────────
function runIntro(){
  const el=document.getElementById('introScreen');if(!el){showHomeSafe();return;}
  setTimeout(()=>{el.style.transition='opacity 0.8s';el.style.opacity='0';
    setTimeout(()=>{el.classList.remove('active');showHomeSafe();},800);},6000);
}
function showHomeSafe(){
  showScreen('homeScreen');
  document.getElementById('audioWidget').style.display='flex';
  loadProgress();SFX.start();
}

// ── PROGRESS ──────────────────────────────────────────────────
function loadProgress(){
  const s=Progress.getAll();
  if(s.bestTime){bestTime=s.bestTime;
    setEl('bestTimeVal',s.bestTime+'s');
    const bar=document.getElementById('bestTimeBar');if(bar)bar.style.display='block';}
  if(s.username&&!myProfile.username){myProfile.username=s.username;myProfile.color=s.color||'#00ffff';refreshProfile();}
}

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded',()=>{
  canvas=document.getElementById('gameCanvas');
  ctx=canvas.getContext('2d');
  resizeCanvas();window.addEventListener('resize',resizeCanvas);
  initParticles();
  setupHome();setupModals();setupAudioWidget();
  setupChat();setupBot();setupGameUI();setupKeys();setupTouchBtns();
  document.addEventListener('click',()=>{SFX.init();SFX.resume();},{once:true});
  document.addEventListener('touchstart',()=>{SFX.init();SFX.resume();},{once:true});
  setInterval(()=>{pingTs=Date.now();socket.emit('ping_custom');},2000);
  runIntro();
});

// ── SOCKET EVENTS ─────────────────────────────────────────────
socket.on('connect',()=>{myId=socket.id;toast('◈ CONNECTED TO GRID','success');SFX.play('connected');});
socket.on('disconnect',()=>toast('◈ SIGNAL LOST','error'));
socket.on('pong_custom',()=>{const el=document.getElementById('pingVal');if(el)el.textContent=Date.now()-pingTs;});
socket.on('profileLoaded',p=>{myProfile={...p};refreshProfile();Progress.saveProfile(p.username,p.color);});
socket.on('nameSaved',d=>{myProfile.username=d.username;myProfile.color=d.color;
  myProfile.usernameLockedUntil=d.usernameLockedUntil;
  refreshProfile();Progress.saveProfile(d.username,d.color);
  SFX.play('saveName');toast('◈ IDENTITY SAVED','success');});
socket.on('nameSaveError',d=>{SFX.play('notif');toast('⚠ '+d.message,'error');});
socket.on('colorUpdated',d=>{myProfile.color=d.color;refreshAvatar();SFX.play('colorPick');});
socket.on('obstacleMap',obs=>{if(track)track.obstacles=obs;});

socket.on('globalLb',data=>{
  globalLb=data;
  renderGlobalLb();
});

socket.on('lobbyUpdate',data=>{lobbyData=data;updateLobbyUI();});

socket.on('joinedLobby',data=>{
  track=data.track;inRace=false;
  showScreen('gameScreen');SFX.play('playerJoin');
  showLobbyOverlay();
  if(!raf)raf=requestAnimationFrame(loop);
});

socket.on('spectating',data=>{
  track=data.track;inRace=false;
  showScreen('gameScreen');showSpectateMsg();
  if(!raf)raf=requestAnimationFrame(loop);
});

socket.on('countdown',({n})=>{SFX.play('notif');showCountdown(n);});

socket.on('raceBegin',data=>{
  track=data.track;inRace=true;
  hideLobbyOverlay();SFX.play('playBtn');
  toast('◈ RACE STARTED — GO!','success');
});

socket.on('raceState',s=>{
  for(const id in s.players){
    if(id===myId)continue;
    if(!interp[id])interp[id]={...s.players[id]};
    else{interp[id].tx=s.players[id].x;interp[id].ty=s.players[id].y;
      interp[id].ta=s.players[id].angle;}
  }
  for(const id in interp){if(!s.players[id])delete interp[id];}
  raceState=s;elapsed=s.elapsed||0;
  refreshLb(s.leaderboard);
  const me=s.players[myId];
  if(me){
    setEl('hudScore',me.progress+'m');setEl('dScore',me.progress);
    setEl('hudTimer',elapsed+'s');
    if(me.boosting&&!boostActive){boostActive=true;boostTs=Date.now();}
    else if(!me.boosting)boostActive=false;
  }
});

socket.on('cp',({index,x,time})=>{
  checkpoint=index+1;setEl('hudCp',checkpoint);
  showCpToast();SFX.play('checkpoint');
  Progress.save({checkpoint,lastTime:time});
  toast(`◈ CHECKPOINT ${checkpoint} — ${time}s`,'success');
});

socket.on('boostActivated',()=>{
  boostActive=true;boostTs=Date.now();
  SFX.play('boost');toast('⚡ NITRO BOOST!','success');
});

socket.on('playerFinish',({id,username,color,time,position})=>{
  if(id===myId){SFX.play('checkpoint');
    toast(`◈ YOU FINISHED! P${position} — ${time}s`,'success');
    if(!bestTime||time<bestTime){bestTime=time;Progress.saveBestScore(time);
      setEl('bestTimeVal',time+'s');
      const bar=document.getElementById('bestTimeBar');if(bar)bar.style.display='block';}
  }else{toast(`◈ ${username} FINISHED! P${position}—${time}s`,'info');}
});

socket.on('playerDied',({id,username,cause})=>{
  if(id===myId){SFX.play('laser');toast('◈ HIT LASER — SIGNAL LOST','error');}
  else toast(`◈ ${username} HIT LASER`,'info');
});

socket.on('raceOver',({results})=>{
  raceResults=results;inRace=false;SFX.play('death');showResultsOverlay(results);
});

socket.on('chatMessage',m=>{appendChat(m);if(m.socketId!==myId)SFX.play('chatRecv');});
socket.on('chatHistory',ms=>{ms.forEach(m=>appendChat(m,true));scrollChat();});
socket.on('userTyping',({socketId,username,color})=>showTyping(socketId,username,color));
socket.on('userStopTyping',({socketId})=>{delete typingMap[socketId];renderTyping();});
socket.on('sysMessage',msg=>{toast('◈ '+msg,'info');SFX.play('notif');});
socket.on('onlineCount',n=>document.querySelectorAll('.online-count').forEach(e=>e.textContent=n));

// ── GLOBAL LEADERBOARD UI ─────────────────────────────────────
function renderGlobalLb(){
  const distEl=document.getElementById('lbDistList');
  const winsEl=document.getElementById('lbWinsList');
  const medals=['🥇','🥈','🥉','4️⃣','5️⃣'];

  if(distEl){
    distEl.innerHTML=globalLb.distance.slice(0,5).map((e,i)=>`
      <div class="glb-row">
        <span class="glb-medal">${medals[i]||i+1}</span>
        <span class="glb-name" style="color:${e.color}">${esc(e.username)}</span>
        <span class="glb-val">${e.value}m</span>
      </div>`).join('')||'<div class="lb-empty">NO DATA YET</div>';
  }
  if(winsEl){
    winsEl.innerHTML=globalLb.wins.slice(0,5).map((e,i)=>`
      <div class="glb-row">
        <span class="glb-medal">${medals[i]||i+1}</span>
        <span class="glb-name" style="color:${e.color}">${esc(e.username)}</span>
        <span class="glb-val">${e.value}W</span>
      </div>`).join('')||'<div class="lb-empty">NO DATA YET</div>';
  }

  // Also update home lb
  const homeLb=document.getElementById('homeLb');
  if(homeLb&&globalLb.distance.length>0&&lobbyData.players.length===0){
    homeLb.innerHTML=globalLb.distance.slice(0,5).map((e,i)=>`
      <div class="lb-row">
        <span class="lb-rank">${medals[i]||i+1}</span>
        <span class="lb-name" style="color:${e.color}">${esc(e.username)}</span>
        <span class="lb-score">${e.value}m</span>
      </div>`).join('');
  }
}

// ── SCREEN ────────────────────────────────────────────────────
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── HOME ──────────────────────────────────────────────────────
function setupHome(){
  bindClick('playBtn',startFlow,'playBtn');
  bindClick('navGame',startFlow,'click');
  bindClick('saveNameBtn',doSaveName,'click');
  bindClick('editProfileBtn',openEdit,'click');
  document.querySelectorAll('.clr-dot:not(.edit-clr)').forEach(d=>{
    d.onclick=()=>{SFX.play('colorPick');
      document.querySelectorAll('.clr-dot:not(.edit-clr)').forEach(x=>x.classList.remove('selected'));
      d.classList.add('selected');myProfile.color=d.dataset.c;refreshAvatar();
      socket.emit('updateColor',{color:myProfile.color});};
  });
}
function bindClick(id,fn,sfx){const el=document.getElementById(id);if(!el)return;el.addEventListener('click',()=>{SFX.play(sfx);fn();});}
function doSaveName(){const v=document.getElementById('usernameInput')?.value.trim();
  if(!v){toast('⚠ ENTER RACER NAME','warning');return;}
  socket.emit('saveName',{username:v,color:myProfile.color});}
function refreshProfile(){
  const now=Date.now(),locked=myProfile.usernameLockedUntil&&now<myProfile.usernameLockedUntil;
  const inp=document.getElementById('usernameInput');
  const sBtn=document.getElementById('saveNameBtn');
  const lk=document.getElementById('lockStatus');
  const cd=document.getElementById('countdown');
  const wr=document.getElementById('saveWarning');
  if(inp){inp.value=myProfile.username||'';inp.disabled=locked;}
  if(sBtn)sBtn.disabled=locked;
  if(lk){lk.textContent=locked?'⬛ LOCKED':'◉ UNLOCKED';lk.className='lock-badge '+(locked?'locked':'unlocked');}
  if(wr)wr.style.display=locked?'none':'block';
  if(cdTimer)clearInterval(cdTimer);
  if(locked){cdTimer=setInterval(()=>{
    const rem=myProfile.usernameLockedUntil-Date.now();
    if(rem<=0){clearInterval(cdTimer);refreshProfile();return;}
    const d=Math.floor(rem/86400000),h=Math.floor((rem%86400000)/3600000);
    const m=Math.floor((rem%3600000)/60000),s=Math.floor((rem%60000)/1000);
    if(cd)cd.textContent=`⏱ ${d}D ${h}H ${m}M ${s}S`;},1000);
  }else{if(cd)cd.textContent='';}
  refreshAvatar();
  document.querySelectorAll('.clr-dot:not(.edit-clr)').forEach(d=>d.classList.toggle('selected',d.dataset.c===myProfile.color));
}
function refreshAvatar(){
  const c=myProfile.color||'#00ffff';
  ['avatarBox','editAvBox'].forEach(id=>{const el=document.getElementById(id);if(!el)return;
    const inner=el.querySelector('.avatar-inner');const ring=el.querySelector('.avatar-ring');
    if(inner)inner.style.background=c;if(ring){ring.style.borderColor=c;ring.style.boxShadow=`0 0 16px ${c}`;}});
  ['avatarName','editAvName'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=myProfile.username||'UNKNOWN';});
}
function openEdit(){
  const now=Date.now(),locked=myProfile.usernameLockedUntil&&now<myProfile.usernameLockedUntil;
  const eu=document.getElementById('editUname');const el_=document.getElementById('editLockLine');
  if(eu){eu.value=myProfile.username||'';eu.disabled=locked;}
  if(el_){el_.textContent=locked?`⬛ LOCKED — ${new Date(myProfile.usernameLockedUntil).toLocaleDateString()}`:'◉ CAN CHANGE';
    el_.className='lock-badge '+(locked?'locked':'unlocked');}
  document.querySelectorAll('.edit-clr').forEach(d=>{
    d.classList.toggle('selected',d.dataset.c===myProfile.color);
    d.onclick=()=>{SFX.play('colorPick');document.querySelectorAll('.edit-clr').forEach(x=>x.classList.remove('selected'));
      d.classList.add('selected');myProfile.color=d.dataset.c;refreshAvatar();};});
  refreshAvatar();document.getElementById('editModal').classList.add('open');
}

// ── LOBBY UI ──────────────────────────────────────────────────
function updateLobbyUI(){
  const lb=document.getElementById('homeLb');
  if(lb&&lobbyData.players.length>0){
    lb.innerHTML=lobbyData.players.map((p,i)=>`
      <div class="lb-row"><span class="lb-rank">P${i+1}</span>
      <span class="lb-name" style="color:${p.color}">${esc(p.username)}</span>
      <span class="lb-score" style="color:var(--muted);font-size:10px">READY</span></div>`).join('');
  } else if(lb&&lobbyData.players.length===0){renderGlobalLb();}
  const wt=document.getElementById('waitingText');
  if(wt)wt.textContent=lobbyData.waitingFor>0?`WAITING FOR ${lobbyData.waitingFor} MORE`:'STARTING SOON…';
  updateInGameLobby();
}
function showLobbyOverlay(){const ov=document.getElementById('lobbyOverlay');if(ov)ov.style.display='flex';updateInGameLobby();}
function hideLobbyOverlay(){
  const ov=document.getElementById('lobbyOverlay');if(ov)ov.style.display='none';
  const cd=document.getElementById('countdownOverlay');if(cd)cd.style.display='none';
}
function updateInGameLobby(){
  const list=document.getElementById('lobbyPlayerList');if(!list)return;
  list.innerHTML=lobbyData.players.map(p=>`
    <div style="display:flex;align-items:center;gap:8px;padding:4px 0">
      <div style="width:10px;height:10px;border-radius:2px;background:${p.color};box-shadow:0 0 6px ${p.color}"></div>
      <span style="font-size:12px;color:#fff;font-family:Orbitron,monospace">${esc(p.username)}</span>
    </div>`).join('');
  const wt=document.getElementById('lobbyWaitText');
  if(wt)wt.textContent=lobbyData.waitingFor>0?`WAITING FOR ${lobbyData.waitingFor} MORE...`:'STARTING SOON…';
}
function showCountdown(n){
  hideLobbyOverlay();
  const ov=document.getElementById('countdownOverlay');const num=document.getElementById('countdownNum');
  if(ov)ov.style.display='flex';
  if(num){num.textContent=n;num.style.animation='none';requestAnimationFrame(()=>num.style.animation='cdPop .9s ease-out');}
}
function showSpectateMsg(){toast('◈ RACE IN PROGRESS — SPECTATING','info');}
function showResultsOverlay(results){
  const ov=document.getElementById('resultsOverlay');const list=document.getElementById('resultsList');if(!ov||!list)return;
  list.innerHTML=results.map((r,i)=>`
    <div class="result-row"><span class="res-pos">P${i+1}</span>
    <span class="res-name" style="color:${r.color}">${esc(r.username)}</span>
    <span class="res-time">${r.time?r.time+'s':'DNF'}</span></div>`).join('');
  ov.style.display='flex';
}

// ── MODALS ────────────────────────────────────────────────────
function setupModals(){
  [['chatClose','chatModal'],['botClose','botModal'],['editClose','editModal'],['settingsClose','settingsModal'],['lbClose','lbModal']].forEach(([b,m])=>{
    const el=document.getElementById(b);if(!el)return;
    el.onclick=()=>{SFX.play('click');document.getElementById(m).classList.remove('open');};
  });
  bindClick('openBot',()=>document.getElementById('botModal').classList.add('open'),'click');
  bindClick('openChat',()=>document.getElementById('chatModal').classList.add('open'),'click');
  bindClick('openLb',()=>{document.getElementById('lbModal').classList.add('open');renderGlobalLb();},'click');
  const editSave=document.getElementById('editSave');
  if(editSave)editSave.onclick=()=>{SFX.play('saveName');
    const nm=document.getElementById('editUname')?.value.trim();
    const locked=myProfile.usernameLockedUntil&&Date.now()<myProfile.usernameLockedUntil;
    if(!locked&&nm)socket.emit('saveName',{username:nm,color:myProfile.color});
    else socket.emit('updateColor',{color:myProfile.color});
    document.getElementById('editModal').classList.remove('open');};
  const settingsBtn=document.getElementById('settingsBtn');
  if(settingsBtn)settingsBtn.onclick=()=>{SFX.play('settings');document.getElementById('settingsModal').classList.add('open');};
  const clearBtn=document.getElementById('clearProgressBtn');
  if(clearBtn)clearBtn.onclick=()=>{SFX.play('click');Progress.clear();toast('◈ PROGRESS CLEARED','info');document.getElementById('settingsModal').classList.remove('open');};
  document.querySelectorAll('.modal').forEach(m=>{
    m.addEventListener('click',e=>{if(e.target===m){SFX.play('click');m.classList.remove('open');}});});
}

// ── AUDIO ─────────────────────────────────────────────────────
function setupAudioWidget(){
  const muteBtn=document.getElementById('muteBtn');
  const masterSl=document.getElementById('masterSlider');
  const bgmSl=document.getElementById('bgmSlider2');
  const sfxSl=document.getElementById('sfxSlider2');
  if(muteBtn)muteBtn.onclick=()=>{const m=SFX.toggleMute();muteBtn.textContent=m?'🔇':'🔊';};
  if(masterSl)masterSl.oninput=e=>SFX.setMasterVol(parseFloat(e.target.value));
  if(bgmSl)bgmSl.oninput=e=>SFX.setBgmVol(parseFloat(e.target.value));
  if(sfxSl)sfxSl.oninput=e=>SFX.setSfxVol(parseFloat(e.target.value));
  const vols=SFX.getVols();
  if(masterSl)masterSl.value=vols.master;if(bgmSl)bgmSl.value=vols.bgm;if(sfxSl)sfxSl.value=vols.sfx;
  if(muteBtn&&SFX.isMuted())muteBtn.textContent='🔇';
}

// ── LOADING FLOW ──────────────────────────────────────────────
function startFlow(){
  if(!myProfile.username){toast('⚠ SET RACER NAME FIRST','warning');return;}
  showScreen('loadingScreen');SFX.play('playBtn');
  const steps=[
    {text:'🔌 CONNECTING…',label:'SERVER'},
    {text:'👥 FINDING RACERS…',label:'LOBBY'},
    {text:'🌍 GENERATING TRACK…',label:'TRACK'},
    {text:'⚡ READY TO RACE…',label:'GO'}
  ];
  const stepsEl=document.getElementById('ldSteps');
  const txt=document.getElementById('ldText');const bar=document.getElementById('ldBar');
  if(stepsEl)stepsEl.innerHTML=steps.map(s=>`<div class="ld-step">▸ ${s.label}</div>`).join('');
  let i=0;
  function tick(){
    if(i<steps.length){
      if(txt)txt.textContent=steps[i].text;
      if(bar)bar.style.width=`${((i+1)/steps.length)*100}%`;
      stepsEl?.querySelectorAll('.ld-step')[i]?.classList.add('done');
      i++;setTimeout(tick,700);
    }else socket.emit('joinRace');
  }tick();
}

function leaveGame(){
  SFX.play('playerLeave');inRace=false;
  if(raf){cancelAnimationFrame(raf);raf=null;}
  socket.emit('leaveRace');
  ['lobbyOverlay','resultsOverlay','deathOverlay'].forEach(id=>{
    const el=document.getElementById(id);if(el)el.style.display='none';});
  showScreen('homeScreen');
}
window.leaveGame=leaveGame;

function resizeCanvas(){
  if(!canvas)return;
  const dock=window.innerWidth<=600?100:74;
  canvas.width=innerWidth;canvas.height=Math.max(200,innerHeight-dock);
}

// ── GAME LOOP ─────────────────────────────────────────────────
function loop(){
  const now=Date.now();
  if(now-lastInpTs>50){socket.emit('input',{...keys});lastInpTs=now;}
  for(const id in interp){const b=interp[id];
    if(b.tx!==undefined)b.x+=(b.tx-b.x)*.25;
    if(b.ty!==undefined)b.y+=(b.ty-b.y)*.25;
    if(b.ta!==undefined)b.angle+=(b.ta-b.angle)*.25;}
  worldTime=(worldTime+DAY_SPEED)%1;
  render(now);
  raf=requestAnimationFrame(loop);
}

// ── RENDER ────────────────────────────────────────────────────
function render(now){
  const W=canvas.width,H=canvas.height;
  ctx.fillStyle=getSkyColor();ctx.fillRect(0,0,W,H);
  const me=raceState.players[myId];
  if(me){targetCamX=me.x-W*.28;if(targetCamX<0)targetCamX=0;cameraX+=(targetCamX-cameraX)*.09;}
  ctx.save();ctx.translate(-Math.round(cameraX),0);
  drawSky(W,H,now);
  if(track){drawTrack(W,H);drawObstacles(now);drawFinishLine();drawTrackCheckpoints(W);}
  drawExhaustParticles(now);
  drawCars(H,now);
  ctx.restore();
  drawHudOverlay(me,W,H);
}

// ── DAY/NIGHT ─────────────────────────────────────────────────
function getSkyColor(){
  const t=worldTime;
  if(t<0.25){// day
    const bl=t/0.25;return lerpColor('#001428','#000a18',bl);}
  else if(t<0.5){// sunset
    const bl=(t-0.25)/0.25;return lerpColor('#000a18','#0a0415',bl);}
  else if(t<0.75){// night
    return '#000208';}
  else{// dawn
    const bl=(t-0.75)/0.25;return lerpColor('#000208','#001428',bl);}
}
function lerpColor(a,b,t){
  const ah=parseInt(a.slice(1),16),bh=parseInt(b.slice(1),16);
  const ar=(ah>>16)&0xff,ag=(ah>>8)&0xff,ab=ah&0xff;
  const br=(bh>>16)&0xff,bg=(bh>>8)&0xff,bb=bh&0xff;
  const rr=Math.round(ar+(br-ar)*t),rg=Math.round(ag+(bg-ag)*t),rb=Math.round(ab+(bb-ab)*t);
  return `#${((rr<<16)|(rg<<8)|rb).toString(16).padStart(6,'0')}`;
}
function isNight(){return worldTime>0.4&&worldTime<0.85;}

function drawSky(W,H,now){
  const night=isNight();
  const cx=Math.floor(cameraX);

  // Gradient sky
  const grad=ctx.createLinearGradient(cx,0,cx,H*.7);
  if(night){
    grad.addColorStop(0,'#000208');grad.addColorStop(1,'#000a14');
  }else{
    grad.addColorStop(0,'#000d20');grad.addColorStop(1,'#001428');
  }
  ctx.fillStyle=grad;ctx.fillRect(cx,0,W,H*.7);

  // Stars (visible at night)
  const starAlpha=night?0.8:0.15;
  ctx.fillStyle=`rgba(200,240,255,${starAlpha})`;
  for(let i=0;i<40;i++){
    const sx=((i*137+cx*.03)%W)+cx;
    const sy=((i*83)%200)+10;
    const sr=i%5===0?1.8:.7;
    const twinkle=Math.sin(now*.002+i)*.3+.7;
    ctx.globalAlpha=starAlpha*twinkle;
    ctx.beginPath();ctx.arc(sx,sy,sr,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;

  // Moon at night
  if(night){
    const moonX=cx+W*.75;const moonY=60;
    ctx.save();ctx.shadowBlur=30;ctx.shadowColor='rgba(200,240,255,0.6)';
    ctx.fillStyle='rgba(200,240,255,0.85)';
    ctx.beginPath();ctx.arc(moonX,moonY,18,0,Math.PI*2);ctx.fill();
    // Moon crater
    ctx.fillStyle='rgba(150,190,220,0.4)';
    ctx.beginPath();ctx.arc(moonX+5,moonY-4,5,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }

  // Sun during day
  if(!night&&worldTime<0.35){
    const sunX=cx+W*.8;const sunY=50;
    ctx.save();ctx.shadowBlur=40;ctx.shadowColor='rgba(255,200,50,0.5)';
    ctx.fillStyle='rgba(255,220,80,0.7)';
    ctx.beginPath();ctx.arc(sunX,sunY,20,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }

  // Cyber grid on ground
  const gs=90,sx2=Math.floor(cameraX/gs)*gs;
  const gridAlpha=night?0.08:0.03;
  ctx.strokeStyle=`rgba(0,255,255,${gridAlpha})`;ctx.lineWidth=1;
  for(let x=sx2;x<cameraX+W+gs;x+=gs){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}

  // City silhouette
  const buildingAlpha=night?0.9:0.5;
  for(let i=0;i<12;i++){
    const bx=((i*170+Math.floor(cameraX/170)*170)%(W+400))+cameraX-200;
    const bh=60+(i%4)*55;
    ctx.fillStyle=`rgba(0,${night?8:15},${night?18:28},${buildingAlpha})`;
    ctx.fillRect(bx,H*.7-bh-20,55,bh);
    // Neon windows at night
    if(night){
      for(let r=0;r<3;r++)for(let c=0;c<2;c++){
        const wx=bx+7+c*22;const wy=H*.7-bh-20+10+r*20;
        const on=((i+r+c)%3!==0);
        if(on){ctx.fillStyle=`rgba(0,255,255,${Math.sin(now*.001+i+r+c)*.3+.3})`;
          ctx.fillRect(wx,wy,11,9);}
      }
    }else{
      ctx.strokeStyle='rgba(0,255,255,0.04)';ctx.lineWidth=1;
      ctx.strokeRect(bx,H*.7-bh-20,55,bh);
    }
  }
}

function drawTrack(W,H){
  const pts=track.points;
  const startI=Math.max(0,Math.floor(cameraX/80)-2);
  const endI=Math.min(pts.length-1,Math.floor((cameraX+W)/80)+2);

  // Ground fill
  ctx.beginPath();
  ctx.moveTo(pts[startI].x,H+50);
  ctx.lineTo(pts[startI].x,pts[startI].y);
  for(let i=startI+1;i<=endI;i++)ctx.lineTo(pts[i].x,pts[i].y);
  ctx.lineTo(pts[endI].x,H+50);ctx.closePath();
  const gGrad=ctx.createLinearGradient(0,300,0,H+50);
  gGrad.addColorStop(0,isNight()?'#051205':'#0a1a0a');
  gGrad.addColorStop(1,isNight()?'#020802':'#040d04');
  ctx.fillStyle=gGrad;ctx.fill();

  // Road surface
  ctx.beginPath();
  ctx.moveTo(pts[startI].x,pts[startI].y);
  for(let i=startI+1;i<=endI;i++)ctx.lineTo(pts[i].x,pts[i].y);
  ctx.strokeStyle='#1a3a1a';ctx.lineWidth=7;ctx.stroke();

  // Glowing road edge
  ctx.beginPath();
  ctx.moveTo(pts[startI].x,pts[startI].y);
  for(let i=startI+1;i<=endI;i++)ctx.lineTo(pts[i].x,pts[i].y);
  ctx.shadowBlur=isNight()?20:10;ctx.shadowColor='rgba(0,255,136,0.5)';
  ctx.strokeStyle=isNight()?'rgba(0,255,136,0.7)':'rgba(0,255,136,0.4)';
  ctx.lineWidth=3;ctx.stroke();ctx.shadowBlur=0;

  // Road markings
  ctx.setLineDash([30,20]);ctx.strokeStyle='rgba(255,255,255,0.07)';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(pts[startI].x,pts[startI].y-3);
  for(let i=startI+1;i<=endI;i++)ctx.lineTo(pts[i].x,pts[i].y-3);
  ctx.stroke();ctx.setLineDash([]);
}

function drawObstacles(now){
  if(!track||!track.obstacles)return;
  for(const o of track.obstacles){
    if(o.x<cameraX-200||o.x>cameraX+canvas.width+200)continue;
    const ter=getTerrainAt(o.x);

    if(o.type==='ramp'){
      ctx.save();ctx.shadowBlur=12;ctx.shadowColor='#00ff88';
      ctx.fillStyle='#0d2e0d';
      ctx.beginPath();ctx.moveTo(o.x,ter.y);ctx.lineTo(o.x+o.w,ter.y);
      ctx.lineTo(o.x+o.w,ter.y-o.h);ctx.closePath();ctx.fill();
      ctx.strokeStyle='#00ff88';ctx.lineWidth=2;ctx.stroke();
      ctx.fillStyle='#00ff88';ctx.font='10px Share Tech Mono';ctx.textAlign='center';
      ctx.fillText('RAMP',o.x+o.w/2,ter.y-o.h-6);ctx.restore();

    }else if(o.type==='boost'){
      const pulse=.6+Math.sin(now*.005)*.4;
      ctx.save();ctx.shadowBlur=20;ctx.shadowColor='#00ff88';
      ctx.fillStyle='#001a0a';ctx.fillRect(o.x,ter.y-14,o.w,14);
      ctx.fillStyle='#00ff88';ctx.fillRect(o.x,ter.y-14,o.w,3);
      ctx.globalAlpha=pulse;ctx.fillStyle='#00ff88';
      for(let ai=0;ai<3;ai++){const ay=ter.y-20-ai*6;
        ctx.beginPath();ctx.moveTo(o.x+o.w/2,ay-4);
        ctx.lineTo(o.x+o.w/2-5,ay);ctx.lineTo(o.x+o.w/2+5,ay);ctx.closePath();ctx.fill();}
      ctx.globalAlpha=1;ctx.font='9px Share Tech Mono';ctx.textAlign='center';
      ctx.fillStyle='#00ff88';ctx.fillText('BOOST',o.x+o.w/2,ter.y-1);ctx.restore();

    }else if(o.type==='laser'){
      const on=Math.sin((now+o.offset)/o.period*Math.PI*2)>0;
      ctx.save();
      if(on){ctx.shadowBlur=28;ctx.shadowColor='#ff2244';
        ctx.fillStyle='rgba(255,34,68,0.85)';ctx.fillRect(o.x,o.y,o.w,o.h);
        ctx.strokeStyle='#ff8888';ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(o.x+o.w/2,o.y);ctx.lineTo(o.x+o.w/2,o.y+o.h);ctx.stroke();
        ctx.fillStyle='rgba(255,255,255,.9)';ctx.fillRect(o.x-1,o.y,o.w+2,5);ctx.fillRect(o.x-1,o.y+o.h-5,o.w+2,5);
      }else{ctx.fillStyle='rgba(255,34,68,.07)';ctx.strokeStyle='rgba(255,34,68,.2)';ctx.lineWidth=1;
        ctx.fillRect(o.x,o.y,o.w,o.h);ctx.strokeRect(o.x,o.y,o.w,o.h);}
      ctx.restore();

    }else if(o.type==='platform'){
      const py=o.baseY+Math.sin(now*o.spd+o.phase)*o.range;
      ctx.save();ctx.shadowBlur=15;ctx.shadowColor='#aa44ff';
      ctx.fillStyle='#1a0a2e';ctx.fillRect(o.x,py,o.w,o.h);
      ctx.strokeStyle='#aa44ff';ctx.lineWidth=2;ctx.strokeRect(o.x,py,o.w,o.h);
      ctx.fillStyle='rgba(170,68,255,0.3)';ctx.fillRect(o.x,py,o.w,3);
      ctx.fillStyle='#aa44ff';ctx.font='9px Share Tech Mono';ctx.textAlign='center';
      ctx.fillText('PLATFORM',o.x+o.w/2,py-5);ctx.restore();

    }else if(o.type==='gap'){
      // Visual gap warning
      ctx.save();ctx.shadowBlur=10;ctx.shadowColor='#ff2244';
      ctx.strokeStyle='rgba(255,34,68,0.4)';ctx.lineWidth=2;
      ctx.setLineDash([6,4]);
      ctx.beginPath();ctx.moveTo(o.x,ter.y-80);ctx.lineTo(o.x,ter.y);ctx.stroke();
      ctx.beginPath();ctx.moveTo(o.x+o.w,ter.y-80);ctx.lineTo(o.x+o.w,ter.y);ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle='rgba(255,34,68,0.2)';ctx.fillRect(o.x,ter.y-80,o.w,80);
      ctx.fillStyle='#ff2244';ctx.font='9px Share Tech Mono';ctx.textAlign='center';
      ctx.fillText('⚠ GAP',o.x+o.w/2,ter.y-85);ctx.restore();
    }
  }
}

function drawFinishLine(){
  if(!track)return;
  const fx=track.finishX;
  if(fx<cameraX-50||fx>cameraX+canvas.width+50)return;
  const ter=getTerrainAt(fx);
  ctx.save();ctx.shadowBlur=20;ctx.shadowColor='#ffdd00';
  ctx.strokeStyle='#ffdd00';ctx.lineWidth=4;
  ctx.beginPath();ctx.moveTo(fx,ter.y-120);ctx.lineTo(fx,ter.y);ctx.stroke();
  const fw=80,fh=40,fy=ter.y-130;
  for(let r=0;r<fh/10;r++)for(let c=0;c<fw/10;c++){
    ctx.fillStyle=(r+c)%2===0?'#fff':'#000';ctx.fillRect(fx+c*10,fy+r*10,10,10);}
  ctx.strokeStyle='#ffdd00';ctx.lineWidth=2;ctx.strokeRect(fx,fy,fw,fh);
  ctx.fillStyle='#ffdd00';ctx.font='bold 14px Orbitron,monospace';ctx.textAlign='center';
  ctx.fillText('FINISH',fx+fw/2,fy-8);ctx.restore();
}

function drawTrackCheckpoints(W){
  if(!track)return;
  track.checkpoints.forEach((cx,i)=>{
    if(cx<cameraX-50||cx>cameraX+W+50)return;
    const ter=getTerrainAt(cx);const reached=i<checkpoint;
    ctx.save();ctx.shadowBlur=reached?18:8;ctx.shadowColor=reached?'#00ff88':'rgba(0,255,136,.4)';
    ctx.strokeStyle=reached?'#00ff88':'rgba(0,255,136,.3)';ctx.lineWidth=reached?3:2;
    ctx.setLineDash([8,6]);ctx.beginPath();ctx.moveTo(cx,ter.y-100);ctx.lineTo(cx,ter.y);ctx.stroke();
    ctx.setLineDash([]);ctx.fillStyle=reached?'#00ff88':'rgba(0,255,136,.5)';
    ctx.font='10px Share Tech Mono';ctx.textAlign='center';ctx.fillText(`CP${i+1}`,cx,ter.y-108);ctx.restore();
  });
}

function getTerrainAt(x){
  if(!track)return{y:400,angle:0};
  const pts=track.points;
  for(let i=0;i<pts.length-1;i++){
    if(x>=pts[i].x&&x<pts[i+1].x){
      const t=(x-pts[i].x)/(pts[i+1].x-pts[i].x);
      const y=pts[i].y*(1-t)+pts[i+1].y*t;
      const angle=Math.atan2(pts[i+1].y-pts[i].y,pts[i+1].x-pts[i].x);
      return{y,angle};
    }
  }
  return{y:track.points[track.points.length-1]?.y||400,angle:0};
}

// ── EXHAUST PARTICLES ─────────────────────────────────────────
function spawnExhaust(px,py,color,boosting){
  for(let i=0;i<(boosting?6:2);i++){
    exhaustParticles.push({
      x:px,y:py,
      vx:-2-Math.random()*(boosting?5:2),
      vy:(Math.random()-.5)*2,
      life:1,decay:boosting?.04:.07,
      r:boosting?5:3,
      color:boosting?'#ff6600':color
    });
  }
}
function drawExhaustParticles(now){
  for(let i=exhaustParticles.length-1;i>=0;i--){
    const p=exhaustParticles[i];
    p.x+=p.vx;p.y+=p.vy;p.life-=p.decay;p.r*=.94;
    if(p.life<=0){exhaustParticles.splice(i,1);continue;}
    ctx.save();ctx.globalAlpha=p.life*.8;ctx.shadowBlur=8;ctx.shadowColor=p.color;
    ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.restore();
  }
}

// ── CYBER CAR ─────────────────────────────────────────────────
function drawCars(H,now){
  for(const id in raceState.players){
    const raw=raceState.players[id];if(!raw.alive)continue;
    if(id===myId)drawCyberCar(raw,true,now);
    else{const sm=interp[id]||raw;drawCyberCar({...raw,x:sm.x,y:sm.y,angle:sm.angle||raw.angle},false,now);}
  }
}

function drawCyberCar(p,isMe,now){
  const c=p.color||'#00ffff';
  const cw=56,ch=26;
  const boosting=p.boosting||false;

  // Spawn exhaust
  if(isMe&&p.vx>0.5){spawnExhaust(p.x,p.y+ch/2-2,c,boosting);}

  ctx.save();
  ctx.translate(p.x+cw/2,p.y+ch/2);
  ctx.rotate(p.angle||0);

  // Boost glow aura
  if(boosting){
    ctx.shadowBlur=40;ctx.shadowColor='#ff6600';
    ctx.globalAlpha=.3+(Math.sin(now*.02)*.1);
    ctx.fillStyle='#ff6600';
    ctx.fillRect(-cw/2-8,-ch/2-8,cw+16,ch+16);
    ctx.globalAlpha=1;ctx.shadowBlur=0;
  }

  // Underlight glow
  ctx.shadowBlur=isNight()?20:10;ctx.shadowColor=c;
  ctx.fillStyle=`rgba(${hexToRgb(c)},0.25)`;
  ctx.fillRect(-cw/2,-ch/2+ch*.6,cw,8);

  // Car body — cyber angular shape
  ctx.shadowBlur=isMe?28:14;ctx.shadowColor=c;
  const bodyGrad=ctx.createLinearGradient(-cw/2,-ch/2,cw/2,ch/2);
  bodyGrad.addColorStop(0,boosting?'#ff4400':darkenColor(c,.4));
  bodyGrad.addColorStop(0.5,boosting?'#ff6600':c);
  bodyGrad.addColorStop(1,boosting?'#ff2200':darkenColor(c,.3));
  ctx.fillStyle=bodyGrad;
  ctx.beginPath();
  ctx.moveTo(-cw/2+8,ch/2);
  ctx.lineTo(-cw/2,-ch/2+6);
  ctx.lineTo(-cw/2+6,-ch/2);
  ctx.lineTo(cw/2-12,-ch/2);
  ctx.lineTo(cw/2,-ch/2+8);
  ctx.lineTo(cw/2,ch/2-6);
  ctx.lineTo(cw/2-6,ch/2);
  ctx.closePath();ctx.fill();

  // Body panel lines
  ctx.strokeStyle=isMe?'rgba(255,255,255,0.5)':'rgba(255,255,255,0.2)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(-cw/2+8,-ch/2+4);ctx.lineTo(cw/2-14,-ch/2+4);ctx.stroke();
  ctx.beginPath();ctx.moveTo(-cw/2+4,0);ctx.lineTo(cw/2-4,0);ctx.stroke();

  // Windshield
  ctx.fillStyle='rgba(0,255,255,0.2)';
  ctx.strokeStyle='rgba(0,255,255,0.5)';ctx.lineWidth=1;
  ctx.beginPath();ctx.rect(-cw/2+14,-ch/2+2,22,11);ctx.fill();ctx.stroke();
  // Windshield reflection
  ctx.fillStyle='rgba(255,255,255,0.15)';
  ctx.fillRect(-cw/2+15,-ch/2+3,8,4);

  // Headlights
  const hlAlpha=isNight()?1:.6;
  ctx.shadowBlur=isNight()?20:8;ctx.shadowColor=`rgba(255,255,200,${hlAlpha})`;
  ctx.fillStyle=`rgba(255,255,200,${hlAlpha})`;
  ctx.fillRect(cw/2-4,-ch/2+4,5,6);
  if(isNight()){
    ctx.globalAlpha=.15;ctx.fillStyle='#ffffcc';
    ctx.fillRect(cw/2,-(ch/2+2),60,ch+4);ctx.globalAlpha=1;
  }

  // Taillights
  ctx.shadowBlur=12;ctx.shadowColor='#ff2244';ctx.fillStyle='rgba(255,34,68,0.9)';
  ctx.fillRect(-cw/2-3,ch/2-8,4,6);
  ctx.fillRect(-cw/2-3,-ch/2+2,4,6);

  // Outline
  ctx.shadowBlur=0;ctx.strokeStyle=isMe?'rgba(255,255,255,0.7)':'rgba(255,255,255,0.2)';
  ctx.lineWidth=isMe?1.5:1;
  ctx.beginPath();
  ctx.moveTo(-cw/2+8,ch/2);ctx.lineTo(-cw/2,-ch/2+6);ctx.lineTo(-cw/2+6,-ch/2);
  ctx.lineTo(cw/2-12,-ch/2);ctx.lineTo(cw/2,-ch/2+8);
  ctx.lineTo(cw/2,ch/2-6);ctx.lineTo(cw/2-6,ch/2);ctx.closePath();ctx.stroke();

  // Wheels
  drawNeonWheel(-cw/2+12,ch/2+1,p.wheelAngle||0,c,boosting,now);
  drawNeonWheel(cw/2-12, ch/2+1,p.wheelAngle||0,c,boosting,now);

  ctx.restore();

  // Cyber trail behind car (me only)
  if(isMe&&p.vx>1){
    ctx.save();
    const trailAlpha=Math.min(.4,p.vx*.05)*(boosting?2:1);
    const trailColor=boosting?'#ff6600':c;
    ctx.strokeStyle=`rgba(${hexToRgb(trailColor)},${trailAlpha})`;
    ctx.lineWidth=boosting?4:2;ctx.shadowBlur=10;ctx.shadowColor=trailColor;
    ctx.beginPath();ctx.moveTo(p.x+2,p.y+ch/2-6);
    ctx.lineTo(p.x-40*(boosting?2:1),p.y+ch/2-6);ctx.stroke();
    ctx.restore();
  }

  // Name tag
  ctx.save();
  const tagX=p.x+cw/2,tagY=p.y-16;
  ctx.font=`bold ${isMe?12:10}px Orbitron,monospace`;
  ctx.textAlign='center';ctx.shadowBlur=8;ctx.shadowColor=c;ctx.fillStyle=isMe?'#fff':c;
  ctx.fillText((p.username||'RACER').toUpperCase(),tagX,tagY);
  if(isMe){
    ctx.font='9px Share Tech Mono';ctx.fillStyle='#ffdd00';ctx.shadowColor='#ffdd00';
    ctx.fillText(`${p.progress}m${boosting?' ⚡':''}`,tagX,tagY-13);
  }
  ctx.restore();
}

function drawNeonWheel(relX,relY,spin,color,boosting,now){
  ctx.save();ctx.translate(relX,relY);ctx.rotate(spin);
  const wPulse=boosting?.5+Math.sin(now*.03)*.5:.4;
  ctx.shadowBlur=boosting?20:10;ctx.shadowColor=boosting?'#ff6600':color;
  // Tire
  ctx.strokeStyle=boosting?'#ff6600':color;ctx.lineWidth=3;
  ctx.beginPath();ctx.arc(0,0,8,0,Math.PI*2);ctx.stroke();
  // Rim
  ctx.strokeStyle='rgba(255,255,255,0.6)';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.arc(0,0,4,0,Math.PI*2);ctx.stroke();
  // Spokes
  ctx.strokeStyle=`rgba(255,255,255,${.4+wPulse*.3})`;ctx.lineWidth=1;
  for(let i=0;i<4;i++){const a=Math.PI/2*i;
    ctx.beginPath();ctx.moveTo(Math.cos(a)*2,Math.sin(a)*2);
    ctx.lineTo(Math.cos(a)*7,Math.sin(a)*7);ctx.stroke();}
  // Neon glow ring
  ctx.globalAlpha=.4;ctx.strokeStyle=color;ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(0,0,8,0,Math.PI*2);ctx.stroke();
  ctx.globalAlpha=1;ctx.restore();
}

// ── UTILS ─────────────────────────────────────────────────────
function hexToRgb(hex){
  const h=parseInt(hex.replace('#',''),16);
  return `${(h>>16)&255},${(h>>8)&255},${h&255}`;
}
function darkenColor(hex,factor){
  const h=parseInt(hex.replace('#',''),16);
  const r=Math.round(((h>>16)&255)*factor);
  const g=Math.round(((h>>8)&255)*factor);
  const b=Math.round((h&255)*factor);
  return `#${((r<<16)|(g<<8)|b).toString(16).padStart(6,'0')}`;
}

function drawHudOverlay(me,W,H){
  if(!me)return;
  ctx.save();ctx.font='10px Share Tech Mono';ctx.textAlign='left';
  ctx.fillStyle='rgba(0,255,255,0.35)';
  const timeStr=isNight()?'🌙 NIGHT':'☀ DAY';
  ctx.fillText(`◈ HILL CLIMB  ${timeStr}`,10,H-8);
  ctx.textAlign='right';ctx.fillText(`${Math.round(me.x||0)}m`,W-10,H-8);
  ctx.restore();
}

function showCpToast(){
  const el=document.getElementById('cpToast');if(!el)return;
  el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2500);
}

// ── GAME UI ───────────────────────────────────────────────────
function setupGameUI(){
  bindClick('leaveGameBtn',leaveGame,'click');
  bindClick('leaveDeathBtn',leaveGame,'click');
  const respawn=document.getElementById('respawnBtn');
  if(respawn)respawn.onclick=()=>{SFX.play('respawn');socket.emit('joinRace');document.getElementById('deathOverlay').style.display='none';};
  const playAgain=document.getElementById('playAgainBtn');
  if(playAgain)playAgain.onclick=()=>{SFX.play('click');document.getElementById('resultsOverlay').style.display='none';socket.emit('joinRace');};
  const leaveResult=document.getElementById('leaveResultBtn');
  if(leaveResult)leaveResult.onclick=()=>{SFX.play('click');document.getElementById('resultsOverlay').style.display='none';leaveGame();};
}

// ── KEYS (no jump) ────────────────────────────────────────────
function setupKeys(){
  document.addEventListener('keydown',e=>{
    if(e.code==='ArrowRight'||e.code==='KeyD'){keys.gas=true;e.preventDefault();}
    if(e.code==='ArrowLeft'||e.code==='KeyA'){keys.brake=true;e.preventDefault();}
    if(e.code==='Space'||e.code==='ArrowUp'){keys.gas=true;e.preventDefault();}
  });
  document.addEventListener('keyup',e=>{
    if(e.code==='ArrowRight'||e.code==='KeyD')keys.gas=false;
    if(e.code==='ArrowLeft'||e.code==='KeyA')keys.brake=false;
    if(e.code==='Space'||e.code==='ArrowUp')keys.gas=false;
  });
}

// No jump buttons in v7
function setupTouchBtns(){
  ['btnRight','mRight'].forEach(id=>mkBtn(id,()=>keys.gas=true,  ()=>keys.gas=false));
  ['btnLeft','mLeft'].forEach(id  =>mkBtn(id,()=>keys.brake=true,()=>keys.brake=false));
}
function mkBtn(id,dn,up){
  const el=document.getElementById(id);if(!el)return;
  const onDn=e=>{e.preventDefault();dn();el.classList.add('pressed');};
  const onUp=e=>{e.preventDefault();up();el.classList.remove('pressed');};
  el.addEventListener('touchstart',onDn,{passive:false});el.addEventListener('touchend',onUp,{passive:false});
  el.addEventListener('touchcancel',onUp,{passive:false});el.addEventListener('mousedown',onDn);
  el.addEventListener('mouseup',onUp);el.addEventListener('mouseleave',onUp);
}

// ── LEADERBOARD ───────────────────────────────────────────────
function refreshLb(lb){
  if(!lb)return;
  const html=lb.length
    ? lb.map((p,i)=>`<div class="lb-row">
        <span class="lb-rank">P${i+1}</span>
        <span class="lb-name" style="color:${p.color}">${esc(p.username)}</span>
        <span class="lb-score">${p.finished?'✓':p.progress+'m'}</span></div>`).join('')
    : '<div class="lb-empty">WAITING…</div>';
  ['gameLb'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML=html;});
}

// ── CHAT ──────────────────────────────────────────────────────
let chatTypeTmr=null;
function setupChat(){
  const inp=document.getElementById('chatInp'),btn=document.getElementById('chatSend');
  if(!inp||!btn)return;
  btn.onclick=sendChat;
  inp.addEventListener('keypress',e=>{if(e.key==='Enter')sendChat();});
  inp.addEventListener('input',()=>{socket.emit('typing');clearTimeout(chatTypeTmr);chatTypeTmr=setTimeout(()=>socket.emit('stopTyping'),2000);});
}
function sendChat(){const inp=document.getElementById('chatInp');if(!inp||!inp.value.trim())return;
  socket.emit('chatMessage',{message:inp.value});socket.emit('stopTyping');SFX.play('chatSend');inp.value='';}
function appendChat(msg,hist=false){
  const c=document.getElementById('chatMsgs');if(!c)return;
  const isMe=msg.socketId===myId,d=document.createElement('div');
  d.className=`cm ${isMe?'me':'other'}`;d.style.opacity='0';d.style.transition='opacity .3s';
  const t=new Date(msg.ts).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  d.innerHTML=`<div class="cm-name" style="color:${msg.color}">${esc(msg.username)}</div>
    <div class="cm-text">${msg.message}</div><div class="cm-time">${t}</div>`;
  c.appendChild(d);requestAnimationFrame(()=>d.style.opacity='1');if(!hist)scrollChat();
}
function scrollChat(){const el=document.getElementById('chatMsgs');if(el)el.scrollTop=el.scrollHeight;}
function showTyping(id,username,color){typingMap[id]={username,color};renderTyping();
  clearTimeout(typingMap[id]?.tmr);typingMap[id].tmr=setTimeout(()=>{delete typingMap[id];renderTyping();},3000);}
function renderTyping(){const el=document.getElementById('typingInd');if(!el)return;
  const list=Object.values(typingMap);if(!list.length){el.innerHTML='';el.style.display='none';return;}
  el.style.display='flex';const{username,color}=list[0];
  el.innerHTML=`<span class="typing-dots"><span></span><span></span><span></span></span>
    <span style="color:${color}">${esc(username)}</span> TRANSMITTING…`;}

// ── BOT ───────────────────────────────────────────────────────
const BOT={
  controls:`◈ CONTROLS\n━━━━━━━━━\nDESKTOP:\n  → / D / SPACE = GAS\n  ← / A = BRAKE\nMOBILE:\n  ▶ = GAS  ◀ = BRAKE`,
  tips:`◈ TIPS\n━━━━━━━\n▸ Hold GAS on uphills\n▸ BRAKE on steep downhills\n▸ Hit BOOST pads for nitro!\n▸ Avoid LASER barriers\n▸ Use RAMPS to fly!\n▸ Watch for GAPS!`,
  rules:`◈ RULES\n━━━━━━━\n▸ First to FINISH wins\n▸ CPs save progress\n▸ Avoid laser = instant loss\n▸ Boost pads = nitro speed\n▸ Race max 3 minutes`,
  whatsapp:`◈ WHATSAPP\nhttps://wa.me/2349018841424`,
  tiktok:`◈ TIKTOK\nhttps://www.tiktok.com/@shadowdroid`,
  hi:`◈ RACER DETECTED!\nWelcome to DAKROMA!\nType "help" for commands.`,
  hello:`◈ SIGNAL RECEIVED\nReady to race? Type "controls".`,
  help:`◈ COMMANDS\n━━━━━━━━━━\ncontrols  tips  rules\nwhatsapp  tiktok`
};
function setupBot(){
  const inp=document.getElementById('botInp'),btn=document.getElementById('botSend');
  if(!inp||!btn)return;btn.onclick=sendBot;
  inp.addEventListener('keypress',e=>{if(e.key==='Enter')sendBot();});
  setTimeout(()=>botMsg('🤖','◈ DAKROMA AI v7\nHill Climb Edition!\nType "help" for commands.'),700);
}
function sendBot(){const inp=document.getElementById('botInp');if(!inp||!inp.value.trim())return;
  const txt=inp.value.trim();inp.value='';botMsg('👤',txt,true);SFX.play('chatSend');
  const ty=document.getElementById('botTyping');if(ty)ty.style.display='flex';
  setTimeout(()=>{if(ty)ty.style.display='none';SFX.play('botReply');
    const key=txt.toLowerCase().trim().split(/\s+/)[0];
    botMsg('🤖',BOT[key]||`◈ UNKNOWN: "${esc(txt.slice(0,18))}"\nType "help".`);},900);}
function botMsg(icon,text,isUser=false){
  const c=document.getElementById('botMsgs');if(!c)return;
  const d=document.createElement('div');d.className=`bm ${isUser?'bu':''}`;
  d.style.opacity='0';d.style.transition='opacity .3s';
  d.innerHTML=`<span class="bm-icon">${icon}</span><span class="bm-text">${esc(text).replace(/\n/g,'<br>')}</span>`;
  c.appendChild(d);requestAnimationFrame(()=>d.style.opacity='1');c.scrollTop=c.scrollHeight;}

// ── NOTIFICATIONS ─────────────────────────────────────────────
function toast(msg,type='info'){
  const c=document.getElementById('notifContainer');if(!c)return;
  const el=document.createElement('div');el.className=`notif ${type}`;el.textContent=msg;
  c.appendChild(el);requestAnimationFrame(()=>el.classList.add('show'));
  setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),350);},3200);}

function setEl(id,val){const el=document.getElementById(id);if(el)el.textContent=val;}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
