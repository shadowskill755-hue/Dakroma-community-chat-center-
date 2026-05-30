// ============================================================
// SettingsPage - Logout + Manual/Guide
// ============================================================
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { playSound } from "../components/SoundManager";
import { notify } from "../components/NotificationSystem";

const MANUAL_SECTIONS = [
  {
    icon: "⚡",
    title: "Getting Started",
    content: `Welcome to the Dakroma Community Grid! This is a cyberpunk-themed chat platform built for the Free Fire MENA community.

After creating your account you get a unique DK-ID (like DK-12345). This ID is how others can find and add you as a friend for private messaging.`
  },
  {
    icon: "🏆",
    title: "Rank System",
    content: `Every message you send earns you 10 XP. As you gain XP your rank increases:

🥉 Bronze (0 XP)
🥈 Silver (500 XP)
🥇 Gold (1,500 XP)
💎 Platinum (3,000 XP)
💠 Diamond (6,000 XP)
👑 Master (10,000 XP)
⚡ Grand Master (20,000 XP)

Each rank has 5 sub-levels. The more you chat the higher you climb!`
  },
  {
    icon: "💬",
    title: "Chat Rooms",
    content: `Tap ☰ to open the sidebar and see all available rooms. Tap any room to join it.

You can also create your own room by tapping + Create Room. Set a name, icon and description.

Private rooms require approval from the owner before you can join. Public rooms are open to everyone.

When you join a room for the first time you will see a welcome animation!`
  },
  {
    icon: "🤖",
    title: "Bot Commands (dk.)",
    content: `Group admins can use bot commands by typing dk. followed by a command:

dk.kick [id] - Kick a member
dk.mute [id] [time] - Mute a member (max 1hr)
dk.unmute [id] - Unmute a member
dk.muteall - Mute all members (max 1hr)
dk.unmuteall - Unmute everyone
dk.status [id] - View member profile
dk.callall - Notify all members
dk.prompt [id] - Promote to admin
dk.live - Start a live session
dk.tournament - Open tournament board
dk.myprofile - Show your admin profile
dk.translate [id] [msg] - Translate message
dk.delete [id] - Delete a message

Bot must be unlocked in Group Info first!`
  },
  {
    icon: "🖼️",
    title: "Profile & Energy",
    content: `Tap your profile picture in the sidebar to edit your profile.

You have 3 energy points to change your profile picture. When energy runs out you can refill by:

🎵 Following @shadowdriod on TikTok → +5 Energy
💬 Joining the WhatsApp group → +5 Energy

You can also set your status to Online, Busy or Away.`
  },
  {
    icon: "👥",
    title: "Friends & Private Messages",
    content: `You can add friends by their DK-ID number. Go to Home Base and tap the + button in the Contacts section.

Enter your friend's DK-ID (like DK-12345) and tap ADD. Once added you can chat privately with them just like WhatsApp.

Your DK-ID is shown on your profile card in the sidebar and on your messages.`
  },
  {
    icon: "🏆",
    title: "Tournament System",
    content: `Group admins can run tournaments inside any group. Type dk.tournament or go to Group Info → ⋮ menu → Host Tournament.

The admin fills in bracket slots with member names. After each match the admin advances the winner to the next round.

The bot automatically announces updates to the group chat. The winner receives a special congratulations message!`
  },
  {
    icon: "🔴",
    title: "Go Live",
    content: `Group admins can go live inside their group. Go to Group Info → ⋮ menu → Go Live.

To unlock Go Live you must follow @shadowdriod on TikTok.

When you go live the bot notifies all group members. Members can join the live chat room to watch and interact.`
  },
  {
    icon: "📬",
    title: "Mailbox System",
    content: `Your mailbox (📬 icon in sidebar) receives:

🚪 Join Requests - When someone wants to join your private group
💌 Apology Letters - When a kicked member wants to rejoin

A red blinking dot appears on the mailbox icon when you have unread messages. Tap to open and Accept or Decline requests.`
  },
  {
    icon: "🌐",
    title: "Mr Dakroma's Group",
    content: `Mr Dakroma's official group has special features:

👑 Epic dark fantasy intro animation
✓ Blue verification checkmark
🔒 Approval only - owner approves all members
📱 Claude AI required before messaging
📚 Projects library shows all Mr Dakroma's work:
  • Dakroma Masterpiece
  • Dakroma Hub

This group is the main hub for the Free Fire MENA community!`
  },
];

