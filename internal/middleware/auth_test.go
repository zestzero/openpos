package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"github.com/zestzero/openpos/internal/auth"
)

const testSecret = "unit-test-jwt-secret-value-32chars"

func TestAuthMiddlewareRejectsMissingAndMalformedHeaders(t *testing.T) {
	handler := AuthMiddleware(&AuthConfig{JWTSecret: testSecret})(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))

	req := httptest.NewRequest(http.MethodGet, "/api/catalog/products", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for missing header, got %d", rec.Code)
	}

	req = httptest.NewRequest(http.MethodGet, "/api/catalog/products", nil)
	req.Header.Set("Authorization", "token-without-bearer")
	rec = httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for malformed header, got %d", rec.Code)
	}
}

func TestAuthMiddlewareAcceptsHS256AndRejectsUnexpectedAlg(t *testing.T) {
	okHandler := AuthMiddleware(&AuthConfig{JWTSecret: testSecret})(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if GetUserID(r.Context()) != "user-1" || GetUserRole(r.Context()) != "owner" {
			t.Fatalf("expected claims in context")
		}
		w.WriteHeader(http.StatusNoContent)
	}))

	req := httptest.NewRequest(http.MethodGet, "/api/catalog/products", nil)
	req.Header.Set("Authorization", "Bearer "+mustSignToken(t, jwt.SigningMethodHS256, []byte(testSecret), "owner"))
	rec := httptest.NewRecorder()
	okHandler.ServeHTTP(rec, req)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected valid HS256 token to pass, got %d", rec.Code)
	}

	req = httptest.NewRequest(http.MethodGet, "/api/catalog/products", nil)
	req.Header.Set("Authorization", "Bearer "+mustSignToken(t, jwt.SigningMethodHS384, []byte(testSecret), "owner"))
	rec = httptest.NewRecorder()
	okHandler.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected unexpected alg to be rejected, got %d", rec.Code)
	}
}

func TestRequireRole(t *testing.T) {
	handler := RequireRole("owner")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))

	req := httptest.NewRequest(http.MethodGet, "/api/reports/monthly-sales", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 without role, got %d", rec.Code)
	}

	req = httptest.NewRequest(http.MethodGet, "/api/reports/monthly-sales", nil)
	req = req.WithContext(context.WithValue(req.Context(), auth.UserRoleKey, "cashier"))
	rec = httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected 403 for cashier, got %d", rec.Code)
	}

	req = httptest.NewRequest(http.MethodGet, "/api/reports/monthly-sales", nil)
	req = req.WithContext(context.WithValue(req.Context(), auth.UserRoleKey, "owner"))
	rec = httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected owner to pass, got %d", rec.Code)
	}
}

func mustSignToken(t *testing.T, method jwt.SigningMethod, key any, role string) string {
	t.Helper()
	claims := auth.TokenClaims{
		UserID: "user-1",
		Email:  "owner@example.com",
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(method, claims)
	signed, err := token.SignedString(key)
	if err != nil {
		t.Fatalf("sign token: %v", err)
	}
	return signed
}
