const express = require("express");
const { body } = require("express-validator");
const { login, getMe, register } = require("./auth.controller");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");

const router = express.Router();

// POST /auth/login
router.post(
    "/login",
    [
        body("email").isEmail().withMessage("Enter a valid email"),
        body("password").notEmpty().withMessage("Password is required"),
    ],
    login
);

// GET /auth/me  (protected)
router.get("/me", authenticate, getMe);

// POST /auth/register  (admin only)
router.post(
    "/register",
    authenticate,
    authorize("admin"),
    [
        body("name").trim().notEmpty().withMessage("Name is required"),
        body("email").isEmail().withMessage("Enter a valid email"),
        body("password")
            .isLength({ min: 6 })
            .withMessage("Password must be at least 6 characters"),
        body("role")
            .optional()
            .isIn(["admin", "sales", "warehouse", "accounts"])
            .withMessage("Invalid role"),
    ],
    register
);

module.exports = router;
