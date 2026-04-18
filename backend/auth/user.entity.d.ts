import "reflect-metadata";
export type UserRole = "OWNER" | "CASHIER";
export declare class User {
    id: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    pinHash: string | null;
    isActive: boolean;
    lastLoginAt: Date | null;
    createdBy: User | null;
    createdAt: Date;
    updatedAt: Date;
}
