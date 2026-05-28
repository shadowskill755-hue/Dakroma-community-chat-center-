// ============================================================
// HomePage - Profile, activity, contacts, private messaging
// ============================================================
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { RankBadge, XPBar } from "../components/RankSystem";
import { notify } from "../components/NotificationSystem";
import { playSound } from "../components/SoundManager";

const FRIENDS_KEY = "dakroma_friends";
const MESSAGES_KEY = "dakroma_dm_messages";

const getFriends = () => {
  try { return JSON.parse(localStorage.getItem(FRIENDS_KEY) || "[]"); }
  catch { return []; }
};

const getDMs = () => {
  try { return JSON.parse(localStorage.getItem(MESSAGES_KEY) || "{}"); }
  catch { return {}; }
};

const COUNTRIES = ["🇸🇦 Saudi Arabia","🇦🇪 UAE","🇪🇬 Egypt","🇮🇶 Iraq","🇯🇴 Jordan","🇰🇼 Kuwait","🇱🇧 Lebanon","🇲🇦 Morocco","🇴🇲 Oman","🇶🇦 Qatar","🇸🇩 Sudan","🇾🇪 Yemen","🇩🇿 Algeria","🇹🇳 Tunisia","🇱🇾 Libya","🇧🇭 Bahrain","🇵🇸 Palestine","🇳🇬 Nigeria","🇬🇭 Ghana","🇰🇪 Kenya","🇺🇸 USA","🇬🇧 UK","🇫🇷 France","🇩🇪 Germany","🌍 Other"];

