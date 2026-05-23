// ============================================================
// NotificationSystem - Cyberpunk notifications (600ms)
// ============================================================
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

let addNotif = null;

export const notify = (message, type = "info", duration = 3000) => {
  if (addNotif) addNotif({ message, type, duration, id: Date.now() });
};

const NotificationSystem = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    addNotif = (notif) => {
      setNotifications((n) => [...n.slice(-4), notif]);
      setTimeout(() => {
        setNotifications((n) => n.filter((x) => x.id !== notif.id));
      }, notif.duration);
    };
    return () => { addNotif = null; };
  }, []);

  const colors = {
    info:    "border-cyber-cyan/50 bg-cyan-500/10 text-cyber-cyan",
    success: "border-green-500/50 bg-green-500/10 text-green-400",
    error:   "border-red-500/50 bg-red-500/10 text-red-400",
    warning: "border-yellow-500/50 bg-yellow-500/10 text-yellow-400",
    rank:    "border-purple-500/50 bg-purple-500/10 text-purple-400",
  };

  const icons = {
    info: "⚡", success: "✅", error: "❌", warning: "⚠️", rank: "🏆"
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div key={n.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ duration: 0.6 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border glass-card font-mono text-xs max-w-xs ${colors[n.type] || colors.info}`}>
            <span>{icons[n.type] || "⚡"}</span>
            <span>{n.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationSystem;
