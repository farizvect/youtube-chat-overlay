# YouTube Live Chat OBS Overlay

Menampilkan YouTube Live Chat di OBS menggunakan Browser Source dengan WebSocket real-time.

## Quick Start

**Linux / macOS:**
```bash
curl -fsSL https://raw.githubusercontent.com/farizvect/youtube-chat-overlay/refs/heads/main/install.sh | bash
```

**Windows (PowerShell):**
```powershell
irm https://raw.githubusercontent.com/farizvect/youtube-chat-overlay/refs/heads/main/install.ps1 | iex
```

**Every time you go live:**
```bash
cd ~/youtube-chat-overlay
bun start.js
```

`start.js` akan handle first-run setup, pilih config aktif, lalu minta live video ID atau channel handle.

## Features

- ✅ YouTube Live Chat real-time via WebSocket
- ✅ Emote support (channel emotes)
- ✅ Custom word-to-GIF replacement
- ✅ Role-based username colors (Owner, Mod, Member, Verified)
- ✅ Super Chat styling + glow animation + extended duration
- ✅ Slide-in animation + auto fade-out
- ✅ Inline chat mode
- ✅ Single launcher (`bun start.js`)
- ✅ Interactive config wizard (`bun start.js --setup` atau `bun setup.js`)
- ✅ Multi-config — simpan preset untuk berbagai jenis stream
- ✅ Config hot-reload — edit config saat server jalan, langsung update di OBS
- ✅ Message replay — client baru langsung dapat chat terakhir (tidak blank)
- ✅ Configurable message position (bottom-left, center, right)
- ✅ GIF manager — import dari URL, tambah/hapus trigger

## Multi-Config

Setiap config disimpan di folder `configs/` sebagai file JSON terpisah. `config.json` menunjuk ke config aktif via symlink jika OS mengizinkan; kalau tidak, launcher fallback ke copy. Nama config hanya boleh huruf, angka, dash, dan underscore.

```
configs/
├── default.json       ← dibuat otomatis dari template
├── tournament.json    ← preset turnamen
└── podcast.json       ← preset podcast
config.json            → config aktif
.active-config         → nama config aktif
```

File `configs/*.json`, `config.json`, dan `.active-config` adalah user data dan tidak di-track git, supaya update tidak overwrite preset user.

### Pindah Config

```bash
bun start.js --setup   # Menu → Switch config → pilih
```

Atau pilih **Manage configs / GIFs** dari menu utama `bun start.js`.

## Setup Wizard (`bun start.js --setup`)

Menu utama:

```
1) Edit current config    — font, background, inline mode, warna
2) Switch config          — pindah ke config lain
3) Create new config      — dari template
4) Delete config          — hapus config (default tidak bisa dihapus)
5) Manage GIFs            — tambah trigger, hapus, import dari URL
```

`bun setup.js` masih tersedia sebagai compatibility wrapper ke `bun start.js --setup`.

### GIF Manager

```
─── GIF Manager ───
  Trigger → File:
    cat → /gifs/happycat.gif
    pog → /gifs/pogchamp.gif

  Files in public/gifs/:
    - happycat.gif
    - pogchamp.gif

  1) Add GIF trigger       ← hubungkan kata ke file GIF
  2) Remove GIF trigger     ← lepas trigger
  3) Import GIF from URL    ← download + langsung pasang trigger
  0) Back
```

Tambahkan file GIF sendiri ke `public/gifs/`, lalu assign trigger lewat menu option 1. Atau import dari URL via option 3.

## Configuration

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

    "inlineChat": false,
    "position": "bottom-left",
    "superChatDuration": 3,

    "bannedWords": [],
    "customGifs": {
        "cat": "/gifs/happycat.gif"
    }
}
```

## Manual Setup (alternative)

```bash
git clone https://github.com/farizvect/youtube-chat-overlay.git
cd youtube-chat-overlay
bun install
bun start.js
```

## OBS Setup

1. Di OBS, klik **+** pada Sources → **Browser**
2. Isi settings:
   - **URL:** `http://localhost:6969`
   - **Width:** `1280`
   - **Height:** `720`
3. Klik **OK**

## File Structure

```
├── start.js               # Launcher + setup + config/GIF manager
├── server.js              # HTTP + WebSocket server
├── setup.js               # Compatibility wrapper ke start.js --setup
├── config.template.json   # Template config
├── config.json            # User config aktif, gitignored
├── .active-config         # Nama config aktif, gitignored
├── configs/               # User configs, gitignored
│   └── .gitkeep
├── install.sh             # One-line installer (Linux/macOS)
├── install.ps1            # One-line installer (Windows)
├── start.sh               # Compatibility wrapper (Linux/macOS)
├── start.ps1              # Compatibility wrapper (Windows)
├── package.json
├── public/
│   ├── index.html         # Browser source page
│   ├── style.css
│   ├── script.js
│   └── gifs/              # Tempat file GIF
└── README.md
```

## Troubleshooting

### Chat tidak muncul di OBS
- Pastikan server sudah jalan
- Refresh browser source di OBS (klik kanan → Refresh)
- Cek apakah stream YouTube sedang live
- Cek `/health` endpoint: `curl http://localhost:6969/health`
