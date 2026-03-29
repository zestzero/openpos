import { APIError, Gateway, Header } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { getAuthData } from "~encore/auth";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-dev-only";

export type UserRole = "OWNER" | "CASHIER";

interface AuthParams {
  authorization: Header<"Authorization">;
}

export interface AuthData {
  userID: string;
  email: string;
  role: UserRole;
}

export const myAuthHandler = authHandler(
  async (params: AuthParams): Promise<AuthData> => {
    const token = params.authorization.replace("Bearer ", "");
    if (!token) {
      throw APIError.unauthenticated("no token provided");
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        sub: string;
        email: string;
        role: string;
      };
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
  }
);

export const gateway = new Gateway({ authHandler: myAuthHandler });

export function requireRole(role: UserRole): void {
  const authData = getAuthData();
  if (!authData || authData.role !== role) {
    throw APIError.permissionDenied(`unauthorized: required role ${role}`);
  }
}
