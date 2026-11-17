# Game of Wheel

Interactive Physics Prize & Decision Spinner web application with **Live QR Code Audience Join**, **Anti-Cheat / Multi-Tab Protection**, and **Stage Fullscreen Mode**.

Works both as a **100% serverless static site on Cloudflare Pages / GitHub Pages** (using WebRTC P2P rooms) and as a **local Node.js LAN server**.

---

## ✨ Features

- **Physics-Driven Wheel**: Smooth HTML5 Canvas wheel with realistic deceleration, flapper spring physics, and 60/30 Hz refresh toggle.
- **Live QR Host Game (`Host QR`)**: Generate a room code and QR code on stage (`Q` shortcut) so participants can scan with their phones (`/join.html`) and appear on the wheel in real time.
- **Anti-Cheat & Multi-Tab Lock**: Fuzzy duplicate name blocking (`"chi"`, `"Chi!"`, `"c h i"`), cross-tab lock (`BroadcastChannel` + `localStorage`), and strict 1-entry-per-device protection.
- **Spin & Drama Modifiers**: Dramatic Zoom, Siren Pulse, Extended Crawl, Late Hesitation, Kinetic Shake, and Elastic Bounce modes.
- **Themes & Stage Mode**: Curated color palettes with WCAG auto-contrast, one-click random theme switcher, and distraction-free Stage Fullscreen Mode (`F` shortcut) with a floating corner QR code.
- **Self-Contained Libraries**: Core runtime libraries (`Tone.js`, `PeerJS`, `QRCode.js`, `canvas-confetti`) are bundled locally in `public/vendor/` for fast, reliable loading.

---

## 📁 Project Structure

```text
GOW/
├── public/                     # Cloudflare Pages / Static Build Output Directory
│   ├── index.html              # Main host application HTML shell
│   ├── join.html               # Mobile participant QR join portal
│   ├── _redirects              # Cloudflare Pages clean URL routing (/join -> /join.html)
│   ├── css/
│   │   └── styles.css          # Custom animations, tactile 3D game UI & Stage Mode styles
│   ├── images/                 # App logos, favicons, OpenGraph banner & QR assets
│   ├── js/
│   │   ├── app.js              # Main controller, physics loop, anti-cheat & Live QR P2P/SSE engine
│   │   ├── config.js           # Presets, color palettes & musical scales/patterns
│   │   ├── confetti.js         # Multi-wave jackpot celebration fireworks
│   │   ├── sound.js            # Lazy-loaded Tone.js procedural audio & background music engine
│   │   ├── state.js            # Application state & localStorage persistence
│   │   └── wheel.js            # HTML5 Canvas wheel & flapper rendering
│   └── vendor/                 # Locally bundled JS libraries (no external CDN failures)
│       ├── confetti.min.js     # canvas-confetti v1.6.0
│       ├── peerjs.min.js       # PeerJS v1.5.4 (serverless WebRTC P2P rooms)
│       ├── qrcode.min.js       # QRCode.js v1.0.0
│       └── tone.min.js         # Tone.js v14.8.49 (lazy-loaded on first user gesture)
├── package.json                # Node.js project manifest & scripts
├── wrangler.toml               # Cloudflare Pages configuration (pages_build_output_dir = "public")
├── server.js                   # Zero-dependency Node.js local server (port 3010)
├── run.bat                     # One-click Windows launcher
└── README.md                   # Project documentation
```

---

## 🚀 Getting Started

### Option 1: Deploy from GitHub to Cloudflare Pages (No Database Required)
1. Push this repository to GitHub.
2. In **Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git**, select your repository.
3. Configure the build settings:
   - **Framework preset**: `None`
   - **Build command**: *(leave empty)*
   - **Build output directory**: `public`
4. Click **Save and Deploy**!

### Option 2: Run Locally on Windows (`run.bat` or `npm start`)
- Double-click **`run.bat`**, or run in terminal:
  ```bash
  npm start
  ```
- Open `http://localhost:3010` in your browser.

---

## 💖 Support / Donations

- **PayPal**: [paypal.me/checago](https://paypal.me/checago)
- **GCash / QR Ph**: Scan the QR code inside the app under **Support**.
