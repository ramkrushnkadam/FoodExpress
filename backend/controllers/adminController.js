const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const Order = require("../models/Order");
const Food = require("../models/Food");
const Restaurant = require("../models/Restaurant");




const orderStatuses = [
    "Pending",
    "Confirmed",
    "Preparing",
    "Ready",
    "Out for Delivery",
    "Delivered",
    "Completed",
    "Cancelled"
];

const objectId = (id) => mongoose.Types.ObjectId.isValid(id);

const dateRange = (query) => {
    const filter = {};
    if (query.from || query.to) {
        filter.createdAt = {};
        if (query.from) filter.createdAt.$gte = new Date(query.from);
        if (query.to) {
            const end = new Date(query.to);
            end.setHours(23, 59, 59, 999);
            filter.createdAt.$lte = end;
        }
    }
    return filter;
};

// ==========================================
// ADMIN LOGIN
// ==========================================

const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        if (user.role !== "admin") {
            return res.status(403).json({ message: "This account does not have admin access" });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            message: "Admin login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Admin Login Error:", error.message);
        res.status(500).json({ message: "Server error during admin login" });
    }
};

// ==========================================
// DASHBOARD STATS
// ==========================================

const dashboardStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const revenueMatch = { status: { $in: ["Delivered", "Completed"] } };

        const [
            totalOrders,
            pendingOrders,
            preparingOrders,
            completedOrders,
            totalCustomers,
            totalRestaurants,
            totalFoods,
            revenue,
            todayOrders,
            todayRevenue,
            orderTypes,
            statuses,
            recentOrders
        ] = await Promise.all([
            Order.countDocuments(),
            Order.countDocuments({ status: "Pending" }),
            Order.countDocuments({ status: "Preparing" }),
            Order.countDocuments({ status: { $in: ["Delivered", "Completed"] } }),
            User.countDocuments({ role: "customer" }),
            Restaurant.countDocuments(),
            Food.countDocuments(),
            Order.aggregate([
                { $match: revenueMatch },
                { $group: { _id: null, total: { $sum: "$totalAmount" } } }
            ]),
            Order.countDocuments({ createdAt: { $gte: today } }),
            Order.aggregate([
                { $match: { ...revenueMatch, createdAt: { $gte: today } } },
                { $group: { _id: null, total: { $sum: "$totalAmount" } } }
            ]),
            Order.aggregate([{ $group: { _id: "$orderType", count: { $sum: 1 } } }]),
            Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
            Order.find().sort({ createdAt: -1 }).limit(6).select("customerName totalAmount status orderType createdAt")
        ]);

        res.json({
            totalOrders,
            pendingOrders,
            preparingOrders,
            completedOrders,
            totalRevenue: revenue[0]?.total || 0,
            totalCustomers,
            totalRestaurants,
            totalFoods,
            todayOrders,
            todayRevenue: todayRevenue[0]?.total || 0,
            orderTypes,
            statuses,
            recentOrders
        });
    } catch (error) {
        console.error("Dashboard Stats Error:", error.message);
        res.status(500).json({ message: "Unable to load dashboard statistics" });
    }
};

// ==========================================
// ORDERS MANAGEMENT
// ==========================================

