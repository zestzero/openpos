package sales

import (
	"context"
	"errors"
	"testing"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/zestzero/openpos/db/sqlc"
	"github.com/zestzero/openpos/internal/inventory"
)

func TestCreateOrder(t *testing.T) {
	t.Run("creates order and deducts stock per line item", func(t *testing.T) {
		created := sqlc.Order{ID: uuidPtr("11111111-1111-1111-1111-111111111111"), ClientUuid: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", UserID: uuidPtr("22222222-2222-2222-2222-222222222222"), Status: "completed", TotalAmount: 3500}
		queries := &fakeOrderStore{
			ordersByClientUUID: map[string]sqlc.Order{},
			ordersByID:         map[string]sqlc.Order{"11111111-1111-1111-1111-111111111111": created},
			createOrderResult:  created,
		}
		inv := newFakeInventory(map[string]int64{
			"33333333-3333-3333-3333-333333333333": 10,
			"44444444-4444-4444-4444-444444444444": 4,
		})
		svc := NewService(queries, inv)

		order, err := svc.CreateOrder(context.Background(), CreateOrderInput{
			ClientUUID: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
			UserID:     "22222222-2222-2222-2222-222222222222",
			Items: []OrderItemInput{
				{VariantID: "33333333-3333-3333-3333-333333333333", Quantity: 2, UnitPrice: 1500},
				{VariantID: "44444444-4444-4444-4444-444444444444", Quantity: 1, UnitPrice: 500},
			},
		})

		if err != nil {
			t.Fatalf("CreateOrder returned error: %v", err)
		}
		if order.TotalAmount != 3500 {
			t.Fatalf("expected total amount 3500, got %d", order.TotalAmount)
		}
		if !order.Created {
			t.Fatalf("expected new order to be marked created")
		}
		if queries.createOrderCalls != 1 || queries.createItemCalls != 2 {
			t.Fatalf("expected 1 order and 2 item inserts, got %d/%d", queries.createOrderCalls, queries.createItemCalls)
		}
		if len(inv.deductCalls) != 2 {
			t.Fatalf("expected 2 inventory deductions, got %d", len(inv.deductCalls))
		}
	})

	t.Run("returns existing order when client uuid already exists", func(t *testing.T) {
		existing := sqlc.Order{ID: uuidPtr("11111111-1111-1111-1111-111111111111"), ClientUuid: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", UserID: uuidPtr("22222222-2222-2222-2222-222222222222"), Status: "completed", TotalAmount: 1200}
		queries := &fakeOrderStore{
			ordersByClientUUID: map[string]sqlc.Order{"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa": existing},
			ordersByID:         map[string]sqlc.Order{"11111111-1111-1111-1111-111111111111": existing},
			itemsByOrderID: map[string][]sqlc.OrderItem{
				"11111111-1111-1111-1111-111111111111": {{ID: uuidPtr("55555555-5555-5555-5555-555555555555"), OrderID: uuidPtr("11111111-1111-1111-1111-111111111111"), VariantID: uuidPtr("33333333-3333-3333-3333-333333333333"), Quantity: 1, UnitPrice: 1200, Subtotal: 1200}},
			},
		}
		inv := newFakeInventory(map[string]int64{"33333333-3333-3333-3333-333333333333": 10})
		svc := NewService(queries, inv)

		order, err := svc.CreateOrder(context.Background(), CreateOrderInput{
			ClientUUID: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
			UserID:     "22222222-2222-2222-2222-222222222222",
			Items: []OrderItemInput{{VariantID: "33333333-3333-3333-3333-333333333333", Quantity: 1, UnitPrice: 1200}},
		})
		if err != nil {
			t.Fatalf("CreateOrder returned error: %v", err)
		}
		if order.Created {
			t.Fatalf("expected duplicate order to be marked not created")
		}
		if queries.createOrderCalls != 0 || queries.createItemCalls != 0 {
			t.Fatalf("expected no inserts for duplicate order")
		}
		if len(inv.deductCalls) != 0 {
			t.Fatalf("expected no inventory deductions for duplicate order")
		}
	})

	t.Run("rejects insufficient stock before writes", func(t *testing.T) {
		queries := &fakeOrderStore{ordersByClientUUID: map[string]sqlc.Order{}}
		inv := newFakeInventory(map[string]int64{"33333333-3333-3333-3333-333333333333": 1})
		svc := NewService(queries, inv)

		_, err := svc.CreateOrder(context.Background(), CreateOrderInput{
			ClientUUID: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
			UserID:     "22222222-2222-2222-2222-222222222222",
			Items: []OrderItemInput{{VariantID: "33333333-3333-3333-3333-333333333333", Quantity: 2, UnitPrice: 100}},
		})
		if !errors.Is(err, ErrInsufficientStock) {
			t.Fatalf("expected ErrInsufficientStock, got %v", err)
		}
		if queries.createOrderCalls != 0 || queries.createItemCalls != 0 {
			t.Fatalf("expected no DB writes when stock is insufficient")
		}
		if len(inv.deductCalls) != 0 {
			t.Fatalf("expected no stock deductions when stock is insufficient")
		}
	})
}

func TestSyncOrdersProcessesSequentially(t *testing.T) {
	queries := &fakeOrderStore{ordersByClientUUID: map[string]sqlc.Order{}}
	inv := newFakeInventory(map[string]int64{"33333333-3333-3333-3333-333333333333": 10, "44444444-4444-4444-4444-444444444444": 0})
	svc := NewService(queries, inv)

	result, err := svc.SyncOrders(context.Background(), []CreateOrderInput{
		{ClientUUID: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", UserID: "22222222-2222-2222-2222-222222222222", Items: []OrderItemInput{{VariantID: "33333333-3333-3333-3333-333333333333", Quantity: 1, UnitPrice: 100}}},
		{ClientUUID: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", UserID: "22222222-2222-2222-2222-222222222222", Items: []OrderItemInput{{VariantID: "44444444-4444-4444-4444-444444444444", Quantity: 1, UnitPrice: 100}}},
	})
	if err != nil {
		t.Fatalf("SyncOrders returned error: %v", err)
	}
	if result.Processed != 2 || result.Succeeded != 1 || result.Failed != 1 {
		t.Fatalf("unexpected sync result: %+v", result)
	}
	if len(result.Errors) != 1 || result.Errors[0].ClientUUID != "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb" {
		t.Fatalf("expected one per-order error for client-2, got %+v", result.Errors)
	}
	if len(inv.deductCalls) != 1 {
		t.Fatalf("expected sequential processing to stop deductions for failed order, got %d", len(inv.deductCalls))
	}
}

func TestGetOrder(t *testing.T) {
	order := sqlc.Order{ID: uuidPtr("11111111-1111-1111-1111-111111111111"), ClientUuid: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", UserID: uuidPtr("22222222-2222-2222-2222-222222222222"), Status: "completed", TotalAmount: 500}
	queries := &fakeOrderStore{
		ordersByID: map[string]sqlc.Order{"11111111-1111-1111-1111-111111111111": order},
		itemsByOrderID: map[string][]sqlc.OrderItem{
			"11111111-1111-1111-1111-111111111111": {{ID: uuidPtr("55555555-5555-5555-5555-555555555555"), OrderID: uuidPtr("11111111-1111-1111-1111-111111111111"), VariantID: uuidPtr("33333333-3333-3333-3333-333333333333"), Quantity: 1, UnitPrice: 500, Subtotal: 500}},
		},
	}
	inv := newFakeInventory(nil)
	svc := NewService(queries, inv)

	got, err := svc.GetOrder(context.Background(), "11111111-1111-1111-1111-111111111111")
	if err != nil {
		t.Fatalf("GetOrder returned error: %v", err)
	}
	if got.ID != "11111111-1111-1111-1111-111111111111" || len(got.Items) != 1 {
		t.Fatalf("unexpected order: %+v", got)
	}
}

type fakeOrderStore struct {
	ordersByClientUUID map[string]sqlc.Order
	ordersByID         map[string]sqlc.Order
	itemsByOrderID     map[string][]sqlc.OrderItem
	createOrderCalls   int
	createItemCalls    int
	createOrderResult  sqlc.Order
	createItemResult   sqlc.OrderItem
}

func (f *fakeOrderStore) CreateOrder(_ context.Context, _ sqlc.CreateOrderParams) (sqlc.Order, error) {
	f.createOrderCalls++
	if f.ordersByID == nil {
		f.ordersByID = map[string]sqlc.Order{}
	}
	if f.createOrderResult.ID.Valid {
		f.ordersByID[f.createOrderResult.ID.String()] = f.createOrderResult
	}
	return f.createOrderResult, nil
}

func (f *fakeOrderStore) CreateOrderItem(_ context.Context, arg sqlc.CreateOrderItemParams) (sqlc.OrderItem, error) {
	f.createItemCalls++
	item := f.createItemResult
	if !item.ID.Valid {
		item = sqlc.OrderItem{ID: uuidPtr("55555555-5555-5555-5555-555555555555")}
	}
	item.OrderID = arg.OrderID
	item.VariantID = arg.VariantID
	item.Quantity = arg.Quantity
	item.UnitPrice = arg.UnitPrice
	item.Subtotal = arg.Subtotal
	if f.itemsByOrderID == nil {
		f.itemsByOrderID = map[string][]sqlc.OrderItem{}
	}
	f.itemsByOrderID[arg.OrderID.String()] = append(f.itemsByOrderID[arg.OrderID.String()], item)
	return item, nil
}

func (f *fakeOrderStore) GetOrderByClientUUID(_ context.Context, clientUUID string) (sqlc.Order, error) {
	if order, ok := f.ordersByClientUUID[clientUUID]; ok {
		return order, nil
	}
	return sqlc.Order{}, pgx.ErrNoRows
}

func (f *fakeOrderStore) GetOrderByID(_ context.Context, id pgtype.UUID) (sqlc.Order, error) {
	if order, ok := f.ordersByID[id.String()]; ok {
		return order, nil
	}
	return sqlc.Order{}, pgx.ErrNoRows
}

func (f *fakeOrderStore) ListOrderItemsByOrderID(_ context.Context, id pgtype.UUID) ([]sqlc.OrderItem, error) {
	if items, ok := f.itemsByOrderID[id.String()]; ok {
		return items, nil
	}
	return []sqlc.OrderItem{}, nil
}

func (f *fakeOrderStore) ListOrders(_ context.Context, _ sqlc.ListOrdersParams) ([]sqlc.Order, error) {
	return nil, nil
}

type fakeInventory struct {
	stock       map[string]int64
	deductCalls []string
}

func newFakeInventory(stock map[string]int64) *fakeInventory {
	if stock == nil {
		stock = map[string]int64{}
	}
	return &fakeInventory{stock: stock}
}

func (f *fakeInventory) GetStockLevel(_ context.Context, variantID string) (inventory.StockLevel, error) {
	return inventory.StockLevel{VariantID: variantID, StockLevel: f.stock[variantID]}, nil
}

func (f *fakeInventory) DeductStock(_ context.Context, variantID string, quantity int64, referenceID string) (inventory.LedgerEntry, error) {
	f.deductCalls = append(f.deductCalls, variantID+":"+referenceID)
	if f.stock[variantID] < quantity {
		return inventory.LedgerEntry{}, inventory.ErrNegativeStock
	}
	f.stock[variantID] -= quantity
	return inventory.LedgerEntry{}, nil
}

func uuidPtr(value string) pgtype.UUID {
	var id pgtype.UUID
	_ = id.Scan(value)
	return id
}
