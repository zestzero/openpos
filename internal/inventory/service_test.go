package inventory

import (
	"context"
	"errors"
	"fmt"
	"reflect"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/zestzero/openpos/db/sqlc"
)

func TestAdjustStock(t *testing.T) {
	t.Run("rejects invalid adjustments", func(t *testing.T) {
		svc := newTestService(10)

		if _, err := svc.AdjustStock(context.Background(), AdjustStockInput{VariantID: testVariantID, Quantity: 1, Reason: "BROKEN"}); !errors.Is(err, ErrInvalidReason) {
			t.Fatalf("expected ErrInvalidReason, got %v", err)
		}
		if _, err := svc.AdjustStock(context.Background(), AdjustStockInput{VariantID: testVariantID, Quantity: 0, Reason: ReasonAdjustment}); !errors.Is(err, ErrInvalidQuantity) {
			t.Fatalf("expected ErrInvalidQuantity, got %v", err)
		}
	})

	t.Run("rejects unsafe decreases before writing a ledger entry", func(t *testing.T) {
		queries := newFakeInventoryQueries(2)
		svc := &Service{db: sqlc.New(queries)}

		_, err := svc.AdjustStock(context.Background(), AdjustStockInput{VariantID: testVariantID, Quantity: -3, Reason: ReasonAdjustment})
		if !errors.Is(err, ErrNegativeStock) {
			t.Fatalf("expected ErrNegativeStock, got %v", err)
		}
		if queries.createLedgerCalls != 0 {
			t.Fatalf("expected no ledger insert on rejected decrease, got %d", queries.createLedgerCalls)
		}
	})

	t.Run("records adjustments and keeps stock ledger-derived", func(t *testing.T) {
		queries := newFakeInventoryQueries(5)
		svc := &Service{db: sqlc.New(queries)}

		entry, err := svc.AdjustStock(context.Background(), AdjustStockInput{VariantID: testVariantID, Quantity: 3, Reason: ReasonAdjustment})
		if err != nil {
			t.Fatalf("AdjustStock returned error: %v", err)
		}
		if entry.QuantityChange != 3 || entry.Reason != ReasonAdjustment {
			t.Fatalf("unexpected adjustment entry: %+v", entry)
		}

		stock, err := svc.GetStockLevel(context.Background(), testVariantID)
		if err != nil {
			t.Fatalf("GetStockLevel returned error: %v", err)
		}
		if stock.StockLevel != 8 {
			t.Fatalf("expected ledger-derived stock 8, got %+v", stock)
		}

		entry, err = svc.AdjustStock(context.Background(), AdjustStockInput{VariantID: testVariantID, Quantity: -2, Reason: ReasonAdjustment})
		if err != nil {
			t.Fatalf("AdjustStock returned error on decrease: %v", err)
		}
		if entry.QuantityChange != -2 {
			t.Fatalf("unexpected decrease entry: %+v", entry)
		}

		stock, err = svc.GetStockLevel(context.Background(), testVariantID)
		if err != nil {
			t.Fatalf("GetStockLevel returned error after decrease: %v", err)
		}
		if stock.StockLevel != 6 {
			t.Fatalf("expected ledger-derived stock 6, got %+v", stock)
		}
		if queries.createLedgerCalls != 2 {
			t.Fatalf("expected two ledger inserts, got %d", queries.createLedgerCalls)
		}
	})
}

const testVariantID = "33333333-3333-3333-3333-333333333333"

func newTestService(stock int64) *Service {
	return &Service{db: sqlc.New(newFakeInventoryQueries(stock))}
}

type fakeInventoryQueries struct {
	variantExists      bool
	stockLevel         int64
	getVariantCalls    int
	getStockLevelCalls int
	createLedgerCalls  int
}

func newFakeInventoryQueries(stock int64) *fakeInventoryQueries {
	return &fakeInventoryQueries{variantExists: true, stockLevel: stock}
}

func (f *fakeInventoryQueries) Exec(context.Context, string, ...interface{}) (pgconn.CommandTag, error) {
	return pgconn.CommandTag{}, nil
}

func (f *fakeInventoryQueries) Query(context.Context, string, ...interface{}) (pgx.Rows, error) {
	return nil, nil
}

func (f *fakeInventoryQueries) QueryRow(_ context.Context, query string, args ...interface{}) pgx.Row {
	switch {
	case strings.Contains(query, "FROM variants") && strings.Contains(query, "WHERE id = $1"):
		f.getVariantCalls++
		if !f.variantExists {
			return fakeRow{err: pgx.ErrNoRows}
		}
		variantID := args[0].(pgtype.UUID)
		return fakeRow{values: []any{
			variantID,
			pgtype.UUID{},
			"SKU-1",
			pgtype.Text{},
			"Tea",
			int64(1200),
			pgtype.Int8{},
			pgtype.Bool{Bool: true, Valid: true},
			pgtype.Timestamptz{},
			pgtype.Timestamptz{},
		}}
	case strings.Contains(query, "COALESCE(SUM(quantity_change), 0)") && strings.Contains(query, "stock_level"):
		f.getStockLevelCalls++
		return fakeRow{values: []any{f.stockLevel}}
	case strings.Contains(query, "INSERT INTO inventory_ledger"):
		f.createLedgerCalls++
		variantID := args[0].(pgtype.UUID)
		quantityChange := args[1].(int64)
		reason := args[2].(string)
		referenceID := args[3].(pgtype.UUID)
		createdBy := args[4].(pgtype.UUID)
		f.stockLevel += quantityChange
		return fakeRow{values: []any{
			uuidPtr("66666666-6666-6666-6666-666666666666"),
			variantID,
			quantityChange,
			reason,
			referenceID,
			pgtype.Timestamptz{},
			createdBy,
		}}
	default:
		return fakeRow{err: pgx.ErrNoRows}
	}
}

type fakeRow struct {
	values []any
	err    error
}

func (r fakeRow) Scan(dest ...interface{}) error {
	if r.err != nil {
		return r.err
	}
	if len(dest) != len(r.values) {
		return fmt.Errorf("scan arity mismatch: have %d dests, %d values", len(dest), len(r.values))
	}
	for i := range dest {
		if err := assignValue(dest[i], r.values[i]); err != nil {
			return fmt.Errorf("scan dest %d: %w", i, err)
		}
	}
	return nil
}

func assignValue(dest any, value any) error {
	dv := reflect.ValueOf(dest)
	if dv.Kind() != reflect.Ptr || dv.IsNil() {
		return fmt.Errorf("destination must be a non-nil pointer, got %T", dest)
	}
	if value == nil {
		dv.Elem().Set(reflect.Zero(dv.Elem().Type()))
		return nil
	}
	sv := reflect.ValueOf(value)
	ev := dv.Elem()
	if sv.Type().AssignableTo(ev.Type()) {
		ev.Set(sv)
		return nil
	}
	if sv.Type().ConvertibleTo(ev.Type()) {
		ev.Set(sv.Convert(ev.Type()))
		return nil
	}
	if ev.Kind() == reflect.Interface {
		ev.Set(sv)
		return nil
	}
	return fmt.Errorf("cannot assign %T to %T", value, dest)
}

func uuidPtr(value string) pgtype.UUID {
	var id pgtype.UUID
	_ = id.Scan(value)
	return id
}
