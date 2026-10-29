const SessionOffer = require("../models/SessionOffer");
const Coupon = require("../models/Coupon");

// ==========================================
// CUSTOMER: GET CURRENT ACTIVE PROMOTIONAL OFFER
// ==========================================
exports.getCurrentOffer = async (req, res) => {
    try {
        const now = new Date();
        const activeOffer = await SessionOffer.findOne({
            isActive: true,
            showBanner: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        }).sort({ createdAt: -1 });

        if (!activeOffer) {
            return res.status(200).json({
                active: false,
                offer: null
            });
        }

        // Return only safe customer-facing data
        return res.status(200).json({
            active: true,
            offer: {
                id: activeOffer._id,
                title: activeOffer.title,
                message: activeOffer.message,
                subtitle: activeOffer.subtitle,
                offerType: activeOffer.offerType,
                couponCode: activeOffer.couponCode,
                discountType: activeOffer.discountType,
                discountValue: activeOffer.discountValue,
                minSubtotal: activeOffer.minSubtotal,
                maxDiscount: activeOffer.maxDiscount,
                startDate: activeOffer.startDate,
                endDate: activeOffer.endDate
            }
        });
    } catch (error) {
        console.error("Get current offer error:", error);
        return res.status(500).json({ message: "Failed to retrieve promotional offer" });
    }
};

// ==========================================
// ADMIN: LIST ALL SESSION OFFERS
// ==========================================
exports.listOffers = async (req, res) => {
    try {
        const offers = await SessionOffer.find().sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            count: offers.length,
            offers
        });
    } catch (error) {
        console.error("List session offers error:", error);
        return res.status(500).json({ message: "Failed to retrieve session offers" });
    }
};

// ==========================================
// ADMIN: GET SESSION OFFER BY ID
// ==========================================
exports.getOfferById = async (req, res) => {
    try {
        const offer = await SessionOffer.findById(req.params.id);
        if (!offer) {
            return res.status(404).json({ message: "Session offer not found" });
        }
        return res.status(200).json({ success: true, offer });
    } catch (error) {
        return res.status(500).json({ message: "Failed to retrieve session offer" });
    }
};

// ==========================================
// ADMIN: CREATE SESSION OFFER
// ==========================================
exports.createOffer = async (req, res) => {
    try {
        const {
            title,
            message,
            subtitle,
            offerType,
            couponCode,
            discountType,
            discountValue,
            minSubtotal,
            maxDiscount,
            startDate,
            endDate,
            isActive,
            showBanner
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ message: "Offer title is required" });
        }
        if (!message || !message.trim()) {
            return res.status(400).json({ message: "Offer message is required" });
        }

        const type = offerType === "direct" ? "direct" : "coupon";
        let code = "";

        if (type === "coupon") {
            if (!couponCode || !couponCode.trim()) {
                return res.status(400).json({ message: "Coupon code is required for coupon-based offers" });
            }
            code = couponCode.trim().toUpperCase();
            // Optional: verify coupon exists
            const couponExists = await Coupon.findOne({ code });
            if (!couponExists) {
                return res.status(400).json({ message: `Coupon with code "${code}" does not exist in Coupon Management` });
            }
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime())) {
            return res.status(400).json({ message: "Valid start date is required" });
        }
        if (isNaN(end.getTime())) {
            return res.status(400).json({ message: "Valid end date is required" });
        }
        if (end <= start) {
            return res.status(400).json({ message: "End date must be after the start date" });
        }

        const offer = new SessionOffer({
            title: title.trim(),
            message: message.trim(),
            subtitle: (subtitle || "").trim(),
            offerType: type,
            couponCode: code,
            discountType: discountType === "fixed" ? "fixed" : "percentage",
            discountValue: discountValue ? Number(discountValue) : 0,
            minSubtotal: minSubtotal ? Number(minSubtotal) : 0,
            maxDiscount: maxDiscount ? Number(maxDiscount) : null,
            startDate: start,
            endDate: end,
            isActive: isActive !== false,
            showBanner: showBanner !== false
        });

        await offer.save();

        return res.status(201).json({
            success: true,
            message: `Session offer "${offer.title}" created successfully`,
            offer
        });
    } catch (error) {
        console.error("Create session offer error:", error);
        return res.status(500).json({ message: error.message || "Failed to create session offer" });
    }
};

