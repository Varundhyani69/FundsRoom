import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./modules/auth/auth.routes";
import customerRoutes from "./modules/customers/customer.routes";
import productRoutes from "./modules/products/product.routes";
import stockMovementRoutes from "./modules/products/stockMovement.routes";
import challanRoutes from "./modules/challans/challan.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import errorHandler from "./middleware/errorHandler";

dotenv.config();

const app = express();

// ── CORS ──────────────────────────────────────────────────────
const corsOptions: cors.CorsOptions = {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────
app.get("/health", (_req: Request, res: Response) => {
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
app.use((_req: Request, res: Response) => {
    res.status(404).json({ success: false, message: "Route not found" });
});

// ── Global error handler ──────────────────────────────────────
app.use(errorHandler as (err: any, req: Request, res: Response, next: NextFunction) => void);

export default app;
