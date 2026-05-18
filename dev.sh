#!/usr/bin/env bash
#
# One-command local dev: Postgres (Docker) + migrations + both dev servers.
# See docs/local-development.md for the manual step-by-step equivalent.
#
#   ./dev.sh              # default host port (5439, or the existing container's)
#   PG_PORT=5444 ./dev.sh # force a specific host port for a fresh container
#
set -euo pipefail

cd "$(dirname "$0")"

CONTAINER=petfinder-pg
PG_PORT="${PG_PORT:-5439}"

log() { printf '\033[1;36m[dev]\033[0m %s\n' "$*"; }

# 1. Postgres container — idempotent. Reuse an existing one (and adopt its
#    actual published port) instead of fighting a port collision.
if docker ps -a --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
    log "starting existing $CONTAINER container"
    docker start "$CONTAINER" >/dev/null
  else
    log "$CONTAINER already running"
  fi
else
  log "creating $CONTAINER on host port $PG_PORT"
  docker run --name "$CONTAINER" \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_DB=petfinder \
    -p "${PG_PORT}":5432 \
    -d postgres:16-alpine >/dev/null
fi

# Adopt whatever host port the container is actually published on.
HOST_PORT="$(docker port "$CONTAINER" 5432/tcp | head -1 | sed 's/.*://')"
export DATABASE_URL="postgres://postgres:postgres@localhost:${HOST_PORT}/petfinder"
log "DATABASE_URL → $DATABASE_URL"

# 2. Wait for Postgres to accept connections.
log "waiting for Postgres…"
for _ in $(seq 1 30); do
  if docker exec "$CONTAINER" pg_isready -U postgres >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
docker exec "$CONTAINER" pg_isready -U postgres >/dev/null 2>&1 \
  || { log "Postgres did not become ready in time"; exit 1; }

# 3. Apply committed migrations.
log "applying migrations"
pnpm --filter @diplomna-robota/server db:migrate

# 4. Both dev servers, killed together on Ctrl-C / exit.
pids=()
cleanup() {
  log "shutting down dev servers"
  for pid in "${pids[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
}
trap cleanup INT TERM EXIT

log "starting server (:3000) and client (:5173) — Ctrl-C to stop both"
pnpm --filter @diplomna-robota/server dev &
pids+=($!)
pnpm --filter @diplomna-robota/client dev &
pids+=($!)

wait
