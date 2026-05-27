import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import HomePage from "./HomePage";
import SettingsPage from "./SettingsPage";
import useSocket from "../hooks/useSocket";
import { playSound } from "../components/SoundManager";

const ChatPage = () => {
  const { logout } = useAuth();
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [page,         setPage]         = useState("home");
  const [showSettings, setShowSettings] = useState(false);
  useSocket();

  return (
    <div className="flex h-screen overflow-hidden bg-cyber-bg">

      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onGoHome={() => { setPage("home"); setMobileOpen(false); }}
        onRoomSelect={() => { setPage("chat"); setMobileOpen(false); }}
        onOpenSettings={() => { playSound("click"); setShowSettings(true); }}
        page={page}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {page === "home" ? (
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
