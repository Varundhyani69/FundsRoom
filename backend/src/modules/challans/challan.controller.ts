import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { PoolConnection } from "mysql2/promise";
import pool from "../../db/connection";
import { JwtPayload } from "../../types";

type AuthRequest = Request & { user: JwtPayload };

async function generateChallanNumber(conn: PoolConnection): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CH-${year}-`;

    const [[row]] = await conn.query(
        `SELECT challan_number FROM challans WHERE challan_number LIKE ? ORDER BY id DESC LIMIT 1`,
        [`${prefix}%`]
    ) as [any[], any];

    if (!row) return `${prefix}0001`;

    const last = parseInt((row.challan_number as string).replace(prefix, ""), 10);
    return `${prefix}${String(last + 1).padStart(4, "0")}`;
}

export async function getChallans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { status, customer_id, search, page = "1", limit = "10" } = req.query as Record<string, string>;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const conditions: string[] = [];
        const params: unknown[] = [];

        if (status) { conditions.push("ch.status = ?"); params.push(status); }
        if (customer_id) { conditions.push("ch.customer_id = ?"); params.push(customer_id); }
        if (search) {
            conditions.push("(ch.challan_number LIKE ? OR c.name LIKE ? OR c.business_name LIKE ?)");
            const like = `%${search}%`;
            params.push(like, like, like);
        }

        const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

        const [rows] = await pool.query(
            `SELECT ch.*, c.name AS customer_name, c.business_name,
              c.mobile AS customer_mobile, u.name AS created_by_name
       FROM challans ch
       LEFT JOIN customers c ON ch.customer_id = c.id
       LEFT JOIN users u ON ch.created_by = u.id
       ${where}
       ORDER BY ch.created_at DESC LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), offset]
        ) as [any[], any];

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) AS total FROM challans ch LEFT JOIN customers c ON ch.customer_id = c.id ${where}`,
            params
        ) as [any[], any];

        res.json({
            success: true,
            data: rows,
            pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
        });
    } catch (err) { next(err); }
}

export async function getChallanById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const [rows] = await pool.query(
            `SELECT ch.*, c.name AS customer_name, c.business_name,
              c.mobile AS customer_mobile, c.email AS customer_email,
              c.address AS customer_address, c.gst_number AS customer_gst,
              u.name AS created_by_name
       FROM challans ch
       LEFT JOIN customers c ON ch.customer_id = c.id
       LEFT JOIN users u ON ch.created_by = u.id
       WHERE ch.id = ?`,
            [req.params.id]
        ) as [any[], any];

        if (rows.length === 0) { res.status(404).json({ success: false, message: "Challan not found" }); return; }

        const [items] = await pool.query(
            `SELECT * FROM challan_items WHERE challan_id = ?`, [req.params.id]
        ) as [any[], any];

        res.json({ success: true, data: { ...rows[0], items } });
    } catch (err) { next(err); }
}

export async function createChallan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) { res.status(400).json({ success: false, errors: errors.array() }); return; }

        const { customer_id, items, status = "draft", notes } = req.body as {
            customer_id: number;
            items: Array<{ product_id: number; quantity: number }>;
            status?: string;
            notes?: string;
        };

        if (!items || items.length === 0) {
            res.status(400).json({ success: false, message: "Challan must have at least one item" });
            return;
        }

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const [[customer]] = await conn.query("SELECT id FROM customers WHERE id = ?", [customer_id]) as [any[], any];
            if (!customer) {
                await conn.rollback();
                res.status(404).json({ success: false, message: "Customer not found" });
                return;
            }

            const lineItems: Array<{ product: any; qty: number; lineTotal: number }> = [];
            let totalQty = 0;
            let totalAmount = 0;

            for (const item of items) {
                const [[product]] = await conn.query(
                    "SELECT id, name, sku, unit_price, current_stock FROM products WHERE id = ? AND is_active = 1",
                    [item.product_id]
                ) as [any[], any];

                if (!product) {
                    await conn.rollback();
                    res.status(404).json({ success: false, message: `Product ID ${item.product_id} not found or inactive` });
                    return;
                }

                const qty = parseInt(String(item.quantity));
                if (qty <= 0) {
                    await conn.rollback();
                    res.status(400).json({ success: false, message: `Quantity for "${product.name}" must be greater than 0` });
                    return;
                }

                if (status === "confirmed" && product.current_stock < qty) {
                    await conn.rollback();
                    res.status(400).json({
                        success: false,
                        message: `Insufficient stock for "${product.name}". Available: ${product.current_stock}, Requested: ${qty}`,
                    });
                    return;
                }

                const lineTotal = qty * parseFloat(product.unit_price);
                totalQty += qty;
                totalAmount += lineTotal;
                lineItems.push({ product, qty, lineTotal });
            }

            const challanNumber = await generateChallanNumber(conn);

            const [challanResult] = await conn.query(
                `INSERT INTO challans (challan_number, customer_id, total_quantity, total_amount, status, notes, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [challanNumber, customer_id, totalQty, totalAmount, status, notes || null, (req as AuthRequest).user.id]
            ) as [any, any];

            const challanId: number = challanResult.insertId;

            for (const { product, qty, lineTotal } of lineItems) {
                await conn.query(
                    `INSERT INTO challan_items (challan_id, product_id, product_name, product_sku, unit_price, quantity, line_total)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [challanId, product.id, product.name, product.sku, product.unit_price, qty, lineTotal]
                );

                if (status === "confirmed") {
                    await conn.query("UPDATE products SET current_stock = current_stock - ? WHERE id = ?", [qty, product.id]);
                    await conn.query(
                        `INSERT INTO stock_movements (product_id, quantity, movement_type, reason, reference_id, reference_type, created_by)
             VALUES (?, ?, 'OUT', ?, ?, 'challan', ?)`,
                        [product.id, qty, `Challan ${challanNumber}`, challanId, (req as AuthRequest).user.id]
                    );
                }
            }

            await conn.commit();
            res.status(201).json({ success: true, message: `Challan ${challanNumber} created as ${status}`, challanId, challanNumber });
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    } catch (err) { next(err); }
}

export async function confirmChallan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const [[challan]] = await conn.query(
                "SELECT * FROM challans WHERE id = ? FOR UPDATE", [req.params.id]
            ) as [any[], any];

            if (!challan) { await conn.rollback(); res.status(404).json({ success: false, message: "Challan not found" }); return; }

            if (challan.status !== "draft") {
                await conn.rollback();
                res.status(400).json({ success: false, message: `Challan is already ${challan.status}. Only draft challans can be confirmed.` });
                return;
            }

            const [items] = await conn.query("SELECT * FROM challan_items WHERE challan_id = ?", [req.params.id]) as [any[], any];

            // fail-fast stock check
            for (const item of items) {
                const [[product]] = await conn.query(
                    "SELECT id, name, current_stock FROM products WHERE id = ? FOR UPDATE", [item.product_id]
                ) as [any[], any];

                if (!product) {
                    await conn.rollback();
                    res.status(404).json({ success: false, message: `Product "${item.product_name}" no longer exists` });
                    return;
                }

                if (product.current_stock < item.quantity) {
                    await conn.rollback();
                    res.status(400).json({
                        success: false,
                        message: `Insufficient stock for "${item.product_name}". Available: ${product.current_stock}, Required: ${item.quantity}`,
                    });
                    return;
                }
            }

            for (const item of items) {
                await conn.query("UPDATE products SET current_stock = current_stock - ? WHERE id = ?", [item.quantity, item.product_id]);
                await conn.query(
                    `INSERT INTO stock_movements (product_id, quantity, movement_type, reason, reference_id, reference_type, created_by)
           VALUES (?, ?, 'OUT', ?, ?, 'challan', ?)`,
                    [item.product_id, item.quantity, `Challan ${challan.challan_number}`, challan.id, (req as AuthRequest).user.id]
                );
            }

            await conn.query("UPDATE challans SET status = 'confirmed' WHERE id = ?", [req.params.id]);
            await conn.commit();

            res.json({ success: true, message: `Challan ${challan.challan_number} confirmed. Stock has been deducted.` });
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    } catch (err) { next(err); }
}

export async function cancelChallan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const [[challan]] = await pool.query("SELECT * FROM challans WHERE id = ?", [req.params.id]) as [any[], any];

        if (!challan) { res.status(404).json({ success: false, message: "Challan not found" }); return; }
        if (challan.status === "cancelled") { res.status(400).json({ success: false, message: "Challan is already cancelled" }); return; }

        if (challan.status === "confirmed") {
            const conn = await pool.getConnection();
            try {
                await conn.beginTransaction();

                const [items] = await conn.query("SELECT * FROM challan_items WHERE challan_id = ?", [req.params.id]) as [any[], any];

                for (const item of items) {
                    await conn.query("UPDATE products SET current_stock = current_stock + ? WHERE id = ?", [item.quantity, item.product_id]);
                    await conn.query(
                        `INSERT INTO stock_movements (product_id, quantity, movement_type, reason, reference_id, reference_type, created_by)
             VALUES (?, ?, 'IN', ?, ?, 'challan', ?)`,
                        [item.product_id, item.quantity, `Cancelled challan ${challan.challan_number}`, challan.id, (req as AuthRequest).user.id]
                    );
                }

                await conn.query("UPDATE challans SET status = 'cancelled' WHERE id = ?", [req.params.id]);
                await conn.commit();
                conn.release();

                res.json({ success: true, message: `Challan ${challan.challan_number} cancelled. Stock has been restored.` });
                return;
            } catch (err) {
                await conn.rollback();
                conn.release();
                throw err;
            }
        }

        await pool.query("UPDATE challans SET status = 'cancelled' WHERE id = ?", [req.params.id]);
        res.json({ success: true, message: `Challan ${challan.challan_number} cancelled.` });
    } catch (err) { next(err); }
}
