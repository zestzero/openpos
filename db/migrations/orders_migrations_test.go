package migrations

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestOrderMigrationsExistAndDeclareConstraints(t *testing.T) {
	files := []struct {
		path string
		want []string
	}{
		{
			path: "005_create_orders.up.sql",
			want: []string{"CREATE TABLE orders", "client_uuid", "UNIQUE", "total_amount BIGINT", "user_id UUID NOT NULL REFERENCES users(id)"},
		},
		{
			path: "005_create_orders.down.sql",
			want: []string{"DROP TABLE IF EXISTS orders"},
		},
		{
			path: "006_create_order_items.up.sql",
			want: []string{"CREATE TABLE order_items", "order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE", "variant_id UUID NOT NULL REFERENCES variants(id)", "subtotal BIGINT"},
		},
		{
			path: "006_create_order_items.down.sql",
			want: []string{"DROP TABLE IF EXISTS order_items"},
		},
	}

	for _, tc := range files {
		t.Run(tc.path, func(t *testing.T) {
			b, err := os.ReadFile(filepath.Join(".", tc.path))
			if err != nil {
				t.Fatalf("read migration: %v", err)
			}

			content := string(b)
			for _, want := range tc.want {
				if !strings.Contains(content, want) {
					t.Fatalf("%s missing %q", tc.path, want)
				}
			}
		})
	}

	ordersDown, err := os.ReadFile(filepath.Join(".", "005_create_orders.down.sql"))
	if err != nil {
		t.Fatalf("read down migration: %v", err)
	}
	if !strings.Contains(string(ordersDown), "DROP TABLE IF EXISTS orders") {
		t.Fatalf("orders down migration must drop orders table")
	}

	itemsDown, err := os.ReadFile(filepath.Join(".", "006_create_order_items.down.sql"))
	if err != nil {
		t.Fatalf("read down migration: %v", err)
	}
	if !strings.Contains(string(itemsDown), "DROP TABLE IF EXISTS order_items") {
		t.Fatalf("order items down migration must drop order_items table")
	}
}
