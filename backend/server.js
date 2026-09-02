const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");
const catalogRoutes = require("./routes/catalogRoutes");

const app = express();

const allowedOrigins = [
    process.env.CLIENT_URL,
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174"
].filter(Boolean);

// ==========================================
// Connect MongoDB
// ==========================================

connectDB();

// ==========================================
// Security & Utility Middleware
// ==========================================

// Security headers
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
});

app.use(
    cors({
        origin(origin, callback) {
            // Requests made without an Origin header (for example Postman/cURL) are allowed
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error("Origin is not allowed by CORS"));
        },
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true
    })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// In-memory rate limiting for auth endpoints (prevents brute-force)
const authAttempts = new Map();
const authRateLimiter = (req, res, next) => {
    const ip = req.ip || req.connection?.remoteAddress || "client";
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 50;

    const record = authAttempts.get(ip) || { count: 0, resetTime: now + windowMs };
    if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + windowMs;
    } else {
        record.count += 1;
    }
    authAttempts.set(ip, record);

    if (record.count > maxAttempts) {
        return res.status(429).json({
            message: "Too many attempts. Please try again later."
        });
    }
    next();
};

app.use("/api/auth/login", authRateLimiter);
app.use("/api/auth/register", authRateLimiter);
app.use("/api/admin/login", authRateLimiter);

// ==========================================
// Routes
// ==========================================

app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", catalogRoutes);

// ==========================================
// Test Route
// ==========================================

app.get("/", (req, res) => {
    res.json({
        message: "Food Ordering Backend is running 🚀"
    });
});

// ==========================================
// 404 & Global Error Handling
// ==========================================

app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) {
        return res.status(404).json({ message: `API route ${req.method} ${req.path} not found` });
    }
    next();
});

app.use((err, req, res, next) => {
    const status = err.status || (err.name === "ValidationError" ? 400 : 500);
    const message = err.message || "Internal server error";

    if (status === 500) {
        console.error("Internal Server Error:", err.message);
    }

    res.status(status).json({
        message: status === 500 && process.env.NODE_ENV === "production" ? "Internal server error" : message
    });
});

// ==========================================
// Start Server
// ==========================================

const PORT = process.env.PORT || 5000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
