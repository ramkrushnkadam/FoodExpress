const mongoose = require("mongoose");

const sessionOfferSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Offer title is required"],
            trim: true,
            maxlength: [100, "Title cannot exceed 100 characters"]
        },
        message: {
            type: String,
            required: [true, "Offer message is required"],
            trim: true,
            maxlength: [300, "Message cannot exceed 300 characters"]
        },
        subtitle: {
            type: String,
            default: "",
            trim: true,
            maxlength: [150, "Subtitle cannot exceed 150 characters"]
        },
        offerType: {
            type: String,
            enum: ["coupon", "direct"],
            default: "coupon",
            required: true
        },
        couponCode: {
            type: String,
            default: "",
            uppercase: true,
            trim: true
        },
        discountType: {
            type: String,
            enum: ["percentage", "fixed"],
            default: "percentage"
        },
        discountValue: {
            type: Number,
            default: 0,
            min: [0, "Discount value cannot be negative"]
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
            required: [true, "End date is required"]
        },
        isActive: {
            type: Boolean,
            default: true
        },
        showBanner: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

// Virtual for status
sessionOfferSchema.virtual("status").get(function () {
    if (!this.isActive) return "disabled";
    const now = new Date();
    if (this.startDate && now < this.startDate) return "scheduled";
    if (this.endDate && now > this.endDate) return "expired";
    return "active";
});

sessionOfferSchema.set("toJSON", { virtuals: true });
sessionOfferSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("SessionOffer", sessionOfferSchema);

