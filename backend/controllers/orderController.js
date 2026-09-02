const mongoose = require("mongoose");
const Order = require("../models/Order");
const Food = require("../models/Food");

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
            tableNumber
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

        // Query MongoDB for all requested food items
        const foodIds = requestedItems.map((item) => item.foodId).filter(Boolean);
        if (foodIds.length !== requestedItems.length) {
            return res.status(400).json({ message: "Each item must have a valid foodId" });
        }

        const foods = await Food.find({
            _id: { $in: foodIds },
            availability: true
        }).populate({ path: "restaurant", match: { active: true } });

        // Verify all food items exist and are available in active restaurants
        if (foods.length !== requestedItems.length || foods.some((f) => !f.restaurant)) {
            return res.status(400).json({ message: "One or more items in your order are unavailable" });
        }

        const foodsById = new Map(foods.map((food) => [String(food._id), food]));

        // Calculate item prices and server total
        const validatedItems = requestedItems.map((item) => {
            const food = foodsById.get(String(item.foodId));
            const quantity = Number(item.quantity);

            if (!food || !Number.isInteger(quantity) || quantity < 1) {
                throw new Error("Invalid quantity for food item");
            }

            return {
                foodId: String(food._id),
                name: food.name,
                price: food.price, // Server price from MongoDB
                quantity
            };
        });

        const calculatedTotal = validatedItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );

        // Save order in MongoDB
        const order = new Order({
            user: req.user.id,
            items: validatedItems,
            totalAmount: calculatedTotal,
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
