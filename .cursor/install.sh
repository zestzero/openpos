#!/usr/bin/env bash
# Cloud Agent install phase for OpenPOS.
#
# Idempotent, one-time setup that prepares durable repository state:
# system packages (PostgreSQL), pinned toolchains (via mise), the migrate CLI,
# frontend dependencies, a warmed Go build cache, the local database role/db,
# and applied schema migrations. Per-boot service startup lives in start.sh.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "==> [install] Installing system packages (PostgreSQL)"
if ! command -v pg_ctlcluster >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
    postgresql postgresql-contrib
fi

echo "==> [install] Installing mise (tool version manager)"
if ! command -v mise >/dev/null 2>&1 && [ ! -x "$HOME/.local/bin/mise" ]; then
  curl -fsSL https://mise.run | sh
fi
export PATH="$HOME/.local/bin:$PATH"

echo "==> [install] Installing pinned toolchains (go, node, pnpm)"
mise trust "$REPO_ROOT/mise.toml"
mise install
# Load pinned tools + [env] vars (DATABASE_URL, JWT_SECRET, PORT) for this script.
eval "$(mise env -s bash)"

echo "==> [install] Starting PostgreSQL and ensuring role + database"
sudo pg_ctlcluster 16 main start 2>/dev/null || true
for _ in $(seq 1 30); do
  sudo -u postgres pg_isready -q && break
  sleep 1
done
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='openpos'" \
  | grep -q 1 \
  || sudo -u postgres psql -c "CREATE USER openpos WITH PASSWORD 'openpos' CREATEDB;"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='openpos'" \
  | grep -q 1 \
  || sudo -u postgres psql -c "CREATE DATABASE openpos OWNER openpos;"

echo "==> [install] Installing golang-migrate CLI"
if ! command -v migrate >/dev/null 2>&1; then
  go install -tags 'postgres' \
    github.com/golang-migrate/migrate/v4/cmd/migrate@v4.19.1
fi

echo "==> [install] Installing frontend dependencies"
pnpm --dir frontend install --frozen-lockfile

echo "==> [install] Warming Go build cache"
go build -o /tmp/openpos-build-check ./cmd/server

echo "==> [install] Applying database migrations"
migrate -path db/migrations -database "$DATABASE_URL" up

echo "==> [install] Done"
