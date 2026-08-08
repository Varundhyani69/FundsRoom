const { validationResult } = require("express-validator");
const pool = require("../../db/connection");

// GET /products
async function getProducts(req, res, next) {
    try {
        const { search, category, low_stock, page = 1, limit = 10 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let conditions = ["p.is_active = 1"];
        let params = [];

        if (search) {
            conditions.push("(p.name LIKE ? OR p.sku LIKE ? OR p.category LIKE ?)");
            const like = `%${search}%`;
            params.push(like, like, like);
        }
        if (category) {
            conditions.push("p.category = ?");
            params.push(category);
        }
        if (low_stock === "true") {
            conditions.push("p.current_stock <= p.min_stock_alert");
        }

        const where = "WHERE " + conditions.join(" AND ");

        const [rows] = await pool.query(
            `SELECT p.*, u.name AS created_by_name
       FROM products p
       LEFT JOIN users u ON p.created_by = u.id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), offset]
        );

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) AS total FROM products p ${where}`,
            params
        );

        // pull distinct categories for filter dropdown
        const [categories] = await pool.query(
            "SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND is_active = 1 ORDER BY category"
        );

        res.json({
            success: true,
            data: rows,
            categories: categories.map((c) => c.category),
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (err) {
        next(err);
    }
}

// GET /products/:id
async function getProductById(req, res, next) {
    try {
        const [rows] = await pool.query(
            `SELECT p.*, u.name AS created_by_name
       FROM products p
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = ?`,
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // recent stock movements for this product
        const [movements] = await pool.query(
            `SELECT sm.*, u.name AS created_by_name
       FROM stock_movements sm
       LEFT JOIN users u ON sm.created_by = u.id
       WHERE sm.product_id = ?
       ORDER BY sm.created_at DESC
       LIMIT 20`,
            [req.params.id]
        );

        res.json({ success: true, data: { ...rows[0], recent_movements: movements } });
    } catch (err) {
        next(err);
    }
}

// POST /products
async function createProduct(req, res, next) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { name, sku, category, unit_price, current_stock, min_stock_alert, warehouse } = req.body;

        // SKU must be unique
        const [existing] = await pool.query("SELECT id FROM products WHERE sku = ?", [sku]);
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: "A product with this SKU already exists" });
        }

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const [result] = await conn.query(
                `INSERT INTO products (name, sku, category, unit_price, current_stock, min_stock_alert, warehouse, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    name, sku.toUpperCase(), category || null,
                    parseFloat(unit_price), parseInt(current_stock) || 0,
                    parseInt(min_stock_alert) || 0, warehouse || null,
                    req.user.id,
                ]
            );

            const productId = result.insertId;

            // log initial stock if > 0
            if (parseInt(current_stock) > 0) {
                await conn.query(
                    `INSERT INTO stock_movements (product_id, quantity, movement_type, reason, reference_type, created_by)
           VALUES (?, ?, 'IN', 'Initial stock on product creation', 'manual', ?)`,
                    [productId, parseInt(current_stock), req.user.id]
                );
            }

            await conn.commit();

            res.status(201).json({
                success: true,
                message: "Product created successfully",
                productId,
            });
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    } catch (err) {
        next(err);
    }
}

// PUT /products/:id
async function updateProduct(req, res, next) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const [existing] = await pool.query("SELECT id FROM products WHERE id = ?", [req.params.id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const { name, sku, category, unit_price, min_stock_alert, warehouse } = req.body;

        // check SKU uniqueness excluding self
        const [skuCheck] = await pool.query(
            "SELECT id FROM products WHERE sku = ? AND id != ?",
            [sku.toUpperCase(), req.params.id]
        );
        if (skuCheck.length > 0) {
            return res.status(409).json({ success: false, message: "SKU already used by another product" });
        }

        await pool.query(
            `UPDATE products SET
         name = ?, sku = ?, category = ?, unit_price = ?,
         min_stock_alert = ?, warehouse = ?
       WHERE id = ?`,
            [
                name, sku.toUpperCase(), category || null,
                parseFloat(unit_price), parseInt(min_stock_alert) || 0,
                warehouse || null, req.params.id,
            ]
        );

        res.json({ success: true, message: "Product updated successfully" });
    } catch (err) {
        next(err);
    }
}

// POST /products/:id/stock-adjust
// Manual stock adjustment (IN or OUT) by warehouse staff
async function adjustStock(req, res, next) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { quantity, movement_type, reason } = req.body;
        const qty = parseInt(quantity);

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const [[product]] = await conn.query(
                "SELECT id, name, current_stock FROM products WHERE id = ? FOR UPDATE",
                [req.params.id]
            );

            if (!product) {
                await conn.rollback();
                return res.status(404).json({ success: false, message: "Product not found" });
            }

            if (movement_type === "OUT" && product.current_stock < qty) {
                await conn.rollback();
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock. Available: ${product.current_stock}, Requested: ${qty}`,
                });
            }

            const newStock =
                movement_type === "IN"
                    ? product.current_stock + qty
                    : product.current_stock - qty;

            await conn.query("UPDATE products SET current_stock = ? WHERE id = ?", [newStock, req.params.id]);

            await conn.query(
                `INSERT INTO stock_movements (product_id, quantity, movement_type, reason, reference_type, created_by)
         VALUES (?, ?, ?, ?, 'manual', ?)`,
                [req.params.id, qty, movement_type, reason || "Manual adjustment", req.user.id]
            );

            await conn.commit();

            res.json({
                success: true,
                message: `Stock ${movement_type === "IN" ? "added" : "removed"} successfully`,
                new_stock: newStock,
            });
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    } catch (err) {
        next(err);
    }
}

// GET /stock-movements
async function getStockMovements(req, res, next) {
    try {
        const { product_id, movement_type, page = 1, limit = 15 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let conditions = [];
        let params = [];

        if (product_id) {
            conditions.push("sm.product_id = ?");
            params.push(product_id);
        }
        if (movement_type) {
            conditions.push("sm.movement_type = ?");
            params.push(movement_type);
        }

        const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

        const [rows] = await pool.query(
            `SELECT sm.*, p.name AS product_name, p.sku, u.name AS created_by_name
       FROM stock_movements sm
       LEFT JOIN products p ON sm.product_id = p.id
       LEFT JOIN users u ON sm.created_by = u.id
       ${where}
       ORDER BY sm.created_at DESC
       LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), offset]
        );

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) AS total FROM stock_movements sm ${where}`,
            params
        );

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
    } catch (err) {
        next(err);
    }
}

module.exports = { getProducts, getProductById, createProduct, updateProduct, adjustStock, getStockMovements };
