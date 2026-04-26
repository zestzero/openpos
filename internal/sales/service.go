package sales

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/zestzero/openpos/db/sqlc"
	"github.com/zestzero/openpos/internal/inventory"
)

var (
	ErrInvalidOrder      = errors.New("invalid order")
	ErrInsufficientStock = errors.New("insufficient stock")
	ErrOrderNotFound     = errors.New("order not found")
)

type orderStore interface {
	CreateOrder(context.Context, sqlc.CreateOrderParams) (sqlc.Order, error)
	CreateOrderItem(context.Context, sqlc.CreateOrderItemParams) (sqlc.CreateOrderItemRow, error)
	CreatePayment(context.Context, sqlc.CreatePaymentParams) (sqlc.Payment, error)
	GetOrderByClientUUID(context.Context, string) (sqlc.Order, error)
	GetOrderByID(context.Context, pgtype.UUID) (sqlc.Order, error)
	GetPaymentByOrderID(context.Context, pgtype.UUID) (sqlc.Payment, error)
	GetVariant(context.Context, pgtype.UUID) (sqlc.Variant, error)
	ListOrders(context.Context, sqlc.ListOrdersParams) ([]sqlc.Order, error)
	ListOrderItemsByOrderID(context.Context, pgtype.UUID) ([]sqlc.ListOrderItemsByOrderIDRow, error)
}

type inventoryGateway interface {
	GetStockLevel(context.Context, string) (inventory.StockLevel, error)
	DeductStock(context.Context, string, int64, string) (inventory.LedgerEntry, error)
}

type Service struct {
	queries   orderStore
	inventory inventoryGateway
	pool      *pgxpool.Pool
}

func NewService(queries orderStore, inventoryService inventoryGateway) *Service {
	return &Service{queries: queries, inventory: inventoryService}
}

func (s *Service) SetPool(pool *pgxpool.Pool) {
	s.pool = pool
}

type CreateOrderInput struct {
	ClientUUID string
	UserID     string
	Items      []OrderItemInput
}

type OrderItemInput struct {
	VariantID string
	Quantity  int32
	UnitPrice int64
}

type Order struct {
	ID          string      `json:"id"`
	ClientUUID  string      `json:"client_uuid"`
	UserID      string      `json:"user_id"`
	Status      string      `json:"status"`
	TotalAmount int64       `json:"total_amount"`
	Items       []OrderItem `json:"items"`
	CreatedAt   string      `json:"created_at"`
	UpdatedAt   string      `json:"updated_at"`
	Created     bool        `json:"-"`
}

type OrderItem struct {
	ID        string `json:"id"`
	OrderID   string `json:"order_id"`
	VariantID string `json:"variant_id"`
	Quantity  int32  `json:"quantity"`
	UnitPrice int64  `json:"unit_price"`
	Subtotal  int64  `json:"subtotal"`
	CreatedAt string `json:"created_at"`
}

type Payment struct {
	ID             string `json:"id"`
	OrderID        string `json:"order_id"`
	Method         string `json:"method"`
	TenderedAmount int64  `json:"tendered_amount"`
	ChangeDue      int64  `json:"change_due"`
	PaidAt         string `json:"paid_at"`
	CreatedAt      string `json:"created_at"`
}

type ReceiptSnapshot struct {
	StoreName      string        `json:"store_name"`
	PaidAt         string        `json:"paid_at"`
	OrderID        string        `json:"order_id"`
	Items          []ReceiptItem `json:"items"`
	TotalAmount    int64         `json:"total_amount"`
	PaymentMethod  string        `json:"payment_method"`
	TenderedAmount int64         `json:"tendered_amount"`
	ChangeDue      int64         `json:"change_due"`
}

type ReceiptItem struct {
	Name      string `json:"name"`
	Quantity  int32  `json:"quantity"`
	UnitPrice int64  `json:"unit_price"`
	Subtotal  int64  `json:"subtotal"`
}

type CompletePaymentInput struct {
	OrderID        string
	Method         string
	TenderedAmount int64
	StoreName      string
}

type SyncResult struct {
	Processed int         `json:"processed"`
	Succeeded int         `json:"succeeded"`
	Failed    int         `json:"failed"`
	Errors    []SyncError `json:"errors"`
}

type SyncError struct {
	ClientUUID string `json:"client_uuid"`
	Error      string `json:"error"`
}

