import { Router } from "express";
import { body } from "express-validator";
import { getProducts, getProductById, createProduct, updateProduct, adjustStock } from "./product.controller";
import authenticate from "../../middleware/authenticate";
import authorize from "../../middleware/authorize";

const router = Router();

router.use(authenticate);

const productValidation = [
    body("name").trim().notEmpty().withMessage("Product name is required"),
    body("sku").trim().notEmpty().withMessage("SKU is required"),
    body("unit_price").isFloat({ min: 0 }).withMessage("Unit price must be a positive number"),
    body("current_stock").optional().isInt({ min: 0 }).withMessage("Stock must be a non-negative integer"),
    body("min_stock_alert").optional().isInt({ min: 0 }).withMessage("Min stock alert must be a non-negative integer"),
];

const adjustValidation = [
    body("quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
    body("movement_type").isIn(["IN", "OUT"]).withMessage("Movement type must be IN or OUT"),
    body("reason").trim().notEmpty().withMessage("Reason is required"),
];

router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/", authorize("admin", "warehouse"), productValidation, createProduct);
router.put("/:id", authorize("admin", "warehouse"), productValidation, updateProduct);
router.post("/:id/stock-adjust", authorize("admin", "warehouse"), adjustValidation, adjustStock);

export default router;
