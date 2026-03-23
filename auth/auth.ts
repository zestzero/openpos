import { api, APIError } from "encore.dev/api";
import { getDataSource } from "./datasource";
import { User } from "./user.entity";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-dev-only";

interface RegisterRequest {
  email: string;
  password: string;
}

interface RegisterResponse {
  id: string;
  email: string;
}

export const register = api(
  { expose: true, method: "POST", path: "/auth/register" },
  async (req: RegisterRequest): Promise<RegisterResponse> => {
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
  }
);

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
}

export const login = api(
  { expose: true, method: "POST", path: "/auth/login" },
  async (req: LoginRequest): Promise<LoginResponse> => {
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

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    return { token };
  }
);
