import { api, APIError } from "encore.dev/api";
import { getDataSource } from "./datasource";
import { getDataSource as getCatalogDataSource } from "../catalog/datasource";
import { InventoryLedger, InventorySnapshot } from "./entities";
import { Variant } from "../catalog/entities";
import { requireRole } from "../auth/middleware";
import { ILike } from "typeorm";
import { Variant } from "../catalog/entities";
import { catalog } from "~encore/clients";
import { getAuthData } from "~encore/auth";

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

<<<<<<< HEAD
interface InventoryItemResponse {
  variant_id: string;
  product_id: string;
  product_name: string;
  category_id: string | null;
  category_name: string | null;
  sku: string;
  barcode: string | null;
  stock: number;
  status: "in-stock" | "low" | "out";
}

interface ListInventoryRequest {
  search?: string;
  category_id?: string;
  status?: "in-stock" | "low" | "out";
  sort_by?: "stock" | "product" | "sku";
  sort_order?: "asc" | "desc";
  page?: number;
  page_size?: number;
}

interface ListInventoryResponse {
  items: InventoryItemResponse[];
  total: number;
  page: number;
  page_size: number;
}

function calculateStock(
  latestSnapshot: InventorySnapshot | null,
  deltaSum: number
): { stock: number; status: "in-stock" | "low" | "out" } {
  const balance = latestSnapshot ? latestSnapshot.balance : 0;
  const stock = balance + deltaSum;
  let status: "in-stock" | "low" | "out" = "out";
  if (stock > 10) status = "in-stock";
  else if (stock >= 1) status = "low";
  return { stock, status };
}

