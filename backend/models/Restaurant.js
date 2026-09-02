const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    image: { type: String, default: "", trim: true },
    category: { type: String, default: "", trim: true },
    location: { type: String, default: "", trim: true },
    deliveryTime: { type: String, default: "", trim: true },
    active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Restaurant", restaurantSchema);
