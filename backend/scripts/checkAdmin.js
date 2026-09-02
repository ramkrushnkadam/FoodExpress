const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const app = require("../server");

async function checkAdminApi() {
    await mongoose.connect(process.env.MONGO_URI);
    const server = app.listen(5060);
    await new Promise(r => server.once("listening", r));

    // Admin login
    const loginRes = await fetch("http://localhost:5060/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@foodexpress.com", password: "Admin@123" })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log("Admin token obtained:", !!token);

    // Get orders
    const ordersRes = await fetch("http://localhost:5060/api/admin/orders", {
        headers: { Authorization: `Bearer ${token}` }
    });
    const ordersData = await ordersRes.json();
    console.log("Orders count:", ordersData.orders?.length);

    if (ordersData.orders?.length > 0) {
        const firstOrder = ordersData.orders[0];
        console.log("Testing GET /orders/" + firstOrder._id);
        const singleOrderRes = await fetch(`http://localhost:5060/api/admin/orders/${firstOrder._id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const singleOrderData = await singleOrderRes.json();
        console.log("Single order response status:", singleOrderRes.status, singleOrderData);

        console.log("Testing PUT /orders/" + firstOrder._id + "/status");
        const putRes = await fetch(`http://localhost:5060/api/admin/orders/${firstOrder._id}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status: "Preparing" })
        });
        const putData = await putRes.json();
        console.log("PUT status response:", putRes.status, putData);
    }

    // Get customers
    const custRes = await fetch("http://localhost:5060/api/admin/customers", {
        headers: { Authorization: `Bearer ${token}` }
    });
    const custData = await custRes.json();
    console.log("Customers count:", custData.customers?.length);

    if (custData.customers?.length > 0) {
        const firstCust = custData.customers[0];
        console.log("Testing GET /customers/" + firstCust._id);
        const singleCustRes = await fetch(`http://localhost:5060/api/admin/customers/${firstCust._id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const singleCustData = await singleCustRes.json();
        console.log("Single customer response status:", singleCustRes.status, singleCustData);
    }

    server.close();
    await mongoose.disconnect();
}

checkAdminApi().catch(console.error);
