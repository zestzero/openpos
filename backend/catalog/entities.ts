import "reflect-metadata";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";

@Entity({ name: "categories" })
export class Category {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  name: string;

  @Column({ name: "sort_order", type: "integer", default: 0 })
  sort_order: number;

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at: Date;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}

@Entity({ name: "products" })
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ name: "category_id", type: "uuid", nullable: true })
  category_id: string | null;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: "category_id" })
  category: Category | null;

  @Column({ type: "boolean", default: false })
  archived: boolean;

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at: Date;

  @OneToMany(() => Variant, (variant) => variant.product)
  variants: Variant[];
}

@Entity({ name: "variants" })
export class Variant {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "product_id", type: "uuid" })
  product_id: string;

  @ManyToOne(() => Product, (product) => product.variants, { onDelete: "CASCADE" })
  @JoinColumn({ name: "product_id" })
  product: Product;

  @Column({ type: "varchar", unique: true })
  sku: string;

  @Index("idx_variants_barcode_unique", { unique: true, where: "barcode IS NOT NULL" })
  @Column({ type: "varchar", nullable: true })
  barcode: string | null;

  @Column({ name: "price_cents", type: "integer" })
  price_cents: number;

  @Column({ name: "cost_cents", type: "integer", default: 0 })
  cost_cents: number;

  @Column({ type: "boolean", default: true })
  active: boolean;

  @Column({ name: "low_stock_threshold", type: "integer", default: 10 })
  low_stock_threshold: number;

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at: Date;
}
