import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

export type UserRole = "OWNER" | "CASHIER";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: "password_hash" })
  passwordHash: string;

  @Column({ default: "OWNER" })
  role: UserRole;

  @Column({ name: "pin_hash", nullable: true })
  pinHash: string | null;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @Column({ name: "last_login_at", type: "timestamp with time zone", nullable: true })
  lastLoginAt: Date | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "created_by" })
  createdBy: User | null;

  @CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp with time zone" })
  updatedAt: Date;
}
