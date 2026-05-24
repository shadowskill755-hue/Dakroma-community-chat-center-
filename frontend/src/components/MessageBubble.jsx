// ============================================================
// MessageBubble – with reply, member ID, reactions
// ============================================================
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
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

  const timeAgo = (() => {
    try { return formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true }); }
    catch { return "just now"; }
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-2.5 group ${isOwn ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <img
        src={msg.avatar || `https://api.dicebear.com/7.x/cyberpunk/svg?seed=${msg.username}`}
        alt={msg.username}
        className="w-8 h-8 rounded-full border border-cyber-border flex-shrink-0 self-end object-cover"
      />

      <div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"} flex flex-col gap-1`}>
        {/* Username + ID + time */}
        <div className={`flex items-center gap-2 flex-wrap ${isOwn ? "flex-row-reverse" : ""}`}>
          <span className={`text-xs font-cyber ${isOwn ? "neon-text-cyan" : "text-cyber-muted"}`}>
            {msg.username}
          </span>
          <span className="text-xs text-cyber-muted/60 font-mono">{msg.memberId || "DK-00000"}</span>
          <RankBadge xp={msg.xp || 0} size="sm" />
          <span className="text-xs text-cyber-muted/40 font-mono">{timeAgo}</span>
        </div>

        {/* Reply preview */}
        {msg.replyTo && (
          <div className={`px-3 py-1.5 rounded-lg border-l-2 border-cyber-cyan/50 bg-cyber-card/50 text-xs text-cyber-muted max-w-full ${isOwn ? "self-end" : "self-start"}`}>
            <p className="font-cyber text-cyber-cyan/70 text-xs">{msg.replyTo.username}</p>
            <p className="truncate">{msg.replyTo.text}</p>
          </div>
        )}

        {/* Message */}
        <div className="relative">
          <div
            className={`px-3 py-2 rounded-xl text-sm leading-relaxed cursor-pointer
              ${isOwn ? "msg-bubble-own rounded-tr-none" : "msg-bubble-other rounded-tl-none"}`}
            onClick={() => setShowActions(!showActions)}
          >
            {/* Image message */}
            {msg.imageUrl ? (
              <img src={msg.imageUrl} alt="shared" className="max-w-full rounded-lg max-h-48 object-cover" />
            ) : (
              <p className="text-cyber-text whitespace-pre-wrap break-words">{msg.text}</p>
            )}
          </div>

          {/* Action buttons on tap */}
          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity:0, scale:0.8 }}
                animate={{ opacity:1, scale:1 }}
                exit={{ opacity:0, scale:0.8 }}
                className={`absolute ${isOwn ? "right-0" : "left-0"} -top-10 z-10 flex gap-1 glass-card rounded-xl p-1.5 neon-border-cyan shadow-xl`}
              >
                <button onClick={() => { onReply?.(msg); setShowActions(false); playSound("click"); }}
                  className="text-sm px-2 py-1 hover:bg-cyber-card rounded-lg transition-colors" title="Reply">
                  ↩️
                </button>
                <button onClick={() => { setShowReact(true); setShowActions(false); }}
                  className="text-sm px-2 py-1 hover:bg-cyber-card rounded-lg transition-colors" title="React">
                  😊
                </button>
                <button onClick={() => setShowActions(false)}
                  className="text-sm px-2 py-1 hover:bg-cyber-card rounded-lg transition-colors text-cyber-muted">
                  ✕
                </button>
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
                className={`absolute ${isOwn ? "right-0" : "left-0"} -top-12 z-10 flex gap-1 glass-card rounded-xl p-2 neon-border-cyan shadow-xl`}
              >
                {REACTIONS.map((e) => (
                  <button key={e} onClick={() => react(e)}
                    className="text-lg hover:scale-125 transition-transform">{e}</button>
                ))}
                <button onClick={() => setShowReact(false)}
                  className="text-xs text-cyber-muted ml-1">✕</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reactions display */}
        {msg.reactions && Object.entries(msg.reactions).some(([, v]) => v.length > 0) && (
          <div className={`flex gap-1 flex-wrap ${isOwn ? "justify-end" : "justify-start"}`}>
            {Object.entries(msg.reactions).map(([emoji, users]) =>
              users.length > 0 ? (
                <button key={emoji} onClick={() => react(emoji)}
                  className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-colors
                    ${users.includes(user?.uid)
                      ? "border-cyber-cyan/50 bg-cyan-500/10 text-cyber-cyan"
                      : "border-cyber-border bg-cyber-card text-cyber-muted hover:border-cyber-cyan/30"}`}>
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
