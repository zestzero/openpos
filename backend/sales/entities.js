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
import { Entity, PrimaryColumn, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from "typeorm";
let Order = class Order {
    id;
    cashier_id;
    total_cents;
    status;
    client_created_at;
    payment_method;
    tendered_cents;
    change_cents;
    receipt_printed;
    created_at;
    updated_at;
    items;
};
__decorate([
    PrimaryColumn("uuid"),
    __metadata("design:type", String)
], Order.prototype, "id", void 0);
__decorate([
    Column("uuid"),
    __metadata("design:type", String)
], Order.prototype, "cashier_id", void 0);
__decorate([
    Column("integer"),
    __metadata("design:type", Number)
], Order.prototype, "total_cents", void 0);
__decorate([
    Column({ type: "varchar", length: 20, default: "completed" }),
    __metadata("design:type", String)
], Order.prototype, "status", void 0);
__decorate([
    Column({ type: "timestamptz", nullable: true }),
    __metadata("design:type", Object)
], Order.prototype, "client_created_at", void 0);
__decorate([
    Column({ type: "varchar", length: 10, nullable: true }),
    __metadata("design:type", Object)
], Order.prototype, "payment_method", void 0);
__decorate([
    Column({ type: "integer", nullable: true }),
    __metadata("design:type", Object)
], Order.prototype, "tendered_cents", void 0);
__decorate([
    Column({ type: "integer", nullable: true }),
    __metadata("design:type", Object)
], Order.prototype, "change_cents", void 0);
__decorate([
    Column({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], Order.prototype, "receipt_printed", void 0);
__decorate([
    CreateDateColumn({ type: "timestamptz" }),
    __metadata("design:type", Date)
], Order.prototype, "created_at", void 0);
__decorate([
    UpdateDateColumn({ type: "timestamptz" }),
    __metadata("design:type", Date)
], Order.prototype, "updated_at", void 0);
__decorate([
    OneToMany(() => OrderItem, (item) => item.order, { cascade: true }),
    __metadata("design:type", Array)
], Order.prototype, "items", void 0);
Order = __decorate([
    Entity("orders")
], Order);
export { Order };
let OrderItem = class OrderItem {
    id;
    order_id;
    variant_id;
    quantity;
    price_cents;
    line_total_cents;
    created_at;
    order;
};
__decorate([
    PrimaryGeneratedColumn("uuid"),
    __metadata("design:type", String)
], OrderItem.prototype, "id", void 0);
__decorate([
    Column("uuid"),
    __metadata("design:type", String)
], OrderItem.prototype, "order_id", void 0);
__decorate([
    Column("uuid"),
    __metadata("design:type", String)
], OrderItem.prototype, "variant_id", void 0);
__decorate([
    Column("integer"),
    __metadata("design:type", Number)
], OrderItem.prototype, "quantity", void 0);
__decorate([
    Column("integer"),
    __metadata("design:type", Number)
], OrderItem.prototype, "price_cents", void 0);
__decorate([
    Column("integer"),
    __metadata("design:type", Number)
], OrderItem.prototype, "line_total_cents", void 0);
__decorate([
    CreateDateColumn({ type: "timestamptz" }),
    __metadata("design:type", Date)
], OrderItem.prototype, "created_at", void 0);
__decorate([
    ManyToOne(() => Order, (order) => order.items),
    JoinColumn({ name: "order_id" }),
    __metadata("design:type", Order)
], OrderItem.prototype, "order", void 0);
OrderItem = __decorate([
    Entity("order_items")
], OrderItem);
export { OrderItem };
//# sourceMappingURL=entities.js.map