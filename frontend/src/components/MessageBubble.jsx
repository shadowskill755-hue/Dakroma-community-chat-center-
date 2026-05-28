import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import socket from "../services/socket";
import { playSound } from "./SoundManager";
import { RankBadge } from "./RankSystem";

const REACTIONS = ["🔥","⚡","💀","🤖","👾","💯","😈","🙏"];

const MessageBubble = ({ msg, isOwn, onReply }) => {
  const { user } = useAuth();
  const [showReact, setShowReact] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const react = (emoji) => {
    socket.emit("message:react", { messageId: msg.id, emoji, room: msg.room });
    setShowReact(false);
    playSound("click");
  };

  const timeStr = (() => {
    try {
      return new Date(msg.timestamp).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
    } catch { return ""; }
  })();

  return (
    <motion.div
      initial={{ opacity:0, y:10 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.2 }}
      className={`flex gap-2.5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>

      {/* Avatar */}
      <img
        src={msg.avatar || `https://api.dicebear.com/7.x/cyberpunk/svg?seed=${msg.username}`}
        alt={msg.username}
        className="w-8 h-8 rounded-full border border-cyber-border flex-shrink-0 self-end object-cover"
      />

      <div className={`max-w-[70%] flex flex-col gap-1 ${isOwn ? "items-end" : "items-start"}`}>

        {/* Single bubble containing everything */}
        <div className="relative">
          <div
            onClick={() => { playSound("click"); setShowActions(!showActions); setShowReact(false); }}
            className={`px-3 py-2 rounded-2xl text-sm cursor-pointer
              ${isOwn
                ? "bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/30 text-white rounded-tr-none"
                : "bg-cyan-900/40 border border-cyan-500/20 text-white rounded-tl-none"}`}>

            {/* Name + ID + Rank inside bubble */}
            <div className={`flex items-center gap-1.5 flex-wrap mb-1 ${isOwn ? "flex-row-reverse" : ""}`}>
              <span className={`text-xs font-cyber ${isOwn ? "text-cyan-300" : "text-cyan-400"}`}>
                {msg.username}
              </span>
              <span className="text-xs text-cyber-muted/60 font-mono">{msg.memberId || ""}</span>
              <RankBadge xp={msg.xp || 0} size="sm" />
            </div>

            {/* Reply preview */}
            {msg.replyTo && (
              <div className="px-2 py-1 rounded-lg border-l-2 border-cyber-cyan/50 bg-black/20 text-xs text-cyber-muted mb-1">
                <p className="font-cyber text-cyber-cyan/70 text-xs">{msg.replyTo.username}</p>
                <p className="truncate">{msg.replyTo.text}</p>
              </div>
            )}

            {/* Image */}
            {msg.imageUrl ? (
              <img src={msg.imageUrl} alt="shared"
                className="max-w-full rounded-lg max-h-48 object-cover mt-1" />
            ) : (
              <p className="whitespace-pre-wrap break-words">{msg.text}</p>
            )}

            {/* Time */}
            <p className={`text-xs text-cyber-muted/40 font-mono mt-1 ${isOwn ? "text-right" : "text-left"}`}>
              {timeStr}
            </p>
          </div>

          {/* Action popup */}
          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity:0, scale:0.8 }}
                animate={{ opacity:1, scale:1 }}
                exit={{ opacity:0, scale:0.8 }}
                className={`absolute ${isOwn ? "right-0" : "left-0"} -top-11 z-20
                  flex gap-1 glass-card rounded-xl p-1.5 neon-border-cyan shadow-xl`}>
                <button onClick={() => { onReply?.(msg); setShowActions(false); playSound("click"); }}
                  className="text-sm px-2 py-1 hover:bg-cyber-card rounded-lg">↩️</button>
                <button onClick={() => { setShowReact(true); setShowActions(false); }}
                  className="text-sm px-2 py-1 hover:bg-cyber-card rounded-lg">😊</button>
                <button onClick={() => setShowActions(false)}
                  className="text-sm px-2 py-1 hover:bg-cyber-card rounded-lg text-cyber-muted">✕</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reaction picker */}
          <AnimatePresence>
            {showReact && (
              <motion.div
                initial={{ opacity:0, scale:0.8 }}
                animate={{ opacity:1, scale:1 }}
                exit={{ opacity:0, scale:0.8 }}
                className={`absolute ${isOwn ? "right-0" : "left-0"} -top-14 z-20
                  flex gap-1 glass-card rounded-xl p-2 neon-border-cyan shadow-xl`}>
                {REACTIONS.map((e) => (
                  <button key={e} onClick={() => react(e)}
                    className="text-lg hover:scale-125 transition-transform">{e}</button>
                ))}
                <button onClick={() => setShowReact(false)}
                  className="text-xs text-cyber-muted ml-1 self-center">✕</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reactions */}
        {msg.reactions && Object.entries(msg.reactions).some(([,v]) => v.length > 0) && (
          <div className={`flex gap-1 flex-wrap ${isOwn ? "justify-end" : "justify-start"}`}>
            {Object.entries(msg.reactions).map(([emoji, users]) =>
              users.length > 0 ? (
                <button key={emoji} onClick={() => react(emoji)}
                  className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-colors
                    ${users.includes(user?.uid)
                      ? "border-cyber-cyan/50 bg-cyan-500/10 text-cyber-cyan"
                      : "border-cyber-border bg-cyber-card text-cyber-muted"}`}>
                  {emoji} <span>{users.length}</span>
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
