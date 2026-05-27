// ============================================================
// FirstTimeIntro - Epic first login welcome screen
// ============================================================
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playSound } from "./SoundManager";

const ASCII_ART = `
██████╗  █████╗ ██╗  ██╗██████╗  ██████╗ ███╗   ███╗ █████╗
██╔══██╗██╔══██╗██║ ██╔╝██╔══██╗██╔═══██╗████╗ ████║██╔══██╗
██║  ██║███████║█████╔╝ ██████╔╝██║   ██║██╔████╔██║███████║
██║  ██║██╔══██║██╔═██╗ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══██║
██████╔╝██║  ██║██║  ██╗██║  ██║╚██████╔╝██║ ╚═╝ ██║██║  ██║
╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝
`;

const playWooshSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 1.5);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 2.5);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.3);
    gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 1.5);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 3);
  } catch {}
};

const FirstTimeIntro = ({ username, onDone }) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    playWooshSound();
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 3500),
      setTimeout(() => setPhase(4), 5000),
      setTimeout(() => setPhase(5), 7000),
      setTimeout(() => onDone(), 9000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      style={{ background: "#000000" }}>

      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,245,255,0.03) 2px, rgba(0,245,255,0.03) 4px)" }} />

      {/* Fire particles */}
      {phase >= 2 && [...Array(30)].map((_, i) => (
        <motion.div key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: i % 3 === 0 ? "#ff006e" : i % 3 === 1 ? "#7c3aed" : "#00f5ff",
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{ opacity:[0,1,0], scale:[0,2,0], y:[0,-150] }}
          transition={{ duration:2+Math.random()*2, repeat:Infinity, delay:Math.random()*2 }} />
      ))}

      {/* Center content */}
      <div className="relative z-10 text-center px-4 w-full max-w-2xl mx-auto">

        {/* Phase 1 - Welcome text */}
        <AnimatePresence>
          {phase >= 1 && (
            <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:1 }} className="mb-6">
              <p className="font-cyber text-cyber-muted text-sm tracking-[0.5em] mb-2">WELCOME</p>
              <p className="font-cyber text-2xl text-white">
                {username?.toUpperCase()}
              </p>
              <p className="font-cyber text-xs text-cyber-muted tracking-widest mt-1">TO</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase 2 - ASCII art */}
        <AnimatePresence>
          {phase >= 2 && (
            <motion.div initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }}
              transition={{ duration:1 }}>
              <pre className="font-mono text-[6px] sm:text-[8px] leading-tight overflow-hidden"
                style={{ color:"#00f5ff", textShadow:"0 0 10px #00f5ff, 0 0 20px #00f5ff" }}>
                {ASCII_ART}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase 3 - Free Fire MENA */}
        <AnimatePresence>
          {phase >= 3 && (
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.8 }} className="mt-4">
              <p className="font-cyber text-sm tracking-widest"
                style={{ color:"#ff9500", textShadow:"0 0 10px #ff9500" }}>
                FREE FIRE
              </p>
              <p className="font-cyber text-xs text-cyber-muted tracking-[0.3em] mt-1">MENA COMMUNITY</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase 4 - Loading bar */}
        <AnimatePresence>
          {phase >= 4 && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="mt-8">
              <p className="font-cyber text-xs text-cyber-muted tracking-widest mb-3 animate-pulse">
                INITIALIZING NEURAL LINK...
              </p>
              <div className="w-64 mx-auto h-1 bg-cyber-border rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #00f5ff, #7c3aed, #ff006e)" }}
                  initial={{ width:"0%" }} animate={{ width:"100%" }}
                  transition={{ duration:2 }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase 5 - Fade out message */}
        <AnimatePresence>
          {phase >= 5 && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="mt-4">
              <p className="font-cyber text-xs text-cyber-cyan tracking-widest">
                ENTERING THE GRID...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default FirstTimeIntro;
