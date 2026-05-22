// ============================================================
// ChatPage – main app shell
// ============================================================
import { useState } from "react";
import { motion }   from "framer-motion";
import Sidebar      from "../components/Sidebar";
import ChatWindow   from "../components/ChatWindow";
import AIOrb        from "../components/AIOrb";
import useSocket    from "../hooks/useSocket";

const ChatPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useSocket(); // Connect socket & bind events

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-screen flex overflow-hidden relative scan-overlay"
      style={{ background: "radial-gradient(ellipse at 20% 50%, #0a1628 0%, #020408 60%)" }}
    >
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <Sidebar
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <ChatWindow onMenuOpen={() => setSidebarOpen(true)} />

      {/* Floating AI Orb */}
      <AIOrb />
    </motion.div>
  );
};

export default ChatPage;
