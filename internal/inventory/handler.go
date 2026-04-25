package inventory

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

// Handler handles HTTP requests for inventory
type Handler struct {
	service *Service
}

// NewHandler creates a new inventory handler
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// Routes returns the inventory routes
func (h *Handler) Routes() http.Handler {
	r := chi.NewRouter()

	r.Group(func(r chi.Router) {
		// GET /api/inventory/variants/{id}/stock - Current stock level
		r.Get("/variants/{id}/stock", h.GetStockLevel)

		// GET /api/inventory/variants/{id}/ledger - Audit trail
		r.Get("/variants/{id}/ledger", h.ListLedgerEntries)
	})

	// POST /api/inventory/adjust - Manual adjustment
	r.Post("/adjust", h.AdjustStock)

	return r
}

// Response helpers

type errorResponse struct {
	Error string `json:"error"`
}

type successResponse struct {
	Data interface{} `json:"data"`
}

// Handle GET /api/inventory/variants/{id}/stock
func (h *Handler) GetStockLevel(w http.ResponseWriter, r *http.Request) {
	variantID := chi.URLParam(r, "id")
	if variantID == "" {
		http.Error(w, "variant id is required", http.StatusBadRequest)
		return
	}

	stockLevel, err := h.service.GetStockLevel(r.Context(), variantID)
	if err != nil {
		if err == ErrVariantNotFound {
			http.Error(w, "variant not found", http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(successResponse{Data: stockLevel})
}

// Handle POST /api/inventory/adjust
func (h *Handler) AdjustStock(w http.ResponseWriter, r *http.Request) {
	var input struct {
		VariantID   string  `json:"variant_id"`
		Quantity    int64   `json:"quantity"`
		Reason      string  `json:"reason"`
		ReferenceID *string `json:"reference_id"`
		CreatedBy   *string `json:"created_by"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if input.VariantID == "" {
		http.Error(w, "variant_id is required", http.StatusBadRequest)
		return
	}
	if input.Reason == "" {
		http.Error(w, "reason is required", http.StatusBadRequest)
		return
	}
	if input.Quantity == 0 {
		http.Error(w, "quantity must be non-zero", http.StatusBadRequest)
		return
	}

	entry, err := h.service.AdjustStock(r.Context(), AdjustStockInput{
		VariantID:   input.VariantID,
		Quantity:    input.Quantity,
		Reason:      input.Reason,
		ReferenceID: input.ReferenceID,
		CreatedBy:   input.CreatedBy,
	})
	if err != nil {
		switch err {
		case ErrVariantNotFound:
			http.Error(w, "variant not found", http.StatusNotFound)
		case ErrInvalidReason:
			http.Error(w, "invalid reason code", http.StatusBadRequest)
		case ErrInvalidQuantity:
			http.Error(w, "quantity must be non-zero", http.StatusBadRequest)
		default:
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	json.NewEncoder(w).Encode(successResponse{Data: entry})
}

// Handle GET /api/inventory/variants/{id}/ledger
func (h *Handler) ListLedgerEntries(w http.ResponseWriter, r *http.Request) {
	variantID := chi.URLParam(r, "id")
	if variantID == "" {
		http.Error(w, "variant id is required", http.StatusBadRequest)
		return
	}

	// Parse pagination parameters
	limit := int32(50) // default limit
	offset := int32(0) // default offset

	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		limitParsed, err := strconv.ParseInt(limitStr, 10, 32)
		if err != nil {
			http.Error(w, "invalid limit parameter", http.StatusBadRequest)
			return
		}
		limit = int32(limitParsed)
	}

	if offsetStr := r.URL.Query().Get("offset"); offsetStr != "" {
		offsetParsed, err := strconv.ParseInt(offsetStr, 10, 32)
		if err != nil {
			http.Error(w, "invalid offset parameter", http.StatusBadRequest)
			return
		}
		offset = int32(offsetParsed)
	}

	entries, err := h.service.ListLedgerEntries(r.Context(), variantID, limit, offset)
	if err != nil {
		if err == ErrVariantNotFound {
			http.Error(w, "variant not found", http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(successResponse{Data: entries})
}