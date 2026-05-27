const onlineUsers = new Map();

module.exports = (io) => {
  io.on("connection", (socket) => {

    socket.on("user:join", (userData) => {
      socket.userData = userData;
      onlineUsers.set(socket.id, { ...userData, socketId: socket.id });
      io.emit("users:online", Array.from(onlineUsers.values()));
    });

    socket.on("room:join", ({ roomId, roomName }) => {
      socket.join(roomId);
      socket.currentRoom = roomId;
      if (onlineUsers.has(socket.id)) {
        const u = onlineUsers.get(socket.id);
        onlineUsers.set(socket.id, { ...u, room: roomId });
        io.emit("users:online", Array.from(onlineUsers.values()));
      }
    });

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
      if (msg.room) {
        io.to(msg.room).emit("message:receive", msg);
      } else {
        io.emit("message:receive", msg);
      }
    });

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

    socket.on("message:react", ({ messageId, emoji, room }) => {
      io.to(room).emit("message:reaction", {
        messageId, emoji,
        uid:  socket.userData?.uid,
        room,
      });
    });

    socket.on("room:created", (room) => {
      io.emit("room:created", room);
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(socket.id);
      io.emit("users:online", Array.from(onlineUsers.values()));
    });
  });
};
