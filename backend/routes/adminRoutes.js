const express = require("express");
const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
const controller = require("../controllers/adminController");
const couponController = require("../controllers/couponController");
const sessionOfferController = require("../controllers/sessionOfferController");

const router = express.Router();

router.post("/login", controller.adminLogin);
router.use(auth, admin);
router.get("/dashboard/stats", controller.dashboardStats);
router.get("/orders", controller.getOrders);
router.get("/orders/:id", controller.getOrder);
router.put("/orders/:id/status", controller.updateOrderStatus);
router.get("/customers", controller.getCustomers);
router.get("/customers/:id", controller.getCustomer);
router.get("/foods", controller.listFoods);
router.post("/foods", controller.createFood);
router.put("/foods/:id", controller.updateFood);
router.delete("/foods/:id", controller.deleteFood);
router.put("/foods/:id/availability", controller.setFoodAvailability);
router.get("/restaurants", controller.listRestaurants);
router.post("/restaurants", controller.createRestaurant);
router.put("/restaurants/:id", controller.updateRestaurant);
router.delete("/restaurants/:id", controller.deleteRestaurant);
router.get("/reports", controller.reports);
router.get("/profile", controller.getProfile);
router.put("/profile", controller.updateProfile);

// Coupons Management
router.get("/coupons", couponController.listCoupons);
router.post("/coupons", couponController.createCoupon);
router.get("/coupons/:id", couponController.getCouponById);
router.put("/coupons/:id", couponController.updateCoupon);
router.patch("/coupons/:id/toggle", couponController.toggleCouponStatus);
router.delete("/coupons/:id", couponController.deleteCoupon);

// Session Offers Management
router.get("/session-offers", sessionOfferController.listOffers);
router.post("/session-offers", sessionOfferController.createOffer);
router.get("/session-offers/:id", sessionOfferController.getOfferById);
router.put("/session-offers/:id", sessionOfferController.updateOffer);
router.patch("/session-offers/:id/toggle", sessionOfferController.toggleOfferStatus);
router.patch("/session-offers/:id/banner", sessionOfferController.toggleBannerVisibility);
router.delete("/session-offers/:id", sessionOfferController.deleteOffer);

module.exports = router;
