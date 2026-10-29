const Coupon = require("../models/Coupon");
const { calculateAuthoritativeSubtotal, validateCoupon } = require("../services/discountService");

// ==========================================
// CUSTOMER: VALIDATE COUPON
// ==========================================
exports.validateCoupon = async (req, res) => {
    try {
        const { code, items } = req.body;

        if (!code || typeof code !== "string" || !code.trim()) {
            return res.status(400).json({ message: "Please enter a coupon code" });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "Your cart is empty" });
        }

        const { subtotal } = await calculateAuthoritativeSubtotal(items);
        const result = await validateCoupon(code, subtotal);

        return res.status(200).json(result);
    } catch (error) {
        return res.status(400).json({
            valid: false,
            message: error.message || "Failed to validate coupon"
        });
    }
};

// ==========================================
// ADMIN: LIST ALL COUPONS
// ==========================================
exports.listCoupons = async (req, res) => {
    try {
        const { search, status } = req.query;
        const query = {};

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), "i");
            query.$or = [{ code: regex }, { description: regex }];
        }

        const coupons = await Coupon.find(query).sort({ createdAt: -1 });

        // Filter by virtual status if requested
        let filtered = coupons;
        if (status && status !== "all") {
            filtered = coupons.filter((c) => c.status === status);
        }

        return res.status(200).json({
            success: true,
            count: filtered.length,
            coupons: filtered
        });
    } catch (error) {
        console.error("List coupons error:", error);
        return res.status(500).json({ message: "Failed to retrieve coupons" });
    }
};

// ==========================================
// ADMIN: GET COUPON BY ID
// ==========================================
exports.getCouponById = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({ message: "Coupon not found" });
        }
        return res.status(200).json({ success: true, coupon });
    } catch (error) {
        return res.status(500).json({ message: "Failed to retrieve coupon" });
    }
};

// ==========================================
// ADMIN: CREATE COUPON
// ==========================================
exports.createCoupon = async (req, res) => {
    try {
        const {
            code,
            discountType,
            discountValue,
            minSubtotal,
            maxDiscount,
            startDate,
            endDate,
            usageLimit,
            isActive,
            description
        } = req.body;

        if (!code || !code.trim()) {
            return res.status(400).json({ message: "Coupon code is required" });
        }

        const normalizedCode = code.trim().toUpperCase();
        const existing = await Coupon.findOne({ code: normalizedCode });
        if (existing) {
            return res.status(400).json({ message: `Coupon code "${normalizedCode}" already exists` });
        }

        const type = discountType === "fixed" ? "fixed" : "percentage";
        const val = Number(discountValue);
        if (!Number.isFinite(val) || val <= 0) {
            return res.status(400).json({ message: "Discount value must be a positive number" });
        }

        if (type === "percentage" && val > 100) {
            return res.status(400).json({ message: "Percentage discount cannot exceed 100%" });
        }

        const minSub = minSubtotal !== undefined && minSubtotal !== "" ? Number(minSubtotal) : 0;
        if (!Number.isFinite(minSub) || minSub < 0) {
            return res.status(400).json({ message: "Minimum subtotal cannot be negative" });
        }

        const maxDisc = maxDiscount !== undefined && maxDiscount !== "" && maxDiscount !== null ? Number(maxDiscount) : null;
        if (maxDisc !== null && (!Number.isFinite(maxDisc) || maxDisc < 0)) {
            return res.status(400).json({ message: "Maximum discount cap cannot be negative" });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime())) {
            return res.status(400).json({ message: "Valid start date and time is required" });
        }
        if (isNaN(end.getTime())) {
            return res.status(400).json({ message: "Valid expiry date and time is required" });
        }
        if (end <= start) {
            return res.status(400).json({ message: "Expiry date must be after the start date" });
        }

        const limit = usageLimit !== undefined && usageLimit !== "" && usageLimit !== null ? Number(usageLimit) : null;
        if (limit !== null && (!Number.isInteger(limit) || limit < 1)) {
            return res.status(400).json({ message: "Usage limit must be a positive integer" });
        }

        const coupon = new Coupon({
            code: normalizedCode,
            discountType: type,
            discountValue: val,
            minSubtotal: minSub,
            maxDiscount: maxDisc,
            startDate: start,
            endDate: end,
            usageLimit: limit,
            isActive: isActive !== false,
            description: (description || "").trim()
        });

        await coupon.save();

        return res.status(201).json({
            success: true,
            message: `Coupon ${coupon.code} created successfully`,
            coupon
        });
    } catch (error) {
        console.error("Create coupon error:", error);
        return res.status(500).json({ message: error.message || "Failed to create coupon" });
    }
};

