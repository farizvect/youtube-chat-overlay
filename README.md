# YouTube Live Chat OBS Overlay

Menampilkan YouTube Live Chat di OBS menggunakan Browser Source dengan WebSocket real-time.

## Features

- ✅ YouTube Live Chat real-time
- ✅ Emote support (channel emotes)
- ✅ Custom word-to-GIF replacement
- ✅ Role-based username colors (Owner, Mod, Member, Verified)
- ✅ Super Chat styling
- ✅ Slide-in animation
- ✅ Auto fade-out setelah 30 detik
- ✅ Max 10 pesan ditampilkan

## Installation

### 1. Download Project

1. Klik tombol hijau **Code** → **Download ZIP**
2. Extract file ZIP ke folder yang diinginkan (contoh: `D:\code\stream`)

### 2. Buka Terminal di Folder Project

**Windows:**
- Buka folder hasil extract di File Explorer
- Klik address bar, ketik `cmd` atau `powershell`, tekan Enter

**Atau:**
- Klik kanan di folder → **Open in Terminal** (Windows 11)
- Klik kanan sambil tahan Shift → **Open PowerShell window here** (Windows 10)

### 3. Install Bun

**Windows (PowerShell):**
```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

**Linux/macOS:**
```bash
curl -fsSL https://bun.sh/install | bash
```

Setelah install, **tutup dan buka kembali terminal**, lalu verifikasi:
```bash
bun --version
```

### 4. Install Dependencies

Pastikan terminal sudah di folder project, lalu jalankan:
```bash
bun install
```

## Usage

### Start Server

```bash
# Dengan YouTube Channel Handle
bun server.js --channel=@CHANNEL_NAME

# Dengan YouTube Live Video ID
bun server.js --live=VIDEO_ID
```

Contoh:
```bash
bun server.js --live=dQw4w9WgXcQ
```

### Setup OBS Browser Source

1. Di OBS, klik **+** pada Sources → **Browser**
2. Isi settings:
   - **URL:** `http://localhost:6969`
   - **Width:** `500` (atau sesuai kebutuhan)
   - **Height:** `600` (atau sesuai kebutuhan)
   - **Custom CSS:** kosongkan
3. Klik **OK**

### Tips OBS
- Posisikan di pojok layar sesuai preferensi
- Resize langsung di OBS dengan drag corner
- Jika chat tidak muncul, cek apakah server sudah jalan

## Configuration

Edit `config.js` untuk mengubah settings:

```javascript
export default {
  port: 6969,           // Port server
  maxMessages: 10,      // Jumlah pesan maksimal
  fadeOutDelay: 30000,  // Delay fade out (ms)
  
  // ===== STYLING =====
  
  // Font dari Google Fonts (https://fonts.google.com)
  fontFamily: "Inter",  // Contoh: "Roboto", "Poppins", "Nunito"
  
  // Ukuran font (pixel)
  fontSize: 15,
  
  // Mode tanpa background (hanya text)
  noBackground: false,
  
  // Warna background chat box (RGBA)
  backgroundColor: "rgba(30, 30, 40, 0.9)",
  
  // Warna text
  textColor: "#f0f0f0",
  
  // ===== ROLE COLORS =====
  
  // Warna username berdasarkan role
  ownerColor: "#ffd700",      // Owner/Streamer (Gold)
  moderatorColor: "#5865f2",  // Moderator (Blue)
  memberColor: "#2ecc71",     // Member/Subscriber (Green)
  verifiedColor: "#00bcd4",   // Verified (Cyan)
  
  // ===== FILTER =====
  
  // Filter kata kotor (case-insensitive)
  bannedWords: [
    "kata1",
    "kata2",
  ],
  
  // ===== CUSTOM GIF =====
  
  customGifs: {
    "bang": "/gifs/happycat.gif",
  },
};
```

### Menambah Custom GIF

1. Taruh file GIF di folder `public/gifs/`
2. Tambahkan mapping di `config.js`:
   ```javascript
   customGifs: {
     "kata_trigger": "/gifs/nama_file.gif",
   },
   ```
3. Restart server


## File Structure

```
stream/
├── server.js          # Main server
├── config.js          # Configuration
├── package.json
├── public/
│   ├── index.html     # Browser source page
│   ├── style.css      # Styling
│   ├── script.js      # Client script
│   └── gifs/          # Custom GIF folder
└── README.md
```


## Troubleshooting

### Chat tidak muncul di OBS
- Pastikan server sudah jalan (`bun server.js --live=VIDEO_ID`)
- Refresh browser source di OBS (klik kanan → Refresh)
- Cek apakah stream YouTube sedang live

### Emote tidak muncul
- Beberapa emote standar YouTube tidak memiliki URL gambar
- Channel emotes biasanya berfungsi dengan baik

### Background hitam di OBS
- Pastikan tidak ada `backdrop-filter` di CSS
- Custom CSS di OBS harus kosong

## Kustomisasi Lanjutan dengan AI

Ingin kustomisasi lebih lanjut? Gunakan **[ask-your-ai.md](ask-your-ai.md)** untuk prompt template yang bisa kamu copy-paste ke ChatGPT, Claude, atau AI lainnya untuk membantu mengubah tampilan tanpa merusak integrasi config.
