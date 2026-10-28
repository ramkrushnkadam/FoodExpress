const mongoose = require("mongoose");
const Review = require("../models/Review");
const Food = require("../models/Food");
const Restaurant = require("../models/Restaurant");
const Order = require("../models/Order");

/**
 * Sanitize untrusted customer text from reviews before sending to LLM.
 * Defends against prompt injection in user reviews.
 */
const sanitizeReviewSnippet = (text) => {
    if (!text || typeof text !== "string") return "";
    return text
        .replace(/[{}[\]<>`$]/g, "")
        .replace(/\b(system|assistant|ignore previous|ignore all|prompt|instructions)\b/gi, "")
        .trim()
        .slice(0, 150);
};

/**
 * Service & Review Analytics: Computes factual statistics and extracts themes.
 */
const getServiceReviewStats = async () => {
    try {
        const reviews = await Review.find().sort({ createdAt: -1 }).lean();
        const total = reviews.length;

        if (total === 0) {
            return {
                hasReviews: false,
                totalReviews: 0,
                message: "No customer reviews exist in the database yet."
            };
        }

        const validRatings = reviews.map((r) => Number(r.rating)).filter((r) => !isNaN(r) && r >= 1 && r <= 5);
        const sum = validRatings.reduce((a, b) => a + b, 0);
        const avgRating = validRatings.length > 0 ? Number((sum / validRatings.length).toFixed(1)) : 0;

        const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        for (const score of validRatings) {
            if (breakdown[score] !== undefined) breakdown[score]++;
        }

        const comments = reviews.filter((r) => r.comment && r.comment.trim());
        const positiveComments = [];
        const criticalComments = [];
        const deliveryComments = [];
        const foodQualityComments = [];

        const deliveryRegex = /deliver|fast|late|time|delay|speed|quick/i;
        const qualityRegex = /quality|taste|hot|cold|fresh|delicious|yummy|crisp|portion/i;

        for (const r of comments) {
            const clean = sanitizeReviewSnippet(r.comment);
            if (!clean) continue;

            const snippet = `"${clean}" (${r.rating}★)`;
            if (r.rating >= 4) {
                if (positiveComments.length < 5) positiveComments.push(snippet);
            } else if (r.rating <= 3) {
                if (criticalComments.length < 5) criticalComments.push(snippet);
            }

            if (deliveryRegex.test(clean) && deliveryComments.length < 4) {
                deliveryComments.push(snippet);
            }
            if (qualityRegex.test(clean) && foodQualityComments.length < 4) {
                foodQualityComments.push(snippet);
            }
        }

        return {
            hasReviews: true,
            totalReviews: total,
            averageRating: avgRating,
            ratingBreakdown: breakdown,
            samplePositiveComments: positiveComments,
            sampleCriticalComments: criticalComments,
            deliveryFeedback: deliveryComments,
            foodQualityFeedback: foodQualityComments
        };
    } catch (err) {
        console.error("Chatbot Review Stats Error:", err.message);
        return { hasReviews: false, totalReviews: 0, error: err.message };
    }
};

/**
 * Food Ratings Analytics: Distinguishes genuine customer-rated dishes from unrated ones.
 */
const getFoodRatingStats = async () => {
    try {
        const ratedFoods = await Food.find({ ratingCount: { $gt: 0 } })
            .sort({ rating: -1, ratingCount: -1 })
            .populate("restaurant", "name")
            .lean();

        const unratedCount = await Food.countDocuments({
            $or: [{ ratingCount: { $exists: false } }, { ratingCount: 0 }]
        });

        const formattedRatedDishes = ratedFoods.map((f) => ({
            name: f.name,
            price: `₹${f.price}`,
            averageRating: Number(f.rating).toFixed(1),
            reviewCount: f.ratingCount,
            restaurant: f.restaurant?.name || "FoodExpress Partner",
            availability: f.availability !== false ? "Available" : "Unavailable"
        }));

        return {
            ratedDishesCount: formattedRatedDishes.length,
            unratedDishesCount: unratedCount,
            topRatedDishes: formattedRatedDishes.slice(0, 6),
            allRatedDishes: formattedRatedDishes
        };
    } catch (err) {
        console.error("Chatbot Food Ratings Error:", err.message);
        return { ratedDishesCount: 0, topRatedDishes: [] };
    }
};

/**
 * Search dishes by name or keyword in MongoDB.
 */
const searchDishes = async (keyword) => {
    try {
        if (!keyword || typeof keyword !== "string" || !keyword.trim()) {
            return [];
        }
        const cleanWord = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const foods = await Food.find({
            name: { $regex: cleanWord, $options: "i" }
        })
            .populate("restaurant", "name active")
            .limit(5)
            .lean();

        return foods.map((f) => ({
            name: f.name,
            price: `₹${f.price}`,
            category: f.category,
            isAvailable: f.availability !== false,
            restaurantName: f.restaurant?.name || "FoodExpress Partner",
            rating: f.rating !== undefined ? Number(f.rating).toFixed(1) : "5.0",
            reviewCount: f.ratingCount || 0
        }));
    } catch (err) {
        console.error("Chatbot Search Dishes Error:", err.message);
        return [];
    }
};

/**
 * Retrieve currently available foods from catalog.
 */
const getAvailableFoods = async (limit = 8) => {
    try {
        const foods = await Food.find({ availability: true })
            .populate({ path: "restaurant", match: { active: true } })
            .limit(limit)
            .lean();

        return foods
            .filter((f) => f.restaurant)
            .map((f) => ({
                name: f.name,
                price: `₹${f.price}`,
                category: f.category,
                restaurant: f.restaurant?.name
            }));
    } catch (err) {
        console.error("Chatbot Available Foods Error:", err.message);
        return [];
    }
};

/**
 * Retrieve active restaurants.
 */
const getRestaurants = async () => {
    try {
        const list = await Restaurant.find({ active: true }).lean();
        return list.map((r) => ({
            name: r.name,
            category: r.category,
            location: r.location,
            deliveryTime: r.deliveryTime
        }));
    } catch (err) {
        console.error("Chatbot Restaurants Error:", err.message);
        return [];
    }
};

/**
 * Retrieve order history strictly belonging to authenticated user.
 */
const getUserOrders = async (userId) => {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return {
            authenticated: false,
            message: "Authentication required to view personal orders."
        };
    }

    try {
        const orders = await Order.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        const formatted = orders.map((o) => ({
            orderId: o._id.toString().slice(-8).toUpperCase(),
            totalAmount: `₹${o.totalAmount}`,
            status: o.status,
            orderDate: new Date(o.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }),
            items: (o.items || []).map((it) => `${it.name} (x${it.quantity})`).join(", ")
        }));

        return {
            authenticated: true,
            totalOrders: orders.length,
            recentOrders: formatted
        };
    } catch (err) {
        console.error("Chatbot Orders Error:", err.message);
        return {
            authenticated: true,
            error: err.message,
            recentOrders: []
        };
    }
};

/**
 * Gathers relevant database evidence based on user message.
 */
const gatherEvidence = async (message, userId) => {
    const q = (message || "").toLowerCase().trim();
    const evidence = {};
    const sources = [];

    // Intent flags
    const isOrderQuery = /\b(orders?|my orders?|order status|track|where is my order|past orders?|previous orders?|recent orders?)\b/i.test(q);
    const isRestaurantQuery = /\b(which restaurant|which restaurants|restaurants|places to eat|outlets|where can i order)\b/i.test(q);
    const isFoodRatingQuery = /\b(best|top|popular|highest|rated|dishes with the best|loved)\b/i.test(q) && !/price of|cost of/i.test(q);
    const isServiceQuery = /\b(service|feedback|review|reviews|rating|customer|customers say|think|opinion|experience|satisfaction|complaint|complaints|quality)\b/i.test(q);
    const isDeliveryQuery = /\b(delivery|fast|speed|late|delay|deliveries)\b/i.test(q);
    const isGeneralAvailabilityQuery = /\b(what food is available|available today|what is available|what's available|dishes are available|what food)\b/i.test(q);

    // 1. User Orders (highest priority for personal inquiries)
    if (isOrderQuery) {
        evidence.userOrders = await getUserOrders(userId);
        sources.push({
            type: "orders",
            authenticated: !!userId,
            count: evidence.userOrders.recentOrders?.length || 0
        });
        return { evidence, sources };
    }

    // 2. Specific Dish Search (e.g. "price of Cold Coffee", "is Ukdiche Modak available", "how much is Ice Cream")
    const isSpecificDishQuery = /\b(price of|cost of|how much is|how much for|is (.+) available|do you have|can i get)\b/i.test(q);
    let candidateDish = "";

    if (isSpecificDishQuery) {
        const dishMatch =
            q.match(/(?:price of|cost of|how much is|how much for|do you have|can i get)\s+([a-zA-Z0-9\s]+?)(?:\s+available|\s+in menu|\?|$)/i) ||
            q.match(/is\s+([a-zA-Z0-9\s]+?)\s+(?:available|in menu|\?|$)/i);
        if (dishMatch && dishMatch[1]) {
            candidateDish = dishMatch[1].trim();
        }
    } else if (!isServiceQuery && !isRestaurantQuery && !isFoodRatingQuery && !isGeneralAvailabilityQuery) {
        const stopWords = /\b(what|is|the|price|cost|of|how|much|does|are|any|dishes|dish|available|today|can|i|get|have|food|foodexpress|menu)\b/gi;
        const cleaned = q.replace(stopWords, "").replace(/[^a-zA-Z0-9\s]/g, "").trim();
        if (cleaned.length >= 3 && cleaned.split(/\s+/).length <= 4) {
            candidateDish = cleaned;
        }
    }

    if (candidateDish && candidateDish.length >= 2) {
        const found = await searchDishes(candidateDish);
        evidence.dishSearchResults = {
            searchedTerm: candidateDish,
            results: found
        };
        sources.push({
            type: "food_search",
            query: candidateDish,
            matchCount: found.length
        });
    }

    // 3. Service Feedback & Customer Reviews
    if (isServiceQuery || isDeliveryQuery) {
        evidence.serviceReviews = await getServiceReviewStats();
        sources.push({
            type: "reviews",
            count: evidence.serviceReviews.totalReviews || 0,
            averageRating: evidence.serviceReviews.averageRating || 0
        });
    }

    // 4. Food Ratings & Best-Rated Dishes
    if (isFoodRatingQuery) {
        evidence.foodRatings = await getFoodRatingStats();
        sources.push({
            type: "food_ratings",
            count: evidence.foodRatings.ratedDishesCount || 0
        });
    }

    // 5. Restaurants
    if (isRestaurantQuery) {
        evidence.restaurants = await getRestaurants();
        sources.push({
            type: "restaurants",
            count: evidence.restaurants.length
        });
    }

    // 6. General Availability
    if (isGeneralAvailabilityQuery && !evidence.dishSearchResults) {
        evidence.availableFoods = await getAvailableFoods(8);
        sources.push({
            type: "available_foods",
            count: evidence.availableFoods.length
        });
    }

    // Default overview if nothing matched
    if (Object.keys(evidence).length === 0) {
        const [reviews, foods, restaurants] = await Promise.all([
            getServiceReviewStats(),
            getAvailableFoods(5),
            getRestaurants()
        ]);
        evidence.serviceReviews = reviews;
        evidence.availableFoods = foods;
        evidence.restaurants = restaurants;
        sources.push({ type: "general_overview" });
    }

    return { evidence, sources };
};

module.exports = {
    getServiceReviewStats,
    getFoodRatingStats,
    searchDishes,
    getAvailableFoods,
    getRestaurants,
    getUserOrders,
    gatherEvidence
};
