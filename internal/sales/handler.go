package sales

import (
	"encoding/json"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
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
	r.Post("/{id}/payments", h.CompletePayment)
	r.Get("/{id}/receipt", h.GetReceipt)
	return r
}

type successResponse struct {
	Data any `json:"data"`
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
