import { useEffect, useState, useId } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { getFood } from "../services/catalogApi";
import { apiRequest, getBackendAssetUrl, CUSTOMER_TOKEN_KEY } from "../services/api";

function FoodDetails() {
    const { id } = useParams();
    const { addToCart } = useCart();
    const { showToast } = useToast();
    const commentInputId = useId();

    const [food, setFood] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    // Reviews State
    const [reviewsData, setReviewsData] = useState({
        reviews: [],
        averageRating: 5.0,
        ratingCount: 0
    });
    const [reviewsLoading, setReviewsLoading] = useState(true);

    // Eligibility & Review Submission State
    const [eligibility, setEligibility] = useState({ eligible: false });
    const [eligibilityChecked, setEligibilityChecked] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");
    const [selectedImages, setSelectedImages] = useState([]); // [{ file, preview }]
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewError, setReviewError] = useState("");

    // Full-size Image Preview Modal
    const [previewModalImg, setPreviewModalImg] = useState(null);

    const token = localStorage.getItem(CUSTOMER_TOKEN_KEY);

    // 1. Fetch Food details
    const loadFood = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await getFood(id);
            setFood(data);
        } catch (e) {
            setError(e.message || "Food not found");
        } finally {
            setLoading(false);
        }
    };

    // 2. Fetch Customer Reviews for this food
    const loadReviews = async () => {
        try {
            setReviewsLoading(true);
            const data = await apiRequest(`/reviews/food/${id}`);
            setReviewsData({
                reviews: Array.isArray(data.reviews) ? data.reviews : [],
                averageRating: Number(data.averageRating || 5.0),
                ratingCount: Number(data.ratingCount || 0)
            });
        } catch (e) {
            console.error("Failed to load food reviews:", e);
        } finally {
            setReviewsLoading(false);
        }
    };

    // 3. Check Eligibility
    const checkEligibility = async () => {
        if (!token) {
            setEligibility({ eligible: false });
            setEligibilityChecked(true);
            return;
        }
        try {
            const res = await apiRequest(`/reviews/food/${id}/eligibility`);
            setEligibility(res || { eligible: false });
        } catch (e) {
            console.error("Eligibility check error:", e);
            setEligibility({ eligible: false });
        } finally {
            setEligibilityChecked(true);
        }
    };

    useEffect(() => {
        loadFood();
        loadReviews();
        checkEligibility();
    }, [id]);

    // Handle Image Selection (up to 3, max 5MB each, JPG/PNG/WebP)
    const handleImageChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        setReviewError("");
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        const maxSizeBytes = 5 * 1024 * 1024; // 5MB

        const remainingSlots = 3 - selectedImages.length;
        if (remainingSlots <= 0) {
            setReviewError("You can upload a maximum of 3 images.");
            return;
        }

        const validNewImages = [];
        for (const file of files.slice(0, remainingSlots)) {
            const ext = file.name.split(".").pop().toLowerCase();
            const isAllowedExt = ["jpg", "jpeg", "png", "webp"].includes(ext);

            if (!allowedTypes.includes(file.type) && !isAllowedExt) {
                setReviewError("Only JPG, JPEG, PNG, and WebP images are allowed.");
                return;
            }
            if (file.size > maxSizeBytes) {
                setReviewError(`"${file.name}" exceeds the 5MB file size limit.`);
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

    // Submit Review with uploaded images
    const handleSubmitReview = async (e) => {
        e.preventDefault();
        setReviewError("");

        if (!eligibility.eligible || !eligibility.orderId) {
            setReviewError("You are not eligible to review this dish.");
            return;
        }

        if (rating < 1 || rating > 5) {
            setReviewError("Please select a star rating between 1 and 5.");
            return;
        }

        try {
            setSubmittingReview(true);

            // Step A: Upload photos if any
            const uploadedImageUrls = [];
            for (const imgItem of selectedImages) {
                const base64Data = await readFileAsBase64(imgItem.file);
                const uploadRes = await apiRequest("/reviews/upload", {
                    method: "POST",
                    body: JSON.stringify({
                        image: base64Data,
                        filename: imgItem.file.name
                    })
                });
                if (uploadRes?.url) {
                    uploadedImageUrls.push(uploadRes.url);
                }
            }

            // Step B: Submit Review
            await apiRequest("/reviews", {
                method: "POST",
                body: JSON.stringify({
                    orderId: eligibility.orderId,
                    foodId: id,
                    rating,
                    comment: comment.trim(),
                    images: uploadedImageUrls
                })
            });

            showToast("Your review has been submitted successfully!", "success");

            // Reset form
            setRating(0);
            setHoverRating(0);
            setComment("");
            setSelectedImages([]);

            // Refresh reviews & eligibility & food details
            await Promise.all([loadReviews(), checkEligibility(), loadFood()]);
        } catch (err) {
            console.error("Failed to submit review:", err);
            setReviewError(err.message || "Failed to submit review.");
            showToast(err.message || "Failed to submit review.", "error");
        } finally {
            setSubmittingReview(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    const isAvailable = food ? food.availability !== false : true;
    const displayRating = Number(food?.rating || reviewsData.averageRating || 5.0).toFixed(1);
    const displayCount = food?.ratingCount !== undefined ? food.ratingCount : reviewsData.ratingCount;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-between">
            <Navbar />

            <main className="mx-auto min-h-[70vh] max-w-5xl px-4 sm:px-6 lg:px-8 py-10 w-full">
                {error ? (
                    <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 p-6 rounded-2xl text-red-600 dark:text-red-300 text-center">
                        <p className="text-lg font-bold">Error</p>
                        <p className="mt-1">{error}</p>
                        <Link to="/" className="mt-4 inline-block text-orange-600 font-semibold underline">
                            ← Return to Home
                        </Link>
                    </div>
                ) : loading || !food ? (
                    <div className="py-20 text-center text-gray-500 dark:text-gray-400">
                        <div className="text-4xl animate-pulse mb-3">🍲</div>
                        <p>Loading dish details...</p>
                    </div>
                ) : (
                    <>
                        {/* Navigation link */}
                        <div className="mb-6 flex items-center justify-between">
                            <Link
                                to={food.restaurantId ? `/restaurant/${food.restaurantId}` : "/"}
                                className="text-sm font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 flex items-center gap-1"
                            >
                                ← Back to menu
                            </Link>
                        </div>

                        {/* Dish Card */}
                        <div className="grid overflow-hidden rounded-3xl bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 md:grid-cols-2">
                            <div className="relative h-64 sm:h-80 md:h-full min-h-[240px] md:min-h-[320px]">
                                <img
                                    className="h-full w-full object-cover"
                                    src={food.image}
                                    alt={food.name}
                                />
                                {!isAvailable && (
                                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                                        <span className="bg-red-600 text-white font-bold px-4 py-2 rounded-xl text-sm shadow-lg">
                                            Currently Unavailable
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 sm:p-8 flex flex-col justify-between">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                        <span className="rounded-full bg-orange-100 dark:bg-orange-950/60 px-3 py-1 text-xs font-bold text-orange-700 dark:text-orange-300">
                                            {food.category}
                                        </span>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                                                food.isVeg
                                                    ? "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300"
                                                    : "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                                            }`}
                                        >
                                            {food.isVeg ? "🥗 Veg" : "🍗 Non-Veg"}
                                        </span>
                                    </div>

                                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                                        {food.name}
                                    </h1>

                                    {/* Ratings Display */}
                                    <div className="mt-2.5 flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 font-bold text-sm px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
                                            <span>★</span> {displayRating}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            ({displayCount} {displayCount === 1 ? "review" : "reviews"})
                                        </span>
                                    </div>

                                    {/* Price and Availability Badge */}
                                    <div className="mt-5 flex items-center gap-3">
                                        <p className="text-3xl font-extrabold text-orange-600 dark:text-orange-400">
                                            ₹{food.price}
                                        </p>
                                        <span
                                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                                isAvailable
                                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                                    : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                                            }`}
                                        >
                                            {isAvailable ? "· Available" : "· Unavailable"}
                                        </span>
                                    </div>

                                    <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                        {food.description || `Fresh and delicious ${food.name} made to order with quality ingredients.`}
                                    </p>
                                </div>

                                <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <button
                                        disabled={!isAvailable}
                                        onClick={() => {
                                            if (!isAvailable) return;
                                            addToCart(food);
                                            showToast(`${food.name} added to cart`);
                                        }}
                                        className={`w-full rounded-xl py-3.5 min-h-[48px] font-bold text-white shadow-md transition flex items-center justify-center gap-2 ${
                                            isAvailable
                                                ? "bg-orange-500 hover:bg-orange-600 active:scale-[0.99] cursor-pointer"
                                                : "bg-gray-400 dark:bg-gray-700 cursor-not-allowed opacity-60"
                                        }`}
                                    >
                                        <span>🛒</span>
                                        <span>{isAvailable ? "Add to Cart" : "Currently Unavailable"}</span>
                                    </button>
                                    <Link
                                        to="/cart"
                                        className="mt-3 block text-center text-sm font-semibold text-orange-600 dark:text-orange-400 hover:underline"
                                    >
                                        View Cart →
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* ========================================================= */}
                        {/* CUSTOMER REVIEWS & PHOTOS SECTION                         */}
                        {/* ========================================================= */}
                        <section className="mt-14">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5 mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        Customer Reviews & Photos
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Real reviews from verified customers who ordered this dish.
                                    </p>
                                </div>

                                <div className="flex items-center gap-3 bg-white dark:bg-gray-800 px-4 py-2.5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
                                    <div className="text-3xl text-amber-400 font-extrabold flex items-center gap-1">
                                        <span>★</span>
                                        <span>{displayRating}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        <p className="font-semibold text-gray-800 dark:text-gray-200">Overall Rating</p>
                                        <p>{displayCount} {displayCount === 1 ? "rating" : "ratings"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Review Form (Only for eligible customers) */}
                            {eligibility.eligible && (
                                <div className="mb-10 rounded-2xl bg-white dark:bg-gray-800 p-6 sm:p-8 shadow-sm border border-orange-100 dark:border-gray-700">
                                    <div className="flex items-center gap-2 mb-4 text-orange-600 dark:text-orange-400 text-sm font-bold">
                                        <span>⭐</span>
                                        <span>You ordered this dish in order #{eligibility.orderNumber}! Leave your review:</span>
                                    </div>

                                    {reviewError && (
                                        <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800">
                                            {reviewError}
                                        </div>
                                    )}

                                    <form onSubmit={handleSubmitReview} className="space-y-5">
                                        {/* Star Rating */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                                                Your Rating <span className="text-red-500">*</span>
                                            </label>
                                            <div className="flex items-center gap-2">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        onClick={() => setRating(star)}
                                                        onMouseEnter={() => setHoverRating(star)}
                                                        onMouseLeave={() => setHoverRating(0)}
                                                        className="text-3xl sm:text-4xl min-w-[40px] min-h-[44px] flex items-center justify-center transition-transform hover:scale-110 focus:outline-none cursor-pointer"
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
                                                <span className="ml-2 text-xs font-semibold text-orange-600 dark:text-orange-400">
                                                    {rating > 0 ? `${rating} of 5 Stars` : "Select a rating"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Review Comment */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <label
                                                    htmlFor={commentInputId}
                                                    className="text-sm font-semibold text-gray-800 dark:text-gray-200"
                                                >
                                                    Review (optional)
                                                </label>
                                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                                    {comment.length} / 500
                                                </span>
                                            </div>
                                            <textarea
                                                id={commentInputId}
                                                rows={3}
                                                maxLength={500}
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value.slice(0, 500))}
                                                placeholder="Tell us what you loved about this dish..."
                                                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-3 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            />
                                        </div>

                                        {/* Photo Upload (up to 3 images, max 5MB each) */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                                                Add Dish Photos <span className="text-xs text-gray-400 font-normal">(optional, max 3 photos, up to 5MB each)</span>
                                            </label>

                                            <div className="flex flex-wrap items-center gap-3">
                                                {/* Previews */}
                                                {selectedImages.map((imgItem, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="relative h-20 w-20 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-xs group"
                                                    >
                                                        <img
                                                            src={imgItem.preview}
                                                            alt="Dish preview"
                                                            className="h-full w-full object-cover"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeImage(idx)}
                                                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-md hover:bg-red-700 cursor-pointer"
                                                            title="Remove image"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}

                                                {/* Add button */}
                                                {selectedImages.length < 3 && (
                                                    <label className="h-20 w-20 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-orange-500 dark:hover:border-orange-400 cursor-pointer transition text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/40">
                                                        <span className="text-2xl leading-none">📷</span>
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

                                        {/* Submit Button */}
                                        <div className="flex justify-end pt-2">
                                            <button
                                                type="submit"
                                                disabled={submittingReview || rating === 0}
                                                className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition flex items-center gap-2 ${
                                                    submittingReview || rating === 0
                                                        ? "bg-gray-400 cursor-not-allowed"
                                                        : "bg-orange-500 hover:bg-orange-600 active:scale-[0.99] cursor-pointer"
                                                }`}
                                            >
                                                {submittingReview ? (
                                                    <>
                                                        <span className="inline-block animate-spin">⏳</span>
                                                        <span>Submitting Review...</span>
                                                    </>
                                                ) : (
                                                    <span>Submit Review</span>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Eligibility Hint if not eligible */}
                            {!eligibility.eligible && eligibilityChecked && (
                                <div className="mb-8 rounded-2xl bg-amber-50 dark:bg-amber-950/30 p-4 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2.5">
                                    <span className="text-base">ℹ️</span>
                                    <span>
                                        {token
                                            ? "You can review this dish once you have ordered it and your order is marked as delivered or completed."
                                            : "Only customers who ordered this dish can write a review. Sign in and order this dish to share your feedback!"}
                                    </span>
                                </div>
                            )}

                            {/* Reviews List */}
                            {reviewsLoading ? (
                                <div className="py-10 text-center text-gray-500 dark:text-gray-400">
                                    <p>Loading reviews...</p>
                                </div>
                            ) : reviewsData.reviews.length === 0 ? (
                                <div className="rounded-2xl bg-white dark:bg-gray-800 p-8 text-center border border-gray-100 dark:border-gray-700 shadow-sm">
                                    <div className="text-4xl mb-2">⭐</div>
                                    <h3 className="font-bold text-gray-800 dark:text-white">
                                        No reviews for this dish yet
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                                        This dish currently holds a default 5.0 star rating. Be the first to order and share your photo & review!
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {reviewsData.reviews.map((rev) => (
                                        <div
                                            key={rev.id || rev._id}
                                            className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between"
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <div>
                                                        <p className="font-bold text-gray-900 dark:text-white text-sm">
                                                            {rev.customerDisplayName}
                                                        </p>
                                                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                                            ✓ Verified Customer
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-gray-400 dark:text-gray-500">
                                                        {formatDate(rev.createdAt)}
                                                    </span>
                                                </div>

                                                {/* Rating Stars */}
                                                <div className="flex items-center gap-1 text-amber-400 text-sm mb-3">
                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                        <span key={s}>{s <= rev.rating ? "★" : "☆"}</span>
                                                    ))}
                                                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 ml-1">
                                                        {rev.rating}/5
                                                    </span>
                                                </div>

                                                {/* Comment */}
                                                {rev.comment && rev.comment.trim() && (
                                                    <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed italic mb-4">
                                                        "{rev.comment}"
                                                    </p>
                                                )}

                                                {/* Photos */}
                                                {Array.isArray(rev.images) && rev.images.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mb-2">
                                                        {rev.images.map((img, idx) => (
                                                            <button
                                                                key={idx}
                                                                type="button"
                                                                onClick={() => setPreviewModalImg(getBackendAssetUrl(img))}
                                                                className="relative h-16 w-16 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:scale-105 transition cursor-pointer"
                                                                title="Click to view full photo"
                                                            >
                                                                <img
                                                                    src={getBackendAssetUrl(img)}
                                                                    alt="Dish review thumbnail"
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </main>

            {/* Modal for Full-size Image Preview */}
            {previewModalImg && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
                    onClick={() => setPreviewModalImg(null)}
                >
                    <div
                        className="relative max-w-3xl max-h-[85dvh] bg-black/40 p-2 rounded-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setPreviewModalImg(null)}
                            className="absolute -top-3 -right-3 w-10 h-10 min-w-[44px] min-h-[44px] rounded-full bg-white text-gray-800 font-bold flex items-center justify-center shadow-lg hover:bg-gray-100 cursor-pointer text-lg z-10"
                            aria-label="Close image preview"
                        >
                            ✕
                        </button>
                        <img
                            src={previewModalImg}
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

export default FoodDetails;
