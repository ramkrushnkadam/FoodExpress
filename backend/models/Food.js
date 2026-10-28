const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: "", trim: true },
    category: { type: String, required: true, trim: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    availability: { type: Boolean, default: true },
    rating: { type: Number, default: 5.0 },
    ratingCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("Food", foodSchema);