const getOrders = async (req, res) => {
    try {
        const { search, status, orderType, paymentStatus } = req.query;
        const filter = dateRange(req.query);

        if (status) filter.status = status;
        if (orderType) filter.orderType = orderType;
        if (paymentStatus) filter.paymentStatus = paymentStatus;
        if (search && search.trim()) {
            const queryRegex = { $regex: search.trim(), $options: "i" };
            filter.$or = [
                { customerName: queryRegex },
                { mobile: queryRegex }
            ];
            if (objectId(search.trim())) {
                filter.$or.push({ _id: search.trim() });
            }
        }

        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

        const [orders, total] = await Promise.all([
            Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
            Order.countDocuments(filter)
        ]);

        res.json({
            orders,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get Orders Error:", error.message);
        res.status(500).json({ message: "Unable to load orders" });
    }
};

const getOrder = async (req, res) => {
    try {
        if (!objectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid order id" });
        }
        const order = await Order.findById(req.params.id).populate("user", "name email mobile address");
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        res.json({ order });
    } catch (error) {
        console.error("Get Order Error:", error.message);
        res.status(500).json({ message: "Unable to load order details" });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!orderStatuses.includes(status)) {
            return res.status(400).json({
                message: `Invalid order status. Allowed: ${orderStatuses.join(", ")}`
            });
        }
        if (!objectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid order id" });
        }
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        res.json({ message: "Order status updated successfully", order });
    } catch (error) {
        console.error("Update Order Status Error:", error.message);
        res.status(500).json({ message: "Unable to update order status" });
    }
};

// ==========================================
// CUSTOMER MANAGEMENT
// ==========================================

const getCustomers = async (req, res) => {
    try {
        const filter = { role: "customer" };
        const { search } = req.query;
        if (search && search.trim()) {
            const queryRegex = { $regex: search.trim(), $options: "i" };
            filter.$or = [
                { name: queryRegex },
                { email: queryRegex },
                { mobile: queryRegex }
            ];
        }

        const customers = await User.aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: "orders",
                    localField: "_id",
                    foreignField: "user",
                    as: "orders"
                }
            },
            {
                $project: {
                    name: 1,
                    email: 1,
                    mobile: 1,
                    address: 1,
                    createdAt: 1,
                    orderCount: { $size: "$orders" },
                    totalSpent: { $sum: "$orders.totalAmount" }
                }
            },
            { $sort: { createdAt: -1 } }
        ]);

        res.json({ customers });
    } catch (error) {
        console.error("Get Customers Error:", error.message);
        res.status(500).json({ message: "Unable to load customers" });
    }
};

const getCustomer = async (req, res) => {
    try {
        if (!objectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid customer id" });
        }
        const customer = await User.findOne({ _id: req.params.id, role: "customer" }).select("-password");
        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }
        const orders = await Order.find({ user: customer._id }).sort({ createdAt: -1 });
        res.json({
            customer,
            orders,
            orderCount: orders.length,
            totalSpent: orders.reduce((sum, order) => sum + order.totalAmount, 0)
        });
    } catch (error) {
        console.error("Get Customer Error:", error.message);
        res.status(500).json({ message: "Unable to load customer details" });
    }
};

// ==========================================
// FOOD MANAGEMENT (Whitelisted & Validated)
// ==========================================

const listFoods = async (_req, res) => {
    try {
        const foods = await Food.find().populate("restaurant", "name location active").sort({ createdAt: -1 });
        res.json({ items: foods });
    } catch (error) {
        console.error("List Foods Error:", error.message);
        res.status(500).json({ message: "Unable to load foods" });
    }
};

const createFood = async (req, res) => {
    try {
        const { name, description, price, category, restaurant, image, availability } = req.body;
        if (!name || !price || !category || !restaurant) {
            return res.status(400).json({ message: "Name, price, category, and restaurant are required" });
        }

        if (Number(price) <= 0) {
            return res.status(400).json({ message: "Price must be greater than 0" });
        }

        if (!objectId(restaurant)) {
            return res.status(400).json({ message: "Invalid restaurant ID" });
        }

        const restaurantDoc = await Restaurant.findById(restaurant);
        if (!restaurantDoc) {
            return res.status(400).json({ message: "Selected restaurant does not exist" });
        }

        const food = await Food.create({
            name: name.trim(),
            description: description ? description.trim() : "",
            price: Number(price),
            category: category.trim(),
            restaurant: restaurantDoc._id,
            image: image ? image.trim() : "",
            availability: availability !== undefined ? Boolean(availability) : true
        });

        res.status(201).json({ item: food });
    } catch (error) {
        console.error("Create Food Error:", error.message);
        res.status(400).json({ message: error.message || "Failed to create food" });
    }
};

