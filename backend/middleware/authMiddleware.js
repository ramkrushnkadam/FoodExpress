const jwt = require("jsonwebtoken");


// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================

const authMiddleware = (req, res, next) => {

    try {

        const authHeader = req.headers.authorization;

        // Check Authorization header
        if (!authHeader) {
            return res.status(401).json({
                message: "Authorization header is missing"
            });
        }


        // Expected:
        // Authorization: Bearer TOKEN

        const parts = authHeader.split(" ");

        if (
            parts.length !== 2 ||
            parts[0] !== "Bearer"
        ) {
            return res.status(401).json({
                message: "Invalid authorization format"
            });
        }


        const token = parts[1];


        // Verify JWT
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );


        // Save user information
        req.user = decoded;


        next();

    } catch (error) {

        console.error("Auth Middleware Error:", error.message);

        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};


module.exports = authMiddleware;