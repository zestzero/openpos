package catalog

import (
	"context"
	"bytes"
	"net/http"
	"net/http/httptest"
	"reflect"
	"strings"
	"testing"

	"github.com/zestzero/openpos/db/sqlc"
)

func TestReorderCategories(t *testing.T) {
	svc := &fakeReorderService{}
	h := NewHandler(svc)

	req := httptest.NewRequest(http.MethodPut, "/categories/reorder", strings.NewReader(`{"ids":["11111111-1111-1111-1111-111111111111","22222222-2222-2222-2222-222222222222"]}`))
	rr := httptest.NewRecorder()

	h.Routes().ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d", rr.Code)
	}
	want := []string{"11111111-1111-1111-1111-111111111111", "22222222-2222-2222-2222-222222222222"}
	if !reflect.DeepEqual(svc.reorderedIDs, want) {
		t.Fatalf("expected reordered ids %v, got %v", want, svc.reorderedIDs)
	}
}

func TestReorderCategoriesRejectsInvalidPayload(t *testing.T) {
	svc := &fakeReorderService{}
	h := NewHandler(svc)

	req := httptest.NewRequest(http.MethodPut, "/categories/reorder", bytes.NewBufferString(`{"ids":[]}`))
	rr := httptest.NewRecorder()

	h.Routes().ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 Bad Request, got %d", rr.Code)
	}
	if len(svc.reorderedIDs) != 0 {
		t.Fatalf("expected reorder service not to be called, got %v", svc.reorderedIDs)
	}
}

func TestImportProducts(t *testing.T) {
	svc := &fakeReorderService{}
	h := NewHandler(svc)

	req := httptest.NewRequest(http.MethodPost, "/import", strings.NewReader(`{"products":[{"name":"Green Tea","description":"","category_id":null,"image_url":null,"is_active":true,"variants":[{"sku":"GT-LARGE","barcode":"ERP-GREEN-TEA-LARGE-CUP","name":"Large Cup","price":12900,"cost":null,"is_active":true}]}]}`))
	rr := httptest.NewRecorder()

	h.Routes().ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d", rr.Code)
	}
	if len(svc.importedProducts) != 1 {
		t.Fatalf("expected one imported product, got %d", len(svc.importedProducts))
	}
	if svc.importedProducts[0].Name != "Green Tea" {
		t.Fatalf("expected imported product name Green Tea, got %s", svc.importedProducts[0].Name)
	}
	if len(svc.importedProducts[0].Variants) != 1 {
		t.Fatalf("expected one imported variant, got %d", len(svc.importedProducts[0].Variants))
	}
}

func TestImportProductsRejectsEmptyPayload(t *testing.T) {
	svc := &fakeReorderService{}
	h := NewHandler(svc)

	req := httptest.NewRequest(http.MethodPost, "/import", strings.NewReader(`{"products":[]}`))
	rr := httptest.NewRecorder()

	h.Routes().ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 Bad Request, got %d", rr.Code)
	}
	if len(svc.importedProducts) != 0 {
		t.Fatalf("expected no imported products, got %d", len(svc.importedProducts))
	}
}

type fakeReorderService struct {
	reorderedIDs []string
	importedProducts []CreateProductInput
}

func (f *fakeReorderService) ListCategories(context.Context) ([]sqlc.Category, error) { return nil, nil }
func (f *fakeReorderService) CreateCategory(context.Context, CreateCategoryInput) (sqlc.Category, error) {
	return sqlc.Category{}, nil
}
func (f *fakeReorderService) GetCategory(context.Context, string) (sqlc.Category, error) { return sqlc.Category{}, nil }
func (f *fakeReorderService) UpdateCategory(context.Context, string, CreateCategoryInput) (sqlc.Category, error) {
	return sqlc.Category{}, nil
}
func (f *fakeReorderService) ListProducts(context.Context, ListProductsInput) ([]ProductWithVariants, error) {
	return nil, nil
}
func (f *fakeReorderService) CreateProduct(context.Context, CreateProductInput) (ProductWithVariants, error) {
	return ProductWithVariants{}, nil
}
func (f *fakeReorderService) ImportProducts(_ context.Context, inputs []CreateProductInput) ([]ProductWithVariants, error) {
	f.importedProducts = append([]CreateProductInput(nil), inputs...)
	return nil, nil
}
func (f *fakeReorderService) GetProduct(context.Context, string) (ProductWithVariants, error) {
	return ProductWithVariants{}, nil
}
func (f *fakeReorderService) UpdateProduct(context.Context, string, CreateProductInput) (ProductWithVariants, error) {
	return ProductWithVariants{}, nil
}
func (f *fakeReorderService) CreateVariant(context.Context, string, CreateVariantInput) (sqlc.Variant, error) {
	return sqlc.Variant{}, nil
}
func (f *fakeReorderService) SearchVariant(context.Context, string) (sqlc.SearchVariantRow, error) {
	return sqlc.SearchVariantRow{}, nil
}

func (f *fakeReorderService) ReorderCategories(_ context.Context, orderedIDs []string) error {
	f.reorderedIDs = append([]string(nil), orderedIDs...)
	return nil
}
