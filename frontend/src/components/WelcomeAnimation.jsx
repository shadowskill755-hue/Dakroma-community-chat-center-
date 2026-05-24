// ============================================================
// WelcomeAnimation - Group welcome intro (6000ms)
// ============================================================
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DAKROMA_GROUP_ID = "mr-dakroma-official";

const WelcomeAnimation = ({ room, onDone }) => {
  const [phase, setPhase] = useState(0);
  const isDakroma = room?.id === DAKROMA_GROUP_ID ||
    room?.name?.toLowerCase().includes("dakroma") ||
    room?.createdBy === "dakroma_owner";

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 3000),
      setTimeout(() => setPhase(4), 5000),
      setTimeout(() => onDone(), 6000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  if (isDakroma) {
    // EPIC dark fantasy intro for MrDakroma's group
    return (
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        className="fixed inset-0 z-[999] flex items-center justify-center overflow-hidden"
        style={{ background: "radial-gradient(ellipse at center, #0a0015 0%, #000000 100%)" }}>

        {/* Dark particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{ background: i % 2 === 0 ? "#7c3aed" : "#ff006e",
              left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ opacity: [0, 1, 0], scale: [0, 2, 0], y: [0, -100] }}
            transition={{ duration: 3, repeat: Infinity, delay: Math.random() * 3 }} />
        ))}

        {/* Lightning effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <motion.div key={i}
              className="absolute w-px bg-gradient-to-b from-purple-500 to-transparent"
              style={{ left: `${20 + i * 15}%`, height: "100%" }}
              animate={{ opacity: [0, 1, 0], scaleX: [1, 2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.4, repeatDelay: 2 }} />
          ))}
        </div>

        {/* Main content */}
        <div className="relative z-10 text-center px-6">
          {/* Phase 1 - Crown appears */}
          <AnimatePresence>
            {phase >= 1 && (
              <motion.div initial={{ scale:0, rotate:-180 }} animate={{ scale:1, rotate:0 }}
                transition={{ type:"spring", stiffness:200 }}
                className="text-6xl mb-4">
                👑
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phase 2 - Name appears with glitch */}
          <AnimatePresence>
            {phase >= 2 && (
              <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }}
                transition={{ duration:0.8 }}>
                <h1 className="font-cyber text-3xl md:text-4xl glitch-text mb-2"
                  data-text="𝖒𝖗᭄𝕯𝖆𝖐𝖗𝖔𝖒𝖆꧂"
                  style={{ color:"#7c3aed", textShadow:"0 0 20px #7c3aed, 0 0 40px #ff006e" }}>
                  𝖒𝖗᭄𝕯𝖆𝖐𝖗𝖔𝖒𝖆꧂
                </h1>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-blue-400 text-lg">✓</span>
                  <span className="font-cyber text-xs text-blue-400 tracking-widest">VERIFIED FOUNDER</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phase 3 - Welcome text */}
          <AnimatePresence>
            {phase >= 3 && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                transition={{ duration:0.8 }}>
                <p className="font-cyber text-sm text-cyber-muted tracking-widest mb-2">
                  WELCOME TO THE OFFICIAL GRID
                </p>
                <p className="font-body text-cyber-muted text-xs max-w-xs mx-auto">
                  {room?.description || "The home of MrDakroma Community"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phase 4 - Enter button glow */}
          <AnimatePresence>
            {phase >= 4 && (
              <motion.div initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }}
                className="mt-6">
                <div className="font-cyber text-xs text-purple-400 tracking-widest animate-pulse">
                  ENTERING THE GRID...
                </div>
                <div className="mt-3 w-48 mx-auto h-1 bg-cyber-border rounded-full overflow-hidden">
                  <motion.div className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"
                    initial={{ width:"0%" }} animate={{ width:"100%" }}
                    transition={{ duration:1 }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }

  // Regular group welcome animation
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-[999] flex items-center justify-center"
      style={{ background: "radial-gradient(ellipse at center, #060d18 0%, #020408 100%)" }}>

      {/* Particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div key={i} className="absolute w-1 h-1 rounded-full bg-cyber-cyan"
          style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: Math.random() * 2 }} />
      ))}

      <div className="relative z-10 text-center px-6">
        <AnimatePresence>
          {phase >= 1 && (
            <motion.div initial={{ scale:0 }} animate={{ scale:1 }}
              transition={{ type:"spring", stiffness:200 }}
              className="text-5xl mb-4">{room?.icon || "💬"}</motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase >= 2 && (
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
              <p className="font-cyber text-xs text-cyber-muted tracking-widest mb-2">WELCOME TO</p>
              <h1 className="font-cyber text-2xl neon-text-cyan mb-2">{room?.name}</h1>
              <p className="text-cyber-muted text-sm font-body">{room?.description}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase >= 3 && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="mt-4">
              <p className="font-cyber text-xs text-cyber-muted tracking-widest animate-pulse">
                ENTERING...
              </p>
              <div className="mt-2 w-32 mx-auto h-1 bg-cyber-border rounded-full overflow-hidden">
                <motion.div className="h-full loading-bar rounded-full"
                  initial={{ width:"0%" }} animate={{ width:"100%" }}
                  transition={{ duration:3 }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default WelcomeAnimation;