const SettingsPage = ({ onClose, onLogout }) => {
  const clearCache = () => {
    localStorage.removeItem("dakroma_messages");
    localStorage.removeItem("dakroma_joined_rooms");
    window.location.reload();
  };
  const { profile } = useAuth();
  const [showManual, setShowManual] = useState(false);
  const [openSection, setOpenSection] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-50 flex flex-col bg-cyber-bg">

      {/* Header */}
      <div className="glass border-b border-cyber-border px-4 py-3 flex items-center gap-3">
        <button onClick={onClose} className="text-cyber-muted hover:text-cyber-cyan text-xl">←</button>
        <h2 className="font-cyber text-sm neon-text-cyan flex-1">⚙️ SETTINGS</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-w-lg mx-auto w-full">

        {/* Profile info */}
        <div className="glass-card rounded-2xl p-4 neon-border-cyan flex items-center gap-3">
          <img src={profile?.avatar || `https://api.dicebear.com/7.x/cyberpunk/svg?seed=${profile?.username}`}
            alt="" className="w-12 h-12 rounded-full border border-cyber-cyan/40 object-cover" />
          <div>
            <p className="font-cyber text-sm text-white">{profile?.username}</p>
            <p className="text-xs text-cyber-muted font-mono">{profile?.memberId}</p>
          </div>
        </div>

        {/* Library / Manual */}
        <div className="glass-card rounded-2xl overflow-hidden border border-cyber-border">
          <button onClick={() => { playSound("click"); setShowManual(!showManual); }}
            className="w-full flex items-center justify-between p-4 hover:bg-cyber-card transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-xl">📚</span>
              <div className="text-left">
                <p className="font-cyber text-sm text-white">Library & Manual</p>
                <p className="text-xs text-cyber-muted font-body">Full guide to all features</p>
              </div>
            </div>
            <span className={`text-cyber-muted transition-transform ${showManual ? "rotate-180" : ""}`}>▼</span>
          </button>

          <AnimatePresence>
            {showManual && (
              <motion.div initial={{ height:0 }} animate={{ height:"auto" }} exit={{ height:0 }}
                className="overflow-hidden">
                <div className="border-t border-cyber-border">
                  {MANUAL_SECTIONS.map((s, i) => (
                    <div key={i} className="border-b border-cyber-border last:border-0">
                      <button onClick={() => { playSound("click"); setOpenSection(openSection === i ? null : i); }}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-cyber-card transition-colors">
                        <div className="flex items-center gap-2">
                          <span>{s.icon}</span>
                          <span className="font-cyber text-xs text-white">{s.title}</span>
                        </div>
                        <span className={`text-cyber-muted text-xs transition-transform ${openSection === i ? "rotate-180" : ""}`}>▼</span>
                      </button>
                      <AnimatePresence>
                        {openSection === i && (
                          <motion.div initial={{ height:0 }} animate={{ height:"auto" }} exit={{ height:0 }}
                            className="overflow-hidden">
                            <div className="px-4 pb-4">
                              <p className="text-xs text-cyber-muted font-body leading-relaxed whitespace-pre-line">{s.content}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* App info */}
        <div className="glass-card rounded-2xl p-4 border border-cyber-border space-y-2">
          <p className="font-cyber text-xs text-cyber-muted tracking-widest">ABOUT</p>
          <p className="text-xs text-cyber-text font-body">Dakroma Community Grid v2.0</p>
          <p className="text-xs text-cyber-muted font-body">Built for Free Fire MENA Community</p>
          <p className="text-xs text-cyber-muted font-body">Made by Mr Dakroma 👨‍💻</p>
          <div className="flex gap-3 mt-2">
            <a href="https://www.tiktok.com/@shadowdriod" target="_blank" rel="noopener noreferrer"
              className="text-xs text-cyber-pink font-mono hover:text-cyber-cyan transition-colors">🎵 TikTok</a>
            <a href="https://chat.whatsapp.com/IqRC1ZTy8zH2AmfMj5jq1Z" target="_blank" rel="noopener noreferrer"
              className="text-xs text-cyber-pink font-mono hover:text-cyber-cyan transition-colors">💬 WhatsApp</a>
          </div>
        </div>

        {/* Logout */}
        <button onClick={() => { playSound("click"); setShowLogoutConfirm(true); }}
          className="w-full py-4 rounded-2xl border border-red-500/50 bg-red-500/10 font-cyber text-sm tracking-widest transition-all hover:bg-red-500/20"
          style={{ color:"#ff4444" }}>
          ⏻ LOG OUT
        </button>
        <button onClick={clearCache}
          className="w-full py-3 rounded-2xl border border-yellow-500/50 bg-yellow-500/10 font-cyber text-sm tracking-widest transition-all hover:bg-yellow-500/20 mt-2"
          style={{ color:"#ffcc00" }}>
          🗑️ CLEAR CACHE
        </button>
      </div>

      {/* Logout confirm */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
            <motion.div initial={{ scale:0.85 }} animate={{ scale:1 }}
              className="glass-card rounded-2xl p-6 w-full max-w-sm border border-red-500/50 text-center">
              <p className="text-4xl mb-3">⏻</p>
              <h3 className="font-cyber text-sm text-white mb-2">LOG OUT?</h3>
              <p className="text-xs text-cyber-muted font-body mb-6">Are you sure you want to leave the grid?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 btn-cyber rounded-xl py-3 text-xs font-cyber">STAY</button>
                <button onClick={() => { onLogout?.(); setShowLogoutConfirm(false); }}
                  className="flex-1 rounded-xl py-3 text-xs font-cyber border border-red-500/50 bg-red-500/10 transition-all hover:bg-red-500/20"
                  style={{ color:"#ff4444" }}>LOGOUT</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SettingsPage;
