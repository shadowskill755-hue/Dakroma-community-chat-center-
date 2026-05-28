// ============================================================
// VoiceRecorder - Record and send voice messages
// ============================================================
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playSound } from "./SoundManager";
import { notify } from "./NotificationSystem";

const VoiceRecorder = ({ onSend, onCancel }) => {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      setRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
      playSound("click");
    } catch {
      notify("❌ Microphone access denied!", "error");
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
    clearInterval(timerRef.current);
    playSound("message");
  };

  const sendVoice = () => {
    if (!audioBlob) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      onSend(e.target.result);
      playSound("message");
    };
    reader.readAsDataURL(audioBlob);
  };

  const formatTime = (s) => `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;

  return (
    <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
      className="flex items-center gap-2 p-2 glass rounded-xl border border-cyber-border">

      {!audioUrl ? (
        <>
          {recording ? (
            <>
              <motion.div animate={{ scale:[1,1.2,1] }} transition={{ repeat:Infinity, duration:1 }}
                className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-xs font-mono text-red-400">{formatTime(duration)}</span>
              <button onClick={stopRecording}
                className="btn-cyber rounded-lg px-3 py-1.5 text-xs">⏹ Stop</button>
            </>
          ) : (
            <button onClick={startRecording}
              className="btn-cyber rounded-lg px-3 py-1.5 text-xs flex items-center gap-1">
              🎤 Hold to Record
            </button>
          )}
        </>
      ) : (
        <>
          <audio controls src={audioUrl} className="flex-1 h-8" style={{ maxWidth:"160px" }} />
          <button onClick={sendVoice} className="btn-cyber rounded-lg px-3 py-1.5 text-xs">⚡ Send</button>
          <button onClick={() => { setAudioUrl(null); setAudioBlob(null); }}
            className="text-cyber-muted hover:text-cyber-pink text-sm">🗑️</button>
        </>
      )}

      <button onClick={onCancel} className="text-cyber-muted hover:text-cyber-pink text-sm">✕</button>
    </motion.div>
  );
};

export default VoiceRecorder;
