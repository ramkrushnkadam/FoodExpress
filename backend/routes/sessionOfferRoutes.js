const express = require("express");
const controller = require("../controllers/sessionOfferController");

const router = express.Router();

// Customer: get currently active promotional offer (for homepage Diwali banner)
router.get("/current", controller.getCurrentOffer);
router.get("/active", controller.getCurrentOffer);

module.exports = router;

