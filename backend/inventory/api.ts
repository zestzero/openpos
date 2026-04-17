import { api } from "encore.dev/api";
import { getDataSource } from "./datasource";
import { InventoryLedger, InventorySnapshot } from "./entities";
import { requireRole } from "../auth/middleware";
import { ILike } from "typeorm";
import { Variant } from "../catalog/entities";

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
    };
  }
);
