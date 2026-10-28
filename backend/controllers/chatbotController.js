const { gatherEvidence } = require("../services/chatbotDataService");
const { generateChatbotReply } = require("../services/chatbotAiService");

// In-memory rate limiting for chatbot queries (30 requests per 10 minutes per IP)
const chatbotRequestLogs = new Map();
const CHATBOT_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;

const checkRateLimit = (ip) => {
    const now = Date.now();
    const entry = chatbotRequestLogs.get(ip) || { count: 0, resetTime: now + CHATBOT_WINDOW_MS };

    if (now > entry.resetTime) {
        entry.count = 1;
        entry.resetTime = now + CHATBOT_WINDOW_MS;
    } else {
        entry.count += 1;
    }

    chatbotRequestLogs.set(ip, entry);
    return entry.count <= MAX_REQUESTS_PER_WINDOW;
};

/**
 * Handle incoming customer chatbot message.
 * POST /api/chatbot/message
 */
const handleChatbotMessage = async (req, res) => {
    try {
        const clientIp = req.ip || req.connection?.remoteAddress || "client";

        // 1. Rate Limiting Check
        if (!checkRateLimit(clientIp)) {
            return res.status(429).json({
                message: "You have sent too many messages. Please wait a few moments before asking again."
            });
        }

        const { message } = req.body;

        // 2. Message Validation
        if (!message || typeof message !== "string") {
            return res.status(400).json({
                message: "Message is required and must be text."
            });
        }

        const trimmed = message.trim();
        if (trimmed.length === 0) {
            return res.status(400).json({
                message: "Please enter a valid question or message."
            });
        }

        if (trimmed.length > 500) {
            return res.status(400).json({
                message: "Message cannot exceed 500 characters."
            });
        }

        // 3. User Identification (from optionalAuthMiddleware)
        const userId = req.user?.id || null;

        // 4. Retrieve Database Grounded Evidence
        const { evidence, sources } = await gatherEvidence(trimmed, userId);

        // 5. Generate AI / Grounded Reply
        const { reply, provider, model, setupNotice } = await generateChatbotReply(trimmed, evidence);

        return res.status(200).json({
            reply,
            sources,
            provider,
            model,
            setupNotice
        });
    } catch (err) {
        console.error("Chatbot Controller Error:", err.message);
        return res.status(500).json({
            message: "The assistant encountered an error. Please try again in a moment."
        });
    }
};

module.exports = {
    handleChatbotMessage
};

