// ============================================================
// ImageCropper - Scale and crop profile picture
// ============================================================
import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";

const ImageCropper = ({ imageSrc, onCrop, onCancel }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  const handleMouseDown = (e) => {
    setDragging(true);
    setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleTouchStart = (e) => {
    setDragging(true);
    const touch = e.touches[0];
    setStartPos({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    setPosition({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
  };

  const handleTouchMove = (e) => {
    if (!dragging) return;
    const touch = e.touches[0];
    setPosition({ x: touch.clientX - startPos.x, y: touch.clientY - startPos.y });
  };

  const handleEnd = () => setDragging(false);

  const cropImage = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = imgRef.current;
    const size = 200;
    canvas.width = size;
    canvas.height = size;

    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
    ctx.clip();

    const imgSize = Math.min(img.naturalWidth, img.naturalHeight);
    const scaledSize = imgSize * scale;
    const offsetX = (img.naturalWidth - imgSize) / 2 - position.x / scale;
    const offsetY = (img.naturalHeight - imgSize) / 2 - position.y / scale;

    ctx.drawImage(img, offsetX, offsetY, imgSize, imgSize, 0, 0, size, size);
    const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.9);
    onCrop(croppedDataUrl);
  }, [scale, position, onCrop]);

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <motion.div initial={{ scale:0.85 }} animate={{ scale:1 }}
        className="glass-card rounded-2xl p-6 w-full max-w-sm neon-border-cyan">

        <h3 className="font-cyber text-sm neon-text-cyan mb-4 text-center tracking-widest">ADJUST PHOTO</h3>

        {/* Crop area */}
        <div className="relative w-64 h-64 mx-auto mb-4 overflow-hidden rounded-full border-2 border-cyber-cyan/50"
          onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleEnd}
          onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleEnd}
          style={{ cursor: dragging ? "grabbing" : "grab" }}>
          <img ref={imgRef} src={imageSrc} alt="crop"
            style={{ transform: `scale(${scale}) translate(${position.x/scale}px, ${position.y/scale}px)`,
              transformOrigin: "center", userSelect: "none", pointerEvents: "none",
              width: "100%", height: "100%", objectFit: "cover" }} />
          {/* Grid overlay */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(rgba(0,245,255,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(0,245,255,0.1) 1px,transparent 1px)",
              backgroundSize: "64px 64px" }} />
        </div>

        {/* Scale slider */}
        <div className="mb-4">
          <div className="flex justify-between text-xs font-mono text-cyber-muted mb-2">
            <span>Zoom</span><span>{Math.round(scale * 100)}%</span>
          </div>
          <input type="range" min="0.5" max="3" step="0.01" value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="w-full accent-cyan-400" />
        </div>

        <p className="text-xs text-cyber-muted font-mono text-center mb-4">Drag to reposition • Pinch to zoom</p>

        {/* Hidden canvas for cropping */}
        <canvas ref={canvasRef} className="hidden" />

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 btn-cyber btn-cyber-pink rounded-xl py-3 text-xs font-cyber">
            CANCEL
          </button>
          <button onClick={cropImage} className="flex-1 btn-cyber rounded-xl py-3 text-xs font-cyber">
            APPLY ⚡
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ImageCropper;
