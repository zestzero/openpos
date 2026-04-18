import { api } from "encore.dev/api";
import { getDataSource } from "./datasource";
import { InventoryLedger, InventorySnapshot } from "./entities";
import { Product, Variant } from "../catalog/entities";
import { requireRole } from "../auth/middleware";

interface LedgerRequest {
  variant_id: string;
  delta: number;
  type: "sale" | "restock" | "adjustment" | "sync";
  reference_id?: string;
  reason?: string;
  client_generated_id?: string;
}

interface LedgerResponse {
  id: string;
  variant_id: string;
  delta: number;
  type: string;
  reference_id: string | null;
  reason: string | null;
  client_generated_id: string | null;
  created_at: string;
}

export const createLedgerEntry = api(
  { expose: true, method: "POST", path: "/inventory/ledger", auth: true },
  async (req: LedgerRequest): Promise<LedgerResponse> => {
    const ds = await getDataSource();
    const repo = ds.getRepository(InventoryLedger);

    if (req.client_generated_id) {
      const existing = await repo.findOneBy({ client_generated_id: req.client_generated_id });
      if (existing) {
        return {
          ...existing,
          created_at: existing.created_at.toISOString(),
        };
      }
    }

    try {
      const entry = repo.create({
        variant_id: req.variant_id,
        delta: req.delta,
        type: req.type,
        reference_id: req.reference_id || null,
        reason: req.reason || null,
        client_generated_id: req.client_generated_id || null,
      });

      const saved = await repo.save(entry);
      return {
        ...saved,
        created_at: saved.created_at.toISOString(),
      };
    } catch (err: any) {
      if (err.code === "23505" && req.client_generated_id) {
        const existing = await repo.findOneBy({ client_generated_id: req.client_generated_id });
        if (existing) {
          return {
            ...existing,
            created_at: existing.created_at.toISOString(),
          };
        }
      }
      throw err;
    }
  }
);

interface AdjustmentRequest {
  variant_id: string;
  delta: number;
  reason: string;
}

export const adjustStock = api(
  { expose: true, method: "POST", path: "/inventory/adjustment", auth: true },
  async (req: AdjustmentRequest): Promise<LedgerResponse> => {
    requireRole("OWNER");
    return await createLedgerEntry({
      variant_id: req.variant_id,
      delta: req.delta,
      type: "adjustment",
      reason: req.reason,
    });
  }
);

interface StockResponse {
  variant_id: string;
  balance: number;
  snapshot_at: string | null;
}

export const getStock = api(
  { expose: true, method: "GET", path: "/inventory/variants/:id/stock", auth: true },
  async ({ id }: { id: string }): Promise<StockResponse> => {
    const ds = await getDataSource();
    const snapshotRepo = ds.getRepository(InventorySnapshot);
    const ledgerRepo = ds.getRepository(InventoryLedger);

    const latestSnapshot = await snapshotRepo.findOne({
      where: { variant_id: id },
      order: { snapshot_at: "DESC" },
    });

    let balance = latestSnapshot ? latestSnapshot.balance : 0;
    const since = latestSnapshot ? latestSnapshot.snapshot_at : new Date(0);

    const result = await ledgerRepo
      .createQueryBuilder("ledger")
      .select("SUM(ledger.delta)", "sum")
      .where("ledger.variant_id = :id", { id })
      .andWhere("ledger.created_at > :since", { since })
      .getRawOne();

    const deltaSum = parseInt(result?.sum || "0", 10);
    balance += deltaSum;

    return {
      variant_id: id,
      balance,
      snapshot_at: latestSnapshot ? latestSnapshot.snapshot_at.toISOString() : null,
    };
  }
);

interface LowStockVariant {
  variant_id: string;
  sku: string;
  barcode: string | null;
  product_id: string;
  product_name: string;
  balance: number;
  threshold: number;
  status: "low" | "out";
}

interface LowStockResponse {
  variants: LowStockVariant[];
}

async function getVariantBalance(ds: Awaited<ReturnType<typeof getDataSource>>, variantId: string): Promise<number> {
  const snapshotRepo = ds.getRepository(InventorySnapshot);
  const ledgerRepo = ds.getRepository(InventoryLedger);

  const latestSnapshot = await snapshotRepo.findOne({
    where: { variant_id: variantId },
    order: { snapshot_at: "DESC" },
  });

  let balance = latestSnapshot ? latestSnapshot.balance : 0;
  const since = latestSnapshot ? latestSnapshot.snapshot_at : new Date(0);

  const result = await ledgerRepo
    .createQueryBuilder("ledger")
    .select("SUM(ledger.delta)", "sum")
    .where("ledger.variant_id = :id", { id: variantId })
    .andWhere("ledger.created_at > :since", { since })
    .getRawOne();

  const deltaSum = parseInt(result?.sum || "0", 10);
  return balance + deltaSum;
}

export const getLowStock = api(
  { expose: true, method: "GET", path: "/inventory/low-stock", auth: true },
  async (req: { threshold?: number }): Promise<LowStockResponse> => {
    const ds = await getDataSource();
    const variantRepo = ds.getRepository(Variant);
    const productRepo = ds.getRepository(Product);

    const variants = await variantRepo.find();

    const lowStockVariants: LowStockVariant[] = [];

    for (const variant of variants) {
      const balance = await getVariantBalance(ds, variant.id);
      const effectiveThreshold = req.threshold ?? variant.low_stock_threshold;

      if (balance <= effectiveThreshold) {
        const product = await productRepo.findOne({ where: { id: variant.product_id } });
        lowStockVariants.push({
          variant_id: variant.id,
          sku: variant.sku,
          barcode: variant.barcode,
          product_id: variant.product_id,
          product_name: product?.name ?? "Unknown Product",
          balance,
          threshold: effectiveThreshold,
          status: balance === 0 ? "out" : "low",
        });
      }
    }

    return { variants: lowStockVariants };
  }
);
