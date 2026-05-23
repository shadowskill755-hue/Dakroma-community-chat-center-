import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const ProfileEditor = ({ onClose }) => {
  const { profile, saveProfile } = useAuth();
  const [preview, setPreview] = useState(profile?.avatar || null);
  const [energy, setEnergy] = useState(profile?.energy ?? 3);
  const [showRefill, setShowRefill] = useState(false);
  const fileRef = useRef();

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (energy <= 0) { setShowRefill(true); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target.result);
      const newEnergy = energy - 1;
      setEnergy(newEnergy);
      saveProfile(profile.uid, { avatar: ev.target.result, energy: newEnergy });
    };
    reader.readAsDataURL(file);
  };

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div initial={{ scale:0.85 }} animate={{ scale:1 }} exit={{ scale:0.85 }}
        className="glass-card rounded-2xl p-6 w-full max-w-sm neon-border-cyan">
        
        <h2 className="font-cyber text-sm neon-text-cyan mb-6 text-center tracking-widest">EDIT PROFILE</h2>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="relative">
            <img src={preview || `https://api.dicebear.com/7.x/cyberpunk/svg?seed=${profile?.username}`}
              alt="avatar" className="w-24 h-24 rounded-full border-2 border-cyber-cyan/50" />
            <button onClick={() => energy > 0 ? fileRef.current.click() : setShowRefill(true)}
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-cyber-cyan/20 border border-cyber-cyan/50 flex items-center justify-center text-sm hover:bg-cyber-cyan/40 transition-colors">
              📷
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />

          {/* Energy */}
          <div className="flex items-center gap-2">
            {[0,1,2].map((i) => (
              <div key={i} className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs
                ${i < energy ? "border-cyber-cyan bg-cyber-cyan/20 text-cyber-cyan" : "border-cyber-border text-cyber-muted"}`}>
                ⚡
              </div>
            ))}
            <span className="text-xs font-mono text-cyber-muted ml-1">{energy}/3 energy</span>
          </div>
        </div>

        {/* Username display */}
        <div className="glass rounded-xl px-4 py-3 mb-4 text-center">
          <p className="font-cyber text-sm text-white">{profile?.username}</p>
          <p className="text-xs text-cyber-muted font-mono">LVL {profile?.level || 1} · {profile?.xp || 0} XP</p>
        </div>

        <button onClick={onClose} className="w-full btn-cyber rounded-xl py-3 text-xs font-cyber tracking-widest">
          SAVE & CLOSE ⚡
        </button>
      </motion.div>

      {/* Refill energy modal */}
      <AnimatePresence>
        {showRefill && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
            <motion.div initial={{ scale:0.85 }} animate={{ scale:1 }}
              className="glass-card rounded-2xl p-6 w-full max-w-sm neon-border-pink text-center">
              <p className="text-4xl mb-3">⚡</p>
              <h3 className="font-cyber text-sm neon-text-pink mb-2">ENERGY DEPLETED</h3>
              <p className="text-xs text-cyber-muted mb-6 font-mono">Refill your energy to change profile picture</p>
              <div className="space-y-3">
                <a href="https://www.tiktok.com/@shadowdriod" target="_blank" rel="noopener noreferrer"
                  onClick={() => { setEnergy(5); setShowRefill(false); saveProfile(profile.uid, { energy: 5 }); }}
                  className="block btn-cyber rounded-xl py-3 text-xs font-cyber tracking-widest text-center">
                  🎵 FOLLOW ON TIKTOK → +5 ENERGY
                </a>
                <a href="https://chat.whatsapp.com/IqRC1ZTy8zH2AmfMj5jq1Z" target="_blank" rel="noopener noreferrer"
                  onClick={() => { setEnergy(5); setShowRefill(false); saveProfile(profile.uid, { energy: 5 }); }}
                  className="block btn-cyber btn-cyber-pink rounded-xl py-3 text-xs font-cyber tracking-widest text-center">
                  💬 JOIN WHATSAPP → +5 ENERGY
                </a>
              </div>
              <button onClick={() => setShowRefill(false)} className="mt-4 text-xs text-cyber-muted font-mono">cancel</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProfileEditor;
