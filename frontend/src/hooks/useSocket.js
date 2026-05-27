import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import useChatStore from "../context/chatStore";
import socket from "../services/socket";

const useSocket = () => {
  const { user, profile } = useAuth();
  const { addMessage, setOnlineUsers, setTyping, applyReaction, activeRoom } = useChatStore();

  useEffect(() => {
    if (!user) return;

    socket.connect();

    socket.emit("user:join", {
      uid:      user.uid,
      username: profile?.username,
      avatar:   profile?.avatar,
      memberId: profile?.memberId,
      xp:       profile?.xp || 0,
      status:   profile?.status || "online",
    });

    socket.on("message:receive", (msg) => {
      addMessage(msg);
    });

    socket.on("users:online", (users) => {
      setOnlineUsers(users);
    });

    socket.on("typing:update", (data) => {
      setTyping(data);
    });

    socket.on("message:reaction", (data) => {
      applyReaction(data);
    });

    socket.on("room:created", (room) => {
      useChatStore.getState().addRoom(room);
    });

    return () => {
      socket.off("message:receive");
      socket.off("users:online");
      socket.off("typing:update");
      socket.off("message:reaction");
      socket.off("room:created");
      socket.disconnect();
    };
  }, [user]);
};

export default useSocket;
