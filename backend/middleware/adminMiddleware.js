const User = require("../models/User");

const adminMiddleware = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select("role");

        if (!user) {
            return res.status(401).json({ message: "User no longer exists" });
        }

        if (user.role !== "admin") {
            return res.status(403).json({ message: "Admin access is required" });
        }

        req.user.role = user.role;
        next();
    } catch (error) {
        return res.status(500).json({ message: "Unable to authorize admin access" });
    }
};

module.exports = adminMiddleware;
