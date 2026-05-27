import { io } from "socket.io-client";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const socket = io(BACKEND, {
  autoConnect: false,
  transports: ["websocket", "polling"],
});

export default socket;
