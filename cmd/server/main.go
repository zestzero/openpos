package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/zestzero/openpos/internal/config"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("invalid configuration: %v", err)
	}
	if cfg.UsingDevJWTSecret {
		log.Println("WARNING: using a known development JWT secret; set JWT_SECRET before any shared deploy")
	}

	ctx := context.Background()
	log.Println("Bootstrapping application...")
	pool, err := bootstrapApp(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("bootstrap failed: %v", err)
	}
	defer pool.Close()

	r := buildRouter(cfg, pool)

	log.Printf("Starting server on %s (APP_ENV=%s)", cfg.ListenAddr, cfg.AppEnv)
	srv := &http.Server{
		Addr:              cfg.ListenAddr,
		Handler:           r,
		ReadTimeout:       10 * time.Second,
		ReadHeaderTimeout: 5 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	log.Printf("Server started at http://localhost:%s", cfg.Port)
	log.Printf("Health check: curl http://localhost:%s/health", cfg.Port)
	log.Printf("Readiness check: curl http://localhost:%s/ready", cfg.Port)

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("Server shutdown error: %v", err)
	}
}
