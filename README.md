# ⚡ 𝖒𝖗᭄𝕯𝖆𝖐𝖗𝖔𝖒𝖆꧂ Community — Setup Guide

> Futuristic cyberpunk real-time messenger built for the grid.

---

## 📱 TERMUX SETUP (Android)

### Step 1 — Install Termux
Download **Termux** from F-Droid (NOT Play Store):
https://f-droid.org/en/packages/com.termux/

### Step 2 — Update Termux packages
```bash
pkg update && pkg upgrade -y
```

### Step 3 — Install Node.js and Git
```bash
pkg install nodejs git -y
```

Verify:
```bash
node --version    # Should show v18+
npm --version     # Should show 9+
git --version
```

### Step 4 — Clone or copy your project
If you have the files on your phone, navigate to them:
```bash
cd /sdcard/dakroma
```
OR create a new folder:
```bash
mkdir -p ~/dakroma
cd ~/dakroma
```
Then copy all your project files here.

---

## 🔥 FIREBASE SETUP (Required for auth)

1. Go to https://console.firebase.google.com
2. Click **"Add project"** → name it `dakroma-community`
3. **Authentication** → Sign-in method → Enable:
   - ✅ Email/Password
   - ✅ Google
4. **Firestore Database** → Create database → Start in **test mode**
5. **Project Settings** → Your apps → Add Web App → Copy the config
6. Paste the config values into `frontend/.env`

---

## ⚙️ BACKEND SETUP

```bash
cd ~/dakroma/backend
npm install
```

Edit `.env`:
```
PORT=4000
FRONTEND_URL=http://localhost:5173
```

Start the backend:
```bash
npm start
```

You should see the DAKROMA ASCII art and "Server running on port 4000"

**Keep this terminal open.** Open a NEW Termux session for frontend.

---

## 🎨 FRONTEND SETUP

Open a new Termux session (swipe right or use split screen):
```bash
cd ~/dakroma/frontend
npm install
```

Edit `frontend/.env` with your Firebase config values.

Start the frontend:
```bash
npm run dev -- --host
```

You'll see:
```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

Open your phone browser → go to `http://localhost:5173`

---

## 🌐 PRODUCTION HOSTING

### Backend → Render (Free)
1. Push backend folder to GitHub
2. Go to https://render.com → New Web Service
3. Connect your repo
4. Set:
   - Build: `npm install`
   - Start: `node server.js`
   - Environment: `PORT=10000`, `FRONTEND_URL=https://your-frontend.vercel.app`

### Frontend → Vercel (Free)
1. Push frontend folder to GitHub
2. Go to https://vercel.com → New Project
3. Set environment variables (all the VITE_ ones)
4. Deploy!

After deploying:
- Update `VITE_BACKEND_URL` in Vercel to your Render URL
- Update `FRONTEND_URL` in Render to your Vercel URL

---

## 📁 PROJECT STRUCTURE

```
dakroma/
├── backend/
│   ├── server.js          # Express + Socket.IO server
│   ├── routes/
│   │   ├── messages.js    # Message history API
│   │   └── rooms.js       # Rooms API
│   ├── sockets/
│   │   └── chatSocket.js  # All real-time events
│   ├── .env               # Backend env vars
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── AIOrb.jsx           # Floating AI assistant
    │   │   ├── ChatWindow.jsx      # Main chat area
    │   │   ├── LoadingScreen.jsx   # Cyberpunk intro
    │   │   ├── MessageBubble.jsx   # Individual messages
    │   │   ├── ParticlesBackground.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   └── Sidebar.jsx         # Rooms + online users
    │   ├── context/
    │   │   ├── AuthContext.jsx     # Firebase auth
    │   │   └── chatStore.js        # Zustand state
    │   ├── hooks/
    │   │   └── useSocket.js        # Socket connection hook
    │   ├── pages/
    │   │   ├── ChatPage.jsx
    │   │   ├── LoginPage.jsx
    │   │   └── SignupPage.jsx
    │   ├── services/
    │   │   ├── firebase.js         # Firebase init
    │   │   └── socket.js           # Socket.IO client
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css               # Cyberpunk styles
    ├── .env
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.js
```

---

## ✨ FEATURES

| Feature | Status |
|---------|--------|
| 🔐 Email/Password auth | ✅ |
| 🔑 Google auth | ✅ |
| 💬 Real-time chat | ✅ |
| ✍️ Typing indicators | ✅ |
| 🟢 Online presence | ✅ |
| 🏠 Rooms / Channels | ✅ |
| 😈 Message reactions | ✅ |
| 🤖 AI assistant orb | ✅ |
| 🎵 TikTok link | ✅ |
| ⚡ XP system (base) | ✅ |
| 🎮 Cyberpunk UI | ✅ |
| 📱 Mobile responsive | ✅ |
| 🌌 Particles background | ✅ |
| 💀 Loading screen | ✅ |

---

## 🐛 TROUBLESHOOTING

**"Cannot find module" error**
```bash
npm install  # in whichever folder has the error
```

**Port already in use**
```bash
pkill node   # kills all node processes
```

**Firebase errors**
- Make sure you copied the EXACT values from Firebase Console
- Enable Email/Password auth in Firebase Console

**Socket won't connect**
- Make sure backend is running first
- Check that `VITE_BACKEND_URL` matches where your backend runs

---

## 🎵 TikTok
Watch MrDakroma: https://vm.tiktok.com/ZS9Y5So3xkPwN-vpVYK/

---

*Built with ❤️ for the MrDakroma Community Grid*
