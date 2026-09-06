package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

const (
	EnvDevelopment = "development"
	EnvProduction  = "production"
	EnvTest        = "test"

	DefaultDevDatabaseURL  = "postgres://openpos:openpos@localhost:5432/openpos?sslmode=disable"
	DefaultDevJWTSecret    = "dev-secret-change-in-production"
	DefaultListenPort      = "8080"
	minProductionSecretLen = 32
)

var insecureJWTSecrets = map[string]struct{}{
	"":                                    {},
	"openpos-secret-change-in-production": {},
	"dev-secret-change-in-production":     {},
	"secret":                              {},
	"changeme":                            {},
}

// Config is the process runtime configuration loaded from the environment.
type Config struct {
	AppEnv                  string
	Port                    string
	ListenAddr              string
	DatabaseURL             string
	JWTSecret               string
	FrontendOrigins         []string
	UploadsDir              string
	AllowPublicRegistration bool
	StoreName               string
	UsingDevJWTSecret       bool
}

func (c *Config) IsProduction() bool {
	return c.AppEnv == EnvProduction
}

// Load reads environment variables and rejects insecure production defaults.
func Load() (*Config, error) {
	appEnv := normalizeEnv(firstNonEmpty(os.Getenv("APP_ENV"), os.Getenv("ENV"), EnvDevelopment))
	if appEnv != EnvDevelopment && appEnv != EnvProduction && appEnv != EnvTest {
		return nil, fmt.Errorf("invalid APP_ENV %q: must be development, production, or test", appEnv)
	}

	cfg := &Config{
		AppEnv:     appEnv,
		Port:       firstNonEmpty(os.Getenv("PORT"), DefaultListenPort),
		UploadsDir: firstNonEmpty(os.Getenv("UPLOADS_DIR"), "uploads"),
		StoreName:  firstNonEmpty(os.Getenv("STORE_NAME"), "OpenPOS"),
	}
	cfg.ListenAddr = "0.0.0.0:" + cfg.Port

	if err := cfg.loadDatabaseURL(); err != nil {
		return nil, err
	}
	if err := cfg.loadJWTSecret(); err != nil {
		return nil, err
	}
	if err := cfg.loadFrontendOrigins(); err != nil {
		return nil, err
	}
	cfg.loadRegistrationPolicy()

	return cfg, nil
}

func (c *Config) loadDatabaseURL() error {
	c.DatabaseURL = os.Getenv("DATABASE_URL")
	if c.DatabaseURL != "" {
		return nil
	}
	if c.IsProduction() {
		return fmt.Errorf("DATABASE_URL is required when APP_ENV=production")
	}
	c.DatabaseURL = DefaultDevDatabaseURL
	return nil
}

func (c *Config) loadJWTSecret() error {
	c.JWTSecret = os.Getenv("JWT_SECRET")
	if c.IsProduction() {
		if _, insecure := insecureJWTSecrets[c.JWTSecret]; insecure {
			return fmt.Errorf("JWT_SECRET is required when APP_ENV=production and must not be a known development default")
		}
		if len(c.JWTSecret) < minProductionSecretLen {
			return fmt.Errorf("JWT_SECRET must be at least %d characters when APP_ENV=production", minProductionSecretLen)
		}
		return nil
	}
	if c.JWTSecret == "" {
		c.JWTSecret = DefaultDevJWTSecret
	}
	_, c.UsingDevJWTSecret = insecureJWTSecrets[c.JWTSecret]
	return nil
}

func (c *Config) loadFrontendOrigins() error {
	raw := firstNonEmpty(os.Getenv("FRONTEND_ORIGINS"), os.Getenv("FRONTEND_ORIGIN"))
	origins := splitOrigins(raw)
	if len(origins) == 0 {
		if c.IsProduction() {
			return fmt.Errorf("FRONTEND_ORIGIN is required when APP_ENV=production")
		}
		origins = []string{"http://localhost:5173", "http://localhost:4173"}
	} else if !c.IsProduction() && !containsOrigin(origins, "http://localhost:4173") {
		origins = append(origins, "http://localhost:4173")
	}
	c.FrontendOrigins = origins
	return nil
}

func (c *Config) loadRegistrationPolicy() {
	if raw := os.Getenv("ALLOW_PUBLIC_REGISTRATION"); raw != "" {
		c.AllowPublicRegistration, _ = strconv.ParseBool(raw)
		return
	}
	c.AllowPublicRegistration = !c.IsProduction()
}

func normalizeEnv(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "prod", "production":
		return EnvProduction
	case "test":
		return EnvTest
	default:
		return EnvDevelopment
	}
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}

func splitOrigins(raw string) []string {
	if raw == "" {
		return nil
	}
	parts := strings.Split(raw, ",")
	origins := make([]string, 0, len(parts))
	seen := make(map[string]struct{}, len(parts))
	for _, part := range parts {
		origin := strings.TrimSpace(part)
		if origin == "" {
			continue
		}
		if _, ok := seen[origin]; ok {
			continue
		}
		seen[origin] = struct{}{}
		origins = append(origins, origin)
	}
	return origins
}

func containsOrigin(origins []string, want string) bool {
	for _, origin := range origins {
		if origin == want {
			return true
		}
	}
	return false
}
