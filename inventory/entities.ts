import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";

@Entity("inventory_ledger")
export class InventoryLedger {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid")
  @Index("idx_ledger_variant_id")
  variant_id: string;

  @Column("int")
  delta: number;

  @Column("varchar", { length: 20 })
  type: "sale" | "restock" | "adjustment" | "sync";

  @Column("uuid", { nullable: true })
  reference_id: string | null;

  @Column("text", { nullable: true })
  reason: string | null;

  @Column("uuid", { unique: true, nullable: true })
  client_generated_id: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  @Index("idx_ledger_created_at")
  created_at: Date;
}

@Entity("inventory_snapshots")
export class InventorySnapshot {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid")
  @Index("idx_snapshots_variant_id")
  variant_id: string;

  @Column("int", { default: 0 })
  balance: number;

  @CreateDateColumn({ type: "timestamptz" })
  snapshot_at: Date;
}
