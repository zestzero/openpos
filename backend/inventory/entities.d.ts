import "reflect-metadata";
export declare class InventoryLedger {
    id: string;
    variant_id: string;
    delta: number;
    type: "sale" | "restock" | "adjustment" | "sync";
    reference_id: string | null;
    reason: string | null;
    client_generated_id: string | null;
    created_at: Date;
}
export declare class InventorySnapshot {
    id: string;
    variant_id: string;
    balance: number;
    snapshot_at: Date;
}
