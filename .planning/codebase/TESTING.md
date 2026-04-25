# Testing Patterns

**Analysis Date:** 2026-04-25

## Test Framework

### Go (Backend)

**Runner:** Go's built-in test package
```bash
go test ./...              # Run all tests
go test -v ./...           # Verbose output
go test -cover ./...      # With coverage
go test -race ./...       # Race detector
```

**Assertion:** Built-in `testing` package with custom helpers

**Table-driven tests:** Primary pattern for Go tests

```go
func TestCalculateTotal(t *testing.T) {
    tests := []struct {
        name     string
        items    []OrderItem
        expected int64
    }{
        {
            name:     "empty order",
            items:    []OrderItem{},
            expected: 0,
        },
        {
            name: "single item",
            items: []OrderItem{
                {Price: 1000, Quantity: 2},
            },
            expected: 2000,
        },
        {
            name: "multiple items",
            items: []OrderItem{
                {Price: 500, Quantity: 3},
                {Price: 1500, Quantity: 1},
            },
            expected: 3000,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result := CalculateTotal(tt.items)
            if result != tt.expected {
                t.Errorf("CalculateTotal() = %d, want %d", result, tt.expected)
            }
        })
    }
}
```

### TypeScript/React (Frontend)

**Runner:** Vitest
```bash
npm test                  # Run all tests
npm test -- --watch       # Watch mode
npm test -- --coverage   # Coverage report
```

**Assertion:** Vitest's expect (Jest-compatible)

**Component Testing:** React Testing Library

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from './ProductCard';

describe('ProductCard', () => {
  it('renders product name and price', () => {
    const product = { id: '1', name: 'Coffee', price: 3500 }; // in satang

    render(<ProductCard product={product} />);

    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText('฿35.00')).toBeInTheDocument();
  });

  it('calls onAddToCart when button clicked', () => {
    const onAddToCart = vi.fn();
    const product = { id: '1', name: 'Coffee', price: 3500 };

    render(<ProductCard product={product} onAddToCart={onAddToCart} />);
    fireEvent.click(screen.getByRole('button', { name: /add to cart/i }));

    expect(onAddToCart).toHaveBeenCalledWith('1');
  });
});
```

## Test File Organization

### Go

**Location:** Same package, same directory
```
internal/user/
├── service.go
├── service_test.go       # Co-located tests
├── handler.go
└── handler_test.go       # Co-located tests
```

**Naming:** `{file}_test.go`

**Handler tests:** Use `httptest` package
```go
import (
    "net/http"
    "net/http/httptest"
    "testing"
)

func TestGetUserHandler(t *testing.T) {
    // Setup
    service := &mockUserService{
        getUserFn: func(ctx context.Context, id int64) (*User, error) {
            return &User{ID: id, Name: "John"}, nil
        },
    }
    handler := NewHandler(service)

    // Create request
    req := httptest.NewRequest(http.MethodGet, "/users/1", nil)
    rr := httptest.NewRecorder()

    // Execute
    handler.ServeHTTP(rr, req)

    // Assert
    if rr.Code != http.StatusOK {
        t.Errorf("expected status 200, got %d", rr.Code)
    }
}
```

### TypeScript/React

**Location:** Co-located with component
```
components/
├── ProductCard.tsx
├── ProductCard.test.tsx
└── ProductCard.stories.tsx  # Storybook (if used)
```

**Naming:** `{Component}.test.tsx` or `{Component}.spec.tsx`

**Utilities:**
```
lib/
├── formatCurrency.ts
├── formatCurrency.test.ts
└── utils.ts
```

## Test Structure

### Go Suite Pattern

```go
func TestOrderService(t *testing.T) {
    // Setup once per test file
    db := testdb(t)
    queries := db.New()
    service := NewSalesService(queries, nil)

    t.Run("create order", func(t *testing.T) {
        // Test-specific setup
        order, err := service.CreateOrder(context.Background(), []OrderItem{
            {ProductID: 1, Price: 1000, Quantity: 2},
        })
        
        require.NoError(t, err)
        assert.Equal(t, int64(2000), order.Total)
    })

    t.Run("insufficient inventory", func(t *testing.T) {
        // Different setup for this test
        // ...
    })
}
```

### React Component Pattern

```typescript
describe('OrderSummary', () => {
  // Shared setup
  const defaultProps = {
    items: [{ productId: '1', price: 3500, quantity: 2 }],
    onRemoveItem: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders total correctly', () => {
    render(<OrderSummary {...defaultProps} />);
    expect(screen.getByText('฿70.00')).toBeInTheDocument();
  });

  it('shows empty state when no items', () => {
    render(<OrderSummary {...defaultProps} items={[]} />);
    expect(screen.getByText(/no items/i)).toBeInTheDocument();
  });
});
```

## Mocking

### Go

**Interface-based mocking:**
```go
type UserStore interface {
    GetUser(ctx context.Context, id int64) (*User, error)
    CreateUser(ctx context.Context, user *User) error
}

