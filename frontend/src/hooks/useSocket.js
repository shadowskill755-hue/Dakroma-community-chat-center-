// ============================================================
// useSocket – connects socket, binds all events
// ============================================================
import { useEffect } from "react";
import socket from "../services/socket";
import useChatStore from "../context/chatStore";
import { useAuth } from "../context/AuthContext";

const useSocket = () => {
  const { user, profile } = useAuth();
  const { addMessage, setOnlineUsers, setTyping, addRoom, addSystemMsg, applyReaction } = useChatStore();

  useEffect(() => {
    if (!user || !profile) return;

    socket.connect();

    socket.emit("user:join", {
      uid:      user.uid,
      username: profile.username,
      avatar:   profile.avatar || user.photoURL,
    });

    socket.on("message:receive",  addMessage);
    socket.on("users:online",     setOnlineUsers);
    socket.on("typing:update",    setTyping);
    socket.on("room:new",         addRoom);
    socket.on("system:message",   addSystemMsg);
    socket.on("message:reaction", applyReaction);

    return () => {
      socket.off("message:receive");
      socket.off("users:online");
      socket.off("typing:update");
      socket.off("room:new");
      socket.off("system:message");
      socket.off("message:reaction");
      socket.disconnect();
    };
  }, [user, profile]);

  return socket;
};

export default useSocket;
