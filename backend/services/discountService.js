const Food = require("../models/Food");
const Coupon = require("../models/Coupon");
const SessionOffer = require("../models/SessionOffer");

/**
 * Calculates authoritative food subtotal by querying MongoDB Food prices.
 * Returns { items: [{ foodId, name, price, quantity }], subtotal }
 */
async function calculateAuthoritativeSubtotal(requestedItems) {
    if (!Array.isArray(requestedItems) || requestedItems.length === 0) {
        throw new Error("Order must contain at least one item");
    }

    const foodIds = requestedItems.map((item) => String(item.foodId || item.id || "")).filter(Boolean);
    if (foodIds.length !== requestedItems.length) {
        throw new Error("Every item must have a valid foodId");
    }

    const foods = await Food.find({
        _id: { $in: foodIds },
        availability: true
    }).populate({ path: "restaurant", match: { active: true } });

    if (foods.length !== requestedItems.length || foods.some((f) => !f.restaurant)) {
        throw new Error("One or more items in your cart are currently unavailable");
    }

    const foodsById = new Map(foods.map((food) => [String(food._id), food]));

    const validatedItems = requestedItems.map((item) => {
        const id = String(item.foodId || item.id);
        const food = foodsById.get(id);
        const quantity = Number(item.quantity);

        if (!food || !Number.isInteger(quantity) || quantity < 1) {
            throw new Error(`Invalid item quantity for "${item.name || id}"`);
        }

        return {
            foodId: String(food._id),
            name: food.name,
            price: Number(food.price),
            quantity
        };
    });

    const subtotal = validatedItems.reduce(
        (acc, it) => acc + it.price * it.quantity,
        0
    );

    return { validatedItems, subtotal };
}

/**
 * Evaluates currently eligible direct session discount for a given subtotal.
 * Returns null if no eligible direct session offer exists.
 */
async function getEligibleDirectSessionOffer(subtotal, now = new Date()) {
    const activeDirectOffer = await SessionOffer.findOne({
        isActive: true,
        offerType: "direct",
        startDate: { $lte: now },
        endDate: { $gte: now }
    }).sort({ createdAt: -1 });

    if (!activeDirectOffer) return null;

    if (activeDirectOffer.minSubtotal && subtotal < activeDirectOffer.minSubtotal) {
        return null;
    }

    let discount = 0;
    if (activeDirectOffer.discountType === "percentage") {
        discount = (subtotal * activeDirectOffer.discountValue) / 100;
        if (activeDirectOffer.maxDiscount && activeDirectOffer.maxDiscount > 0) {
            discount = Math.min(discount, activeDirectOffer.maxDiscount);
        }
    } else {
        discount = Math.min(activeDirectOffer.discountValue, subtotal);
    }

    discount = Math.round(discount * 100) / 100;
    discount = Math.min(discount, subtotal);

    return {
        sessionOffer: activeDirectOffer,
        discountAmount: discount,
        discountType: activeDirectOffer.discountType,
        title: activeDirectOffer.title
    };
}

/**
 * Validates a coupon code against an authoritative food subtotal.
 * Returns { valid: true, coupon, discountAmount, discountType, finalPayable, message }
 * Throws friendly Error if coupon is invalid/ineligible.
 */
async function validateCoupon(rawCode, subtotal, now = new Date()) {
    if (!rawCode || typeof rawCode !== "string") {
        throw new Error("Coupon code is required");
    }

    const code = rawCode.trim().toUpperCase();
    const coupon = await Coupon.findOne({ code });

    if (!coupon) {
        throw new Error("Invalid coupon code. Please check and try again.");
    }

    if (!coupon.isActive) {
        throw new Error("This coupon is currently unavailable.");
    }

    if (coupon.startDate && now < coupon.startDate) {
        throw new Error("This offer is not active yet.");
    }

    if (coupon.endDate && now > coupon.endDate) {
        throw new Error("This coupon has expired.");
    }

    if (coupon.usageLimit && coupon.redemptionCount >= coupon.usageLimit) {
        throw new Error("This coupon has reached its maximum redemption limit.");
    }

    if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
        const difference = coupon.minSubtotal - subtotal;
        throw new Error(
            `Add food worth ₹${difference} more to use coupon ${coupon.code}. (Min. order ₹${coupon.minSubtotal})`
        );
    }

    let discount = 0;
    if (coupon.discountType === "percentage") {
        discount = (subtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscount && coupon.maxDiscount > 0) {
            discount = Math.min(discount, coupon.maxDiscount);
        }
    } else {
        discount = Math.min(coupon.discountValue, subtotal);
    }

    // Round to 2 decimal places and never exceed subtotal
    discount = Math.round(discount * 100) / 100;
    discount = Math.min(discount, subtotal);

    const finalPayable = Math.max(0, Math.round((subtotal - discount) * 100) / 100);

    return {
        valid: true,
        coupon,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: discount,
        foodSubtotal: subtotal,
        finalPayable,
        message: `Coupon ${coupon.code} applied successfully! (₹${discount} OFF)`
    };
}

/**
 * Calculates authoritative order pricing, evaluating submitted coupon code
 * OR falling back to an active direct session offer.
 */
async function evaluateOrderDiscount({ items, couponCode, now = new Date() }) {
    const { validatedItems, subtotal } = await calculateAuthoritativeSubtotal(items);

    let appliedDiscount = 0;
    let appliedDiscountType = "none";
    let appliedCouponCode = "";
    let appliedSessionTitle = "";
    let couponToRedeem = null;

    if (couponCode && typeof couponCode === "string" && couponCode.trim()) {
        const couponResult = await validateCoupon(couponCode, subtotal, now);
        appliedDiscount = couponResult.discountAmount;
        appliedDiscountType = couponResult.discountType;
        appliedCouponCode = couponResult.coupon.code;
        couponToRedeem = couponResult.coupon;
    } else {
        // Check for direct session offer
        const directOfferResult = await getEligibleDirectSessionOffer(subtotal, now);
        if (directOfferResult && directOfferResult.discountAmount > 0) {
            appliedDiscount = directOfferResult.discountAmount;
            appliedDiscountType = directOfferResult.discountType;
            appliedSessionTitle = directOfferResult.title;
        }
    }

    const finalPayable = Math.max(0, Math.round((subtotal - appliedDiscount) * 100) / 100);

    return {
        validatedItems,
        subtotal,
        discountAmount: appliedDiscount,
        discountType: appliedDiscountType,
        couponCode: appliedCouponCode,
        sessionOfferTitle: appliedSessionTitle,
        couponToRedeem,
        finalPayable
    };
}

module.exports = {
    calculateAuthoritativeSubtotal,
    validateCoupon,
    getEligibleDirectSessionOffer,
    evaluateOrderDiscount
};

