const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: [true, "Coupon code is required"],
            unique: true,
            uppercase: true,
            trim: true,
            minlength: [2, "Coupon code must be at least 2 characters"],
            maxlength: [30, "Coupon code cannot exceed 30 characters"]
        },
        discountType: {
            type: String,
            enum: ["percentage", "fixed"],
            default: "percentage",
            required: true
        },
        discountValue: {
            type: Number,
            required: [true, "Discount value is required"],
            min: [0.01, "Discount value must be greater than 0"]
        },
        minSubtotal: {
            type: Number,
            default: 0,
            min: [0, "Minimum subtotal cannot be negative"]
        },
        maxDiscount: {
            type: Number,
            default: null,
            min: [0, "Maximum discount cannot be negative"]
        },
        startDate: {
            type: Date,
            required: [true, "Start date is required"]
        },
        endDate: {
            type: Date,
            required: [true, "Expiry date is required"]
        },
        usageLimit: {
            type: Number,
            default: null,
            min: [1, "Usage limit must be at least 1"]
        },
        redemptionCount: {
            type: Number,
            default: 0,
            min: 0
        },
        isActive: {
            type: Boolean,
            default: true
        },
        description: {
            type: String,
            default: "",
            trim: true
        }
    },
    {
        timestamps: true
    }
);

// Virtual to determine current coupon status
couponSchema.virtual("status").get(function () {
    if (!this.isActive) return "disabled";
    const now = new Date();
    if (this.startDate && now < this.startDate) return "scheduled";
    if (this.endDate && now > this.endDate) return "expired";
    if (this.usageLimit && this.redemptionCount >= this.usageLimit) return "limit_reached";
    return "active";
});

couponSchema.set("toJSON", { virtuals: true });
couponSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Coupon", couponSchema);

