import { LiveChat } from "youtube-chat";
import config from "./config.js";

// Store connected WebSocket clients
const clients = new Set();

// Parse command line arguments
const args = process.argv.slice(2);
let channelId = null;
let liveId = null;

for (const arg of args) {
    if (arg.startsWith("--channel=")) {
        channelId = arg.split("=")[1];
    } else if (arg.startsWith("--live=")) {
        liveId = arg.split("=")[1];
    }
}

// Broadcast message to all connected clients
function broadcast(data) {
    const message = JSON.stringify(data);
    for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    }
}

// Initialize YouTube Live Chat
let liveChat = null;

// Resolve @handle to Channel ID and find live stream
async function resolveChannelToLiveId(handle) {
    try {
        // Fetch the channel's live page
        const url = `https://www.youtube.com/${handle}/live`;
        console.log(`🔍 Fetching: ${url}`);

        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
            redirect: "follow"
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();

        // Extract video ID from the page
        // Look for "videoId":"XXXXXXXXXXX" pattern
        const videoIdMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);

        if (videoIdMatch && videoIdMatch[1]) {
            // Verify it's actually a live stream by checking for isLive
            if (html.includes('"isLive":true') || html.includes('"isLiveContent":true')) {
                return videoIdMatch[1];
            } else {
                console.log("⚠️  Found video but it's not currently live");
                return null;
            }
        }

        return null;
    } catch (error) {
        console.error(`❌ Error resolving channel: ${error.message}`);
        return null;
    }
}

async function startLiveChat() {
    if (!channelId && !liveId) {
        console.log("⚠️  No channel or live ID provided. Start with:");
        console.log("   bun server.js --channel=@CHANNEL_HANDLE");
        console.log("   bun server.js --live=LIVE_VIDEO_ID");
        console.log("");
        console.log("📺 Server is running, waiting for chat connection...");
        return;
    }

    try {
        // If channel handle provided, resolve to live ID
        if (channelId) {
            console.log(`🔍 Looking for live stream on channel: ${channelId}`);
            const resolvedLiveId = await resolveChannelToLiveId(channelId);

            if (resolvedLiveId) {
                console.log(`✅ Found live stream: ${resolvedLiveId}`);
                liveId = resolvedLiveId;
            } else {
                console.log("❌ No live stream found on this channel");
                console.log("💡 Try using --live=VIDEO_ID instead");
                return;
            }
        }

        // Now use liveId
        console.log(`🔍 Connecting to live stream: ${liveId}`);
        liveChat = new LiveChat({ liveId });

        // Chat started event
        liveChat.on("start", (liveId) => {
            console.log(`✅ Connected to live chat: ${liveId}`);
        });

        // Chat message event
        liveChat.on("chat", (chatItem) => {
            const badges = [];

            // Check for badges
            if (chatItem.isOwner) badges.push("Owner");
            if (chatItem.isModerator) badges.push("Moderator");
            if (chatItem.isMembership) badges.push("Member");
            if (chatItem.isVerified) badges.push("Verified");

            // Build message parts array (structured data for reliable rendering)
            const messageParts = [];
            let messageText = "";

            if (chatItem.message) {
                chatItem.message.forEach((part) => {
                    if (part.text) {
                        // Regular text
                        messageParts.push({ type: "text", content: part.text });
                        messageText += part.text;
                    } else if (part.emojiText) {
                        // Emoji/emote - check if it has a valid URL
                        if (part.url && part.url.startsWith("http")) {
                            messageParts.push({
                                type: "emote",
                                text: part.emojiText,
                                url: part.url,
                            });
                        } else {
                            // No valid URL, treat as text (standard emoji)
                            messageParts.push({ type: "text", content: part.emojiText });
                        }
                        messageText += part.emojiText;
                    }
                });
            }

            // Build message object
            const message = {
                author: chatItem.author.name,
                message: messageText, // For logging/fallback
                messageParts, // Structured parts for rendering
                badges,
                superchat: chatItem.superchat
                    ? {
                        amount: chatItem.superchat.amount,
                        color: chatItem.superchat.color,
                    }
                    : null,
                timestamp: Date.now(),
            };

            // Filter banned words (case-insensitive)
            if (config.bannedWords && config.bannedWords.length > 0) {
                const lowerMessage = messageText.toLowerCase();
                const hasBannedWord = config.bannedWords.some(word =>
                    lowerMessage.includes(word.toLowerCase())
                );
                if (hasBannedWord) {
                    console.log(`🚫 Filtered: ${message.author}: ${message.message}`);
                    return; // Skip this message
                }
            }

            console.log(`💬 ${message.author}: ${message.message}`);

            // Broadcast to all clients
            broadcast({ type: "chat", message });
        });

        // Error event
        liveChat.on("error", (err) => {
            console.error("❌ Live chat error:", err.message);
        });

        // End event
        liveChat.on("end", (reason) => {
            console.log(`⏹️  Live chat ended: ${reason}`);
        });

        // Start listening
        const started = await liveChat.start();
        if (!started) {
            console.error("❌ Failed to start live chat. Is the stream live?");
        }
    } catch (error) {
        console.error("❌ Error starting live chat:", error.message);
    }
}

