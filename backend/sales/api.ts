import { api } from "encore.dev/api";
import { getDataSource } from "./datasource";
import { Order, OrderItem } from "./entities";
import { getAuthData } from "~encore/auth";
import { inventory } from "~encore/clients";

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

export const createOrder = api(
  { expose: true, method: "POST", path: "/sales/orders", auth: true },
    async (req: CreateOrderRequest): Promise<OrderResponse> => {
    const auth = getAuthData()!;
    const ds = await getDataSource();

    // Idempotency: check if order already exists (client-generated UUID)
    const orderRepo = ds.getRepository(Order);
    const existing = await orderRepo.findOne({
      where: { id: req.order_id },
      relations: ["items"],
    });

    if (existing) {
      return {
        id: existing.id,
        cashier_id: existing.cashier_id,
        total_cents: existing.total_cents,
        status: existing.status,
        item_count: existing.items?.length || 0,
        created_at: existing.created_at.toISOString(),
      };
    }

    // Create order with items in a transaction
    const result = await ds.transaction(async (manager) => {
      const order = manager.create(Order, {
        id: req.order_id,
        cashier_id: auth.userID,
        total_cents: req.total_cents,
        status: "completed",
        client_created_at: req.created_at ? new Date(req.created_at) : null,
      });
      const savedOrder = await manager.save(order);

      const items = req.items.map((item) =>
        manager.create(OrderItem, {
          order_id: savedOrder.id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          price_cents: item.price_cents,
          line_total_cents: item.price_cents * item.quantity,
        })
      );
      await manager.save(items);

      return { order: savedOrder, items };
    });

    // Stock deduction: create inventory ledger entries for each line item
    // Uses delta (negative) — OFF-04 compliance
    // Each ledger entry uses client_generated_id for idempotency
    for (const item of req.items) {
      await inventory.createLedgerEntry({
        variant_id: item.variant_id,
        delta: -item.quantity,
        type: "sale",
        reference_id: req.order_id,
        client_generated_id: `${req.order_id}:${item.variant_id}`,
      });
    }

    return {
      id: result.order.id,
      cashier_id: result.order.cashier_id,
      total_cents: result.order.total_cents,
      status: result.order.status,
      item_count: result.items.length,
      created_at: result.order.created_at.toISOString(),
    };
  }
);

interface ListOrdersResponse {
  orders: OrderResponse[];
}

export const listOrders = api(
  { expose: true, method: "GET", path: "/sales/orders", auth: true },
  async (): Promise<ListOrdersResponse> => {
    const auth = getAuthData()!;
    const ds = await getDataSource();
    const repo = ds.getRepository(Order);

    const orders = await repo.find({
      where: { cashier_id: auth.userID },
      order: { created_at: "DESC" },
      take: 50,
      relations: ["items"],
    });

    return {
      orders: orders.map((o) => ({
        id: o.id,
        cashier_id: o.cashier_id,
        total_cents: o.total_cents,
        status: o.status,
        item_count: o.items?.length || 0,
        created_at: o.created_at.toISOString(),
      })),
    };
  }
);
