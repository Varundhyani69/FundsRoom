import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import pool from "../../db/connection";
import { JwtPayload } from "../../types";

type AuthRequest = Request & { user: JwtPayload };

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, errors: errors.array() });
            return;
        }

        const { email, password } = req.body as { email: string; password: string };

        const [rows] = await pool.query(
            "SELECT id, name, email, password, role, is_active FROM users WHERE email = ?",
            [email]
        ) as [any[], any];

        if (rows.length === 0) {
            res.status(401).json({ success: false, message: "Invalid email or password" });
            return;
        }

        const user = rows[0];

        if (!user.is_active) {
            res.status(403).json({ success: false, message: "Your account has been deactivated" });
            return;
        }

        const passwordMatch = await bcrypt.compare(password, user.password as string);
        if (!passwordMatch) {
            res.status(401).json({ success: false, message: "Invalid email or password" });
            return;
        }

        const signOptions: jwt.SignOptions = { expiresIn: "7d" };
        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role },
            process.env.JWT_SECRET as string,
            signOptions
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        });
    } catch (err) {
        next(err);
    }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const authReq = req as AuthRequest;
        const [rows] = await pool.query(
            "SELECT id, name, email, role, created_at FROM users WHERE id = ?",
            [authReq.user.id]
        ) as [any[], any];

        if (rows.length === 0) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }

        res.status(200).json({ success: true, user: rows[0] });
    } catch (err) {
        next(err);
    }
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, errors: errors.array() });
            return;
        }

        const { name, email, password, role } = req.body as {
            name: string;
            email: string;
            password: string;
            role?: string;
        };

        const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]) as [any[], any];
        if (existing.length > 0) {
            res.status(409).json({ success: false, message: "Email already registered" });
            return;
        }

        const hash = await bcrypt.hash(password, 12);
        const [result] = await pool.query(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            [name, email, hash, role || "sales"]
        ) as [any, any];

        res.status(201).json({
            success: true,
            message: "User created successfully",
            userId: result.insertId,
        });
    } catch (err) {
        next(err);
    }
}
