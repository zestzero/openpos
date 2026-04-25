package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCORSMiddleware_AllowsConfiguredOrigin(t *testing.T) {
	middleware := CORSMiddleware(&CORSConfig{AllowedOrigins: []string{"http://localhost:5173"}})
	called := false

	handler := middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodPost, "http://localhost:8080/api/auth/login", nil)
	req.Header.Set("Origin", "http://localhost:5173")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if !called {
		t.Fatal("expected downstream handler to run")
	}
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "http://localhost:5173" {
		t.Fatalf("unexpected allow origin header: %q", got)
	}
}

func TestCORSMiddleware_HandlesPreflight(t *testing.T) {
	middleware := CORSMiddleware(&CORSConfig{AllowedOrigins: []string{"http://localhost:5173"}})
	called := false

	handler := middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
	}))

	req := httptest.NewRequest(http.MethodOptions, "http://localhost:8080/api/auth/login", nil)
	req.Header.Set("Origin", "http://localhost:5173")
	req.Header.Set("Access-Control-Request-Method", http.MethodPost)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if called {
		t.Fatal("expected preflight to stop before downstream handler")
	}
	if rec.Code != http.StatusNoContent {
		t.Fatalf("unexpected status code: %d", rec.Code)
	}
	if got := rec.Header().Get("Access-Control-Allow-Methods"); got == "" {
		t.Fatal("expected allow methods header")
	}
}
