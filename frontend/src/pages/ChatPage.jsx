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

  return (
    <div className="flex h-screen overflow-hidden bg-cyber-bg relative">
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setMobileOpen(false)} />
        )}
      </AnimatePresence>

      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onGoHome={() => { setShowHome(true); setMobileOpen(false); }}
        onRoomSelect={() => { setShowHome(false); setMobileOpen(false); }}
        onOpenSettings={() => { playSound("click"); setShowSettings(true); }}
      />

      <div className="flex-1 flex flex-col min-w-0 relative">
        {showHome ? (
          <HomePage onOpenSidebar={() => setMobileOpen(true)} />
        ) : (
          <ChatWindow onMenuOpen={() => setMobileOpen(true)} />
        )}
      </div>

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
