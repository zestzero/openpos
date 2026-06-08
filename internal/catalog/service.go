package catalog

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/zestzero/openpos/db/sqlc"
)

var (
	ErrSKUExists        = errors.New("SKU already exists")
	ErrBarcodeExists    = errors.New("barcode already exists")
	ErrProductNotFound  = errors.New("product not found")
	ErrVariantNotFound  = errors.New("variant not found")
	ErrCategoryNotFound = errors.New("category not found")
)

type Service struct {
	pool *pgxpool.Pool
	db   *sqlc.Queries
}

func NewService(pool *pgxpool.Pool) *Service {
	return &Service{
		pool: pool,
		db:   sqlc.New(pool),
	}
}

type categorySortAssignment struct {
	ID        string
	SortOrder int64
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

	sortOrder, err := s.db.GetNextCategorySortOrder(ctx)
	if err != nil {
		return sqlc.Category{}, fmt.Errorf("getting next category sort order: %w", err)
	}

	category, err := s.db.CreateCategory(ctx, sqlc.CreateCategoryParams{
		Name:        input.Name,
		Description: desc,
		ParentID:    parentID,
		SortOrder:   int64(sortOrder),
	})
	if err != nil {
		return sqlc.Category{}, err
	}

	return sqlc.Category{
		ID:          category.ID,
		Name:        category.Name,
		Description: category.Description,
		ParentID:    category.ParentID,
		CreatedAt:   category.CreatedAt,
		UpdatedAt:   category.UpdatedAt,
		SortOrder:   category.SortOrder,
	}, nil
}

func (s *Service) GetCategory(ctx context.Context, id string) (sqlc.Category, error) {
	var uuid pgtype.UUID
	if err := uuid.Scan(id); err != nil {
		return sqlc.Category{}, fmt.Errorf("invalid category id: %w", err)
	}
	category, err := s.db.GetCategory(ctx, uuid)
	if err != nil {
		return sqlc.Category{}, err
	}
	return sqlc.Category{
		ID:          category.ID,
		Name:        category.Name,
		Description: category.Description,
		ParentID:    category.ParentID,
		CreatedAt:   category.CreatedAt,
		UpdatedAt:   category.UpdatedAt,
		SortOrder:   category.SortOrder,
	}, nil
}

func (s *Service) ListCategories(ctx context.Context) ([]sqlc.Category, error) {
	categories, err := s.db.ListCategories(ctx)
	if err != nil {
		return nil, err
	}
	result := make([]sqlc.Category, 0, len(categories))
	for _, category := range categories {
		result = append(result, sqlc.Category{
			ID:          category.ID,
			Name:        category.Name,
			Description: category.Description,
			ParentID:    category.ParentID,
			CreatedAt:   category.CreatedAt,
			UpdatedAt:   category.UpdatedAt,
			SortOrder:   category.SortOrder,
		})
	}
	return result, nil
}

