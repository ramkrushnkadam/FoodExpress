const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const app = require("../server");
const User = require("../models/User");

const BASE_URL = "http://127.0.0.1:5088";

function assert(condition, message) {
    if (!condition) {
        console.error(`❌ FAILED: ${message}`);
        throw new Error(message);
    }
    console.log(`✅ PASSED: ${message}`);
}

async function runTests() {
    console.log("=== STARTING AUTHENTICATION SUITE TESTS ===");

    await mongoose.connect(process.env.MONGO_URI);
    const server = app.listen(5088);
    await new Promise((resolve) => server.once("listening", resolve));

    const testEmail = `testuser_${Date.now()}@gmail.com`;
    const testMobile = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
    const strongPassword = "StrongPass@123";
    const newStrongPassword = "NewStrongPass#456";

    try {
        // ==========================================
        // 1. SIGNUP VALIDATION TESTS
        // ==========================================
        console.log("\n--- [1] Testing Signup Validations ---");

        // 1.1 Non-Gmail rejection
        const res1 = await fetch(`${BASE_URL}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "Test User",
                email: "test@yahoo.com",
                mobile: testMobile,
                password: strongPassword,
                confirmPassword: strongPassword
            })
        });
        const data1 = await res1.json();
        assert(res1.status === 400 && data1.message.includes("Gmail"), "Reject non-Gmail signup (yahoo.com)");

        // 1.2 Invalid email format
        const res2 = await fetch(`${BASE_URL}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "Test User",
                email: "invalid-gmail",
                mobile: testMobile,
                password: strongPassword
            })
        });
        assert(res2.status === 400, "Reject invalid email format");

        // 1.3 9-digit mobile rejection
        const res3 = await fetch(`${BASE_URL}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "Test User",
                email: testEmail,
                mobile: "987654321",
                password: strongPassword
            })
        });
        const data3 = await res3.json();
        assert(res3.status === 400 && data3.message.includes("10 digits"), "Reject 9-digit mobile");

        // 1.4 11-digit mobile rejection
        const res4 = await fetch(`${BASE_URL}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "Test User",
                email: testEmail,
                mobile: "98765432109",
                password: strongPassword
            })
        });
        assert(res4.status === 400, "Reject 11-digit mobile");

        // 1.5 Alphabetic mobile rejection
        const res5 = await fetch(`${BASE_URL}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "Test User",
                email: testEmail,
                mobile: "987654abcd",
                password: strongPassword
            })
        });
        assert(res5.status === 400, "Reject alphabetic mobile");

        // 1.6 Weak password rejection (no special char, no uppercase)
        const res6 = await fetch(`${BASE_URL}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "Test User",
                email: testEmail,
                mobile: testMobile,
                password: "password123"
            })
        });
        assert(res6.status === 400, "Reject weak password without uppercase/special char");

        // 1.7 Password mismatch rejection
        const res7 = await fetch(`${BASE_URL}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "Test User",
                email: testEmail,
                mobile: testMobile,
                password: strongPassword,
                confirmPassword: "DifferentPass@123"
            })
        });
        const data7 = await res7.json();
        assert(res7.status === 400 && data7.message.includes("match"), "Reject password mismatch");

        // 1.8 Successful Signup
        const res8 = await fetch(`${BASE_URL}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "Test User",
                email: testEmail,
                mobile: testMobile,
                password: strongPassword,
                confirmPassword: strongPassword,
                address: "123 Food Street"
            })
        });
        const data8 = await res8.json();
        assert(res8.status === 201 && data8.token && data8.user.email === testEmail, "Successful Signup with valid Gmail, 10-digit mobile & strong password");

        // 1.9 Duplicate Email rejection
        const res9 = await fetch(`${BASE_URL}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "Duplicate User",
                email: testEmail,
                mobile: "8123456789",
                password: strongPassword
            })
        });
        assert(res9.status === 400, "Reject duplicate Gmail address");

        // 1.10 Duplicate Mobile rejection
        const res10 = await fetch(`${BASE_URL}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "Duplicate Mobile User",
                email: `other_${Date.now()}@gmail.com`,
                mobile: testMobile,
                password: strongPassword
            })
        });
        assert(res10.status === 400, "Reject duplicate mobile number");

        // ==========================================
        // 2. LOGIN VALIDATION TESTS
        // ==========================================
        console.log("\n--- [2] Testing Login Validations ---");

        // 2.1 Valid login
        const lRes1 = await fetch(`${BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: testEmail,
                password: strongPassword
            })
        });
        const lData1 = await lRes1.json();
        assert(lRes1.status === 200 && lData1.token, "Valid Login returns JWT token and user");

        // 2.2 Wrong password
        const lRes2 = await fetch(`${BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: testEmail,
                password: "WrongPassword@123"
            })
        });
        assert(lRes2.status === 401, "Reject login with wrong password");

        // 2.3 Non-existing user
        const lRes3 = await fetch(`${BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "nonexistentuser99999@gmail.com",
                password: strongPassword
            })
        });
        assert(lRes3.status === 401, "Reject non-existing user login");

        // 2.4 Non-Gmail login rejection
        const lRes4 = await fetch(`${BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "user@yahoo.com",
                password: strongPassword
            })
        });
        assert(lRes4.status === 400, "Reject non-Gmail customer login");

        // ==========================================
        // 3. FORGOT & RESET PASSWORD TESTS
        // ==========================================
        console.log("\n--- [3] Testing Forgot and Reset Password ---");

        // 3.1 Non-Gmail forgot password request
        const fRes1 = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "invalid@outlook.com" })
        });
        assert(fRes1.status === 400, "Reject non-Gmail forgot password request");

        // 3.2 Unregistered Gmail forgot password request
        const fRes2 = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "unregistered_9999@gmail.com" })
        });
        assert(fRes2.status === 404, "404 on unregistered Gmail for forgot password");

        // 3.3 Registered Gmail forgot password request
        const fRes3 = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: testEmail })
        });
        const fData3 = await fRes3.json();
        assert(fRes3.status === 200 && fData3.resetUrl, "Forgot password succeeds and generates reset URL");

        // Extract token from resetUrl
        const resetToken = fData3.resetUrl.split("/").pop();

        // 3.4 Reset with weak password
        const rRes1 = await fetch(`${BASE_URL}/api/auth/reset-password/${resetToken}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                password: "weak",
                confirmPassword: "weak"
            })
        });
        assert(rRes1.status === 400, "Reject weak password during reset");

        // 3.5 Reset with password mismatch
        const rRes2 = await fetch(`${BASE_URL}/api/auth/reset-password/${resetToken}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                password: newStrongPassword,
                confirmPassword: "DifferentPassword@123"
            })
        });
        assert(rRes2.status === 400, "Reject password mismatch during reset");

        // 3.6 Reset with valid new password
        const rRes3 = await fetch(`${BASE_URL}/api/auth/reset-password/${resetToken}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                password: newStrongPassword,
                confirmPassword: newStrongPassword
            })
        });
        const rData3 = await rRes3.json();
        assert(rRes3.status === 200 && rData3.message.includes("successfully"), "Password reset successful with new strong password");

        // 3.7 Attempt reusing same reset token (Single-use security test)
        const rRes4 = await fetch(`${BASE_URL}/api/auth/reset-password/${resetToken}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                password: "AnotherPassword@789",
                confirmPassword: "AnotherPassword@789"
            })
        });
        assert(rRes4.status === 400, "Reject already-used reset token (single-use enforcement)");

        // 3.8 Login with OLD password (should fail)
        const oldLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: testEmail,
                password: strongPassword
            })
        });
        assert(oldLoginRes.status === 401, "Login with old password fails after reset");

        // 3.9 Login with NEW password (should succeed)
        const newLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: testEmail,
                password: newStrongPassword
            })
        });
        const newLoginData = await newLoginRes.json();
        assert(newLoginRes.status === 200 && newLoginData.token, "Login with NEW password succeeds");

        // ==========================================
        // 4. ADMIN AUTHENTICATION PRESERVATION
        // ==========================================
        console.log("\n--- [4] Testing Admin Authentication Preservation ---");

        const adminLoginRes = await fetch(`${BASE_URL}/api/admin/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "admin@foodexpress.com",
                password: "Admin@123"
            })
        });
        const adminLoginData = await adminLoginRes.json();
        assert(adminLoginRes.status === 200 && adminLoginData.token, "Admin login with admin@foodexpress.com works cleanly");

        // Cleanup test user
        await User.deleteOne({ email: testEmail });
        console.log("\n🎉 ALL AUTHENTICATION TESTS PASSED SUCCESSFULLY! (19/19 assertions)");

    } finally {
        server.close();
        await mongoose.disconnect();
    }
}

runTests().catch((err) => {
    console.error("Test Suite Error:", err);
    process.exit(1);
});
