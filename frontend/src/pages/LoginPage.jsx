// ============================================================
// LoginPage – cyberpunk auth screen
// ============================================================
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import ParticlesBackground from "../components/ParticlesBackground";

const LoginPage = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form,   setForm]   = useState({ email: "", password: "" });
  const [error,  setError]  = useState("");
  const [loading,setLoading]= useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/chat");
    } catch (err) {
      setError(err.message?.replace("Firebase: ", "") || "Login failed");
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate("/chat");
    } catch (err) {
      setError(err.message?.replace("Firebase: ", "") || "Google login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative scan-overlay">
      <ParticlesBackground />

      {/* Grid background */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: "linear-gradient(#00f5ff 1px,transparent 1px),linear-gradient(90deg,#00f5ff 1px,transparent 1px)", backgroundSize: "40px 40px" }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Card */}
        <div className="glass-card rounded-2xl p-8 neon-border-cyan hud-bracket">
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              animate={{ y: [0,-6,0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-5xl mb-3">⚡</motion.div>
            <h1 className="font-cyber text-xl neon-text-cyan tracking-widest mb-1">
              𝖒𝖗᭄𝕯𝖆𝖐𝖗𝖔𝖒𝖆꧂
            </h1>
            <p className="text-cyber-muted font-mono text-xs tracking-widest">GRID ACCESS TERMINAL</p>
          </div>

          {/* Error */}
          {error && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
              className="mb-4 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono">
              ⚠ {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-cyber text-cyber-muted tracking-widest block mb-1.5">
                EMAIL
              </label>
              <input
                type="email" required
                className="cyber-input w-full rounded-xl px-4 py-3"
                placeholder="pilot@grid.io"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-cyber text-cyber-muted tracking-widest block mb-1.5">
                PASSWORD
              </label>
              <input
                type="password" required
                className="cyber-input w-full rounded-xl px-4 py-3"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full btn-cyber rounded-xl py-3 text-sm font-cyber tracking-widest disabled:opacity-50"
            >
              {loading ? "CONNECTING..." : "JACK IN ⚡"}
            </motion.button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-cyber-border" />
            <span className="text-xs text-cyber-muted font-mono">OR</span>
            <div className="flex-1 h-px bg-cyber-border" />
          </div>

          {/* Google */}
          <motion.button
            onClick={handleGoogle}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full btn-cyber btn-cyber-pink rounded-xl py-3 text-sm font-cyber tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>🔑</span> GOOGLE ACCESS
          </motion.button>

          <p className="text-center text-cyber-muted text-xs font-mono mt-6">
            No access?{" "}
            <Link to="/signup" className="text-cyber-cyan hover:text-white transition-colors font-cyber">
              REGISTER →
            </Link>
          </p>
        </div>

        {/* TikTok link */}
        <div className="mt-4 text-center">
          <a href="https://vm.tiktok.com/ZS9Y5So3xkPwN-vpVYK/" target="_blank" rel="noopener noreferrer"
            className="text-xs font-mono text-cyber-pink hover:text-cyber-cyan transition-colors flex items-center justify-center gap-2">
            🎵 Watch MrDakroma on TikTok ↗
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
