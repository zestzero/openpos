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
export declare const createLedgerEntry: (params: LedgerRequest) => Promise<LedgerResponse>;
interface AdjustmentRequest {
    variant_id: string;
    delta: number;
    reason: string;
}
export declare const adjustStock: (params: AdjustmentRequest) => Promise<LedgerResponse>;
interface StockResponse {
    variant_id: string;
    balance: number;
    snapshot_at: string | null;
}
export declare const getStock: (params: {
    id: string;
}) => Promise<StockResponse>;
export {};
