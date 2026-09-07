package auth

import "testing"

func TestValidateOwnerCredentials(t *testing.T) {
	if err := validateOwnerCredentials("owner@example.com", "secret12", "Owner"); err != nil {
		t.Fatalf("expected valid credentials, got %v", err)
	}
	if err := validateOwnerCredentials("", "secret12", "Owner"); err == nil {
		t.Fatal("expected email to be required")
	}
	if err := validateOwnerCredentials("owner@example.com", "short", "Owner"); err == nil {
		t.Fatal("expected short password to be rejected")
	}
}
