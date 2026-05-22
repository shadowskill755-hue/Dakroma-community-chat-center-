const express = require("express");
const router = express.Router();

// In-memory store (swap with Firestore for production)
const messageStore = {};

// GET last N messages for a room
router.get("/:room", (req, res) => {
  const { room } = req.params;
  const messages = messageStore[room] || [];
  res.json(messages.slice(-100)); // last 100
});

// POST (called internally by socket or from client as backup)
router.post("/", (req, res) => {
  const { room, ...msg } = req.body;
  if (!messageStore[room]) messageStore[room] = [];
  messageStore[room].push(msg);
  if (messageStore[room].length > 500) messageStore[room].shift(); // keep rolling 500
  res.json({ ok: true });
});

module.exports = router;
