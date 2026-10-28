const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true
        },
        food: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Food",
            default: null
        },
        foodName: {
            type: String,
            default: "",
            trim: true
        },
        restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            default: null
        },
        restaurantName: {
            type: String,
            default: "",
            trim: true
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        comment: {
            type: String,
            default: "",
            maxlength: 500,
            trim: true
        },
        images: {
            type: [String],
            default: []
        }
    },
    {
        timestamps: true
    }
);

// Compound and single indexes for performance and duplicate prevention
reviewSchema.index({ order: 1, food: 1 }, { unique: true });
reviewSchema.index({ food: 1, createdAt: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);
