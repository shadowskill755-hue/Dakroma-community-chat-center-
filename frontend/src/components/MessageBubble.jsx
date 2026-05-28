import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import socket from "../services/socket";
import { playSound } from "./SoundManager";
import { RankBadge } from "./RankSystem";

const REACTIONS = ["🔥","⚡","💀","🤖","👾","💯","😈","🙏","❤️","😂","😮","😢","👍","👎","🎮","🏆"];

const MessageBubble = ({ msg, isOwn, onReply }) => {
  const { user } = useAuth();
  const [showActions, setShowActions] = useState(false);
  const [showReact, setShowReact] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [deletedForEveryone, setDeletedForEveryone] = useState(msg.deletedForEveryone || false);
  const [localReactions, setLocalReactions] = useState(msg.reactions || {});
  const [customEmoji, setCustomEmoji] = useState("");
  const emojiInputRef = useRef(null);

  const react = (emoji) => {
    if (!emoji) return;
    const uid = user?.uid;
    const updated = { ...localReactions };
    if (!updated[emoji]) updated[emoji] = [];
    if (updated[emoji].includes(uid)) {
      updated[emoji] = updated[emoji].filter(u => u !== uid);
    } else {
      updated[emoji] = [...updated[emoji], uid];
    }
    setLocalReactions(updated);
    socket.emit("message:react", { messageId: msg.id, emoji, room: msg.room });
    setShowReact(false);
    setCustomEmoji("");
    playSound("click");
  };

  const timeStr = (() => {
    try { return new Date(msg.timestamp).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }); }
    catch { return ""; }
  })();

  const handleDeleteForEveryone = () => {
    socket.emit("message:delete", { messageId: msg.id, room: msg.room });
    setDeletedForEveryone(true);
    setShowDeleteMenu(false);
    try {
      const msgs = JSON.parse(localStorage.getItem("dakroma_messages") || "{}");
      const room = msg.room || "global";
      if (msgs[room]) {
        msgs[room] = msgs[room].map(m => m.id === msg.id ? { ...m, deletedForEveryone: true, text: "This message was deleted" } : m);
        localStorage.setItem("dakroma_messages", JSON.stringify(msgs));
      }
    } catch {}
    playSound("click");
  };

  const handleDeleteForMe = () => {
    setDeleted(true);
    setShowDeleteMenu(false);
    try {
      const msgs = JSON.parse(localStorage.getItem("dakroma_messages") || "{}");
      const room = msg.room || "global";
      if (msgs[room]) {
        msgs[room] = msgs[room].filter(m => m.id !== msg.id);
        localStorage.setItem("dakroma_messages", JSON.stringify(msgs));
      }
    } catch {}
    playSound("click");
  };

  if (deleted) return null;

  return (
    <motion.div
      initial={{ opacity:0, y:8 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.2 }}
      className={`flex gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"} items-end mb-2`}>

      <img
        src={msg.avatar || `https://api.dicebear.com/7.x/cyberpunk/svg?seed=${msg.username}`}
        alt={msg.username}
        className="w-8 h-8 rounded-full border border-cyber-border flex-shrink-0 object-cover mb-1"
      />

      <div className={`max-w-[75%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
        <div className={`flex items-center gap-1 mb-0.5 ${isOwn ? "flex-row-reverse" : ""}`}>
          <RankBadge xp={msg.xp || 0} size="sm" />
        </div>

        <div className="relative">
          <div
            onClick={() => { playSound("click"); setShowActions(!showActions); setShowReact(false); setShowDeleteMenu(false); }}
            className={`rounded-2xl text-sm cursor-pointer max-w-full
              ${isOwn
                ? "bg-cyan-700/40 border border-cyan-500/50 text-white rounded-tr-sm"
                : "bg-slate-700/70 border border-slate-500/40 text-white rounded-tl-sm"}`}>

            <div className={`px-3 pt-2 pb-0 flex items-center gap-1.5 flex-wrap ${isOwn ? "flex-row-reverse" : ""}`}>
              <span className="text-xs font-cyber text-cyan-400">{msg.username}</span>
              <span className="text-xs text-white/40 font-mono">{msg.memberId}</span>
            </div>

            <div className="px-3 pb-1 pt-1">
              {deletedForEveryone ? (
                <p className="text-white/40 italic text-xs">🚫 This message was deleted</p>
              ) : (
                <>
                  {msg.replyTo && (
                    <div className="px-2 py-1 rounded-lg border-l-2 border-cyan-400/50 bg-black/20 text-xs text-cyber-muted mb-1">
                      <p className="text-cyan-400/70 font-cyber text-xs">{msg.replyTo.username}</p>
                      <p className="truncate max-w-[200px]">{msg.replyTo.text}</p>
                    </div>
                  )}
                  {msg.imageUrl ? (
                    <img src={msg.imageUrl} alt="shared" className="max-w-[200px] rounded-lg max-h-40 object-cover" />
                  ) : msg.audioUrl ? (
                    <audio controls src={msg.audioUrl} className="max-w-[200px]" />
                  ) : (
                    <p className="whitespace-pre-wrap break-words leading-snug max-w-[220px]">{msg.text}</p>
                  )}
                </>
              )}
            </div>

            <div className={`px-3 pb-1.5 ${isOwn ? "text-right" : "text-left"}`}>
              <span className="text-xs text-white/30 font-mono">{timeStr}</span>
            </div>
          </div>

          {/* Action buttons */}
          <AnimatePresence>
            {showActions && !deletedForEveryone && (
              <motion.div initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.8 }}
                className={`absolute ${isOwn ? "right-0" : "left-0"} -top-11 z-20 flex gap-1 glass-card rounded-xl p-1.5 neon-border-cyan shadow-xl`}>
                <button onClick={() => { onReply?.(msg); setShowActions(false); playSound("click"); }}
                  className="text-sm px-2 py-1 hover:bg-cyber-card rounded-lg">↩️</button>
                <button onClick={() => { setShowReact(true); setShowActions(false); }}
                  className="text-sm px-2 py-1 hover:bg-cyber-card rounded-lg">😊</button>
                <button onClick={() => { setShowDeleteMenu(true); setShowActions(false); }}
                  className="text-sm px-2 py-1 hover:bg-cyber-card rounded-lg">🗑️</button>
                <button onClick={() => setShowActions(false)}
                  className="text-sm px-2 py-1 hover:bg-cyber-card rounded-lg text-cyber-muted">✕</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reaction picker */}
          <AnimatePresence>
            {showReact && (
              <motion.div initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.8 }}
                className={`absolute ${isOwn ? "right-0" : "left-0"} -top-20 z-20 glass-card rounded-xl p-2 neon-border-cyan shadow-xl`}
                style={{ minWidth:"220px" }}>
                {/* Quick reactions */}
                <div className="flex gap-1 flex-wrap mb-2">
                  {REACTIONS.map((e) => (
                    <button key={e} onClick={() => react(e)} className="text-lg hover:scale-125 transition-transform">{e}</button>
                  ))}
                </div>
                {/* Custom emoji input */}
                <div className="flex gap-1">
                  <input
                    ref={emojiInputRef}
                    type="text"
                    value={customEmoji}
                    onChange={(e) => setCustomEmoji(e.target.value)}
                    placeholder="Type any emoji..."
                    className="cyber-input flex-1 rounded-lg px-2 py-1 text-sm"
                    maxLength={2}
                  />
                  <button onClick={() => react(customEmoji)}
                    className="btn-cyber rounded-lg px-2 py-1 text-xs">+</button>
                  <button onClick={() => setShowReact(false)}
                    className="text-xs text-cyber-muted px-1">✕</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Delete menu */}
          <AnimatePresence>
            {showDeleteMenu && (
              <motion.div initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.8 }}
                className={`absolute ${isOwn ? "right-0" : "left-0"} -top-24 z-20 glass-card rounded-xl p-2 neon-border-pink shadow-xl min-w-[180px]`}>
                <p className="text-xs font-cyber text-cyber-muted mb-2 px-1">DELETE MESSAGE</p>
                {isOwn && (
                  <button onClick={handleDeleteForEveryone}
                    className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                    🗑️ Delete for everyone
                  </button>
                )}
                <button onClick={handleDeleteForMe}
                  className="w-full text-left px-3 py-2 text-xs text-cyber-muted hover:bg-cyber-card rounded-lg transition-colors">
                  👁️ Delete for me
                </button>
                <button onClick={() => setShowDeleteMenu(false)}
                  className="w-full text-left px-3 py-2 text-xs text-cyber-muted hover:bg-cyber-card rounded-lg transition-colors">
                  ✕ Cancel
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reactions display */}
        {Object.entries(localReactions).some(([,v]) => v.length > 0) && (
          <div className={`flex gap-1 flex-wrap mt-0.5 ${isOwn ? "justify-end" : "justify-start"}`}>
            {Object.entries(localReactions).map(([emoji, users]) =>
              users.length > 0 ? (
                <button key={emoji} onClick={() => react(emoji)}
                  className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full border transition-colors
                    ${users.includes(user?.uid) ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400" : "border-gray-600 bg-gray-700/50 text-gray-400"}`}>
                  {emoji} {users.length}
                </button>
              ) : null
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MessageBubble;
