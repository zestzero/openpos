import { api, APIError } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { getAuthData } from "~encore/auth";
import * as jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-dev-only";

export type UserRole = "OWNER" | "CASHIER";

export interface AuthData {
  userID: string;
  email: string;
  role: UserRole;
}

export const auth = authHandler(async (token: string): Promise<AuthData> => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded.sub || !decoded.email || !decoded.role) {
      throw APIError.unauthenticated("invalid token payload");
    }
    return {
      userID: decoded.sub,
      email: decoded.email,
      role: decoded.role as UserRole,
    };
  } catch (err) {
    throw APIError.unauthenticated("invalid token");
  }
});

export function requireRole(role: UserRole): void {
  const authData = getAuthData();
  if (!authData || authData.role !== role) {
    throw APIError.permissionDenied(`unauthorized: required role ${role}`);
  }
}
