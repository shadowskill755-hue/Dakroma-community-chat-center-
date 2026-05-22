/* ═══════════════════════════════════════════════
   DAKROMA MASTER PIECE — CYBER AUDIO ENGINE
   Synthetic sounds — no external files needed
   ═══════════════════════════════════════════════ */

const SFX = (() => {
  let ctx = null;
  let masterGain = null;
  let bgmGain = null;
  let sfxGain = null;
  let muted = false;
  let bgmNode = null;
  let bgmStarted = false;

  // Load saved volume prefs
  let volMaster = parseFloat(localStorage.getItem('vol_master') ?? '0.7');
  let volBgm    = parseFloat(localStorage.getItem('vol_bgm')    ?? '0.35');
  let volSfx    = parseFloat(localStorage.getItem('vol_sfx')    ?? '0.8');
  muted         = localStorage.getItem('muted') === 'true';

  function init() {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain(); masterGain.gain.value = muted ? 0 : volMaster;
      bgmGain    = ctx.createGain(); bgmGain.gain.value    = volBgm;
      sfxGain    = ctx.createGain(); sfxGain.gain.value    = volSfx;
      bgmGain.connect(masterGain);
      sfxGain.connect(masterGain);
      masterGain.connect(ctx.destination);
    } catch(e) { console.warn('Audio not supported'); }
  }

  function resume() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  // ── CORE OSCILLATOR HELPER ──────────────────────────────────
  function osc(type, freq, start, dur, gainVal, gainNode, detune=0, freqEnd=null) {
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    if (detune) o.detune.value = detune;
    if (freqEnd !== null) o.frequency.linearRampToValueAtTime(freqEnd, start + dur);
    o.connect(g); g.connect(gainNode || sfxGain);
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(gainVal, start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.start(start); o.stop(start + dur + 0.01);
  }

  function noise(dur, gainVal, gainNode, filterFreq=2000) {
    if (!ctx) return;
    const buf  = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i=0; i<data.length; i++) data[i] = Math.random()*2-1;
    const src  = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type  = 'bandpass'; filt.frequency.value = filterFreq;
    const g    = ctx.createGain();
    g.gain.setValueAtTime(gainVal, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    src.connect(filt); filt.connect(g); g.connect(gainNode || sfxGain);
    src.start(); src.stop(ctx.currentTime + dur);
  }

  // ── SOUND EFFECTS ───────────────────────────────────────────
  const sounds = {

    // Menu button — soft cyber click
    click() {
      if (!ctx) return; const t = ctx.currentTime;
      osc('sine',   800, t,      0.06, 0.15, null);
      osc('square', 1200, t+0.02, 0.04, 0.08, null);
    },

    // Play / Enter Grid — powerful activation
    playBtn() {
      if (!ctx) return; const t = ctx.currentTime;
      osc('sawtooth', 80,  t,      0.08, 0.4, null);
      osc('sawtooth', 160, t+0.05, 0.08, 0.4, null);
      osc('sawtooth', 320, t+0.10, 0.08, 0.35, null);
      osc('sine',     640, t+0.15, 0.3,  0.5, null, 0, 1280);
      noise(0.15, 0.1, null, 3000);
    },

    // Jump — futuristic boost
    jump() {
      if (!ctx) return; const t = ctx.currentTime;
      osc('sine', 200, t, 0.18, 0.25, null, 0, 600);
      osc('square', 400, t+0.02, 0.1, 0.12, null, 0, 900);
    },

    // Checkpoint — energy pulse
    checkpoint() {
      if (!ctx) return; const t = ctx.currentTime;
      osc('sine',  440, t,      0.12, 0.3, null);
      osc('sine',  660, t+0.08, 0.12, 0.3, null);
      osc('sine',  880, t+0.16, 0.12, 0.4, null);
      osc('sine', 1320, t+0.24, 0.08, 0.5, null);
    },

    // Death — digital distortion
    death() {
      if (!ctx) return; const t = ctx.currentTime;
      osc('sawtooth', 440, t,      0.25, 0.5, null, 0, 55);
      osc('sawtooth', 220, t+0.1,  0.25, 0.4, null, 0, 40);
      noise(0.4, 0.3, null, 800);
      osc('square', 110, t+0.2, 0.3, 0.3, null);
    },

    // Respawn — nano revival
    respawn() {
      if (!ctx) return; const t = ctx.currentTime;
      osc('sine', 220, t,      0.1, 0.2, null, 0, 440);
      osc('sine', 440, t+0.1,  0.1, 0.2, null, 0, 880);
      osc('sine', 880, t+0.2,  0.1, 0.25, null, 0, 1760);
      osc('triangle', 1760, t+0.3, 0.08, 0.3, null);
    },

    // Laser hit — electric sting
    laser() {
      if (!ctx) return; const t = ctx.currentTime;
      osc('square', 2000, t, 0.15, 0.3, null, 0, 200);
      noise(0.2, 0.2, null, 4000);
    },

    // Spike hit
    spike() {
      if (!ctx) return; const t = ctx.currentTime;
      osc('sawtooth', 300, t, 0.1, 0.25, null, 0, 80);
      noise(0.15, 0.2, null, 1500);
    },

    // Jumppad boost
    boost() {
      if (!ctx) return; const t = ctx.currentTime;
      osc('sine', 150, t,      0.2, 0.4, null, 0, 800);
      osc('triangle', 300, t,  0.15, 0.35, null, 0, 1200);
      osc('sine', 600, t+0.1,  0.1, 0.3, null);
    },

    // Save name — hologram lock
    saveName() {
      if (!ctx) return; const t = ctx.currentTime;
      osc('sine', 600, t,      0.1, 0.1, null);
      osc('sine', 900, t+0.08, 0.1, 0.1, null);
      osc('sine', 1200,t+0.16, 0.12, 0.2, null);
      noise(0.08, 0.06, null, 5000);
    },

    // Chat send — AI notification
    chatSend() {
      if (!ctx) return; const t = ctx.currentTime;
      osc('sine', 1000, t, 0.08, 0.1, null, 0, 1400);
      osc('sine', 1400, t+0.05, 0.06, 0.08, null);
    },

    // Chat receive
    chatRecv() {
      if (!ctx) return; const t = ctx.currentTime;
      osc('sine', 800, t, 0.06, 0.08, null);
      osc('sine', 1100, t+0.04, 0.05, 0.07, null);
    },

    // Bot reply — AI response
    botReply() {
      if (!ctx) return; const t = ctx.currentTime;
      osc('triangle', 600, t,      0.08, 0.1, null);
      osc('triangle', 800, t+0.05, 0.08, 0.1, null);
      osc('triangle', 1000,t+0.10, 0.08, 0.12, null);
    },

    // Multiplayer join — cyber connection
    playerJoin() {
      if (!ctx) return; const t = ctx.currentTime;
      osc('sine', 300, t,      0.12, 0.15, null, 0, 600);
      osc('sine', 600, t+0.1,  0.10, 0.12, null, 0, 900);
      osc('sine', 900, t+0.18, 0.08, 0.15, null);
    },

    // Player leave
    playerLeave() {
      if (!ctx) return; const t = ctx.currentTime;
      osc('sine', 600, t, 0.1, 0.2, null, 0, 200);
      osc('sine', 300, t+0.1, 0.08, 0.15, null, 0, 100);
    },

    // Color select
    colorPick() {
      if (!ctx) return; const t = ctx.currentTime;
      osc('sine', 1200, t, 0.06, 0.08, null);
    },

    // Settings open — hologram tap
    settings() {
      if (!ctx) return; const t = ctx.currentTime;
      osc('triangle', 400, t,     0.08, 0.12, null, 0, 800);
      osc('triangle', 800, t+0.05,0.06, 0.1,  null);
    },

    // Connected to server
    connected() {
      if (!ctx) return; const t = ctx.currentTime;
      osc('sine', 200, t,      0.1, 0.1, null, 0, 400);
      osc('sine', 400, t+0.08, 0.1, 0.1, null, 0, 800);
      osc('sine', 800, t+0.16, 0.12, 0.2, null);
      osc('sine', 1600, t+0.24, 0.08, 0.25, null);
    },

    // Notification
    notif() {
      if (!ctx) return; const t = ctx.currentTime;
      osc('sine', 880, t, 0.06, 0.08, null);
      osc('sine', 1100, t+0.04, 0.05, 0.08, null);
    }
  };

  // ── BACKGROUND MUSIC ────────────────────────────────────────
  function startBGM() {
    if (!ctx || bgmStarted || muted) return;
    bgmStarted = true;

    // Cyber ambient loop using oscillators + LFO
    function playBgmLayer() {
      if (!ctx || muted) return;

      // Bass drone
      const bass = ctx.createOscillator();
      const bassG = ctx.createGain();
      bass.type = 'sawtooth'; bass.frequency.value = 55;
      bassG.gain.value = 0.08;
      bass.connect(bassG); bassG.connect(bgmGain);
      bass.start();

      // Mid pad
      const pad = ctx.createOscillator();
      const padG = ctx.createGain();
      pad.type = 'triangle'; pad.frequency.value = 110;
      padG.gain.value = 0.06;
      const padLfo = ctx.createOscillator();
      const padLfoG = ctx.createGain();
      padLfo.frequency.value = 0.3;
      padLfoG.gain.value = 0.03;
      padLfo.connect(padLfoG); padLfoG.connect(padG.gain);
      pad.connect(padG); padG.connect(bgmGain);
      padLfo.start(); pad.start();

      // High shimmer
      const shimmer = ctx.createOscillator();
      const shimG   = ctx.createGain();
      shimmer.type = 'sine'; shimmer.frequency.value = 440;
      shimmer.detune.value = 7;
      shimG.gain.value = 0.04;
      const shimLfo = ctx.createOscillator();
      const shimLfoG= ctx.createGain();
      shimLfo.frequency.value = 0.7;
      shimLfoG.gain.value = 0.02;
      shimLfo.connect(shimLfoG); shimLfoG.connect(shimG.gain);
      shimmer.connect(shimG); shimG.connect(bgmGain);
      shimLfo.start(); shimmer.start();

      // Arpeggio pattern
      const notes = [110, 138.6, 164.8, 220, 261.6, 220, 164.8, 138.6];
      let noteIdx = 0;
      const arpInterval = setInterval(() => {
        if (!ctx || muted) return;
        const t = ctx.currentTime;
        osc('square', notes[noteIdx % notes.length], t, 0.18, 0.04, bgmGain);
        noteIdx++;
      }, 180);

      // Pulse kick
      const kickInterval = setInterval(() => {
        if (!ctx || muted) return;
        const t = ctx.currentTime;
        osc('sine', 80, t, 0.12, 0.18, bgmGain, 0, 40);
        noise(0.08, 0.03, bgmGain, 200);
      }, 480);

      bgmNode = { bass, pad, shimmer, padLfo, shimLfo, arpInterval, kickInterval, bassG, padG, shimG };
    }

    playBgmLayer();
  }

  function stopBGM() {
    if (!bgmNode) return;
    try {
      bgmNode.bass?.stop();
      bgmNode.pad?.stop();
      bgmNode.shimmer?.stop();
      bgmNode.padLfo?.stop();
      bgmNode.shimLfo?.stop();
      clearInterval(bgmNode.arpInterval);
      clearInterval(bgmNode.kickInterval);
    } catch(e) {}
    bgmNode = null; bgmStarted = false;
  }

  // ── VOLUME CONTROLS ─────────────────────────────────────────
  function setMasterVol(v) {
    volMaster = v;
    if (masterGain) masterGain.gain.value = muted ? 0 : v;
    localStorage.setItem('vol_master', v);
  }
  function setBgmVol(v) {
    volBgm = v;
    if (bgmGain) bgmGain.gain.value = v;
    localStorage.setItem('vol_bgm', v);
  }
  function setSfxVol(v) {
    volSfx = v;
    if (sfxGain) sfxGain.gain.value = v;
    localStorage.setItem('vol_sfx', v);
  }
  function toggleMute() {
    muted = !muted;
    if (masterGain) masterGain.gain.value = muted ? 0 : volMaster;
    localStorage.setItem('muted', muted);
    if (muted) stopBGM();
    else { bgmStarted = false; startBGM(); }
    return muted;
  }
  function isMuted() { return muted; }
  function getVols() { return { master: volMaster, bgm: volBgm, sfx: volSfx }; }

  // Public play — auto-init on first interaction
  function play(name) {
    if (!ctx) init();
    resume();
    if (muted) return;
    if (sounds[name]) sounds[name]();
  }

  function start() {
    if (!ctx) init();
    resume();
    startBGM();
  }

  return {
    play, start, stopBGM, startBGM,
    toggleMute, isMuted,
    setMasterVol, setBgmVol, setSfxVol, getVols,
    init, resume
  };
})();
