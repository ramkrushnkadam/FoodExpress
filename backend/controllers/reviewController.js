const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const Review = require("../models/Review");
const Order = require("../models/Order");
const Food = require("../models/Food");
const { computeAndUpdateFoodRatings } = require("../utils/ratingUtils");

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
// UPLOAD REVIEW IMAGE (POST /api/reviews/upload) - Protected
// ==========================================
const uploadReviewImage = async (req, res) => {
    try {
        const { image, filename } = req.body;
        if (!image || typeof image !== "string") {
            return res.status(400).json({ message: "Image data is required" });
        }

        // Extract base64 payload
        const match = image.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i);
        let rawBase64 = image;
        let mimeTypeHint = "";

        if (match) {
            mimeTypeHint = match[1].toLowerCase();
            rawBase64 = match[2];
        }

        const buffer = Buffer.from(rawBase64, "base64");

        // Validate max 5 MB
        const MAX_SIZE = 5 * 1024 * 1024;
        if (buffer.length > MAX_SIZE) {
            return res.status(400).json({ message: "Image size exceeds maximum limit of 5 MB." });
        }

        if (buffer.length < 12) {
            return res.status(400).json({ message: "Invalid image file format." });
        }

        // Validate magic bytes
        let extension = "";
        const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
        const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
        const isWebp =
            buffer.toString("ascii", 0, 4) === "RIFF" &&
            buffer.toString("ascii", 8, 12) === "WEBP";

        if (isJpeg) extension = "jpg";
        else if (isPng) extension = "png";
        else if (isWebp) extension = "webp";
        else {
            return res.status(400).json({
                message: "Invalid file format. Only JPG, JPEG, PNG, and WebP images are allowed."
            });
        }

        // Ensure upload directory exists
        const uploadDir = path.join(__dirname, "..", "uploads", "reviews");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Generate safe unique filename
        const safeName = `review_${Date.now()}_${crypto.randomBytes(6).toString("hex")}.${extension}`;
        const filePath = path.join(uploadDir, safeName);

        fs.writeFileSync(filePath, buffer);

        const relativeUrl = `/uploads/reviews/${safeName}`;

        try {
            await computeAndUpdateFoodRatings();
        } catch (updateErr) {
            console.error("Failed to update food ratings:", updateErr.message);
        }

        return res.status(201).json({
            message: "Image uploaded successfully",
            url: relativeUrl
        });
    } catch (error) {
        console.error("Upload Review Image Error:", error.message);
        return res.status(500).json({
            message: "Failed to upload image",
            error: error.message
        });
    }
};

