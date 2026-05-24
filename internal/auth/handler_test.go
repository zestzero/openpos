package auth

import (
	"net/http"
	"testing"

	"github.com/go-chi/chi/v5"
)

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