type mockUserStore struct {
    users map[int64]*User
    err   error
}

func (m *mockUserStore) GetUser(ctx context.Context, id int64) (*User, error) {
    if m.err != nil {
        return nil, m.err
    }
    return m.users[id], nil
}
```

**Use mocks in tests:**
```go
func TestUserService(t *testing.T) {
    mockStore := &mockUserStore{
        users: map[int64]*User{
            1: {ID: 1, Name: "John"},
        },
    }
    service := NewUserService(mockStore)

    user, err := service.GetUser(context.Background(), 1)
    require.NoError(t, err)
    assert.Equal(t, "John", user.Name)
}
```

### TypeScript/React

**Vitest mocks:**
```typescript
// Mock API module
vi.mock('@/lib/api', () => ({
  api: {
    getProducts: vi.fn().mockResolvedValue([{ id: '1', name: 'Coffee' }]),
    createOrder: vi.fn().mockResolvedValue({ id: 'order-1' },
  },
}));

// Mock React Query
const mockQueryClient = vi.fn(() => ({
  invalidateQueries: vi.fn(),
  setQueryData: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }) => {
    if (queryKey[0] === 'products') {
      return { data: [{ id: '1', name: 'Coffee' }], isLoading: false };
    }
    return { data: null, isLoading: false };
  },
  useMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));
```

**Mocking React Query properly:**
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

it('fetches products', async () => {
  const { result } = renderHook(() => useProducts(), { wrapper: createWrapper() });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toHaveLength(1);
});
```

## Fixtures and Factories

### Go

**Test fixtures as functions:**
```go
func newTestUser(t *testing.T) *User {
    return &User{
        ID:        1,
        Name:      "Test User",
        Email:     "test@example.com",
        CreatedAt: time.Now(),
    }
}

func newTestProduct(t *testing.T) *Product {
    return &Product{
        ID:   1,
        Name: "Test Product",
    }
}

func newTestVariant(t *testing.T, productID int64) *ProductVariant {
    return &ProductVariant{
        ID:        1,
        ProductID: productID,
        SKU:       "TEST-SKU",
        Price:     1000, // 10 THB in satang
        Stock:     100,
    }
}
```

**Database fixtures:**
```go
func seedTestData(t *testing.T, db *sql.DB) {
    _, err := db.Exec(`
        INSERT INTO users (id, name, email) VALUES (1, 'John', 'john@test.com');
        INSERT INTO products (id, name) VALUES (1, 'Coffee');
        INSERT INTO product_variants (id, product_id, sku, price, stock)
        VALUES (1, 1, 'COFFEE-LARGE', 3500, 50);
    `)
    require.NoError(t, err)
}
```

### TypeScript/React

**Fixture files:**
```typescript
// fixtures/products.ts
export const testProducts = [
  {
    id: '1',
    name: 'Coffee',
    price: 3500,
    variants: [
      { id: 'v1', sku: 'COFFEE-S', price: 2500, stock: 100 },
      { id: 'v2', sku: 'COFFEE-L', price: 3500, stock: 50 },
    ],
  },
] as const;

export const testOrder = {
  id: 'order-1',
  items: [
    { variantId: 'v1', quantity: 2, price: 2500 },
  ],
  total: 5000,
  status: 'pending' as const,
};
```

**Factory functions:**
```typescript
const createOrder = (overrides = {}): Order => ({
  id: crypto.randomUUID(),
  items: [],
  total: 0,
  status: 'pending',
  createdAt: new Date().toISOString(),
  ...overrides,
});
```