func (s *Service) CreateOrder(ctx context.Context, input CreateOrderInput) (*Order, error) {
	if err := validateCreateOrderInput(input); err != nil {
		return nil, err
	}

	if existing, err := s.queries.GetOrderByClientUUID(ctx, input.ClientUUID); err == nil {
		return s.loadOrder(ctx, existing, false)
	} else if !errors.Is(err, pgx.ErrNoRows) {
		return nil, fmt.Errorf("checking existing order: %w", err)
	}

	for _, item := range input.Items {
		stock, err := s.inventory.GetStockLevel(ctx, item.VariantID)
		if err != nil {
			return nil, fmt.Errorf("checking stock for %s: %w", item.VariantID, err)
		}
		if stock.StockLevel < int64(item.Quantity) {
			return nil, ErrInsufficientStock
		}
	}

	totalAmount := totalFor(input.Items)

	if s.pool == nil {
		return s.createOrderWithStores(ctx, s.queries, s.inventory, input, totalAmount, true)
	}

	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return nil, fmt.Errorf("begin transaction: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	txQueries, ok := s.queries.(interface{ WithTx(pgx.Tx) *sqlc.Queries })
	if !ok {
		return nil, fmt.Errorf("order store does not support transactions")
	}
	txInventory, ok := s.inventory.(interface {
		WithTx(pgx.Tx) *inventory.Service
	})
	if !ok {
		return nil, fmt.Errorf("inventory store does not support transactions")
	}

	order, err := s.createOrderWithStores(ctx, txQueries.WithTx(tx), txInventory.WithTx(tx), input, totalAmount, true)
	if err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit transaction: %w", err)
	}
	return order, nil
}

func (s *Service) SyncOrders(ctx context.Context, inputs []CreateOrderInput) (SyncResult, error) {
	result := SyncResult{Processed: len(inputs)}
	for _, input := range inputs {
		order, err := s.CreateOrder(ctx, input)
		if err != nil {
			result.Failed++
			result.Errors = append(result.Errors, SyncError{ClientUUID: input.ClientUUID, Error: err.Error()})
			continue
		}
		if order != nil {
			result.Succeeded++
		}
	}
	return result, nil
}

func (s *Service) GetOrder(ctx context.Context, id string) (*Order, error) {
	orderID, err := parseUUID(id)
	if err != nil {
		return nil, err
	}
	order, err := s.queries.GetOrderByID(ctx, orderID)
	if err != nil {
		return nil, ErrOrderNotFound
	}
	return s.loadOrder(ctx, order, true)
}

func (s *Service) CompletePayment(ctx context.Context, input CompletePaymentInput) (*ReceiptSnapshot, error) {
	orderID, err := parseUUID(input.OrderID)
	if err != nil {
		return nil, ErrInvalidOrder
	}

	order, err := s.queries.GetOrderByID(ctx, orderID)
	if err != nil {
		return nil, ErrOrderNotFound
	}

	if payment, err := s.queries.GetPaymentByOrderID(ctx, orderID); err == nil {
		return s.loadReceiptSnapshot(ctx, order, payment, input.StoreName)
	}

	total := order.TotalAmount

	if input.Method == "promptpay" {
		if input.TenderedAmount != total {
			return nil, ErrInvalidOrder
		}
	} else if input.TenderedAmount < total {
		return nil, ErrInvalidOrder
	}

	changeDue := input.TenderedAmount - total
	if input.Method == "promptpay" {
		changeDue = 0
	}

	payment, err := s.queries.CreatePayment(ctx, sqlc.CreatePaymentParams{
		OrderID:        orderID,
		Method:         input.Method,
		TenderedAmount: input.TenderedAmount,
		ChangeDue:      changeDue,
	})
	if err != nil {
		if existing, lookupErr := s.queries.GetPaymentByOrderID(ctx, orderID); lookupErr == nil {
			return s.loadReceiptSnapshot(ctx, order, existing, input.StoreName)
		}
		return nil, fmt.Errorf("creating payment: %w", err)
	}

	return s.loadReceiptSnapshot(ctx, order, payment, input.StoreName)
}

func (s *Service) GetReceipt(ctx context.Context, id string, storeName string) (*ReceiptSnapshot, error) {
	orderID, err := parseUUID(id)
	if err != nil {
		return nil, ErrInvalidOrder
	}
	order, err := s.queries.GetOrderByID(ctx, orderID)
	if err != nil {
		return nil, ErrOrderNotFound
	}
	payment, err := s.queries.GetPaymentByOrderID(ctx, orderID)
	if err != nil {
		return nil, ErrOrderNotFound
	}
	return s.loadReceiptSnapshot(ctx, order, payment, storeName)
}

