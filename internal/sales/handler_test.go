package sales

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/zestzero/openpos/db/sqlc"
)

func TestHandler(t *testing.T) {
	t.Setenv("STORE_NAME", "Test Store")

	t.Run("cash payment returns receipt snapshot with change due", func(t *testing.T) {
		orderID := uuidPtr("11111111-1111-1111-1111-111111111111")
		queries := &fakeOrderStore{
			ordersByID: map[string]sqlc.Order{orderID.String(): {ID: orderID, TotalAmount: 1200}},
			itemsByOrderID: map[string][]sqlc.ListOrderItemsByOrderIDRow{
				orderID.String(): {{ID: uuidPtr("55555555-5555-5555-5555-555555555555"), OrderID: orderID, VariantID: uuidPtr("33333333-3333-3333-3333-333333333333"), Quantity: 1, UnitPrice: 1200, Subtotal: 1200}},
			},
			variantsByID: map[string]sqlc.Variant{
				"33333333-3333-3333-3333-333333333333": {ID: uuidPtr("33333333-3333-3333-3333-333333333333"), Name: "Tea"},
			},
		}
		h := NewHandler(NewService(queries, newFakeInventory(map[string]int64{"33333333-3333-3333-3333-333333333333": 10})))

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodPost, "/"+orderID.String()+"/payments", strings.NewReader(`{"method":"cash","tendered_amount":1500}`))
		h.Routes().ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
		var envelope struct {
			Data struct {
				StoreName      string `json:"store_name"`
				OrderID        string `json:"order_id"`
				PaymentMethod  string `json:"payment_method"`
				TenderedAmount int64  `json:"tendered_amount"`
				ChangeDue      int64  `json:"change_due"`
			} `json:"data"`
		}
		if err := json.Unmarshal(rec.Body.Bytes(), &envelope); err != nil {
			t.Fatalf("invalid response JSON: %v", err)
		}
		if envelope.Data.StoreName != "Test Store" || envelope.Data.ChangeDue != 300 || envelope.Data.PaymentMethod != "cash" {
			t.Fatalf("unexpected receipt payload: %+v", envelope.Data)
		}
	})

	t.Run("promptpay rejects tendered amounts that do not match the total", func(t *testing.T) {
		orderID := uuidPtr("11111111-1111-1111-1111-111111111111")
		queries := &fakeOrderStore{ordersByID: map[string]sqlc.Order{orderID.String(): {ID: orderID, TotalAmount: 1200}}}
		h := NewHandler(NewService(queries, newFakeInventory(nil)))

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodPost, "/"+orderID.String()+"/payments", strings.NewReader(`{"method":"promptpay","tendered_amount":1000}`))
		h.Routes().ServeHTTP(rec, req)

		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
		if !strings.Contains(rec.Body.String(), ErrInvalidOrder.Error()) {
			t.Fatalf("expected invalid order error, got %q", rec.Body.String())
		}
	})

	t.Run("receipt fetch wraps data and missing orders map to not found", func(t *testing.T) {
		orderID := uuidPtr("11111111-1111-1111-1111-111111111111")
		missingOrderID := uuidPtr("22222222-2222-2222-2222-222222222222")
		queries := &fakeOrderStore{
			ordersByID: map[string]sqlc.Order{orderID.String(): {ID: orderID, TotalAmount: 1200}},
			itemsByOrderID: map[string][]sqlc.ListOrderItemsByOrderIDRow{
				orderID.String(): {{ID: uuidPtr("55555555-5555-5555-5555-555555555555"), OrderID: orderID, VariantID: uuidPtr("33333333-3333-3333-3333-333333333333"), Quantity: 1, UnitPrice: 1200, Subtotal: 1200}},
			},
			variantsByID: map[string]sqlc.Variant{
				"33333333-3333-3333-3333-333333333333": {ID: uuidPtr("33333333-3333-3333-3333-333333333333"), Name: "Tea"},
			},
			paymentByOrderID: map[string]sqlc.Payment{orderID.String(): {ID: uuidPtr("66666666-6666-6666-6666-666666666666"), OrderID: orderID, Method: "cash", TenderedAmount: 1500, ChangeDue: 300, PaidAt: timestamptzNow()}},
		}
		h := NewHandler(NewService(queries, newFakeInventory(nil)))

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, "/"+orderID.String()+"/receipt", nil)
		h.Routes().ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
		var envelope struct {
			Data struct {
				StoreName     string `json:"store_name"`
				OrderID       string `json:"order_id"`
				PaymentMethod string `json:"payment_method"`
				ChangeDue     int64  `json:"change_due"`
			} `json:"data"`
		}
		if err := json.Unmarshal(rec.Body.Bytes(), &envelope); err != nil {
			t.Fatalf("invalid response JSON: %v", err)
		}
		if envelope.Data.StoreName != "Test Store" || envelope.Data.OrderID != orderID.String() || envelope.Data.ChangeDue != 300 {
			t.Fatalf("unexpected receipt envelope: %+v", envelope.Data)
		}

		empty := httptest.NewRecorder()
		missingReq := httptest.NewRequest(http.MethodGet, "/"+missingOrderID.String()+"/receipt", nil)
		h.Routes().ServeHTTP(empty, missingReq)
		if empty.Code != http.StatusNotFound {
			t.Fatalf("expected 404 for missing order, got %d", empty.Code)
		}
	})
}
