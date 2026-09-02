const express = require("express");
const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
const controller = require("../controllers/adminController");

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

module.exports = router;
