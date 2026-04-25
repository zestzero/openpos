package inventory

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/zestzero/openpos/db/sqlc"
)

// Standard reason codes for inventory adjustments
const (
	ReasonRestock    = "RESTOCK"    // Adding stock (new inventory)
	ReasonSale       = "SALE"       // Stock sold (deducted via sales)
	ReasonAdjustment = "ADJUSTMENT" // Manual adjustment (correction, waste, etc.)
	ReasonReturn     = "RETURN"      // Customer returned item
	ReasonDamage     = "DAMAGE"     // Damaged goods written off
	ReasonLost       = "LOST"       // Lost/missing inventory
)

var (
	ErrVariantNotFound = errors.New("variant not found")
	ErrInvalidReason   = errors.New("invalid reason code")
	ErrInvalidQuantity = errors.New("quantity change must be non-zero")
	ErrNegativeStock   = errors.New("stock would go negative")
)

// Valid reason codes
var validReasons = map[string]bool{
	ReasonRestock:    true,
	ReasonSale:       true,
	ReasonAdjustment: true,
	ReasonReturn:     true,
	ReasonDamage:     true,
	ReasonLost:       true,
}

// Service handles inventory operations
type Service struct {
	db *sqlc.Queries
}

// NewService creates a new inventory service
func NewService(pool *pgxpool.Pool) *Service {
	return &Service{
		db: sqlc.New(pool),
	}
}

// StockLevel represents current stock for a variant
type StockLevel struct {
	VariantID  string `json:"variant_id"`
	StockLevel int64  `json:"stock_level"`
}

// LedgerEntry represents a single inventory movement
type LedgerEntry struct {
	ID             string `json:"id"`
	VariantID      string `json:"variant_id"`
	QuantityChange int64  `json:"quantity_change"`
	Reason         string `json:"reason"`
	ReferenceID    *string `json:"reference_id,omitempty"`
	CreatedAt      interface{} `json:"created_at"`
	CreatedBy      *string `json:"created_by,omitempty"`
}

// AdjustStockInput represents input for manual stock adjustment
type AdjustStockInput struct {
	VariantID   string  `json:"variant_id"`
	Quantity    int64   `json:"quantity"` // positive for increase, negative for decrease
	Reason      string  `json:"reason"`
	ReferenceID *string `json:"reference_id,omitempty"`
	CreatedBy   *string `json:"created_by,omitempty"`
}

// AdjustStock records a manual stock adjustment
func (s *Service) AdjustStock(ctx context.Context, input AdjustStockInput) (LedgerEntry, error) {
	// Validate reason code
	if !validReasons[input.Reason] {
		return LedgerEntry{}, ErrInvalidReason
	}

	// Validate quantity is non-zero
	if input.Quantity == 0 {
		return LedgerEntry{}, ErrInvalidQuantity
	}

	// Validate variant exists
	var variantUUID pgtype.UUID
	if err := variantUUID.Scan(input.VariantID); err != nil {
		return LedgerEntry{}, fmt.Errorf("invalid variant_id: %w", err)
	}

	// Check if variant exists (by trying to read it - we'll get any error if not)
	_, err := s.db.GetVariant(ctx, variantUUID)
	if err != nil {
		return LedgerEntry{}, ErrVariantNotFound
	}

	// Parse optional fields
	var refID pgtype.UUID
	if input.ReferenceID != nil {
		if err := refID.Scan(*input.ReferenceID); err != nil {
			return LedgerEntry{}, fmt.Errorf("invalid reference_id: %w", err)
		}
	}

	var createdBy pgtype.UUID
	if input.CreatedBy != nil {
		if err := createdBy.Scan(*input.CreatedBy); err != nil {
			return LedgerEntry{}, fmt.Errorf("invalid created_by: %w", err)
		}
	}

	// Create ledger entry
	entry, err := s.db.CreateLedgerEntry(ctx, sqlc.CreateLedgerEntryParams{
		VariantID:      variantUUID,
		QuantityChange: input.Quantity,
		Reason:         input.Reason,
		ReferenceID:    refID,
		CreatedBy:      createdBy,
	})
	if err != nil {
		return LedgerEntry{}, fmt.Errorf("creating ledger entry: %w", err)
	}

	return s.toLedgerEntry(entry), nil
}

