# Build stage
FROM golang:1.26.2-alpine AS builder

WORKDIR /app

# Copy go mod files first for better caching
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# pgx and the postgres migrate driver are pure Go.
RUN CGO_ENABLED=0 GOOS=linux go build -o /openpos ./cmd/server

# Runtime stage
FROM alpine:3.21

# Install runtime dependencies
RUN apk add --no-cache curl ca-certificates

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /openpos .

# Copy migration files used at startup.
COPY db/migrations ./db/migrations

# Create non-root user
RUN adduser -D -g '' appuser
USER appuser

# Expose port
EXPOSE 8080

# Readiness: process is up and PostgreSQL is reachable.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/ready || exit 1

# Bind address is 0.0.0.0:$PORT inside the process.
CMD ["./openpos"]
