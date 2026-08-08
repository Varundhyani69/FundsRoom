const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const pool = require("../../db/connection");

/**
 * POST /auth/login
 * Accepts email + password, returns a signed JWT.
 */
async function login(req, res, next) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { email, password } = req.body;

        const [rows] = await pool.query(
            "SELECT id, name, email, password, role, is_active FROM users WHERE email = ?",
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        const user = rows[0];

        if (!user.is_active) {
            return res.status(403).json({ success: false, message: "Your account has been deactivated" });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /auth/me
 * Returns the currently logged-in user info (from token).
 */
async function getMe(req, res, next) {
    try {
        const [rows] = await pool.query(
            "SELECT id, name, email, role, created_at FROM users WHERE id = ?",
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({ success: true, user: rows[0] });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /auth/register  (admin only – for creating new employees)
 */
async function register(req, res, next) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { name, email, password, role } = req.body;

        const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: "Email already registered" });
        }

        const hash = await bcrypt.hash(password, 12);

        const [result] = await pool.query(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            [name, email, hash, role || "sales"]
        );

        return res.status(201).json({
            success: true,
            message: "User created successfully",
            userId: result.insertId,
        });
    } catch (err) {
        next(err);
    }
}

module.exports = { login, getMe, register };
