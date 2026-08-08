/**
 * Seed script - creates test users + realistic mock data for all modules.
 * Run: npm run seed
 */

require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("./connection");

// ── Users ─────────────────────────────────────────────────────
const users = [
    { name: "Admin User", email: "admin@erp.com", password: "Admin@123", role: "admin" },
    { name: "Ravi Sharma", email: "sales@erp.com", password: "Sales@123", role: "sales" },
    { name: "Warehouse Staff", email: "warehouse@erp.com", password: "Warehouse@123", role: "warehouse" },
    { name: "Accounts Team", email: "accounts@erp.com", password: "Accounts@123", role: "accounts" },
];

// ── Customers ─────────────────────────────────────────────────
const customers = [
    {
        name: "Amit Patel",
        mobile: "9876543210",
        email: "amit.patel@gmail.com",
        business_name: "Patel Traders",
        gst_number: "27AAPFU0939F1ZV",
        customer_type: "wholesale",
        address: "12, Saket Nagar, Indore, MP - 452001",
        status: "active",
        follow_up_date: "2026-08-20",
        notes: "Bulk buyer, prefers invoice by 5th of every month",
    },
    {
        name: "Sunita Verma",
        mobile: "9812345678",
        email: "sunita.v@yahoo.com",
        business_name: "Verma General Store",
        gst_number: null,
        customer_type: "retail",
        address: "45, MG Road, Bhopal, MP - 462001",
        status: "active",
        follow_up_date: "2026-08-15",
        notes: "Regular customer since 2022",
    },
    {
        name: "Krishna Distributors",
        mobile: "9988776655",
        email: "krishna.dist@business.com",
        business_name: "Krishna Distributors Pvt Ltd",
        gst_number: "29AABCT1332L1ZT",
        customer_type: "distributor",
        address: "Plot 7, Industrial Area, Pune, MH - 411019",
        status: "active",
        follow_up_date: "2026-09-01",
        notes: "Handles 3 districts. Payment terms: 30 days net",
    },
    {
        name: "Meena Joshi",
        mobile: "9765432109",
        email: "meena.joshi@gmail.com",
        business_name: null,
        gst_number: null,
        customer_type: "retail",
        address: "22, Anand Colony, Nagpur, MH - 440001",
        status: "lead",
        follow_up_date: "2026-08-12",
        notes: "Interested in seasonal items. Called once.",
    },
    {
        name: "Rajesh Kumar",
        mobile: "9654321098",
        email: "rajesh.k@rediffmail.com",
        business_name: "Kumar Wholesale Hub",
        gst_number: "06AAJCK2481G1ZS",
        customer_type: "wholesale",
        address: "88, Nehru Market, Delhi - 110006",
        status: "inactive",
        follow_up_date: null,
        notes: "Was active till 2025. Stopped ordering.",
    },
    {
        name: "Priya Electronics",
        mobile: "9543210987",
        email: "priya.elec@gmail.com",
        business_name: "Priya Electronics & Accessories",
        gst_number: "33AAPPP1234F1ZZ",
        customer_type: "distributor",
        address: "15, Anna Salai, Chennai, TN - 600002",
        status: "active",
        follow_up_date: "2026-08-25",
        notes: "Needs credit facility. Finance team is reviewing.",
    },
];

// ── Products ──────────────────────────────────────────────────
const products = [
    {
        name: "Industrial Bearing 6205",
        sku: "BRG-6205",
        category: "Bearings",
        unit_price: 145.00,
        current_stock: 320,
        min_stock_alert: 50,
        warehouse: "Warehouse A",
    },
    {
        name: "V-Belt A45",
        sku: "VBT-A45",
        category: "Belts",
        unit_price: 89.00,
        current_stock: 180,
        min_stock_alert: 30,
        warehouse: "Warehouse A",
    },
    {
        name: "Shaft Coupling 25mm",
        sku: "SCP-25",
        category: "Couplings",
        unit_price: 320.00,
        current_stock: 75,
        min_stock_alert: 15,
        warehouse: "Warehouse B",
    },
    {
        name: "Oil Seal 40x60x10",
        sku: "OSL-4060",
        category: "Seals",
        unit_price: 55.00,
        current_stock: 500,
        min_stock_alert: 100,
        warehouse: "Warehouse A",
    },
    {
        name: "Hydraulic Hose 1/2 inch",
        sku: "HHS-12",
        category: "Hydraulics",
        unit_price: 210.00,
        current_stock: 12,
        min_stock_alert: 20,
        warehouse: "Warehouse B",
    },
    {
        name: "Pneumatic Cylinder 63mm",
        sku: "PNC-63",
        category: "Pneumatics",
        unit_price: 1850.00,
        current_stock: 40,
        min_stock_alert: 10,
        warehouse: "Warehouse C",
    },
    {
        name: "Motor Starter 5HP",
        sku: "MST-5HP",
        category: "Electrical",
        unit_price: 2200.00,
        current_stock: 22,
        min_stock_alert: 5,
        warehouse: "Warehouse C",
    },
    {
        name: "Chain Sprocket T40",
        sku: "CSP-T40",
        category: "Power Transmission",
        unit_price: 475.00,
        current_stock: 90,
        min_stock_alert: 20,
        warehouse: "Warehouse B",
    },
];

