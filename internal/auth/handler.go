package auth

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

// Handler handles HTTP requests for authentication
type Handler struct {
	service *AuthService
}

// NewHandler creates a new auth handler
func NewHandler(service *AuthService) *Handler {
	return &Handler{service: service}
}

// Router returns the chi router for auth endpoints
func (h *Handler) Router() *chi.Mux {
	r := chi.NewRouter()

	r.Post("/register", h.Register)
	r.Post("/login", h.Login)
	r.Post("/login/pin", h.LoginPIN)
	r.Post("/cashiers", h.CreateCashier)
	r.Get("/cashiers", h.ListCashiers)

	return r
}

// RegisterRequest represents a registration request
type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
}

// LoginRequest represents a login request
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginPINRequest represents a PIN login request
type LoginPINRequest struct {
	Email string `json:"email"`
	PIN   string `json:"pin"`
}

// CreateCashierRequest represents a create cashier request
type CreateCashierRequest struct {
	Email string `json:"email"`
	PIN   string `json:"pin"`
	Name  string `json:"name"`
}

// UpdateUserRequest represents an update user request
type UpdateUserRequest struct {
	Email string `json:"email"`
	Name  string `json:"name"`
	Role  string `json:"role"`
}

// AuthResponse represents an authentication response
type AuthResponse struct {
	User  *User  `json:"user"`
	Token string `json:"token"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error string `json:"error"`
}

// Register handles owner registration
func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	user, err := h.service.RegisterOwner(r.Context(), req.Email, req.Password, req.Name)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user)
}

// Login handles email/password login
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	user, token, err := h.service.Login(r.Context(), req.Email, req.Password)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(AuthResponse{
		User:  user,
		Token: token,
	})
}

// LoginPIN handles cashier PIN login
func (h *Handler) LoginPIN(w http.ResponseWriter, r *http.Request) {
	var req LoginPINRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	user, token, err := h.service.LoginWithPIN(r.Context(), req.Email, req.PIN)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(AuthResponse{
		User:  user,
		Token: token,
	})
}

// CreateCashier handles creating a new cashier (owner only)
func (h *Handler) CreateCashier(w http.ResponseWriter, r *http.Request) {
	// Get owner from context (set by auth middleware)
	ownerID := r.Context().Value("user_id")
	if ownerID == nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req CreateCashierRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	cashier, err := h.service.CreateCashier(r.Context(), ownerID.(string), req.Email, req.PIN, req.Name)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(cashier)
}

// ListCashiers lists all cashiers (owner only)
func (h *Handler) ListCashiers(w http.ResponseWriter, r *http.Request) {
	cashiers, err := h.service.ListCashiers(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cashiers)
}

// ListUsers handles GET /api/users (owner only)
func (h *Handler) ListUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.service.ListUsers(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

// UpdateUser handles PUT /api/users/{id} (owner only)
func (h *Handler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	actorID := r.Context().Value("user_id")
	if actorID == nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	userID := chi.URLParam(r, "id")
	if userID == "" {
		http.Error(w, "missing user id", http.StatusBadRequest)
		return
	}

	var req UpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	user, err := h.service.UpdateUser(r.Context(), actorID.(string), userID, req.Email, req.Name, req.Role)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

// ToggleUserActive handles PATCH /api/users/{id}/toggle-active (owner only)
func (h *Handler) ToggleUserActive(w http.ResponseWriter, r *http.Request) {
	actorID := r.Context().Value("user_id")
	if actorID == nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	userID := chi.URLParam(r, "id")
	if userID == "" {
		http.Error(w, "missing user id", http.StatusBadRequest)
		return
	}

	user, err := h.service.ToggleUserActive(r.Context(), actorID.(string), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

// UsersRouter returns the chi router for user management endpoints (owner-only)
func (h *Handler) UsersRouter() *chi.Mux {
	r := chi.NewRouter()

	r.Get("/", h.ListUsers)
	r.Put("/{id}", h.UpdateUser)
	r.Patch("/{id}/toggle-active", h.ToggleUserActive)

	return r
}
