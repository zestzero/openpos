package main

import (
	"context"
	"errors"
	"net/http"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

func TestBootstrap(t *testing.T) {
	origRunMigrations := runMigrations
	origOpenDatabasePool := openDatabasePool
	t.Cleanup(func() {
		runMigrations = origRunMigrations
		openDatabasePool = origOpenDatabasePool
	})

	t.Run("returns migration errors", func(t *testing.T) {
		runMigrations = func(context.Context, string) error { return errors.New("migration failed") }
		openDatabasePool = func(context.Context, string) (*pgxpool.Pool, error) {
			t.Fatal("openDatabasePool should not be called when migrations fail")
			return nil, nil
		}

		pool, err := bootstrapApp(context.Background(), "postgres://example")
		if err == nil || err.Error() != "migration failed" {
			t.Fatalf("expected migration failure, got pool=%v err=%v", pool, err)
		}
	})

	t.Run("returns database init errors", func(t *testing.T) {
		runMigrations = func(context.Context, string) error { return nil }
		openDatabasePool = func(context.Context, string) (*pgxpool.Pool, error) {
			return nil, errors.New("connect failed")
		}

		pool, err := bootstrapApp(context.Background(), "postgres://example")
		if err == nil || err.Error() != "connect failed" {
			t.Fatalf("expected connection failure, got pool=%v err=%v", pool, err)
		}
	})

	t.Run("sets the sales pool before mounting orders", func(t *testing.T) {
		runMigrations = func(context.Context, string) error { return nil }
		openDatabasePool = func(context.Context, string) (*pgxpool.Pool, error) {
			return &pgxpool.Pool{}, nil
		}

		pool, err := bootstrapApp(context.Background(), "postgres://example")
		if err != nil {
			t.Fatalf("bootstrapApp returned error: %v", err)
		}

		fakeSales := &fakeSalesPoolSetter{}
		router := chi.NewRouter()
		mountSalesRoutes(router, pool, fakeSales, http.HandlerFunc(func(http.ResponseWriter, *http.Request) {}))

		if fakeSales.setCalls != 1 {
			t.Fatalf("expected SetPool to be called once, got %d", fakeSales.setCalls)
		}
		if fakeSales.pool != pool {
			t.Fatalf("expected mounted sales route to receive bootstrap pool")
		}
	})
}

type fakeSalesPoolSetter struct {
	pool     *pgxpool.Pool
	setCalls int
}

func (f *fakeSalesPoolSetter) SetPool(pool *pgxpool.Pool) {
	f.pool = pool
	f.setCalls++
}
