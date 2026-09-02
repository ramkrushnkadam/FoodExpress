const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const Food = require("../models/Food");

const restaurants = [
    { name: "Pizza Palace", category: "Pizza, Italian", location: "Main Road", deliveryTime: "25-30 min", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80", active: true },
    { name: "Burger House", category: "Burger, Fast Food", location: "Market Road", deliveryTime: "20-25 min", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80", active: true },
    { name: "Biryani Express", category: "Biryani, Indian", location: "Station Road", deliveryTime: "30-35 min", image: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=900&q=80", active: true },
    { name: "Chinese Corner", category: "Chinese, Noodles", location: "College Road", deliveryTime: "25-30 min", image: "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=900&q=80", active: true },
    { name: "Chicken Hub", category: "Chicken, Non-Veg", location: "City Center", deliveryTime: "30-35 min", image: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=900&q=80", active: true }
];

const foods = [
    ["Pizza Palace", "Margherita Pizza", 299, "Pizza", "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80"],
    ["Pizza Palace", "White Sauce Pasta", 229, "Italian", ""],
    ["Burger House", "Cheese Burger", 199, "Burger", "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80"],
    ["Burger House", "Pav Bhaji", 179, "Street Food", ""],
    ["Biryani Express", "Chicken Biryani", 249, "Biryani", "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=900&q=80"],
    ["Biryani Express", "Paneer Butter Masala", 289, "Indian", ""],
    ["Biryani Express", "Butter Naan", 49, "Indian", ""],
    ["Chinese Corner", "Hakka Noodles", 199, "Chinese", "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=900&q=80"],
    ["Chinese Corner", "Veg Fried Rice", 189, "Chinese", ""],
    ["Chinese Corner", "Chicken Momos", 169, "Chinese", ""],
    ["Chicken Hub", "Chicken 65", 279, "Chicken", "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=900&q=80"],
    ["Chicken Hub", "Misal Pav", 120, "Maharashtrian", ""],
    ["Chicken Hub", "Masala Dosa", 149, "South Indian", ""],
    ["Chicken Hub", "Idli Sambar", 99, "South Indian", ""],
    ["Chicken Hub", "Chocolate Cake", 149, "Dessert", ""],
    ["Chicken Hub", "Ice Cream", 99, "Dessert", ""],
    ["Chicken Hub", "Cold Coffee", 139, "Beverage", ""],
    ["Chicken Hub", "Fresh Lime Soda", 79, "Beverage", ""],
    ["Chicken Hub", "Mango Shake", 129, "Beverage", ""]
];

async function seed() {
    if (!process.env.MONGO_URI) {
        console.error("MONGO_URI is not defined in environment.");
        process.exit(1);
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB successfully.");

    // 1. Seed Admin User
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@foodexpress.com").toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = await User.findOneAndUpdate(
        { email: adminEmail },
        {
            $set: {
                name: "FoodExpress Administrator",
                email: adminEmail,
                password: hashedPassword,
                mobile: "9876543210",
                address: "FoodExpress Headquarters",
                role: "admin"
            }
        },
        { upsert: true, new: true, runValidators: true }
    );
    console.log(`Admin ready: ${admin.email} (role: ${admin.role})`);

    // 2. Seed Restaurants
    const restaurantByName = new Map();
    for (const restaurant of restaurants) {
        const saved = await Restaurant.findOneAndUpdate(
            { name: restaurant.name },
            { $set: restaurant },
            { new: true, upsert: true, runValidators: true }
        );
        restaurantByName.set(saved.name, saved._id);
    }

    // 3. Seed Foods
    for (const [restaurantName, name, price, category, image] of foods) {
        const restId = restaurantByName.get(restaurantName);
        if (restId) {
            await Food.findOneAndUpdate(
                { name, restaurant: restId },
                {
                    $set: {
                        name,
                        price,
                        category,
                        image,
                        restaurant: restId,
                        availability: true
                    }
                },
                { upsert: true, new: true, runValidators: true }
            );
        }
    }

    const totalRestaurants = await Restaurant.countDocuments();
    const totalFoods = await Food.countDocuments();
    const totalUsers = await User.countDocuments();

    console.log(`Database Seeded Successfully!`);
    console.log(`- Total Users: ${totalUsers} (Admin: ${adminEmail})`);
    console.log(`- Total Restaurants: ${totalRestaurants}`);
    console.log(`- Total Foods: ${totalFoods}`);

    await mongoose.disconnect();
}

seed().catch(async (error) => {
    console.error("Database seed failed:", error.message);
    await mongoose.disconnect();
    process.exit(1);
});