func (s *Service) createOrderWithStores(ctx context.Context, store orderStore, inventoryService inventoryGateway, input CreateOrderInput, totalAmount int64, created bool) (*Order, error) {
	orderRow, err := store.CreateOrder(ctx, sqlc.CreateOrderParams{
		ClientUuid:  input.ClientUUID,
		UserID:      mustParseUUID(input.UserID),
		Status:      "completed",
		TotalAmount: totalAmount,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			existing, lookupErr := store.GetOrderByClientUUID(ctx, input.ClientUUID)
			if lookupErr != nil {
				return nil, fmt.Errorf("loading existing order: %w", lookupErr)
			}
			return s.loadOrder(ctx, existing, false)
		}
		return nil, fmt.Errorf("creating order: %w", err)
	}

	for _, item := range input.Items {
		subtotal := int64(item.Quantity) * item.UnitPrice
		variantID, err := parseUUID(item.VariantID)
		if err != nil {
			return nil, err
		}
		variant, err := store.GetVariant(ctx, variantID)
		if err != nil {
			return nil, fmt.Errorf("loading variant cost for %s: %w", item.VariantID, err)
		}
		costAtSale := pgtype.Int8{}
		if variant.Cost.Valid {
			costAtSale.Int64 = variant.Cost.Int64
			costAtSale.Valid = true
		}
		if _, err := store.CreateOrderItem(ctx, sqlc.CreateOrderItemParams{
			OrderID:    orderRow.ID,
			VariantID:  variantID,
			Quantity:   item.Quantity,
			UnitPrice:  item.UnitPrice,
			Subtotal:   subtotal,
			CostAtSale: costAtSale,
		}); err != nil {
			return nil, fmt.Errorf("creating order item: %w", err)
		}
		if _, err := inventoryService.DeductStock(ctx, item.VariantID, int64(item.Quantity), orderRow.ID.String()); err != nil {
			if errors.Is(err, inventory.ErrNegativeStock) {
				return nil, ErrInsufficientStock
			}
			return nil, fmt.Errorf("deducting stock: %w", err)
		}
	}

	return s.loadOrder(ctx, orderRow, created)
}

func (s *Service) loadReceiptSnapshot(ctx context.Context, order sqlc.Order, payment sqlc.Payment, storeName string) (*ReceiptSnapshot, error) {
	items, err := s.queries.ListOrderItemsByOrderID(ctx, order.ID)
	if err != nil {
		return nil, fmt.Errorf("loading receipt items: %w", err)
	}

	receiptItems := make([]ReceiptItem, 0, len(items))
	for _, item := range items {
		variant, err := s.queries.GetVariant(ctx, item.VariantID)
		name := item.VariantID.String()
		if err == nil {
			name = variant.Name
		}
		receiptItems = append(receiptItems, ReceiptItem{
			Name:      name,
			Quantity:  item.Quantity,
			UnitPrice: item.UnitPrice,
			Subtotal:  item.Subtotal,
		})
	}

	return &ReceiptSnapshot{
		StoreName:      storeName,
		PaidAt:         payment.PaidAt.Time.Format("2006-01-02T15:04:05Z07:00"),
		OrderID:        order.ID.String(),
		Items:          receiptItems,
		TotalAmount:    order.TotalAmount,
		PaymentMethod:  payment.Method,
		TenderedAmount: payment.TenderedAmount,
		ChangeDue:      payment.ChangeDue,
	}, nil
}

func (s *Service) loadOrder(ctx context.Context, row sqlc.Order, created bool) (*Order, error) {
	items, err := s.queries.ListOrderItemsByOrderID(ctx, row.ID)
	if err != nil {
		return nil, fmt.Errorf("loading order items: %w", err)
	}
	order := toOrder(row, items)
	order.Created = created
	return &order, nil
}

func validateCreateOrderInput(input CreateOrderInput) error {
	if input.ClientUUID == "" || input.UserID == "" {
		return ErrInvalidOrder
	}
	if _, err := parseUUID(input.UserID); err != nil {
		return ErrInvalidOrder
	}
	if len(input.Items) == 0 {
		return ErrInvalidOrder
	}
	for _, item := range input.Items {
		if item.VariantID == "" || item.Quantity <= 0 {
			return ErrInvalidOrder
		}
		if _, err := parseUUID(item.VariantID); err != nil {
			return ErrInvalidOrder
		}
	}
	return nil
}

func totalFor(items []OrderItemInput) int64 {
	var total int64
	for _, item := range items {
		total += int64(item.Quantity) * item.UnitPrice
	}
	return total
}

func parseUUID(value string) (pgtype.UUID, error) {
	var id pgtype.UUID
	if err := id.Scan(value); err != nil {
		return pgtype.UUID{}, fmt.Errorf("invalid id: %w", err)
	}
	return id, nil
}

func mustParseUUID(value string) pgtype.UUID {
	id, _ := parseUUID(value)
	return id
}

func toOrder(row sqlc.Order, items []sqlc.ListOrderItemsByOrderIDRow) Order {
	order := Order{
		ID:          row.ID.String(),
		ClientUUID:  row.ClientUuid,
		UserID:      row.UserID.String(),
		Status:      row.Status,
		TotalAmount: row.TotalAmount,
		CreatedAt:   row.CreatedAt.Time.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:   row.UpdatedAt.Time.Format("2006-01-02T15:04:05Z07:00"),
		Items:       make([]OrderItem, 0, len(items)),
	}
	for _, item := range items {
		order.Items = append(order.Items, OrderItem{
			ID:        item.ID.String(),
			OrderID:   item.OrderID.String(),
			VariantID: item.VariantID.String(),
			Quantity:  item.Quantity,
			UnitPrice: item.UnitPrice,
			Subtotal:  item.Subtotal,
			CreatedAt: item.CreatedAt.Time.Format("2006-01-02T15:04:05Z07:00"),
		})
	}
	return order
}
