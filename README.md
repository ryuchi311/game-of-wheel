# Game of Wheel

Interactive Physics Prize & Decision Spinner web application.

## Project Structure

```text
GOW/
├── public/                 # Static frontend web assets
│   ├── index.html          # Main application HTML shell
│   ├── css/
│   │   └── styles.css      # Custom animations, glassmorphism & Stage Mode styles
│   └── js/
│       ├── app.js          # Main application controller, physics loop & UI events
│       ├── config.js       # Presets, color palettes & musical scales/patterns
│       ├── confetti.js     # Multi-wave jackpot celebration fireworks
│       ├── sound.js        # Procedural Tone.js sound effects & background music engine
│       ├── state.js        # Application state & localStorage persistence
│       └── wheel.js        # HTML5 Canvas wheel & flapper rendering
├── package.json            # Node.js package configuration & scripts
├── server.js               # Static HTTP web server serving /public
└── README.md               # Project documentation
```

## Getting Started

1. Start the web server:
   ```bash
   npm start
   ```
2. Open your browser at `http://localhost:3010`.

## 💖 Support / Donations

If you enjoy Game of Wheel and want to support the project:
- **PayPal**: [paypal.me/checago](https://paypal.me/checago)
- **GCash / QR Ph**: Scan the QR code available in the web app under **"Tip & Support"**.


