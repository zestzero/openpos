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
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";
let InventoryLedger = class InventoryLedger {
    id;
    variant_id;
    delta;
    type;
    reference_id;
    reason;
    client_generated_id;
    created_at;
};
__decorate([
    PrimaryGeneratedColumn("uuid"),
    __metadata("design:type", String)
], InventoryLedger.prototype, "id", void 0);
__decorate([
    Column("uuid"),
    Index("idx_ledger_variant_id"),
    __metadata("design:type", String)
], InventoryLedger.prototype, "variant_id", void 0);
__decorate([
    Column("int"),
    __metadata("design:type", Number)
], InventoryLedger.prototype, "delta", void 0);
__decorate([
    Column("varchar", { length: 20 }),
    __metadata("design:type", String)
], InventoryLedger.prototype, "type", void 0);
__decorate([
    Column("uuid", { nullable: true }),
    __metadata("design:type", Object)
], InventoryLedger.prototype, "reference_id", void 0);
__decorate([
    Column("text", { nullable: true }),
    __metadata("design:type", Object)
], InventoryLedger.prototype, "reason", void 0);
__decorate([
    Column("uuid", { unique: true, nullable: true }),
    __metadata("design:type", Object)
], InventoryLedger.prototype, "client_generated_id", void 0);
__decorate([
    CreateDateColumn({ type: "timestamptz" }),
    Index("idx_ledger_created_at"),
    __metadata("design:type", Date)
], InventoryLedger.prototype, "created_at", void 0);
InventoryLedger = __decorate([
    Entity("inventory_ledger")
], InventoryLedger);
export { InventoryLedger };
let InventorySnapshot = class InventorySnapshot {
    id;
    variant_id;
    balance;
    snapshot_at;
};
__decorate([
    PrimaryGeneratedColumn("uuid"),
    __metadata("design:type", String)
], InventorySnapshot.prototype, "id", void 0);
__decorate([
    Column("uuid"),
    Index("idx_snapshots_variant_id"),
    __metadata("design:type", String)
], InventorySnapshot.prototype, "variant_id", void 0);
__decorate([
    Column("int", { default: 0 }),
    __metadata("design:type", Number)
], InventorySnapshot.prototype, "balance", void 0);
__decorate([
    CreateDateColumn({ type: "timestamptz" }),
    __metadata("design:type", Date)
], InventorySnapshot.prototype, "snapshot_at", void 0);
InventorySnapshot = __decorate([
    Entity("inventory_snapshots")
], InventorySnapshot);
export { InventorySnapshot };
//# sourceMappingURL=entities.js.map