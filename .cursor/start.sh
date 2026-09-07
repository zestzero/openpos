#!/usr/bin/env bash
# Cloud Agent start phase for OpenPOS.
#
# Runs on every boot. Reconciles per-boot runtime state: starts PostgreSQL,
# ensures the database exists, and applies any pending migrations. Long-running
# dev servers (API + Vite) are launched from the `terminals` entries so their
# logs stay visible. This script must be idempotent and must return.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

export PATH="$HOME/.local/bin:$PATH"
eval "$(mise env -s bash)"

echo "==> [start] Starting PostgreSQL"
sudo pg_ctlcluster 16 main start 2>/dev/null || true
for _ in $(seq 1 30); do
  sudo -u postgres pg_isready -q && break
  sleep 1
done

echo "==> [start] Ensuring database exists"
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='openpos'" \
  | grep -q 1 \
  || sudo -u postgres psql -c "CREATE USER openpos WITH PASSWORD 'openpos' CREATEDB;"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='openpos'" \
  | grep -q 1 \
  || sudo -u postgres psql -c "CREATE DATABASE openpos OWNER openpos;"

echo "==> [start] Applying database migrations"
migrate -path db/migrations -database "$DATABASE_URL" up 2>&1 || true

echo "==> [start] Ready"
