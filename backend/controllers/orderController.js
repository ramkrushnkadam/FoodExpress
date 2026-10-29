const mongoose = require("mongoose");
const Order = require("../models/Order");
const Food = require("../models/Food");
const Coupon = require("../models/Coupon");
const { evaluateOrderDiscount } = require("../services/discountService");

const ALLOWED_STATUSES = [
    "Pending",
    "Confirmed",
    "Preparing",
    "Ready",
    "Out for Delivery",
    "Delivered",
    "Completed",
    "Cancelled"
];

// ==========================================
// CREATE ORDER (Strict Server-Side Calculations)
// ==========================================

const createOrder = async (req, res) => {
    try {
        const {
            items: requestedItems,
            customerName,
            mobile,
            address,
            orderType,
            paymentMethod,
            paymentStatus,
            tableNumber,
            couponCode
        } = req.body;

        // Basic validation
        if (!requestedItems || !Array.isArray(requestedItems) || requestedItems.length === 0) {
            return res.status(400).json({
                message: "Order must contain at least one item"
            });
        }

        if (!customerName || !customerName.trim()) {
            return res.status(400).json({ message: "Customer name is required" });
        }

        if (!mobile || !mobile.trim()) {
            return res.status(400).json({ message: "Mobile number is required" });
        }

        // Normalize orderType: "delivery" -> "home_delivery"
        let normalizedOrderType = orderType;
        if (normalizedOrderType === "delivery") {
            normalizedOrderType = "home_delivery";
        }

        const validOrderTypes = ["pickup", "home_delivery", "dine_in"];
        if (!validOrderTypes.includes(normalizedOrderType)) {
            return res.status(400).json({
                message: `Order type must be one of: ${validOrderTypes.join(", ")}`
            });
        }

        if (normalizedOrderType === "home_delivery" && (!address || !address.trim())) {
            return res.status(400).json({ message: "Delivery address is required for home delivery" });
        }

        // Normalize paymentStatus
        const paymentStatusMap = {
            pending: "pending",
            paid: "paid",
            completed: "paid",
            failed: "failed"
        };

        const normalizedPaymentStatus = paymentStatusMap[
            String(paymentStatus || "pending").toLowerCase()
        ] || "pending";

        // Evaluate items, prices, and authoritative discount server-side
        const discountEvaluation = await evaluateOrderDiscount({
            items: requestedItems,
            couponCode: couponCode ? String(couponCode).trim() : ""
        });

        // Increment coupon redemption count if a coupon was used
        if (discountEvaluation.couponToRedeem) {
            await Coupon.findByIdAndUpdate(discountEvaluation.couponToRedeem._id, {
                $inc: { redemptionCount: 1 }
            });
        }

        // Save order in MongoDB with authoritative prices and discount snapshot
        const order = new Order({
            user: req.user.id,
            items: discountEvaluation.validatedItems,
            originalSubtotal: discountEvaluation.subtotal,
            discountAmount: discountEvaluation.discountAmount,
            discountType: discountEvaluation.discountType,
            couponCode: discountEvaluation.couponCode,
            sessionOfferTitle: discountEvaluation.sessionOfferTitle,
            totalAmount: discountEvaluation.finalPayable,
            customerName: customerName.trim(),
            mobile: mobile.trim(),
            address: normalizedOrderType === "home_delivery" ? (address || "").trim() : "",
            orderType: normalizedOrderType,
            paymentMethod: paymentMethod || "UPI",
            paymentStatus: normalizedPaymentStatus,
            status: "Pending",
            tableNumber: normalizedOrderType === "dine_in" ? (tableNumber || "").trim() : ""
        });

        const savedOrder = await order.save();

        res.status(201).json({
            message: "Order created successfully",
            order: savedOrder
        });

    } catch (error) {
        console.error("Create Order Error:", error.message);
        res.status(500).json({
            message: "Failed to create order",
            error: error.message
        });
    }
};

// ==========================================
// GET LOGGED-IN USER ORDERS
// ==========================================

const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            user: req.user.id
        }).sort({
            createdAt: -1
        });

        res.status(200).json({
            message: "Orders fetched successfully",
            orders
        });

    } catch (error) {
        console.error("Get Orders Error:", error.message);
        res.status(500).json({
            message: "Failed to fetch orders"
        });
    }
};

// ==========================================
// GET SINGLE ORDER
// ==========================================

const getOrderById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid order id" });
        }

        const filter = { _id: req.params.id };
        // If not admin, restrict to own order
        if (req.user.role !== "admin") {
            filter.user = req.user.id;
        }

        const order = await Order.findOne(filter).populate("user", "name email mobile");

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        res.status(200).json({
            message: "Order fetched successfully",
            order
        });

    } catch (error) {
        console.error("Get Single Order Error:", error.message);
        res.status(500).json({
            message: "Failed to fetch order"
        });
    }
};

// ==========================================
// UPDATE ORDER STATUS (Admin action)
// ==========================================

const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;

        if (!ALLOWED_STATUSES.includes(status)) {
            return res.status(400).json({
                message: `Invalid order status. Allowed values: ${ALLOWED_STATUSES.join(", ")}`
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid order id" });
        }

        const order = await Order.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        );

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.json({
            message: "Order status updated successfully",
            order
        });
    } catch (error) {
        console.error("Update Order Status Error:", error.message);
        res.status(500).json({ message: "Failed to update order status" });
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    updateOrderStatus
};
