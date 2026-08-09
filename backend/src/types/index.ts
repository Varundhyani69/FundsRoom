import { Request } from "express";

export type UserRole = "admin" | "sales" | "warehouse" | "accounts";

export interface JwtPayload {
    id: number;
    name: string;
    email: string;
    role: UserRole;
}

// Extends Express Request to include the decoded JWT user
export interface AuthRequest extends Request {
    user: JwtPayload;
}
