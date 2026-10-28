const jwt = require("jsonwebtoken");

/**
 * Optional Authentication Middleware.
 * Decodes JWT if provided, but does not block unauthenticated requests.
 * Used for public chatbot access while supporting authenticated order queries.
 */
const optionalAuthMiddleware = (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            req.user = null;
            return next();
        }

        const parts = authHeader.split(" ");
        if (parts.length === 2 && parts[0] === "Bearer") {
            const decoded = jwt.verify(parts[1], process.env.JWT_SECRET);
            req.user = decoded;
        } else {
            req.user = null;
        }
    } catch {
        req.user = null;
    }
    next();
};

module.exports = optionalAuthMiddleware;

