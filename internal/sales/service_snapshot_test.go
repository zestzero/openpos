package sales

import (
	"context"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgtype"

	"github.com/zestzero/openpos/db/sqlc"
)

func TestCreateOrderPreservesSaleTimeCostSnapshot(t *testing.T) {
	created := sqlc.Order{ID: uuidPtr("11111111-1111-1111-1111-111111111111"), ClientUuid: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", UserID: uuidPtr("22222222-2222-2222-2222-222222222222"), Status: "completed", TotalAmount: 1500}
	queries := &fakeOrderStore{
		ordersByClientUUID: map[string]sqlc.Order{},
		ordersByID:         map[string]sqlc.Order{"11111111-1111-1111-1111-111111111111": created},
		variantsByID: map[string]sqlc.Variant{
			"33333333-3333-3333-3333-333333333333": {ID: uuidPtr("33333333-3333-3333-3333-333333333333"), Cost: int8Ptr(1200)},
		},
		createOrderResult: created,
	}
	svc := NewService(queries, newFakeInventory(map[string]int64{"33333333-3333-3333-3333-333333333333": 10}))

	_, err := svc.CreateOrder(context.Background(), CreateOrderInput{
		ClientUUID: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
		UserID:     "22222222-2222-2222-2222-222222222222",
		Items:      []OrderItemInput{{VariantID: "33333333-3333-3333-3333-333333333333", Quantity: 1, UnitPrice: 1500}},
	})
	if err != nil {
		t.Fatalf("CreateOrder returned error: %v", err)
	}

	queries.variantsByID["33333333-3333-3333-3333-333333333333"] = sqlc.Variant{ID: uuidPtr("33333333-3333-3333-3333-333333333333"), Cost: int8Ptr(2200)}

	items := queries.itemsByOrderID[created.ID.String()]
	if len(items) != 1 {
		t.Fatalf("expected one stored order item, got %d", len(items))
	}
	if !items[0].CostAtSale.Valid || items[0].CostAtSale.Int64 != 1200 {
		t.Fatalf("expected stored cost_at_sale to remain 1200, got %+v", items[0].CostAtSale)
	}
	if items[0].OrderID == (pgtype.UUID{}) {
		t.Fatalf("expected stored order item to be populated")
	}
}

func TestCompletePaymentReusesPersistedReceiptSnapshot(t *testing.T) {
	paidAt := pgtype.Timestamptz{Time: time.Date(2026, 5, 2, 12, 15, 0, 0, time.UTC), Valid: true}
	orderID := uuidPtr("11111111-1111-1111-1111-111111111111")
	queries := &fakeOrderStore{
		ordersByID: map[string]sqlc.Order{
			orderID.String(): {ID: orderID, ClientUuid: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", UserID: uuidPtr("22222222-2222-2222-2222-222222222222"), Status: "completed", TotalAmount: 1200},
		},
		itemsByOrderID: map[string][]sqlc.ListOrderItemsByOrderIDRow{
			orderID.String(): {{ID: uuidPtr("55555555-5555-5555-5555-555555555555"), OrderID: orderID, VariantID: uuidPtr("33333333-3333-3333-3333-333333333333"), Quantity: 1, UnitPrice: 1200, Subtotal: 1200}},
		},
		variantsByID: map[string]sqlc.Variant{
			"33333333-3333-3333-3333-333333333333": {ID: uuidPtr("33333333-3333-3333-3333-333333333333"), Name: "Tea"},
		},
		createPaymentResult: sqlc.Payment{ID: uuidPtr("66666666-6666-6666-6666-666666666666"), PaidAt: paidAt},
	}
	svc := NewService(queries, newFakeInventory(map[string]int64{"33333333-3333-3333-3333-333333333333": 10}))

	first, err := svc.CompletePayment(context.Background(), CompletePaymentInput{
		OrderID:        orderID.String(),
		Method:         "cash",
		TenderedAmount: 1500,
		StoreName:      "Test Store",
	})
	if err != nil {
		t.Fatalf("CompletePayment returned error: %v", err)
	}
	second, err := svc.CompletePayment(context.Background(), CompletePaymentInput{
		OrderID:        orderID.String(),
		Method:         "promptpay",
		TenderedAmount: 1200,
		StoreName:      "Another Store",
	})
	if err != nil {
		t.Fatalf("CompletePayment returned error on repeat call: %v", err)
	}
	receipt, err := svc.GetReceipt(context.Background(), orderID.String(), "Receipt Store")
	if err != nil {
		t.Fatalf("GetReceipt returned error: %v", err)
	}

	if queries.createPaymentCalls != 1 {
		t.Fatalf("expected one payment insert, got %d", queries.createPaymentCalls)
	}
	if first.PaymentMethod != "cash" || first.TenderedAmount != 1500 || first.ChangeDue != 300 {
		t.Fatalf("unexpected first receipt snapshot: %+v", first)
	}
	if second.PaymentMethod != "cash" || second.TenderedAmount != 1500 || second.ChangeDue != 300 {
		t.Fatalf("expected repeat payment to reuse persisted snapshot, got %+v", second)
	}
	if receipt.PaymentMethod != "cash" || receipt.TenderedAmount != 1500 || receipt.ChangeDue != 300 {
		t.Fatalf("unexpected receipt snapshot: %+v", receipt)
	}
	if first.PaidAt != receipt.PaidAt || second.PaidAt != receipt.PaidAt {
		t.Fatalf("expected paid_at to stay stable across reads: first=%q second=%q receipt=%q", first.PaidAt, second.PaidAt, receipt.PaidAt)
	}
	if first.PaidAt != "2026-05-02T12:15:00Z" {
		t.Fatalf("unexpected paid_at: %q", first.PaidAt)
	}
}
