import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { apiRequest, CUSTOMER_TOKEN_KEY } from "../services/api";

function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // ==========================================
    // FETCH ORDERS
    // ==========================================

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                setError("");

                const token = localStorage.getItem(CUSTOMER_TOKEN_KEY);
                if (!token) {
                    setError("Please login to view your orders.");
                    return;
                }

                const data = await apiRequest("/orders");
                setOrders(Array.isArray(data.orders) ? data.orders : []);
            } catch (err) {
                console.error("Orders Error:", err);
                setError(err.message || "Something went wrong");
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
        const intervalId = window.setInterval(fetchOrders, 5000);
        return () => window.clearInterval(intervalId);
    }, []);

    // ==========================================
    // STATUS STYLE & ICON
    // ==========================================

    const getStatusStyle = (status) => {
        switch (status) {
            case "Pending":
                return "bg-amber-100 text-amber-800";
            case "Confirmed":
                return "bg-blue-100 text-blue-800";
            case "Preparing":
                return "bg-yellow-100 text-yellow-800";
            case "Ready":
                return "bg-purple-100 text-purple-800";
            case "Out for Delivery":
                return "bg-indigo-100 text-indigo-800";
            case "Delivered":
                return "bg-emerald-100 text-emerald-800";
            case "Completed":
                return "bg-green-100 text-green-800";
            case "Cancelled":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "Pending":
                return "⏳";
            case "Confirmed":
                return "👍";
            case "Preparing":
                return "👨‍🍳";
            case "Ready":
                return "🍽️";
            case "Out for Delivery":
                return "🛵";
            case "Delivered":
                return "✅";
            case "Completed":
                return "🎉";
            case "Cancelled":
                return "❌";
            default:
                return "📦";
        }
    };

    const formatDate = (date) => {
        if (!date) return "Unknown date";
        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <main className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-5xl mb-4">🍽️</div>
                        <p className="text-gray-600 font-semibold">Loading your orders...</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="min-h-screen py-10 px-4 sm:px-6">

                <div className="max-w-5xl mx-auto">

                    {/* HEADER */}

                    <div className="mb-8">

                        <h1 className="
                            text-3xl
                            sm:text-4xl
                            font-bold
                            text-gray-900
                        ">
                            My Orders 📦
                        </h1>

                        <p className="text-gray-500 mt-2">
                            Track your previous and current orders.
                        </p>

                    </div>

                    {/* ERROR */}

                    {error && (
                        <div className="
                            bg-red-50
                            border
                            border-red-200
                            text-red-600
                            rounded-xl
                            p-5
                            mb-6
                        ">
                            {error}
                        </div>
                    )}

                    {/* NO ORDERS */}

                    {!error && orders.length === 0 ? (

                        <div className="
                            bg-white
                            rounded-2xl
                            shadow-md
                            p-10
                            text-center
                        ">

                            <div className="text-6xl mb-4">
                                🛒
                            </div>

                            <h2 className="
                                text-2xl
                                font-bold
                                text-gray-800
                            ">
                                No Orders Yet
                            </h2>

                            <p className="
                                text-gray-500
                                mt-2
                            ">
                                Your completed orders will appear here.
                            </p>

                        </div>

                    ) : (

                        <div className="space-y-6">

                            {orders.map((order) => (

                                <div
                                    key={order._id}
                                    className="
                                        bg-white
                                        rounded-2xl
                                        shadow-md
                                        hover:shadow-lg
                                        transition
                                        duration-300
                                        overflow-hidden
                                    "
                                >

                                    {/* ORDER HEADER */}

                                    <div className="
                                        p-5
                                        sm:p-6
                                        border-b
                                        flex
                                        flex-col
                                        sm:flex-row
                                        sm:justify-between
                                        sm:items-center
                                        gap-3
                                    ">

                                        <div>

                                            <p className="
                                                text-sm
                                                text-gray-500
                                            ">
                                                Order ID
                                            </p>

                                            <h2 className="
                                                text-xl
                                                font-bold
                                                text-gray-900
                                                break-all
                                            ">
                                                #{order._id}
                                            </h2>

                                        </div>

                                        <span
                                            className={`
                                                inline-flex
                                                w-fit
                                                px-4
                                                py-2
                                                rounded-full
                                                text-sm
                                                font-semibold
                                                ${getStatusStyle(order.status)}
                                            `}
                                        >
                                            {getStatusIcon(order.status)}

                                            <span className="ml-1">
                                                {order.status || "Pending"}
                                            </span>
                                        </span>

                                    </div>

                                    {/* ORDER DETAILS */}

                                    <div className="p-5 sm:p-6">

                                        <h3 className="
                                            font-semibold
                                            text-gray-800
                                            mb-4
                                        ">
                                            🍽️ Ordered Items
                                        </h3>

                                        <div className="space-y-3">

                                            {Array.isArray(order.items) &&
                                                order.items.map(
                                                    (item, index) => (

                                                        <div
                                                            key={index}
                                                            className="
                                                                flex
                                                                justify-between
                                                                items-center
                                                                bg-gray-50
                                                                rounded-lg
                                                                px-4
                                                                py-3
                                                                gap-3
                                                            "
                                                        >

                                                            <div>

                                                                <p className="
                                                                    text-gray-800
                                                                    font-semibold
                                                                ">
                                                                    {item.name}
                                                                </p>

                                                                <p className="
                                                                    text-sm
                                                                    text-gray-500
                                                                ">
                                                                    ₹{item.price} ×{" "}
                                                                    {item.quantity}
                                                                </p>

                                                            </div>

                                                            <p className="
                                                                font-bold
                                                                text-gray-800
                                                            ">
                                                                ₹
                                                                {Number(item.price) *
                                                                    Number(item.quantity)}
                                                            </p>

                                                        </div>

                                                    )
                                                )}

                                        </div>

                                        {/* CUSTOMER INFORMATION */}

                                        <div className="
                                            mt-6
                                            bg-orange-50
                                            rounded-xl
                                            p-4
                                        ">

                                            <h3 className="
                                                font-semibold
                                                text-gray-800
                                                mb-3
                                            ">
                                                📍 Order Information
                                            </h3>

                                            <div className="
                                                grid
                                                grid-cols-1
                                                sm:grid-cols-2
                                                gap-3
                                                text-sm
                                            ">

                                                <p>
                                                    <span className="text-gray-500">
                                                        Customer:
                                                    </span>{" "}
                                                    <span className="font-semibold">
                                                        {order.customerName || "-"}
                                                    </span>
                                                </p>

                                                <p>
                                                    <span className="text-gray-500">
                                                        Mobile:
                                                    </span>{" "}
                                                    <span className="font-semibold">
                                                        {order.mobile || "-"}
                                                    </span>
                                                </p>

                                                <p>
                                                    <span className="text-gray-500">
                                                        Order Type:
                                                    </span>{" "}
                                                    <span className="font-semibold">

                                                        {order.orderType ===
                                                        "home_delivery"
                                                            ? "🏠 Home Delivery"
                                                            : order.orderType ===
                                                              "pickup"
                                                            ? "🏨 Pickup from Hotel"
                                                            : "🍽️ Dine In"}

                                                    </span>
                                                </p>

                                                {order.address && (
                                                    <p>
                                                        <span className="text-gray-500">
                                                            Address:
                                                        </span>{" "}
                                                        <span className="font-semibold">
                                                            {order.address}
                                                        </span>
                                                    </p>
                                                )}

                                            </div>

                                        </div>

                                        {/* PAYMENT */}

                                        <div className="
                                            mt-6
                                            grid
                                            grid-cols-1
                                            sm:grid-cols-2
                                            gap-4
                                        ">

                                            <div className="
                                                bg-gray-50
                                                rounded-xl
                                                p-4
                                            ">

                                                <p className="
                                                    text-sm
                                                    text-gray-500
                                                ">
                                                    Payment
                                                </p>

                                                <p className="
                                                    font-semibold
                                                    text-gray-800
                                                    mt-1
                                                ">
                                                    {order.paymentMethod || "UPI"}
                                                </p>

                                                <p className="
                                                    text-sm
                                                    text-green-600
                                                    font-semibold
                                                ">
                                                    {order.paymentStatus || "Paid"}
                                                </p>

                                            </div>

                                            <div className="
                                                bg-gray-50
                                                rounded-xl
                                                p-4
                                            ">

                                                <p className="
                                                    text-sm
                                                    text-gray-500
                                                ">
                                                    Order Date
                                                </p>

                                                <p className="
                                                    font-medium
                                                    text-gray-700
                                                    mt-1
                                                ">
                                                    📅{" "}
                                                    {formatDate(
                                                        order.createdAt
                                                    )}
                                                </p>

                                            </div>

                                        </div>

                                        {/* TOTAL */}

                                        <div className="
                                            mt-6
                                            pt-5
                                            border-t
                                            flex
                                            justify-between
                                            items-center
                                        ">

                                            <p className="
                                                text-sm
                                                text-gray-500
                                            ">
                                                Total Amount
                                            </p>

                                            <p className="
                                                text-2xl
                                                font-bold
                                                text-orange-500
                                            ">
                                                ₹{order.totalAmount}
                                            </p>

                                        </div>

                                    </div>

                                </div>

                            ))}

                        </div>

                    )}

                </div>

            </main>

            <Footer />

        </div>
    );
}

export default Orders;
