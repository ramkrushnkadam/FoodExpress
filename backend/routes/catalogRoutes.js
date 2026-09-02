const express = require("express");
const controller = require("../controllers/catalogController");
const router = express.Router();
router.get("/foods", controller.listFoods);
router.get("/foods/:id", controller.getFood);
router.get("/restaurants", controller.listRestaurants);
router.get("/restaurants/:id", controller.getRestaurant);
module.exports = router;
