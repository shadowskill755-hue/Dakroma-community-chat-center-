/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg:      "#020408",
          panel:   "#060d18",
          card:    "#0a1628",
          border:  "#0f2545",
          cyan:    "#00f5ff",
          pink:    "#ff006e",
          purple:  "#7c3aed",
          yellow:  "#ffd60a",
          green:   "#00ff88",
          red:     "#ff2d55",
          text:    "#c8d8e8",
          muted:   "#4a6080",
        },
      },
      fontFamily: {
        cyber:  ["Orbitron", "monospace"],
        body:   ["Rajdhani", "sans-serif"],
        mono:   ["Share Tech Mono", "monospace"],
      },
      animation: {
        "pulse-glow":   "pulseGlow 2s ease-in-out infinite",
        "scan-line":    "scanLine 3s linear infinite",
        "float":        "float 3s ease-in-out infinite",
        "glitch":       "glitch 0.3s steps(2) infinite",
        "matrix-rain":  "matrixRain 20s linear infinite",
        "border-glow":  "borderGlow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        pulseGlow: {
          "0%,100%": { boxShadow: "0 0 10px #00f5ff44, 0 0 20px #00f5ff22" },
          "50%":     { boxShadow: "0 0 20px #00f5ff88, 0 0 40px #00f5ff44, 0 0 60px #00f5ff22" },
        },
        scanLine: {
          "0%":   { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%":     { transform: "translateY(-8px)" },
        },
        glitch: {
          "0%":   { clipPath: "inset(40% 0 61% 0)", transform: "translate(-2px)" },
          "50%":  { clipPath: "inset(10% 0 85% 0)", transform: "translate(2px)" },
          "100%": { clipPath: "inset(80% 0 5% 0)",  transform: "translate(0)" },
        },
        borderGlow: {
          "0%":   { borderColor: "#00f5ff66" },
          "100%": { borderColor: "#ff006e66" },
        },
      },
      backdropBlur: { xs: "2px" },
    },
  },
  plugins: [],
};
