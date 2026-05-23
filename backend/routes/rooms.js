const express = require("express");
const router = express.Router();

const rooms = [
  { id: "global",   name: "Global",     description: "Main grid channel",         icon: "🌐", members: 0, isDefault: true, createdBy: "system", admins: [] },
  { id: "gaming",   name: "Gaming",     description: "Game talk, clips, strats",  icon: "🎮", members: 0, createdBy: "system", admins: [] },
  { id: "music",    name: "Music",      description: "Beats, drops, playlists",   icon: "🎵", members: 0, createdBy: "system", admins: [] },
  { id: "crypto",   name: "Crypto",     description: "Charts, alpha, degens",     icon: "₿",  members: 0, createdBy: "system", admins: [] },
];

router.get("/", (_, res) => res.json(rooms));

router.post("/", (req, res) => {
  const { name, description, icon, createdBy, createdByUid } = req.body;
  if (!name) return res.status(400).json({ error: "Room name required" });
  const room = {
    id: name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(),
    name,
    description: description || "",
    icon: icon || "💬",
    members: 0,
    createdBy: createdByUid || createdBy,
    admins: [createdByUid || createdBy],
    botEnabled: false,
    approveMembers: false,
    allowPictures: true,
    createdAt: Date.now(),
  };
  rooms.push(room);
  res.json(room);
});

router.patch("/:id", (req, res) => {
  const room = rooms.find((r) => r.id === req.params.id);
  if (!room) return res.status(404).json({ error: "Room not found" });
  Object.assign(room, req.body);
  res.json(room);
});

module.exports = router;
