package catalog

import (
	"testing"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/zestzero/openpos/db/sqlc"
)

func TestNextCategorySortOrder(t *testing.T) {
	categories := []sqlc.Category{
		{ID: uuid("11111111-1111-1111-1111-111111111111"), Name: "Drinks", SortOrder: 2},
		{ID: uuid("22222222-2222-2222-2222-222222222222"), Name: "Snacks", SortOrder: 7},
	}

	got := nextCategorySortOrder(categories)
	if got != 8 {
		t.Fatalf("expected next sort order 8, got %d", got)
	}
}

func TestDenseCategorySortOrders(t *testing.T) {
	got, err := denseCategorySortOrders([]string{
		"11111111-1111-1111-1111-111111111111",
		"22222222-2222-2222-2222-222222222222",
		"33333333-3333-3333-3333-333333333333",
	})
	if err != nil {
		t.Fatalf("denseCategorySortOrders returned error: %v", err)
	}

	want := []categorySortAssignment{
		{ID: "11111111-1111-1111-1111-111111111111", SortOrder: 0},
		{ID: "22222222-2222-2222-2222-222222222222", SortOrder: 1},
		{ID: "33333333-3333-3333-3333-333333333333", SortOrder: 2},
	}
	if len(got) != len(want) {
		t.Fatalf("expected %d assignments, got %d", len(want), len(got))
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("expected assignment %d to be %+v, got %+v", i, want[i], got[i])
		}
	}
}

func uuid(value string) pgtype.UUID {
	var id pgtype.UUID
	_ = id.Scan(value)
	return id
}
