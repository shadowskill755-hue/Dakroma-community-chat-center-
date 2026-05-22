// ============================================================
// LoadingScreen – cinematic cyberpunk intro
// ============================================================
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LoadingScreen = ({ onDone }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase]       = useState(0);

  const phases = [
    "INITIALIZING NEURAL LINK...",
    "DECRYPTING GRID ACCESS...",
    "LOADING COMMUNITY NODE...",
    "ESTABLISHING SECURE CHANNEL...",
    "WELCOME TO THE GRID ⚡",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = p + Math.random() * 12 + 3;
        if (next >= 100) { clearInterval(interval); setTimeout(onDone, 800); return 100; }
        setPhase(Math.floor((next / 100) * phases.length));
        return next;
      });
    }, 120);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-cyber-bg"
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.6 }}
    >
      {/* Grid lines */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: "linear-gradient(#00f5ff 1px,transparent 1px),linear-gradient(90deg,#00f5ff 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

      {/* Glowing orb */}
      <motion.div
        className="w-32 h-32 rounded-full mb-8 relative"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ background: "radial-gradient(circle, #00f5ff44 0%, #7c3aed22 50%, transparent 70%)", boxShadow: "0 0 60px #00f5ff44, 0 0 120px #7c3aed22" }}
      >
        <div className="absolute inset-4 rounded-full border border-cyan-400/30 animate-spin" style={{ animationDuration: "3s" }} />
        <div className="absolute inset-8 rounded-full border border-purple-500/40 animate-spin" style={{ animationDuration: "2s", animationDirection: "reverse" }} />
        <div className="absolute inset-0 flex items-center justify-center text-4xl">⚡</div>
      </motion.div>

      {/* Title */}
      <h1 className="font-cyber text-2xl md:text-4xl neon-text-cyan mb-2 tracking-widest text-center px-4">
        𝖒𝖗᭄𝕯𝖆𝖐𝖗𝖔𝖒𝖆꧂
      </h1>
      <p className="font-mono text-cyber-muted text-sm mb-10 tracking-widest">COMMUNITY GRID v1.0</p>

      {/* Progress bar */}
      <div className="w-72 md:w-96 relative">
        <div className="h-1 bg-cyber-border rounded-full overflow-hidden mb-3">
          <motion.div
            className="h-full loading-bar rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ ease: "linear" }}
          />
        </div>
        <div className="flex justify-between text-xs font-mono text-cyber-muted">
          <span className="neon-text-cyan">{phases[Math.min(phase, phases.length - 1)]}</span>
          <span>{Math.floor(progress)}%</span>
        </div>
      </div>

      {/* Corner HUD decorations */}
      {["top-4 left-4", "top-4 right-4", "bottom-4 left-4", "bottom-4 right-4"].map((pos, i) => (
        <div key={i} className={`absolute ${pos} w-8 h-8`}
          style={{ borderColor: "#00f5ff44", borderStyle: "solid",
            borderWidth: i < 2 ? "1px 0 0" : "0 0 1px",
            borderLeftWidth:  [0,2].includes(i) ? "1px" : 0,
            borderRightWidth: [1,3].includes(i) ? "1px" : 0 }} />
      ))}
    </motion.div>
  );
};

export default LoadingScreen;
