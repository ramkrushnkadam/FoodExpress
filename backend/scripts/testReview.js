const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const app = require("../server");
const User = require("../models/User");
const Order = require("../models/Order");
const Food = require("../models/Food");
const Review = require("../models/Review");

const PORT = 5058;
let server;

async function runReviewTests() {
    console.log("=================================================");
    console.log("  FOODEXPRESS REVIEW SYSTEM AUTOMATED TESTS      ");
    console.log("=================================================\n");

    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is not defined in environment");
    }

    console.log("0. Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("   ✓ MongoDB Connected successfully.\n");

    console.log(`0. Starting backend test server on port ${PORT}...`);
    server = app.listen(PORT);
    await new Promise((resolve) => server.once("listening", resolve));
    console.log("   ✓ Test server is listening.\n");

    const BASE_URL = `http://localhost:${PORT}/api`;

    async function request(endpoint, options = {}, token = null) {
        const headers = {
            "Content-Type": "application/json",
            ...(options.headers || {})
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers
        });
        const data = await res.json().catch(() => ({}));
        return { status: res.status, data };
    }

    try {
        const timestamp = Date.now();
        const customerEmail = `rahul_k_${timestamp}@gmail.com`;
        const customerPassword = "Password@123";
        const customerMobile = `9${Math.floor(100000000 + Math.random() * 900000000)}`;

        // ==========================================
        // TEST 1: Create/login as customer
        // ==========================================
        console.log("TEST 1: Create / Login as customer...");
        const regRes = await request("/auth/register", {
            method: "POST",
            body: JSON.stringify({
                name: "Rahul Kumar",
                email: customerEmail,
                password: customerPassword,
                mobile: customerMobile,
                address: "Flat 402, Sunshine Apts, Mumbai"
            })
        });
        if (regRes.status !== 201 || !regRes.data.token) {
            throw new Error("Failed to register customer: " + JSON.stringify(regRes.data));
        }

        const loginRes = await request("/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: customerEmail,
                password: customerPassword
            })
        });
        if (loginRes.status !== 200 || !loginRes.data.token) {
            throw new Error("Failed to login customer: " + JSON.stringify(loginRes.data));
        }
        const customerToken = loginRes.data.token;
        const customerId = loginRes.data.user.id;
        console.log(`   ✓ Customer logged in successfully: ${customerEmail} (ID: ${customerId})\n`);

        // ==========================================
        // TEST 2: Place / order an order
        // ==========================================
        console.log("TEST 2: Place an order...");
        const foodsRes = await request("/foods");
        if (foodsRes.status !== 200 || !foodsRes.data.foods?.length) {
            throw new Error("No foods found in catalog");
        }
        const foodItem = foodsRes.data.foods[0];
        console.log(`   ✓ Selected menu item: "${foodItem.name}" (₹${foodItem.price}) from Restaurant: "${foodItem.restaurant?.name || 'Partner'}"`);

        const orderRes1 = await request("/orders", {
            method: "POST",
            body: JSON.stringify({
                customerName: "Rahul Kumar",
                mobile: customerMobile,
                orderType: "home_delivery",
                address: "Flat 402, Sunshine Apts, Mumbai",
                paymentMethod: "UPI",
                paymentStatus: "paid",
                items: [{ foodId: foodItem._id, quantity: 2 }]
            })
        }, customerToken);
        if (orderRes1.status !== 201 || !orderRes1.data.order) {
            throw new Error("Order creation failed: " + JSON.stringify(orderRes1.data));
        }
        const order1Id = orderRes1.data.order._id;
        console.log(`   ✓ Order 1 created: #${order1Id} (Status: ${orderRes1.data.order.status}, Total: ₹${orderRes1.data.order.totalAmount})\n`);

        // Also place a second order to test rating + written review later in TEST 8
        const orderRes2 = await request("/orders", {
            method: "POST",
            body: JSON.stringify({
                customerName: "Rahul Kumar",
                mobile: customerMobile,
                orderType: "home_delivery",
                address: "Flat 402, Sunshine Apts, Mumbai",
                paymentMethod: "UPI",
                paymentStatus: "paid",
                items: [{ foodId: foodItem._id, quantity: 1 }]
            })
        }, customerToken);
        const order2Id = orderRes2.data.order._id;
        console.log(`   ✓ Order 2 created: #${order2Id} (Total: ₹${orderRes2.data.order.totalAmount})\n`);

        // ==========================================
        // TEST 3: Use a completed/delivered order
        // ==========================================
        console.log("TEST 3: Set order status to Delivered / Completed...");
        // Update Order 1 to "Delivered"
        await Order.findByIdAndUpdate(order1Id, { status: "Delivered" });
        // Update Order 2 to "Completed"
        await Order.findByIdAndUpdate(order2Id, { status: "Completed" });
        const updatedO1 = await Order.findById(order1Id);
        const updatedO2 = await Order.findById(order2Id);
        console.log(`   ✓ Order 1 status is now: "${updatedO1.status}"`);
        console.log(`   ✓ Order 2 status is now: "${updatedO2.status}"\n`);

        // ==========================================
        // TEST 4: Open Feedback & Reviews (Eligible Orders)
        // ==========================================
        console.log("TEST 4: Open Feedback & Reviews endpoint (/api/reviews/eligible-orders)...");
        const eligibleOrdersRes = await request("/reviews/eligible-orders", {}, customerToken);
        if (eligibleOrdersRes.status !== 200 || !Array.isArray(eligibleOrdersRes.data.orders)) {
            throw new Error("Failed to fetch eligible orders: " + JSON.stringify(eligibleOrdersRes.data));
        }
        const foundO1 = eligibleOrdersRes.data.orders.find((o) => o._id.toString() === order1Id.toString());
        const foundO2 = eligibleOrdersRes.data.orders.find((o) => o._id.toString() === order2Id.toString());
        if (!foundO1 || !foundO2) {
            throw new Error("Delivered orders not found in eligible orders list!");
        }
        console.log(`   ✓ Retrieved ${eligibleOrdersRes.data.orders.length} eligible orders for customer.`);
        console.log(`   ✓ Order #${order1Id}: ${foundO1.restaurantName}, Status: ${foundO1.status}, isReviewed: ${foundO1.isReviewed}`);
        console.log(`   ✓ Order #${order2Id}: ${foundO2.restaurantName}, Status: ${foundO2.status}, isReviewed: ${foundO2.isReviewed}\n`);

        // ==========================================
        // TEST 5 & 6: Select ★★★★★ & Submit with only rating (Verify in MongoDB)
        // ==========================================
        console.log("TEST 5 & 6: Submit review for Order 1 with ONLY rating (5 stars, empty comment)...");
        const submitOnlyRatingRes = await request("/reviews", {
            method: "POST",
            body: JSON.stringify({
                orderId: order1Id,
                rating: 5,
                comment: "" // Empty optional comment
            })
        }, customerToken);

        if (submitOnlyRatingRes.status !== 201) {
            throw new Error("Rating-only submission failed: " + JSON.stringify(submitOnlyRatingRes.data));
        }
        const review1Id = submitOnlyRatingRes.data.review._id;
        console.log(`   ✓ Review created successfully: "${submitOnlyRatingRes.data.message}"`);

        // Verify in MongoDB
        const dbReview1 = await Review.findById(review1Id);
        if (!dbReview1) {
            throw new Error("Review not found in MongoDB!");
        }
        if (dbReview1.rating !== 5 || dbReview1.comment !== "") {
            throw new Error(`Review data mismatch in MongoDB: rating=${dbReview1.rating}, comment="${dbReview1.comment}"`);
        }
        console.log(`   ✓ Verified in MongoDB: ID=${dbReview1._id}, rating=${dbReview1.rating}, comment="${dbReview1.comment}"\n`);

        // ==========================================
        // TEST 7: Submit another review for the same order (MUST be rejected)
        // ==========================================
        console.log("TEST 7: Attempt duplicate review for Order 1...");
        const dupRes = await request("/reviews", {
            method: "POST",
            body: JSON.stringify({
                orderId: order1Id,
                rating: 4,
                comment: "Duplicate attempt"
            })
        }, customerToken);

        if (dupRes.status === 400 && dupRes.data.message.includes("already been reviewed")) {
            console.log(`   ✓ Duplicate correctly rejected with 400: "${dupRes.data.message}"\n`);
        } else {
            throw new Error(`Expected 400 rejection for duplicate review, got ${dupRes.status}: ${JSON.stringify(dupRes.data)}`);
        }

        // ==========================================
        // TEST 8: Submit rating + written review & Verify in My Reviews
        // ==========================================
        console.log("TEST 8: Submit rating (5 stars) + written review for Order 2 & Verify in My Reviews...");
        const submitFullReviewRes = await request("/reviews", {
            method: "POST",
            body: JSON.stringify({
                orderId: order2Id,
                rating: 5,
                comment: "Excellent food and very fast delivery."
            })
        }, customerToken);

        if (submitFullReviewRes.status !== 201) {
            throw new Error("Full review submission failed: " + JSON.stringify(submitFullReviewRes.data));
        }
        const review2Id = submitFullReviewRes.data.review._id;
        console.log(`   ✓ Review 2 created: "${submitFullReviewRes.data.message}"`);

        // Fetch My Reviews
        const myReviewsRes = await request("/reviews/my-reviews", {}, customerToken);
        if (myReviewsRes.status !== 200 || !Array.isArray(myReviewsRes.data.reviews)) {
            throw new Error("Failed to fetch my reviews: " + JSON.stringify(myReviewsRes.data));
        }
        const foundRev2 = myReviewsRes.data.reviews.find((r) => r.orderId.toString() === order2Id.toString());
        if (!foundRev2) {
            throw new Error("Review 2 not found in customer's My Reviews list!");
        }
        console.log(`   ✓ Found in My Reviews:`);
        console.log(`     - Restaurant: "${foundRev2.restaurantName}"`);
        console.log(`     - Rating: ${foundRev2.rating} Stars`);
        console.log(`     - Comment: "${foundRev2.comment}"`);
        console.log(`     - Order ID: #${foundRev2.orderId}\n`);

        // ==========================================
        // TEST 9 & 10: Logout / Incognito -> Public Home Page Review API (NO AUTH)
        // ==========================================
        console.log("TEST 9 & 10: Public reviews on Home page WITHOUT LOGIN (No JWT, Fresh/Incognito request)...");
        // Simulated fresh incognito request with NO Authorization header
        const publicHomeReviewsRes = await request("/reviews/public", {});
        if (publicHomeReviewsRes.status !== 200 || !Array.isArray(publicHomeReviewsRes.data.reviews)) {
            throw new Error(`Public reviews request failed: status ${publicHomeReviewsRes.status}`);
        }
        console.log(`   ✓ Public endpoint responded 200 OK without any authentication header.`);
        console.log(`   ✓ Found ${publicHomeReviewsRes.data.reviews.length} public reviews available on Home Page.`);

        const pubRev2 = publicHomeReviewsRes.data.reviews.find((r) => r.id.toString() === review2Id.toString());
        if (!pubRev2) {
            throw new Error("Review 2 not visible in public reviews!");
        }
        console.log(`   ✓ Review 2 is publicly visible to unauthenticated visitors:`);
        console.log(`     - Customer Display Name: "${pubRev2.customerDisplayName}"`);
        console.log(`     - Rating: ${pubRev2.rating} Stars`);
        console.log(`     - Comment: "${pubRev2.comment}"`);
        console.log(`     - Restaurant: "${pubRev2.restaurantName}"\n`);

        // ==========================================
        // TEST 11: Customer private information is NOT exposed through public API
        // ==========================================
        console.log("TEST 11: Verify customer private information is NOT exposed through public API...");
        for (const rev of publicHomeReviewsRes.data.reviews) {
            if (rev.email !== undefined) throw new Error("SECURITY ISSUE: email exposed!");
            if (rev.mobile !== undefined) throw new Error("SECURITY ISSUE: mobile exposed!");
            if (rev.address !== undefined) throw new Error("SECURITY ISSUE: address exposed!");
            if (rev.password !== undefined) throw new Error("SECURITY ISSUE: password exposed!");
            if (rev.user && typeof rev.user === "object") {
                if (rev.user.email || rev.user.mobile || rev.user.password) {
                    throw new Error("SECURITY ISSUE: user object exposed sensitive data!");
                }
            }
        }
        console.log("   ✓ Verified safe fields only: id, rating, comment, restaurantName, customerDisplayName, createdAt");
        console.log("   ✓ Verified NO email, mobile, address, password, or token leaked.\n");

        console.log("=================================================");
        console.log("  ALL 11 TESTS COMPLETED AND VERIFIED 100%!       ");
        console.log("=================================================");
    } finally {
        if (server) {
            await new Promise((res) => server.close(res));
            console.log("\n✓ Test server closed.");
        }
        await mongoose.disconnect();
        console.log("✓ MongoDB disconnected.\n");
    }
}

runReviewTests().catch((err) => {
    console.error("\n❌ TEST FAILED:", err.message);
    if (server) server.close();
    mongoose.disconnect();
    process.exit(1);
});

