const express = require("express");
const router = express.Router();

// In-memory rooms (swap with Firestore for production)
const rooms = [
  { id: "global",   name: "Global",     description: "Main grid channel",         icon: "🌐", members: 0, isDefault: true },
  { id: "gaming",   name: "Gaming",     description: "Game talk, clips, strats",  icon: "🎮", members: 0 },
  { id: "music",    name: "Music",      description: "Beats, drops, playlists",   icon: "🎵", members: 0 },
  { id: "crypto",   name: "Crypto",     description: "Charts, alpha, degens",     icon: "₿",  members: 0 },
];

router.get("/", (_, res) => res.json(rooms));

router.post("/", (req, res) => {
  const { name, description, icon, createdBy } = req.body;
  if (!name) return res.status(400).json({ error: "Room name required" });
  const room = {
    id: name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(),
    name,
    description: description || "",
    icon: icon || "💬",
    members: 0,
    createdBy,
    createdAt: Date.now(),
  };
  rooms.push(room);
  res.json(room);
});

module.exports = router;
