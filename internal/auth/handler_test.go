package auth

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/go-chi/chi/v5"
)

func TestPublicAuthRouterOmitsCashiers(t *testing.T) {
	handler := NewHandler(nil)
	router := handler.Router()

	public := []struct {
		method string
		path   string
	}{
		{http.MethodGet, "/config"},
		{http.MethodPost, "/register"},
		{http.MethodPost, "/login"},
		{http.MethodPost, "/login/pin"},
	}
	for _, tt := range public {
		rctx := chi.NewRouteContext()
		if !router.Match(rctx, tt.method, tt.path) {
			t.Fatalf("expected %s %s to be public", tt.method, tt.path)
		}
	}

	rctx := chi.NewRouteContext()
	if router.Match(rctx, http.MethodGet, "/cashiers") {
		t.Fatal("GET /cashiers must not be on the public auth router")
	}
	if router.Match(rctx, http.MethodPost, "/cashiers") {
		t.Fatal("POST /cashiers must not be on the public auth router")
	}
}

func TestRegisterDisabledWithoutConfig(t *testing.T) {
	handler := NewHandler(nil)
	req := httptest.NewRequest(http.MethodPost, "/register", strings.NewReader(`{"email":"a@b.c","password":"secret123","name":"Owner"}`))
	rec := httptest.NewRecorder()
	handler.Register(rec, req)
	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected 403 when registration is disabled, got %d", rec.Code)
	}
}

func TestUsersRouterRoutes(t *testing.T) {
	handler := NewHandler(nil)
	router := handler.UsersRouter()

	tests := []struct {
		name   string
		method string
		path   string
	}{
		{name: "list users", method: http.MethodGet, path: "/"},
		{name: "create user", method: http.MethodPost, path: "/"},
		{name: "update user", method: http.MethodPut, path: "/user-id"},
		{name: "toggle active", method: http.MethodPatch, path: "/user-id/toggle-active"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			rctx := chi.NewRouteContext()
			if !router.Match(rctx, tt.method, tt.path) {
				t.Fatalf("expected %s %s to be routed", tt.method, tt.path)
			}
		})
	}
}
