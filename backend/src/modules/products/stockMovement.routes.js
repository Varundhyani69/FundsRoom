const express = require("express");
const { getStockMovements } = require("./product.controller");
const authenticate = require("../../middleware/authenticate");

const router = express.Router();

router.use(authenticate);

// GET /stock-movements
router.get("/", getStockMovements);

module.exports = router;
