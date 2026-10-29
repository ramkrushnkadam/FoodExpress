import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FoodCard from "../components/FoodCard";
import SearchBar from "../components/SearchBar";
import hero from "../assets/hero.jpg";
import { getFoods } from "../services/catalogApi";
import { apiRequest, getBackendAssetUrl } from "../services/api";

function Home() {
    const [filter, setFilter] = useState("all");
    const [priceFilter, setPriceFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [foods, setFoods] = useState([]);
    const [catalogError, setCatalogError] = useState("");
    const [publicReviews, setPublicReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [previewImage, setPreviewImage] = useState(null);
    const [sessionOffer, setSessionOffer] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        getFoods()
            .then(setFoods)
            .catch((error) => setCatalogError(error.message || "Unable to load the menu."));

        apiRequest("/session-offers/current")
            .then((data) => {
                if (data && data.active && data.offer) {
                    setSessionOffer(data.offer);
                } else {
                    setSessionOffer(null);
                }
            })
            .catch(() => {
                setSessionOffer(null);
            });

        apiRequest("/reviews/public")
            .then((data) => {
                if (Array.isArray(data.reviews)) {
                    setPublicReviews(data.reviews);
                }
            })
            .catch((error) => {
                console.error("Public reviews fetch error:", error);
            })
            .finally(() => {
                setReviewsLoading(false);
            });
    }, []);

    // Copy original foods
    let filteredFoods = [...foods];

    // -------------------------   
    // Search Filter
    // -------------------------
    if (search.trim()) {
        filteredFoods = filteredFoods.filter((food) =>
            (food.name || "").toLowerCase().includes(search.toLowerCase())
        );
    }

    // -------------------------
    // Veg / Non Veg Filter
    // -------------------------
    if (filter === "veg") {
        filteredFoods = filteredFoods.filter(
            (food) => food.isVeg === true || food.type === "veg"
        );
    } else if (filter === "nonveg") {
        filteredFoods = filteredFoods.filter(
            (food) => food.isVeg === false || food.type === "nonveg"
        );
    }

    // -------------------------
    // Price Sorting & Range Helpers
    // -------------------------
    const getPrice = (food) => {
        return (
            parseInt(
                String(food.price).replace(/[₹,]/g, "")
            ) || 0
        );
    };

    if (priceFilter === "low") {
        filteredFoods.sort((a, b) => getPrice(a) - getPrice(b));
    }

    if (priceFilter === "high") {
        filteredFoods.sort((a, b) => getPrice(b) - getPrice(a));
    }

    if (priceFilter === "under150") {
        filteredFoods = filteredFoods.filter((food) => getPrice(food) < 150);
    }

    if (priceFilter === "150to250") {
        filteredFoods = filteredFoods.filter((food) => {
            const price = getPrice(food);
            return price >= 150 && price <= 250;
        });
    }

    if (priceFilter === "above250") {
        filteredFoods = filteredFoods.filter((food) => getPrice(food) > 250);
    }

    // Always sort available foods first, unavailable foods last
    filteredFoods.sort((a, b) => {
        const aAvail = a.availability !== false ? 1 : 0;
        const bAvail = b.availability !== false ? 1 : 0;
        return bAvail - aAvail;
    });

    const handleCopyCode = (code) => {
        if (!code) return;
        navigator.clipboard?.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {catalogError && (
                <p className="mx-auto max-w-7xl px-6 pt-4 text-red-600">{catalogError}</p>
            )}

            {/* =========================
                NAVBAR
            ========================== */}
            <Navbar />

            {/* =========================
                HERO SECTION
            ========================== */}
            <section className="relative w-full overflow-hidden">
                {/* Hero Image */}
                <img
                    src={hero}
                    alt="Delicious food"
                    className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/10" />

                {/* Hero Content */}
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-10 min-h-[440px] sm:min-h-[520px] py-12 sm:py-16 flex items-center">
                    <div className="max-w-xl text-white">
                        {/* Small Badge */}
                        <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-sm font-medium mb-6">
                            🍽️ India's favourite food delivery
                        </div>

                        {/* Heading */}
                        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.15] tracking-tight">
                            Delicious food,
                            <br />
                            <span className="text-orange-400">delivered to you.</span>
                        </h1>

                        {/* Description */}
                        <p className="mt-5 text-lg sm:text-xl text-gray-200 leading-relaxed">
                            Order food from your favourite restaurants and get it delivered fast to your doorstep.
                        </p>

                        {/* Search Box */}
                        <div className="mt-8 flex flex-col sm:flex-row bg-white rounded-xl shadow-2xl overflow-hidden max-w-xl w-full">
                            {/* Location */}
                            <div className="flex items-center gap-3 px-5 py-4 text-gray-600 flex-1 border-b sm:border-b-0 sm:border-r border-gray-200">
                                <span className="text-xl">📍</span>
                                <input
                                    type="text"
                                    placeholder="Enter your location"
                                    className="w-full outline-none text-gray-800 placeholder-gray-400"
                                />
                            </div>

                            {/* Search */}
                            <button
                                onClick={() => {
                                    document
                                        .getElementById("popular-foods")
                                        ?.scrollIntoView({ behavior: "smooth" });
                                }}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-7 py-3.5 sm:py-4 min-h-[44px] font-bold transition duration-200 whitespace-nowrap cursor-pointer flex items-center justify-center"
                            >
                                Search
                            </button>
                        </div>

                        {/* Quick Info */}
                        <div className="flex flex-wrap gap-x-6 gap-y-3 mt-6 text-sm text-gray-200">
                            <span>✓ 30 min delivery</span>
                            <span>✓ Fresh food</span>
                            <span>✓ Secure payment</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* =========================
                POPULAR FOOD SECTION
            ========================== */}
            <section id="popular-foods" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white">
                                Popular Dishes
                            </h2>
                            <button
                                onClick={() => {
                                    document.getElementById("offer-banner")?.scrollIntoView({ behavior: "smooth" });
                                }}
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white text-xs sm:text-sm font-bold px-3.5 py-1.5 rounded-full shadow-md animate-pulse cursor-pointer select-none transition"
                                title="Click to view special offer details"
                            >
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-200 opacity-80"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-400"></span>
                                </span>
                                <span>
                                    {sessionOffer ? (
                                        sessionOffer.couponCode ? (
                                            `🪔 SPECIAL OFFER: Use ${sessionOffer.couponCode} (${sessionOffer.discountValue}% OFF)`
                                        ) : (
                                            `🪔 SPECIAL OFFER: ${sessionOffer.subtitle || sessionOffer.title}`
                                        )
                                    ) : (
                                        "🔥 SPECIAL OFFER: Flat 30% OFF with FOOD30"
                                    )}
                                </span>
                                <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-medium">
                                    View ↓
                                </span>
                            </button>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">
                            Choose from our most loved dishes.
                        </p>
                    </div>

                    {/* Search */}
                    <div className="w-full lg:w-80">
                        <SearchBar search={search} setSearch={setSearch} />
                    </div>
                </div>

                {/* =========================
                    FILTERS
                ========================== */}
                <div className="mt-8">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">
                        Food Type
                    </h3>

                    <div className="flex flex-wrap gap-3">
                        {/* All Button */}
                        <button 
                            onClick={() => setFilter("all")}
                            className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
                                filter === "all"
                                    ? "bg-orange-600 text-white shadow-sm ring-2 ring-orange-400"
                                    : "bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            }`}
                        >
                            All
                        </button>

                        {/* Veg Button */}
                        <button
                            onClick={() => setFilter("veg")}
                            className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
                                filter === "veg"
                                    ? "bg-green-600 text-white shadow-sm ring-2 ring-green-400"
                                    : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            }`}
                        >
                            🥗 Veg
                        </button>

                        {/* Non Veg Button */}
                        <button
                            onClick={() => setFilter("nonveg")}
                            className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
                                filter === "nonveg"
                                    ? "bg-red-600 text-white shadow-sm ring-2 ring-red-400"
                                    : "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            }`}
                        >
                            🍗 Non Veg
                        </button>
                    </div>

                    {/* Price Filters */}
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-6 mb-3">
                        Price
                    </h3>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setPriceFilter("all")}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                                priceFilter === "all"
                                    ? "bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900"
                                    : "bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                            }`}
                        >
                            All Prices
                        </button>

                        <button
                            onClick={() => setPriceFilter("low")}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                                priceFilter === "low"
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "bg-blue-500 hover:bg-blue-600 text-white"
                            }`}
                        >
                            ₹ Low → High
                        </button>

                        <button
                            onClick={() => setPriceFilter("high")}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                                priceFilter === "high"
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : "bg-indigo-500 hover:bg-indigo-600 text-white"
                            }`}
                        >
                            ₹ High → Low
                        </button>

                        <button
                            onClick={() => setPriceFilter("under150")}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                                priceFilter === "under150"
                                    ? "bg-green-600 text-white shadow-sm"
                                    : "bg-green-500 hover:bg-green-600 text-white"
                            }`}
                        >
                            Under ₹150
                        </button>

                        <button
                            onClick={() => setPriceFilter("150to250")}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                                priceFilter === "150to250"
                                    ? "bg-yellow-500 text-black shadow-sm"
                                    : "bg-yellow-400 hover:bg-yellow-500 text-black"
                            }`}
                        >
                            ₹150 - ₹250
                        </button>

                        <button
                            onClick={() => setPriceFilter("above250")}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                                priceFilter === "above250"
                                    ? "bg-red-600 text-white shadow-sm"
                                    : "bg-red-500 hover:bg-red-600 text-white"
                            }`}
                        >
                            Above ₹250
                        </button>
                    </div>
                </div>

                {/* =========================
                    FOOD GRID
                ========================== */}
                {filteredFoods.length > 0 ? (
                    <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mt-8 sm:mt-10">
                        {filteredFoods.map((food) => (
                            <FoodCard key={food.id || food._id} food={food} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="text-5xl">🔍</div>
                        <h3 className="text-xl font-bold mt-4 text-gray-800 dark:text-white">
                            {filter === "veg"
                                ? "No vegetarian dishes available."
                                : filter === "nonveg"
                                ? "No non-vegetarian dishes available."
                                : "No food found"}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">
                            {filter === "veg" || filter === "nonveg"
                                ? "Try switching your food type filter or search term."
                                : "Try another food name or filter."}
                        </p>
                    </div>
                )}
            </section>

            {/* =========================
                DYNAMIC DIWALI & PROMOTIONAL OFFER SECTION
            ========================== */}
            {sessionOffer ? (
                <section id="offer-banner" className="relative overflow-hidden bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 text-white py-14 px-6 shadow-xl">
                    {/* Festive Decorative Background Diya Accents */}
                    <div className="absolute top-2 left-6 text-4xl opacity-20 select-none animate-pulse">🪔</div>
                    <div className="absolute bottom-2 right-8 text-5xl opacity-20 select-none animate-pulse">🪔</div>
                    <div className="absolute top-4 right-1/4 text-2xl opacity-25 select-none">✨</div>
                    <div className="absolute bottom-6 left-1/4 text-3xl opacity-25 select-none">✨</div>

                    <div className="relative max-w-4xl mx-auto text-center z-10">
                        <div className="inline-flex items-center gap-2 bg-amber-500/30 backdrop-blur-sm border border-amber-300/40 text-amber-100 px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide uppercase mb-4 shadow-sm">
                            <span>🪔</span>
                            <span>Diwali Special Festival Offer</span>
                            <span>✨</span>
                        </div>

                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-sm">
                            {sessionOffer.title}
                        </h2>

                        <p className="text-lg sm:text-xl text-orange-100 mt-4 max-w-2xl mx-auto font-medium leading-relaxed">
                            {sessionOffer.message}
                        </p>

                        {sessionOffer.subtitle && (
                            <p className="text-base sm:text-lg text-amber-200 font-bold mt-2">
                                🌟 {sessionOffer.subtitle}
                            </p>
                        )}

                        {sessionOffer.offerType === "coupon" && sessionOffer.couponCode ? (
                            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                                <div className="flex items-center bg-white text-slate-900 rounded-2xl p-2 shadow-2xl border-2 border-amber-300">
                                    <span className="font-mono text-2xl font-black px-5 py-2 tracking-widest text-red-600">
                                        {sessionOffer.couponCode}
                                    </span>
                                    <button
                                        onClick={() => handleCopyCode(sessionOffer.couponCode)}
                                        className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold px-5 py-2.5 rounded-xl transition duration-200 text-sm shadow cursor-pointer active:scale-95"
                                        aria-label="Copy coupon code"
                                    >
                                        {copied ? "✓ Copied!" : "Copy Code"}
                                    </button>
                                </div>
                                <button
                                    onClick={() => {
                                        document.getElementById("popular-foods")?.scrollIntoView({ behavior: "smooth" });
                                    }}
                                    className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold px-6 py-3 rounded-xl transition shadow text-base active:scale-95 cursor-pointer"
                                >
                                    Order Now 🍽️
                                </button>
                            </div>
                        ) : (
                            <div className="mt-6">
                                <span className="inline-block bg-white text-red-600 font-bold px-6 py-2.5 rounded-xl shadow text-lg">
                                    {sessionOffer.discountType === "percentage"
                                        ? `Flat ${sessionOffer.discountValue}% OFF Auto-Applied at Checkout`
                                        : `Flat ₹${sessionOffer.discountValue} OFF Auto-Applied at Checkout`}
                                </span>
                            </div>
                        )}
                    </div>
                </section>
            ) : (
                <section id="offer-banner" className="bg-gradient-to-r from-red-500 to-orange-500 text-white py-14 px-6 text-center shadow-md">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-3xl sm:text-4xl font-bold">🔥 Special Savings Offer</h2>
                        <p className="text-xl sm:text-2xl mt-4">Flat 30% OFF Above ₹999</p>
                        <p className="mt-3 text-orange-100">Use Coupon Code</p>
                        <div className="inline-block bg-white text-red-600 px-7 py-2.5 rounded-xl text-xl font-bold mt-3 shadow-lg">
                            FOOD30
                        </div>
                    </div>
                </section>
            )}

            {/* =========================
                WHY CHOOSE US
            ========================== */}
            <section className="max-w-7xl mx-auto px-6 py-16">
                <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-800 dark:text-white mb-12">
                    Why Choose FoodExpress?
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        {
                            icon: "🚚",
                            title: "Fast Delivery",
                            text: "Delivery within 30 minutes."
                        },
                        {
                            icon: "🍽️",
                            title: "Fresh Food",
                            text: "Prepared with fresh ingredients."
                        },
                        {
                            icon: "💳",
                            title: "Secure Payment",
                            text: "Safe online payment options."
                        },
                        {
                            icon: "⭐",
                            title: "Top Rated",
                            text: "Thousands of happy customers."
                        }
                    ].map((item) => (
                        <div
                            key={item.title}
                            className="bg-white dark:bg-gray-800 p-7 rounded-xl shadow-md text-center"
                        >
                            <div className="text-5xl">{item.icon}</div>
                            <h3 className="text-xl font-bold mt-4 text-gray-800 dark:text-white">
                                {item.title}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                                {item.text}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* =========================
                CUSTOMER REVIEWS SECTION
            ========================== */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-gray-100 dark:border-gray-800">
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <div className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                        ⭐ Real FoodExpress Reviews
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
                        What Our Customers Say
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-3 text-base">
                        See what FoodExpress customers are saying about their experience.
                    </p>
                </div>

                {reviewsLoading ? (
                    <div className="py-12 text-center">
                        <div className="text-4xl animate-pulse mb-3">⭐</div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Loading customer reviews...</p>
                    </div>
                ) : publicReviews.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 p-10 text-center max-w-md mx-auto">
                        <div className="text-4xl mb-3">🌟</div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                            Be the first to share your FoodExpress experience!
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                            Order delicious dishes from your favourite restaurants and share your feedback.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {publicReviews.map((rev) => (
                            <div
                                key={rev.id}
                                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700 p-6 flex flex-col justify-between"
                            >
                                <div>
                                    {/* Star Rating */}
                                    <div className="flex items-center gap-1 text-amber-400 text-lg mb-4">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <span key={star}>
                                                {star <= rev.rating ? "★" : "☆"}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Dish Name if provided */}
                                    {rev.foodName ? (
                                        <div className="mb-2">
                                            <span className="inline-block bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                                🍽️ {rev.foodName}
                                            </span>
                                        </div>
                                    ) : null}

                                    {/* Comment if provided */}
                                    {rev.comment && rev.comment.trim() ? (
                                        <p className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed italic mb-6">
                                            "{rev.comment}"
                                        </p>
                                    ) : (
                                        <p className="text-gray-400 dark:text-gray-500 text-xs italic mb-6">
                                            Rated {rev.rating} out of 5 stars
                                        </p>
                                    )}
                                </div>

                                {/* Review Images Thumbnails */}
                                    {Array.isArray(rev.images) && rev.images.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {rev.images.map((img, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => setPreviewImage(getBackendAssetUrl(img))}
                                                    className="relative h-14 w-14 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:scale-105 transition cursor-pointer"
                                                    title="Click to enlarge"
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

                                <div className="pt-4 border-t border-gray-100 dark:border-gray-700/80 flex items-end justify-between gap-3">
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white text-sm">
                                            — {rev.customerDisplayName}
                                        </p>
                                        <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mt-0.5">
                                            {rev.restaurantName}
                                        </p>
                                    </div>
                                    <span className="text-[11px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                        {rev.createdAt
                                            ? new Date(rev.createdAt).toLocaleDateString("en-IN", {
                                                  day: "2-digit",
                                                  month: "short",
                                                  year: "numeric"
                                              })
                                            : ""}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Image Preview Modal */}
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
                            alt="Enlarged review photo"
                            className="max-h-[80dvh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
                        />
                    </div>
                </div>
            )}

            {/* =========================
                FOOTER
            ========================== */}
            <Footer />
        </div>
    );
}

export default Home;
