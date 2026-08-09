import { Router } from "express";
import { body } from "express-validator";
import { login, getMe, register } from "./auth.controller";
import authenticate from "../../middleware/authenticate";
import authorize from "../../middleware/authorize";

const router = Router();

// POST /auth/login
router.post(
    "/login",
    [
        body("email").isEmail().withMessage("Enter a valid email"),
        body("password").notEmpty().withMessage("Password is required"),
    ],
    login
);

// GET /auth/me
router.get("/me", authenticate, getMe);

// POST /auth/register  (admin only)
router.post(
    "/register",
    authenticate,
    authorize("admin"),
    [
        body("name").trim().notEmpty().withMessage("Name is required"),
        body("email").isEmail().withMessage("Enter a valid email"),
        body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
        body("role")
            .optional()
            .isIn(["admin", "sales", "warehouse", "accounts"])
            .withMessage("Invalid role"),
    ],
    register
);

export default router;