## Coverage

### Go

**Target:** 70%+ coverage on business logic

**View coverage:**
```bash
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out -o coverage.html
```

**Cover specific packages:**
```bash
go test -cover ./internal/user/...
go test -cover ./internal/sales/...
```

### TypeScript/React

**Target:** Key business logic, utilities, critical components

**View coverage:**
```bash
npm test -- --coverage
```

**Coverage thresholds (optional in vitest.config.ts):**
```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
      },
    },
  },
});
```

## Test Types

### Unit Tests

**Go:** Test individual functions, methods
```go
func TestCalculateDiscount(t *testing.T) {
    // Pure function tests
    assert.Equal(t, int64(100), CalculateDiscount(1000, 10))
    assert.Equal(t, int64(0), CalculateDiscount(1000, 0))
}
```

**React:** Test components in isolation
```typescript
it('formats price correctly', () => {
  expect(formatCurrency(3500)).toBe('฿35.00');
});
```

### Integration Tests

**Go:** Test handler + service + database
```go
func TestOrderIntegration(t *testing.T) {
    if testing.Short() {
        t.Skip("skipping integration test")
    }

    // Use real database or test container
    db := testdb.Start(t, "integration_test")
    service := NewSalesService(db.Queries(), nil)

    order, err := service.CreateOrder(context.Background(), items)
    require.NoError(t, err)

    // Verify in database
    saved, err := service.GetOrder(context.Background(), order.ID)
    require.NoError(t, err)
    assert.Equal(t, order.Total, saved.Total)
}
```

**React:** Test component + React Query
```typescript
it('loads products via API', async () => {
  server.use(...mockApiHandlers);

  render(<ProductList />, { wrapper });

  await waitFor(() => {
    expect(screen.getByText('Coffee')).toBeInTheDocument();
  });
});
```

### E2E Tests

**Not implemented yet.** Consider Playwright for future:
- Full user flows (browse → add to cart → checkout)
- Offline behavior verification
- PWA functionality

## Common Patterns

### Async Testing (Go)

```go
func TestAsyncOperation(t *testing.T) {
    done := make(chan error, 1)

    go func() {
        // Async work
        result, err := service.ProcessAsync(ctx)
        if err != nil {
            done <- err
            return
        }
        done <- nil
    }()

    select {
    case err := <-done:
        require.NoError(t, err)
    case <-time.After(5 * time.Second):
        t.Fatal("timeout waiting for async operation")
    }
}
```

### Async Testing (React)

```typescript
it('loads data asynchronously', async () => {
  render(<ProductList />);

  // Initially loading
  expect(screen.getByText(/loading/i)).toBeInTheDocument();

  // Wait for data
  await waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });

  expect(screen.getByText('Coffee')).toBeInTheDocument();
});
```

### Error Testing (Go)

```go
func TestServiceErrors(t *testing.T) {
    tests := []struct {
        name          string
        mockErr       error
        expectedError string
    }{
        {
            name:          "not found",
            mockErr:        sql.ErrNoRows,
            expectedError: "user not found",
        },
        {
            name:          "database error",
            mockErr:        context.DeadlineExceeded,
            expectedError: "database timeout",
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            store := &mockStore{err: tt.mockErr}
            service := NewUserService(store)

            _, err := service.GetUser(context.Background(), 1)
            assert.Error(t, err)
            assert.Contains(t, err.Error(), tt.expectedError)
        })
    }
}
```

### Error Testing (React)

```typescript
it('shows error state on failure', async () => {
  server.use(
    rest.get('/api/products', (req, res, ctx) => {
      return res(ctx.status(500), ctx.json({ error: 'Server error' }));
    })
  );

  render(<ProductList />);

  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

### Testing with Context (React)

```typescript
it('shows different UI when offline', () => {
  // Mock offline state
  Object.defineProperty(navigator, 'onLine', { value: false, writable: true });

  render(<SyncStatus />);

  expect(screen.getByText(/offline/i)).toBeInTheDocument();
  expect(screen.getByText(/pending sync/i)).toBeInTheDocument();
});
```

---

*Testing analysis: 2026-04-25*