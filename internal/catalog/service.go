package catalog

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/zestzero/openpos/db/sqlc"
)

var (
	ErrSKUExists       = errors.New("SKU already exists")
	ErrBarcodeExists   = errors.New("barcode already exists")
	ErrProductNotFound = errors.New("product not found")
	ErrVariantNotFound = errors.New("variant not found")
	ErrCategoryNotFound = errors.New("category not found")
)

type Service struct {
	db *sqlc.Queries
}

func NewService(pool *pgxpool.Pool) *Service {
	return &Service{
		db: sqlc.New(pool),
	}
}

// Category operations

type CreateCategoryInput struct {
	Name        string
	Description string
	ParentID    *string
}

func (s *Service) CreateCategory(ctx context.Context, input CreateCategoryInput) (sqlc.Category, error) {
	var parentID pgtype.UUID
	if input.ParentID != nil {
		if err := parentID.Scan(*input.ParentID); err != nil {
			return sqlc.Category{}, fmt.Errorf("invalid parent_id: %w", err)
		}
	}

	var desc pgtype.Text
	if input.Description != "" {
		desc.String = input.Description
		desc.Valid = true
	}

	return s.db.CreateCategory(ctx, sqlc.CreateCategoryParams{
		Name:        input.Name,
		Description: desc,
		ParentID:    parentID,
	})
}

func (s *Service) GetCategory(ctx context.Context, id string) (sqlc.Category, error) {
	var uuid pgtype.UUID
	if err := uuid.Scan(id); err != nil {
		return sqlc.Category{}, fmt.Errorf("invalid category id: %w", err)
	}
	return s.db.GetCategory(ctx, uuid)
}

func (s *Service) ListCategories(ctx context.Context) ([]sqlc.Category, error) {
	return s.db.ListCategories(ctx)
}

func (s *Service) UpdateCategory(ctx context.Context, id string, input CreateCategoryInput) (sqlc.Category, error) {
	var uuid pgtype.UUID
	if err := uuid.Scan(id); err != nil {
		return sqlc.Category{}, fmt.Errorf("invalid category id: %w", err)
	}

	var parentID pgtype.UUID
	if input.ParentID != nil {
		if err := parentID.Scan(*input.ParentID); err != nil {
			return sqlc.Category{}, fmt.Errorf("invalid parent_id: %w", err)
		}
	}

	var desc pgtype.Text
	if input.Description != "" {
		desc.String = input.Description
		desc.Valid = true
	}

	return s.db.UpdateCategory(ctx, sqlc.UpdateCategoryParams{
		ID:          uuid,
		Name:        input.Name,
		Description: desc,
		ParentID:    parentID,
	})
}

// Product with variants

type CreateProductInput struct {
	Name        string
	Description string
	CategoryID  *string
	ImageURL    string
	IsActive    *bool
	Variants    []CreateVariantInput
}

type CreateVariantInput struct {
	Sku      string
	Barcode  string
	Name     string
	Price    int64
	Cost     int64
	IsActive *bool
}

type ProductWithVariants struct {
	Product  sqlc.Product
	Category *sqlc.Category
	Variants []sqlc.Variant
}