const updateFood = async (req, res) => {
    try {
        if (!objectId(req.params.id)) return res.status(400).json({ message: "Invalid food ID" });

        const updates = {};
        const { name, description, price, category, restaurant, image, availability } = req.body;

        if (name) updates.name = name.trim();
        if (description !== undefined) updates.description = description.trim();
        if (price !== undefined) {
            if (Number(price) <= 0) return res.status(400).json({ message: "Price must be greater than 0" });
            updates.price = Number(price);
        }
        if (category) updates.category = category.trim();
        if (restaurant) {
            if (!objectId(restaurant)) return res.status(400).json({ message: "Invalid restaurant ID" });
            const rest = await Restaurant.findById(restaurant);
            if (!rest) return res.status(400).json({ message: "Selected restaurant does not exist" });
            updates.restaurant = rest._id;
        }
        if (image !== undefined) updates.image = image.trim();
        if (availability !== undefined) updates.availability = Boolean(availability);

        const food = await Food.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
        if (!food) return res.status(404).json({ message: "Food item not found" });

        res.json({ item: food });
    } catch (error) {
        console.error("Update Food Error:", error.message);
        res.status(400).json({ message: error.message || "Failed to update food" });
    }
};

const deleteFood = async (req, res) => {
    try {
        if (!objectId(req.params.id)) return res.status(400).json({ message: "Invalid food ID" });
        const food = await Food.findByIdAndDelete(req.params.id);
        if (!food) return res.status(404).json({ message: "Food item not found" });
        res.json({ message: "Food item deleted successfully" });
    } catch (error) {
        console.error("Delete Food Error:", error.message);
        res.status(500).json({ message: "Failed to delete food" });
    }
};

const setFoodAvailability = async (req, res) => {
    try {
        if (!objectId(req.params.id)) return res.status(400).json({ message: "Invalid food ID" });
        const food = await Food.findByIdAndUpdate(
            req.params.id,
            { availability: Boolean(req.body.availability) },
            { new: true }
        );
        if (!food) return res.status(404).json({ message: "Food item not found" });
        res.json({ item: food });
    } catch (error) {
        console.error("Set Food Availability Error:", error.message);
        res.status(500).json({ message: "Failed to update availability" });
    }
};

// ==========================================
// RESTAURANT MANAGEMENT (With Cascade Handling)
// ==========================================

const listRestaurants = async (_req, res) => {
    try {
        const restaurants = await Restaurant.find().sort({ createdAt: -1 });
        res.json({ items: restaurants });
    } catch (error) {
        console.error("List Restaurants Error:", error.message);
        res.status(500).json({ message: "Unable to load restaurants" });
    }
};

const createRestaurant = async (req, res) => {
    try {
        const { name, category, location, deliveryTime, image, active } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ message: "Restaurant name is required" });

        const restaurant = await Restaurant.create({
            name: name.trim(),
            category: category ? category.trim() : "",
            location: location ? location.trim() : "",
            deliveryTime: deliveryTime ? deliveryTime.trim() : "25-30 min",
            image: image ? image.trim() : "",
            active: active !== undefined ? Boolean(active) : true
        });

        res.status(201).json({ item: restaurant });
    } catch (error) {
        console.error("Create Restaurant Error:", error.message);
        res.status(400).json({ message: error.message || "Failed to create restaurant" });
    }
};

const updateRestaurant = async (req, res) => {
    try {
        if (!objectId(req.params.id)) return res.status(400).json({ message: "Invalid restaurant ID" });

        const updates = {};
        const { name, category, location, deliveryTime, image, active } = req.body;

        if (name) updates.name = name.trim();
        if (category !== undefined) updates.category = category.trim();
        if (location !== undefined) updates.location = location.trim();
        if (deliveryTime !== undefined) updates.deliveryTime = deliveryTime.trim();
        if (image !== undefined) updates.image = image.trim();
        if (active !== undefined) updates.active = Boolean(active);

        const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
        if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

        res.json({ item: restaurant });
    } catch (error) {
        console.error("Update Restaurant Error:", error.message);
        res.status(400).json({ message: error.message || "Failed to update restaurant" });
    }
};

