// ============================================================
// App.jsx – first time intro + home page + routing
// ============================================================
import { useState, useEffect }                    from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence }                        from "framer-motion";
import { AuthProvider, useAuth }                  from "./context/AuthContext";
import ProtectedRoute                             from "./components/ProtectedRoute";
import LoadingScreen                              from "./components/LoadingScreen";
import LoginPage                                  from "./pages/LoginPage";
import SignupPage                                 from "./pages/SignupPage";
import ChatPage                                   from "./pages/ChatPage";
import ParticlesBackground                        from "./components/ParticlesBackground";
import NotificationSystem                         from "./components/NotificationSystem";
import FirstTimeIntro                             from "./components/FirstTimeIntro";

const INTRO_KEY = "dakroma_intro_done";

const AppInner = () => {
  const { user, profile } = useAuth();
  const [booted, setBooted]       = useState(false);
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    if (user) {
      const uid = user.uid;
      const introDone = localStorage.getItem(INTRO_KEY + "_" + uid);
      if (!introDone) {
        setShowIntro(true);
      }
    }
  }, [user]);

  const handleIntroDone = () => {
    if (user) {
      localStorage.setItem(INTRO_KEY + "_" + user.uid, "1");
    }
    setShowIntro(false);
  };

  return (
    <>
      <ParticlesBackground />
      <NotificationSystem />

      {/* First time intro */}
      <AnimatePresence>
        {showIntro && user && (
          <FirstTimeIntro
            username={profile?.username || user?.email}
            onDone={handleIntroDone}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!booted ? (
          <LoadingScreen key="loader" onDone={() => setBooted(true)} />
        ) : (
          <Routes>
            <Route path="/login"  element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/chat"   element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="*"       element={<Navigate to={user ? "/chat" : "/login"} replace />} />
          </Routes>
        )}
      </AnimatePresence>
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </AuthProvider>
  );
}
