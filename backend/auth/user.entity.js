var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, } from "typeorm";
let User = class User {
    id;
    email;
    passwordHash;
    role;
    pinHash;
    isActive;
    lastLoginAt;
    createdBy;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn("uuid"),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    Column({ unique: true, type: "varchar" }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    Column({ name: "password_hash", type: "varchar" }),
    __metadata("design:type", String)
], User.prototype, "passwordHash", void 0);
__decorate([
    Column({ default: "OWNER", type: "varchar" }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    Column({ name: "pin_hash", nullable: true, type: "varchar" }),
    __metadata("design:type", Object)
], User.prototype, "pinHash", void 0);
__decorate([
    Column({ name: "is_active", default: true, type: "boolean" }),
    __metadata("design:type", Boolean)
], User.prototype, "isActive", void 0);
__decorate([
    Column({ name: "last_login_at", type: "timestamp with time zone", nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "lastLoginAt", void 0);
__decorate([
    ManyToOne(() => User, { nullable: true }),
    JoinColumn({ name: "created_by" }),
    __metadata("design:type", Object)
], User.prototype, "createdBy", void 0);
__decorate([
    CreateDateColumn({ name: "created_at", type: "timestamp with time zone" }),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn({ name: "updated_at", type: "timestamp with time zone" }),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
User = __decorate([
    Entity("users")
], User);
export { User };
//# sourceMappingURL=user.entity.js.map