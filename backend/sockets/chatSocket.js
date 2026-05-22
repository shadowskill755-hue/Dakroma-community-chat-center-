// ============================================================
// Socket.IO – Real-time chat, presence, typing indicators
// ============================================================
const onlineUsers = new Map(); // socketId → { uid, username, avatar, room }

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`[SOCKET] Connected: ${socket.id}`);

    // ── User joins app ──────────────────────────────────────
    socket.on("user:join", ({ uid, username, avatar }) => {
      onlineUsers.set(socket.id, { uid, username, avatar, room: "global" });
      socket.join("global");

      // Broadcast updated online list
      io.emit("users:online", Array.from(onlineUsers.values()));
      io.emit("system:message", {
        text: `⚡ ${username} entered the grid`,
        timestamp: Date.now(),
      });

      console.log(`[JOIN] ${username} (${uid})`);
    });

    // ── Join a room ─────────────────────────────────────────
    socket.on("room:join", ({ roomId, roomName }) => {
      const user = onlineUsers.get(socket.id);
      if (!user) return;

      // Leave previous room
      if (user.room && user.room !== "global") socket.leave(user.room);
      socket.join(roomId);
      user.room = roomId;
      onlineUsers.set(socket.id, user);

      io.to(roomId).emit("system:message", {
        text: `⚡ ${user.username} joined #${roomName}`,
        timestamp: Date.now(),
        room: roomId,
      });

      io.emit("users:online", Array.from(onlineUsers.values()));
    });

    // ── Leave room → back to global ─────────────────────────
    socket.on("room:leave", ({ roomId }) => {
      const user = onlineUsers.get(socket.id);
      if (!user) return;

      socket.leave(roomId);
      socket.join("global");
      user.room = "global";
      onlineUsers.set(socket.id, user);

      io.emit("users:online", Array.from(onlineUsers.values()));
    });

    // ── Send message ────────────────────────────────────────
    socket.on("message:send", (msg) => {
      const user = onlineUsers.get(socket.id);
      if (!user) return;

      const fullMsg = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        uid: user.uid,
        username: user.username,
        avatar: user.avatar,
        text: msg.text,
        room: msg.room || "global",
        timestamp: Date.now(),
        reactions: {},
      };

      // Broadcast to room (or global)
      io.to(fullMsg.room).emit("message:receive", fullMsg);
    });

    // ── Typing indicator ────────────────────────────────────
    socket.on("typing:start", ({ room }) => {
      const user = onlineUsers.get(socket.id);
      if (!user) return;
      socket.to(room || "global").emit("typing:update", {
        uid: user.uid,
        username: user.username,
        typing: true,
        room,
      });
    });

    socket.on("typing:stop", ({ room }) => {
      const user = onlineUsers.get(socket.id);
      if (!user) return;
      socket.to(room || "global").emit("typing:update", {
        uid: user.uid,
        username: user.username,
        typing: false,
        room,
      });
    });

    // ── Message reaction ────────────────────────────────────
    socket.on("message:react", ({ messageId, emoji, room }) => {
      const user = onlineUsers.get(socket.id);
      if (!user) return;
      io.to(room || "global").emit("message:reaction", {
        messageId,
        emoji,
        uid: user.uid,
        username: user.username,
      });
    });

    // ── Room created ────────────────────────────────────────
    socket.on("room:created", (room) => {
      io.emit("room:new", room);
    });

    // ── Disconnect ──────────────────────────────────────────
    socket.on("disconnect", () => {
      const user = onlineUsers.get(socket.id);
      if (user) {
        io.emit("system:message", {
          text: `💀 ${user.username} left the grid`,
          timestamp: Date.now(),
        });
        onlineUsers.delete(socket.id);
        io.emit("users:online", Array.from(onlineUsers.values()));
        console.log(`[LEAVE] ${user.username}`);
      }
    });
  });
};
