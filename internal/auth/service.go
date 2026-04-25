package auth

import (
	"context"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/pgtype"
	"golang.org/x/crypto/bcrypt"

	"github.com/zestzero/openpos/db/sqlc"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrUserExists         = errors.New("user already exists")
	ErrUnauthorized       = errors.New("unauthorized")
	ErrForbidden          = errors.New("forbidden")
)

// User represents an authenticated user
type User struct {
	ID    string
	Email string
	Role  string
	Name  string
}

// TokenClaims represents JWT claims
type TokenClaims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// Config holds auth configuration
type Config struct {
	JWTSecret         string
	AccessTokenExpiry time.Duration
}

// AuthService handles authentication logic
type AuthService struct {
	queries *sqlc.Queries
	pool    *pgxpool.Pool
	config  *Config
}

// NewAuthService creates a new auth service
func NewAuthService(pool *pgxpool.Pool, config *Config) *AuthService {
	return &AuthService{
		queries: sqlc.New(pool),
		pool:    pool,
		config:  config,
	}
}

// RegisterOwner registers a new owner with email and password
func (s *AuthService) RegisterOwner(ctx context.Context, email, password, name string) (*User, error) {
	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Create the user with owner role
	user, err := s.queries.CreateUser(ctx, sqlc.CreateUserParams{
		Email:        email,
		PasswordHash: string(hashedPassword),
		Role:         "owner",
		Name:         name,
	})
	if err != nil {
		return nil, err
	}

	return &User{
		ID:    user.ID.String(),
		Email: user.Email,
		Role:  user.Role,
		Name:  user.Name,
	}, nil
}

// Login validates credentials and returns a JWT token
func (s *AuthService) Login(ctx context.Context, email, password string) (*User, string, error) {
	// Find user by email
	user, err := s.queries.GetUserByEmail(ctx, email)
	if err != nil {
		return nil, "", ErrInvalidCredentials
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, "", ErrInvalidCredentials
	}

	// Generate JWT token
	token, err := s.generateToken(user.ID.String(), user.Email, user.Role)
	if err != nil {
		return nil, "", err
	}

	return &User{
		ID:    user.ID.String(),
		Email: user.Email,
		Role:  user.Role,
		Name:  user.Name,
	}, token, nil
}

// LoginWithPIN validates cashier PIN and returns a JWT token
func (s *AuthService) LoginWithPIN(ctx context.Context, email, pin string) (*User, string, error) {
	// Find user by email
	user, err := s.queries.GetUserByEmail(ctx, email)
	if err != nil {
		return nil, "", ErrInvalidCredentials
	}

	// Verify user is a cashier
	if user.Role != "cashier" {
		return nil, "", ErrInvalidCredentials
	}

	// Verify PIN
	if !user.PinHash.Valid || user.PinHash.String == "" {
		return nil, "", ErrInvalidCredentials
	}
	if !s.verifyPIN(pin, user.PinHash.String) {
		return nil, "", ErrInvalidCredentials
	}

	// Generate JWT token
	token, err := s.generateToken(user.ID.String(), user.Email, user.Role)
	if err != nil {
		return nil, "", err
	}

	return &User{
		ID:    user.ID.String(),
		Email: user.Email,
		Role:  user.Role,
		Name:  user.Name,
	}, token, nil
}

// CreateCashier creates a new cashier (owner only)
func (s *AuthService) CreateCashier(ctx context.Context, ownerID, email, pin, name string) (*User, error) {
	// Parse owner UUID
	ownerUUID, err := parseUUID(ownerID)
	if err != nil {
		return nil, ErrUnauthorized
	}

	// Verify owner has permission (ownerID must be an owner)
	owner, err := s.queries.GetUserByID(ctx, ownerUUID)
	if err != nil {
		return nil, ErrUnauthorized
	}

	if owner.Role != "owner" {
		return nil, ErrForbidden
	}

	// Hash the PIN
	hashedPIN, err := bcrypt.GenerateFromPassword([]byte(pin), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Create user with cashier role
	user, err := s.queries.CreateUser(ctx, sqlc.CreateUserParams{
		Email:        email,
		PasswordHash: "", // Cashiers use PIN, not password
		Role:         "cashier",
		Name:         name,
		PinHash: pgtype.Text{
			String: string(hashedPIN),
			Valid:  true,
		},
	})
	if err != nil {
		return nil, err
	}

	return &User{
		ID:    user.ID.String(),
		Email: user.Email,
		Role:  user.Role,
		Name:  user.Name,
	}, nil
}

// GetUserByID retrieves a user by ID
func (s *AuthService) GetUserByID(ctx context.Context, userID string) (*User, error) {
	userUUID, err := parseUUID(userID)
	if err != nil {
		return nil, err
	}

	user, err := s.queries.GetUserByID(ctx, userUUID)
	if err != nil {
		return nil, err
	}

	return &User{
		ID:    user.ID.String(),
		Email: user.Email,
		Role:  user.Role,
		Name:  user.Name,
	}, nil
}

// ListCashiers lists all cashiers
func (s *AuthService) ListCashiers(ctx context.Context) ([]User, error) {
	cashiers, err := s.queries.ListCashiers(ctx)
	if err != nil {
		return nil, err
	}

	users := make([]User, len(cashiers))
	for i, c := range cashiers {
		users[i] = User{
			ID:    c.ID.String(),
			Email: c.Email,
			Role:  c.Role,
			Name:  c.Name,
		}
	}

	return users, nil
}

// ValidateToken validates a JWT token and returns the user
func (s *AuthService) ValidateToken(ctx context.Context, tokenString string) (*User, error) {
	token, err := jwt.ParseWithClaims(tokenString, &TokenClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.config.JWTSecret), nil
	})

	if err != nil {
		return nil, ErrUnauthorized
	}

	claims, ok := token.Claims.(*TokenClaims)
	if !ok || !token.Valid {
		return nil, ErrUnauthorized
	}

	return &User{
		ID:    claims.UserID,
		Email: claims.Email,
		Role:  claims.Role,
		Name:  "", // Name is not stored in token
	}, nil
}

// generateToken creates a new JWT token
func (s *AuthService) generateToken(userID, email, role string) (string, error) {
	claims := TokenClaims{
		UserID: userID,
		Email:  email,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.config.AccessTokenExpiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.config.JWTSecret))
}

// verifyPIN compares a plain PIN with a hashed PIN
func (s *AuthService) verifyPIN(pin, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(pin))
	return err == nil
}

// parseUUID parses a UUID string into pgtype.UUID
func parseUUID(s string) (pgtype.UUID, error) {
	var uuid pgtype.UUID
	err := uuid.Scan(s)
	return uuid, err
}