package reporting

import (
	"context"
	"fmt"

	"github.com/zestzero/openpos/db/sqlc"
)

type reportingStore interface {
	ListMonthlySales(context.Context) ([]sqlc.MonthlySalesReport, error)
	ListGrossProfit(context.Context) ([]sqlc.GrossProfitReport, error)
}

type Service struct {
	queries reportingStore
}

func NewService(queries reportingStore) *Service {
	return &Service{queries: queries}
}

// MonthlySales returns the monthly-sales read model.
func (s *Service) MonthlySales(ctx context.Context) ([]sqlc.MonthlySalesReport, error) {
	rows, err := s.queries.ListMonthlySales(ctx)
	if err != nil {
		return nil, fmt.Errorf("listing monthly-sales report: %w", err)
	}
	return rows, nil
}

// GrossProfit returns gross-profit using the sale-time cost_at_sale snapshot.
func (s *Service) GrossProfit(ctx context.Context) ([]sqlc.GrossProfitReport, error) {
	rows, err := s.queries.ListGrossProfit(ctx)
	if err != nil {
		return nil, fmt.Errorf("listing gross-profit report: %w", err)
	}
	return rows, nil
}
