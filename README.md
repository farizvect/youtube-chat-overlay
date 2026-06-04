# YouTube Live Chat OBS Overlay

Menampilkan YouTube Live Chat di OBS menggunakan Browser Source dengan WebSocket real-time.

## Quick Start

```bash
# First time only:
bash install.sh

# Every time you go live:
bash start.sh
```

## Features

- ✅ YouTube Live Chat real-time
- ✅ Emote support (channel emotes)
- ✅ Custom word-to-GIF replacement
- ✅ Role-based username colors (Owner, Mod, Member, Verified)
- ✅ Super Chat styling
- ✅ Slide-in animation
- ✅ Auto fade-out
- ✅ Inline chat mode

## Manual Setup

```bash
bun install
bun setup.js          # Interactive config wizard
bun server.js --live=VIDEO_ID
```

## Reconfigure

```bash
bun setup.js          # Change font, colors, background
```

## Usage

### Start Server

```bash
# With YouTube Live Video ID
bun server.js --live=VIDEO_ID

# With YouTube Channel Handle
bun server.js --channel=@CHANNEL_NAME
```

### Setup OBS Browser Source

1. Di OBS, klik **+** pada Sources → **Browser**
2. Isi settings:
   - **URL:** `http://localhost:6969`
   - **Width:** `1280`
   - **Height:** `720`
3. Klik **OK**

## Configuration

Edit `config.json` or run `bun setup.js` for interactive wizard.

```json
{
    "port": 6969,
    "maxMessages": 10,
    "fadeOutDelay": 120000,
    "fontFamily": "Roboto",
    "fontSize": 16,
    "noBackground": false,
    "backgroundColor": "rgba(50, 50, 68, 0.9)",
    "textColor": "#ffffffee",
    "ownerColor": "#ffd700",
    "moderatorColor": "#5865f2",
    "memberColor": "#2ecc71",
    "verifiedColor": "#00bcd4",
    "bannedWords": [],
    "customGifs": {
        "cat": "/gifs/happycat.gif"
    }
}
```

## File Structure

```
├── server.js              # Main server
├── setup.js               # Interactive config wizard
├── config.template.json   # Default config template
├── config.json            # Your config (gitignored)
├── install.sh             # One-time installer
├── start.sh               # Day-to-day launcher
├── package.json
├── public/
│   ├── index.html         # Browser source page
│   ├── style.css          # Styling
│   ├── script.js          # Client script
│   └── gifs/              # Custom GIF folder
└── README.md
```

## Troubleshooting

### Chat tidak muncul di OBS
- Pastikan server sudah jalan
- Refresh browser source di OBS (klik kanan → Refresh)
- Cek apakah stream YouTube sedang live
- Cek `/health` endpoint: `curl http://localhost:6969/health`
