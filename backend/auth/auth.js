import { api, APIError } from "encore.dev/api";
import { getDataSource } from "./datasource";
import { User } from "./user.entity";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { requireRole } from "./middleware";
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-dev-only";
export const createUser = api({ expose: true, method: "POST", path: "/auth/users", auth: true }, async (req) => {
    requireRole("OWNER");
    const ds = await getDataSource();
    const repo = ds.getRepository(User);
    const existing = await repo.findOneBy({ email: req.email });
    if (existing) {
        throw APIError.alreadyExists("user already exists");
    }
    let passwordHash = "";
    if (req.role === "OWNER") {
        if (!req.password) {
            throw APIError.invalidArgument("password is required for OWNER role");
        }
        passwordHash = await bcrypt.hash(req.password, 10);
    }
    else {
        passwordHash = await bcrypt.hash(Math.random().toString(36), 10);
    }
    let pinHash = null;
    if (req.role === "CASHIER") {
        if (!req.pin) {
            throw APIError.invalidArgument("pin is required for CASHIER role");
        }
        if (!/^\d{4,6}$/.test(req.pin)) {
            throw APIError.invalidArgument("pin must be 4-6 digits");
        }
        pinHash = await bcrypt.hash(req.pin, 10);
    }
    const user = repo.create({
        email: req.email,
        passwordHash,
        role: req.role,
        pinHash,
    });
    await repo.save(user);
    return { id: user.id, email: user.email, role: user.role };
});
export const pinLogin = api({ expose: true, method: "POST", path: "/auth/pin-login" }, async (req) => {
    const ds = await getDataSource();
    const repo = ds.getRepository(User);
    const cashiers = await repo.find({ where: { role: "CASHIER", isActive: true } });
    let authenticatedUser = null;
    for (const cashier of cashiers) {
        if (cashier.pinHash && (await bcrypt.compare(req.pin, cashier.pinHash))) {
            authenticatedUser = cashier;
            break;
        }
    }
    if (!authenticatedUser) {
        throw APIError.unauthenticated("invalid pin");
    }
    const token = jwt.sign({ sub: authenticatedUser.id, email: authenticatedUser.email, role: authenticatedUser.role }, JWT_SECRET, { expiresIn: "24h" });
    return { token };
});
export const register = api({ expose: true, method: "POST", path: "/auth/register" }, async (req) => {
    const ds = await getDataSource();
    const repo = ds.getRepository(User);
    const existing = await repo.findOneBy({ email: req.email });
    if (existing) {
        throw APIError.alreadyExists("user already exists");
    }
    const passwordHash = await bcrypt.hash(req.password, 10);
    const user = repo.create({
        email: req.email,
        passwordHash,
        role: "OWNER",
    });
    await repo.save(user);
    return { id: user.id, email: user.email };
});
export const login = api({ expose: true, method: "POST", path: "/auth/login" }, async (req) => {
    const ds = await getDataSource();
    const repo = ds.getRepository(User);
    const user = await repo.findOneBy({ email: req.email });
    if (!user) {
        throw APIError.unauthenticated("invalid credentials");
    }
    const isValid = await bcrypt.compare(req.password, user.passwordHash);
    if (!isValid) {
        throw APIError.unauthenticated("invalid credentials");
    }
    const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "24h" });
    return { token };
});
//# sourceMappingURL=auth.js.map