func (s *Service) CreateProduct(ctx context.Context, input CreateProductInput) (ProductWithVariants, error) {
	var categoryID pgtype.UUID
	if input.CategoryID != nil {
		if err := categoryID.Scan(*input.CategoryID); err != nil {
			return ProductWithVariants{}, fmt.Errorf("invalid category_id: %w", err)
		}
		// Verify category exists
		if _, err := s.db.GetCategory(ctx, categoryID); err != nil {
			return ProductWithVariants{}, ErrCategoryNotFound
		}
	}

	var desc pgtype.Text
	if input.Description != "" {
		desc.String = input.Description
		desc.Valid = true
	}

	var imageURL pgtype.Text
	if input.ImageURL != "" {
		imageURL.String = input.ImageURL
		imageURL.Valid = true
	}

	isActive := pgtype.Bool{Valid: true, Bool: true}
	if input.IsActive != nil {
		isActive.Bool = *input.IsActive
	}

	product, err := s.db.CreateProduct(ctx, sqlc.CreateProductParams{
		Name:        input.Name,
		Description: desc,
		CategoryID:  categoryID,
		ImageUrl:    imageURL,
		IsActive:    isActive,
	})
	if err != nil {
		return ProductWithVariants{}, fmt.Errorf("creating product: %w", err)
	}

	// Create initial variants if provided
	variants := make([]sqlc.Variant, 0)
	for _, v := range input.Variants {
		// Validate SKU uniqueness
		skuExists, err := s.db.CheckSKUExists(ctx, sqlc.CheckSKUExistsParams{
			Sku:     v.Sku,
			Column2: pgtype.UUID{},
		})
		if err != nil {
			return ProductWithVariants{}, fmt.Errorf("checking SKU: %w", err)
		}
		if skuExists {
			return ProductWithVariants{}, ErrSKUExists
		}

		// Validate barcode uniqueness (if provided)
		if v.Barcode != "" {
			barcodeExists, err := s.db.CheckBarcodeExists(ctx, sqlc.CheckBarcodeExistsParams{
				Barcode: pgtype.Text{String: v.Barcode, Valid: true},
				Column2: pgtype.UUID{},
			})
			if err != nil {
				return ProductWithVariants{}, fmt.Errorf("checking barcode: %w", err)
			}
			if barcodeExists {
				return ProductWithVariants{}, ErrBarcodeExists
			}
		}

		var barcode pgtype.Text
		if v.Barcode != "" {
			barcode.String = v.Barcode
			barcode.Valid = true
		}

		var cost pgtype.Int8
		if v.Cost > 0 {
			cost.Int64 = v.Cost
			cost.Valid = true
		}

		variantIsActive := pgtype.Bool{Valid: true, Bool: true}
		if v.IsActive != nil {
			variantIsActive.Bool = *v.IsActive
		}

		variant, err := s.db.CreateVariant(ctx, sqlc.CreateVariantParams{
			ProductID: product.ID,
			Sku:       v.Sku,
			Barcode:   barcode,
			Name:      v.Name,
			Price:     v.Price,
			Cost:      cost,
			IsActive:  variantIsActive,
		})
		if err != nil {
			return ProductWithVariants{}, fmt.Errorf("creating variant: %w", err)
		}
		variants = append(variants, variant)
	}

	// Get category info if present
	var category *sqlc.Category
	if product.CategoryID.Valid {
		cat, err := s.db.GetCategory(ctx, product.CategoryID)
		if err == nil {
			category = &cat
		}
	}

	return ProductWithVariants{
		Product:  product,
		Category: category,
		Variants: variants,
	}, nil
}

func (s *Service) GetProduct(ctx context.Context, id string) (ProductWithVariants, error) {
	var uuid pgtype.UUID
	if err := uuid.Scan(id); err != nil {
		return ProductWithVariants{}, fmt.Errorf("invalid product id: %w", err)
	}

	product, err := s.db.GetProduct(ctx, uuid)
	if err != nil {
		return ProductWithVariants{}, ErrProductNotFound
	}

	variants, err := s.db.ListVariantsByProductID(ctx, uuid)
	if err != nil {
		return ProductWithVariants{}, fmt.Errorf("getting variants: %w", err)
	}

	// Get category info if present
	var category *sqlc.Category
	if product.CategoryID.Valid {
		cat, err := s.db.GetCategory(ctx, product.CategoryID)
		if err == nil {
			category = &cat
		}
	}

	return ProductWithVariants{
		Product:  product,
		Category: category,
		Variants: variants,
	}, nil
}

type ListProductsInput struct {
	CategoryID *string
	IsActive   *bool
}

func (s *Service) ListProducts(ctx context.Context, input ListProductsInput) ([]ProductWithVariants, error) {
	var categoryID pgtype.UUID
	if input.CategoryID != nil {
		if err := categoryID.Scan(*input.CategoryID); err != nil {
			return nil, fmt.Errorf("invalid category_id: %w", err)
		}
	}

	isActive := false
	if input.IsActive != nil {
		isActive = *input.IsActive
	}

	products, err := s.db.ListProducts(ctx, sqlc.ListProductsParams{
		Column1: categoryID,
		Column2: isActive,
	})
	if err != nil {
		return nil, fmt.Errorf("listing products: %w", err)
	}

	result := make([]ProductWithVariants, 0, len(products))
	for _, p := range products {
		variants, err := s.db.ListVariantsByProductID(ctx, p.ID)
		if err != nil {
			return nil, fmt.Errorf("getting variants for product %s: %w", p.ID, err)
		}

		var category *sqlc.Category
		if p.CategoryID.Valid {
			cat, err := s.db.GetCategory(ctx, p.CategoryID)
			if err == nil {
				category = &cat
			}
		}

		result = append(result, ProductWithVariants{
			Product:  p,
			Category: category,
			Variants: variants,
		})
	}

	return result, nil
}

