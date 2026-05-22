// ============================================================
// ChatWindow – messages + input area
// ============================================================
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth }      from "../context/AuthContext";
import useChatStore     from "../context/chatStore";
import socket           from "../services/socket";
import MessageBubble    from "./MessageBubble";

const ChatWindow = ({ onMenuOpen }) => {
  const { user, profile }  = useAuth();
  const { messages, typingUsers, activeRoom, rooms, onlineUsers, systemMsgs } = useChatStore();
  const [text, setText]    = useState("");
  const [typing, setTyping]= useState(false);
  const endRef   = useRef(null);
  const typingTimer = useRef(null);

  const roomMessages = messages[activeRoom] || [];
  const roomTyping   = typingUsers[activeRoom] || [];
  const currentRoom  = rooms.find((r) => r.id === activeRoom);
  const onlineHere   = onlineUsers.filter((u) => u.room === activeRoom);

  // Auto scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [roomMessages.length, roomTyping.length]);

  // Typing indicator logic
  const handleInput = (e) => {
    setText(e.target.value);
    if (!typing) {
      setTyping(true);
      socket.emit("typing:start", { room: activeRoom });
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setTyping(false);
      socket.emit("typing:stop", { room: activeRoom });
    }, 2000);
  };

  const send = useCallback(() => {
    if (!text.trim()) return;
    socket.emit("message:send", { text: text.trim(), room: activeRoom });
    // Award XP locally (real XP would be tracked server-side)
    setText("");
    clearTimeout(typingTimer.current);
    setTyping(false);
    socket.emit("typing:stop", { room: activeRoom });
  }, [text, activeRoom]);

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  // Recent system msgs for this room (last 3 unique)
  const recentSystem = systemMsgs.slice(-3);

  return (
    <main className="flex-1 flex flex-col min-h-0 relative">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="glass border-b border-cyber-border px-4 py-3 flex items-center gap-3 flex-shrink-0">
        {/* Mobile menu toggle */}
        <button onClick={onMenuOpen}
          className="md:hidden text-cyber-muted hover:text-cyber-cyan text-xl mr-1">☰</button>

        <span className="text-2xl">{currentRoom?.icon || "🌐"}</span>
        <div>
          <h2 className="font-cyber text-sm text-white">#{currentRoom?.name || "global"}</h2>
          <p className="text-xs text-cyber-muted font-mono">
            {onlineHere.length} pilot{onlineHere.length !== 1 ? "s" : ""} in room
          </p>
        </div>

        {/* Live online badge */}
        <div className="ml-auto flex items-center gap-2 glass rounded-full px-3 py-1 neon-border-cyan">
          <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
          <span className="text-xs font-mono text-cyber-cyan">{onlineUsers.length} ONLINE</span>
        </div>
      </div>

      {/* ── System messages toast ─────────────────────────── */}
      <AnimatePresence>
        {recentSystem.length > 0 && (
          <div className="absolute top-16 left-0 right-0 z-10 flex flex-col items-center gap-1 pointer-events-none">
            {recentSystem.map((s) => (
              <motion.div key={s.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="glass rounded-full px-4 py-1 text-xs font-mono text-cyber-yellow border border-yellow-500/20">
                {s.text}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* ── Messages area ─────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {roomMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-40 gap-4">
            <div className="text-6xl">{currentRoom?.icon || "⚡"}</div>
            <p className="font-cyber text-sm text-cyber-muted text-center">
              No signals yet.<br />Be the first pilot to transmit.
            </p>
          </div>
        ) : (
          roomMessages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isOwn={msg.uid === user?.uid}
            />
          ))
        )}

        {/* Typing indicators */}
        <AnimatePresence>
          {roomTyping.filter((u) => u.uid !== user?.uid).map((u) => (
            <motion.div key={u.uid}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2">
              <img src={`https://api.dicebear.com/7.x/cyberpunk/svg?seed=${u.username}`}
                className="w-6 h-6 rounded-full border border-cyber-border" alt="" />
              <div className="glass rounded-xl px-3 py-2 flex items-center gap-1 neon-border-cyan">
                {[0,1,2].map((i) => (
                  <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-cyber-cyan"
                    animate={{ opacity: [0.3,1,0.3], y: [0,-3,0] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }} />
                ))}
                <span className="text-xs text-cyber-muted ml-1 font-mono">{u.username}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <div ref={endRef} />
      </div>

      {/* ── Input bar ─────────────────────────────────────── */}
      <div className="glass border-t border-cyber-border p-3 flex-shrink-0">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              className="cyber-input w-full rounded-xl px-4 py-3 text-sm resize-none leading-relaxed"
              rows={1}
              placeholder={`Transmit to #${currentRoom?.name || "global"}...`}
              value={text}
              onChange={handleInput}
              onKeyDown={onKey}
              style={{ maxHeight: "120px", overflowY: "auto" }}
            />
            {/* Character count */}
            {text.length > 200 && (
              <span className={`absolute bottom-2 right-3 text-xs font-mono
                ${text.length > 480 ? "text-cyber-red" : "text-cyber-muted"}`}>
                {text.length}/500
              </span>
            )}
          </div>

          <motion.button
            onClick={send}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={!text.trim()}
            className="btn-cyber rounded-xl px-4 py-3 text-lg flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ minWidth: "52px", height: "52px" }}
          >
            ⚡
          </motion.button>
        </div>

        {/* TikTok footer link */}
        <div className="mt-2 flex justify-center">
          <a
            href="https://vm.tiktok.com/ZS9Y5So3xkPwN-vpVYK/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 glass rounded-full px-4 py-1.5 neon-border-pink hover:border-cyber-pink transition-all group"
          >
            <span className="text-sm">🎵</span>
            <span className="text-xs font-cyber text-cyber-pink group-hover:neon-text-pink tracking-wider">
              WATCH ON TIKTOK
            </span>
            <span className="text-xs text-cyber-muted">↗</span>
          </a>
        </div>
      </div>
    </main>
  );
};

export default ChatWindow;
