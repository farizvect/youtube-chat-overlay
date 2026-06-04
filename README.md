# YouTube Live Chat OBS Overlay

Menampilkan YouTube Live Chat di OBS menggunakan Browser Source dengan WebSocket real-time.

## Quick Start

```bash
# One-liner — download, install, and configure interactively:
curl -fsSL https://raw.githubusercontent.com/farizvect/youtube-chat-overlay/refs/heads/main/install.sh | bash

# Every time you go live:
cd ~/youtube-chat-overlay && bash start.sh
```

`start.sh` akan menampilkan config picker — pilih config sesuai stream kamu (turnamen, santai, podcast, dll), lalu masukkan live video ID atau channel handle.

## Features

- ✅ YouTube Live Chat real-time via WebSocket
- ✅ Emote support (channel emotes)
- ✅ Custom word-to-GIF replacement
- ✅ Role-based username colors (Owner, Mod, Member, Verified)
- ✅ Super Chat styling + glow animation + extended duration
- ✅ Slide-in animation + auto fade-out
- ✅ Inline chat mode
- ✅ Interactive config wizard (`bun setup.js`)
- ✅ Multi-config — simpan preset untuk berbagai jenis stream
- ✅ Config hot-reload — edit config saat server jalan, langsung update di OBS
- ✅ Message replay — client baru langsung dapat chat terakhir (tidak blank)
- ✅ Configurable message position (bottom-left, center, right)
- ✅ GIF manager — import dari URL, tambah/hapus trigger

## Multi-Config

Setiap config disimpan di folder `configs/` sebagai file JSON terpisah. `config.json` adalah symlink ke config aktif.

```
configs/
├── default.json       ← config bawaan
├── tournament.json    ← preset turnamen
└── podcast.json       ← preset podcast (contoh)
config.json            → symlink ke configs/tournament.json (aktif)
```

### Pindah Config

```bash
bun setup.js          # Menu → Switch config → pilih
```

Atau langsung di `start.sh` — ada config picker interaktif setiap kali start.

## Setup Wizard (`bun setup.js`)

Menu utama:

```
1) Edit current config    — font, background, inline mode, warna
2) Switch config          — pindah ke config lain
3) Create new config      — dari template
4) Delete config          — hapus config (default tidak bisa dihapus)
5) Manage GIFs            — tambah trigger, hapus, import dari URL
```

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
bash install.sh
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
├── server.js              # HTTP + WebSocket server
├── setup.js               # Interactive config + GIF wizard
├── config.template.json   # Template config
├── config.json            → symlink ke configs/<active>.json
├── configs/               # Semua config disini
│   ├── default.json
│   └── tournament.json
├── install.sh             # One-time installer
├── start.sh               # Launcher + config picker
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
