import { useState } from "react";
import { useNavigate } from "react-router-dom";

import qr from "../assets/upi-qr.png";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { apiRequest, CUSTOMER_TOKEN_KEY } from "../services/api";

function Checkout() {
    const navigate = useNavigate();

    const {
        cart,
        totalPrice,
        clearCart
    } = useCart();

    const { showToast } = useToast();

    const [showQR, setShowQR] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);

    // Amount saved before clearing cart
    const [placedAmount, setPlacedAmount] = useState(0);

    // Order type used by frontend
    // delivery / pickup / dine_in
    const [orderType, setOrderType] = useState("delivery");

    // Customer information
    const [form, setForm] = useState({
        name: "",
        mobile: "",

        // Delivery
        address: "",
        landmark: "",
        instructions: "",

        // Dine-in
        tableNumber: "",
        arrivalTime: ""
    });

    // =========================================================
    // HANDLE INPUT
    // =========================================================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // =========================================================
    // CHANGE ORDER TYPE
    // =========================================================

    const handleOrderTypeChange = (type) => {
        setOrderType(type);

        if (type === "delivery") {
            setForm((prev) => ({
                ...prev,
                tableNumber: "",
                arrivalTime: ""
            }));
        }

        if (type === "pickup") {
            setForm((prev) => ({
                ...prev,
                address: "",
                landmark: "",
                instructions: "",
                tableNumber: "",
                arrivalTime: ""
            }));
        }

        if (type === "dine_in") {
            setForm((prev) => ({
                ...prev,
                address: "",
                landmark: "",
                instructions: ""
            }));
        }
    };

    // =========================================================
    // FRONTEND ORDER TYPE -> BACKEND ORDER TYPE
    // =========================================================

    const getBackendOrderType = () => {
        if (orderType === "delivery") {
            return "home_delivery";
        }

        if (orderType === "pickup") {
            return "pickup";
        }

        return "dine_in";
    };

    // =========================================================
    // ORDER TYPE TITLE
    // =========================================================

    const getOrderTypeTitle = () => {
        if (orderType === "delivery") {
            return "Home Delivery";
        }

        if (orderType === "pickup") {
            return "Pickup from Hotel";
        }

        return "Dine-In at Hotel";
    };

    // =========================================================
    // ORDER TYPE ICON
    // =========================================================

    const getOrderTypeIcon = () => {
        if (orderType === "delivery") {
            return "🏠";
        }

        if (orderType === "pickup") {
            return "🏨";
        }

        return "🍽️";
    };

    // =========================================================
    // VALIDATE CHECKOUT
    // =========================================================

    const placeOrder = () => {
        if (!cart || cart.length === 0) {
            showToast("Your cart is empty", "error");
            return;
        }

        if (!form.name.trim()) {
            showToast("Please enter your name", "error");
            return;
        }

        if (!form.mobile.trim()) {
            showToast("Please enter your mobile number", "error");
            return;
        }

        if (!/^[0-9]{10}$/.test(form.mobile.trim())) {
            showToast(
                "Enter a valid 10-digit mobile number",
                "error"
            );
            return;
        }

        // -----------------------------------------------------
        // DELIVERY VALIDATION
        // -----------------------------------------------------

        if (orderType === "delivery") {
            if (!form.address.trim()) {
                showToast(
                    "Please enter your delivery address",
                    "error"
                );
                return;
            }
        }

        // -----------------------------------------------------
        // DINE-IN VALIDATION
        // -----------------------------------------------------

        if (orderType === "dine_in") {
            if (!form.tableNumber.trim()) {
                showToast(
                    "Please select your table number",
                    "error"
                );
                return;
            }

            if (!form.arrivalTime.trim()) {
                showToast(
                    "Please select your expected arrival time",
                    "error"
                );
                return;
            }
        }

        // Open payment QR
        setShowQR(true);
    };

    // =========================================================
    // PAYMENT DONE
    // =========================================================

    const paymentDone = async () => {
        try {
            // -------------------------------------------------
            // CHECK LOGIN
            // -------------------------------------------------

            const token = localStorage.getItem(CUSTOMER_TOKEN_KEY);

            if (!token) {
                showToast(
                    "Please login before placing an order.",
                    "error"
                );

                setShowQR(false);

                navigate("/login");

                return;
            }

            // -------------------------------------------------
            // CHECK CART
            // -------------------------------------------------

            if (!cart || cart.length === 0) {
                showToast(
                    "Your cart is empty.",
                    "error"
                );

                setShowQR(false);

                return;
            }

            // -------------------------------------------------
            // SAVE TOTAL BEFORE CLEARING CART
            // -------------------------------------------------

            const finalAmount = Number(totalPrice);

            setPlacedAmount(finalAmount);

            // -------------------------------------------------
            // PREPARE ORDER ITEMS
            // -------------------------------------------------

            const orderItems = cart.map((item) => {
                const price =
                    typeof item.price === "number"
                        ? item.price
                        : Number(
                            String(item.price)
                                .replace(/[₹,]/g, "")
                                .trim()
                        );

                return {
                    foodId: String(item.id),
                    name: item.name,
                    price: Number(price),
                    quantity: Number(item.quantity)
                };
            });

            // -------------------------------------------------
            // VALIDATE ITEMS
            // -------------------------------------------------

            const invalidItem = orderItems.find(
                (item) =>
                    !item.foodId ||
                    !item.name ||
                    !Number.isFinite(item.price) ||
                    item.price < 0 ||
                    !Number.isInteger(item.quantity) ||
                    item.quantity < 1
            );

            if (invalidItem) {
                console.error(
                    "Invalid order item:",
                    invalidItem
                );

                showToast(
                    "Some cart items are invalid. Please try again.",
                    "error"
                );

                return;
            }

            // -------------------------------------------------
            // BACKEND ORDER TYPE
            // -------------------------------------------------

            const backendOrderType =
                getBackendOrderType();

            // -------------------------------------------------
            // BACKEND ORDER DATA
            // -------------------------------------------------

            const orderData = {
                customerName: form.name.trim(),

                mobile: form.mobile.trim(),

                // IMPORTANT:
                // delivery -> home_delivery
                // pickup -> pickup
                // dine_in -> dine_in
                orderType: backendOrderType,

                // Backend schema expects "address"
                address:
                    orderType === "delivery"
                        ? form.address.trim()
                        : "",

                tableNumber:
                    orderType === "dine_in"
                        ? form.tableNumber
                        : "",

                items: orderItems,

                totalAmount: finalAmount,

                paymentMethod: "UPI",

                // IMPORTANT:
                // Mongoose enum is:
                // pending / paid / failed
                  paymentStatus: "paid",

                // Initial status is always assigned by the backend.
            };

            // -------------------------------------------------
            // DEBUG
            // -------------------------------------------------

            console.log(
                "===================================="
            );

            console.log(
                "ORDER READY FOR BACKEND:"
            );

            console.log(
                JSON.stringify(
                    orderData,
                    null,
                    2
                )
            );

            console.log(
                "===================================="
            );

            // -------------------------------------------------
            // SEND TO BACKEND
            // -------------------------------------------------

            const data = await apiRequest("/orders", {
                method: "POST",
                body: JSON.stringify(orderData)
            });

            console.log(
                "BACKEND ORDER RESPONSE:",
                data
            );

            // -------------------------------------------------
            // BACKEND ERROR
            // -------------------------------------------------

            // -------------------------------------------------
            // SUCCESS
            // -------------------------------------------------

            console.log(
                "ORDER SAVED SUCCESSFULLY:",
                data
            );

            // Close QR
            setShowQR(false);

            // Show success screen
            setOrderPlaced(true);

            // Clear cart AFTER successful backend save
            clearCart();

            showToast(
                "Payment successful! Order placed.",
                "success"
            );

        } catch (error) {
            console.error(
                "ORDER CREATION ERROR:",
                error
            );

            showToast(
                error.message ||
                "Could not place order.",
                "error"
            );
        }
    };

    // =========================================================
    // JSX
    // =========================================================

    return (
        <div className="min-h-screen bg-gray-50">

            <Navbar />

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="mb-8">

                    <h1 className="
                        text-3xl
                        sm:text-4xl
                        font-bold
                        text-gray-800
                    ">
                        Checkout 💳
                    </h1>

                    <p className="text-gray-500 mt-2">
                        Choose how you want to receive your food.
                    </p>

                </div>

                {/* =================================================
                    SUCCESS SCREEN
                ================================================= */}

                {orderPlaced ? (

                    <div className="
                        bg-white
                        rounded-2xl
                        shadow-md
                        p-8
                        sm:p-12
                        text-center
                    ">

                        <div className="
                            w-24
                            h-24
                            mx-auto
                            rounded-full
                            bg-green-100
                            flex
                            items-center
                            justify-center
                            text-5xl
                        ">
                            ✅
                        </div>

                        <h2 className="
                            text-3xl
                            font-bold
                            text-green-600
                            mt-6
                        ">
                            Order Placed Successfully!
                        </h2>

                        <p className="
                            text-gray-500
                            mt-3
                        ">
                            Thank you, {form.name}.
                        </p>

                        <div className="
                            mt-5
                            inline-flex
                            items-center
                            gap-2
                            bg-orange-50
                            text-orange-600
                            px-5
                            py-3
                            rounded-full
                            font-bold
                        ">

                            <span>
                                {getOrderTypeIcon()}
                            </span>

                            <span>
                                {getOrderTypeTitle()}
                            </span>

                        </div>

                        {/* DELIVERY */}

                        {orderType === "delivery" && (

                            <div className="
                                mt-6
                                bg-gray-50
                                rounded-xl
                                p-5
                                text-left
                                max-w-md
                                mx-auto
                            ">

                                <p className="
                                    text-sm
                                    text-gray-500
                                ">
                                    Delivery Address
                                </p>

                                <p className="
                                    font-semibold
                                    text-gray-800
                                    mt-1
                                ">
                                    {form.address}
                                </p>

                                {form.landmark && (

                                    <p className="
                                        text-sm
                                        text-gray-500
                                        mt-2
                                    ">
                                        Landmark: {form.landmark}
                                    </p>

                                )}

                            </div>

                        )}

                        {/* PICKUP */}

                        {orderType === "pickup" && (

                            <div className="
                                mt-6
                                bg-blue-50
                                rounded-xl
                                p-5
                                max-w-md
                                mx-auto
                            ">

                                <p className="
                                    text-blue-700
                                    font-semibold
                                ">
                                    🏨 Your order will be ready
                                    for pickup at the hotel.
                                </p>

                            </div>

                        )}

                        {/* DINE-IN */}

                        {orderType === "dine_in" && (

                            <div className="
                                mt-6
                                bg-purple-50
                                rounded-xl
                                p-5
                                max-w-md
                                mx-auto
                            ">

                                <p className="
                                    text-purple-700
                                    font-semibold
                                ">
                                    🍽️ Table {form.tableNumber}
                                </p>

                                <p className="
                                    text-sm
                                    text-purple-600
                                    mt-1
                                ">
                                    Expected arrival:{" "}
                                    {form.arrivalTime}
                                </p>

                            </div>

                        )}

                        {/* AMOUNT */}

                        <div className="
                            mt-6
                            bg-gray-50
                            rounded-xl
                            p-5
                        ">

                            <p className="text-gray-500">
                                Order Amount
                            </p>

                            <p className="
                                text-2xl
                                font-bold
                                text-orange-500
                                mt-1
                            ">
                                ₹{placedAmount}
                            </p>

                            <p className="
                                text-sm
                                text-green-600
                                mt-2
                                font-semibold
                            ">
                                Payment Status: Paid
                            </p>

                        </div>

                        {/* BUTTONS */}

                        <div className="
                            flex
                            flex-col
                            sm:flex-row
                            gap-3
                            justify-center
                            mt-8
                        ">

                            <button
                                onClick={() =>
                                    navigate("/orders")
                                }
                                className="
                                    bg-orange-500
                                    hover:bg-orange-600
                                    text-white
                                    px-6
                                    py-3
                                    rounded-xl
                                    font-bold
                                "
                            >
                                📦 View Orders
                            </button>

                            <button
                                onClick={() =>
                                    navigate("/")
                                }
                                className="
                                    border
                                    border-gray-300
                                    hover:bg-gray-100
                                    px-6
                                    py-3
                                    rounded-xl
                                    font-bold
                                "
                            >
                                🏠 Continue Shopping
                            </button>

                        </div>

                    </div>

                ) : (

                    /* =================================================
                       CHECKOUT SCREEN
                    ================================================= */

                    <div className="
                        grid
                        grid-cols-1
                        lg:grid-cols-3
                        gap-6
                    ">

                        {/* =================================================
                            CUSTOMER DETAILS
                        ================================================= */}

                        <div className="
                            lg:col-span-2
                            bg-white
                            rounded-2xl
                            shadow-md
                            p-6
                            sm:p-8
                        ">

                            <h2 className="
                                text-2xl
                                font-bold
                                text-gray-800
                                mb-6
                            ">
                                How would you like your food?
                            </h2>

                            {/* ORDER TYPES */}

                            <div className="
                                grid
                                grid-cols-1
                                sm:grid-cols-3
                                gap-4
                                mb-8
                            ">

                                {/* DELIVERY */}

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleOrderTypeChange(
                                            "delivery"
                                        )
                                    }
                                    className={`
                                        p-5
                                        rounded-2xl
                                        border-2
                                        text-left
                                        transition

                                        ${
                                            orderType === "delivery"
                                                ? "border-orange-500 bg-orange-50"
                                                : "border-gray-200 hover:border-orange-300"
                                        }
                                    `}
                                >

                                    <div className="text-3xl">
                                        🏠
                                    </div>

                                    <h3 className="
                                        font-bold
                                        text-gray-800
                                        mt-3
                                    ">
                                        Home Delivery
                                    </h3>

                                    <p className="
                                        text-xs
                                        text-gray-500
                                        mt-1
                                    ">
                                        Get food delivered to
                                        your home.
                                    </p>

                                </button>

                                {/* PICKUP */}

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleOrderTypeChange(
                                            "pickup"
                                        )
                                    }
                                    className={`
                                        p-5
                                        rounded-2xl
                                        border-2
                                        text-left
                                        transition

                                        ${
                                            orderType === "pickup"
                                                ? "border-orange-500 bg-orange-50"
                                                : "border-gray-200 hover:border-orange-300"
                                        }
                                    `}
                                >

                                    <div className="text-3xl">
                                        🏨
                                    </div>

                                    <h3 className="
                                        font-bold
                                        text-gray-800
                                        mt-3
                                    ">
                                        Pickup
                                    </h3>

                                    <p className="
                                        text-xs
                                        text-gray-500
                                        mt-1
                                    ">
                                        Collect your food
                                        from the hotel.
                                    </p>

                                </button>

                                {/* DINE IN */}

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleOrderTypeChange(
                                            "dine_in"
                                        )
                                    }
                                    className={`
                                        p-5
                                        rounded-2xl
                                        border-2
                                        text-left
                                        transition

                                        ${
                                            orderType === "dine_in"
                                                ? "border-orange-500 bg-orange-50"
                                                : "border-gray-200 hover:border-orange-300"
                                        }
                                    `}
                                >

                                    <div className="text-3xl">
                                        🍽️
                                    </div>

                                    <h3 className="
                                        font-bold
                                        text-gray-800
                                        mt-3
                                    ">
                                        Dine-In
                                    </h3>

                                    <p className="
                                        text-xs
                                        text-gray-500
                                        mt-1
                                    ">
                                        Order food and eat
                                        at the hotel.
                                    </p>

                                </button>

                            </div>

                            {/* CUSTOMER DETAILS */}

                            <h2 className="
                                text-xl
                                font-bold
                                text-gray-800
                                mb-5
                            ">
                                Customer Details
                            </h2>

                            {/* NAME */}

                            <div className="mb-5">

                                <label className="
                                    block
                                    text-sm
                                    font-semibold
                                    text-gray-700
                                    mb-2
                                ">
                                    Full Name
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Enter your full name"
                                    className="
                                        w-full
                                        border
                                        border-gray-300
                                        p-3
                                        rounded-xl
                                        outline-none
                                        focus:ring-2
                                        focus:ring-orange-500
                                    "
                                />

                            </div>

                            {/* MOBILE */}

                            <div className="mb-6">

                                <label className="
                                    block
                                    text-sm
                                    font-semibold
                                    text-gray-700
                                    mb-2
                                ">
                                    Mobile Number
                                </label>

                                <input
                                    type="tel"
                                    name="mobile"
                                    value={form.mobile}
                                    onChange={handleChange}
                                    placeholder="10-digit mobile number"
                                    maxLength="10"
                                    inputMode="numeric"
                                    className="
                                        w-full
                                        border
                                        border-gray-300
                                        p-3
                                        rounded-xl
                                        outline-none
                                        focus:ring-2
                                        focus:ring-orange-500
                                    "
                                />

                            </div>

                            {/* DELIVERY DETAILS */}

                            {orderType === "delivery" && (

                                <div>

                                    <h2 className="
                                        text-xl
                                        font-bold
                                        text-gray-800
                                        mb-5
                                    ">
                                        Delivery Details 🏠
                                    </h2>

                                    {/* ADDRESS */}

                                    <div className="mb-5">

                                        <label className="
                                            block
                                            text-sm
                                            font-semibold
                                            text-gray-700
                                            mb-2
                                        ">
                                            Delivery Address
                                        </label>

                                        <textarea
                                            name="address"
                                            value={form.address}
                                            onChange={handleChange}
                                            placeholder="Enter your complete home address"
                                            rows="4"
                                            className="
                                                w-full
                                                border
                                                border-gray-300
                                                p-3
                                                rounded-xl
                                                outline-none
                                                resize-none
                                                focus:ring-2
                                                focus:ring-orange-500
                                            "
                                        />

                                    </div>

                                    {/* LANDMARK */}

                                    <div className="mb-5">

                                        <label className="
                                            block
                                            text-sm
                                            font-semibold
                                            text-gray-700
                                            mb-2
                                        ">
                                            Landmark
                                            <span className="
                                                text-gray-400
                                                font-normal
                                            ">
                                                {" "}(
                                                Optional)
                                            </span>
                                        </label>

                                        <input
                                            type="text"
                                            name="landmark"
                                            value={form.landmark}
                                            onChange={handleChange}
                                            placeholder="Example: Near XYZ College"
                                            className="
                                                w-full
                                                border
                                                border-gray-300
                                                p-3
                                                rounded-xl
                                                outline-none
                                                focus:ring-2
                                                focus:ring-orange-500
                                            "
                                        />

                                    </div>

                                    {/* INSTRUCTIONS */}

                                    <div className="mb-6">

                                        <label className="
                                            block
                                            text-sm
                                            font-semibold
                                            text-gray-700
                                            mb-2
                                        ">
                                            Delivery Instructions
                                            <span className="
                                                text-gray-400
                                                font-normal
                                            ">
                                                {" "}(
                                                Optional)
                                            </span>
                                        </label>

                                        <textarea
                                            name="instructions"
                                            value={form.instructions}
                                            onChange={handleChange}
                                            placeholder="Example: Call me when you arrive"
                                            rows="3"
                                            className="
                                                w-full
                                                border
                                                border-gray-300
                                                p-3
                                                rounded-xl
                                                outline-none
                                                resize-none
                                                focus:ring-2
                                                focus:ring-orange-500
                                            "
                                        />

                                    </div>

                                </div>

                            )}

                            {/* PICKUP */}

                            {orderType === "pickup" && (

                                <div className="
                                    bg-blue-50
                                    border
                                    border-blue-100
                                    rounded-2xl
                                    p-5
                                    mb-6
                                ">

                                    <h3 className="
                                        font-bold
                                        text-blue-800
                                        text-lg
                                    ">
                                        🏨 Pickup from Hotel
                                    </h3>

                                    <p className="
                                        text-blue-700
                                        text-sm
                                        mt-2
                                    ">
                                        Your food will be prepared
                                        and kept ready at the hotel.
                                        You can collect it when you
                                        arrive.
                                    </p>

                                </div>

                            )}

                            {/* DINE IN */}

                            {orderType === "dine_in" && (

                                <div>

                                    <h2 className="
                                        text-xl
                                        font-bold
                                        text-gray-800
                                        mb-5
                                    ">
                                        Dine-In Details 🍽️
                                    </h2>

                                    {/* TABLE */}

                                    <div className="mb-5">

                                        <label className="
                                            block
                                            text-sm
                                            font-semibold
                                            text-gray-700
                                            mb-2
                                        ">
                                            Table Number
                                        </label>

                                        <select
                                            name="tableNumber"
                                            value={form.tableNumber}
                                            onChange={handleChange}
                                            className="
                                                w-full
                                                border
                                                border-gray-300
                                                p-3
                                                rounded-xl
                                                outline-none
                                                focus:ring-2
                                                focus:ring-orange-500
                                                bg-white
                                            "
                                        >

                                            <option value="">
                                                Select your table
                                            </option>

                                            {[
                                                1, 2, 3, 4,
                                                5, 6, 7, 8
                                            ].map((table) => (

                                                <option
                                                    key={table}
                                                    value={table}
                                                >
                                                    Table {table}
                                                </option>

                                            ))}

                                        </select>

                                    </div>

                                    {/* ARRIVAL TIME */}

                                    <div className="mb-6">

                                        <label className="
                                            block
                                            text-sm
                                            font-semibold
                                            text-gray-700
                                            mb-2
                                        ">
                                            Expected Arrival Time
                                        </label>

                                        <input
                                            type="time"
                                            name="arrivalTime"
                                            value={form.arrivalTime}
                                            onChange={handleChange}
                                            className="
                                                w-full
                                                border
                                                border-gray-300
                                                p-3
                                                rounded-xl
                                                outline-none
                                                focus:ring-2
                                                focus:ring-orange-500
                                            "
                                        />

                                    </div>

                                </div>

                            )}

                            {/* PAYMENT */}

                            <div className="
                                bg-orange-50
                                border
                                border-orange-100
                                rounded-xl
                                p-4
                            ">

                                <p className="
                                    font-bold
                                    text-gray-800
                                ">
                                    💳 Payment Method
                                </p>

                                <p className="
                                    text-sm
                                    text-gray-500
                                    mt-1
                                ">
                                    UPI Payment
                                </p>

                            </div>

                            {/* PLACE ORDER */}

                            <button
                                onClick={placeOrder}
                                className="
                                    w-full
                                    mt-6
                                    bg-orange-500
                                    hover:bg-orange-600
                                    text-white
                                    py-3
                                    rounded-xl
                                    font-bold
                                    text-lg
                                    transition
                                "
                            >
                                💳 Pay ₹{totalPrice} & Place Order
                            </button>

                        </div>

                        {/* =================================================
                            ORDER SUMMARY
                        ================================================= */}

                        <div className="
                            bg-white
                            rounded-2xl
                            shadow-md
                            p-6
                            h-fit
                        ">

                            <h2 className="
                                text-xl
                                font-bold
                                text-gray-800
                                mb-5
                            ">
                                Order Summary
                            </h2>

                            {/* ORDER TYPE */}

                            <div className="
                                bg-orange-50
                                rounded-xl
                                p-4
                                mb-5
                            ">

                                <p className="
                                    text-xs
                                    text-gray-500
                                ">
                                    Order Type
                                </p>

                                <p className="
                                    font-bold
                                    text-orange-600
                                    mt-1
                                ">
                                    {getOrderTypeIcon()}{" "}
                                    {getOrderTypeTitle()}
                                </p>

                            </div>

                            {/* CART */}

                            {cart.length === 0 ? (

                                <p className="text-gray-500">
                                    Your cart is empty.
                                </p>

                            ) : (

                                <div className="space-y-4">

                                    {cart.map((item) => {

                                        const price =
                                            typeof item.price === "number"
                                                ? item.price
                                                : Number(
                                                    String(item.price)
                                                        .replace(
                                                            /[₹,]/g,
                                                            ""
                                                        )
                                                ) || 0;

                                        const itemTotal =
                                            price *
                                            Number(item.quantity);

                                        return (

                                            <div
                                                key={item.id}
                                                className="
                                                    flex
                                                    justify-between
                                                    gap-3
                                                    border-b
                                                    pb-3
                                                "
                                            >

                                                <div>

                                                    <p className="
                                                        font-semibold
                                                        text-gray-800
                                                    ">
                                                        {item.name}
                                                    </p>

                                                    <p className="
                                                        text-sm
                                                        text-gray-500
                                                    ">
                                                        ₹{price} ×{" "}
                                                        {item.quantity}
                                                    </p>

                                                </div>

                                                <p className="
                                                    font-bold
                                                    text-gray-800
                                                ">
                                                    ₹{itemTotal}
                                                </p>

                                            </div>

                                        );
                                    })}

                                    <div className="
                                        flex
                                        justify-between
                                        pt-3
                                        text-xl
                                        font-bold
                                    ">

                                        <span>
                                            Total
                                        </span>

                                        <span className="
                                            text-orange-500
                                        ">
                                            ₹{totalPrice}
                                        </span>

                                    </div>

                                </div>

                            )}

                        </div>

                    </div>

                )}

            </main>

            <Footer />

            {/* =================================================
                UPI QR MODAL
            ================================================= */}

            {showQR && (

                <div className="
                    fixed
                    inset-0
                    z-50
                    bg-black/60
                    flex
                    items-center
                    justify-center
                    p-4
                ">

                    <div className="
                        bg-white
                        rounded-2xl
                        shadow-2xl
                        w-full
                        max-w-md
                        p-6
                        text-center
                    ">

                        {/* CLOSE */}

                        <button
                            onClick={() =>
                                setShowQR(false)
                            }
                            className="
                                float-right
                                text-gray-500
                                hover:text-red-500
                                text-xl
                            "
                        >
                            ✕
                        </button>

                        <h2 className="
                            text-2xl
                            font-bold
                            text-gray-800
                            mt-2
                        ">
                            Scan UPI QR 📱
                        </h2>

                        <p className="
                            text-gray-500
                            mt-2
                        ">
                            Pay using Google Pay,
                            PhonePe or Paytm
                        </p>

                        {/* QR */}

                        <div className="
                            mt-5
                            flex
                            justify-center
                        ">

                            <img
                                src={qr}
                                alt="FoodExpress UPI QR Code"
                                className="
                                    w-56
                                    h-56
                                    object-contain
                                    rounded-lg
                                "
                            />

                        </div>

                        {/* AMOUNT */}

                        <div className="
                            bg-orange-50
                            rounded-xl
                            p-3
                            mt-5
                        ">

                            <p className="text-gray-500">
                                Amount to Pay
                            </p>

                            <p className="
                                text-2xl
                                font-bold
                                text-orange-500
                            ">
                                ₹{totalPrice}
                            </p>

                        </div>

                        {/* PAYMENT DONE */}

                        <button
                            onClick={paymentDone}
                            className="
                                w-full
                                mt-5
                                bg-green-600
                                hover:bg-green-700
                                text-white
                                py-3
                                rounded-xl
                                font-bold
                            "
                        >
                            ✅ Payment Done
                        </button>

                        {/* CANCEL */}

                        <button
                            onClick={() =>
                                setShowQR(false)
                            }
                            className="
                                mt-3
                                text-red-500
                                hover:text-red-700
                                font-semibold
                            "
                        >
                            Cancel
                        </button>

                    </div>

                </div>

            )}

        </div>
    );
}

export default Checkout;
