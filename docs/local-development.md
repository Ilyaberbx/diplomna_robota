# Local development

How to run PetFinder (client + server) from a fresh clone with **only Docker
for Postgres**. No external services, no cloud accounts, no API keys.

## Prerequisites

- **Node.js** ≥ 22 (the lockfile is built on Node 25; 22 LTS works).
- **pnpm** 10.33 — `corepack enable` then `corepack prepare pnpm@10.33.0 --activate`
  (the version is pinned in the root `package.json` `packageManager` field).
- **Docker** — only used to run Postgres locally.

## 1. Install dependencies

From the repo root:

```bash
pnpm install
```

This installs every workspace (`apps/server`, `apps/client`) in one pass.

## 2. Start Postgres (Docker)

The server's default `DATABASE_URL` uses host port `5432`. If you already run
another Postgres (`docker ps` shows something on `0.0.0.0:5432->5432`), pick a
free **host** port instead — the container's internal port stays `5432`, only
the left side of `-p` changes. Set it once here and reuse it in step 3:

```bash
# Pick any free host port. 5432 is the default; use another if it's taken.
PG_PORT=5432

docker run --name petfinder-pg \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=petfinder \
  -p "${PG_PORT}":5432 \
  -d postgres:16-alpine
```

If `docker run` fails with **"port is already allocated"**, that host port is
taken — re-run with a different `PG_PORT` (e.g. `5434`). If it fails with
**"container name ... already in use"**, a previous attempt left a stopped
container behind: `docker rm -f petfinder-pg`, then re-run.

Stop/restart it later with `docker stop petfinder-pg` / `docker start
petfinder-pg`. Remove it (wipes all data) with `docker rm -f petfinder-pg`.

> The automated test suite does **not** use this container — repository tests
> spin up their own ephemeral Postgres via testcontainers. This container is
> only for `pnpm dev`.

## 3. Configure environment

Each app ships an `.env.example`. Copy them:

```bash
cp apps/server/.env.example apps/server/.env
cp apps/client/.env.example apps/client/.env
```

If you used the default `PG_PORT=5432` in step 2, the copied files need **no
edits**. If you chose a different host port, edit `apps/server/.env` so
`DATABASE_URL`'s port matches — e.g. for `PG_PORT=5434`:

```
DATABASE_URL=postgres://postgres:postgres@localhost:5434/petfinder
```

Server (`apps/server/.env`):

| Variable | Default | Notes |
|---|---|---|
| `PORT` | `3000` | Server HTTP port. |
| `DATABASE_URL` | `postgres://postgres:postgres@localhost:5432/petfinder` | Host port must match `PG_PORT` from step 2. |
| `AUTH_JWT_SECRET` | `change-me-in-production` | Fine for local; must be changed for any deployed env. |
| `AUTH_JWT_TTL` | `7d` | Access-token lifetime. |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | The Vite dev origin. |

Client (`apps/client/.env`):

| Variable | Default | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:3000` | Where the client sends API requests. |

## 4. Apply the database schema

With the container running, apply the committed migrations from `drizzle/`:

```bash
pnpm --filter @diplomna-robota/server db:migrate
```

Re-run this after pulling changes that add migrations. When you change
`apps/server/src/db/schema.ts`, regenerate first with
`pnpm --filter @diplomna-robota/server db:generate`, then `db:migrate`.

## 5. Run the apps

Two terminals from the repo root:

```bash
# terminal 1 — API on http://localhost:3000
pnpm --filter @diplomna-robota/server dev

# terminal 2 — web app on http://localhost:5173
pnpm --filter @diplomna-robota/client dev
```

Open <http://localhost:5173>.

## 6. Smoke the four core flows

All four work end-to-end against only the local stack:

1. **Owner-lost** — register → create a LOST report (wizard, incl. photo) →
   see it on `/me/reports`.
2. **Finder-found** — register a second account → create a FOUND report → open
   its candidates page.
3. **Counterpart-confirm** — propose a match from a candidate → sign in as the
   counterpart → confirm it → both sides see the revealed contact panel.
4. **Anonymous-reassurance** — sign out → browse `/browse` and open a report
   detail; no contact details are shown to anonymous viewers.

## Verifying a change

`pnpm verify` is the single source of truth that a change is good. Run it for
whichever app you touched (or both):

```bash
pnpm --filter @diplomna-robota/server verify
pnpm --filter @diplomna-robota/client verify
```

The server suite requires Docker to be running (testcontainers starts its own
Postgres; it does **not** reuse the `pnpm dev` container).

## Troubleshooting

- **`docker run` → "port is already allocated"** — another process holds that
  host port (`docker ps` to see what). Re-run step 2 with a different
  `PG_PORT` and update `DATABASE_URL` to match (step 3).
- **`docker run` → "container name ... already in use"** — a previous attempt
  left a container behind. `docker rm -f petfinder-pg`, then re-run.
- **`ECONNREFUSED` / connection refused on the DB port** — the container isn't
  running (`docker start petfinder-pg`), or `DATABASE_URL`'s port doesn't match
  the `PG_PORT` you started it on.
- **Server boots but every query 500s** — migrations not applied. Run step 4.
- **CORS error in the browser console** — the client isn't on
  `http://localhost:5173`, or `CORS_ALLOWED_ORIGINS` was changed. Keep them in
  sync.
- **Server test run hangs or fails immediately** — Docker isn't running;
  testcontainers can't start its ephemeral Postgres.
- **`pnpm` not found / wrong version** — `corepack enable` and let the pinned
  `packageManager` version activate.
