import { APIError, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { getAuthData } from "~encore/auth";
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-dev-only";
export const myAuthHandler = authHandler(async (params) => {
    const token = params.authorization.replace("Bearer ", "");
    if (!token) {
        throw APIError.unauthenticated("no token provided");
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (!decoded.sub || !decoded.email || !decoded.role) {
            throw APIError.unauthenticated("invalid token payload");
        }
        return {
            userID: decoded.sub,
            email: decoded.email,
            role: decoded.role,
        };
    }
    catch (err) {
        throw APIError.unauthenticated("invalid token");
    }
});
export const gateway = new Gateway({ authHandler: myAuthHandler });
export function requireRole(role) {
    const authData = getAuthData();
    if (!authData || authData.role !== role) {
        throw APIError.permissionDenied(`unauthorized: required role ${role}`);
    }
}
//# sourceMappingURL=middleware.js.map