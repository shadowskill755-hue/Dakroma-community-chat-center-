import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import socket from "../services/socket";
import { playSound } from "./SoundManager";
import { RankBadge } from "./RankSystem";

const REACTIONS = ["🔥","⚡","💀","🤖","👾","💯","😈","🙏"];

const MessageBubble = ({ msg, isOwn, onReply, onDeleteForEveryone, onDeleteForMe }) => {
  const { user } = useAuth();
  const [showActions, setShowActions] = useState(false);
  const [showReact, setShowReact] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [deletedForEveryone, setDeletedForEveryone] = useState(msg.deletedForEveryone || false);

  const react = (emoji) => {
    socket.emit("message:react", { messageId: msg.id, emoji, room: msg.room });
    setShowReact(false);
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
    playSound("click");
  };

  const handleDeleteForMe = () => {
    setDeleted(true);
    setShowDeleteMenu(false);
    playSound("click");
  };

  if (deleted) return null;

  return (
    <motion.div
      initial={{ opacity:0, y:8 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.2 }}
      className={`flex gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"} items-end mb-1`}>

      <img
        src={msg.avatar || `https://api.dicebear.com/7.x/cyberpunk/svg?seed=${msg.username}`}
        alt={msg.username}
        className="w-7 h-7 rounded-full border border-cyber-border flex-shrink-0 object-cover"
      />

      <div className={`max-w-[72%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
        {/* Name + ID + Rank outside bubble */}
        <div className={`flex items-center gap-1 mb-0.5 px-1 flex-wrap ${isOwn ? "flex-row-reverse" : ""}`}>
          <span className="text-xs font-cyber text-cyan-400">{msg.username}</span>
          <span className="text-xs text-cyber-muted/50 font-mono">{msg.memberId}</span>
          <RankBadge xp={msg.xp || 0} size="sm" />
        </div>

        <div className="relative">
          {/* Bubble */}
          <div
            onClick={() => { playSound("click"); setShowActions(!showActions); setShowReact(false); setShowDeleteMenu(false); }}
            className={`px-3 py-2 rounded-2xl text-sm cursor-pointer
              ${isOwn
                ? "bg-cyan-600/30 border border-cyan-500/40 text-white rounded-tr-sm"
                : "bg-gray-700/60 border border-gray-600/40 text-white rounded-tl-sm"}`}>

            {deletedForEveryone ? (
              <p className="text-cyber-muted italic text-xs">🚫 This message was deleted</p>
            ) : (
              <>
                {msg.replyTo && (
                  <div className="px-2 py-1 rounded-lg border-l-2 border-cyan-400/50 bg-black/20 text-xs text-cyber-muted mb-1">
                    <p className="text-cyan-400/70 font-cyber text-xs">{msg.replyTo.username}</p>
                    <p className="truncate">{msg.replyTo.text}</p>
                  </div>
                )}
                {msg.imageUrl ? (
                  <img src={msg.imageUrl} alt="shared" className="max-w-full rounded-lg max-h-40 object-cover" />
                ) : (
                  <p className="whitespace-pre-wrap break-words leading-snug">{msg.text}</p>
                )}
              </>
            )}

            <p className={`text-xs text-white/30 font-mono mt-0.5 ${isOwn ? "text-right" : "text-left"}`}>
              {timeStr}
            </p>
          </div>

          {/* Action buttons */}
          <AnimatePresence>
            {showActions && !deletedForEveryone && (
              <motion.div initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.8 }}
                className={`absolute ${isOwn ? "right-0" : "left-0"} -top-11 z-20 flex gap-1 glass-card rounded-xl p-1.5 neon-border-cyan shadow-xl`}>
                <button onClick={() => { onReply?.(msg); setShowActions(false); playSound("click"); }}
                  className="text-sm px-2 py-1 hover:bg-cyber-card rounded-lg" title="Reply">↩️</button>
                <button onClick={() => { setShowReact(true); setShowActions(false); }}
                  className="text-sm px-2 py-1 hover:bg-cyber-card rounded-lg" title="React">😊</button>
                <button onClick={() => { setShowDeleteMenu(true); setShowActions(false); }}
                  className="text-sm px-2 py-1 hover:bg-cyber-card rounded-lg" title="Delete">🗑️</button>
                <button onClick={() => setShowActions(false)}
                  className="text-sm px-2 py-1 hover:bg-cyber-card rounded-lg text-cyber-muted">✕</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reaction picker */}
          <AnimatePresence>
            {showReact && (
              <motion.div initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.8 }}
                className={`absolute ${isOwn ? "right-0" : "left-0"} -top-12 z-20 flex gap-1 glass-card rounded-xl p-2 neon-border-cyan shadow-xl`}>
                {REACTIONS.map((e) => (
                  <button key={e} onClick={() => react(e)} className="text-lg hover:scale-125 transition-transform">{e}</button>
                ))}
                <button onClick={() => setShowReact(false)} className="text-xs text-cyber-muted ml-1 self-center">✕</button>
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
                    className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors font-body">
                    🗑️ Delete for everyone
                  </button>
                )}
                <button onClick={handleDeleteForMe}
                  className="w-full text-left px-3 py-2 text-xs text-cyber-muted hover:bg-cyber-card rounded-lg transition-colors font-body">
                  👁️ Delete for me
                </button>
                <button onClick={() => setShowDeleteMenu(false)}
                  className="w-full text-left px-3 py-2 text-xs text-cyber-muted hover:bg-cyber-card rounded-lg transition-colors font-body">
                  ✕ Cancel
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reactions */}
        {msg.reactions && Object.entries(msg.reactions).some(([,v]) => v.length > 0) && (
          <div className={`flex gap-1 flex-wrap mt-0.5 ${isOwn ? "justify-end" : "justify-start"}`}>
            {Object.entries(msg.reactions).map(([emoji, users]) =>
              users.length > 0 ? (
                <button key={emoji} onClick={() => react(emoji)}
                  className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full border
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
