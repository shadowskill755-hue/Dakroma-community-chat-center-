import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import useChatStore from "../context/chatStore";
import socket from "../services/socket";
import ProfileEditor from "./ProfileEditor";
import { RankBadge, XPBar } from "./RankSystem";
import { notify } from "./NotificationSystem";
import { playSound } from "./SoundManager";
import GroupSearch from "./GroupSearch";
import Mailbox, { getUnreadCount } from "./Mailbox";
import WelcomeAnimation from "./WelcomeAnimation";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
const JOINED_KEY = "dakroma_joined_rooms";

const getSaved = () => {
  try { return JSON.parse(localStorage.getItem(JOINED_KEY) || "[]"); }
  catch { return []; }
};

const Sidebar = ({ mobileOpen, onClose, onGoHome, onRoomSelect, onOpenSettings, page = "home" }) => {
  const { user, profile } = useAuth();
  const { rooms, onlineUsers, activeRoom, setActiveRoom, addRoom } = useChatStore();
  const [tab,         setTab]         = useState("rooms");
  const [creating,    setCreating]    = useState(false);
  const [newRoom,     setNewRoom]     = useState({ name:"", description:"", icon:"💬" });
  const [showProfile, setShowProfile] = useState(false);
  const [showSearch,  setShowSearch]  = useState(false);
  const [showMailbox, setShowMailbox] = useState(false);
  const [welcomeRoom, setWelcomeRoom] = useState(null);
  const [unreadMail,  setUnreadMail]  = useState(0);
  const [joinedRooms, setJoinedRooms] = useState(getSaved());

  useEffect(() => {
    fetch(`${BACKEND}/api/rooms`)
      .then(r => r.json())
      .then(data => useChatStore.getState().setRooms(data))
      .catch(() => {});
    setUnreadMail(getUnreadCount());
  }, []);

  const allRooms = [
    ...rooms,
    ...joinedRooms.filter(jr => !rooms.find(r => r.id === jr.id)),
  ];

  const handleRoomTap = (room) => {
    // Save joined room
    const saved = getSaved();
    if (!saved.find(r => r.id === room.id)) {
      const updated = [...saved, room];
      localStorage.setItem(JOINED_KEY, JSON.stringify(updated));
      setJoinedRooms(updated);
    }
    // Show welcome animation
    setWelcomeRoom(room);
    playSound("join");
  };

  const afterWelcome = (room) => {
    socket.emit("room:join", { roomId: room.id, roomName: room.name });
    // Make sure socket is connected before joining
    if (!socket.connected) {
      socket.connect();
      socket.once("connect", () => {
        socket.emit("room:join", { roomId: room.id, roomName: room.name });
      });
    }
    socket.emit("user:join", { uid: user?.uid, username: profile?.username, avatar: profile?.avatar, memberId: profile?.memberId, xp: profile?.xp || 0 });
    setActiveRoom(room.id);
    setWelcomeRoom(null);
    onRoomSelect?.(); // goes to chat
    onClose?.();
  };

  const createRoom = async () => {
    if (!newRoom.name.trim()) return;
    const res = await fetch(`${BACKEND}/api/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newRoom,
        createdBy: profile?.username,
        createdByUid: user?.uid,
      }),
    });
    const room = await res.json();
    addRoom(room);
    socket.emit("room:created", room);
    handleRoomTap(room);
    setCreating(false);
    setNewRoom({ name:"", description:"", icon:"💬" });
    notify(`Room #${room.name} created! ⚡`, "success");
    playSound("levelup");
  };

  return (
    <>
      <aside className={`fixed md:relative inset-y-0 left-0 z-40 w-72 flex flex-col glass border-r border-cyber-border transition-transform duration-300
        ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>

        {/* Header */}
        <div className="p-4 border-b border-cyber-border flex items-center justify-between">
          <div>
            <h1 className="font-cyber text-sm neon-text-cyan tracking-wider">𝖒𝖗᭄𝕯𝖆𝖐𝖗𝖔𝖒𝖆꧂</h1>
            <p className="text-xs text-cyber-muted font-mono mt-0.5">COMMUNITY GRID</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { playSound("click"); onOpenSettings?.(); }}
              className="text-cyber-muted hover:text-cyber-cyan transition-colors text-lg">⚙️</button>
            <button onClick={() => { playSound("click"); setShowMailbox(true); setUnreadMail(0); }}
              className="relative text-cyber-muted hover:text-cyber-cyan transition-colors text-lg">
              📬
              {unreadMail > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyber-pink animate-pulse" />}
            </button>
            <button onClick={() => { playSound("click"); setShowSearch(true); }}
              className="text-cyber-muted hover:text-cyber-cyan transition-colors text-lg">🔍</button>
            <button onClick={onClose} className="md:hidden text-cyber-muted hover:text-cyber-pink text-xl">✕</button>
          </div>
        </div>

        {/* Profile */}
        <div className="p-3 border-b border-cyber-border">
          <div className="flex items-center gap-3 cursor-pointer group"
            onClick={() => { playSound("click"); setShowProfile(true); }}>
            <div className="relative">
              <img
                src={profile?.avatar || `https://api.dicebear.com/7.x/cyberpunk/svg?seed=${profile?.username}`}
                alt="avatar"
                className="w-10 h-10 rounded-full border border-cyber-cyan/40 group-hover:border-cyber-cyan transition-all object-cover"
              />
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-cyber-panel
                ${profile?.status === "busy" ? "bg-red-500" : profile?.status === "away" ? "bg-yellow-500" : "bg-cyber-green"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-cyber text-xs text-white truncate">{profile?.username || "PILOT"}</p>
              <p className="text-xs text-cyber-muted font-mono">{profile?.memberId || "DK-00000"}</p>
            </div>
          </div>
          <div className="mt-2">
            <RankBadge xp={profile?.xp || 0} size="sm" />
            <div className="mt-1"><XPBar xp={profile?.xp || 0} /></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-cyber-border">
          {["rooms","users"].map(t => (
            <button key={t} onClick={() => { playSound("click"); setTab(t); }}
              className={`flex-1 py-2 text-xs font-cyber tracking-widest uppercase transition-colors
                ${tab === t ? "text-cyber-cyan border-b border-cyber-cyan" : "text-cyber-muted hover:text-cyber-text"}`}>
              {t === "rooms" ? "# Rooms" : "👥 Online"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {tab === "rooms" ? (
            <>
              {/* HOME BUTTON */}
              <motion.button
                whileHover={{ x:4 }} whileTap={{ scale:0.98 }}
                onClick={() => { playSound("click"); onGoHome?.(); onClose?.(); }}
                className="w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-3 hover:bg-cyber-card border border-transparent text-cyber-muted hover:text-white mb-1">
                <span className="text-lg">🏠</span>
                <p className="text-sm font-cyber">Home Base</p>
              </motion.button>

              {/* ROOMS */}
              {allRooms.map(room => (
                <motion.button key={room.id}
                  onClick={() => handleRoomTap(room)}
                  whileHover={{ x:4 }} whileTap={{ scale:0.98 }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-3
                    ${activeRoom === room.id && page !== "home"
                      ? "bg-cyan-500/15 border border-cyan-500/30 text-white"
                      : "hover:bg-cyber-card border border-transparent text-cyber-muted hover:text-cyber-text"}`}>
                  <span className="text-lg">{room.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold truncate ${activeRoom === room.id && page !== "home" ? "neon-text-cyan" : ""}`}>
                      #{room.name}
                    </p>
                    {room.description && <p className="text-xs text-cyber-muted truncate">{room.description}</p>}
                  </div>
                  {room.approveMembers && <span className="text-xs">🔒</span>}
                  {activeRoom === room.id && page !== "home" && <span className="w-1.5 h-1.5 rounded-full bg-cyber-cyan flex-shrink-0" />}
                </motion.button>
              ))}

              <button onClick={() => { playSound("click"); setCreating(true); }}
                className="w-full text-left px-3 py-2 text-xs text-cyber-muted hover:text-cyber-cyan font-mono flex items-center gap-2 transition-colors mt-2">
                <span className="text-lg">＋</span> Create Room
              </button>
            </>
          ) : (
            onlineUsers.length === 0
              ? <p className="text-xs text-cyber-muted text-center mt-8 font-mono">No pilots online</p>
              : onlineUsers.map((u, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-cyber-card transition-colors">
                  <div className="relative flex-shrink-0">
                    <img src={u.avatar || `https://api.dicebear.com/7.x/cyberpunk/svg?seed=${u.username}`}
                      alt="" className="w-8 h-8 rounded-full border border-cyber-border object-cover" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cyber-green border-2 border-cyber-panel" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-cyber-text truncate">{u.username}</p>
                    <p className="text-xs text-cyber-muted font-mono">{u.memberId || ""}</p>
                    <RankBadge xp={u.xp || 0} size="sm" />
                  </div>
                </div>
              ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-cyber-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
            <span className="text-xs font-mono text-cyber-muted">{onlineUsers.length} online</span>
          </div>
          <a href="https://vm.tiktok.com/ZS9Y5So3xkPwN-vpVYK/" target="_blank" rel="noopener noreferrer"
            className="text-xs font-mono text-cyber-pink hover:text-cyber-cyan transition-colors">🎵 TikTok</a>
        </div>

        {/* Create room modal */}
        <AnimatePresence>
          {creating && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="absolute inset-0 bg-cyber-bg/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <motion.div initial={{ scale:0.9 }} animate={{ scale:1 }} exit={{ scale:0.9 }}
                className="glass-card rounded-xl p-5 w-full neon-border-cyan space-y-4">
                <h3 className="font-cyber text-sm neon-text-cyan">CREATE ROOM</h3>
                <div className="flex gap-2">
                  <input className="cyber-input w-16 rounded-lg px-2 py-2 text-center text-xl"
                    value={newRoom.icon} onChange={e => setNewRoom(r => ({ ...r, icon:e.target.value }))} maxLength={2} />
                  <input className="cyber-input flex-1 rounded-lg px-3 py-2 text-sm"
                    placeholder="Room name..." value={newRoom.name}
                    onChange={e => setNewRoom(r => ({ ...r, name:e.target.value }))} />
                </div>
                <input className="cyber-input w-full rounded-lg px-3 py-2 text-sm"
                  placeholder="Description (optional)" value={newRoom.description}
                  onChange={e => setNewRoom(r => ({ ...r, description:e.target.value }))} />
                <div className="flex gap-2">
                  <button onClick={() => setCreating(false)} className="flex-1 btn-cyber btn-cyber-pink rounded-lg py-2 text-xs">CANCEL</button>
                  <button onClick={createRoom} className="flex-1 btn-cyber rounded-lg py-2 text-xs">CREATE ⚡</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showProfile && <ProfileEditor onClose={() => setShowProfile(false)} />}
        </AnimatePresence>
      </aside>

      <AnimatePresence>
        {showSearch && <GroupSearch rooms={allRooms} onJoin={handleRoomTap} onClose={() => setShowSearch(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showMailbox && <Mailbox onClose={() => setShowMailbox(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {welcomeRoom && <WelcomeAnimation room={welcomeRoom} onDone={() => afterWelcome(welcomeRoom)} />}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