const HomePage = ({ onOpenSidebar }) => {
  const { profile, saveProfile } = useAuth();
  const [friends, setFriends]       = useState(getFriends());
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendId, setFriendId]     = useState("");
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [dmText, setDmText]         = useState("");
  const [dms, setDms]               = useState(getDMs());
  const [showCountry, setShowCountry] = useState(!profile?.country);

  const allUsers = (() => {
    try { return Object.values(JSON.parse(localStorage.getItem("dakroma_users") || "{}")); }
    // also check all registered users across all groups
    catch { return []; }
  })();

  const addFriend = () => {
    if (!friendId.trim()) return;
    const found = allUsers.find((u) => u.memberId === friendId.trim());
    if (!found) { notify("❌ Member ID not found!", "error"); return; }
    if (friends.find((f) => f.memberId === friendId)) { notify("Already friends!", "info"); return; }
    const newFriend = { uid: found.uid, username: found.username, memberId: found.memberId, avatar: found.avatar, xp: found.xp || 0 };
    const updated = [...friends, newFriend];
    setFriends(updated);
    localStorage.setItem(FRIENDS_KEY, JSON.stringify(updated));
    setFriendId("");
    setShowAddFriend(false);
    playSound("levelup");
    notify(`✅ ${found.username} added!`, "success");
  };

  const sendDM = () => {
    if (!dmText.trim() || !selectedFriend) return;
    const key = [profile?.uid, selectedFriend.uid].sort().join("_");
    const msg = { id: Date.now(), from: profile?.uid, fromName: profile?.username, text: dmText.trim(), timestamp: Date.now() };
    const updated = { ...dms, [key]: [...(dms[key] || []), msg] };
    setDms(updated);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(updated));
    setDmText("");
    playSound("message");
  };

  const getDMKey = (friend) => [profile?.uid, friend.uid].sort().join("_");

  const setCountry = (country) => {
    saveProfile(profile?.uid, { country });
    setShowCountry(false);
    notify("🌍 Country saved!", "success");
  };

  const stats = [
    { label: "Messages Sent", value: Math.floor((profile?.xp || 0) / 10), icon: "💬" },
    { label: "Total XP", value: profile?.xp || 0, icon: "⚡" },
    { label: "Friends", value: friends.length, icon: "👥" },
    { label: "Rank", value: profile?.xp >= 20000 ? "Grand Master" : profile?.xp >= 10000 ? "Master" : profile?.xp >= 6000 ? "Diamond" : profile?.xp >= 3000 ? "Platinum" : profile?.xp >= 1500 ? "Gold" : profile?.xp >= 500 ? "Silver" : "Bronze", icon: "🏆" },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-cyber-bg">
      {/* Header */}
      <div className="glass border-b border-cyber-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={onOpenSidebar} className="text-cyber-muted hover:text-cyber-cyan text-xl">☰</button>
        <h2 className="font-cyber text-sm neon-text-cyan flex-1">HOME BASE</h2>
        <span className="text-xs font-mono text-cyber-muted">{new Date().toLocaleDateString()}</span>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Profile card */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          className="glass-card rounded-2xl p-5 neon-border-cyan">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img src={profile?.avatar || `https://api.dicebear.com/7.x/cyberpunk/svg?seed=${profile?.username}`}
                alt="avatar" className="w-16 h-16 rounded-full border-2 border-cyber-cyan/50 object-cover" />
              <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-cyber-panel
                ${profile?.status === "busy" ? "bg-red-500" : profile?.status === "away" ? "bg-yellow-500" : "bg-cyber-green"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-cyber text-white text-base">{profile?.username}</h3>
              </div>
              <p className="text-xs font-mono text-cyber-muted">{profile?.memberId}</p>
              <p className="text-xs text-cyber-muted">{profile?.country || "🌍 No country set"}</p>
              <div className="mt-1">
                <RankBadge xp={profile?.xp || 0} size="sm" />
              </div>
            </div>
          </div>
          <div className="mt-3">
            <XPBar xp={profile?.xp || 0} />
          </div>
        </motion.div>

        {/* Activity stats */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}>
          <p className="font-cyber text-xs text-cyber-muted tracking-widest mb-2">📊 YOUR ACTIVITY</p>
          <div className="grid grid-cols-2 gap-2">
            {stats.map((s, i) => (
              <div key={i} className="glass-card rounded-xl p-3 border border-cyber-border">
                <p className="text-xl mb-1">{s.icon}</p>
                <p className="font-cyber text-lg text-white">{s.value}</p>
                <p className="text-xs text-cyber-muted font-body">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Contacts / Friends */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}>
          <div className="flex items-center justify-between mb-2">
            <p className="font-cyber text-xs text-cyber-muted tracking-widest">💬 CONTACTS</p>
            <button onClick={() => { playSound("click"); setShowAddFriend(true); }}
              className="w-8 h-8 rounded-full border border-cyber-cyan/50 bg-cyan-500/10 flex items-center justify-center text-cyber-cyan hover:bg-cyan-500/20 transition-colors text-lg">
              +
            </button>
          </div>

          {friends.length === 0 ? (
            <div className="glass-card rounded-xl p-6 text-center border border-cyber-border">
              <p className="text-3xl mb-2">👥</p>
              <p className="font-cyber text-xs text-cyber-muted">No contacts yet</p>
              <p className="text-xs text-cyber-muted font-body mt-1">Tap + to add friends by their DK-ID</p>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map((f) => {
                const key = getDMKey(f);
                const msgs = dms[key] || [];
                const last = msgs[msgs.length - 1];
                return (
                  <motion.div key={f.uid} whileTap={{ scale:0.98 }}
                    onClick={() => { playSound("click"); setSelectedFriend(f); }}
                    className="flex items-center gap-3 p-3 glass-card rounded-xl border border-cyber-border hover:border-cyber-cyan/30 cursor-pointer transition-all">
                    <div className="relative">
                      <img src={f.avatar || `https://api.dicebear.com/7.x/cyberpunk/svg?seed=${f.username}`}
                        alt="" className="w-10 h-10 rounded-full border border-cyber-border object-cover" />
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-cyber-green border-2 border-cyber-panel" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-cyber text-sm text-white">{f.username}</p>
                      <p className="text-xs text-cyber-muted font-mono">{f.memberId}</p>
                      {last && <p className="text-xs text-cyber-muted truncate font-body">{last.fromName}: {last.text}</p>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Quick access to groups */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}>
          <p className="font-cyber text-xs text-cyber-muted tracking-widest mb-2">⚡ QUICK ACCESS</p>
          <button onClick={onOpenSidebar}
            className="w-full btn-cyber rounded-xl py-3 text-xs font-cyber tracking-widest flex items-center justify-center gap-2">
            ☰ OPEN GROUPS MENU
          </button>
        </motion.div>
      </div>

      {/* Add Friend Modal */}
      <AnimatePresence>
        {showAddFriend && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <motion.div initial={{ scale:0.85 }} animate={{ scale:1 }}
              className="glass-card rounded-2xl p-6 w-full max-w-sm neon-border-cyan">
              <h3 className="font-cyber text-sm neon-text-cyan mb-4 text-center">ADD FRIEND</h3>
              <p className="text-xs text-cyber-muted font-mono text-center mb-4">Enter their DK-ID number</p>
              <input className="cyber-input w-full rounded-xl px-4 py-3 text-sm mb-4 text-center font-mono tracking-widest"
                placeholder="DK-XXXXX" value={friendId}
                onChange={(e) => setFriendId(e.target.value.toUpperCase())} />
              <div className="flex gap-3">
                <button onClick={() => setShowAddFriend(false)}
                  className="flex-1 btn-cyber btn-cyber-pink rounded-xl py-3 text-xs font-cyber">CANCEL</button>
                <button onClick={addFriend}
                  className="flex-1 btn-cyber rounded-xl py-3 text-xs font-cyber">ADD ⚡</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DM Modal */}
      <AnimatePresence>
        {selectedFriend && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-50 flex flex-col bg-cyber-bg">
            {/* DM Header */}
            <div className="glass border-b border-cyber-border px-4 py-3 flex items-center gap-3">
              <button onClick={() => setSelectedFriend(null)}
                className="text-cyber-muted hover:text-cyber-cyan text-xl">←</button>
              <img src={selectedFriend.avatar || `https://api.dicebear.com/7.x/cyberpunk/svg?seed=${selectedFriend.username}`}
                alt="" className="w-8 h-8 rounded-full border border-cyber-border object-cover" />
              <div>
                <p className="font-cyber text-sm text-white">{selectedFriend.username}</p>
                <p className="text-xs text-cyber-muted font-mono">{selectedFriend.memberId}</p>
              </div>
            </div>

            {/* DM Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {(dms[getDMKey(selectedFriend)] || []).length === 0 ? (
                <div className="text-center mt-20 opacity-40">
                  <p className="text-4xl mb-2">💬</p>
                  <p className="font-cyber text-xs text-cyber-muted">No messages yet</p>
                </div>
              ) : (
                (dms[getDMKey(selectedFriend)] || []).map((msg) => (
                  <div key={msg.id} className={`flex ${msg.from === profile?.uid ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm
                      ${msg.from === profile?.uid ? "msg-bubble-own" : "msg-bubble-other"}`}>
                      <p>{msg.text}</p>
                      <p className="text-xs opacity-50 mt-1 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* DM Input */}
            <div className="glass border-t border-cyber-border p-3 flex gap-2">
              <input className="cyber-input flex-1 rounded-xl px-4 py-3 text-sm"
                placeholder="Send message..."
                value={dmText}
                onChange={(e) => setDmText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendDM()} />
              <button onClick={sendDM}
                className="btn-cyber rounded-xl px-4 py-3 text-lg"
                style={{ minWidth:"52px", height:"52px" }}>⚡</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Country selector */}
      <AnimatePresence>
        {showCountry && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <motion.div initial={{ scale:0.85 }} animate={{ scale:1 }}
              className="glass-card rounded-2xl p-6 w-full max-w-sm neon-border-cyan">
              <h3 className="font-cyber text-sm neon-text-cyan mb-2 text-center">SELECT YOUR COUNTRY</h3>
              <p className="text-xs text-cyber-muted font-mono text-center mb-4">Let others know where you're from</p>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {COUNTRIES.map((c) => (
                  <button key={c} onClick={() => setCountry(c)}
                    className="text-left px-3 py-2 rounded-lg border border-cyber-border hover:border-cyber-cyan/50 hover:bg-cyan-500/10 transition-all text-sm text-cyber-text font-body">
                    {c}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomePage;
