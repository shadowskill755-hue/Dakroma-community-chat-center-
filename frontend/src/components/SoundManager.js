// ============================================================
// SoundManager - Cyberpunk sound effects
// ============================================================
const sounds = {
  click: [800, 0.1, 0.05],
  message: [600, 0.15, 0.1],
  notification: [900, 0.2, 0.15],
  join: [500, 0.3, 0.2],
  error: [200, 0.3, 0.1],
  levelup: [1000, 0.4, 0.3],
};

const ctx = typeof window !== "undefined" ? new (window.AudioContext || window.webkitAudioContext)() : null;

export const playSound = (type = "click") => {
  if (!ctx) return;
  try {
    const [freq, vol, dur] = sounds[type] || sounds.click;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, ctx.currentTime + dur);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  } catch {}
};

export default { playSound };