const deleteRestaurant = async (req, res) => {
    try {
        if (!objectId(req.params.id)) return res.status(400).json({ message: "Invalid restaurant ID" });

        const restaurant = await Restaurant.findByIdAndDelete(req.params.id);
        if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

        // Safely cascade delete or remove orphan foods associated with this restaurant
        await Food.deleteMany({ restaurant: req.params.id });

        res.json({ message: "Restaurant and associated menu items deleted successfully" });
    } catch (error) {
        console.error("Delete Restaurant Error:", error.message);
        res.status(500).json({ message: "Failed to delete restaurant" });
    }
};

// ==========================================
// REPORTS & ANALYTICS
// ==========================================

const reports = async (req, res) => {
    try {
        const filter = dateRange(req.query);
        const completed = { ...filter, status: { $in: ["Delivered", "Completed"] } };

        const [summary, statuses, orderTypes, popularFoods, dailyRevenue] = await Promise.all([
            Order.aggregate([
                { $match: completed },
                { $group: { _id: null, revenue: { $sum: "$totalAmount" }, completedOrders: { $sum: 1 } } }
            ]),
            Order.aggregate([
                { $match: filter },
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ]),
            Order.aggregate([
                { $match: filter },
                { $group: { _id: "$orderType", count: { $sum: 1 } } }
            ]),
            Order.aggregate([
                { $match: filter },
                { $unwind: "$items" },
                { $group: { _id: "$items.name", quantity: { $sum: "$items.quantity" } } },
                { $sort: { quantity: -1 } },
                { $limit: 10 }
            ]),
            Order.aggregate([
                { $match: completed },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        revenue: { $sum: "$totalAmount" },
                        orders: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ])
        ]);

        const totalOrders = await Order.countDocuments(filter);
        const cancelledOrders = await Order.countDocuments({ ...filter, status: "Cancelled" });

        res.json({
            totalOrders,
            revenue: summary[0]?.revenue || 0,
            completedOrders: summary[0]?.completedOrders || 0,
            cancelledOrders,
            statuses,
            orderTypes,
            popularFoods,
            dailyRevenue
        });
    } catch (error) {
        console.error("Reports Error:", error.message);
        res.status(500).json({ message: "Unable to load reports" });
    }
};

// ==========================================
// ADMIN PROFILE & SETTINGS
// ==========================================

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("name email mobile role");
        if (!user) return res.status(404).json({ message: "Admin user not found" });
        res.json({ user });
    } catch (error) {
        console.error("Get Profile Error:", error.message);
        res.status(500).json({ message: "Unable to load profile" });
    }
};

const updateProfile = async (req, res) => {
    try {
        const updates = {};
        if (req.body.name) updates.name = req.body.name.trim();
        if (req.body.email) updates.email = req.body.email.toLowerCase().trim();
        if (req.body.password) {
            if (req.body.password.length < 6) {
                return res.status(400).json({ message: "Password must be at least 6 characters" });
            }
            updates.password = await bcrypt.hash(req.body.password, 10);
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            updates,
            { new: true, runValidators: true }
        ).select("name email mobile role");

        res.json({ message: "Profile updated successfully", user });
    } catch (error) {
        console.error("Update Profile Error:", error.message);
        res.status(400).json({
            message: error.code === 11000 ? "Email is already in use" : error.message
        });
    }
};

module.exports = {
    adminLogin,
    dashboardStats,
    getOrders,
    getOrder,
    updateOrderStatus,
    getCustomers,
    getCustomer,
    listFoods,
    createFood,
    updateFood,
    deleteFood,
    setFoodAvailability,
    listRestaurants,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
    reports,
    getProfile,
    updateProfile
};