func (s *Service) UpdateProduct(ctx context.Context, id string, input CreateProductInput) (ProductWithVariants, error) {
	var uuid pgtype.UUID
	if err := uuid.Scan(id); err != nil {
		return ProductWithVariants{}, fmt.Errorf("invalid product id: %w", err)
	}

	var categoryID pgtype.UUID
	if input.CategoryID != nil {
		if err := categoryID.Scan(*input.CategoryID); err != nil {
			return ProductWithVariants{}, fmt.Errorf("invalid category_id: %w", err)
		}
	}

	var desc pgtype.Text
	if input.Description != "" {
		desc.String = input.Description
		desc.Valid = true
	}

	var imageURL pgtype.Text
	if input.ImageURL != "" {
		imageURL.String = input.ImageURL
		imageURL.Valid = true
	}

	isActive := pgtype.Bool{Valid: true, Bool: true}
	if input.IsActive != nil {
		isActive.Bool = *input.IsActive
	}

	product, err := s.db.UpdateProduct(ctx, sqlc.UpdateProductParams{
		ID:          uuid,
		Name:        input.Name,
		Description: desc,
		CategoryID:  categoryID,
		ImageUrl:    imageURL,
		IsActive:    isActive,
	})
	if err != nil {
		return ProductWithVariants{}, ErrProductNotFound
	}

	variants, err := s.db.ListVariantsByProductID(ctx, uuid)
	if err != nil {
		return ProductWithVariants{}, fmt.Errorf("getting variants: %w", err)
	}

	// Get category info if present
	var category *sqlc.Category
	if product.CategoryID.Valid {
		cat, err := s.db.GetCategory(ctx, product.CategoryID)
		if err == nil {
			category = &cat
		}
	}

	return ProductWithVariants{
		Product:  product,
		Category: category,
		Variants: variants,
	}, nil
}

// Variant operations

func (s *Service) CreateVariant(ctx context.Context, productID string, input CreateVariantInput) (sqlc.Variant, error) {
	var prodUUID pgtype.UUID
	if err := prodUUID.Scan(productID); err != nil {
		return sqlc.Variant{}, fmt.Errorf("invalid product_id: %w", err)
	}

	// Verify product exists
	if _, err := s.db.GetProduct(ctx, prodUUID); err != nil {
		return sqlc.Variant{}, ErrProductNotFound
	}

	// Validate SKU uniqueness
	skuExists, err := s.db.CheckSKUExists(ctx, sqlc.CheckSKUExistsParams{
		Sku:     input.Sku,
		Column2: pgtype.UUID{},
	})
	if err != nil {
		return sqlc.Variant{}, fmt.Errorf("checking SKU: %w", err)
	}
	if skuExists {
		return sqlc.Variant{}, ErrSKUExists
	}

	// Validate barcode uniqueness (if provided)
	if input.Barcode != "" {
		barcodeExists, err := s.db.CheckBarcodeExists(ctx, sqlc.CheckBarcodeExistsParams{
			Barcode: pgtype.Text{String: input.Barcode, Valid: true},
			Column2: pgtype.UUID{},
		})
		if err != nil {
			return sqlc.Variant{}, fmt.Errorf("checking barcode: %w", err)
		}
		if barcodeExists {
			return sqlc.Variant{}, ErrBarcodeExists
		}
	}

	var barcode pgtype.Text
	if input.Barcode != "" {
		barcode.String = input.Barcode
		barcode.Valid = true
	}

	var cost pgtype.Int8
	if input.Cost > 0 {
		cost.Int64 = input.Cost
		cost.Valid = true
	}

	variantIsActive := pgtype.Bool{Valid: true, Bool: true}
	if input.IsActive != nil {
		variantIsActive.Bool = *input.IsActive
	}

	return s.db.CreateVariant(ctx, sqlc.CreateVariantParams{
		ProductID: prodUUID,
		Sku:       input.Sku,
		Barcode:   barcode,
		Name:      input.Name,
		Price:     input.Price,
		Cost:      cost,
		IsActive:  variantIsActive,
	})
}

func (s *Service) SearchVariant(ctx context.Context, query string) (sqlc.SearchVariantRow, error) {
	return s.db.SearchVariant(ctx, pgtype.Text{String: query, Valid: true})
}

// Ensure errors are visible to callers
func IsSKUExists(err error) bool {
	return errors.Is(err, ErrSKUExists)
}

func IsBarcodeExists(err error) bool {
	return errors.Is(err, ErrBarcodeExists)
}

func IsProductNotFound(err error) bool {
	return errors.Is(err, ErrProductNotFound)
}