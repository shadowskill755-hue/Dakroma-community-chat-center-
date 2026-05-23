// ============================================================
// TournamentBracket - Visual tournament board
// ============================================================
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { notify } from "./NotificationSystem";
import { playSound } from "./SoundManager";

const EMPTY = null;

const TournamentBracket = ({ members = [], onClose, onAnnounce }) => {
  const [slots, setSlots] = useState({
    L1: EMPTY, L2: EMPTY, L3: EMPTY, L4: EMPTY,
    R1: EMPTY, R2: EMPTY, R3: EMPTY, R4: EMPTY,
    SL: EMPTY, SR: EMPTY,
    FINAL: EMPTY, WINNER: EMPTY,
  });
  const [showPicker, setShowPicker] = useState(null);
  const [winner, setWinner] = useState(null);

  const assign = (slot, member) => {
    setSlots((s) => ({ ...s, [slot]: member }));
    setShowPicker(null);
    playSound("click");
    onAnnounce?.(`⚡ Admin has chosen ${member.username} for the tournament!`);
  };

  const advance = (winner, targetSlot) => {
    setSlots((s) => ({ ...s, [targetSlot]: winner }));
    playSound("message");
    notify(`${winner.username} advances! ⚡`, "success");
  };

  const declareWinner = (w) => {
    setWinner(w);
    setSlots((s) => ({ ...s, WINNER: w }));
    playSound("levelup");
    notify(`🏆 ${w.username} WINS THE TOURNAMENT!`, "rank", 8000);
    onAnnounce?.(`🏆 CONGRATULATIONS ${w.username}! You won the tournament! The grand prize will be approved to you! 🎉`);
  };

  const Slot = ({ id, label }) => {
    const member = slots[id];
    return (
      <motion.div whileTap={{ scale: 0.95 }}
        onClick={() => { playSound("click"); setShowPicker(id); }}
        className={`w-28 h-10 rounded-lg border flex items-center justify-center cursor-pointer transition-all text-xs
          ${member ? "border-cyber-cyan/50 bg-cyan-500/10 text-white" : "border-cyber-border bg-cyber-card text-cyber-muted hover:border-cyber-cyan/30"}`}>
        {member ? (
          <span className="font-cyber text-xs truncate px-2">{member.username}</span>
        ) : (
          <span className="text-lg">＋</span>
        )}
      </motion.div>
    );
  };

  const AdvanceBtn = ({ from1, from2, to, label }) => {
    if (!slots[from1] && !slots[from2]) return null;
    return (
      <div className="flex flex-col gap-1 items-center">
        {slots[from1] && (
          <button onClick={() => to === "WINNER" ? declareWinner(slots[from1]) : advance(slots[from1], to)}
            className="text-xs btn-cyber rounded-lg px-2 py-1">{slots[from1].username} ▶</button>
        )}
        {slots[from2] && (
          <button onClick={() => to === "WINNER" ? declareWinner(slots[from2]) : advance(slots[from2], to)}
            className="text-xs btn-cyber btn-cyber-pink rounded-lg px-2 py-1">{slots[from2].username} ▶</button>
        )}
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 overflow-auto">
      <motion.div initial={{ scale:0.85 }} animate={{ scale:1 }}
        className="glass-card rounded-2xl p-4 w-full max-w-2xl neon-border-cyan">

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-cyber text-sm neon-text-cyan tracking-widest">🏆 TOURNAMENT BRACKET</h2>
          <button onClick={onClose} className="text-cyber-muted hover:text-cyber-pink">✕</button>
        </div>

        {/* Winner display */}
        <AnimatePresence>
          {winner && (
            <motion.div initial={{ scale:0 }} animate={{ scale:1 }}
              className="mb-4 p-3 rounded-xl border border-yellow-500/50 bg-yellow-500/10 text-center">
              <p className="font-cyber text-yellow-400 text-sm">🏆 WINNER: {winner.username}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bracket */}
        <div className="overflow-x-auto">
          <div className="flex items-center justify-center gap-4 min-w-max py-4">

            {/* Left side */}
            <div className="flex flex-col gap-3">
              <p className="font-cyber text-xs text-cyber-muted text-center">LEFT</p>
              <Slot id="L1" /><Slot id="L2" />
              <AdvanceBtn from1="L1" from2="L2" to="SL" />
              <Slot id="L3" /><Slot id="L4" />
              <AdvanceBtn from1="L3" from2="L4" to="SL" />
            </div>

            {/* Left semi */}
            <div className="flex flex-col items-center gap-2">
              <p className="font-cyber text-xs text-cyber-muted">SEMI</p>
              <Slot id="SL" />
              <AdvanceBtn from1="SL" from2="SR" to="WINNER" />
            </div>

            {/* Winner box */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-28 h-12 rounded-xl border-2 border-yellow-500/70 bg-yellow-500/10 flex items-center justify-center">
                {slots.WINNER ? (
                  <span className="font-cyber text-xs text-yellow-400">🏆 {slots.WINNER.username}</span>
                ) : (
                  <span className="font-cyber text-xs text-yellow-400/50">WINNER</span>
                )}
              </div>
            </div>

            {/* Right semi */}
            <div className="flex flex-col items-center gap-2">
              <p className="font-cyber text-xs text-cyber-muted">SEMI</p>
              <Slot id="SR" />
            </div>

            {/* Right side */}
            <div className="flex flex-col gap-3">
              <p className="font-cyber text-xs text-cyber-muted text-center">RIGHT</p>
              <Slot id="R1" /><Slot id="R2" />
              <AdvanceBtn from1="R1" from2="R2" to="SR" />
              <Slot id="R3" /><Slot id="R4" />
              <AdvanceBtn from1="R3" from2="R4" to="SR" />
            </div>
          </div>
        </div>

        {/* Member picker */}
        <AnimatePresence>
          {showPicker && (
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              className="mt-4 p-3 glass rounded-xl border border-cyber-border">
              <p className="font-cyber text-xs text-cyber-muted mb-2">SELECT MEMBER FOR SLOT {showPicker}</p>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {members.map((m) => (
                  <button key={m.uid || m.id} onClick={() => assign(showPicker, m)}
                    className="btn-cyber rounded-lg px-3 py-1 text-xs">{m.username}</button>
                ))}
              </div>
              <button onClick={() => setShowPicker(null)} className="mt-2 text-xs text-cyber-muted font-mono">cancel</button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default TournamentBracket;
