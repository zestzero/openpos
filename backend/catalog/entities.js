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
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index, } from "typeorm";
let Category = class Category {
    id;
    name;
    sort_order;
    created_at;
    updated_at;
    products;
};
__decorate([
    PrimaryGeneratedColumn("uuid"),
    __metadata("design:type", String)
], Category.prototype, "id", void 0);
__decorate([
    Column({ type: "varchar" }),
    __metadata("design:type", String)
], Category.prototype, "name", void 0);
__decorate([
    Column({ name: "sort_order", type: "integer", default: 0 }),
    __metadata("design:type", Number)
], Category.prototype, "sort_order", void 0);
__decorate([
    CreateDateColumn({ name: "created_at" }),
    __metadata("design:type", Date)
], Category.prototype, "created_at", void 0);
__decorate([
    UpdateDateColumn({ name: "updated_at" }),
    __metadata("design:type", Date)
], Category.prototype, "updated_at", void 0);
__decorate([
    OneToMany(() => Product, (product) => product.category),
    __metadata("design:type", Array)
], Category.prototype, "products", void 0);
Category = __decorate([
    Entity({ name: "categories" })
], Category);
export { Category };
let Product = class Product {
    id;
    name;
    description;
    category_id;
    category;
    archived;
    created_at;
    updated_at;
    variants;
};
__decorate([
    PrimaryGeneratedColumn("uuid"),
    __metadata("design:type", String)
], Product.prototype, "id", void 0);
__decorate([
    Column({ type: "varchar" }),
    __metadata("design:type", String)
], Product.prototype, "name", void 0);
__decorate([
    Column({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], Product.prototype, "description", void 0);
__decorate([
    Column({ name: "category_id", type: "uuid", nullable: true }),
    __metadata("design:type", Object)
], Product.prototype, "category_id", void 0);
__decorate([
    ManyToOne(() => Category, (category) => category.products),
    JoinColumn({ name: "category_id" }),
    __metadata("design:type", Object)
], Product.prototype, "category", void 0);
__decorate([
    Column({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], Product.prototype, "archived", void 0);
__decorate([
    CreateDateColumn({ name: "created_at" }),
    __metadata("design:type", Date)
], Product.prototype, "created_at", void 0);
__decorate([
    UpdateDateColumn({ name: "updated_at" }),
    __metadata("design:type", Date)
], Product.prototype, "updated_at", void 0);
__decorate([
    OneToMany(() => Variant, (variant) => variant.product),
    __metadata("design:type", Array)
], Product.prototype, "variants", void 0);
Product = __decorate([
    Entity({ name: "products" })
], Product);
export { Product };
let Variant = class Variant {
    id;
    product_id;
    product;
    sku;
    barcode;
    price_cents;
    cost_cents;
    active;
    created_at;
    updated_at;
};
__decorate([
    PrimaryGeneratedColumn("uuid"),
    __metadata("design:type", String)
], Variant.prototype, "id", void 0);
__decorate([
    Column({ name: "product_id", type: "uuid" }),
    __metadata("design:type", String)
], Variant.prototype, "product_id", void 0);
__decorate([
    ManyToOne(() => Product, (product) => product.variants, { onDelete: "CASCADE" }),
    JoinColumn({ name: "product_id" }),
    __metadata("design:type", Product)
], Variant.prototype, "product", void 0);
__decorate([
    Column({ type: "varchar", unique: true }),
    __metadata("design:type", String)
], Variant.prototype, "sku", void 0);
__decorate([
    Index("idx_variants_barcode_unique", { unique: true, where: "barcode IS NOT NULL" }),
    Column({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], Variant.prototype, "barcode", void 0);
__decorate([
    Column({ name: "price_cents", type: "integer" }),
    __metadata("design:type", Number)
], Variant.prototype, "price_cents", void 0);
__decorate([
    Column({ name: "cost_cents", type: "integer", default: 0 }),
    __metadata("design:type", Number)
], Variant.prototype, "cost_cents", void 0);
__decorate([
    Column({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], Variant.prototype, "active", void 0);
__decorate([
    CreateDateColumn({ name: "created_at" }),
    __metadata("design:type", Date)
], Variant.prototype, "created_at", void 0);
__decorate([
    UpdateDateColumn({ name: "updated_at" }),
    __metadata("design:type", Date)
], Variant.prototype, "updated_at", void 0);
Variant = __decorate([
    Entity({ name: "variants" })
], Variant);
export { Variant };
//# sourceMappingURL=entities.js.map