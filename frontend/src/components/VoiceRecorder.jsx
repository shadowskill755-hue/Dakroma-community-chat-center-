import { useState, useRef, useEffect } from "react";
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
        const url = URL.createObjectURL(blob);
        onSend(url);
        playSound("levelup");
      };
      mediaRecorder.current.start();
      setIsRecording(true);
      playSound("click");
    } catch (err) {
      console.error("Mic access denied:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40">
        <div className="glass-card rounded-2xl p-6 neon-border-cyan flex flex-col items-center gap-4 min-w-[280px]">
          <h3 className="font-cyber text-sm neon-text-cyan">VOICE RECORDER</h3>
          
          {/* Recording Indicator */}
          <div className="flex items-center gap-3 justify-center">
            {isRecording && (
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity }}
                className="w-4 h-4 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
            )}
            <span className="text-3xl">
              {isRecording ? "🎙️⚡" : "🎙️"}
            </span>
            {isRecording && (
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                className="w-4 h-4 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
            )}
          </div>

          {/* Status Text */}
          <p className="text-xs text-cyber-muted font-mono">
            {isRecording ? "🔴 RECORDING..." : "Ready to record"}
          </p>

          {/* Buttons */}
          <div className="flex gap-2 w-full">
            <button onClick={onClose}
              className="flex-1 btn-cyber btn-cyber-pink rounded-xl py-2 text-xs font-cyber">
              CANCEL
            </button>
            <button onClick={isRecording ? stopRecording : startRecording}
              className="flex-1 btn-cyber rounded-xl py-2 text-xs font-cyber">
              {isRecording ? "STOP ⏹️" : "START 🎙️"}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VoiceRecorder;
