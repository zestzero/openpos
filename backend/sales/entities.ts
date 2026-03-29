import "reflect-metadata";
import { Entity, PrimaryColumn, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from "typeorm";

@Entity("orders")
export class Order {
  @PrimaryColumn("uuid")
  id!: string;

  @Column("uuid")
  cashier_id!: string;

  @Column("integer")
  total_cents!: number;

  @Column({ type: "varchar", length: 20, default: "completed" })
  status!: string;

  @Column({ type: "timestamptz", nullable: true })
  client_created_at!: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at!: Date;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items!: OrderItem[];
}

@Entity("order_items")
export class OrderItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("uuid")
  order_id!: string;

  @Column("uuid")
  variant_id!: string;

  @Column("integer")
  quantity!: number;

  @Column("integer")
  price_cents!: number;

  @Column("integer")
  line_total_cents!: number;

  @CreateDateColumn({ type: "timestamptz" })
  created_at!: Date;

  @ManyToOne(() => Order, (order) => order.items)
  @JoinColumn({ name: "order_id" })
  order!: Order;
}
