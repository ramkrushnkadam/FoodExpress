const mongoose = require("mongoose");
const Food = require("../models/Food");
const Restaurant = require("../models/Restaurant");
const { computeAndUpdateFoodRatings } = require("../utils/ratingUtils");

const objectId = (id) => mongoose.Types.ObjectId.isValid(id);

const listRestaurants = async (_req, res) => {
    try {
        const restaurants = await Restaurant.find({ active: true }).sort({ createdAt: -1 });
        res.json({ restaurants });
    } catch (error) {
        console.error("List restaurants error:", error.message);
        res.status(500).json({ message: "Unable to load restaurants" });
    }
};

const getRestaurant = async (req, res) => {
    try {
        if (!objectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid restaurant id" });
        }
        const restaurant = await Restaurant.findOne({ _id: req.params.id, active: true });
        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant not found" });
        }
        res.json({ restaurant });
    } catch (error) {
        console.error("Get restaurant error:", error.message);
        res.status(500).json({ message: "Unable to load restaurant" });
    }
};

const listFoods = async (req, res) => {
    try {
        const filter = {};
        if (req.query.restaurant) {
            if (!objectId(req.query.restaurant)) {
                return res.status(400).json({ message: "Invalid restaurant filter id" });
            }
            filter.restaurant = req.query.restaurant;
        }

        // Available foods first, then by newest
        const [foods, ratingsMap] = await Promise.all([
            Food.find(filter)
                .populate({ path: "restaurant", match: { active: true } })
                .sort({ availability: -1, createdAt: -1 }),
            computeAndUpdateFoodRatings()
        ]);

        // Filter out any food whose restaurant is inactive
        const activeFoods = foods.filter((food) => food.restaurant);

        // Attach dynamic ratings and availability
        const enriched = activeFoods.map((f) => {
            const fObj = f.toObject ? f.toObject() : f;
            const rInfo = ratingsMap.get(String(fObj._id));
            const rating = rInfo ? rInfo.rating : (fObj.rating !== undefined ? fObj.rating : 5.0);
            const ratingCount = rInfo ? rInfo.ratingCount : (fObj.ratingCount !== undefined ? fObj.ratingCount : 0);
            return {
                ...fObj,
                rating,
                ratingCount,
                availability: fObj.availability !== undefined ? Boolean(fObj.availability) : true
            };
        });

        // Stable sort: Available foods first (0), Unavailable foods last (1)
        enriched.sort((a, b) => {
            const aAvail = a.availability !== false ? 0 : 1;
            const bAvail = b.availability !== false ? 0 : 1;
            return aAvail - bAvail;
        });

        res.json({ foods: enriched });
    } catch (error) {
        console.error("List foods error:", error.message);
        res.status(500).json({ message: "Unable to load foods" });
    }
};

const getFood = async (req, res) => {
    try {
        if (!objectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid food id" });
        }

        const food = await Food.findById(req.params.id)
            .populate({ path: "restaurant", match: { active: true } });

        if (!food || !food.restaurant) {
            return res.status(404).json({ message: "Food not found" });
        }

        // Fetch dynamic ratings map (which updates DB and includes feedback session reviews)
        const ratingsMap = await computeAndUpdateFoodRatings();
        const rInfo = ratingsMap.get(String(food._id));
        const rating = rInfo ? rInfo.rating : (food.rating !== undefined ? food.rating : 5.0);
        const ratingCount = rInfo ? rInfo.ratingCount : (food.ratingCount !== undefined ? food.ratingCount : 0);

        const fObj = food.toObject ? food.toObject() : food;

        res.json({
            food: {
                ...fObj,
                rating,
                ratingCount,
                availability: fObj.availability !== undefined ? Boolean(fObj.availability) : true
            }
        });
    } catch (error) {
        console.error("Get food error:", error.message);
        res.status(500).json({ message: "Unable to load food" });
    }
};

module.exports = {
    listRestaurants,
    getRestaurant,
    listFoods,
    getFood
};
