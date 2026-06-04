// YouTube Live Chat OBS Overlay - Client Script

// Configuration (will be updated via WebSocket)
let config = {
    maxMessages: 10,
    fadeOutDelay: 30000,
    customGifs: {},
    backgroundColor: "rgba(30, 30, 40, 0.9)",
    fontSize: 15,
    noBackground: false,
    textColor: "#f0f0f0",
    fontFamily: "Inter",
    ownerColor: "#ffd700",
    moderatorColor: "#5865f2",
    memberColor: "#2ecc71",
    verifiedColor: "#00bcd4",
    inlineChat: false
};

// Track loaded fonts to avoid reloading
let loadedFont = "";

// Precompiled custom GIF regexes (built once on config load)
let gifRegexes = [];

// WebSocket connection
let ws;
let reconnectAttempts = 0;
const maxReconnectAttempts = 10;

function connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
        console.log('Connected to chat server');
        reconnectAttempts = 0;
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'config') {
            config = { ...config, ...data.config };
            console.log('Config updated:', config);
            applyStyles();
            // Precompile GIF regexes
            gifRegexes = Object.entries(config.customGifs).map(([keyword, url]) => ({
                regex: new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi'),
                url,
                keyword,
            }));
        } else if (data.type === 'chat') {
            addChatMessage(data.message);
        }
    };

    // Apply styling from config
    function applyStyles() {
        const root = document.documentElement.style;

        // Load Google Font if changed
        if (config.fontFamily && config.fontFamily !== loadedFont) {
            loadGoogleFont(config.fontFamily);
            loadedFont = config.fontFamily;
        }

        // Background
        if (config.noBackground) {
            root.setProperty('--chat-bg-color', 'transparent');
            root.setProperty('--chat-border', 'none');
            root.setProperty('--chat-padding', '4px 8px');
        } else {
            root.setProperty('--chat-bg-color', config.backgroundColor);
            root.setProperty('--chat-border', '1px solid rgba(255, 255, 255, 0.1)');
            root.setProperty('--chat-padding', '12px 16px');
        }

        // Text styling
        root.setProperty('--text-color', config.textColor);
        root.setProperty('--font-size', config.fontSize + 'px');
        root.setProperty('--font-family', `'${config.fontFamily}', sans-serif`);

        // Role colors
        root.setProperty('--owner-color', config.ownerColor);
        root.setProperty('--moderator-color', config.moderatorColor);
        root.setProperty('--member-color', config.memberColor);
        root.setProperty('--verified-color', config.verifiedColor);
    }

    // Load Google Font dynamically
    function loadGoogleFont(fontName) {
        // Remove existing dynamic font link
        const existingLink = document.getElementById('dynamic-font');
        if (existingLink) {
            existingLink.remove();
        }

        // Create new link for Google Font
        const link = document.createElement('link');
        link.id = 'dynamic-font';
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;600;700&display=swap`;
        document.head.appendChild(link);

        console.log(`Loaded Google Font: ${fontName}`);
    }

    ws.onclose = () => {
        console.log('Disconnected from chat server');
        if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            setTimeout(connect, 2000 * reconnectAttempts);
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
}

// Create chat message element
function addChatMessage(message) {
    const container = document.getElementById('chat-container');

    // Create message element
    const msgEl = document.createElement('div');
    msgEl.className = 'chat-message';

    // Add super chat class if applicable
    if (message.superchat) {
        msgEl.classList.add('super-chat');
    }

    // Build message content
    const contentEl = document.createElement('div');
    contentEl.className = 'message-content';

    // Check if inline mode
    if (config.inlineChat) {
        // Inline mode: username: message on same line
        contentEl.classList.add('inline-mode');

        // Username
        const usernameEl = document.createElement('span');
        usernameEl.className = 'username';

        // Add role-based color class
        if (message.badges && message.badges.length > 0) {
            if (message.badges.includes('Owner')) {
                usernameEl.classList.add('username-owner');
            } else if (message.badges.includes('Moderator')) {
                usernameEl.classList.add('username-moderator');
            } else if (message.badges.includes('Member')) {
                usernameEl.classList.add('username-member');
            } else if (message.badges.includes('Verified')) {
                usernameEl.classList.add('username-verified');
            }
        }

        usernameEl.textContent = message.author;
        contentEl.appendChild(usernameEl);

        // Separator
        const separator = document.createElement('span');
        separator.className = 'inline-separator';
        separator.textContent = ' : ';
        contentEl.appendChild(separator);

        // Message (inline span, not div)
        const textEl = document.createElement('span');
        textEl.className = 'message-text inline-text';
        textEl.innerHTML = processMessage(message);
        contentEl.appendChild(textEl);

    } else {
        // Normal mode: username on top, message below

        // Username row
        const usernameRow = document.createElement('div');
        usernameRow.className = 'username-row';

        // Username with role-based color
        const usernameEl = document.createElement('span');
        usernameEl.className = 'username';

        // Add role-based color class (priority: Owner > Moderator > Member > Verified)
        if (message.badges && message.badges.length > 0) {
            if (message.badges.includes('Owner')) {
                usernameEl.classList.add('username-owner');
            } else if (message.badges.includes('Moderator')) {
                usernameEl.classList.add('username-moderator');
            } else if (message.badges.includes('Member')) {
                usernameEl.classList.add('username-member');
            } else if (message.badges.includes('Verified')) {
                usernameEl.classList.add('username-verified');
            }
        }

        usernameEl.textContent = message.author;
        usernameRow.appendChild(usernameEl);

        // Super chat amount
        if (message.superchat && message.superchat.amount) {
            const amountEl = document.createElement('span');
            amountEl.className = 'super-chat-amount';
            amountEl.textContent = message.superchat.amount;
            usernameRow.appendChild(amountEl);
        }

        contentEl.appendChild(usernameRow);

        // Message text with emotes and custom GIFs
        const textEl = document.createElement('div');
        textEl.className = 'message-text';
        textEl.innerHTML = processMessage(message);
        contentEl.appendChild(textEl);
    }

    msgEl.appendChild(contentEl);
    container.appendChild(msgEl);

    // Limit messages
    const messages = container.querySelectorAll('.chat-message');
    if (messages.length > config.maxMessages) {
        const oldMessage = messages[0];
        oldMessage.classList.add('fade-out');
        setTimeout(() => oldMessage.remove(), 500);
    }

    // Auto fade out
    setTimeout(() => {
        if (msgEl.parentNode) {
            msgEl.classList.add('fade-out');
            setTimeout(() => msgEl.remove(), 500);
        }
    }, config.fadeOutDelay);

    // Scroll to bottom (if needed)
    container.scrollTop = container.scrollHeight;
}

// Process message parts into HTML
function processMessage(message) {
    const parts = message.messageParts || [];

    // If no structured parts, fallback to plain text
    if (parts.length === 0) {
        return processPlainText(message.message || "");
    }

    let html = "";

    for (const part of parts) {
        if (part.type === "text") {
            // Process text for custom GIFs
            html += processPlainText(part.content);
        } else if (part.type === "emote") {
            // Render emote as image with error handling
            // On error, replace with alt text
            html += `<img src="${escapeAttr(part.url)}" class="emote" alt="${escapeAttr(part.text)}" onerror="this.outerHTML=this.alt">`;
        }
    }

    return html;
}

// Process plain text with HTML escaping and custom GIF replacement
function processPlainText(text) {
    // Escape HTML first
    let processed = escapeHtml(text);

    // Replace custom GIF keywords (precompiled regexes)
    for (const { regex, url, keyword } of gifRegexes) {
        processed = processed.replace(regex, `<img src="${escapeAttr(url)}" class="custom-gif" alt="${escapeAttr(keyword)}">`);
    }

    return processed;
}

// Escape HTML special characters
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Escape HTML attribute values
function escapeAttr(text) {
    if (!text) return "";
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Escape regex special characters
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Initialize
connect();
