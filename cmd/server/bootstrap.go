package main

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/zestzero/openpos/db/sqlc"
	"github.com/zestzero/openpos/internal/auth"
	"github.com/zestzero/openpos/internal/catalog"
	"github.com/zestzero/openpos/internal/inventory"
	appmiddleware "github.com/zestzero/openpos/internal/middleware"
	"github.com/zestzero/openpos/internal/reporting"
	"github.com/zestzero/openpos/internal/sales"
)

var runMigrations = func(ctx context.Context, databaseURL string) error {
	m, err := migrate.New("file://db/migrations", databaseURL)
	if err != nil {
		return fmt.Errorf("creating migrator: %w", err)
	}
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("applying migrations: %w", err)
	}
	return nil
}

var openDatabasePool = func(ctx context.Context, databaseURL string) (*pgxpool.Pool, error) {
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, fmt.Errorf("unable to connect to database: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("unable to ping database: %w", err)
	}
	return pool, nil
}

type salesPoolSetter interface {
	SetPool(*pgxpool.Pool)
}

func bootstrapApp(ctx context.Context, databaseURL string) (*pgxpool.Pool, error) {
	if err := runMigrations(ctx, databaseURL); err != nil {
		return nil, err
	}
	return openDatabasePool(ctx, databaseURL)
}

func mountSalesRoutes(r chi.Router, pool *pgxpool.Pool, salesService salesPoolSetter, routes http.Handler) {
	salesService.SetPool(pool)
	r.Mount("/orders", routes)
}

func buildRouter(pool *pgxpool.Pool) chi.Router {
	r := chi.NewRouter()
	r.Use(appmiddleware.CORSMiddleware(&appmiddleware.CORSConfig{
		AllowedOrigins: []string{
			getEnv("FRONTEND_ORIGIN", "http://localhost:5173"),
			"http://localhost:4173",
		},
	}))
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})

	authConfig := &auth.Config{
		JWTSecret:         getEnv("JWT_SECRET", "openpos-secret-change-in-production"),
		AccessTokenExpiry: 24 * time.Hour,
	}
	authService := auth.NewAuthService(pool, authConfig)
	authHandler := auth.NewHandler(authService)
	r.Mount("/api/auth", authHandler.Router())

	protected := chi.NewRouter()
	protected.Use(appmiddleware.AuthMiddleware(&appmiddleware.AuthConfig{JWTSecret: authConfig.JWTSecret}))

	catalogService := catalog.NewService(pool)
	catalogHandler := catalog.NewHandler(catalogService)
	protected.Mount("/catalog", catalogHandler.Routes())

	inventoryService := inventory.NewService(pool)
	inventoryHandler := inventory.NewHandler(inventoryService)
	protected.Mount("/inventory", inventoryHandler.Routes())

	salesService := sales.NewService(sales.NewOrderStore(sqlc.New(pool)), sales.NewInventoryGateway(inventoryService))
	salesHandler := sales.NewHandler(salesService)
	mountSalesRoutes(protected, pool, salesService, salesHandler.Routes())

	reportingService := reporting.NewService(sqlc.New(pool))
	reportingHandler := reporting.NewHandler(reportingService)
	protected.Mount("/reports", reportingHandler.Routes())

	r.Mount("/api", protected)
	return r
}
