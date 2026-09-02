const express = require("express");

const {
    registerUser,
    loginUser,
    getMe,
    updateCustomerProfile
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// Public Routes
// ==========================================

router.post("/register", registerUser);
router.post("/login", loginUser);

// ==========================================
// Protected Customer Routes
// ==========================================

router.get("/me", protect, getMe);
router.put("/me", protect, updateCustomerProfile);
router.put("/profile", protect, updateCustomerProfile);

module.exports = router;