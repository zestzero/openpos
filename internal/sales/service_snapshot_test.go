package sales

import (
	"context"
	"testing"

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
