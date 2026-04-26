package reporting

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/zestzero/openpos/db/sqlc"
)

type reportingService interface {
	MonthlySales(context.Context) ([]sqlc.MonthlySalesReport, error)
	GrossProfit(context.Context) ([]sqlc.GrossProfitReport, error)
}

type Handler struct {
	service reportingService
}

func NewHandler(service reportingService) *Handler {
	return &Handler{service: service}
}

func (h *Handler) Routes() http.Handler {
	r := chi.NewRouter()
	r.Get("/monthly-sales", h.MonthlySales)
	r.Get("/gross-profit", h.GrossProfit)
	return r
}

type successResponse struct {
	Data any `json:"data"`
}

func (h *Handler) MonthlySales(w http.ResponseWriter, r *http.Request) {
	rows, err := h.service.MonthlySales(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(successResponse{Data: rows})
}

func (h *Handler) GrossProfit(w http.ResponseWriter, r *http.Request) {
	rows, err := h.service.GrossProfit(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(successResponse{Data: rows})
}
