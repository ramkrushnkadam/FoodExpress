const express = require("express");
const controller = require("../controllers/couponController");

const router = express.Router();

// Customer: validate coupon against cart
router.post("/validate", controller.validateCoupon);

module.exports = router;