// ==========================================
// ADMIN: UPDATE COUPON
// ==========================================
exports.updateCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({ message: "Coupon not found" });
        }

        const {
            code,
            discountType,
            discountValue,
            minSubtotal,
            maxDiscount,
            startDate,
            endDate,
            usageLimit,
            isActive,
            description
        } = req.body;

        if (code && code.trim()) {
            const normalizedCode = code.trim().toUpperCase();
            if (normalizedCode !== coupon.code) {
                const existing = await Coupon.findOne({ code: normalizedCode });
                if (existing) {
                    return res.status(400).json({ message: `Coupon code "${normalizedCode}" already in use` });
                }
                coupon.code = normalizedCode;
            }
        }

        if (discountType) {
            coupon.discountType = discountType === "fixed" ? "fixed" : "percentage";
        }

        if (discountValue !== undefined) {
            const val = Number(discountValue);
            if (!Number.isFinite(val) || val <= 0) {
                return res.status(400).json({ message: "Discount value must be a positive number" });
            }
            if (coupon.discountType === "percentage" && val > 100) {
                return res.status(400).json({ message: "Percentage discount cannot exceed 100%" });
            }
            coupon.discountValue = val;
        }

        if (minSubtotal !== undefined) {
            const minSub = Number(minSubtotal);
            if (!Number.isFinite(minSub) || minSub < 0) {
                return res.status(400).json({ message: "Minimum subtotal cannot be negative" });
            }
            coupon.minSubtotal = minSub;
        }

        if (maxDiscount !== undefined) {
            const maxDisc = maxDiscount === "" || maxDiscount === null ? null : Number(maxDiscount);
            if (maxDisc !== null && (!Number.isFinite(maxDisc) || maxDisc < 0)) {
                return res.status(400).json({ message: "Maximum discount cap cannot be negative" });
            }
            coupon.maxDiscount = maxDisc;
        }

        if (startDate) {
            const start = new Date(startDate);
            if (isNaN(start.getTime())) {
                return res.status(400).json({ message: "Invalid start date format" });
            }
            coupon.startDate = start;
        }

        if (endDate) {
            const end = new Date(endDate);
            if (isNaN(end.getTime())) {
                return res.status(400).json({ message: "Invalid expiry date format" });
            }
            coupon.endDate = end;
        }

        if (coupon.endDate <= coupon.startDate) {
            return res.status(400).json({ message: "Expiry date must be after the start date" });
        }

        if (usageLimit !== undefined) {
            const limit = usageLimit === "" || usageLimit === null ? null : Number(usageLimit);
            if (limit !== null && (!Number.isInteger(limit) || limit < 1)) {
                return res.status(400).json({ message: "Usage limit must be a positive integer" });
            }
            coupon.usageLimit = limit;
        }

        if (isActive !== undefined) {
            coupon.isActive = Boolean(isActive);
        }

        if (description !== undefined) {
            coupon.description = description.trim();
        }

        await coupon.save();

        return res.status(200).json({
            success: true,
            message: `Coupon ${coupon.code} updated successfully`,
            coupon
        });
    } catch (error) {
        console.error("Update coupon error:", error);
        return res.status(500).json({ message: error.message || "Failed to update coupon" });
    }
};

// ==========================================
// ADMIN: TOGGLE COUPON STATUS
// ==========================================
exports.toggleCouponStatus = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({ message: "Coupon not found" });
        }

        coupon.isActive = !coupon.isActive;
        await coupon.save();

        return res.status(200).json({
            success: true,
            message: `Coupon ${coupon.code} is now ${coupon.isActive ? "active" : "inactive"}`,
            coupon
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to toggle coupon status" });
    }
};

// ==========================================
// ADMIN: DELETE COUPON
// ==========================================
exports.deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id);
        if (!coupon) {
            return res.status(404).json({ message: "Coupon not found" });
        }

        return res.status(200).json({
            success: true,
            message: `Coupon ${coupon.code} deleted successfully`
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to delete coupon" });
    }
};

