const mongoose = require("mongoose");


// ==========================================
// ORDER ITEM SCHEMA
// ==========================================

const orderItemSchema = new mongoose.Schema(
    {
        foodId: {
            type: String,
            required: true
        },

        name: {
            type: String,
            required: true
        },

        price: {
            type: Number,
            required: true
        },

        quantity: {
            type: Number,
            required: true,
            min: 1
        }
    },
    {
        _id: false
    }
);


// ==========================================
// ORDER SCHEMA
// ==========================================

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        items: {
            type: [orderItemSchema],
            required: true
        },

        totalAmount: {
            type: Number,
            required: true
        },

        customerName: {
            type: String,
            required: true
        },

        mobile: {
            type: String,
            required: true
        },

        address: {
            type: String,
            default: ""
        },

        orderType: {
            type: String,
            enum: [
                "pickup",
                "home_delivery",
                "dine_in"
            ],
            required: true
        },

        paymentMethod: {
            type: String,
            default: "COD"
        },

        paymentStatus: {
            type: String,
            enum: [
                "pending",
                "paid",
                "failed"
            ],
            default: "pending"
        },

        status: {
            type: String,
            enum: [
                "Pending",
                "Confirmed",
                "Preparing",
                "Ready",
                "Out for Delivery",
                "Delivered",
                "Completed",
                "Cancelled"
            ],
            default: "Pending"
        },

        tableNumber: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);


module.exports = mongoose.model("Order", orderSchema);