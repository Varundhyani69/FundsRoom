const pool = require("../../db/connection");

// GET /dashboard/stats
async function getStats(req, res, next) {
    try {
        // run all queries in parallel for speed
        const [
            [[customerStats]],
            [[productStats]],
            [[challanStats]],
            [recentChallans],
            [lowStockProducts],
            [upcomingFollowups],
        ] = await Promise.all([
            // customer counts by status
            pool.query(`
        SELECT
          COUNT(*) AS total,
          SUM(status = 'active')   AS active,
          SUM(status = 'lead')     AS leads,
          SUM(status = 'inactive') AS inactive
        FROM customers
      `),

            // product + stock overview
            pool.query(`
        SELECT
          COUNT(*) AS total,
          SUM(current_stock <= min_stock_alert) AS low_stock_count,
          SUM(current_stock * unit_price) AS total_inventory_value
        FROM products
        WHERE is_active = 1
      `),

            // challan summary
            pool.query(`
        SELECT
          COUNT(*) AS total,
          SUM(status = 'draft')     AS drafts,
          SUM(status = 'confirmed') AS confirmed,
          SUM(status = 'cancelled') AS cancelled,
          COALESCE(SUM(CASE WHEN status = 'confirmed' THEN total_amount ELSE 0 END), 0) AS confirmed_value
        FROM challans
      `),

            // 5 most recent challans
            pool.query(`
        SELECT ch.id, ch.challan_number, ch.status,
               ch.total_amount, ch.created_at,
               c.name AS customer_name
        FROM challans ch
        LEFT JOIN customers c ON ch.customer_id = c.id
        ORDER BY ch.created_at DESC
        LIMIT 5
      `),

            // products at or below min stock
            pool.query(`
        SELECT id, name, sku, current_stock, min_stock_alert, warehouse
        FROM products
        WHERE current_stock <= min_stock_alert AND is_active = 1
        ORDER BY (current_stock - min_stock_alert) ASC
        LIMIT 8
      `),

            // customers with follow-up due in next 7 days
            pool.query(`
        SELECT id, name, mobile, follow_up_date, status
        FROM customers
        WHERE follow_up_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
        ORDER BY follow_up_date ASC
        LIMIT 6
      `),
        ]);

        res.json({
            success: true,
            data: {
                customers: customerStats,
                products: {
                    total: productStats.total,
                    low_stock_count: productStats.low_stock_count || 0,
                    total_inventory_value: parseFloat(productStats.total_inventory_value || 0).toFixed(2),
                },
                challans: challanStats,
                recent_challans: recentChallans,
                low_stock_products: lowStockProducts,
                upcoming_followups: upcomingFollowups,
            },
        });
    } catch (err) {
        next(err);
    }
}

module.exports = { getStats };