// Create Bun server
const server = Bun.serve({
    port: config.port,

    // Handle HTTP requests
    async fetch(req, server) {
        const url = new URL(req.url);

        // WebSocket upgrade
        if (url.pathname === "/ws") {
            const upgraded = server.upgrade(req);
            if (!upgraded) {
                return new Response("WebSocket upgrade failed", { status: 400 });
            }
            return;
        }

        // Health check
        if (url.pathname === "/health") {
            return new Response(JSON.stringify({
                status: "ok",
                clients: clients.size,
                liveId: liveId || null,
                uptime: process.uptime(),
            }), {
                headers: { "Content-Type": "application/json" },
            });
        }

        // Serve static files from public folder
        let filePath = url.pathname === "/" ? "/index.html" : url.pathname;

        try {
            const file = Bun.file(`./public${filePath}`);
            const exists = await file.exists();

            if (exists) {
                return new Response(file);
            }

            return new Response("Not Found", { status: 404 });
        } catch (error) {
            return new Response("Internal Server Error", { status: 500 });
        }
    },

    // WebSocket handlers
    websocket: {
        open(ws) {
            clients.add(ws);
            console.log(`🔌 Client connected (${clients.size} total)`);

            // Send config to client
            ws.send(
                JSON.stringify({
                    type: "config",
                    config: {
                        maxMessages: config.maxMessages,
                        fadeOutDelay: config.fadeOutDelay,
                        customGifs: config.customGifs,
                        backgroundColor: config.backgroundColor,
                        fontSize: config.fontSize,
                        noBackground: config.noBackground,
                        textColor: config.textColor,
                        fontFamily: config.fontFamily,
                        ownerColor: config.ownerColor,
                        moderatorColor: config.moderatorColor,
                        memberColor: config.memberColor,
                        verifiedColor: config.verifiedColor,
                        inlineChat: config.inlineChat,
                    },
                })
            );
        },

        message(ws, message) {
            // Handle client messages if needed
            console.log("📨 Received:", message);
        },

        close(ws) {
            clients.delete(ws);
            console.log(`🔌 Client disconnected (${clients.size} total)`);
        },
    },
});

console.log(`
╔═══════════════════════════════════════════════════════════╗
║     YouTube Live Chat OBS Overlay                         ║
╠═══════════════════════════════════════════════════════════╣
║  🌐 Server running at: http://localhost:${config.port}            ║
║  📺 Browser Source URL: http://localhost:${config.port}           ║
║  🔌 WebSocket: ws://localhost:${config.port}/ws                   ║
╚═══════════════════════════════════════════════════════════╝
`);

// Start live chat
startLiveChat();

// Handle process termination
process.on("SIGINT", () => {
    console.log("\n👋 Shutting down...");
    if (liveChat) {
        liveChat.stop();
    }
    process.exit(0);
});
