// ============================================================
// MrDakroma Community - Backend Server
// ============================================================
require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors({ origin: process.env.FRONTEND_URL || "*", credentials: true }));
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────
app.use("/api/messages", require("./routes/messages"));
app.use("/api/rooms",    require("./routes/rooms"));

app.get("/health", (_, res) => res.json({ status: "DAKROMA ONLINE 🔥" }));

// ── Socket.IO ────────────────────────────────────────────────
require("./sockets/chatSocket")(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`
  ██████╗  █████╗ ██╗  ██╗██████╗  ██████╗ ███╗   ███╗ █████╗ 
  ██╔══██╗██╔══██╗██║ ██╔╝██╔══██╗██╔═══██╗████╗ ████║██╔══██╗
  ██║  ██║███████║█████╔╝ ██████╔╝██║   ██║██╔████╔██║███████║
  ██║  ██║██╔══██║██╔═██╗ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══██║
  ██████╔╝██║  ██║██║  ██╗██║  ██║╚██████╔╝██║ ╚═╝ ██║██║  ██║
  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝
  
  🔥 Server running on port ${PORT}
  `);
});
