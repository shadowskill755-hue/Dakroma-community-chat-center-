// ============================================================
// App.jsx – routing + loading screen + notifications
// ============================================================
import { useState }                              from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence }                        from "framer-motion";
import { AuthProvider }                           from "./context/AuthContext";
import ProtectedRoute                             from "./components/ProtectedRoute";
import LoadingScreen                              from "./components/LoadingScreen";
import LoginPage                                  from "./pages/LoginPage";
import SignupPage                                  from "./pages/SignupPage";
import ChatPage                                   from "./pages/ChatPage";
import ParticlesBackground                        from "./components/ParticlesBackground";
import NotificationSystem                         from "./components/NotificationSystem";

export default function App() {
  const [booted, setBooted] = useState(false);

  return (
    <AuthProvider>
      <BrowserRouter>
        <ParticlesBackground />
        <NotificationSystem />

        <AnimatePresence mode="wait">
          {!booted ? (
            <LoadingScreen key="loader" onDone={() => setBooted(true)} />
          ) : (
            <Routes>
              <Route path="/login"  element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/chat"   element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
              <Route path="*"       element={<Navigate to="/login" replace />} />
            </Routes>
          )}
        </AnimatePresence>
      </BrowserRouter>
    </AuthProvider>
  );
}
