const Coupon = require("../models/Coupon");
const SessionOffer = require("../models/SessionOffer");

async function seedInitialOffers() {
    try {
        const now = new Date();
        const sixtyDaysLater = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // 1. Initial DIWALI20 Coupon
        const existingDiwali = await Coupon.findOne({ code: "DIWALI20" });
        if (!existingDiwali) {
            await Coupon.create({
                code: "DIWALI20",
                discountType: "percentage",
                discountValue: 20,
                minSubtotal: 499,
                maxDiscount: 200,
                startDate: oneDayAgo,
                endDate: sixtyDaysLater,
                usageLimit: 1000,
                redemptionCount: 0,
                isActive: true,
                description: "Diwali Special Offer — Flat 20% OFF on orders above ₹499 (Max ₹200)"
            });
            console.log("Seeded default DIWALI20 coupon 🪔");
        }

        // 2. Preserved FOOD30 Coupon
        const existingFood30 = await Coupon.findOne({ code: "FOOD30" });
        if (!existingFood30) {
            await Coupon.create({
                code: "FOOD30",
                discountType: "percentage",
                discountValue: 30,
                minSubtotal: 999,
                maxDiscount: 300,
                startDate: oneDayAgo,
                endDate: sixtyDaysLater,
                usageLimit: 1000,
                redemptionCount: 0,
                isActive: true,
                description: "Weekend Mega Offer — Flat 30% OFF on orders above ₹999 (Max ₹300)"
            });
            console.log("Seeded default FOOD30 coupon 🍔");
        }

        // 3. Initial Diwali Session Offer
        const existingOffer = await SessionOffer.findOne({ couponCode: "DIWALI20" });
        if (!existingOffer) {
            await SessionOffer.create({
                title: "🪔 Diwali Dhamaka – Special Festival Offer",
                message: "Celebrate Diwali with delicious food and exciting festive savings!",
                subtitle: "Flat 20% OFF on orders above ₹499 (Max ₹200)",
                offerType: "coupon",
                couponCode: "DIWALI20",
                discountType: "percentage",
                discountValue: 20,
                minSubtotal: 499,
                maxDiscount: 200,
                startDate: oneDayAgo,
                endDate: sixtyDaysLater,
                isActive: true,
                showBanner: true
            });
            console.log("Seeded default Diwali Dhamaka Session Offer 🪔✨");
        }
    } catch (err) {
        console.error("Warning: Failed to seed default offers:", err.message);
    }
}

module.exports = seedInitialOffers;