func (s *Service) ReorderCategories(ctx context.Context, orderedIDs []string) error {
	assignments, err := denseCategorySortOrders(orderedIDs)
	if err != nil {
		return err
	}

	existing, err := s.db.ListCategories(ctx)
	if err != nil {
		return fmt.Errorf("listing categories: %w", err)
	}
	if len(existing) != len(assignments) {
		return ErrCategoryNotFound
	}

	existingByID := make(map[string]struct{}, len(existing))
	for _, category := range existing {
		existingByID[category.ID.String()] = struct{}{}
	}
	for _, assignment := range assignments {
		if _, ok := existingByID[assignment.ID]; !ok {
			return ErrCategoryNotFound
		}
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("starting reorder transaction: %w", err)
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	queries := s.db.WithTx(tx)
	for _, assignment := range assignments {
		var id pgtype.UUID
		if err := id.Scan(assignment.ID); err != nil {
			return fmt.Errorf("invalid category id: %w", err)
		}
		if err := queries.UpdateCategorySortOrder(ctx, sqlc.UpdateCategorySortOrderParams{ID: id, SortOrder: assignment.SortOrder}); err != nil {
			return fmt.Errorf("updating category sort order: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("committing reorder transaction: %w", err)
	}

	return nil
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

	category, err := s.db.UpdateCategory(ctx, sqlc.UpdateCategoryParams{
		ID:          uuid,
		Name:        input.Name,
		Description: desc,
		ParentID:    parentID,
	})
	if err != nil {
		return sqlc.Category{}, err
	}

	return sqlc.Category{
		ID:          category.ID,
		Name:        category.Name,
		Description: category.Description,
		ParentID:    category.ParentID,
		CreatedAt:   category.CreatedAt,
		UpdatedAt:   category.UpdatedAt,
		SortOrder:   category.SortOrder,
	}, nil
}

// nextCategorySortOrder keeps category sort_order stable for new ERP inserts.
func nextCategorySortOrder(categories []sqlc.Category) int64 {
	var maxSortOrder int64 = -1
	for _, category := range categories {
		if category.SortOrder > maxSortOrder {
			maxSortOrder = category.SortOrder
		}
	}
	return maxSortOrder + 1
}

// denseCategorySortOrders normalizes the requested sort_order sequence.
func denseCategorySortOrders(orderedIDs []string) ([]categorySortAssignment, error) {
	seen := make(map[string]struct{}, len(orderedIDs))
	assignments := make([]categorySortAssignment, 0, len(orderedIDs))
	for idx, id := range orderedIDs {
		if id == "" {
			return nil, fmt.Errorf("category id is required")
		}
		if _, ok := seen[id]; ok {
			return nil, fmt.Errorf("duplicate category id: %s", id)
		}
		seen[id] = struct{}{}
		assignments = append(assignments, categorySortAssignment{ID: id, SortOrder: int64(idx)})
	}
	return assignments, nil
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
	Product  sqlc.Product       `json:"product"`
	Category *sqlc.Category     `json:"category,omitempty"`
	Variants []VariantWithStock `json:"variants"`
}

type VariantWithStock struct {
	sqlc.Variant
	StockLevel *int64 `json:"stockLevel,omitempty"`
}

func variantsToWithStock(variants []sqlc.Variant, stockLevels map[string]int64) []VariantWithStock {
	result := make([]VariantWithStock, 0, len(variants))
	for _, v := range variants {
		stockLevel := stockLevels[v.ID.String()]
		result = append(result, VariantWithStock{
			Variant:    v,
			StockLevel: &stockLevel,
		})
	}
	return result
}

func (s *Service) stockLevelsForVariants(ctx context.Context, variants []sqlc.Variant) (map[string]int64, error) {
	stockLevels := make(map[string]int64, len(variants))
	if len(variants) == 0 {
		return stockLevels, nil
	}

	variantIDs := make([]pgtype.UUID, 0, len(variants))
	for _, variant := range variants {
		variantIDs = append(variantIDs, variant.ID)
	}

	stockRows, err := s.db.GetStockLevelByVariants(ctx, variantIDs)
	if err != nil {
		return nil, fmt.Errorf("getting stock levels: %w", err)
	}
	for _, row := range stockRows {
		stockLevels[row.VariantID.String()] = row.StockLevel
	}

	return stockLevels, nil
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
			category = &sqlc.Category{
				ID:          cat.ID,
				Name:        cat.Name,
				Description: cat.Description,
				ParentID:    cat.ParentID,
				CreatedAt:   cat.CreatedAt,
				UpdatedAt:   cat.UpdatedAt,
				SortOrder:   cat.SortOrder,
			}
		}
	}

	stockLevels, err := s.stockLevelsForVariants(ctx, variants)
	if err != nil {
		return ProductWithVariants{}, err
	}

	return ProductWithVariants{
		Product:  product,
		Category: category,
		Variants: variantsToWithStock(variants, stockLevels),
	}, nil
}

func (s *Service) ImportProducts(ctx context.Context, inputs []CreateProductInput) ([]ProductWithVariants, error) {
	results := make([]ProductWithVariants, 0, len(inputs))
	for idx, input := range inputs {
		product, err := s.CreateProduct(ctx, input)
		if err != nil {
			return nil, fmt.Errorf("importing product row %d: %w", idx+1, err)
		}
		results = append(results, product)
	}

	return results, nil
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
			category = &sqlc.Category{
				ID:          cat.ID,
				Name:        cat.Name,
				Description: cat.Description,
				ParentID:    cat.ParentID,
				CreatedAt:   cat.CreatedAt,
				UpdatedAt:   cat.UpdatedAt,
				SortOrder:   cat.SortOrder,
			}
		}
	}

	stockLevels, err := s.stockLevelsForVariants(ctx, variants)
	if err != nil {
		return ProductWithVariants{}, err
	}

	return ProductWithVariants{
		Product:  product,
		Category: category,
		Variants: variantsToWithStock(variants, stockLevels),
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

	allVariantIDs := []pgtype.UUID{}
	productVariants := make(map[string][]sqlc.Variant)
	for _, p := range products {
		variants, err := s.db.ListVariantsByProductID(ctx, p.ID)
		if err != nil {
			return nil, fmt.Errorf("getting variants for product %s: %w", p.ID, err)
		}
		productVariants[p.ID.String()] = variants
		for _, v := range variants {
			allVariantIDs = append(allVariantIDs, v.ID)
		}
	}

	stockLevels := make(map[string]int64)
	if len(allVariantIDs) > 0 {
		stockRows, err := s.db.GetStockLevelByVariants(ctx, allVariantIDs)
		if err != nil {
			return nil, fmt.Errorf("getting stock levels: %w", err)
		}
		for _, row := range stockRows {
			stockLevels[row.VariantID.String()] = row.StockLevel
		}
	}

	result := make([]ProductWithVariants, 0, len(products))
	for _, p := range products {
		variants := productVariants[p.ID.String()]

		var category *sqlc.Category
		if p.CategoryID.Valid {
			cat, err := s.db.GetCategory(ctx, p.CategoryID)
			if err == nil {
				category = &sqlc.Category{
					ID:          cat.ID,
					Name:        cat.Name,
					Description: cat.Description,
					ParentID:    cat.ParentID,
					CreatedAt:   cat.CreatedAt,
					UpdatedAt:   cat.UpdatedAt,
					SortOrder:   cat.SortOrder,
				}
			}
		}

		variantsWithStock := make([]VariantWithStock, 0, len(variants))
		for _, v := range variants {
			stockLevel := stockLevels[v.ID.String()]
			variantsWithStock = append(variantsWithStock, VariantWithStock{
				Variant:    v,
				StockLevel: &stockLevel,
			})
		}

		result = append(result, ProductWithVariants{
			Product:  p,
			Category: category,
			Variants: variantsWithStock,
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
			category = &sqlc.Category{
				ID:          cat.ID,
				Name:        cat.Name,
				Description: cat.Description,
				ParentID:    cat.ParentID,
				CreatedAt:   cat.CreatedAt,
				UpdatedAt:   cat.UpdatedAt,
				SortOrder:   cat.SortOrder,
			}
		}
	}

	stockLevels, err := s.stockLevelsForVariants(ctx, variants)
	if err != nil {
		return ProductWithVariants{}, err
	}

	return ProductWithVariants{
		Product:  product,
		Category: category,
		Variants: variantsToWithStock(variants, stockLevels),
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

func (s *Service) UpdateVariant(ctx context.Context, id string, input CreateVariantInput) (sqlc.Variant, error) {
	var uuid pgtype.UUID
	if err := uuid.Scan(id); err != nil {
		return sqlc.Variant{}, fmt.Errorf("invalid variant id: %w", err)
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

	skuExists, err := s.db.CheckSKUExists(ctx, sqlc.CheckSKUExistsParams{
		Sku:     input.Sku,
		Column2: uuid,
	})
	if err != nil {
		return sqlc.Variant{}, fmt.Errorf("checking SKU: %w", err)
	}
	if skuExists {
		return sqlc.Variant{}, ErrSKUExists
	}

	if input.Barcode != "" {
		barcodeExists, err := s.db.CheckBarcodeExists(ctx, sqlc.CheckBarcodeExistsParams{
			Barcode: pgtype.Text{String: input.Barcode, Valid: true},
			Column2: uuid,
		})
		if err != nil {
			return sqlc.Variant{}, fmt.Errorf("checking barcode: %w", err)
		}
		if barcodeExists {
			return sqlc.Variant{}, ErrBarcodeExists
		}
	}

	variant, err := s.db.UpdateVariant(ctx, sqlc.UpdateVariantParams{
		ID:       uuid,
		Sku:      input.Sku,
		Barcode:  barcode,
		Name:     input.Name,
		Price:    input.Price,
		Cost:     cost,
		IsActive: variantIsActive,
	})
	if err != nil {
		return sqlc.Variant{}, ErrVariantNotFound
	}

	return variant, nil
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
