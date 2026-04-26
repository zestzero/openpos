package reporting

import (
	"encoding/json"
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/zestzero/openpos/db/sqlc"
)

func TestServiceMonthlySales(t *testing.T) {
	t.Parallel()

	queries := &fakeReportingQueries{
		monthlySales: []sqlc.MonthlySalesReport{{Month: "2026-04", OrderCount: 2, TotalRevenue: 3500, AverageOrderValue: 1750}},
	}
	service := NewService(queries)

	rows, err := service.MonthlySales(context.Background())
	if err != nil {
		t.Fatalf("MonthlySales returned error: %v", err)
	}
	if len(rows) != 1 {
		t.Fatalf("expected 1 monthly sales row, got %d", len(rows))
	}
	if rows[0].Month != "2026-04" || rows[0].TotalRevenue != 3500 {
		t.Fatalf("unexpected monthly sales row: %+v", rows[0])
	}
}

func TestServiceGrossProfit(t *testing.T) {
	t.Parallel()

	queries := &fakeReportingQueries{
		grossProfit: []sqlc.GrossProfitReport{{Month: "2026-04", OrderCount: 2, Revenue: 3500, CostOfGoodsSold: 2100, GrossProfit: 1400}},
	}
	service := NewService(queries)

	rows, err := service.GrossProfit(context.Background())
	if err != nil {
		t.Fatalf("GrossProfit returned error: %v", err)
	}
	if len(rows) != 1 {
		t.Fatalf("expected 1 gross profit row, got %d", len(rows))
	}
	if rows[0].GrossProfit != 1400 || rows[0].CostOfGoodsSold != 2100 {
		t.Fatalf("unexpected gross profit row: %+v", rows[0])
	}
}

func TestServicePropagatesQueryErrors(t *testing.T) {
	t.Parallel()

	queries := &fakeReportingQueries{monthlySalesErr: errors.New("boom")}
	service := NewService(queries)

	if _, err := service.MonthlySales(context.Background()); err == nil {
		t.Fatal("expected error from MonthlySales")
	}
}

func TestHandlerRoutes(t *testing.T) {
	t.Parallel()

	handler := NewHandler(&fakeReportingService{
		monthlySales: []sqlc.MonthlySalesReport{{Month: "2026-04", OrderCount: 2, TotalRevenue: 3500, AverageOrderValue: 1750}},
		grossProfit:  []sqlc.GrossProfitReport{{Month: "2026-04", OrderCount: 2, Revenue: 3500, CostOfGoodsSold: 2100, GrossProfit: 1400}},
	})

	router := handler.Routes()

	t.Run("monthly sales endpoint returns wrapped data", func(t *testing.T) {
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, "/monthly-sales", nil)

		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
		var payload struct {
			Data []sqlc.MonthlySalesReport `json:"data"`
		}
		if err := json.NewDecoder(rec.Body).Decode(&payload); err != nil {
			t.Fatalf("decode response: %v", err)
		}
		if len(payload.Data) != 1 || payload.Data[0].TotalRevenue != 3500 {
			t.Fatalf("unexpected payload: %+v", payload)
		}
	})

	t.Run("gross profit endpoint returns wrapped data", func(t *testing.T) {
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, "/gross-profit", nil)

		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
		var payload struct {
			Data []sqlc.GrossProfitReport `json:"data"`
		}
		if err := json.NewDecoder(rec.Body).Decode(&payload); err != nil {
			t.Fatalf("decode response: %v", err)
		}
		if len(payload.Data) != 1 || payload.Data[0].GrossProfit != 1400 {
			t.Fatalf("unexpected payload: %+v", payload)
		}
	})
}

type fakeReportingQueries struct {
	monthlySales    []sqlc.MonthlySalesReport
	monthlySalesErr error
	grossProfit     []sqlc.GrossProfitReport
	grossProfitErr  error
}

func (f *fakeReportingQueries) ListMonthlySales(context.Context) ([]sqlc.MonthlySalesReport, error) {
	if f.monthlySalesErr != nil {
		return nil, f.monthlySalesErr
	}
	return f.monthlySales, nil
}

func (f *fakeReportingQueries) ListGrossProfit(context.Context) ([]sqlc.GrossProfitReport, error) {
	if f.grossProfitErr != nil {
		return nil, f.grossProfitErr
	}
	return f.grossProfit, nil
}

type fakeReportingService struct {
	monthlySales []sqlc.MonthlySalesReport
	grossProfit  []sqlc.GrossProfitReport
}

func (f *fakeReportingService) MonthlySales(context.Context) ([]sqlc.MonthlySalesReport, error) {
	return f.monthlySales, nil
}

func (f *fakeReportingService) GrossProfit(context.Context) ([]sqlc.GrossProfitReport, error) {
	return f.grossProfit, nil
}
