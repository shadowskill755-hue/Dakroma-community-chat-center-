import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import useChatStore from "../context/chatStore";
import socket from "../services/socket";
import MessageBubble from "./MessageBubble";
import GroupInfo from "./GroupInfo";
import { processBotCommand, BotMessage } from "./GroupBot";
import { notify } from "./NotificationSystem";
import { playSound } from "./SoundManager";
import { getRank } from "./RankSystem";
import VoiceRecorder from "./VoiceRecorder";

const ChatWindow = ({ onMenuOpen }) => {
  const { user, profile, saveProfile } = useAuth();
  const { messages, typingUsers, activeRoom, rooms, onlineUsers, systemMsgs, addMessage } = useChatStore();
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [botMsgs, setBotMsgs] = useState({});
  const [replyTo, setReplyTo] = useState(null);
  const [showVoice, setShowVoice] = useState(false);
  const endRef = useRef(null);
  const typingTimer = useRef(null);
  const fileRef = useRef(null);

  const allJoinedRooms = [
    ...rooms,
    ...JSON.parse(localStorage.getItem("dakroma_joined_rooms") || "[]")
  ];
  const roomMessages = messages[activeRoom] || [];
  const roomTyping = typingUsers[activeRoom] || [];
  const currentRoom = allJoinedRooms.find((r) => r.id === activeRoom);
  const onlineHere = onlineUsers.filter((u) => u.room === activeRoom);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [roomMessages.length, roomTyping.length]);

  const awardXP = useCallback(() => {
    const currentXP = profile?.xp || 0;
    const newXP = currentXP + 10;
    const oldRank = getRank(currentXP);
    const newRank = getRank(newXP);
    saveProfile(user.uid, { xp: newXP });
    if (newRank.tier > oldRank.tier) {
      notify(`🏆 RANK UP! You are now ${newRank.icon} ${newRank.name}!`, "rank", 5000);
      playSound("levelup");
    }
  }, [profile, user, saveProfile]);

  const addBotMessage = (text, room) => {
    const id = Date.now();
    setBotMsgs((prev) => ({
      ...prev,
      [room || activeRoom]: [...(prev[room || activeRoom] || []), { id, text }],
    }));
  };

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
    const trimmed = text.trim();

    if (trimmed.startsWith("dk.")) {
      const isAdmin = currentRoom?.createdBy === user?.uid ||
        currentRoom?.admins?.includes(user?.uid);
      processBotCommand({
        text: trimmed,
        sender: { ...profile, uid: user?.uid },
        members: onlineHere,
        roomId: activeRoom,
        isAdmin,
        addBotMessage,
        onAnnounce: (msg) => socket.emit("message:send", { text: msg, room: activeRoom }),
      });
      setText("");
      return;
    }

    // Add message locally IMMEDIATELY for instant feedback
    const localMsg = {
      id: Date.now() + Math.random(),
      uid: user?.uid,
      username: profile?.username,
      avatar: profile?.avatar,
      memberId: profile?.memberId,
      xp: profile?.xp || 0,
      text: trimmed,
      imageUrl: null,
      replyTo: replyTo ? { id: replyTo.id, text: replyTo.text, username: replyTo.username } : null,
      room: activeRoom,
      timestamp: Date.now(),
      reactions: {},
    };
    addMessage(localMsg);

    // Also send to server
    socket.emit("message:send", {
      text: trimmed,
      room: activeRoom,
      replyTo: replyTo ? { id: replyTo.id, text: replyTo.text, username: replyTo.username } : null,
      memberId: profile?.memberId,
      xp: profile?.xp || 0,
    });

    awardXP();
    setText("");
    setReplyTo(null);
    playSound("message");
    clearTimeout(typingTimer.current);
    setTyping(false);
    socket.emit("typing:stop", { room: activeRoom });
  }, [text, activeRoom, profile, user, currentRoom, onlineHere, awardXP, replyTo, addMessage]);

  const handleVoiceSend = (audioDataUrl) => {
    const localMsg = {
      id: Date.now() + Math.random(),
      uid: user?.uid,
      username: profile?.username,
      avatar: profile?.avatar,
      memberId: profile?.memberId,
      xp: profile?.xp || 0,
      text: "🎤 Voice message",
      audioUrl: audioDataUrl,
      room: activeRoom,
      timestamp: Date.now(),
      reactions: {},
    };
    addMessage(localMsg);
    socket.emit("message:send", { text: "🎤 Voice message", audioUrl: audioDataUrl, room: activeRoom, memberId: profile?.memberId, xp: profile?.xp || 0 });
    setShowVoice(false);
    awardXP();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const localMsg = {
        id: Date.now() + Math.random(),
        uid: user?.uid,
        username: profile?.username,
        avatar: profile?.avatar,
        memberId: profile?.memberId,
        xp: profile?.xp || 0,
        text: "📷 Shared an image",
        imageUrl: ev.target.result,
        room: activeRoom,
        timestamp: Date.now(),
        reactions: {},
      };
      addMessage(localMsg);
      socket.emit("message:send", {
        text: "📷 Shared an image",
        imageUrl: ev.target.result,
        room: activeRoom,
        memberId: profile?.memberId,
        xp: profile?.xp || 0,
      });
      playSound("message");
      awardXP();
    };
    reader.readAsDataURL(file);
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const allMessages = [
    ...(roomMessages || []),
    ...(botMsgs[activeRoom] || []).map((m) => ({ ...m, isBot: true })),
  ].sort((a, b) => (a.timestamp || a.id) - (b.timestamp || b.id));

  return (
    <main className="flex-1 flex flex-col min-h-0 relative">
      {/* Header */}
      <div className="glass border-b border-cyber-border px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button onClick={onMenuOpen} className="md:hidden text-cyber-muted hover:text-cyber-cyan text-xl mr-1">☰</button>
        <span className="text-2xl">{currentRoom?.icon || "🌐"}</span>
        <div className="flex-1">
          <h2 className="font-cyber text-sm text-white">#{currentRoom?.name || "global"}</h2>
          <p className="text-xs text-cyber-muted font-mono">{onlineHere.length} pilot{onlineHere.length !== 1 ? "s" : ""} in room</p>
        </div>
        <button onClick={() => { playSound("click"); setShowInfo(true); }}
          className="text-cyber-muted hover:text-cyber-cyan transition-colors text-xl">ℹ️</button>
        <div className="flex items-center gap-2 glass rounded-full px-3 py-1 neon-border-cyan">
          <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
          <span className="text-xs font-mono text-cyber-cyan">{onlineUsers.length} ONLINE</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-40 gap-4">
            <div className="text-6xl">{currentRoom?.icon || "⚡"}</div>
            <p className="font-cyber text-sm text-cyber-muted text-center">
              No signals yet.<br />Be the first pilot to transmit.
            </p>
          </div>
        ) : (
          allMessages.map((msg) =>
            msg.isBot ? (
              <BotMessage key={msg.id} text={msg.text} />
            ) : (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isOwn={msg.username === profile?.username}
                onReply={setReplyTo}
              />
            )
          )
        )}
        <AnimatePresence>
          {roomTyping.filter((u) => u.uid !== user?.uid).map((u) => (
            <motion.div key={u.uid} initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              className="flex items-center gap-2">
              <img src={`https://api.dicebear.com/7.x/cyberpunk/svg?seed=${u.username}`}
                className="w-6 h-6 rounded-full border border-cyber-border" alt="" />
              <div className="glass rounded-xl px-3 py-2 flex items-center gap-1 neon-border-cyan">
                {[0,1,2].map((i) => (
                  <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-cyber-cyan"
                    animate={{ opacity:[0.3,1,0.3], y:[0,-3,0] }}
                    transition={{ duration:0.8, repeat:Infinity, delay:i*0.2 }} />
                ))}
                <span className="text-xs text-cyber-muted ml-1 font-mono">{u.username}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      {/* Reply preview */}
      <AnimatePresence>
        {replyTo && (
          <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className="mx-3 mb-1 px-3 py-2 glass rounded-xl border-l-2 border-cyber-cyan/50 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-cyber text-cyber-cyan">{replyTo.username}</p>
              <p className="text-xs text-cyber-muted truncate">{replyTo.text}</p>
            </div>
            <button onClick={() => setReplyTo(null)} className="text-cyber-muted hover:text-cyber-pink ml-2">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="glass border-t border-cyber-border p-3 flex-shrink-0">
        <div className="flex gap-2 items-end">
          <button onClick={() => { playSound("click"); setShowVoice(!showVoice); }}
            className="text-cyber-muted hover:text-cyber-cyan transition-colors text-xl flex-shrink-0 mb-2">🎤</button>
          <button onClick={() => fileRef.current.click()}
            className="text-cyber-muted hover:text-cyber-cyan transition-colors text-xl flex-shrink-0 mb-2">
            🖼️
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <div className="flex-1 relative">
            <textarea
              className="cyber-input w-full rounded-xl px-4 py-3 text-sm resize-none leading-relaxed"
              rows={1}
              placeholder={`Transmit to #${currentRoom?.name || "global"}... (dk. for bot)`}
              value={text}
              onChange={handleInput}
              onKeyDown={onKey}
              style={{ maxHeight:"120px", overflowY:"auto" }}
            />
          </div>
          <motion.button onClick={send} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
            disabled={!text.trim()}
            className="btn-cyber rounded-xl px-4 py-3 text-lg disabled:opacity-30 flex-shrink-0"
            style={{ minWidth:"52px", height:"52px" }}>
            ⚡
          </motion.button>
        </div>
        <div className="mt-2 flex justify-center">
          <a href="https://vm.tiktok.com/ZS9Y5So3xkPwN-vpVYK/" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 glass rounded-full px-4 py-1.5 neon-border-pink hover:border-cyber-pink transition-all group">
            <span className="text-sm">🎵</span>
            <span className="text-xs font-cyber text-cyber-pink tracking-wider">WATCH ON TIKTOK</span>
            <span className="text-xs text-cyber-muted">↗</span>
          </a>
        </div>
      </div>

      <AnimatePresence>
        {showVoice && (
          <VoiceRecorder onSend={handleVoiceSend} onClose={() => setShowVoice(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInfo && (
          <GroupInfo
            group={currentRoom}
            members={onlineHere}
            onClose={() => setShowInfo(false)}
            onAnnounce={(msg) => socket.emit("message:send", { text: msg, room: activeRoom })}
          />
        )}
      </AnimatePresence>
    </main>
  );
};

export default ChatWindow;
