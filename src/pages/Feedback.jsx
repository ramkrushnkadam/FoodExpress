import { useEffect, useState, useId } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { apiRequest, getBackendAssetUrl, CUSTOMER_TOKEN_KEY } from "../services/api";
import { useToast } from "../context/ToastContext";

function Feedback() {
    const { showToast } = useToast();
    const commentInputId = useId();

    const [eligibleOrders, setEligibleOrders] = useState([]);
    const [myReviews, setMyReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Filter State for My Reviews
    const [filterType, setFilterType] = useState("all"); // "all" | "date_range" | "month"
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [month, setMonth] = useState(String(new Date().getMonth() + 1));
    const [year, setYear] = useState(String(new Date().getFullYear()));
    const [filterError, setFilterError] = useState("");
    const [isFiltered, setIsFiltered] = useState(false);
    const [filterLoading, setFilterLoading] = useState(false);

    // Modal / Active Review Form State
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");
    const [selectedImages, setSelectedImages] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");

    // Full-size image preview modal
    const [previewImage, setPreviewImage] = useState(null);

    const token = localStorage.getItem(CUSTOMER_TOKEN_KEY);

    const fetchMyReviews = async (params = {}) => {
        try {
            setFilterLoading(true);
            const qs = new URLSearchParams();
            if (params.filterType && params.filterType !== "all") {
                qs.append("filterType", params.filterType);
                if (params.filterType === "date_range") {
                    if (params.startDate) qs.append("startDate", params.startDate);
                    if (params.endDate) qs.append("endDate", params.endDate);
                } else if (params.filterType === "month") {
                    if (params.month) qs.append("month", params.month);
                    if (params.year) qs.append("year", params.year);
                }
            }
            const queryStr = qs.toString() ? `?${qs.toString()}` : "";
            const reviewsRes = await apiRequest(`/reviews/my-reviews${queryStr}`);
            setMyReviews(Array.isArray(reviewsRes.reviews) ? reviewsRes.reviews : []);
        } catch (err) {
            console.error("Filter reviews error:", err);
            showToast(err.message || "Failed to load filtered reviews", "error");
        } finally {
            setFilterLoading(false);
        }
    };

    const fetchData = async () => {
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            setError("");
            const [ordersRes, reviewsRes] = await Promise.all([
                apiRequest("/reviews/eligible-orders"),
                apiRequest("/reviews/my-reviews")
            ]);
            setEligibleOrders(Array.isArray(ordersRes.orders) ? ordersRes.orders : []);
            setMyReviews(Array.isArray(reviewsRes.reviews) ? reviewsRes.reviews : []);
        } catch (err) {
            console.error("Feedback fetch error:", err);
            setError(err.message || "Failed to load feedback data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token]);

    const handleApplyFilter = async () => {
        setFilterError("");
        if (filterType === "date_range") {
            if (!startDate || !endDate) {
                setFilterError("Please select both start date and end date.");
                return;
            }
            if (new Date(startDate) > new Date(endDate)) {
                setFilterError("Start date cannot be after end date.");
                return;
            }
            setIsFiltered(true);
            await fetchMyReviews({ filterType: "date_range", startDate, endDate });
        } else if (filterType === "month") {
            if (!month || !year) {
                setFilterError("Please select both month and year.");
                return;
            }
            setIsFiltered(true);
            await fetchMyReviews({ filterType: "month", month, year });
        } else {
            handleClearFilter();
        }
    };

    const handleClearFilter = async () => {
        setFilterType("all");
        setStartDate("");
        setEndDate("");
        setFilterError("");
        setIsFiltered(false);
        await fetchMyReviews({ filterType: "all" });
    };

    const openReviewModal = (order) => {
        setSelectedOrder(order);
        setRating(0);
        setHoverRating(0);
        setComment("");
        setSelectedImages([]);
        setFormError("");
    };

    const closeReviewModal = () => {
        setSelectedOrder(null);
        setRating(0);
        setHoverRating(0);
        setComment("");
        setSelectedImages([]);
        setFormError("");
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        setFormError("");
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        const maxSizeBytes = 5 * 1024 * 1024; // 5MB

        const remainingSlots = 3 - selectedImages.length;
        if (remainingSlots <= 0) {
            setFormError("You can upload a maximum of 3 images.");
            return;
        }

        const validNewImages = [];
        for (const file of files.slice(0, remainingSlots)) {
            const ext = file.name.split(".").pop().toLowerCase();
            const isAllowedExt = ["jpg", "jpeg", "png", "webp"].includes(ext);

            if (!allowedTypes.includes(file.type) && !isAllowedExt) {
                setFormError("Only JPG, JPEG, PNG, and WebP images are allowed.");
                return;
            }
            if (file.size > maxSizeBytes) {
                setFormError(`"${file.name}" exceeds the 5MB file size limit.`);
                return;
            }

            validNewImages.push({
                file,
                preview: URL.createObjectURL(file)
            });
        }

        setSelectedImages((prev) => [...prev, ...validNewImages]);
        e.target.value = "";
    };

    const removeImage = (indexToRemove) => {
        setSelectedImages((prev) => {
            const item = prev[indexToRemove];
            if (item?.preview) URL.revokeObjectURL(item.preview);
            return prev.filter((_, idx) => idx !== indexToRemove);
        });
    };

    const readFileAsBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!selectedOrder) return;

        if (rating < 1 || rating > 5) {
            setFormError("Please select a star rating (1 to 5 stars).");
            return;
        }

        try {
            setSubmitting(true);
            setFormError("");

            // Upload photos if any
            const uploadedUrls = [];
            for (const imgItem of selectedImages) {
                const b64 = await readFileAsBase64(imgItem.file);
                const uploadRes = await apiRequest("/reviews/upload", {
                    method: "POST",
                    body: JSON.stringify({
                        image: b64,
                        filename: imgItem.file.name
                    })
                });
                if (uploadRes?.url) {
                    uploadedUrls.push(uploadRes.url);
                }
            }

            await apiRequest("/reviews", {
                method: "POST",
                body: JSON.stringify({
                    orderId: selectedOrder._id,
                    rating,
                    comment: comment.trim(),
                    images: uploadedUrls
                })
            });

            showToast("Thank you! Your review has been submitted.", "success");
            closeReviewModal();
            // Refresh data to reflect the new review immediately
            await fetchData();
        } catch (err) {
            console.error("Submit review error:", err);
            setFormError(err.message || "Failed to submit review");
            showToast(err.message || "Failed to submit review", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Recent";
        return new Date(dateString).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    const getRatingLabel = (score) => {
        switch (score) {
            case 1:
                return "1 Star - Poor";
            case 2:
                return "2 Stars - Fair";
            case 3:
                return "3 Stars - Good";
            case 4:
                return "4 Stars - Very Good";
            case 5:
                return "5 Stars - Excellent";
            default:
                return "Select your rating";
        }
    };

    // -------------------------------------------------------------
    // Not Logged In View
    // -------------------------------------------------------------
    if (!token) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-between">
                <Navbar />
                <main className="max-w-3xl mx-auto px-6 py-20 text-center">
                    <div className="text-6xl mb-4">⭐</div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Customer Feedback & Reviews
                    </h1>
                    <p className="mt-3 text-gray-600 dark:text-gray-300">
                        Please sign in with your FoodExpress account to review your delivered orders and view your previous reviews.
                    </p>
                    <div className="mt-8">
                        <Link
                            to="/login"
                            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-xl shadow-md transition"
                        >
                            Sign In to Review Orders
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // -------------------------------------------------------------
    // Logged In View
    // -------------------------------------------------------------
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-between">
            <Navbar />

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                        Feedback & Reviews
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Rate your recent delivered orders and share your experience with the FoodExpress community.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="py-20 text-center">
                        <div className="text-5xl animate-pulse mb-3">⭐</div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                            Loading your orders and reviews...
                        </p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* ======================================================== */}
                        {/* SECTION 1: ORDERS ELIGIBLE FOR REVIEW                    */}
                        {/* ======================================================== */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        Orders Waiting for Review
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Only delivered or completed orders can be reviewed.
                                    </p>
                                </div>
                                <span className="bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 text-xs font-bold px-3 py-1 rounded-full">
                                    {eligibleOrders.length} eligible
                                </span>
                            </div>

                            {eligibleOrders.length === 0 ? (
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
                                    <div className="text-5xl mb-3">📦</div>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                                        No Orders Available for Review
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm max-w-md mx-auto">
                                        Once your current orders are marked as delivered or completed, you will be able to share your star rating and feedback here.
                                    </p>
                                    <Link
                                        to="/orders"
                                        className="inline-block mt-4 text-orange-500 hover:text-orange-600 font-semibold text-sm"
                                    >
                                        View Order Tracking →
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {eligibleOrders.map((order) => (
                                        <div
                                            key={order._id}
                                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700 p-6 flex flex-col justify-between"
                                        >
                                            <div>
                                                {/* Top row: Restaurant Name & Status */}
                                                <div className="flex items-start justify-between gap-3 border-b border-gray-100 dark:border-gray-700 pb-4">
                                                    <div>
                                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                                            {order.restaurantName}
                                                        </h3>
                                                        <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-0.5">
                                                            Order #{order._id.slice(-8).toUpperCase()}
                                                        </p>
                                                    </div>
                                                    <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold px-3 py-1 rounded-full">
                                                        <span>✓</span> {order.status}
                                                    </span>
                                                </div>

                                                {/* Order Date & Total */}
                                                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 py-3 border-b border-gray-100 dark:border-gray-700">
                                                    <span>📅 {formatDate(order.orderDate)}</span>
                                                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                                        ₹{order.totalAmount}
                                                    </span>
                                                </div>

                                                {/* Items summary */}
                                                <div className="py-3">
                                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                                                        Items
                                                    </p>
                                                    <div className="space-y-1">
                                                        {order.items.map((it, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="text-sm text-gray-700 dark:text-gray-300 flex justify-between"
                                                            >
                                                                <span>{it.name}</span>
                                                                <span className="text-gray-500 dark:text-gray-400">
                                                                    × {it.quantity}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
                                                {order.isReviewed ? (
                                                    <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-xl px-4 py-2.5">
                                                        <div className="flex items-center gap-2 text-green-700 dark:text-green-300 text-sm font-bold">
                                                            <span>✓</span>
                                                            <span>Reviewed</span>
                                                        </div>
                                                        <span className="text-amber-500 text-sm font-bold">
                                                            {"★".repeat(order.review?.rating || 5)}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => openReviewModal(order)}
                                                        className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                                                    >
                                                        <span>⭐</span>
                                                        <span>Rate & Review</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* ======================================================== */}
                        {/* SECTION 2: MY REVIEWS WITH DATE & MONTH FILTERS           */}
                        {/* ======================================================== */}
                        <section className="pt-4">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        My Reviews
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Reviews you have submitted for past FoodExpress orders.
                                    </p>
                                </div>
                                <span className="self-start md:self-auto bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold px-3 py-1 rounded-full">
                                    {myReviews.length} {isFiltered ? "filtered" : "total"}
                                </span>
                            </div>

                            {/* Filter Bar */}
                            <div className="mb-6 bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 shadow-xs border border-gray-100 dark:border-gray-700">
                                <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mr-2">
                                        Filter By:
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFilterType("all");
                                            if (isFiltered) handleClearFilter();
                                        }}
                                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                            filterType === "all"
                                                ? "bg-orange-500 text-white shadow-xs"
                                                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                                        }`}
                                    >
                                        All Reviews
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFilterType("date_range")}
                                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                            filterType === "date_range"
                                                ? "bg-orange-500 text-white shadow-xs"
                                                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                                        }`}
                                    >
                                        📅 Date Range
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFilterType("month")}
                                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                            filterType === "month"
                                                ? "bg-orange-500 text-white shadow-xs"
                                                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                                        }`}
                                    >
                                        🗓️ By Month
                                    </button>
                                </div>

                                {filterError && (
                                    <div className="mt-3 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 text-xs border border-red-200 dark:border-red-800">
                                        {filterError}
                                    </div>
                                )}

                                {/* Filter Inputs */}
                                {filterType === "date_range" && (
                                    <div className="mt-4 flex flex-col sm:flex-row sm:items-end gap-3">
                                        <div>
                                            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                                Start Date
                                            </label>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="w-full sm:w-auto rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-xs text-gray-800 dark:text-gray-200"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                                End Date
                                            </label>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-1.5 text-xs text-gray-800 dark:text-gray-200"
                                            />
                                        </div>
                                        <div className="flex items-end gap-2 mt-4 sm:mt-0">
                                            <button
                                                type="button"
                                                onClick={handleApplyFilter}
                                                disabled={filterLoading}
                                                className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-1.5 rounded-lg text-xs shadow-xs cursor-pointer"
                                            >
                                                {filterLoading ? "Filtering..." : "Apply Filter"}
                                            </button>
                                            {isFiltered && (
                                                <button
                                                    type="button"
                                                    onClick={handleClearFilter}
                                                    className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-gray-700 dark:text-gray-200 font-semibold px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                                                >
                                                    Clear Filters
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {filterType === "month" && (
                                    <div className="mt-4 flex flex-col sm:flex-row sm:items-end gap-3">
                                        <div>
                                            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                                Month
                                            </label>
                                            <select
                                                value={month}
                                                onChange={(e) => setMonth(e.target.value)}
                                                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-1.5 text-xs text-gray-800 dark:text-gray-200"
                                            >
                                                {[
                                                    { num: "1", name: "January" },
                                                    { num: "2", name: "February" },
                                                    { num: "3", name: "March" },
                                                    { num: "4", name: "April" },
                                                    { num: "5", name: "May" },
                                                    { num: "6", name: "June" },
                                                    { num: "7", name: "July" },
                                                    { num: "8", name: "August" },
                                                    { num: "9", name: "September" },
                                                    { num: "10", name: "October" },
                                                    { num: "11", name: "November" },
                                                    { num: "12", name: "December" }
                                                ].map((m) => (
                                                    <option key={m.num} value={m.num}>
                                                        {m.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                                Year
                                            </label>
                                            <select
                                                value={year}
                                                onChange={(e) => setYear(e.target.value)}
                                                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-1.5 text-xs text-gray-800 dark:text-gray-200"
                                            >
                                                {[2024, 2025, 2026, 2027].map((y) => (
                                                    <option key={y} value={y}>
                                                        {y}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex items-end gap-2 mt-4 sm:mt-0">
                                            <button
                                                type="button"
                                                onClick={handleApplyFilter}
                                                disabled={filterLoading}
                                                className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-1.5 rounded-lg text-xs shadow-xs cursor-pointer"
                                            >
                                                {filterLoading ? "Filtering..." : "Apply Filter"}
                                            </button>
                                            {isFiltered && (
                                                <button
                                                    type="button"
                                                    onClick={handleClearFilter}
                                                    className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-gray-700 dark:text-gray-200 font-semibold px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                                                >
                                                    Clear Filters
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Reviews Cards List */}
                            {myReviews.length === 0 ? (
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
                                    <div className="text-5xl mb-3">💬</div>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                                        {isFiltered
                                            ? "No reviews found for the selected period."
                                            : "You haven't submitted any reviews yet"}
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm max-w-md mx-auto">
                                        {isFiltered
                                            ? "Try selecting a broader date range or a different month."
                                            : "Rate an eligible completed order above to add your feedback. Your reviews help other customers discover top-rated dishes!"}
                                    </p>
                                    {isFiltered && (
                                        <button
                                            type="button"
                                            onClick={handleClearFilter}
                                            className="mt-4 inline-block text-orange-600 hover:underline text-sm font-semibold cursor-pointer"
                                        >
                                            View all reviews
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {myReviews.map((rev) => (
                                        <div
                                            key={rev._id}
                                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col justify-between"
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <h3 className="font-bold text-gray-900 dark:text-white text-base">
                                                        {rev.restaurantName}
                                                    </h3>
                                                    <span className="text-xs text-gray-400 dark:text-gray-500">
                                                        {formatDate(rev.createdAt)}
                                                    </span>
                                                </div>

                                                {/* Dish Name if specific to a food */}
                                                {rev.foodName ? (
                                                    <div className="mb-2.5">
                                                        <span className="inline-block bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                                                            🍽️ {rev.foodName}
                                                        </span>
                                                    </div>
                                                ) : null}

                                                {/* Star Rating */}
                                                <div className="flex items-center gap-1 text-amber-400 text-lg mb-3">
                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                        <span key={s}>
                                                            {s <= rev.rating ? "★" : "☆"}
                                                        </span>
                                                    ))}
                                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-2">
                                                        ({rev.rating}/5)
                                                    </span>
                                                </div>

                                                {/* Written Comment */}
                                                {rev.comment && rev.comment.trim() && (
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 italic bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800 mb-3">
                                                        "{rev.comment}"
                                                    </p>
                                                )}

                                                {/* Photos if any */}
                                                {Array.isArray(rev.images) && rev.images.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mb-3">
                                                        {rev.images.map((img, idx) => (
                                                            <button
                                                                key={idx}
                                                                type="button"
                                                                onClick={() => setPreviewImage(getBackendAssetUrl(img))}
                                                                className="relative h-14 w-14 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:scale-105 transition cursor-pointer"
                                                                title="Click to view full photo"
                                                            >
                                                                <img
                                                                    src={getBackendAssetUrl(img)}
                                                                    alt="Review thumbnail"
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500">
                                                Order #{String(rev.orderId).slice(-8).toUpperCase()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </main>

            {/* Modal: Rate & Review Order */}
            {selectedOrder && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="review-dialog-title"
                >
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-200 max-h-[90dvh] overflow-y-auto">
                        <div className="flex items-start justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
                            <div>
                                <h2 id="review-dialog-title" className="text-xl font-bold text-gray-900 dark:text-white">
                                    Rate & Review Order
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {selectedOrder.restaurantName} • Order #{selectedOrder._id.slice(-8).toUpperCase()}
                                </p>
                            </div>
                            <button
                                onClick={closeReviewModal}
                                disabled={submitting}
                                className="p-1 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl font-light leading-none cursor-pointer"
                                aria-label="Close"
                            >
                                &times;
                            </button>
                        </div>

                        {formError && (
                            <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs">
                                {formError}
                            </div>
                        )}

                        <form onSubmit={handleSubmitReview} className="mt-6 space-y-5">
                            {/* Star Rating */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                                    Select Rating <span className="text-red-500">*</span>
                                </label>
                                <div className="flex items-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            type="button"
                                            key={star}
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            className="text-4xl sm:text-5xl min-w-[40px] min-h-[44px] flex items-center justify-center transition-transform hover:scale-110 focus:outline-none cursor-pointer"
                                            title={`${star} Star`}
                                        >
                                            <span
                                                className={
                                                    (hoverRating || rating) >= star
                                                        ? "text-amber-400 drop-shadow-xs"
                                                        : "text-gray-300 dark:text-gray-600"
                                                }
                                            >
                                                ★
                                            </span>
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 mt-2">
                                    {getRatingLabel(hoverRating || rating)}
                                </p>
                            </div>

                            {/* Optional Comment */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label
                                        htmlFor={commentInputId}
                                        className="text-sm font-semibold text-gray-800 dark:text-gray-200"
                                    >
                                        Write a review (optional)
                                    </label>
                                    <span className="text-xs text-gray-400 dark:text-gray-500">
                                        {comment.length} / 500
                                    </span>
                                </div>
                                <textarea
                                    id={commentInputId}
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value.slice(0, 500))}
                                    placeholder="Share your experience with this order..."
                                    rows={3}
                                    maxLength={500}
                                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-3 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            {/* Add Photos */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                                    Add Photos <span className="text-xs text-gray-400 font-normal">(optional, max 3 photos, up to 5MB each)</span>
                                </label>

                                <div className="flex flex-wrap items-center gap-3">
                                    {selectedImages.map((imgItem, idx) => (
                                        <div
                                            key={idx}
                                            className="relative h-16 w-16 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-xs"
                                        >
                                            <img
                                                src={imgItem.preview}
                                                alt="Dish preview"
                                                className="h-full w-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(idx)}
                                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold shadow-md hover:bg-red-700 cursor-pointer"
                                                title="Remove image"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}

                                    {selectedImages.length < 3 && (
                                        <label className="h-16 w-16 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-orange-500 dark:hover:border-orange-400 cursor-pointer transition text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/40">
                                            <span className="text-xl leading-none">📷</span>
                                            <span className="text-[10px] font-medium mt-1">Upload</span>
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                multiple
                                                onChange={handleImageChange}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={closeReviewModal}
                                    disabled={submitting}
                                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || rating === 0}
                                    className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition flex items-center gap-2 ${
                                        submitting || rating === 0
                                            ? "bg-gray-400 cursor-not-allowed"
                                            : "bg-orange-500 hover:bg-orange-600 active:scale-[0.99] cursor-pointer"
                                    }`}
                                >
                                    {submitting ? (
                                        <>
                                            <span className="inline-block animate-spin">⏳</span>
                                            <span>Submitting...</span>
                                        </>
                                    ) : (
                                        <span>Submit Review</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal for Full-size Image Preview */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
                    onClick={() => setPreviewImage(null)}
                >
                    <div
                        className="relative max-w-3xl max-h-[85dvh] bg-black/40 p-2 rounded-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setPreviewImage(null)}
                            className="absolute -top-3 -right-3 w-10 h-10 min-w-[44px] min-h-[44px] rounded-full bg-white text-gray-800 font-bold flex items-center justify-center shadow-lg hover:bg-gray-100 cursor-pointer text-lg z-10"
                            aria-label="Close image preview"
                        >
                            ✕
                        </button>
                        <img
                            src={previewImage}
                            alt="Full review photo"
                            className="max-h-[80dvh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
                        />
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}

export default Feedback;
