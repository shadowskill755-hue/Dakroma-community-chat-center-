# ANDROID DEPLOYMENT GUIDE
### DAKROMA MASTER PIECE v4

## Local (Termux)

```bash
pkg install nodejs unzip git -y
cp -r ~/storage/downloads/dakroma-masterpiece ~/dakroma-v4
cd ~/dakroma-v4
npm install
node server.js
```

Open Chrome → `http://localhost:3000`

## Online Deploy

1. Push to GitHub
2. Deploy to Render (backend)
3. Deploy public/ to Netlify (frontend)
4. Update SOCKET_URL in public/game.js
5. Push update

## Tools
- Termux — Node.js runtime
- ZArchiver — unzip files
- Chrome — GitHub/Render/Netlify
- GitHub — code hosting

---
*Engine by Claude AI · Coded by David Koroma 👨‍💻 · 2026*
