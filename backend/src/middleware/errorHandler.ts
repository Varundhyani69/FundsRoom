import { Request, Response, NextFunction } from "express";

interface AppError extends Error {
    status?: number;
    statusCode?: number;
}

export default function errorHandler(
    err: AppError,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction
): void {
    console.error(`[ERROR] ${req.method} ${req.originalUrl} -`, err.message);

    const status = err.status || err.statusCode || 500;
    const message = err.message || "Something went wrong";

    res.status(status).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
}
