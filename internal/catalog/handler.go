package catalog

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/zestzero/openpos/db/sqlc"
)

type catalogService interface {
	ListCategories(context.Context) ([]sqlc.Category, error)
	CreateCategory(context.Context, CreateCategoryInput) (sqlc.Category, error)
	GetCategory(context.Context, string) (sqlc.Category, error)
	UpdateCategory(context.Context, string, CreateCategoryInput) (sqlc.Category, error)
	ListProducts(context.Context, ListProductsInput) ([]ProductWithVariants, error)
	CreateProduct(context.Context, CreateProductInput) (ProductWithVariants, error)
	ImportProducts(context.Context, []CreateProductInput) ([]ProductWithVariants, error)
	GetProduct(context.Context, string) (ProductWithVariants, error)
	UpdateProduct(context.Context, string, CreateProductInput) (ProductWithVariants, error)
	CreateVariant(context.Context, string, CreateVariantInput) (sqlc.Variant, error)
	UpdateVariant(context.Context, string, CreateVariantInput) (sqlc.Variant, error)
	SearchVariant(context.Context, string) (sqlc.SearchVariantRow, error)
	ReorderCategories(context.Context, []string) error
}

// Handler handles HTTP requests for catalog
type Handler struct {
	service catalogService
}

// NewHandler creates a new catalog handler
func NewHandler(service catalogService) *Handler {
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
		r.Put("/categories/reorder", h.ReorderCategories)
	})

	// Products
	r.Group(func(r chi.Router) {
		r.Get("/products", h.ListProducts)
		r.Post("/products", h.CreateProduct)
		r.Post("/import", h.ImportProducts)
		r.Get("/products/{id}", h.GetProduct)
		r.Put("/products/{id}", h.UpdateProduct)
	})

	// Image upload
	r.Post("/images", h.UploadImage)

	// Variants
	r.Group(func(r chi.Router) {
		r.Post("/products/{productID}/variants", h.CreateVariant)
	})
	r.Put("/variants/{id}", h.UpdateVariant)

	// Search
	r.Get("/variants/search", h.SearchVariant)

	return r
}

// UploadImage handles multipart image uploads, saves the file to the uploads directory,
// and returns the public URL.
func (h *Handler) UploadImage(w http.ResponseWriter, r *http.Request) {
	const maxSize = 10 << 20 // 10 MB
	if err := r.ParseMultipartForm(maxSize); err != nil {
		writeError(w, http.StatusBadRequest, "request too large or not multipart")
		return
	}

	file, header, err := r.FormFile("image")
	if err != nil {
		writeError(w, http.StatusBadRequest, "field 'image' required")
		return
	}
	defer file.Close()

	// Validate MIME type from extension + content-type header
	ext := strings.ToLower(filepath.Ext(header.Filename))
	allowedExts := map[string]string{
		".jpg":  "image/jpeg",
		".jpeg": "image/jpeg",
		".png":  "image/png",
		".webp": "image/webp",
		".gif":  "image/gif",
		".avif": "image/avif",
	}
	if _, ok := allowedExts[ext]; !ok {
		// fall back to content-type
		ct := header.Header.Get("Content-Type")
		mediaType, _, _ := mime.ParseMediaType(ct)
		if !strings.HasPrefix(mediaType, "image/") {
			writeError(w, http.StatusBadRequest, "unsupported image format")
			return
		}
		ext = "." + strings.TrimPrefix(mediaType, "image/")
	}

	uploadsDir := getUploadsDir()
	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		writeError(w, http.StatusInternalServerError, "could not create uploads directory")
		return
	}

	// Generate a unique filename
	filename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
	destPath := filepath.Join(uploadsDir, filename)

	dst, err := os.Create(destPath)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not save image")
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		writeError(w, http.StatusInternalServerError, "could not write image")
		return
	}

	publicURL := publicUploadURL(r, filename)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]string{"url": publicURL})
}

func publicUploadURL(r *http.Request, filename string) string {
	scheme := r.Header.Get("X-Forwarded-Proto")
	if scheme == "" {
		if r.TLS != nil {
			scheme = "https"
		} else {
			scheme = "http"
		}
	}

	host := r.Header.Get("X-Forwarded-Host")
	if host == "" {
		host = r.Host
	}

	if host == "" {
		return "/uploads/" + filename
	}

	return (&url.URL{
		Scheme: scheme,
		Host:   host,
		Path:   "/uploads/" + filename,
	}).String()
}

func getUploadsDir() string {
	if d := os.Getenv("UPLOADS_DIR"); d != "" {
		return d
	}
	return "uploads"
}

// Response helpers

type errorResponse struct {
	Error string `json:"error"`
}

func writeError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(errorResponse{Error: msg})
}

type successResponse struct {
	Data interface{} `json:"data"`
}

type reorderCategoriesRequest struct {
	IDs []string `json:"ids"`
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

func (h *Handler) ReorderCategories(w http.ResponseWriter, r *http.Request) {
	var input reorderCategoriesRequest
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if len(input.IDs) == 0 {
		http.Error(w, "ids are required", http.StatusBadRequest)
		return
	}

	seen := make(map[string]struct{}, len(input.IDs))
	for _, id := range input.IDs {
		if id == "" {
			http.Error(w, "ids are required", http.StatusBadRequest)
			return
		}
		if _, ok := seen[id]; ok {
			http.Error(w, "ids must be unique", http.StatusBadRequest)
			return
		}
		seen[id] = struct{}{}
	}

	if err := h.service.ReorderCategories(r.Context(), input.IDs); err != nil {
		if errors.Is(err, ErrCategoryNotFound) {
			http.Error(w, "category not found", http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
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
		Name        string               `json:"name"`
		Description string               `json:"description"`
		CategoryID  *string              `json:"category_id"`
		ImageURL    string               `json:"image_url"`
		IsActive    *bool                `json:"is_active"`
		Variants    []CreateVariantInput `json:"variants"`
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

func (h *Handler) ImportProducts(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Products []CreateProductInput `json:"products"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if len(input.Products) == 0 {
		http.Error(w, "products are required", http.StatusBadRequest)
		return
	}

	products, err := h.service.ImportProducts(r.Context(), input.Products)
	if err != nil {
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

	json.NewEncoder(w).Encode(successResponse{Data: products})
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

func (h *Handler) UpdateVariant(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		http.Error(w, "id is required", http.StatusBadRequest)
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

	variant, err := h.service.UpdateVariant(r.Context(), id, CreateVariantInput{
		Sku:      input.Sku,
		Barcode:  input.Barcode,
		Name:     input.Name,
		Price:    input.Price,
		Cost:     input.Cost,
		IsActive: &isActive,
	})
	if err != nil {
		if err == ErrVariantNotFound {
			http.Error(w, err.Error(), http.StatusNotFound)
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
