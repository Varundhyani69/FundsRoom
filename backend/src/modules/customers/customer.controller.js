const { validationResult } = require("express-validator");
const pool = require("../../db/connection");

// GET /customers
// supports: search, status filter, type filter, pagination
async function getCustomers(req, res, next) {
    try {
        const { search, status, customer_type, page = 1, limit = 10 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let conditions = [];
        let params = [];

        if (search) {
            conditions.push("(c.name LIKE ? OR c.mobile LIKE ? OR c.business_name LIKE ? OR c.email LIKE ?)");
            const like = `%${search}%`;
            params.push(like, like, like, like);
        }
        if (status) {
            conditions.push("c.status = ?");
            params.push(status);
        }
        if (customer_type) {
            conditions.push("c.customer_type = ?");
            params.push(customer_type);
        }

        const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

        const [rows] = await pool.query(
            `SELECT c.*, u.name AS created_by_name
       FROM customers c
       LEFT JOIN users u ON c.created_by = u.id
       ${where}
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), offset]
        );

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) AS total FROM customers c ${where}`,
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

// GET /customers/:id
async function getCustomerById(req, res, next) {
    try {
        const [rows] = await pool.query(
            `SELECT c.*, u.name AS created_by_name
       FROM customers c
       LEFT JOIN users u ON c.created_by = u.id
       WHERE c.id = ?`,
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        // fetch follow-up notes for this customer
        const [followups] = await pool.query(
            `SELECT f.*, u.name AS added_by
       FROM customer_followups f
       LEFT JOIN users u ON f.created_by = u.id
       WHERE f.customer_id = ?
       ORDER BY f.created_at DESC`,
            [req.params.id]
        );

        res.json({ success: true, data: { ...rows[0], followups } });
    } catch (err) {
        next(err);
    }
}

// POST /customers
async function createCustomer(req, res, next) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const {
            name, mobile, email, business_name, gst_number,
            customer_type, address, status, follow_up_date, notes,
        } = req.body;

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
                req.user.id,
            ]
        );

        res.status(201).json({
            success: true,
            message: "Customer created successfully",
            customerId: result.insertId,
        });
    } catch (err) {
        next(err);
    }
}

// PUT /customers/:id
async function updateCustomer(req, res, next) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const [existing] = await pool.query("SELECT id FROM customers WHERE id = ?", [req.params.id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        const {
            name, mobile, email, business_name, gst_number,
            customer_type, address, status, follow_up_date, notes,
        } = req.body;

        await pool.query(
            `UPDATE customers SET
         name = ?, mobile = ?, email = ?, business_name = ?,
         gst_number = ?, customer_type = ?, address = ?,
         status = ?, follow_up_date = ?, notes = ?
       WHERE id = ?`,
            [
                name, mobile, email || null, business_name || null,
                gst_number || null, customer_type, address || null,
                status, follow_up_date || null, notes || null,
                req.params.id,
            ]
        );

        res.json({ success: true, message: "Customer updated successfully" });
    } catch (err) {
        next(err);
    }
}

// POST /customers/:id/followups
async function addFollowup(req, res, next) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const [existing] = await pool.query("SELECT id FROM customers WHERE id = ?", [req.params.id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        const { note, follow_up_date } = req.body;

        const [result] = await pool.query(
            `INSERT INTO customer_followups (customer_id, note, follow_up_date, created_by)
       VALUES (?, ?, ?, ?)`,
            [req.params.id, note, follow_up_date || null, req.user.id]
        );

        // also update follow_up_date on the customer record if provided
        if (follow_up_date) {
            await pool.query("UPDATE customers SET follow_up_date = ? WHERE id = ?", [
                follow_up_date,
                req.params.id,
            ]);
        }

        res.status(201).json({
            success: true,
            message: "Follow-up note added",
            followupId: result.insertId,
        });
    } catch (err) {
        next(err);
    }
}

module.exports = { getCustomers, getCustomerById, createCustomer, updateCustomer, addFollowup };
