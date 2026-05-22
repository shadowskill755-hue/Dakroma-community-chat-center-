// ============================================================
// MessageBubble – single chat message with reactions
// ============================================================
import { useState } from "react";
import { motion }   from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { useAuth }  from "../context/AuthContext";
import socket       from "../services/socket";

const REACTIONS = ["🔥","⚡","💀","🤖","👾","💯","😈","🙏"];

const MessageBubble = ({ msg, isOwn }) => {
  const { user } = useAuth();
  const [showReact, setShowReact] = useState(false);

  const react = (emoji) => {
    socket.emit("message:react", { messageId: msg.id, emoji, room: msg.room });
    setShowReact(false);
  };

  const timeAgo = (() => {
    try { return formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true }); }
    catch { return "just now"; }
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`flex gap-2.5 group ${isOwn ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <img
        src={msg.avatar || `https://api.dicebear.com/7.x/cyberpunk/svg?seed=${msg.username}`}
        alt={msg.username}
        className="w-8 h-8 rounded-full border border-cyber-border flex-shrink-0 self-end"
      />

      <div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"} flex flex-col gap-1`}>
        {/* Username + time */}
        <div className={`flex items-center gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
          <span className={`text-xs font-cyber ${isOwn ? "neon-text-cyan" : "text-cyber-muted"}`}>
            {msg.username}
          </span>
          <span className="text-xs text-cyber-muted/60 font-mono">{timeAgo}</span>
        </div>

        {/* Message */}
        <div className="relative">
          <div className={`px-3 py-2 rounded-xl text-sm leading-relaxed
            ${isOwn ? "msg-bubble-own rounded-tr-none" : "msg-bubble-other rounded-tl-none"}`}>
            <p className="text-cyber-text whitespace-pre-wrap break-words">{msg.text}</p>
          </div>

          {/* Reaction button (hover) */}
          <button
            onClick={() => setShowReact((s) => !s)}
            className="absolute -bottom-2 right-1 opacity-0 group-hover:opacity-100 transition-opacity
              text-xs bg-cyber-card border border-cyber-border rounded-full w-5 h-5 flex items-center justify-center"
          >
            +
          </button>

          {/* Reaction picker */}
          {showReact && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`absolute bottom-6 ${isOwn ? "right-0" : "left-0"} z-10
                flex gap-1 glass-card rounded-xl p-2 neon-border-cyan shadow-xl`}
            >
              {REACTIONS.map((e) => (
                <button key={e} onClick={() => react(e)}
                  className="text-lg hover:scale-125 transition-transform">{e}</button>
              ))}
            </motion.div>
          )}
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
