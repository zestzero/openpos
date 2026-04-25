package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"

	"github.com/zestzero/openpos/internal/catalog"
	"github.com/zestzero/openpos/internal/database"
	"github.com/zestzero/openpos/internal/inventory"
)

func main() {
	// Setup database connection
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		databaseURL = "postgres://openpos:openpos@localhost:5432/openpos?sslmode=disable"
	}

	ctx := context.Background()

	// Run migrations
	log.Println("Running database migrations...")
	m, err := migrate.New(
		"file://db/migrations",
		databaseURL,
	)
	if err != nil {
		log.Printf("Migration source error: %v", err)
	} else {
		if err := m.Up(); err != nil && err != migrate.ErrNoChange {
			log.Printf("Migration error: %v", err)
		} else {
			log.Println("Migrations applied successfully")
		}
	}

	// Connect to database using the database package
	log.Println("Connecting to database...")
	pool, err := database.Connect(ctx)
	if err != nil {
		log.Printf("Unable to connect to database: %v", err)
	} else {
		log.Println("Connected to database")
		defer database.Close(pool)
	}

	// Setup chi router
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// Health check endpoint
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})

	// Register domain handlers
	catalogService := catalog.NewService(pool)
	catalogHandler := catalog.NewHandler(catalogService)
	r.Mount("/api/catalog", catalogHandler.Routes())

	inventoryService := inventory.NewService(pool)
	inventoryHandler := inventory.NewHandler(inventoryService)
	r.Mount("/api/inventory", inventoryHandler.Routes())

	// Get port from environment or default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Starting server on port %s", port)
	
	// Create server
	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	// Start server in goroutine
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	log.Printf("Server started at http://localhost:%s", port)
	log.Printf("Health check: curl http://localhost:%s/health", port)

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	// Graceful shutdown
	log.Println("Shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("Server shutdown error: %v", err)
	}
	fmt.Println("Server stopped")
}