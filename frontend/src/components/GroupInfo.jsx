// ============================================================
// GroupInfo - WhatsApp style group info with admin features
// ============================================================
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { notify } from "./NotificationSystem";
import { playSound } from "./SoundManager";
import { RankBadge } from "./RankSystem";
import TournamentBracket from "./TournamentBracket";

const GroupInfo = ({ group, members = [], onClose, onAnnounce }) => {
  const { profile } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [botEnabled, setBotEnabled] = useState(group?.botEnabled || false);
  const [approveMembers, setApproveMembers] = useState(group?.approveMembers || false);
  const [allowPictures, setAllowPictures] = useState(group?.allowPictures || true);
  const [showTournament, setShowTournament] = useState(false);
  const [showBotUnlock, setShowBotUnlock] = useState(false);
  const isOwner = profile?.uid === group?.createdBy;
  const isAdmin = isOwner || group?.admins?.includes(profile?.uid);

  const toggleBot = () => {
    if (!botEnabled) { setShowBotUnlock(true); return; }
    setBotEnabled(false);
    notify("Bot disabled", "info");
  };

  const unlockBot = () => {
    setBotEnabled(true);
    setShowBotUnlock(false);
    playSound("levelup");
    notify("🤖 DK-BOT activated!", "success");
  };

  const Toggle = ({ label, value, onChange, adminOnly = false }) => (
    <div className={`flex items-center justify-between py-3 border-b border-cyber-border ${adminOnly && !isAdmin ? "opacity-40 pointer-events-none" : ""}`}>
      <span className="text-sm text-cyber-text font-body">{label}</span>
      <button onClick={() => { playSound("click"); onChange(!value); }}
        className={`w-12 h-6 rounded-full border transition-all relative ${value ? "border-cyber-cyan bg-cyan-500/20" : "border-cyber-border bg-cyber-card"}`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${value ? "left-6 bg-cyber-cyan" : "left-0.5 bg-cyber-muted"}`} />
      </button>
    </div>
  );

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div initial={{ y:100 }} animate={{ y:0 }} exit={{ y:100 }}
        className="glass-card rounded-t-2xl md:rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto neon-border-cyan">

        {/* Header */}
        <div className="sticky top-0 glass flex items-center justify-between p-4 border-b border-cyber-border">
          <h2 className="font-cyber text-sm neon-text-cyan">GROUP INFO</h2>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button onClick={() => { playSound("click"); setShowMenu(!showMenu); }}
                className="text-cyber-muted hover:text-cyber-cyan text-xl relative">
                ⋮
                <AnimatePresence>
                  {showMenu && (
                    <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.9 }}
                      className="absolute right-0 top-6 glass-card rounded-xl border border-cyber-border w-48 z-10 overflow-hidden">
                      {[
                        { label: "🏆 Tournament", action: () => { setShowTournament(true); setShowMenu(false); } },
                        { label: "🔴 Go Live", action: () => { onAnnounce?.(`🔴 Admin ${profile?.username} is going LIVE!`); setShowMenu(false); } },
                        { label: "📢 Call All", action: () => { onAnnounce?.(`📢 Admin ${profile?.username} called all members!`); setShowMenu(false); } },
                      ].map((item) => (
                        <button key={item.label} onClick={() => { playSound("click"); item.action(); }}
                          className="w-full text-left px-4 py-3 text-sm text-cyber-text hover:bg-cyber-card transition-colors border-b border-cyber-border last:border-0 font-body">
                          {item.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            )}
            <button onClick={onClose} className="text-cyber-muted hover:text-cyber-pink">✕</button>
          </div>
        </div>

        {/* Group avatar */}
        <div className="p-6 text-center border-b border-cyber-border">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-3xl mx-auto mb-3">
            {group?.icon || "💬"}
          </div>
          <h3 className="font-cyber text-lg text-white">{group?.name}</h3>
          <p className="text-cyber-muted text-sm font-body mt-1">{group?.description}</p>
          <p className="text-cyber-muted text-xs font-mono mt-2">{members.length} members</p>
        </div>

        {/* Admin settings */}
        {isAdmin && (
          <div className="p-4 border-b border-cyber-border">
            <p className="font-cyber text-xs text-cyber-muted tracking-widest mb-3">ADMIN SETTINGS</p>
            <Toggle label="🤖 Bot Functionality" value={botEnabled} onChange={toggleBot} adminOnly />
            <Toggle label="✅ Approve Members" value={approveMembers} onChange={setApproveMembers} adminOnly />
            <Toggle label="🖼️ Allow Pictures" value={allowPictures} onChange={setAllowPictures} adminOnly />

            {botEnabled && (
              <div className="mt-3 p-3 glass rounded-xl border border-purple-500/30">
                <p className="font-cyber text-xs text-purple-400 mb-2">BOT COMMANDS</p>
                <div className="text-xs font-mono text-cyber-muted space-y-1">
                  {["dk.kick [id]","dk.mute [id] [time]","dk.unmute [id]","dk.muteall","dk.unmuteall",
                    "dk.status [id]","dk.callall","dk.prompt [id]","dk.live","dk.tournament","dk.myprofile"].map((cmd) => (
                    <p key={cmd} className="text-cyber-cyan">{cmd}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Members list */}
        <div className="p-4">
          <p className="font-cyber text-xs text-cyber-muted tracking-widest mb-3">MEMBERS</p>
          <div className="space-y-2">
            {members.map((m, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-cyber-card transition-colors">
                <div className="relative">
                  <img src={m.avatar || `https://api.dicebear.com/7.x/cyberpunk/svg?seed=${m.username}`}
                    alt="" className="w-9 h-9 rounded-full border border-cyber-border" />
                  <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-cyber-panel ${m.online ? "bg-cyber-green" : "bg-cyber-muted"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate font-body">{m.username}</p>
                  <RankBadge xp={m.xp || 0} size="sm" />
                </div>
                {group?.createdBy === m.uid && (
                  <span className="text-xs font-cyber text-cyber-cyan">👑 Owner</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Bot unlock modal */}
      <AnimatePresence>
        {showBotUnlock && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
            <motion.div initial={{ scale:0.85 }} animate={{ scale:1 }}
              className="glass-card rounded-2xl p-6 w-full max-w-sm neon-border-pink text-center">
              <p className="text-4xl mb-3">🤖</p>
              <h3 className="font-cyber text-sm neon-text-pink mb-2">UNLOCK BOT</h3>
              <p className="text-xs text-cyber-muted mb-6 font-mono">To unlock bot functionality you must:</p>
              <div className="space-y-3">
                <a href="https://www.tiktok.com/@shadowdriod" target="_blank" rel="noopener noreferrer"
                  onClick={unlockBot}
                  className="block btn-cyber rounded-xl py-3 text-xs font-cyber tracking-widest">
                  🎵 FOLLOW @shadowdriod ON TIKTOK
                </a>
                <p className="text-xs text-cyber-muted font-mono">OR</p>
                <a href="https://wa.me/234XXXXXXXXXX" target="_blank" rel="noopener noreferrer"
                  onClick={unlockBot}
                  className="block btn-cyber btn-cyber-pink rounded-xl py-3 text-xs font-cyber tracking-widest">
                  💬 SAY HI TO MR DAKROMA
                </a>
              </div>
              <button onClick={() => setShowBotUnlock(false)} className="mt-4 text-xs text-cyber-muted font-mono">cancel</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tournament */}
      <AnimatePresence>
        {showTournament && (
          <TournamentBracket members={members} onClose={() => setShowTournament(false)} onAnnounce={onAnnounce} />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default GroupInfo;
