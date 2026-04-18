import { UserRole } from "./user.entity";
interface CreateUserRequest {
    email: string;
    password?: string;
    pin?: string;
    role: UserRole;
}
interface CreateUserResponse {
    id: string;
    email: string;
    role: UserRole;
}
export declare const createUser: (params: CreateUserRequest) => Promise<CreateUserResponse>;
interface PinLoginRequest {
    pin: string;
}
export declare const pinLogin: (params: PinLoginRequest) => Promise<LoginResponse>;
interface RegisterRequest {
    email: string;
    password: string;
}
interface RegisterResponse {
    id: string;
    email: string;
}
export declare const register: (params: RegisterRequest) => Promise<RegisterResponse>;
interface LoginRequest {
    email: string;
    password: string;
}
interface LoginResponse {
    token: string;
}
export declare const login: (params: LoginRequest) => Promise<LoginResponse>;
export {};