export const listInventory = api(
  { expose: true, method: "GET", path: "/inventory", auth: true },
  async (req: ListInventoryRequest): Promise<ListInventoryResponse> => {
    const ds = await getDataSource();
    const variantRepo = ds.getRepository(
      ds.getRepository(Variant).metadata.target as typeof Variant
    );
    const snapshotRepo = ds.getRepository(InventorySnapshot);
    const ledgerRepo = ds.getRepository(InventoryLedger);

    const page = req.page ?? 1;
    const pageSize = req.page_size ?? 20;
    const offset = (page - 1) * pageSize;

    const variantQb = variantRepo
      .createQueryBuilder("variant")
      .leftJoinAndSelect("variant.product", "product")
      .leftJoinAndSelect("product.category", "category");

    if (req.search) {
      variantQb.andWhere(
        "(product.name ILIKE :search OR variant.sku ILIKE :search OR variant.barcode ILIKE :search)",
        { search: `%${req.search}%` }
      );
    }

    if (req.category_id) {
      variantQb.andWhere("product.category_id = :categoryId", {
        categoryId: req.category_id,
      });
    }

    const total = await variantQb.getCount();

    if (req.sort_by === "product") {
      variantQb.orderBy("product.name", req.sort_order === "asc" ? "ASC" : "DESC");
    } else if (req.sort_by === "sku") {
      variantQb.orderBy("variant.sku", req.sort_order === "asc" ? "ASC" : "DESC");
    }

    variantQb.skip(offset).take(pageSize);

    const variants = await variantQb.getMany();

    const items: InventoryItemResponse[] = await Promise.all(
      variants.map(async (variant) => {
        const latestSnapshot = await snapshotRepo.findOne({
          where: { variant_id: variant.id },
          order: { snapshot_at: "DESC" },
        });

        const since = latestSnapshot ? latestSnapshot.snapshot_at : new Date(0);

        const result = await ledgerRepo
          .createQueryBuilder("ledger")
          .select("SUM(ledger.delta)", "sum")
          .where("ledger.variant_id = :id", { id: variant.id })
          .andWhere("ledger.created_at > :since", { since })
          .getRawOne();

        const deltaSum = parseInt(result?.sum || "0", 10);
        const { stock, status } = calculateStock(latestSnapshot, deltaSum);

        return {
          variant_id: variant.id,
          product_id: variant.product_id,
          product_name: variant.product?.name || "Unknown",
          category_id: variant.product?.category_id || null,
          category_name: variant.product?.category?.name || null,
          sku: variant.sku,
          barcode: variant.barcode,
          stock,
          status,
        };
      })
    );

    if (req.sort_by === "stock") {
      items.sort((a, b) => {
        const cmp = a.stock - b.stock;
        return req.sort_order === "desc" ? -cmp : cmp;
      });
    }

    let filteredItems = items;
    if (req.status) {
      filteredItems = items.filter((item) => item.status === req.status);
    }

    return {
      items: filteredItems,
      total: req.status
        ? filteredItems.length
        : total,
      page,
      page_size: pageSize,
=======
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

interface BulkRestockRow {
  variant_id: string;
  quantity: number;
  reason?: string;
}

interface BulkRestockRequest {
  rows: BulkRestockRow[];
}

interface BulkRestockResultRow {
  variant_id: string;
  success: boolean;
  error?: string;
  ledger_id?: string;
}

interface BulkRestockResponse {
  success_count: number;
  failure_count: number;
  results: BulkRestockResultRow[];
}

export const bulkRestock = api(
  { expose: true, method: "POST", path: "/inventory/bulk-restock", auth: true },
  async (req: BulkRestockRequest): Promise<BulkRestockResponse> => {
    requireRole("OWNER");
    const auth = getAuthData()!;
    const ds = await getDataSource();
    const ledgerRepo = ds.getRepository(InventoryLedger);

    const results: BulkRestockResultRow[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (const row of req.rows) {
      if (!row.variant_id || row.quantity <= 0) {
        results.push({
          variant_id: row.variant_id || "",
          success: false,
          error: "Invalid variant_id or quantity must be > 0",
        });
        failureCount++;
        continue;
      }

      try {
        const clientId = `bulk-restock:${auth.userID}:${row.variant_id}:${Date.now()}`;
        const entry = await createLedgerEntry({
          variant_id: row.variant_id,
          delta: row.quantity,
          type: "restock",
          reason: row.reason || "Bulk restock from CSV",
          client_generated_id: clientId,
        });
        results.push({
          variant_id: row.variant_id,
          success: true,
          ledger_id: entry.id,
        });
        successCount++;
      } catch (err: any) {
        results.push({
          variant_id: row.variant_id,
          success: false,
          error: err.message || "Failed to create ledger entry",
        });
        failureCount++;
      }
    }

    return {
      success_count: successCount,
      failure_count: failureCount,
      results,
    };
  }
);

interface StockLevelExport {
  variant_id: string;
  sku: string | null;
  barcode: string | null;
  product_name: string | null;
  balance: number;
  last_updated: string | null;
}

interface ExportStockResponse {
  levels: StockLevelExport[];
  exported_at: string;
}

export const exportStockLevels = api(
  { expose: true, method: "GET", path: "/inventory/export-stock", auth: true },
  async (): Promise<ExportStockResponse> => {
    requireRole("OWNER");
    const ds = await getDataSource();
    const snapshotRepo = ds.getRepository(InventorySnapshot);
    const ledgerRepo = ds.getRepository(InventoryLedger);

    const snapshots = await snapshotRepo.find();
    const levels: StockLevelExport[] = [];

    for (const snapshot of snapshots) {
      const result = await ledgerRepo
        .createQueryBuilder("ledger")
        .select("SUM(ledger.delta)", "sum")
        .where("ledger.variant_id = :id", { id: snapshot.variant_id })
        .andWhere("ledger.created_at > :since", { since: snapshot.snapshot_at })
        .getRawOne();

      const deltaSum = parseInt(result?.sum || "0", 10);
      const balance = snapshot.balance + deltaSum;

      let variantInfo: { sku: string | null; barcode: string | null; product_name: string | null } = {
        sku: null,
        barcode: null,
        product_name: null,
      };
      try {
        const variant = await catalog.getVariant({ id: snapshot.variant_id });
        variantInfo = {
          sku: variant.sku,
          barcode: variant.barcode,
          product_name: variant.product_name,
        };
      } catch {
        // Variant may have been deleted
      }

      levels.push({
        variant_id: snapshot.variant_id,
        sku: variantInfo.sku,
        barcode: variantInfo.barcode,
        product_name: variantInfo.product_name,
        balance,
        last_updated: snapshot.snapshot_at.toISOString(),
      });
    }

    return {
      levels,
      exported_at: new Date().toISOString(),
    };
  }
);

interface StockCountRow {
  variant_id: string;
  counted_quantity: number;
  reason?: string;
}

interface BulkStockCountRequest {
  rows: StockCountRow[];
}

interface BulkStockCountResultRow {
  variant_id: string;
  success: boolean;
  previous_balance?: number;
  new_balance?: number;
  adjustment_delta?: number;
  error?: string;
}

interface BulkStockCountResponse {
  success_count: number;
  failure_count: number;
  results: BulkStockCountResultRow[];
}

export const bulkStockCount = api(
  { expose: true, method: "POST", path: "/inventory/bulk-stock-count", auth: true },
  async (req: BulkStockCountRequest): Promise<BulkStockCountResponse> => {
    requireRole("OWNER");
    const auth = getAuthData()!;
    const ds = await getDataSource();
    const ledgerRepo = ds.getRepository(InventoryLedger);

    const results: BulkStockCountResultRow[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (const row of req.rows) {
      if (!row.variant_id || row.counted_quantity < 0) {
        results.push({
          variant_id: row.variant_id || "",
          success: false,
          error: "Invalid variant_id or negative counted_quantity",
        });
        failureCount++;
        continue;
      }

      try {
        const currentStock = await getStock({ id: row.variant_id });
        const previousBalance = currentStock.balance;
        const adjustmentDelta = row.counted_quantity - previousBalance;

        if (adjustmentDelta === 0) {
          results.push({
            variant_id: row.variant_id,
            success: true,
            previous_balance: previousBalance,
            new_balance: row.counted_quantity,
            adjustment_delta: 0,
          });
          successCount++;
          continue;
        }

        const clientId = `bulk-count:${auth.userID}:${row.variant_id}:${Date.now()}`;
        const entry = await createLedgerEntry({
          variant_id: row.variant_id,
          delta: adjustmentDelta,
          type: "adjustment",
          reason: row.reason || "Bulk stock count correction",
          client_generated_id: clientId,
        });

        results.push({
          variant_id: row.variant_id,
          success: true,
          previous_balance: previousBalance,
          new_balance: row.counted_quantity,
          adjustment_delta: adjustmentDelta,
        });
        successCount++;
      } catch (err: any) {
        results.push({
          variant_id: row.variant_id,
          success: false,
          error: err.message || "Failed to process stock count",
        });
        failureCount++;
      }
    }

    return {
      success_count: successCount,
      failure_count: failureCount,
      results,
    };
  }
);

interface ReconcileStockRequest {
  variant_id: string;
  expected_quantity: number;
  counted_quantity: number;
  reason: string;
}

interface ReconcileStockResponse {
  variant_id: string;
  previous_balance: number;
  new_balance: number;
  adjustment_delta: number;
  ledger_id: string;
}

export const reconcileStock = api(
  { expose: true, method: "POST", path: "/inventory/reconcile", auth: true },
  async (req: ReconcileStockRequest): Promise<ReconcileStockResponse> => {
    requireRole("OWNER");
    const auth = getAuthData()!;

    const currentStock = await getStock({ id: req.variant_id });
    const adjustmentDelta = req.counted_quantity - req.expected_quantity;

    const clientId = `reconcile:${auth.userID}:${req.variant_id}:${Date.now()}`;
    const entry = await createLedgerEntry({
      variant_id: req.variant_id,
      delta: adjustmentDelta,
      type: "adjustment",
      reason: req.reason,
      client_generated_id: clientId,
    });

    return {
      variant_id: req.variant_id,
      previous_balance: currentStock.balance,
      new_balance: req.counted_quantity,
      adjustment_delta: adjustmentDelta,
      ledger_id: entry.id,
    };
  }
);

interface GlobalLedgerEntry {
  id: string;
  variant_id: string;
  delta: number;
  type: string;
  reference_id: string | null;
  reason: string | null;
  created_at: string;
}

interface RecentLedgerRequest {
  limit?: number;
}

interface RecentLedgerResponse {
  ledger: GlobalLedgerEntry[];
}

export const getRecentLedger = api(
  { expose: true, method: "GET", path: "/inventory/ledger", auth: true },
  async (req: RecentLedgerRequest): Promise<RecentLedgerResponse> => {
    const ds = await getDataSource();
    const repo = ds.getRepository(InventoryLedger);

    const limit = req.limit || 10;

    const entries = await repo.find({
      order: { created_at: "DESC" },
      take: limit,
    });

    return {
      ledger: entries.map((e) => ({
        id: e.id,
        variant_id: e.variant_id,
        delta: e.delta,
        type: e.type,
        reference_id: e.reference_id,
        reason: e.reason,
        created_at: e.created_at.toISOString(),
      })),
>>>>>>> origin/main
    };
  }
);
