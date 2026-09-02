const mongoose = require("mongoose");
const Food = require("../models/Food");
const Restaurant = require("../models/Restaurant");

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
        const filter = { availability: true };
        if (req.query.restaurant) {
            if (!objectId(req.query.restaurant)) {
                return res.status(400).json({ message: "Invalid restaurant filter id" });
            }
            filter.restaurant = req.query.restaurant;
        }

        const foods = await Food.find(filter)
            .populate({ path: "restaurant", match: { active: true } })
            .sort({ createdAt: -1 });

        // Filter out any food whose restaurant is inactive
        res.json({ foods: foods.filter((food) => food.restaurant) });
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

        const food = await Food.findOne({ _id: req.params.id, availability: true })
            .populate({ path: "restaurant", match: { active: true } });

        if (!food || !food.restaurant) {
            return res.status(404).json({ message: "Food is unavailable" });
        }

        res.json({ food });
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
