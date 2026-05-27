// ============================================================
// chatSocket - handles all socket events
// ============================================================
const onlineUsers = new Map();

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // User joins
    socket.on("user:join", (userData) => {
      socket.userData = userData;
      onlineUsers.set(socket.id, { ...userData, socketId: socket.id });
      io.emit("users:online", Array.from(onlineUsers.values()));
      io.emit("system:message", {
        id: Date.now(),
        text: `⚡ ${userData.username} entered the grid`,
      });
    });

    // Join room
    socket.on("room:join", ({ roomId, roomName }) => {
      socket.join(roomId);
      socket.currentRoom = roomId;
      // Update user room
      if (onlineUsers.has(socket.id)) {
        const u = onlineUsers.get(socket.id);
        onlineUsers.set(socket.id, { ...u, room: roomId });
        io.emit("users:online", Array.from(onlineUsers.values()));
      }
      io.to(roomId).emit("system:message", {
        id: Date.now(),
        text: `⚡ ${socket.userData?.username} joined #${roomName}`,
      });
    });

    // Send message
    socket.on("message:send", (data) => {
      const msg = {
        id:        Date.now() + Math.random(),
        uid:       socket.userData?.uid,
        username:  socket.userData?.username,
        avatar:    socket.userData?.avatar,
        memberId:  socket.userData?.memberId || data.memberId,
        xp:        socket.userData?.xp || data.xp || 0,
        text:      data.text,
        imageUrl:  data.imageUrl || null,
        replyTo:   data.replyTo || null,
        room:      data.room || socket.currentRoom || "global",
        timestamp: Date.now(),
        reactions: {},
      };
      // Send to room or everyone
      if (msg.room) {
        io.to(msg.room).emit("message:receive", msg);
      } else {
        io.emit("message:receive", msg);
      }
    });

    // Typing
    socket.on("typing:start", ({ room }) => {
      socket.to(room).emit("typing:update", {
        uid:      socket.userData?.uid,
        username: socket.userData?.username,
        room,
        typing:   true,
      });
    });

    socket.on("typing:stop", ({ room }) => {
      socket.to(room).emit("typing:update", {
        uid:      socket.userData?.uid,
        username: socket.userData?.username,
        room,
        typing:   false,
      });
    });

    // Reactions
    socket.on("message:react", ({ messageId, emoji, room }) => {
      io.to(room).emit("message:reaction", {
        messageId,
        emoji,
        uid:  socket.userData?.uid,
        room,
      });
    });

    // Room created
    socket.on("room:created", (room) => {
      io.emit("room:created", room);
    });

    // Disconnect
    socket.on("disconnect", () => {
      const user = onlineUsers.get(socket.id);
      if (user) {
        io.emit("system:message", {
          id: Date.now(),
          text: `⚡ ${user.username} left the grid`,
        });
      }
      onlineUsers.delete(socket.id);
      io.emit("users:online", Array.from(onlineUsers.values()));
    });
  });
};
