import "reflect-metadata";
export declare class Order {
    id: string;
    cashier_id: string;
    total_cents: number;
    status: string;
    client_created_at: Date | null;
    payment_method: "cash" | "qr" | null;
    tendered_cents: number | null;
    change_cents: number | null;
    receipt_printed: boolean;
    created_at: Date;
    updated_at: Date;
    items: OrderItem[];
}
export declare class OrderItem {
    id: string;
    order_id: string;
    variant_id: string;
    quantity: number;
    price_cents: number;
    line_total_cents: number;
    created_at: Date;
    order: Order;
}
