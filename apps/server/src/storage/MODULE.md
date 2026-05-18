# storage (server)

> **Scope of this file:** non-obvious context only.

## Purpose

Adapter module for binary blob storage (ADR 0004). Stores an opaque blob under
a generated key and streams it back. Currently backed by the local
filesystem; the port keeps the backend swappable (S3 later) with a one-line
module change.

## Public surface

- `StorageModule` — registers the `STORAGE_CLIENT` provider.
- `STORAGE_CLIENT` token + `StoragePort` interface — `put(body, contentType) → key`, `get(key) → { stream, contentType }`.
- `StoredBlob` type.

## Owns

- The on-disk layout under `AppConfig.storageDir` (env `STORAGE_DIR`, default `./.storage`): each blob is two files — `<uuid>` (bytes) and `<uuid>.type` (its MIME). No DB table.

## Depends on

- `config` module's `APP_CONFIG` token (`storageDir`).

## Cross-app contract

n/a — internal port. The photo wire contract lives in the `reports` module.

## Gotchas

- `put` returns only the uuid key; the content type is persisted in a `.type`
  sidecar so `get` can set the response `content-type` without re-sniffing.
- `get` maps a missing key (ENOENT on the `.type` sidecar) to the shared
  `NotFound` tag; any other I/O failure is `DbError`.
- No MIME/size validation here — that is the caller's policy (`reports`
  enforces `image/jpeg|png|webp`, ≤5 MB). This module stores whatever bytes
  it is given.
- The local FS adapter is single-node; horizontal scale needs an S3-backed
  adapter behind the same port (deferred, ADR 0004).

## Out of scope

Image processing/resizing, multi-blob, signed URLs, retention/cleanup.
