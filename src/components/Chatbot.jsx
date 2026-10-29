import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { sendChatMessage } from "../services/chatbotApi";

const SUGGESTED_QUESTIONS = [
    "How is FoodExpress service?",
    "What do customers say about food quality?",
    "Which dishes are highly rated?",
    "What food is available today?",
    "What is the price of Ice Cream?"
];

export default function Chatbot() {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [messages, setMessages] = useState([
        {
            id: "welcome",
            sender: "bot",
            text: "Hello! I am your FoodExpress Assistant. 🍽️\n\nAsk me anything about our dishes, prices, availability, partner restaurants, or customer ratings & reviews!",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
    ]);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to bottom of chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            inputRef.current?.focus();
        }
    }, [isOpen, messages]);

    const handleSend = async (textToSend) => {
        const query = (textToSend || input).trim();
        if (!query || loading) return;

        setError("");
        setInput("");

        const userMsg = {
            id: `user-${Date.now()}`,
            sender: "user",
            text: query,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };

        setMessages((prev) => [...prev, userMsg]);
        setLoading(true);

        try {
            // Prepare lightweight history turns
            const history = messages
                .slice(-6)
                .filter((m) => m.id !== "welcome")
                .map((m) => ({
                    role: m.sender === "user" ? "user" : "assistant",
                    content: m.text
                }));

            const res = await sendChatMessage(query, history);

            const botMsg = {
                id: `bot-${Date.now()}`,
                sender: "bot",
                text: res.reply || "I couldn't process that question. Please try asking in a different way.",
                sources: res.sources || [],
                provider: res.provider,
                setupNotice: res.setupNotice,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            };

            setMessages((prev) => [...prev, botMsg]);
        } catch (err) {
            console.error("Chatbot request failed:", err);
            setError(err.message || "Failed to reach FoodExpress Assistant. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const clearChat = () => {
        setMessages([
            {
                id: "welcome",
                sender: "bot",
                text: "Chat cleared! What would you like to know about FoodExpress?",
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            }
        ]);
        setError("");
    };

    // Format Markdown-like text (bold, bullets, line breaks)
    const renderFormattedText = (text) => {
        if (!text) return "";
        const lines = text.split("\n");
        return lines.map((line, idx) => {
            // Bullet line
            const isBullet = line.startsWith("• ") || line.startsWith("- ");
            const cleanLine = isBullet ? line.slice(2) : line;

            // Handle bolding **text**
            const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
            const formattedParts = parts.map((part, pIdx) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                    return <strong key={pIdx} className="font-semibold">{part.slice(2, -2)}</strong>;
                }
                return part;
            });

            return (
                <div key={idx} className={`${isBullet ? "flex items-start gap-1.5 ml-1" : ""} ${idx > 0 && !line ? "h-2" : ""}`}>
                    {isBullet && <span className="text-orange-500 font-bold">•</span>}
                    <span>{formattedParts}</span>
                </div>
            );
        });
    };

    if (location.pathname.startsWith("/admin")) {
        return null;
    }

    return (
        <aside aria-label="Customer Support Assistant" className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end">
            {/* ======================================================== */}
            {/* CHATBOT WINDOW                                           */}
            {/* ======================================================== */}
            {isOpen && (
                <div className="mb-3 w-[calc(100vw-32px)] sm:w-[390px] h-[520px] max-h-[80dvh] rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 text-white p-4 sm:p-5 flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-xl shadow-inner">
                                🍲
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-base leading-tight">FoodExpress Assistant</h3>
                                    <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" title="Online" />
                                </div>
                                <p className="text-[11px] text-orange-100 font-medium leading-tight mt-0.5">
                                    Ask about food, restaurants and reviews
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 text-white/80">
                            <button
                                onClick={clearChat}
                                title="Clear conversation"
                                className="w-8 h-8 rounded-xl hover:bg-white/15 flex items-center justify-center text-sm transition cursor-pointer"
                            >
                                🗑️
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                title="Close chat"
                                className="w-8 h-8 rounded-xl hover:bg-white/15 flex items-center justify-center text-lg font-bold transition cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-950/40 text-xs sm:text-sm">
                        {messages.map((m) => (
                            <div
                                key={m.id}
                                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed shadow-xs ${
                                        m.sender === "user"
                                            ? "bg-orange-500 text-white rounded-br-none"
                                            : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700/80 rounded-bl-none"
                                    }`}
                                >
                                    {renderFormattedText(m.text)}

                                    {/* Sources and Meta */}
                                    {m.sources && m.sources.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/50 flex flex-wrap gap-1.5 text-[10px] text-gray-400 dark:text-gray-400">
                                            {m.sources.map((src, i) => (
                                                <span
                                                    key={i}
                                                    className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700/60 px-2 py-0.5 rounded-full font-medium"
                                                >
                                                    {src.type === "reviews" && `⭐ ${src.count} Reviews (Avg ${src.averageRating}★)`}
                                                    {src.type === "food_ratings" && `🏆 ${src.count} Rated Dishes`}
                                                    {src.type === "food_search" && `🔍 Catalog Match`}
                                                    {src.type === "available_foods" && `🍽️ ${src.count} Available Dishes`}
                                                    {src.type === "restaurants" && `🏪 ${src.count} Restaurants`}
                                                    {src.type === "orders" && `📦 ${src.count} Recent Orders`}
                                                    {src.type === "general_overview" && `📊 Real Database Data`}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {m.setupNotice && (
                                        <p className="mt-2 text-[10px] italic text-amber-600 dark:text-amber-400 border-t border-amber-200/50 dark:border-amber-900/50 pt-1">
                                            ℹ️ {m.setupNotice}
                                        </p>
                                    )}
                                </div>
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 px-1 mt-1">
                                    {m.timestamp}
                                </span>
                            </div>
                        ))}

                        {/* Loading Bubble */}
                        {loading && (
                            <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-xs py-2 px-1">
                                <span className="inline-block animate-bounce">🍲</span>
                                <span className="font-medium animate-pulse">FoodExpress Assistant is typing...</span>
                            </div>
                        )}

                        {/* Error Banner */}
                        {error && (
                            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs flex items-center justify-between gap-2">
                                <span>{error}</span>
                                <button
                                    onClick={() => handleSend()}
                                    className="text-xs font-bold underline hover:text-red-700 cursor-pointer"
                                >
                                    Retry
                                </button>
                            </div>
                        )}

                        {/* Suggested Questions (only if chat just started) */}
                        {messages.length === 1 && !loading && (
                            <div className="pt-2">
                                <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                                    Suggested Questions
                                </p>
                                <div className="flex flex-col gap-1.5">
                                    {SUGGESTED_QUESTIONS.map((q, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSend(q)}
                                            className="text-left bg-white dark:bg-gray-800 hover:bg-orange-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs transition cursor-pointer flex items-center justify-between group shadow-2xs"
                                        >
                                            <span>{q}</span>
                                            <span className="text-orange-500 group-hover:translate-x-0.5 transition-transform text-xs">→</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Footer */}
                    <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                        <div className="flex items-center gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value.slice(0, 500))}
                                onKeyDown={handleKeyDown}
                                disabled={loading}
                                placeholder="Ask about food, ratings, reviews, orders..."
                                className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[42px]"
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={loading || !input.trim()}
                                aria-label="Send message"
                                className={`w-10 h-10 rounded-xl flex items-center justify-center text-white transition shadow-sm ${
                                    loading || !input.trim()
                                        ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed opacity-50"
                                        : "bg-orange-500 hover:bg-orange-600 active:scale-95 cursor-pointer"
                                }`}
                            >
                                ➔
                            </button>
                        </div>
                        <div className="flex items-center justify-between px-1 mt-1 text-[10px] text-gray-400">
                            <span>Answers grounded in MongoDB</span>
                            <span>{input.length}/500</span>
                        </div>
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* FLOATING TRIGGER BUTTON                                  */}
            {/* ======================================================== */}
            <button
                onClick={() => setIsOpen((prev) => !prev)}
                aria-label={isOpen ? "Close FoodExpress Assistant" : "Open FoodExpress Assistant"}
                className="group relative flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold p-3.5 sm:px-4 sm:py-3.5 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer min-w-[48px] min-h-[48px] justify-center"
            >
                <div className="w-6 h-6 flex items-center justify-center text-lg">
                    {isOpen ? "✕" : "💬"}
                </div>
                {!isOpen && (
                    <span className="hidden sm:inline text-sm font-semibold tracking-wide pr-1">
                        FoodExpress Assistant
                    </span>
                )}
            </button>
        </aside>
    );
}

