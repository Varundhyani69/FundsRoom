const express = require("express");
const { getStats } = require("./dashboard.controller");
const authenticate = require("../../middleware/authenticate");

const router = express.Router();

router.use(authenticate);

// GET /dashboard/stats
router.get("/stats", getStats);

module.exports = router;
