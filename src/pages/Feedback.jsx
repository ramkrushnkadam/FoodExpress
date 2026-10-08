import { useEffect, useState, useId } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { apiRequest, CUSTOMER_TOKEN_KEY } from "../services/api";
import { useToast } from "../context/ToastContext";

function Feedback() {
    const { showToast } = useToast();
    const commentInputId = useId();

    const [eligibleOrders, setEligibleOrders] = useState([]);
    const [myReviews, setMyReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Modal / Active Review Form State
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");

    const token = localStorage.getItem(CUSTOMER_TOKEN_KEY);

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

    const openReviewModal = (order) => {
        setSelectedOrder(order);
        setRating(0);
        setHoverRating(0);
        setComment("");
        setFormError("");
    };

    const closeReviewModal = () => {
        setSelectedOrder(null);
        setRating(0);
        setHoverRating(0);
        setComment("");
        setFormError("");
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

            await apiRequest("/reviews", {
                method: "POST",
                body: JSON.stringify({
                    orderId: selectedOrder._id,
                    rating,
                    comment: comment.trim()
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

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-between">
            <Navbar />

            <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">⭐</span>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                            Feedback & Reviews
                        </h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mt-2 text-base">
                        Rate your recent delivered meals and manage the reviews you've shared with FoodExpress.
                    </p>
                </div>

                {error && (
                    <div className="mb-8 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="py-20 text-center">
                        <div className="text-5xl animate-bounce mb-3">🍽️</div>
                        <p className="text-gray-600 dark:text-gray-300 font-semibold">Loading your orders & reviews...</p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* ======================================================== */}
                        {/* SECTION 1: ORDERS AVAILABLE FOR REVIEW                   */}
                        {/* ======================================================== */}
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        Orders Available for Review
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Only delivered or completed orders are eligible for customer feedback.
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
                                                        className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition flex items-center justify-center gap-2"
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
                        {/* SECTION 2: MY REVIEWS                                    */}
                        {/* ======================================================== */}
                        <section className="pt-4">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        My Reviews
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Reviews you have submitted for past FoodExpress orders.
                                    </p>
                                </div>
                                <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold px-3 py-1 rounded-full">
                                    {myReviews.length} total
                                </span>
                            </div>

                            {myReviews.length === 0 ? (
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
                                    <div className="text-5xl mb-3">💬</div>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                                        You haven't submitted any reviews yet
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm max-w-md mx-auto">
                                        Rate an eligible completed order above to add your feedback. Your reviews help other customers discover top-rated dishes!
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {myReviews.map((rev) => (
                                        <div
                                            key={rev._id}
                                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col justify-between"
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-2 mb-3">
                                                    <h3 className="font-bold text-gray-900 dark:text-white text-base">
                                                        {rev.restaurantName}
                                                    </h3>
                                                    <span className="text-xs text-gray-400 dark:text-gray-500">
                                                        {formatDate(rev.createdAt)}
                                                    </span>
                                                </div>

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

                                                {/* Written Comment (ONLY shown if provided) */}
                                                {rev.comment && rev.comment.trim() && (
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 italic bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                                                        "{rev.comment}"
                                                    </p>
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

            {/* ======================================================== */}
            {/* MODAL: SUBMIT STAR RATING & WRITTEN REVIEW               */}
            {/* ======================================================== */}
            {selectedOrder && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="review-dialog-title"
                >
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
                        {/* Header */}
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
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl font-light leading-none"
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

                        <form onSubmit={handleSubmitReview} className="mt-6 space-y-6">
                            {/* Star Rating Component */}
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
                                            className="text-4xl sm:text-5xl transition-transform hover:scale-110 focus:outline-none cursor-pointer"
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

                            {/* Optional Comment Textarea */}
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
                                    rows={4}
                                    maxLength={500}
                                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-3 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={closeReviewModal}
                                    disabled={submitting}
                                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || rating === 0}
                                    className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition flex items-center gap-2 ${
                                        submitting || rating === 0
                                            ? "bg-gray-400 cursor-not-allowed"
                                            : "bg-orange-500 hover:bg-orange-600 active:scale-[0.99]"
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

            <Footer />
        </div>
    );
}

export default Feedback;

