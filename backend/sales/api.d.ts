interface CreateOrderItem {
    variant_id: string;
    quantity: number;
    price_cents: number;
}
interface CreateOrderRequest {
    order_id: string;
    items: CreateOrderItem[];
    total_cents: number;
    created_at?: number;
}
interface OrderResponse {
    id: string;
    cashier_id: string;
    total_cents: number;
    status: string;
    item_count: number;
    created_at: string;
}
export declare const createOrder: (params: CreateOrderRequest) => Promise<OrderResponse>;
interface ListOrdersResponse {
    orders: OrderResponse[];
}
export declare const listOrders: () => Promise<ListOrdersResponse>;
export {};
