import { Request, Response, NextFunction } from "express";
import { JwtPayload, UserRole } from "../types";

/**
 * Role-based access guard.
 * Usage: authorize("admin", "sales")
 */
export default function authorize(...roles: UserRole[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const user = (req as Request & { user?: JwtPayload }).user;

        if (!user) {
            res.status(401).json({ success: false, message: "Not authenticated" });
            return;
        }

        if (!roles.includes(user.role)) {
            res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${roles.join(" or ")}`,
            });
            return;
        }

        next();
    };
}
