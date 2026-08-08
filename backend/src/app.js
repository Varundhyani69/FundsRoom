const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./modules/auth/auth.routes");
const customerRoutes = require("./modules/customers/customer.routes");
const productRoutes = require("./modules/products/product.routes");
const stockMovementRoutes = require("./modules/products/stockMovement.routes");
const challanRoutes = require("./modules/challans/challan.routes");
const dashboardRoutes = require("./modules/dashboard/dashboard.routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Routes ────────────────────────────────────────────────────
app.use("/auth", authRoutes);
app.use("/customers", customerRoutes);
app.use("/products", productRoutes);
app.use("/stock-movements", stockMovementRoutes);
app.use("/challans", challanRoutes);
app.use("/dashboard", dashboardRoutes);

// ── 404 handler ──────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
});

// ── Global error handler ──────────────────────────────────────
app.use(errorHandler);

module.exports = app;
