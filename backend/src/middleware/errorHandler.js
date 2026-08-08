/**
 * Global error handler middleware.
 * Catches anything passed via next(err) and returns a clean JSON response.
 */
function errorHandler(err, req, res, next) {
    console.error(`[ERROR] ${req.method} ${req.originalUrl} -`, err.message);

    const status = err.status || err.statusCode || 500;
    const message = err.message || "Something went wrong";

    res.status(status).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
}

module.exports = errorHandler;
