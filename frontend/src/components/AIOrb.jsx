// ============================================================
// AIOrb – floating AI assistant button
// ============================================================
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const AIOrb = () => {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "⚡ Grid AI online. Ask me anything, pilot." }
  ]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: "You are Grid AI, the cyberpunk assistant of the MrDakroma community. Respond in a cool, futuristic tone. Keep answers short and sharp. Use occasional emojis like ⚡🔥💀🤖.",
          messages: [{ role: "user", content: userMsg }],
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "⚠️ Signal lost. Try again.";
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "⚠️ Grid offline. Check your connection." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Popup panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-24 right-4 md:right-6 w-80 md:w-96 z-50 glass-card rounded-xl overflow-hidden neon-border-cyan"
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-cyber-border">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-sm orb-pulse">🤖</div>
              <div>
                <p className="font-cyber text-xs text-cyber-cyan">GRID AI</p>
                <p className="text-xs text-cyber-green font-mono">● ONLINE</p>
              </div>
              <button onClick={() => setOpen(false)} className="ml-auto text-cyber-muted hover:text-cyber-pink text-lg">✕</button>
            </div>

            {/* Messages */}
            <div className="h-64 overflow-y-auto p-4 space-y-3 font-body">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                    m.role === "user"
                      ? "bg-cyan-500/20 border border-cyan-500/30 text-white"
                      : "bg-purple-900/40 border border-purple-500/30 text-cyber-text"
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-1 pl-1">
                  {[0,1,2].map((i) => (
                    <motion.div key={i} className="w-2 h-2 rounded-full bg-cyber-cyan"
                      animate={{ opacity: [0.3,1,0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
                  ))}
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-cyber-border flex gap-2">
              <input
                className="cyber-input flex-1 rounded-lg px-3 py-2 text-sm"
                placeholder="Ask the grid..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
              />
              <button onClick={send} disabled={loading}
                className="btn-cyber rounded-lg px-3 py-2 text-lg disabled:opacity-40">⚡</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating orb button */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-4 md:right-6 z-50 w-14 h-14 rounded-full orb-pulse flex items-center justify-center text-2xl"
        style={{ background: "radial-gradient(circle at 35% 35%, #7c3aed, #00f5ff33)", border: "1px solid #00f5ff55" }}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.95 }}
        animate={{ y: [0, -6, 0] }}
        transition={{ y: { duration: 3, repeat: Infinity, ease: "easeInOut" } }}
      >
        {open ? "✕" : "🤖"}
      </motion.button>
    </>
  );
};

export default AIOrb;
