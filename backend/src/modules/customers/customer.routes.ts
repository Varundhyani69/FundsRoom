import { Router } from "express";
import { body } from "express-validator";
import { getCustomers, getCustomerById, createCustomer, updateCustomer, addFollowup } from "./customer.controller";
import authenticate from "../../middleware/authenticate";
import authorize from "../../middleware/authorize";

const router = Router();

router.use(authenticate);

const customerValidation = [
    body("name").trim().notEmpty().withMessage("Customer name is required"),
    body("mobile").trim().notEmpty().withMessage("Mobile number is required")
        .matches(/^[0-9]{7,15}$/).withMessage("Enter a valid mobile number"),
    body("email").optional({ checkFalsy: true }).isEmail().withMessage("Enter a valid email"),
    body("customer_type").optional().isIn(["retail", "wholesale", "distributor"]).withMessage("Invalid customer type"),
    body("status").optional().isIn(["lead", "active", "inactive"]).withMessage("Invalid status"),
];

router.get("/", getCustomers);
router.get("/:id", getCustomerById);
router.post("/", authorize("admin", "sales"), customerValidation, createCustomer);
router.put("/:id", authorize("admin", "sales"), customerValidation, updateCustomer);
router.post("/:id/followups", authorize("admin", "sales"), [body("note").trim().notEmpty().withMessage("Note is required")], addFollowup);

export default router;
