import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playSound } from "./SoundManager";

const VoiceRecorder = ({ onSend, onClose }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];
      mediaRecorder.current.ondataavailable = (e) => audioChunks.current.push(e.data);
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => { onSend(reader.result); playSound("levelup"); };
        reader.readAsDataURL(blob);
      };
      mediaRecorder.current.start();
      setIsRecording(true);
      playSound("click");
    } catch (err) { console.error("Mic denied:", err); }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach((t) => t.stop());
      setIsRecording(false);
    }
  };

  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:20 }}
      className="absolute bottom-20 left-3 right-3 z-40 glass-card rounded-2xl p-4 neon-border-cyan">
      <h3 className="font-cyber text-sm neon-text-cyan text-center mb-3">🎙️ VOICE RECORDER</h3>
      <div className="flex items-center justify-center gap-3 mb-3">
        {isRecording && (
          <motion.div animate={{ scale:[1,1.3,1] }} transition={{ duration:0.6, repeat:Infinity }}
            className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
        )}
        <span className="text-4xl">{isRecording ? "🎙️" : "🎤"}</span>
        {isRecording && (
          <motion.div animate={{ scale:[1,1.3,1] }} transition={{ duration:0.6, repeat:Infinity, delay:0.3 }}
            className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
        )}
      </div>
      <p className="text-xs text-cyber-muted font-mono text-center mb-4">
        {isRecording ? "🔴 RECORDING... tap STOP when done" : "Tap START to record"}
      </p>
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 btn-cyber btn-cyber-pink rounded-xl py-3 text-xs font-cyber">CANCEL</button>
        <button onClick={isRecording ? stopRecording : startRecording}
          className="flex-1 btn-cyber rounded-xl py-3 text-xs font-cyber">
          {isRecording ? "STOP ⏹️" : "START 🎙️"}
        </button>
      </div>
    </motion.div>
  );
};

export default VoiceRecorder;
