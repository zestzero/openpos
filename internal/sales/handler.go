package sales

import (
	"encoding/json"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"

	"github.com/zestzero/openpos/internal/middleware"
)

type Handler struct {
	service   *Service
	storeName string
}

func NewHandler(service *Service) *Handler {
	storeName := os.Getenv("STORE_NAME")
	if storeName == "" {
		storeName = "OpenPOS"
	}
	return &Handler{service: service, storeName: storeName}
}

func (h *Handler) Routes() http.Handler {
	r := chi.NewRouter()
	r.Post("/", h.CreateOrder)
	r.Post("/sync", h.SyncOrders)
	r.Get("/{id}", h.GetOrder)
	r.Post("/{id}/payments", h.CompletePayment)
	r.Get("/{id}/receipt", h.GetReceipt)
	return r
}

type successResponse struct {
	Data any `json:"data"`
}

// Request types for order creation
type createOrderRequest struct {
	ClientUUID     string           `json:"client_uuid"`
	DiscountAmount int64            `json:"discount_amount"`
	Items          []orderItemInput `json:"items"`
}

type orderItemInput struct {
	VariantID string `json:"variant_id"`
	Quantity  int32  `json:"quantity"`
	UnitPrice int64  `json:"unit_price"`
}

type syncOrdersRequest struct {
	Orders []createOrderRequest `json:"orders"`
}

func (h *Handler) CompletePayment(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Method         string `json:"method"`
		TenderedAmount int64  `json:"tendered_amount"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	id := chi.URLParam(r, "id")
	if id == "" || req.Method == "" {
		http.Error(w, "id and method are required", http.StatusBadRequest)
		return
	}
	receipt, err := h.service.CompletePayment(r.Context(), CompletePaymentInput{
		OrderID:        id,
		Method:         req.Method,
		TenderedAmount: req.TenderedAmount,
		StoreName:      h.storeName,
	})
	if err != nil {
		if err == ErrInvalidOrder {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if err == ErrOrderNotFound {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(successResponse{Data: receipt})
}

func (h *Handler) GetReceipt(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		http.Error(w, "id is required", http.StatusBadRequest)
		return
	}
	receipt, err := h.service.GetReceipt(r.Context(), id, h.storeName)
	if err != nil {
		if err == ErrInvalidOrder {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if err == ErrOrderNotFound {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(successResponse{Data: receipt})
}

// POST /orders - Create a new order
func (h *Handler) CreateOrder(w http.ResponseWriter, r *http.Request) {
	var req createOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.ClientUUID == "" {
		http.Error(w, "client_uuid is required", http.StatusBadRequest)
		return
	}
	if len(req.Items) == 0 {
		http.Error(w, "items is required and must not be empty", http.StatusBadRequest)
		return
	}

	// Get user ID from JWT context
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	// Convert request items to service input
	items := make([]OrderItemInput, len(req.Items))
	for i, item := range req.Items {
		items[i] = OrderItemInput{
			VariantID: item.VariantID,
			Quantity:  item.Quantity,
			UnitPrice: item.UnitPrice,
		}
	}

	order, err := h.service.CreateOrder(r.Context(), CreateOrderInput{
		ClientUUID:     req.ClientUUID,
		UserID:         userID,
		DiscountAmount: req.DiscountAmount,
		Items:          items,
	})
	if err != nil {
		if err == ErrInvalidOrder {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if err == ErrInsufficientStock {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if order.Created {
		w.WriteHeader(http.StatusCreated)
	} else {
		w.WriteHeader(http.StatusOK)
	}
	json.NewEncoder(w).Encode(successResponse{Data: order})
}

// POST /orders/sync - Sync a batch of offline orders
func (h *Handler) SyncOrders(w http.ResponseWriter, r *http.Request) {
	var req syncOrdersRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if len(req.Orders) == 0 {
		http.Error(w, "orders is required and must not be empty", http.StatusBadRequest)
		return
	}

	// Get user ID from JWT context
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	// Convert request orders to service input
	inputs := make([]CreateOrderInput, len(req.Orders))
	for i, order := range req.Orders {
		items := make([]OrderItemInput, len(order.Items))
		for j, item := range order.Items {
			items[j] = OrderItemInput{
				VariantID: item.VariantID,
				Quantity:  item.Quantity,
				UnitPrice: item.UnitPrice,
			}
		}
		inputs[i] = CreateOrderInput{
			ClientUUID:     order.ClientUUID,
			UserID:         userID,
			DiscountAmount: order.DiscountAmount,
			Items:          items,
		}
	}

	result, err := h.service.SyncOrders(r.Context(), inputs)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(successResponse{Data: result})
}

// GET /orders/{id} - Get order by ID
func (h *Handler) GetOrder(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		http.Error(w, "id is required", http.StatusBadRequest)
		return
	}

	order, err := h.service.GetOrder(r.Context(), id)
	if err != nil {
		if err == ErrOrderNotFound {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(successResponse{Data: order})
}
