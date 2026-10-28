const Food = require("../models/Food");
const Review = require("../models/Review");
const Order = require("../models/Order");

/**
 * Calculates rating and ratingCount for all foods based on customer reviews
 * including both direct dish reviews and feedback rating session reviews (linked via orders).
 * Updates each Food document in the MongoDB database where a rating is available,
 * and maintains 5.0 (0 reviews) default for foods without reviews.
 */
async function computeAndUpdateFoodRatings() {
    try {
        const reviews = await Review.find().populate("order", "items").lean();
        const foodRatings = new Map();

        for (const r of reviews) {
            if (!r.rating) continue;
            const score = Number(r.rating);
            if (isNaN(score) || score < 1 || score > 5) continue;

            if (r.food) {
                const fid = String(r.food);
                if (!foodRatings.has(fid)) foodRatings.set(fid, []);
                foodRatings.get(fid).push(score);
            } else if (r.order && Array.isArray(r.order.items)) {
                // Collect unique foodIds in order to prevent multiple quantities from inflating review count
                const uniqueFids = new Set(
                    r.order.items
                        .map((it) => (it.foodId ? String(it.foodId) : null))
                        .filter(Boolean)
                );
                for (const fid of uniqueFids) {
                    if (!foodRatings.has(fid)) foodRatings.set(fid, []);
                    foodRatings.get(fid).push(score);
                }
            }
        }

        const foods = await Food.find();
        const ratingsMap = new Map();
        const updates = [];

        for (const food of foods) {
            const fid = String(food._id);
            const scores = foodRatings.get(fid);

            let rating = 5.0;
            let ratingCount = 0;

            if (scores && scores.length > 0) {
                const sum = scores.reduce((a, b) => a + b, 0);
                rating = Number((sum / scores.length).toFixed(1));
                ratingCount = scores.length;
            }

            ratingsMap.set(fid, { rating, ratingCount });

            // Update Food document in MongoDB database
            if (food.rating !== rating || food.ratingCount !== ratingCount) {
                food.rating = rating;
                food.ratingCount = ratingCount;
                updates.push(food.save());
            }
        }

        if (updates.length > 0) {
            await Promise.all(updates);
        }

        return ratingsMap;
    } catch (err) {
        console.error("Error computing/updating food ratings:", err.message);
        return new Map();
    }
}

module.exports = {
    computeAndUpdateFoodRatings
};
