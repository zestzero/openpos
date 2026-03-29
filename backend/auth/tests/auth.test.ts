import { describe, it, expect, beforeEach } from "vitest";
import { createUser, pinLogin, register, login } from "../auth";
import { User } from "../user.entity";
import { getDataSource } from "../datasource";
import * as jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-dev-only";

// Mock Encore's getAuthData and other internals is hard without the full environment,
// but we can test the logic by manually calling the functions or mocking the DB.
// Since we are in a GSD environment, we should try to run actual tests if possible.

describe("Auth Service", () => {
  beforeEach(async () => {
    const ds = await getDataSource();
    await ds.getRepository(User).delete({});

    await register({ email: "owner@example.com", password: "password123" });
  });

  it("should allow a cashier to login with PIN", async () => {
    try {
      await createUser({
        email: "cashier@example.com",
        role: "CASHIER",
        pin: "1234"
      });
    } catch (e) {}

    const ds = await getDataSource();
    const repo = ds.getRepository(User);
    const pinHash = await (await import("bcryptjs")).hash("4321", 10);
    const passwordHash = await (await import("bcryptjs")).hash("dummy", 10);
    const user = repo.create({
      email: "cashier2@example.com",
      role: "CASHIER",
      pinHash,
      passwordHash
    });
    await repo.save(user);

    const res = await pinLogin({ pin: "4321" });
    expect(res.token).toBeDefined();

    const decoded = jwt.verify(res.token, JWT_SECRET) as any;
    expect(decoded.email).toBe("cashier2@example.com");
    expect(decoded.role).toBe("CASHIER");
  });

  it("should fail pin login with invalid PIN", async () => {
    const ds = await getDataSource();
    const repo = ds.getRepository(User);
    const pinHash = await (await import("bcryptjs")).hash("5555", 10);
    const passwordHash = await (await import("bcryptjs")).hash("dummy", 10);
    const user = repo.create({
      email: "cashier3@example.com",
      role: "CASHIER",
      pinHash,
      passwordHash
    });
    await repo.save(user);

    await expect(pinLogin({ pin: "1111" })).rejects.toThrow();
  });
});
