// ============================================================
// SignupPage – new pilot registration
// ============================================================
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import ParticlesBackground from "../components/ParticlesBackground";

const SignupPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form,    setForm]   = useState({ username: "", email: "", password: "", confirm: "" });
  const [error,   setError]  = useState("");
  const [loading, setLoading]= useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) { setError("Passwords don't match"); return; }
    if (form.username.length < 3)       { setError("Username must be 3+ characters"); return; }
    if (form.password.length < 6)       { setError("Password must be 6+ characters"); return; }

    setLoading(true);
    try {
      await register(form.email, form.password, form.username);
      navigate("/chat");
    } catch (err) {
      setError(err.message?.replace("Firebase: ", "") || "Registration failed");
    } finally { setLoading(false); }
  };

  // Preview avatar based on username
  const avatarSeed = form.username || "pilot";

  return (
    <div className="min-h-screen flex items-center justify-center relative scan-overlay py-8">
      <ParticlesBackground />
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: "linear-gradient(#ff006e 1px,transparent 1px),linear-gradient(90deg,#ff006e 1px,transparent 1px)", backgroundSize: "40px 40px" }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="glass-card rounded-2xl p-8 neon-border-pink hud-bracket">
          {/* Header */}
          <div className="text-center mb-6">
            {/* Avatar preview */}
            <motion.img
              key={avatarSeed}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={`https://api.dicebear.com/7.x/cyberpunk/svg?seed=${avatarSeed}`}
              alt="avatar preview"
              className="w-16 h-16 rounded-full border-2 border-cyber-pink/50 mx-auto mb-3"
            />
            <h1 className="font-cyber text-xl neon-text-pink tracking-widest mb-1">
              NEW PILOT
            </h1>
            <p className="text-cyber-muted font-mono text-xs">REGISTER YOUR GRID IDENTITY</p>
          </div>

          {error && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
              className="mb-4 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono">
              ⚠ {error}
            </motion.div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            {[
              { key: "username", label: "CALLSIGN",    type: "text",     placeholder: "YourCallsign" },
              { key: "email",    label: "EMAIL",        type: "email",    placeholder: "pilot@grid.io" },
              { key: "password", label: "PASSWORD",     type: "password", placeholder: "••••••••" },
              { key: "confirm",  label: "CONFIRM PASS", type: "password", placeholder: "••••••••" },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="text-xs font-cyber text-cyber-muted tracking-widest block mb-1.5">{label}</label>
                <input
                  type={type} required
                  className="cyber-input w-full rounded-xl px-4 py-3"
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full btn-cyber btn-cyber-pink rounded-xl py-3 text-sm font-cyber tracking-widest disabled:opacity-50"
            >
              {loading ? "REGISTERING..." : "JOIN THE GRID ⚡"}
            </motion.button>
          </form>

          <p className="text-center text-cyber-muted text-xs font-mono mt-6">
            Already a pilot?{" "}
            <Link to="/login" className="text-cyber-pink hover:text-white transition-colors font-cyber">
              LOGIN →
            </Link>
          </p>
        </div>

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

export default SignupPage;
