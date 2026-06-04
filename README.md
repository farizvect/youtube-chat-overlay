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
# Linux/macOS
cd ~/youtube-chat-overlay && bash start.sh

# Windows (PowerShell)
cd ~/youtube-chat-overlay; .\start.ps1

# Or directly (all platforms):
cd ~/youtube-chat-overlay && bun start.js
```

`start.js` akan menampilkan config picker interaktif — pilih config dengan arrow key, lalu masukkan live video ID atau channel handle.

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
  Files go in:  public/gifs/
  Trigger → File:
    cat → /gifs/happycat.gif
    pog → /gifs/pogchamp.gif
```

Taruh file `.gif` / `.png` / `.webp` di folder `public/gifs/`, lalu assign trigger word lewat menu. Atau pakai **Import GIF from URL** buat download langsung.

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
├── install.sh             # One-line installer (Linux/macOS)
├── install.ps1            # One-line installer (Windows)
├── start.js               # Interactive launcher (all platforms)
├── start.sh               # Shell wrapper → start.js
├── start.ps1              # PowerShell wrapper → start.js
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
