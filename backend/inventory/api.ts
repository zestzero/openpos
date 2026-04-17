import { api } from "encore.dev/api";
import { getDataSource } from "./datasource";
import { getDataSource as getCatalogDataSource } from "../catalog/datasource";
import { InventoryLedger, InventorySnapshot } from "./entities";
import { Variant } from "../catalog/entities";
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

interface VariantStockItem {
  variant_id: string;
  sku: string;
  barcode: string | null;
  cost_cents: number;
  balance: number;
}

interface ListVariantsResponse {
  variants: VariantStockItem[];
}

async function calculateBalance(variantId: string, ds: any): Promise<number> {
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

export const listVariants = api(
  { expose: true, method: "GET", path: "/inventory/variants", auth: true },
  async (): Promise<ListVariantsResponse> => {
    const invDs = await getDataSource();
    const catDs = await getCatalogDataSource();

    const variantRepo = catDs.getRepository(Variant);
    const variants = await variantRepo.find({ where: { active: true } });

    const items: VariantStockItem[] = [];
    for (const variant of variants) {
      const balance = await calculateBalance(variant.id, invDs);
      items.push({
        variant_id: variant.id,
        sku: variant.sku,
        barcode: variant.barcode,
        cost_cents: variant.cost_cents,
        balance,
      });
    }

    return { variants: items };
  }
);

interface LedgerHistoryRequest {
  variantId: string;
  limit?: number;
  offset?: number;
  since?: string;
}

interface LedgerHistoryItem {
  id: string;
  delta: number;
  type: string;
  reference_id: string | null;
  reason: string | null;
  created_at: string;
}

interface LedgerHistoryResponse {
  ledger: LedgerHistoryItem[];
  total: number;
}

export const getLedgerHistory = api(
  { expose: true, method: "GET", path: "/inventory/ledger/:variantId", auth: true },
  async (req: LedgerHistoryRequest): Promise<LedgerHistoryResponse> => {
    const ds = await getDataSource();
    const repo = ds.getRepository(InventoryLedger);

    const limit = req.limit || 50;
    const offset = req.offset || 0;

    const qb = repo.createQueryBuilder("ledger")
      .where("ledger.variant_id = :variantId", { variantId: req.variantId });

    if (req.since) {
      qb.andWhere("ledger.created_at > :since", { since: new Date(req.since) });
    }

    const total = await qb.getCount();

    const entries = await qb
      .orderBy("ledger.created_at", "DESC")
      .skip(offset)
      .take(limit)
      .getMany();

    return {
      ledger: entries.map((e) => ({
        id: e.id,
        delta: e.delta,
        type: e.type,
        reference_id: e.reference_id,
        reason: e.reason,
        created_at: e.created_at.toISOString(),
      })),
      total,
    };
  }
);

interface LowStockRequest {
  threshold: number;
}

interface LowStockItem {
  variant_id: string;
  sku: string;
  barcode: string | null;
  balance: number;
}

interface LowStockResponse {
  variants: LowStockItem[];
}

export const getLowStock = api(
  { expose: true, method: "GET", path: "/inventory/low-stock", auth: true },
  async (req: LowStockRequest): Promise<LowStockResponse> => {
    const invDs = await getDataSource();
    const catDs = await getCatalogDataSource();

    const variantRepo = catDs.getRepository(Variant);
    const variants = await variantRepo.find({ where: { active: true } });

    const threshold = req.threshold || 10;
    const items: LowStockItem[] = [];

    for (const variant of variants) {
      const balance = await calculateBalance(variant.id, invDs);
      if (balance < threshold) {
        items.push({
          variant_id: variant.id,
          sku: variant.sku,
          barcode: variant.barcode,
          balance,
        });
      }
    }

    return { variants: items };
  }
);

interface RestockItem {
  variant_id: string;
  delta: number;
}

interface RestockRequest {
  items: RestockItem[];
  reason: string;
}

interface RestockResponse {
  entries: LedgerResponse[];
}

export const restock = api(
  { expose: true, method: "POST", path: "/inventory/restock", auth: true },
  async (req: RestockRequest): Promise<RestockResponse> => {
    requireRole("OWNER");

    const entries: LedgerResponse[] = [];
    for (const item of req.items) {
      const entry = await createLedgerEntry({
        variant_id: item.variant_id,
        delta: item.delta,
        type: "restock",
        reason: req.reason,
      });
      entries.push(entry);
    }

    return { entries };
  }
);

interface ValuationResponse {
  total_value_cents: number;
  variant_count: number;
}

export const getValuation = api(
  { expose: true, method: "GET", path: "/inventory/valuation", auth: true },
  async (): Promise<ValuationResponse> => {
    const invDs = await getDataSource();
    const catDs = await getCatalogDataSource();

    const variantRepo = catDs.getRepository(Variant);
    const variants = await variantRepo.find({ where: { active: true } });

    let totalValue = 0;
    for (const variant of variants) {
      const balance = await calculateBalance(variant.id, invDs);
      totalValue += balance * variant.cost_cents;
    }

    return {
      total_value_cents: totalValue,
      variant_count: variants.length,
    };
  }
);

interface CreateSnapshotRequest {
  variant_id?: string;
}

interface SnapshotResponse {
  id: string;
  variant_id: string;
  balance: number;
  snapshot_at: string;
}

export const createSnapshot = api(
  { expose: true, method: "POST", path: "/inventory/snapshot", auth: true },
  async (req: CreateSnapshotRequest): Promise<SnapshotResponse> => {
    requireRole("OWNER");

    const invDs = await getDataSource();
    const catDs = await getCatalogDataSource();

    const variantRepo = catDs.getRepository(Variant);
    const snapshotRepo = invDs.getRepository(InventorySnapshot);

    let variants: Variant[];
    if (req.variant_id) {
      const variant = await variantRepo.findOneBy({ id: req.variant_id });
      variants = variant ? [variant] : [];
    } else {
      variants = await variantRepo.find({ where: { active: true } });
    }

    const snapshots: SnapshotResponse[] = [];
    for (const variant of variants) {
      const balance = await calculateBalance(variant.id, invDs);

      const snapshot = snapshotRepo.create({
        variant_id: variant.id,
        balance,
      });

      const saved = await snapshotRepo.save(snapshot);
      snapshots.push({
        id: saved.id,
        variant_id: saved.variant_id,
        balance: saved.balance,
        snapshot_at: saved.snapshot_at.toISOString(),
      });
    }

    if (snapshots.length === 1) {
      return snapshots[0];
    }
    return {
      id: "batch",
      variant_id: "batch",
      balance: snapshots.reduce((sum, s) => sum + s.balance, 0),
      snapshot_at: new Date().toISOString(),
    };
  }
);
