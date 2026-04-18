import { Gateway, Header } from "encore.dev/api";
export type UserRole = "OWNER" | "CASHIER";
interface AuthParams {
    authorization: Header<"Authorization">;
}
export interface AuthData {
    userID: string;
    email: string;
    role: UserRole;
}
export declare const myAuthHandler: import("encore.dev/auth").AuthHandler<AuthParams, AuthData>;
export declare const gateway: Gateway;
export declare function requireRole(role: UserRole): void;
export {};
