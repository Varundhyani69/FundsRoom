const express = require("express");
const { body } = require("express-validator");
const {
    getProducts, getProductById, createProduct,
    updateProduct, adjustStock, getStockMovements,
} = require("./product.controller");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");

const router = express.Router();

router.use(authenticate);

const productValidation = [
    body("name").trim().notEmpty().withMessage("Product name is required"),
    body("sku").trim().notEmpty().withMessage("SKU is required"),
    body("unit_price")
        .isFloat({ min: 0 })
        .withMessage("Unit price must be a positive number"),
    body("current_stock")
        .optional()
        .isInt({ min: 0 })
        .withMessage("Stock must be a non-negative integer"),
    body("min_stock_alert")
        .optional()
        .isInt({ min: 0 })
        .withMessage("Min stock alert must be a non-negative integer"),
];

const adjustValidation = [
    body("quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
    body("movement_type")
        .isIn(["IN", "OUT"])
        .withMessage("Movement type must be IN or OUT"),
    body("reason").trim().notEmpty().withMessage("Reason is required"),
];

// GET /products
router.get("/", getProducts);

// GET /products/:id
router.get("/:id", getProductById);

// POST /products  (admin + warehouse)
router.post("/", authorize("admin", "warehouse"), productValidation, createProduct);

// PUT /products/:id  (admin + warehouse)
router.put("/:id", authorize("admin", "warehouse"), productValidation, updateProduct);

// POST /products/:id/stock-adjust  (admin + warehouse)
router.post("/:id/stock-adjust", authorize("admin", "warehouse"), adjustValidation, adjustStock);

module.exports = router;
