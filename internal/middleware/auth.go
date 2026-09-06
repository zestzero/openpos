package middleware

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/golang-jwt/jwt/v5"

	"github.com/zestzero/openpos/internal/auth"
)

// AuthConfig holds auth middleware configuration
type AuthConfig struct {
	JWTSecret string
}

// AuthMiddleware creates authentication middleware
func AuthMiddleware(config *AuthConfig) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, "missing authorization header", http.StatusUnauthorized)
				return
			}

			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				http.Error(w, "invalid authorization header", http.StatusUnauthorized)
				return
			}

			tokenString := parts[1]

			token, err := jwt.ParseWithClaims(tokenString, &auth.TokenClaims{}, func(token *jwt.Token) (interface{}, error) {
				if token.Method != jwt.SigningMethodHS256 {
					return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
				}
				return []byte(config.JWTSecret), nil
			})

			if err != nil || !token.Valid {
				http.Error(w, "invalid or expired token", http.StatusUnauthorized)
				return
			}

			claims, ok := token.Claims.(*auth.TokenClaims)
			if !ok {
				http.Error(w, "invalid token claims", http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), auth.UserIDKey, claims.UserID)
			ctx = context.WithValue(ctx, auth.UserEmailKey, claims.Email)
			ctx = context.WithValue(ctx, auth.UserRoleKey, claims.Role)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireRole creates a role-based access control middleware
func RequireRole(allowedRoles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role := auth.UserRoleFromContext(r.Context())
			if role == "" {
				http.Error(w, "unauthorized", http.StatusUnauthorized)
				return
			}

			for _, allowedRole := range allowedRoles {
				if role == allowedRole {
					next.ServeHTTP(w, r)
					return
				}
			}

			http.Error(w, "forbidden - insufficient permissions", http.StatusForbidden)
		})
	}
}

// GetUserID extracts user ID from context
func GetUserID(ctx context.Context) string {
	return auth.UserIDFromContext(ctx)
}

// GetUserRole extracts user role from context
func GetUserRole(ctx context.Context) string {
	return auth.UserRoleFromContext(ctx)
}

// GetUserEmail extracts user email from context
func GetUserEmail(ctx context.Context) string {
	return auth.UserEmailFromContext(ctx)
}

// RouterParam helper to extract path parameters
func RouterParam(r *http.Request, key string) string {
	return chi.URLParam(r, key)
}
