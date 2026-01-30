# Ask Your AI - Panduan Kustomisasi

Gunakan prompt berikut untuk meminta AI (ChatGPT, Claude, Gemini, dll) membantu kustomisasi tampilan chat overlay.

> **Penting**: Jangan ubah file `config.js`, `server.js`, atau variabel CSS yang dimulai dengan `--`. File-file tersebut sudah terintegrasi dengan sistem konfigurasi.

---

## Cara Menggunakan

1. Copy prompt di bawah yang sesuai kebutuhanmu
2. Paste ke AI chatbot pilihanmu
3. Lampirkan file `public/style.css` jika diminta
4. Terapkan perubahan yang disarankan AI

---

## Prompt Templates

### 🎨 Ubah Tema Warna

```
Saya memiliki file CSS untuk OBS chat overlay. Tolong ubah tema warnanya menjadi [TEMA YANG DIINGINKAN].

Aturan:
- JANGAN ubah CSS variable yang dimulai dengan -- (seperti --chat-bg-color, --text-color, dll)
- JANGAN ubah class .chat-message background karena sudah pakai variable
- Fokus pada elemen yang TIDAK menggunakan CSS variable

[PASTE ISI FILE style.css DISINI]
```

**Contoh tema**: cyberpunk, pastel pink, dark neon, forest green, ocean blue

---

### ✨ Ubah Animasi

```
Saya memiliki file CSS untuk OBS chat overlay. Tolong ubah animasi masuk pesan menjadi [JENIS ANIMASI].

Aturan:
- Ubah @keyframes slideIn dan slideOut saja
- Jangan ubah durasi animation di .chat-message (biarkan 0.4s)
- Pastikan animasi berakhir dengan opacity: 1 dan transform yang benar

[PASTE ISI FILE style.css DISINI]
```

**Contoh animasi**: fade in dari bawah, bounce, zoom in, slide dari kanan

---

### 📝 Ubah Style Username

```
Saya memiliki file CSS untuk OBS chat overlay. Tolong ubah tampilan username menjadi [STYLE YANG DIINGINKAN].

Aturan:
- Ubah class .username saja (font-weight, font-size, dll)
- JANGAN ubah .username-owner, .username-moderator, dst karena menggunakan CSS variable
- Jangan hapus property color yang ada

[PASTE ISI FILE style.css DISINI]
```

**Contoh style**: bold besar, italic, uppercase, dengan background

---

### 💬 Ubah Style Chat Box

```
Saya memiliki file CSS untuk OBS chat overlay. Tolong ubah tampilan chat box menjadi [STYLE YANG DIINGINKAN].

Aturan:
- Ubah class .chat-message KECUALI property: background, border, padding
- Bisa ubah: border-radius, box-shadow, margin, dll
- Property background, border, padding menggunakan CSS variable, jangan diubah

[PASTE ISI FILE style.css DISINI]
```

**Contoh style**: rounded besar, dengan shadow, border tebal, efek glow

---

### 😀 Ubah Ukuran Emote

```
Saya memiliki file CSS untuk OBS chat overlay. Tolong ubah ukuran emote menjadi [UKURAN]px.

Ubah class .emote dan .custom-gif:
- height: [UKURAN]px
- Jaga aspect ratio (width: auto)

[PASTE ISI FILE style.css DISINI]
```

---

### 🔧 Kustomisasi Advanced

```
Saya memiliki file CSS untuk OBS chat overlay YouTube. Tolong bantu saya [JELASKAN PERUBAHAN YANG DIINGINKAN].

Context penting:
1. File ini digunakan untuk browser source di OBS
2. Background HARUS transparan (body background: transparent)
3. CSS variable berikut di-set dinamis dari config.js, JANGAN diubah nilainya di :root:
   - --chat-bg-color
   - --chat-border
   - --chat-padding
   - --text-color
   - --font-size
   - --font-family
   - --owner-color, --moderator-color, --member-color, --verified-color

4. Selector yang menggunakan variable tersebut:
   - .chat-message (background, border, padding)
   - .message-text (font-size, color)
   - body (font-family)
   - .username-owner, .username-moderator, .username-member, .username-verified (color)

Tolong berikan perubahan yang tidak mengganggu integrasi dengan config.js.

[PASTE ISI FILE style.css DISINI]
```

---

## Tips

- **Backup dulu**: Copy file asli sebelum mengubah
- **Test di browser**: Buka `http://localhost:6969` untuk preview
- **Increment changes**: Ubah satu hal dulu, test, baru lanjut
- **CSS variable aman untuk dipakai**: Kamu bisa tambah CSS baru yang menggunakan variable yang ada

---

## Contoh Perubahan Aman

### Tambah shadow pada chat box:
```css
.chat-message {
    /* Tambahkan ini, jangan hapus yang lain */
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}
```

### Ubah border-radius:
```css
.chat-message {
    border-radius: 20px; /* Ubah dari 12px */
}
```

### Tambah efek hover (untuk testing di browser):
```css
.chat-message:hover {
    transform: scale(1.02);
    transition: transform 0.2s;
}
```
