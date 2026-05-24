// ============================================================
// GroupSearch - Search and discover groups
// ============================================================
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playSound } from "./SoundManager";
import { notify } from "./NotificationSystem";

const GroupSearch = ({ rooms = [], onJoin, onClose }) => {
  const [query, setQuery] = useState("");
  const [joining, setJoining] = useState(null);

  const filtered = rooms.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase()) ||
    r.description?.toLowerCase().includes(query.toLowerCase())
  );

  const handleJoin = (room) => {
    playSound("join");
    setJoining(room.id);
    setTimeout(() => {
      onJoin?.(room);
      setJoining(null);
      notify(`⚡ Joined #${room.name}!`, "success");
      onClose?.();
    }, 1500);
  };

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div initial={{ y:100 }} animate={{ y:0 }} exit={{ y:100 }}
        className="glass-card rounded-t-2xl md:rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col neon-border-cyan">

        {/* Header */}
        <div className="p-4 border-b border-cyber-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-cyber text-sm neon-text-cyan">🔍 FIND GROUPS</h2>
            <button onClick={onClose} className="text-cyber-muted hover:text-cyber-pink">✕</button>
          </div>
          <input
            className="cyber-input w-full rounded-xl px-4 py-3 text-sm"
            placeholder="Search groups..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-cyber text-xs text-cyber-muted">No groups found</p>
            </div>
          ) : (
            filtered.map((room) => (
              <motion.div key={room.id} whileHover={{ x:4 }}
                className="flex items-center gap-3 p-3 rounded-xl glass border border-cyber-border hover:border-cyber-cyan/30 transition-all">
                <span className="text-2xl">{room.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-cyber text-sm text-white">#{room.name}</p>
                  {room.description && (
                    <p className="text-xs text-cyber-muted truncate font-body">{room.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {room.approveMembers ? (
                      <span className="text-xs font-mono text-yellow-400">🔒 Private</span>
                    ) : (
                      <span className="text-xs font-mono text-green-400">🌐 Public</span>
                    )}
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale:0.95 }}
                  onClick={() => handleJoin(room)}
                  disabled={joining === room.id}
                  className="btn-cyber rounded-lg px-3 py-2 text-xs font-cyber disabled:opacity-50">
                  {joining === room.id ? (
                    <span className="flex items-center gap-1">
                      <motion.span animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity }}>⚡</motion.span>
                      Joining...
                    </span>
                  ) : "JOIN"}
                </motion.button>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GroupSearch;
