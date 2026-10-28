const express = require("express");
const router = express.Router();
const optionalAuthMiddleware = require("../middleware/optionalAuthMiddleware");
const { handleChatbotMessage } = require("../controllers/chatbotController");

router.post("/message", optionalAuthMiddleware, handleChatbotMessage);

module.exports = router;

