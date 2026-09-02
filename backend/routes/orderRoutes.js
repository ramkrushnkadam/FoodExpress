const express = require("express");

const router = express.Router();

const {
    createOrder,
    getMyOrders,
    getOrderById,
    updateOrderStatus
} = require("../controllers/orderController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// ==========================================
// CREATE ORDER (POST /api/orders)
// ==========================================
router.post("/", authMiddleware, createOrder);

// ==========================================
// GET MY ORDERS (GET /api/orders and GET /api/orders/my-orders)
// ==========================================
router.get("/", authMiddleware, getMyOrders);
router.get("/my-orders", authMiddleware, getMyOrders);

// ==========================================
// GET SINGLE ORDER (GET /api/orders/:id)
// ==========================================
router.get("/:id", authMiddleware, getOrderById);

// ==========================================
// UPDATE ORDER STATUS (PUT /api/orders/:id/status - Admin only)
// ==========================================
router.put("/:id/status", authMiddleware, adminMiddleware, updateOrderStatus);

module.exports = router;