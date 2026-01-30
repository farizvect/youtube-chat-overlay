// Configuration for YouTube Live Chat OBS Overlay
export default {
    // Server port
    port: 6969,

    // Maximum messages to display
    maxMessages: 5,

    // Time before message fades out (in milliseconds)
    fadeOutDelay: 120000, // 30 seconds

    // Inline chat mode (true = username: message on same line)
    inlineChat: false,

    // ===== STYLING =====

    // Font family (gunakan nama font dari Google Fonts)
    // Contoh: "Inter", "Roboto", "Poppins", "Nunito", "Open Sans"
    // Lihat daftar lengkap di: https://fonts.google.com
    fontFamily: "Roboto",

    // Font size untuk pesan (dalam pixel)
    fontSize: 16,

    // No background mode (true = tanpa background, hanya text)
    noBackground: false,

    // Chat box background color (RGBA format) - diabaikan jika noBackground = true
    // Contoh: "rgba(0, 0, 0, 0.7)" untuk semi-transparent
    //         "rgba(30, 30, 40, 0.9)" untuk dark purple
    backgroundColor: "rgba(50, 50, 68, 0.9)",

    // Warna text pesan
    textColor: "#ffffffee",

    // ===== ROLE COLORS =====
    // Warna username berdasarkan role

    // Warna username Owner/Streamer
    ownerColor: "#ffd700",

    // Warna username Moderator
    moderatorColor: "#5865f2",

    // Warna username Member (langganan)
    memberColor: "#2ecc71",

    // Warna username Verified
    verifiedColor: "#00bcd4",

    // ===== FILTER =====

    // Banned words filter (case-insensitive)
    // Pesan yang mengandung kata-kata ini akan di-hide
    bannedWords: [
        // Contoh kata kotor (tambahkan sesuai kebutuhan):
        // "kata1",
        // "kata2",
        // "spam",
    ],

    // ===== CUSTOM GIF =====

    // Custom word to GIF mapping
    // Add your custom GIFs here
    // Place GIF files in public/gifs/ folder
    customGifs: {
        "cat": "/gifs/happycat.gif",
        // Add more mappings here:
        // "kata": "/gifs/nama-file.gif",
    },
};

