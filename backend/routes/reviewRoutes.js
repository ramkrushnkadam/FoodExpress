const express = require("express");
const router = express.Router();

const {
    uploadReviewImage,
    createReview,
    getMyReviews,
    getEligibleOrders,
    getFoodReviews,
    getFoodReviewEligibility,
    getPublicReviews,
    getOrderReview
} = require("../controllers/reviewController");

const authMiddleware = require("../middleware/authMiddleware");

// ==========================================
// PUBLIC REVIEWS (No auth required)
// ==========================================
router.get("/public", getPublicReviews);
router.get("/food/:foodId", getFoodReviews);

// ==========================================
// PROTECTED CUSTOMER REVIEWS (Auth required)
// ==========================================
router.post("/upload", authMiddleware, uploadReviewImage);
router.get("/food/:foodId/eligibility", authMiddleware, getFoodReviewEligibility);
router.post("/", authMiddleware, createReview);
router.get("/my-reviews", authMiddleware, getMyReviews);
router.get("/eligible-orders", authMiddleware, getEligibleOrders);
router.get("/order/:orderId", authMiddleware, getOrderReview);

module.exports = router;
