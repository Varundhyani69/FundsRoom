import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import pool from "../../db/connection";
import { JwtPayload } from "../../types";

type AuthRequest = Request & { user: JwtPayload };

export async function getCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { search, status, customer_type, page = "1", limit = "10" } = req.query as Record<string, string>;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const conditions: string[] = [];
        const params: unknown[] = [];

        if (search) {
            conditions.push("(c.name LIKE ? OR c.mobile LIKE ? OR c.business_name LIKE ? OR c.email LIKE ?)");
            const like = `%${search}%`;
            params.push(like, like, like, like);
        }
        if (status) { conditions.push("c.status = ?"); params.push(status); }
        if (customer_type) { conditions.push("c.customer_type = ?"); params.push(customer_type); }

        const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

        const [rows] = await pool.query(
            `SELECT c.*, u.name AS created_by_name
       FROM customers c
       LEFT JOIN users u ON c.created_by = u.id
       ${where}
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), offset]
        ) as [any[], any];

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) AS total FROM customers c ${where}`,
            params
        ) as [any[], any];

        res.json({
            success: true,
            data: rows,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (err) { next(err); }
}

export async function getCustomerById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const [rows] = await pool.query(
            `SELECT c.*, u.name AS created_by_name
       FROM customers c
       LEFT JOIN users u ON c.created_by = u.id
       WHERE c.id = ?`,
            [req.params.id]
        ) as [any[], any];

        if (rows.length === 0) {
            res.status(404).json({ success: false, message: "Customer not found" });
            return;
        }

        const [followups] = await pool.query(
            `SELECT f.*, u.name AS added_by
       FROM customer_followups f
       LEFT JOIN users u ON f.created_by = u.id
       WHERE f.customer_id = ?
       ORDER BY f.created_at DESC`,
            [req.params.id]
        ) as [any[], any];

        res.json({ success: true, data: { ...rows[0], followups } });
    } catch (err) { next(err); }
}

export async function createCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) { res.status(400).json({ success: false, errors: errors.array() }); return; }

        const { name, mobile, email, business_name, gst_number, customer_type, address, status, follow_up_date, notes } = req.body;

        const [result] = await pool.query(
            `INSERT INTO customers
         (name, mobile, email, business_name, gst_number, customer_type,
          address, status, follow_up_date, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name, mobile, email || null, business_name || null,
                gst_number || null, customer_type || "retail",
                address || null, status || "lead",
                follow_up_date || null, notes || null,
                (req as AuthRequest).user.id,
            ]
        ) as [any, any];

        res.status(201).json({ success: true, message: "Customer created successfully", customerId: result.insertId });
    } catch (err) { next(err); }
}

export async function updateCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) { res.status(400).json({ success: false, errors: errors.array() }); return; }

        const [existing] = await pool.query("SELECT id FROM customers WHERE id = ?", [req.params.id]) as [any[], any];
        if (existing.length === 0) { res.status(404).json({ success: false, message: "Customer not found" }); return; }

        const { name, mobile, email, business_name, gst_number, customer_type, address, status, follow_up_date, notes } = req.body;

        await pool.query(
            `UPDATE customers SET
         name = ?, mobile = ?, email = ?, business_name = ?,
         gst_number = ?, customer_type = ?, address = ?,
         status = ?, follow_up_date = ?, notes = ?
       WHERE id = ?`,
            [name, mobile, email || null, business_name || null, gst_number || null, customer_type, address || null, status, follow_up_date || null, notes || null, req.params.id]
        );

        res.json({ success: true, message: "Customer updated successfully" });
    } catch (err) { next(err); }
}

export async function addFollowup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) { res.status(400).json({ success: false, errors: errors.array() }); return; }

        const [existing] = await pool.query("SELECT id FROM customers WHERE id = ?", [req.params.id]) as [any[], any];
        if (existing.length === 0) { res.status(404).json({ success: false, message: "Customer not found" }); return; }

        const { note, follow_up_date } = req.body as { note: string; follow_up_date?: string };

        const [result] = await pool.query(
            `INSERT INTO customer_followups (customer_id, note, follow_up_date, created_by) VALUES (?, ?, ?, ?)`,
            [req.params.id, note, follow_up_date || null, (req as AuthRequest).user.id]
        ) as [any, any];

        if (follow_up_date) {
            await pool.query("UPDATE customers SET follow_up_date = ? WHERE id = ?", [follow_up_date, req.params.id]);
        }

        res.status(201).json({ success: true, message: "Follow-up note added", followupId: result.insertId });
    } catch (err) { next(err); }
}