// ==========================================
// ADMIN: UPDATE SESSION OFFER
// ==========================================
exports.updateOffer = async (req, res) => {
    try {
        const offer = await SessionOffer.findById(req.params.id);
        if (!offer) {
            return res.status(404).json({ message: "Session offer not found" });
        }

        const {
            title,
            message,
            subtitle,
            offerType,
            couponCode,
            discountType,
            discountValue,
            minSubtotal,
            maxDiscount,
            startDate,
            endDate,
            isActive,
            showBanner
        } = req.body;

        if (title !== undefined) offer.title = title.trim();
        if (message !== undefined) offer.message = message.trim();
        if (subtitle !== undefined) offer.subtitle = subtitle.trim();

        if (offerType !== undefined) {
            offer.offerType = offerType === "direct" ? "direct" : "coupon";
        }

        if (offer.offerType === "coupon" && couponCode !== undefined) {
            const code = couponCode.trim().toUpperCase();
            const couponExists = await Coupon.findOne({ code });
            if (!couponExists) {
                return res.status(400).json({ message: `Coupon with code "${code}" does not exist` });
            }
            offer.couponCode = code;
        }

        if (discountType !== undefined) {
            offer.discountType = discountType === "fixed" ? "fixed" : "percentage";
        }
        if (discountValue !== undefined) {
            offer.discountValue = Number(discountValue) || 0;
        }
        if (minSubtotal !== undefined) {
            offer.minSubtotal = Number(minSubtotal) || 0;
        }
        if (maxDiscount !== undefined) {
            offer.maxDiscount = maxDiscount === "" || maxDiscount === null ? null : Number(maxDiscount);
        }

        if (startDate) {
            const start = new Date(startDate);
            if (isNaN(start.getTime())) return res.status(400).json({ message: "Invalid start date" });
            offer.startDate = start;
        }
        if (endDate) {
            const end = new Date(endDate);
            if (isNaN(end.getTime())) return res.status(400).json({ message: "Invalid end date" });
            offer.endDate = end;
        }
        if (offer.endDate <= offer.startDate) {
            return res.status(400).json({ message: "End date must be after start date" });
        }

        if (isActive !== undefined) offer.isActive = Boolean(isActive);
        if (showBanner !== undefined) offer.showBanner = Boolean(showBanner);

        await offer.save();

        return res.status(200).json({
            success: true,
            message: `Session offer "${offer.title}" updated successfully`,
            offer
        });
    } catch (error) {
        console.error("Update session offer error:", error);
        return res.status(500).json({ message: error.message || "Failed to update session offer" });
    }
};

// ==========================================
// ADMIN: TOGGLE OFFER ACTIVE STATUS
// ==========================================
exports.toggleOfferStatus = async (req, res) => {
    try {
        const offer = await SessionOffer.findById(req.params.id);
        if (!offer) {
            return res.status(404).json({ message: "Session offer not found" });
        }

        offer.isActive = !offer.isActive;
        await offer.save();

        return res.status(200).json({
            success: true,
            message: `Offer "${offer.title}" is now ${offer.isActive ? "active" : "inactive"}`,
            offer
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to toggle offer status" });
    }
};

// ==========================================
// ADMIN: TOGGLE BANNER VISIBILITY
// ==========================================
exports.toggleBannerVisibility = async (req, res) => {
    try {
        const offer = await SessionOffer.findById(req.params.id);
        if (!offer) {
            return res.status(404).json({ message: "Session offer not found" });
        }

        offer.showBanner = !offer.showBanner;
        await offer.save();

        return res.status(200).json({
            success: true,
            message: `Banner visibility for "${offer.title}" is now ${offer.showBanner ? "visible" : "hidden"}`,
            offer
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to toggle banner visibility" });
    }
};

// ==========================================
// ADMIN: DELETE SESSION OFFER
// ==========================================
exports.deleteOffer = async (req, res) => {
    try {
        const offer = await SessionOffer.findByIdAndDelete(req.params.id);
        if (!offer) {
            return res.status(404).json({ message: "Session offer not found" });
        }
        return res.status(200).json({
            success: true,
            message: `Session offer "${offer.title}" deleted successfully`
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to delete session offer" });
    }
};

