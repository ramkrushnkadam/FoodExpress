const express = require("express");
const router = express.Router();

const {
    createReview,
    getMyReviews,
    getEligibleOrders,
    getPublicReviews,
    getOrderReview
} = require("../controllers/reviewController");

const authMiddleware = require("../middleware/authMiddleware");

// ==========================================
// PUBLIC REVIEWS (No auth required)
// ==========================================
router.get("/public", getPublicReviews);

// ==========================================
// PROTECTED CUSTOMER REVIEWS (Auth required)
// ==========================================
router.post("/", authMiddleware, createReview);
router.get("/my-reviews", authMiddleware, getMyReviews);
router.get("/eligible-orders", authMiddleware, getEligibleOrders);
router.get("/order/:orderId", authMiddleware, getOrderReview);

module.exports = router;

