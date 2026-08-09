import { Router } from "express";
import { body } from "express-validator";
import { getChallans, getChallanById, createChallan, confirmChallan, cancelChallan } from "./challan.controller";
import authenticate from "../../middleware/authenticate";
import authorize from "../../middleware/authorize";

const router = Router();

router.use(authenticate);

const createValidation = [
    body("customer_id").isInt({ min: 1 }).withMessage("Valid customer is required"),
    body("items").isArray({ min: 1 }).withMessage("At least one item is required"),
    body("items.*.product_id").isInt({ min: 1 }).withMessage("Valid product is required for each item"),
    body("items.*.quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1 for each item"),
    body("status").optional().isIn(["draft", "confirmed"]).withMessage("Status must be draft or confirmed"),
];

router.get("/", getChallans);
router.get("/:id", getChallanById);
router.post("/", authorize("admin", "sales"), createValidation, createChallan);
router.put("/:id/confirm", authorize("admin", "sales"), confirmChallan);
router.put("/:id/cancel", authorize("admin", "sales"), cancelChallan);

export default router;
