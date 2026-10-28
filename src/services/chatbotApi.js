import { apiRequest } from "./api";

/**
 * Send a message to the FoodExpress Chatbot backend.
 * Automatically attaches customer JWT token if logged in.
 */
export async function sendChatMessage(message, history = []) {
    return await apiRequest("/chatbot/message", {
        method: "POST",
        body: JSON.stringify({
            message,
            history
        })
    });
}

