// ============================================================
// Mailbox - Join requests + apology letters
// ============================================================
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { notify } from "./NotificationSystem";
import { playSound } from "./SoundManager";

const MAILBOX_KEY = "dakroma_mailbox";

export const getMailbox = () => {
  try { return JSON.parse(localStorage.getItem(MAILBOX_KEY) || "[]"); }
  catch { return []; }
};

export const addToMailbox = (item) => {
  const box = getMailbox();
  const updated = [...box, { ...item, id: Date.now(), read: false }];
  localStorage.setItem(MAILBOX_KEY, JSON.stringify(updated));
};

export const getUnreadCount = () => getMailbox().filter((m) => !m.read).length;

const Mailbox = ({ onClose, onAcceptMember, onDeclineMember }) => {
  const { profile } = useAuth();
  const [mails, setMails] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const box = getMailbox();
    setMails(box);
    // Mark all as read
    const updated = box.map((m) => ({ ...m, read: true }));
    localStorage.setItem(MAILBOX_KEY, JSON.stringify(updated));
  }, []);

  const handleAccept = (mail) => {
    playSound("levelup");
    notify(`✅ ${mail.username} accepted!`, "success");
    onAcceptMember?.(mail);
    const updated = mails.filter((m) => m.id !== mail.id);
    setMails(updated);
    localStorage.setItem(MAILBOX_KEY, JSON.stringify(updated));
    setSelected(null);
  };

  const handleDecline = (mail) => {
    playSound("click");
    notify(`❌ ${mail.username} declined`, "info");
    const updated = mails.filter((m) => m.id !== mail.id);
    setMails(updated);
    localStorage.setItem(MAILBOX_KEY, JSON.stringify(updated));
    setSelected(null);
  };

  const typeColors = {
    join:    "border-cyber-cyan/40 bg-cyan-500/10",
    apology: "border-yellow-500/40 bg-yellow-500/10",
    system:  "border-purple-500/40 bg-purple-500/10",
  };

  const typeIcons = {
    join: "🚪", apology: "💌", system: "⚡"
  };

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div initial={{ y:100 }} animate={{ y:0 }} exit={{ y:100 }}
        className="glass-card rounded-t-2xl md:rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col neon-border-cyan">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-cyber-border">
          <h2 className="font-cyber text-sm neon-text-cyan">📬 MAILBOX</h2>
          <button onClick={onClose} className="text-cyber-muted hover:text-cyber-pink">✕</button>
        </div>

        {/* Mail list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {mails.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">📭</p>
              <p className="font-cyber text-xs text-cyber-muted">No messages</p>
            </div>
          ) : (
            mails.map((mail) => (
              <motion.div key={mail.id} whileTap={{ scale:0.98 }}
                onClick={() => { playSound("click"); setSelected(mail); }}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${typeColors[mail.type] || typeColors.system}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{typeIcons[mail.type] || "⚡"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-cyber text-xs text-white truncate">{mail.title}</p>
                    <p className="text-xs text-cyber-muted truncate font-body">{mail.preview}</p>
                    <p className="text-xs text-cyber-muted font-mono mt-0.5">
                      {new Date(mail.id).toLocaleTimeString()}
                    </p>
                  </div>
                  {!mail.read && (
                    <span className="w-2.5 h-2.5 rounded-full bg-cyber-pink animate-pulse flex-shrink-0" />
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Mail detail */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
            <motion.div initial={{ scale:0.85 }} animate={{ scale:1 }}
              className="glass-card rounded-2xl p-6 w-full max-w-sm neon-border-cyan">
              <div className="text-center mb-4">
                <p className="text-3xl mb-2">{typeIcons[selected.type]}</p>
                <h3 className="font-cyber text-sm text-white">{selected.title}</h3>
                <p className="text-xs text-cyber-muted font-mono">{selected.username} · {selected.memberId}</p>
              </div>
              <div className="glass rounded-xl p-3 mb-4 border border-cyber-border">
                <p className="text-sm text-cyber-text font-body leading-relaxed">{selected.message}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleDecline(selected)}
                  className="flex-1 btn-cyber btn-cyber-pink rounded-xl py-2 text-xs font-cyber">
                  DECLINE ✕
                </button>
                <button onClick={() => handleAccept(selected)}
                  className="flex-1 btn-cyber rounded-xl py-2 text-xs font-cyber">
                  ACCEPT ✅
                </button>
              </div>
              <button onClick={() => setSelected(null)}
                className="w-full mt-2 text-xs text-cyber-muted font-mono text-center">back</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Mailbox;