// ── Follow-up notes ───────────────────────────────────────────
const followups = [
    { customer_index: 0, note: "Discussed new pricing for Q3. He agreed to increase order volume by 20%.", follow_up_date: "2026-08-20" },
    { customer_index: 0, note: "Sent revised product catalogue over WhatsApp.", follow_up_date: null },
    { customer_index: 1, note: "Visited store. She is happy with the service. Wants faster delivery.", follow_up_date: "2026-08-15" },
    { customer_index: 2, note: "Conference call with their purchase manager. They need 3 months advance forecast.", follow_up_date: "2026-09-01" },
    { customer_index: 3, note: "First contact — she asked for a product list. Emailed the catalogue.", follow_up_date: "2026-08-12" },
    { customer_index: 5, note: "Met at trade fair. Very interested in bulk order. Needs credit terms.", follow_up_date: "2026-08-25" },
];

async function seed() {
    try {
        console.log("Starting seed...\n");

        // ── Seed Users ─────────────────────────────────────────
        const userIds = [];
        for (const u of users) {
            const hash = await bcrypt.hash(u.password, 12);
            const [result] = await pool.query(
                `INSERT INTO users (name, email, password, role)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role), id = LAST_INSERT_ID(id)`,
                [u.name, u.email, hash, u.role]
            );
            userIds.push(result.insertId);
            console.log(`User: ${u.email}  (${u.role})`);
        }

        const adminId = userIds[0];
        const salesId = userIds[1];
        const warehouseId = userIds[2];

        // ── Seed Customers ─────────────────────────────────────
        console.log("\nSeeding customers...");
        const customerIds = [];
        for (const c of customers) {
            // check if already exists by mobile
            const [existing] = await pool.query("SELECT id FROM customers WHERE mobile = ?", [c.mobile]);
            if (existing.length > 0) {
                customerIds.push(existing[0].id);
                console.log(`  Skipped (exists): ${c.name}`);
                continue;
            }
            const [result] = await pool.query(
                `INSERT INTO customers
           (name, mobile, email, business_name, gst_number, customer_type,
            address, status, follow_up_date, notes, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    c.name, c.mobile, c.email || null, c.business_name || null,
                    c.gst_number || null, c.customer_type, c.address, c.status,
                    c.follow_up_date || null, c.notes || null, salesId,
                ]
            );
            customerIds.push(result.insertId);
            console.log(`  Added: ${c.name}`);
        }

        // ── Seed Follow-up Notes ───────────────────────────────
        console.log("\nSeeding follow-up notes...");
        for (const f of followups) {
            const custId = customerIds[f.customer_index];
            if (!custId) continue;
            await pool.query(
                `INSERT INTO customer_followups (customer_id, note, follow_up_date, created_by)
         VALUES (?, ?, ?, ?)`,
                [custId, f.note, f.follow_up_date || null, salesId]
            );
            console.log(`  Note for customer #${custId}`);
        }

        // ── Seed Products ──────────────────────────────────────
        console.log("\nSeeding products...");
        const productIds = [];
        for (const p of products) {
            const [existing] = await pool.query("SELECT id FROM products WHERE sku = ?", [p.sku]);
            if (existing.length > 0) {
                productIds.push(existing[0].id);
                console.log(`  Skipped (exists): ${p.name}`);
                continue;
            }
            const [result] = await pool.query(
                `INSERT INTO products (name, sku, category, unit_price, current_stock, min_stock_alert, warehouse, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [p.name, p.sku, p.category, p.unit_price, p.current_stock, p.min_stock_alert, p.warehouse, warehouseId]
            );
            productIds.push(result.insertId);
            console.log(`  Added: ${p.name} (stock: ${p.current_stock})`);
        }

        // ── Seed Stock Movement Logs ───────────────────────────
        console.log("\nSeeding stock movements...");
        const movements = [
            { productIdx: 0, quantity: 500, type: "IN", reason: "Initial stock purchase from supplier" },
            { productIdx: 0, quantity: 180, type: "OUT", reason: "Delivered to Patel Traders" },
            { productIdx: 1, quantity: 300, type: "IN", reason: "Purchase order PO-001" },
            { productIdx: 1, quantity: 120, type: "OUT", reason: "Sales challan dispatch" },
            { productIdx: 2, quantity: 100, type: "IN", reason: "Initial stock" },
            { productIdx: 2, quantity: 25, type: "OUT", reason: "Delivered to Krishna Distributors" },
            { productIdx: 3, quantity: 600, type: "IN", reason: "Bulk purchase from supplier" },
            { productIdx: 3, quantity: 100, type: "OUT", reason: "Sales order dispatch" },
            { productIdx: 4, quantity: 50, type: "IN", reason: "Restocking" },
            { productIdx: 4, quantity: 38, type: "OUT", reason: "Various deliveries" },
            { productIdx: 5, quantity: 60, type: "IN", reason: "Purchase order PO-002" },
            { productIdx: 5, quantity: 20, type: "OUT", reason: "Dispatched to Pune distributor" },
            { productIdx: 6, quantity: 30, type: "IN", reason: "Initial stock" },
            { productIdx: 6, quantity: 8, type: "OUT", reason: "Sales challan" },
            { productIdx: 7, quantity: 120, type: "IN", reason: "Purchase order PO-003" },
            { productIdx: 7, quantity: 30, type: "OUT", reason: "Dispatched to Delhi" },
        ];

        for (const m of movements) {
            const productId = productIds[m.productIdx];
            if (!productId) continue;
            await pool.query(
                `INSERT INTO stock_movements (product_id, quantity, movement_type, reason, reference_type, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
                [productId, m.quantity, m.type, m.reason, "manual", warehouseId]
            );
        }
        console.log(`  Added ${movements.length} stock movement entries`);

        // ── Seed Challans ──────────────────────────────────────
        console.log("\nSeeding challans...");
        const challans = [
            {
                customer_index: 0,
                status: "confirmed",
                notes: "Urgent delivery requested",
                items: [
                    { product_index: 0, quantity: 50 },
                    { product_index: 1, quantity: 30 },
                ],
            },
            {
                customer_index: 2,
                status: "confirmed",
                notes: "Monthly standing order",
                items: [
                    { product_index: 2, quantity: 10 },
                    { product_index: 5, quantity: 5 },
                ],
            },
            {
                customer_index: 1,
                status: "draft",
                notes: "Pending customer confirmation",
                items: [
                    { product_index: 3, quantity: 100 },
                ],
            },
        ];

        for (let i = 0; i < challans.length; i++) {
            const ch = challans[i];
            const customerId = customerIds[ch.customer_index];
            if (!customerId) continue;

            const challanNumber = `CH-2026-${String(i + 1).padStart(4, "0")}`;

            let totalQty = 0;
            let totalAmount = 0;

            for (const item of ch.items) {
                const p = products[item.product_index];
                totalQty += item.quantity;
                totalAmount += item.quantity * p.unit_price;
            }

            const [challanResult] = await pool.query(
                `INSERT INTO challans (challan_number, customer_id, total_quantity, total_amount, status, notes, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [challanNumber, customerId, totalQty, totalAmount, ch.status, ch.notes, salesId]
            );

            const challanId = challanResult.insertId;

            for (const item of ch.items) {
                const p = products[item.product_index];
                const productId = productIds[item.product_index];
                await pool.query(
                    `INSERT INTO challan_items (challan_id, product_id, product_name, product_sku, unit_price, quantity, line_total)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [challanId, productId, p.name, p.sku, p.unit_price, item.quantity, item.quantity * p.unit_price]
                );
            }

            console.log(`  Challan ${challanNumber} - ${ch.status} (${ch.items.length} items, ₹${totalAmount.toFixed(2)})`);
        }

        console.log("\n✓ Seed complete!\n");
        console.log("Test credentials:");
        users.forEach((u) => console.log(`  ${u.role.padEnd(12)} ${u.email}  /  ${u.password}`));
    } catch (err) {
        console.error("\nSeed failed:", err.message);
        console.error(err);
    } finally {
        await pool.end();
    }
}

seed();