// ==========================================
// CREATE REVIEW (POST /api/reviews) - Protected
// ==========================================
const createReview = async (req, res) => {
    try {
        const { orderId, rating, comment, foodId, images } = req.body;

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

        // Validate images (max 3, must be valid relative paths)
        let validatedImages = [];
        if (Array.isArray(images)) {
            if (images.length > 3) {
                return res.status(400).json({ message: "You can upload a maximum of 3 images per review." });
            }
            validatedImages = images
                .filter((img) => typeof img === "string" && img.startsWith("/uploads/reviews/"))
                .slice(0, 3);
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

        // 5. If foodId is specified, verify it belongs to this order
        let targetFoodId = null;
        let foodName = "";
        let restaurantId = null;
        let restaurantName = "FoodExpress Partner";

        if (foodId) {
            if (!mongoose.Types.ObjectId.isValid(foodId)) {
                return res.status(400).json({ message: "Invalid Food ID provided." });
            }

            const itemInOrder = order.items.find((it) => String(it.foodId) === String(foodId));
            if (!itemInOrder) {
                return res.status(400).json({ message: "The specified food item does not belong to this order." });
            }

            targetFoodId = foodId;
            foodName = itemInOrder.name;

            const foodDoc = await Food.findById(foodId).populate("restaurant");
            if (foodDoc && foodDoc.restaurant) {
                restaurantId = foodDoc.restaurant._id;
                restaurantName = foodDoc.restaurant.name || restaurantName;
            }
        } else {
            // Resolve restaurant from first item
            if (Array.isArray(order.items) && order.items.length > 0) {
                if (order.items.length === 1 && order.items[0].foodId && mongoose.Types.ObjectId.isValid(order.items[0].foodId)) {
                    targetFoodId = order.items[0].foodId;
                    foodName = order.items[0].name || "";
                }
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
        }

        // 6. Check duplicate review for this order/dish combination
        const duplicateQuery = {
            order: order._id,
            food: targetFoodId
        };
        const existingReview = await Review.findOne(duplicateQuery);
        if (existingReview) {
            return res.status(400).json({
                message: targetFoodId
                    ? "You have already reviewed this dish for this order."
                    : "This order has already been reviewed."
            });
        }

        // 7. Save Review in MongoDB
        const newReview = await Review.create({
            user: req.user.id,
            order: order._id,
            food: targetFoodId,
            foodName,
            restaurant: restaurantId,
            restaurantName,
            rating: numericRating,
            comment: trimmedComment,
            images: validatedImages
        });

        return res.status(201).json({
            message: "Thank you! Your review has been submitted.",
            review: newReview
        });
    } catch (error) {
        console.error("Create Review Error:", error.message);
        if (error.code === 11000) {
            return res.status(400).json({ message: "This review has already been submitted." });
        }
        return res.status(500).json({
            message: "Failed to submit review",
            error: error.message
        });
    }
};

// ==========================================
// GET MY REVIEWS (GET /api/reviews/my-reviews) - Protected
// Supports Date Range and Month Filters
// ==========================================
const getMyReviews = async (req, res) => {
    try {
        const { filterType, startDate, endDate, month, year } = req.query;
        const query = { user: req.user.id };

        // Date Range filtering
        if (filterType === "date_range" && startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).json({ message: "Invalid date format for date range filter." });
            }
            if (start > end) {
                return res.status(400).json({ message: "Start date cannot be after end date." });
            }

            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            query.createdAt = { $gte: start, $lte: end };
        }
        // Month & Year filtering
        else if (filterType === "month" && month && year) {
            const m = parseInt(month, 10);
            const y = parseInt(year, 10);

            if (isNaN(m) || m < 1 || m > 12 || isNaN(y) || y < 2000 || y > 2100) {
                return res.status(400).json({ message: "Invalid month or year filter." });
            }

            const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
            const end = new Date(y, m, 0, 23, 59, 59, 999);
            query.createdAt = { $gte: start, $lte: end };
        }

        const reviews = await Review.find(query)
            .sort({ createdAt: -1 })
            .populate("restaurant", "name")
            .populate("food", "name image")
            .populate("order", "items totalAmount status createdAt");

        const formatted = reviews.map((r) => ({
            _id: r._id,
            orderId: r.order?._id || r.order,
            foodId: r.food?._id || r.food,
            foodName: r.foodName || r.food?.name || "",
            restaurantName: r.restaurant?.name || r.restaurantName || "FoodExpress Partner",
            rating: r.rating,
            comment: r.comment || "",
            images: Array.isArray(r.images) ? r.images : [],
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
        const orders = await Order.find({
            user: req.user.id,
            status: { $in: ["Delivered", "Completed"] }
        }).sort({ createdAt: -1 });

        const userReviews = await Review.find({ user: req.user.id })
            .select("order food rating comment createdAt restaurantName images foodName");

        // Map orderId -> list of reviews
        const reviewMap = new Map();
        for (const rev of userReviews) {
            const key = rev.order.toString();
            if (!reviewMap.has(key)) {
                reviewMap.set(key, []);
            }
            reviewMap.get(key).push(rev);
        }

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
            const revs = reviewMap.get(order._id.toString()) || [];
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

            const isOrderLevelReviewed = revs.some((r) => !r.food);
            const reviewedFoodIds = new Set(revs.filter((r) => r.food).map((r) => r.food.toString()));

            const itemsWithReviewStatus = (order.items || []).map((it) => ({
                ...it.toObject ? it.toObject() : it,
                isReviewed: reviewedFoodIds.has(String(it.foodId))
            }));

            const isFullyReviewed =
                isOrderLevelReviewed ||
                (itemsWithReviewStatus.length > 0 && itemsWithReviewStatus.every((it) => it.isReviewed));

            const primaryReview = revs[0] || null;

            return {
                _id: order._id,
                orderDate: order.createdAt,
                totalAmount: order.totalAmount,
                status: order.status,
                items: itemsWithReviewStatus,
                restaurantName,
                isReviewed: isFullyReviewed,
                review: primaryReview
                    ? {
                          rating: primaryReview.rating,
                          comment: primaryReview.comment,
                          createdAt: primaryReview.createdAt,
                          images: primaryReview.images || []
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
// GET REVIEWS FOR A SPECIFIC FOOD (GET /api/reviews/food/:foodId) - Public
// ==========================================
const getFoodReviews = async (req, res) => {
    try {
        const { foodId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(foodId)) {
            return res.status(400).json({ message: "Invalid Food ID" });
        }

        const matchingOrders = await Order.find({ "items.foodId": String(foodId) }).select("_id");
        const orderIds = matchingOrders.map((o) => o._id);

        const reviews = await Review.find({
            $or: [
                { food: foodId },
                { order: { $in: orderIds } }
            ]
        })
            .sort({ createdAt: -1 })
            .populate("user", "name")
            .populate("restaurant", "name");

        const formatted = reviews.map((r) => ({
            id: r._id,
            rating: r.rating,
            comment: r.comment || "",
            images: Array.isArray(r.images) ? r.images : [],
            customerDisplayName: formatSafeDisplayName(r.user?.name),
            restaurantName: r.restaurant?.name || r.restaurantName || "FoodExpress Partner",
            createdAt: r.createdAt
        }));

        const total = formatted.length;
        const avg = total > 0 ? Number((formatted.reduce((s, r) => s + r.rating, 0) / total).toFixed(1)) : 5.0;

        return res.status(200).json({
            foodId,
            averageRating: avg,
            ratingCount: total,
            reviews: formatted
        });
    } catch (error) {
        console.error("Get Food Reviews Error:", error.message);
        return res.status(500).json({
            message: "Failed to fetch food reviews",
            error: error.message
        });
    }
};

// ==========================================
// CHECK FOOD REVIEW ELIGIBILITY (GET /api/reviews/food/:foodId/eligibility) - Protected
// ==========================================
const getFoodReviewEligibility = async (req, res) => {
    try {
        const { foodId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(foodId)) {
            return res.status(400).json({ message: "Invalid Food ID" });
        }

        // Find delivered/completed orders containing this food item
        const eligibleOrders = await Order.find({
            user: req.user.id,
            status: { $in: ["Delivered", "Completed"] },
            "items.foodId": String(foodId)
        }).sort({ createdAt: -1 });

        if (eligibleOrders.length === 0) {
            return res.status(200).json({
                eligible: false,
                reason: "not_ordered",
                message: "You can review this dish after placing and receiving an order containing it."
            });
        }

        // Find which orders are not yet reviewed for this food item
        const userReviews = await Review.find({
            user: req.user.id,
            food: foodId
        });

        const reviewedOrderIds = new Set(userReviews.map((r) => r.order.toString()));
        const unreviewedOrder = eligibleOrders.find((o) => !reviewedOrderIds.has(o._id.toString()));

        if (!unreviewedOrder) {
            return res.status(200).json({
                eligible: false,
                reason: "already_reviewed",
                message: "You have already reviewed this dish for your previous order(s)."
            });
        }

        return res.status(200).json({
            eligible: true,
            orderId: unreviewedOrder._id,
            orderNumber: unreviewedOrder._id.toString().slice(-8).toUpperCase(),
            message: "You are eligible to review this dish."
        });
    } catch (error) {
        console.error("Check Food Review Eligibility Error:", error.message);
        return res.status(500).json({
            message: "Failed to check review eligibility",
            error: error.message
        });
    }
};

// ==========================================
// GET PUBLIC REVIEWS (GET /api/reviews/public) - PUBLIC (NO AUTH)
// ==========================================
const getPublicReviews = async (req, res) => {
    try {
        const reviews = await Review.find()
            .sort({ createdAt: -1 })
            .limit(6)
            .populate("user", "name")
            .populate("restaurant", "name");

        const publicList = reviews.map((r) => ({
            id: r._id,
            rating: r.rating,
            comment: r.comment || "",
            foodName: r.foodName || "",
            images: Array.isArray(r.images) ? r.images : [],
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
                images: Array.isArray(review.images) ? review.images : [],
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
    uploadReviewImage,
    createReview,
    getMyReviews,
    getEligibleOrders,
    getFoodReviews,
    getFoodReviewEligibility,
    getPublicReviews,
    getOrderReview
};
