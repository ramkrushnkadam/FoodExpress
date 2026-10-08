const mongoose = require("mongoose");
const Review = require("../models/Review");
const Order = require("../models/Order");
const Food = require("../models/Food");

/**
 * Format a customer's full name to a privacy-safe display name.
 * Examples:
 * - "Ramkrushn Sharad Kadam" -> "Ramkrushn K."
 * - "Rahul Kumar" -> "Rahul K."
 * - "Priya" -> "Priya"
 * - "" / undefined -> "FoodExpress Customer"
 */
const formatSafeDisplayName = (fullName) => {
    if (!fullName || typeof fullName !== "string") {
        return "FoodExpress Customer";
    }
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
        return "FoodExpress Customer";
    }
    if (parts.length === 1) {
        return parts[0];
    }
    const firstName = parts[0];
    const lastInitial = parts[parts.length - 1][0].toUpperCase();
    return `${firstName} ${lastInitial}.`;
};

// ==========================================
// CREATE REVIEW (POST /api/reviews) - Protected
// ==========================================
const createReview = async (req, res) => {
    try {
        const { orderId, rating, comment } = req.body;

        // 1. Validation
        if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: "A valid Order ID is required." });
        }

        const numericRating = Number(rating);
        if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
            return res.status(400).json({ message: "Rating is required and must be between 1 and 5 stars." });
        }

        const trimmedComment = typeof comment === "string" ? comment.trim() : "";
        if (trimmedComment.length > 500) {
            return res.status(400).json({ message: "Review comment cannot exceed 500 characters." });
        }

        // 2. Fetch Order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }

        // 3. Verify Order belongs to logged-in user
        if (order.user.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: "You are not authorized to review this order." });
        }

        // 4. Verify Order is completed/delivered
        const eligibleStatuses = ["Delivered", "Completed"];
        if (!eligibleStatuses.includes(order.status)) {
            return res.status(400).json({
                message: `Only delivered or completed orders can be reviewed. Current status: ${order.status}`
            });
        }

        // 5. Check if already reviewed
        const existingReview = await Review.findOne({ order: order._id });
        if (existingReview) {
            return res.status(400).json({ message: "This order has already been reviewed." });
        }

        // 6. Resolve restaurant for this order
        let restaurantId = null;
        let restaurantName = "FoodExpress Partner";

        if (Array.isArray(order.items) && order.items.length > 0) {
            // Find food item to get restaurant reference
            for (const item of order.items) {
                if (item.foodId && mongoose.Types.ObjectId.isValid(item.foodId)) {
                    const foodDoc = await Food.findById(item.foodId).populate("restaurant");
                    if (foodDoc && foodDoc.restaurant) {
                        restaurantId = foodDoc.restaurant._id;
                        restaurantName = foodDoc.restaurant.name || restaurantName;
                        break;
                    }
                }
            }
        }

        // 7. Save Review in MongoDB
        const newReview = await Review.create({
            user: req.user.id,
            order: order._id,
            restaurant: restaurantId,
            restaurantName,
            rating: numericRating,
            comment: trimmedComment
        });

        return res.status(201).json({
            message: "Thank you! Your review has been submitted.",
            review: newReview
        });
    } catch (error) {
        console.error("Create Review Error:", error.message);
        if (error.code === 11000) {
            return res.status(400).json({ message: "This order has already been reviewed." });
        }
        return res.status(500).json({
            message: "Failed to submit review",
            error: error.message
        });
    }
};

// ==========================================
// GET MY REVIEWS (GET /api/reviews/my-reviews) - Protected
// ==========================================
const getMyReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .populate("restaurant", "name")
            .populate("order", "items totalAmount status createdAt");

        const formatted = reviews.map((r) => ({
            _id: r._id,
            orderId: r.order?._id || r.order,
            restaurantName: r.restaurant?.name || r.restaurantName || "FoodExpress Partner",
            rating: r.rating,
            comment: r.comment || "",
            createdAt: r.createdAt,
            orderDate: r.order?.createdAt || r.createdAt,
            items: r.order?.items || []
        }));

        return res.status(200).json({
            message: "My reviews fetched successfully",
            reviews: formatted
        });
    } catch (error) {
        console.error("Get My Reviews Error:", error.message);
        return res.status(500).json({
            message: "Failed to fetch your reviews",
            error: error.message
        });
    }
};

