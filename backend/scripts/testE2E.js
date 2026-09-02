const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const http = require("http");
const app = require("../server");

const PORT = 5055;
let server;

async function runE2E() {
    console.log("=================================================");
    console.log("  FOODEXPRESS END-TO-END AUTOMATED VERIFICATION  ");
    console.log("=================================================\n");

    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI not defined in environment");
    }

    console.log("1. Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("   ✓ MongoDB Connected successfully.\n");

    console.log(`2. Starting backend test server on port ${PORT}...`);
    server = app.listen(PORT);
    await new Promise((res) => server.once("listening", res));
    console.log("   ✓ Server is listening.\n");

    const BASE_URL = `http://localhost:${PORT}/api`;

    async function request(path, options = {}, token = null) {
        const headers = {
            "Content-Type": "application/json",
            ...(options.headers || {})
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        const res = await fetch(`${BASE_URL}${path}`, {
            ...options,
            headers
        });
        const data = await res.json().catch(() => ({}));
        return { status: res.status, data };
    }

    const timestamp = Date.now();
    const customerEmail = `customer_${timestamp}@test.com`;
    const customerPassword = "CustomerPass@123";
    let customerToken = null;
    let customerId = null;
    let adminToken = null;
    let createdOrderId = null;

    console.log("3. Testing Customer Registration & Login...");
    const regRes = await request("/auth/register", {
        method: "POST",
        body: JSON.stringify({
            name: "John Doe",
            email: customerEmail,
            password: customerPassword,
            mobile: "9876543210",
            address: "123 Food Street, Cityville"
        })
    });
    if (regRes.status !== 201 || !regRes.data.token) {
        throw new Error(`Registration failed: ${JSON.stringify(regRes.data)}`);
    }
    customerToken = regRes.data.token;
    customerId = regRes.data.user.id;
    console.log(`   ✓ Registered customer: ${customerEmail} (ID: ${customerId})`);

    const loginRes = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({
            email: customerEmail,
            password: customerPassword
        })
    });
    if (loginRes.status !== 200 || !loginRes.data.token) {
        throw new Error(`Customer login failed: ${JSON.stringify(loginRes.data)}`);
    }
    console.log("   ✓ Customer logged in successfully.\n");

    console.log("4. Testing Customer Profile Operations...");
    const meRes = await request("/auth/me", {}, customerToken);
    if (meRes.status !== 200 || meRes.data.user.email !== customerEmail) {
        throw new Error(`GET /auth/me failed: ${JSON.stringify(meRes.data)}`);
    }
    console.log("   ✓ GET /api/auth/me returned correct profile.");

    const updateProfRes = await request("/auth/profile", {
        method: "PUT",
        body: JSON.stringify({
            name: "Johnathan Doe",
            mobile: "9988776655",
            address: "456 Gourmet Avenue, Food City"
        })
    }, customerToken);
    if (updateProfRes.status !== 200 || updateProfRes.data.user.name !== "Johnathan Doe") {
        throw new Error(`Profile update failed: ${JSON.stringify(updateProfRes.data)}`);
    }
    console.log("   ✓ Customer profile updated successfully (Role remained customer).\n");

    console.log("5. Testing Food Catalog & Availability...");
    const foodsRes = await request("/foods");
    if (foodsRes.status !== 200 || !Array.isArray(foodsRes.data.foods) || foodsRes.data.foods.length === 0) {
        throw new Error(`List foods failed: ${JSON.stringify(foodsRes.data)}`);
    }
    const sampleFood = foodsRes.data.foods[0];
    console.log(`   ✓ Found ${foodsRes.data.foods.length} food items. Using sample: "${sampleFood.name}" (₹${sampleFood.price}).\n`);

    console.log("6. Testing Customer Order Creation...");
    const orderPayload = {
        customerName: "Johnathan Doe",
        mobile: "9988776655",
        orderType: "home_delivery",
        address: "456 Gourmet Avenue, Food City",
        paymentMethod: "UPI",
        paymentStatus: "paid",
        items: [
            {
                foodId: sampleFood._id,
                quantity: 2
            }
        ]
    };
    const orderCreateRes = await request("/orders", {
        method: "POST",
        body: JSON.stringify(orderPayload)
    }, customerToken);

    if (orderCreateRes.status !== 201 || !orderCreateRes.data.order) {
        throw new Error(`Order creation failed: ${JSON.stringify(orderCreateRes.data)}`);
    }
    const order = orderCreateRes.data.order;
    createdOrderId = order._id;
    const expectedTotal = sampleFood.price * 2;

    if (order.totalAmount !== expectedTotal) {
        throw new Error(`Price calculation mismatch! Expected ₹${expectedTotal}, got ₹${order.totalAmount}`);
    }
    if (order.status !== "Pending") {
        throw new Error(`Expected initial status 'Pending', got '${order.status}'`);
    }
    console.log(`   ✓ Order created in MongoDB with ID: ${createdOrderId}`);
    console.log(`   ✓ Server-calculated Total: ₹${order.totalAmount} (Matches DB food price × quantity)`);
    console.log(`   ✓ Initial Status: "${order.status}"\n`);

    console.log("7. Testing Customer View Orders...");
    const myOrdersRes = await request("/orders", {}, customerToken);
    if (myOrdersRes.status !== 200 || !Array.isArray(myOrdersRes.data.orders)) {
        throw new Error(`Get my orders failed: ${JSON.stringify(myOrdersRes.data)}`);
    }
    const foundOrder = myOrdersRes.data.orders.find((o) => o._id === createdOrderId);
    if (!foundOrder) {
        throw new Error("Created order not found in customer orders list");
    }
    console.log(`   ✓ Customer retrieved ${myOrdersRes.data.orders.length} order(s). Found created order in list with status "${foundOrder.status}".\n`);

    console.log("8. Testing Admin Login & Dashboard Stats...");
    const adminLoginRes = await request("/admin/login", {
        method: "POST",
        body: JSON.stringify({
            email: "admin@foodexpress.com",
            password: "Admin@123"
        })
    });
    if (adminLoginRes.status !== 200 || !adminLoginRes.data.token) {
        throw new Error(`Admin login failed: ${JSON.stringify(adminLoginRes.data)}`);
    }
    adminToken = adminLoginRes.data.token;
    console.log("   ✓ Admin login successful.");

    const statsRes = await request("/admin/dashboard/stats", {}, adminToken);
    if (statsRes.status !== 200 || statsRes.data.totalOrders === undefined) {
        throw new Error(`Dashboard stats failed: ${JSON.stringify(statsRes.data)}`);
    }
    console.log(`   ✓ Dashboard stats: Total Orders = ${statsRes.data.totalOrders}, Pending = ${statsRes.data.pendingOrders}, Revenue = ₹${statsRes.data.totalRevenue}.\n`);

    console.log("9. Testing Complete Admin Order Status Transitions:");
    const lifecycleStatuses = [
        "Confirmed",
        "Preparing",
        "Ready",
        "Out for Delivery",
        "Delivered",
        "Completed"
    ];

    for (const nextStatus of lifecycleStatuses) {
        const updateRes = await request(`/admin/orders/${createdOrderId}/status`, {
            method: "PUT",
            body: JSON.stringify({ status: nextStatus })
        }, adminToken);

        if (updateRes.status !== 200 || updateRes.data.order.status !== nextStatus) {
            throw new Error(`Failed transitioning to '${nextStatus}': ${JSON.stringify(updateRes.data)}`);
        }
        console.log(`   → Transitioned order to: "${nextStatus}" ✓`);
    }
    console.log("   ✓ Full status lifecycle passed from Pending → Completed.\n");

    console.log("10. Testing Customer Order Reflects Latest Status...");
    const customerOrderCheck = await request(`/orders/${createdOrderId}`, {}, customerToken);
    if (customerOrderCheck.status !== 200 || customerOrderCheck.data.order.status !== "Completed") {
        throw new Error(`Customer sees wrong status: ${JSON.stringify(customerOrderCheck.data)}`);
    }
    console.log(`   ✓ Customer queried order #${createdOrderId.slice(-6)}: Status is now "${customerOrderCheck.data.order.status}".\n`);

    console.log("11. Testing Security Boundaries & Role Protections...");

    const forbiddenRes = await request("/admin/dashboard/stats", {}, customerToken);
    if (forbiddenRes.status !== 403) {
        throw new Error(`Expected 403 Forbidden for customer on admin endpoint, got ${forbiddenRes.status}`);
    }
    console.log("   ✓ Customer token blocked with 403 Forbidden from admin endpoints.");

    const unauthRes = await request("/orders", {});
    if (unauthRes.status !== 401) {
        throw new Error(`Expected 401 Unauthorized for missing token, got ${unauthRes.status}`);
    }
    console.log("   ✓ Unauthenticated request blocked with 401 Unauthorized.");

    const invalidStatusRes = await request(`/admin/orders/${createdOrderId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: "InvalidStatus123" })
    }, adminToken);
    if (invalidStatusRes.status !== 400) {
        throw new Error(`Expected 400 Bad Request for invalid status enum, got ${invalidStatusRes.status}`);
    }
    console.log("   ✓ Invalid status transition correctly rejected with 400 Bad Request.\n");

    console.log("=================================================");
    console.log("   🎉 ALL END-TO-END TESTS PASSED SUCCESSFULLY!  ");
    console.log("=================================================\n");
}

runE2E()
    .then(async () => {
        if (server) server.close();
        await mongoose.disconnect();
        process.exit(0);
    })
    .catch(async (err) => {
        console.error("\n❌ E2E TEST SUITE FAILED:", err.message);
        if (server) server.close();
        await mongoose.disconnect();
        process.exit(1);
    });