// GetStockLevel returns the current stock level for a variant
func (s *Service) GetStockLevel(ctx context.Context, variantID string) (StockLevel, error) {
	var variantUUID pgtype.UUID
	if err := variantUUID.Scan(variantID); err != nil {
		return StockLevel{}, fmt.Errorf("invalid variant_id: %w", err)
	}

	// Validate variant exists
	_, err := s.db.GetVariant(ctx, variantUUID)
	if err != nil {
		return StockLevel{}, ErrVariantNotFound
	}

	result, err := s.db.GetStockLevel(ctx, variantUUID)
	if err != nil {
		return StockLevel{}, fmt.Errorf("getting stock level: %w", err)
	}

	// Convert result to int64
	var stockLevel int64
	if result != nil {
		switch v := result.(type) {
		case int64:
			stockLevel = v
		case int32:
			stockLevel = int64(v)
		case float64:
			stockLevel = int64(v)
		}
	}

	return StockLevel{
		VariantID:  variantID,
		StockLevel: stockLevel,
	}, nil
}

// ListLedgerEntries returns the audit trail for a variant
func (s *Service) ListLedgerEntries(ctx context.Context, variantID string, limit, offset int32) ([]LedgerEntry, error) {
	var variantUUID pgtype.UUID
	if err := variantUUID.Scan(variantID); err != nil {
		return nil, fmt.Errorf("invalid variant_id: %w", err)
	}

	entries, err := s.db.ListLedgerEntries(ctx, sqlc.ListLedgerEntriesParams{
		VariantID: variantUUID,
		Limit:     limit,
		Offset:    offset,
	})
	if err != nil {
		return nil, fmt.Errorf("listing ledger entries: %w", err)
	}

	result := make([]LedgerEntry, len(entries))
	for i, e := range entries {
		result[i] = s.toLedgerEntry(e)
	}

	return result, nil
}

// DeductStock is an internal method for Sales service to deduct stock on sale
// This is called directly from the sales service, not via HTTP
func (s *Service) DeductStock(ctx context.Context, variantID string, quantity int64, referenceID string) (LedgerEntry, error) {
	if quantity <= 0 {
		return LedgerEntry{}, fmt.Errorf("quantity must be positive: %d", quantity)
	}

	var variantUUID pgtype.UUID
	if err := variantUUID.Scan(variantID); err != nil {
		return LedgerEntry{}, fmt.Errorf("invalid variant_id: %w", err)
	}

	// Validate variant exists
	_, err := s.db.GetVariant(ctx, variantUUID)
	if err != nil {
		return LedgerEntry{}, ErrVariantNotFound
	}

	var refID pgtype.UUID
	if err := refID.Scan(referenceID); err != nil {
		return LedgerEntry{}, fmt.Errorf("invalid reference_id: %w", err)
	}

	// Create ledger entry with negative quantity for sale
	entry, err := s.db.CreateLedgerEntry(ctx, sqlc.CreateLedgerEntryParams{
		VariantID:      variantUUID,
		QuantityChange: -quantity, // Negative for deduction
		Reason:         ReasonSale,
		ReferenceID:    refID,
		CreatedBy:      pgtype.UUID{},
	})
	if err != nil {
		return LedgerEntry{}, fmt.Errorf("creating ledger entry: %w", err)
	}

	return s.toLedgerEntry(entry), nil
}

// GetStockLevelsByVariants returns stock levels for multiple variants
func (s *Service) GetStockLevelsByVariants(ctx context.Context, variantIDs []string) ([]StockLevel, error) {
	if len(variantIDs) == 0 {
		return []StockLevel{}, nil
	}

	uuids := make([]pgtype.UUID, len(variantIDs))
	for i, id := range variantIDs {
		if err := uuids[i].Scan(id); err != nil {
			return nil, fmt.Errorf("invalid variant_id at index %d: %w", i, err)
		}
	}

	results, err := s.db.GetStockLevelByVariants(ctx, uuids)
	if err != nil {
		return nil, fmt.Errorf("getting stock levels: %w", err)
	}

	stockLevels := make([]StockLevel, len(results))
	for i, r := range results {
		var stockLevel int64
		if r.StockLevel != nil {
			switch v := r.StockLevel.(type) {
			case int64:
				stockLevel = v
			case int32:
				stockLevel = int64(v)
			case float64:
				stockLevel = int64(v)
			}
		}

		stockLevels[i] = StockLevel{
			VariantID:  r.VariantID.String(),
			StockLevel: stockLevel,
		}
	}

	return stockLevels, nil
}

// toLedgerEntry converts sqlc type to domain type
func (s *Service) toLedgerEntry(e sqlc.InventoryLedger) LedgerEntry {
	var refID *string
	if e.ReferenceID.Valid {
		id := e.ReferenceID.String()
		refID = &id
	}

	var createdBy *string
	if e.CreatedBy.Valid {
		id := e.CreatedBy.String()
		createdBy = &id
	}

	return LedgerEntry{
		ID:             e.ID.String(),
		VariantID:      e.VariantID.String(),
		QuantityChange: e.QuantityChange,
		Reason:         e.Reason,
		ReferenceID:    refID,
		CreatedAt:      e.CreatedAt,
		CreatedBy:      createdBy,
	}
}