// ==========================================
// GET ELIGIBLE ORDERS (GET /api/reviews/eligible-orders) - Protected
// ==========================================
const getEligibleOrders = async (req, res) => {
    try {
        // Fetch delivered/completed orders of logged-in user
        const orders = await Order.find({
            user: req.user.id,
            status: { $in: ["Delivered", "Completed"] }
        }).sort({ createdAt: -1 });

        // Fetch user's existing reviews to identify already reviewed orders
        const userReviews = await Review.find({ user: req.user.id })
            .select("order rating comment createdAt restaurantName");

        const reviewMap = new Map();
        for (const rev of userReviews) {
            reviewMap.set(rev.order.toString(), rev);
        }

        // Collect all distinct foodIds to resolve restaurant names in batch
        const foodIds = [];
        for (const order of orders) {
            if (Array.isArray(order.items)) {
                for (const item of order.items) {
                    if (item.foodId && mongoose.Types.ObjectId.isValid(item.foodId)) {
                        foodIds.push(item.foodId);
                    }
                }
            }
        }

        const foods = await Food.find({ _id: { $in: foodIds } }).populate("restaurant", "name");
        const foodRestaurantMap = new Map();
        for (const food of foods) {
            if (food.restaurant) {
                foodRestaurantMap.set(food._id.toString(), food.restaurant.name);
            }
        }

        const eligibleOrders = orders.map((order) => {
            const rev = reviewMap.get(order._id.toString());
            let restaurantName = "FoodExpress Partner";

            if (Array.isArray(order.items)) {
                for (const item of order.items) {
                    const rName = foodRestaurantMap.get(String(item.foodId));
                    if (rName) {
                        restaurantName = rName;
                        break;
                    }
                }
            }

            return {
                _id: order._id,
                orderDate: order.createdAt,
                totalAmount: order.totalAmount,
                status: order.status,
                items: order.items || [],
                restaurantName,
                isReviewed: Boolean(rev),
                review: rev
                    ? {
                          rating: rev.rating,
                          comment: rev.comment,
                          createdAt: rev.createdAt
                      }
                    : null
            };
        });

        return res.status(200).json({
            message: "Eligible orders fetched successfully",
            orders: eligibleOrders
        });
    } catch (error) {
        console.error("Get Eligible Orders Error:", error.message);
        return res.status(500).json({
            message: "Failed to fetch eligible orders",
            error: error.message
        });
    }
};

// ==========================================
// GET PUBLIC REVIEWS (GET /api/reviews/public) - PUBLIC (NO AUTH)
// ==========================================
const getPublicReviews = async (req, res) => {
    try {
        // Limit to 6 newest reviews
        const reviews = await Review.find()
            .sort({ createdAt: -1 })
            .limit(6)
            .populate("user", "name")
            .populate("restaurant", "name");

        // Format safely without exposing ANY sensitive user data (email, phone, address, etc.)
        const publicList = reviews.map((r) => ({
            id: r._id,
            rating: r.rating,
            comment: r.comment || "",
            restaurantName: r.restaurant?.name || r.restaurantName || "FoodExpress Partner",
            customerDisplayName: formatSafeDisplayName(r.user?.name),
            createdAt: r.createdAt
        }));

        return res.status(200).json({
            message: "Public reviews fetched successfully",
            reviews: publicList
        });
    } catch (error) {
        console.error("Get Public Reviews Error:", error.message);
        return res.status(500).json({
            message: "Failed to fetch public reviews",
            error: error.message
        });
    }
};

// ==========================================
// GET REVIEW FOR SPECIFIC ORDER (GET /api/reviews/order/:orderId) - Protected
// ==========================================
const getOrderReview = async (req, res) => {
    try {
        const { orderId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: "Invalid Order ID." });
        }

        const review = await Review.findOne({
            order: orderId,
            user: req.user.id
        }).populate("restaurant", "name");

        if (!review) {
            return res.status(404).json({ message: "No review found for this order." });
        }

        return res.status(200).json({
            message: "Review fetched successfully",
            review: {
                id: review._id,
                rating: review.rating,
                comment: review.comment,
                restaurantName: review.restaurant?.name || review.restaurantName || "FoodExpress Partner",
                createdAt: review.createdAt
            }
        });
    } catch (error) {
        console.error("Get Order Review Error:", error.message);
        return res.status(500).json({
            message: "Failed to fetch order review",
            error: error.message
        });
    }
};

module.exports = {
    createReview,
    getMyReviews,
    getEligibleOrders,
    getPublicReviews,
    getOrderReview
};

