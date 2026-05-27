// ============================================================
// ChatPage – home page + chat + settings
// ============================================================
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import HomePage from "./HomePage";
import SettingsPage from "./SettingsPage";
import useChatStore from "../context/chatStore";
import useSocket from "../hooks/useSocket";
import { playSound } from "../components/SoundManager";

const ChatPage = () => {
  const { logout } = useAuth();
  const { activeRoom } = useChatStore();
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [showHome,     setShowHome]     = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  useSocket();

  const handleRoomSelect = () => {
    setShowHome(false);
    setMobileOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-cyber-bg relative">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setMobileOpen(false)} />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onRoomSelect={() => setShowHome(false)}
        onOpenSettings={() => { playSound("click"); setShowSettings(true); }}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <AnimatePresence mode="wait">
          {showHome ? (
            <motion.div key="home" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="flex-1 flex flex-col min-h-0">
              <HomePage onOpenSidebar={() => setMobileOpen(true)} />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="flex-1 flex flex-col min-h-0">
              <ChatWindow onMenuOpen={() => setMobileOpen(true)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Settings */}
      <AnimatePresence>
        {showSettings && (
          <SettingsPage
            onClose={() => setShowSettings(false)}
            onLogout={() => { logout(); setShowSettings(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatPage;
