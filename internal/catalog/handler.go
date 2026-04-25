package catalog

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

// Handler handles HTTP requests for catalog
type Handler struct {
	service *Service
}

// NewHandler creates a new catalog handler
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// Routes returns the catalog routes
func (h *Handler) Routes() http.Handler {
	r := chi.NewRouter()

	// Categories
	r.Group(func(r chi.Router) {
		r.Get("/categories", h.ListCategories)
		r.Post("/categories", h.CreateCategory)
		r.Get("/categories/{id}", h.GetCategory)
		r.Put("/categories/{id}", h.UpdateCategory)
	})

	// Products
	r.Group(func(r chi.Router) {
		r.Get("/products", h.ListProducts)
		r.Post("/products", h.CreateProduct)
		r.Get("/products/{id}", h.GetProduct)
		r.Put("/products/{id}", h.UpdateProduct)
	})

	// Variants
	r.Group(func(r chi.Router) {
		r.Post("/products/{productID}/variants", h.CreateVariant)
	})

	// Search
	r.Get("/variants/search", h.SearchVariant)

	return r
}

// Response helpers

type errorResponse struct {
	Error string `json:"error"`
}

type successResponse struct {
	Data interface{} `json:"data"`
}

// Category handlers

func (h *Handler) ListCategories(w http.ResponseWriter, r *http.Request) {
	categories, err := h.service.ListCategories(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(successResponse{Data: categories})
}

func (h *Handler) CreateCategory(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Name        string  `json:"name"`
		Description string  `json:"description"`
		ParentID    *string `json:"parent_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if input.Name == "" {
		http.Error(w, "name is required", http.StatusBadRequest)
		return
	}

	category, err := h.service.CreateCategory(r.Context(), CreateCategoryInput{
		Name:        input.Name,
		Description: input.Description,
		ParentID:    input.ParentID,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(successResponse{Data: category})
}

func (h *Handler) GetCategory(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		http.Error(w, "id is required", http.StatusBadRequest)
		return
	}

	category, err := h.service.GetCategory(r.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(successResponse{Data: category})
}

func (h *Handler) UpdateCategory(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		http.Error(w, "id is required", http.StatusBadRequest)
		return
	}

	var input struct {
		Name        string  `json:"name"`
		Description string  `json:"description"`
		ParentID    *string `json:"parent_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if input.Name == "" {
		http.Error(w, "name is required", http.StatusBadRequest)
		return
	}

	category, err := h.service.UpdateCategory(r.Context(), id, CreateCategoryInput{
		Name:        input.Name,
		Description: input.Description,
		ParentID:    input.ParentID,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(successResponse{Data: category})
}

// Product handlers

func (h *Handler) ListProducts(w http.ResponseWriter, r *http.Request) {
	var input ListProductsInput

	if categoryID := r.URL.Query().Get("category_id"); categoryID != "" {
		input.CategoryID = &categoryID
	}

	if isActive := r.URL.Query().Get("is_active"); isActive != "" {
		isActiveVal := isActive == "true"
		input.IsActive = &isActiveVal
	}

	products, err := h.service.ListProducts(r.Context(), input)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(successResponse{Data: products})
}

func (h *Handler) CreateProduct(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Name        string                  `json:"name"`
		Description string                  `json:"description"`
		CategoryID  *string                 `json:"category_id"`
		ImageURL    string                  `json:"image_url"`
		IsActive    *bool                   `json:"is_active"`
		Variants    []CreateVariantInput    `json:"variants"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if input.Name == "" {
		http.Error(w, "name is required", http.StatusBadRequest)
		return
	}

	isActive := true
	if input.IsActive != nil {
		isActive = *input.IsActive
	}

	product, err := h.service.CreateProduct(r.Context(), CreateProductInput{
		Name:        input.Name,
		Description: input.Description,
		CategoryID:  input.CategoryID,
		ImageURL:    input.ImageURL,
		IsActive:    &isActive,
		Variants:    input.Variants,
	})
	if err != nil {
		// Handle specific errors
		if err == ErrSKUExists {
			http.Error(w, "SKU already exists", http.StatusConflict)
			return
		}
		if err == ErrBarcodeExists {
			http.Error(w, "barcode already exists", http.StatusConflict)
			return
		}
		if err == ErrCategoryNotFound {
			http.Error(w, "category not found", http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(successResponse{Data: product})
}

func (h *Handler) GetProduct(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		http.Error(w, "id is required", http.StatusBadRequest)
		return
	}

	product, err := h.service.GetProduct(r.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(successResponse{Data: product})
}

func (h *Handler) UpdateProduct(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		http.Error(w, "id is required", http.StatusBadRequest)
		return
	}

	var input struct {
		Name        string  `json:"name"`
		Description string  `json:"description"`
		CategoryID  *string `json:"category_id"`
		ImageURL    string  `json:"image_url"`
		IsActive    *bool   `json:"is_active"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if input.Name == "" {
		http.Error(w, "name is required", http.StatusBadRequest)
		return
	}

	isActive := true
	if input.IsActive != nil {
		isActive = *input.IsActive
	}

	product, err := h.service.UpdateProduct(r.Context(), id, CreateProductInput{
		Name:        input.Name,
		Description: input.Description,
		CategoryID:  input.CategoryID,
		ImageURL:    input.ImageURL,
		IsActive:    &isActive,
	})
	if err != nil {
		if err == ErrProductNotFound {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(successResponse{Data: product})
}

// Variant handlers

func (h *Handler) CreateVariant(w http.ResponseWriter, r *http.Request) {
	productID := chi.URLParam(r, "productID")
	if productID == "" {
		http.Error(w, "product_id is required", http.StatusBadRequest)
		return
	}

	var input struct {
		Sku      string `json:"sku"`
		Barcode  string `json:"barcode"`
		Name     string `json:"name"`
		Price    int64  `json:"price"`
		Cost     int64  `json:"cost"`
		IsActive *bool  `json:"is_active"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if input.Sku == "" || input.Name == "" {
		http.Error(w, "sku and name are required", http.StatusBadRequest)
		return
	}

	if input.Price < 0 {
		http.Error(w, "price must be non-negative", http.StatusBadRequest)
		return
	}

	isActive := true
	if input.IsActive != nil {
		isActive = *input.IsActive
	}

	variant, err := h.service.CreateVariant(r.Context(), productID, CreateVariantInput{
		Sku:      input.Sku,
		Barcode:  input.Barcode,
		Name:     input.Name,
		Price:    input.Price,
		Cost:     input.Cost,
		IsActive: &isActive,
	})
	if err != nil {
		if err == ErrProductNotFound {
			http.Error(w, "product not found", http.StatusNotFound)
			return
		}
		if err == ErrSKUExists {
			http.Error(w, "SKU already exists", http.StatusConflict)
			return
		}
		if err == ErrBarcodeExists {
			http.Error(w, "barcode already exists", http.StatusConflict)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(successResponse{Data: variant})
}

func (h *Handler) SearchVariant(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		http.Error(w, "query parameter 'q' is required", http.StatusBadRequest)
		return
	}

	variant, err := h.service.SearchVariant(r.Context(), query)
	if err != nil {
		// Check for no rows found (pgx returns error when no rows)
		// We return not found for any error since search should only fail this way
		http.Error(w, "variant not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(successResponse{Data: variant})
}