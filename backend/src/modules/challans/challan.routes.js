const express = require("express");
const { body } = require("express-validator");
const {
    getChallans, getChallanById, createChallan, confirmChallan, cancelChallan,
} = require("./challan.controller");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");

const router = express.Router();

router.use(authenticate);

const createValidation = [
    body("customer_id").isInt({ min: 1 }).withMessage("Valid customer is required"),
    body("items").isArray({ min: 1 }).withMessage("At least one item is required"),
    body("items.*.product_id").isInt({ min: 1 }).withMessage("Valid product is required for each item"),
    body("items.*.quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1 for each item"),
    body("status")
        .optional()
        .isIn(["draft", "confirmed"])
        .withMessage("Status must be draft or confirmed"),
];

// GET /challans
router.get("/", getChallans);

// GET /challans/:id
router.get("/:id", getChallanById);

// POST /challans  (sales + admin)
router.post("/", authorize("admin", "sales"), createValidation, createChallan);

// PUT /challans/:id/confirm  (sales + admin)
router.put("/:id/confirm", authorize("admin", "sales"), confirmChallan);

// PUT /challans/:id/cancel  (sales + admin)
router.put("/:id/cancel", authorize("admin", "sales"), cancelChallan);

module.exports = router;
