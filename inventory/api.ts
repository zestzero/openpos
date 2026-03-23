import { api } from "encore.dev/api";
import { getDataSource } from "./datasource";
import { InventoryLedger, InventorySnapshot } from "./entities";

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
  { expose: true, method: "POST", path: "/inventory/ledger", auth: false },
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
  { expose: true, method: "POST", path: "/inventory/adjustment", auth: false },
  async (req: AdjustmentRequest): Promise<LedgerResponse> => {
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
  { expose: true, method: "GET", path: "/inventory/variants/:id/stock", auth: false },
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
