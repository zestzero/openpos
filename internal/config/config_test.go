package config

import (
	"strings"
	"testing"
)

func TestLoadDevelopmentDefaults(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	t.Setenv("DATABASE_URL", "")
	t.Setenv("JWT_SECRET", "")
	t.Setenv("FRONTEND_ORIGIN", "")
	t.Setenv("FRONTEND_ORIGINS", "")
	t.Setenv("ALLOW_PUBLIC_REGISTRATION", "")
	t.Setenv("PORT", "")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error: %v", err)
	}
	if cfg.IsProduction() {
		t.Fatal("expected development environment")
	}
	if cfg.DatabaseURL != DefaultDevDatabaseURL {
		t.Fatalf("unexpected database url %q", cfg.DatabaseURL)
	}
	if cfg.JWTSecret != DefaultDevJWTSecret {
		t.Fatalf("unexpected jwt secret %q", cfg.JWTSecret)
	}
	if !cfg.UsingDevJWTSecret {
		t.Fatal("expected development JWT secret to be flagged")
	}
	if !cfg.AllowPublicRegistration {
		t.Fatal("expected public registration enabled in development")
	}
	if cfg.ListenAddr != "0.0.0.0:8080" {
		t.Fatalf("unexpected listen addr %q", cfg.ListenAddr)
	}
	if len(cfg.FrontendOrigins) != 2 {
		t.Fatalf("expected default vite origins, got %v", cfg.FrontendOrigins)
	}
}

func TestLoadProductionRejectsMissingAndInsecureSecrets(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	t.Setenv("DATABASE_URL", "")
	t.Setenv("JWT_SECRET", DefaultDevJWTSecret)
	t.Setenv("FRONTEND_ORIGIN", "https://pos.example.com")

	if _, err := Load(); err == nil || !strings.Contains(err.Error(), "DATABASE_URL") {
		t.Fatalf("expected DATABASE_URL error, got %v", err)
	}

	t.Setenv("DATABASE_URL", "postgres://openpos:secret@db:5432/openpos?sslmode=require")
	if _, err := Load(); err == nil || !strings.Contains(err.Error(), "JWT_SECRET") {
		t.Fatalf("expected JWT_SECRET default error, got %v", err)
	}

	t.Setenv("JWT_SECRET", "short-secret")
	if _, err := Load(); err == nil || !strings.Contains(err.Error(), "at least") {
		t.Fatalf("expected JWT_SECRET length error, got %v", err)
	}

	t.Setenv("JWT_SECRET", "abcdefghijklmnopqrstuvwxyz012345")
	t.Setenv("FRONTEND_ORIGIN", "")
	t.Setenv("FRONTEND_ORIGINS", "")
	if _, err := Load(); err == nil || !strings.Contains(err.Error(), "FRONTEND_ORIGIN") {
		t.Fatalf("expected FRONTEND_ORIGIN error, got %v", err)
	}
}

func TestLoadProductionAcceptsExplicitValues(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	t.Setenv("DATABASE_URL", "postgres://openpos:secret@db:5432/openpos?sslmode=require")
	t.Setenv("JWT_SECRET", "abcdefghijklmnopqrstuvwxyz012345")
	t.Setenv("FRONTEND_ORIGINS", "https://pos.example.com, https://erp.example.com")
	t.Setenv("ALLOW_PUBLIC_REGISTRATION", "")
	t.Setenv("PORT", "9090")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error: %v", err)
	}
	if !cfg.IsProduction() {
		t.Fatal("expected production environment")
	}
	if cfg.AllowPublicRegistration {
		t.Fatal("expected public registration disabled in production")
	}
	if cfg.ListenAddr != "0.0.0.0:9090" {
		t.Fatalf("unexpected listen addr %q", cfg.ListenAddr)
	}
	if cfg.UsingDevJWTSecret {
		t.Fatal("did not expect development JWT flag")
	}
	if got, want := len(cfg.FrontendOrigins), 2; got != want {
		t.Fatalf("expected %d origins, got %v", want, cfg.FrontendOrigins)
	}
}

func TestLoadHonorsRegistrationOverride(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	t.Setenv("DATABASE_URL", "postgres://openpos:secret@db:5432/openpos?sslmode=require")
	t.Setenv("JWT_SECRET", "abcdefghijklmnopqrstuvwxyz012345")
	t.Setenv("FRONTEND_ORIGIN", "https://pos.example.com")
	t.Setenv("ALLOW_PUBLIC_REGISTRATION", "true")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error: %v", err)
	}
	if !cfg.AllowPublicRegistration {
		t.Fatal("expected ALLOW_PUBLIC_REGISTRATION=true to win")
	}
}
