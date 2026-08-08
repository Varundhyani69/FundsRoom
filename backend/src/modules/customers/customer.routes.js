const express = require("express");
const { body } = require("express-validator");
const {
    getCustomers, getCustomerById, createCustomer, updateCustomer, addFollowup,
} = require("./customer.controller");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");

const router = express.Router();

// all customer routes require login
router.use(authenticate);

const customerValidation = [
    body("name").trim().notEmpty().withMessage("Customer name is required"),
    body("mobile")
        .trim()
        .notEmpty().withMessage("Mobile number is required")
        .matches(/^[0-9]{7,15}$/).withMessage("Enter a valid mobile number"),
    body("email").optional({ checkFalsy: true }).isEmail().withMessage("Enter a valid email"),
    body("customer_type")
        .optional()
        .isIn(["retail", "wholesale", "distributor"])
        .withMessage("Invalid customer type"),
    body("status")
        .optional()
        .isIn(["lead", "active", "inactive"])
        .withMessage("Invalid status"),
];

// GET /customers
router.get("/", getCustomers);

// GET /customers/:id
router.get("/:id", getCustomerById);

// POST /customers  (sales + admin only)
router.post("/", authorize("admin", "sales"), customerValidation, createCustomer);

// PUT /customers/:id  (sales + admin only)
router.put("/:id", authorize("admin", "sales"), customerValidation, updateCustomer);

// POST /customers/:id/followups
router.post(
    "/:id/followups",
    authorize("admin", "sales"),
    [body("note").trim().notEmpty().withMessage("Note is required")],
    addFollowup
);

module.exports = router;
