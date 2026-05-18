# Photo storage adapter + binary upload/stream transport

Slice 4 adds a single optional photo per report. Two stack/pattern decisions
fall outside the existing rules and are recorded here.

## Decision

### 1. Server: local-filesystem `storage` adapter module

A new `storage` adapter module (ports & adapters, `backend-architecture.md`
rule 3) exposes a `StoragePort` interface and a `STORAGE_CLIENT` Symbol token,
backed by a `LocalFsStorageClient` writing to a directory from `AppConfig`
(`STORAGE_DIR`, default `./.storage`). It stores a blob under a generated uuid
key and streams it back. No new third-party dependency: it uses Node's `fs`.
Multipart parsing uses the `multer` already shipped with
`@nestjs/platform-express` via Nest's `FileInterceptor`. No new dependency:
the controller types the uploaded file with a local `MultipartFile` subset
type rather than the ambient `Express.Multer` namespace (tsconfig `types` is
pinned to `node`), so no `@types/multer` is needed.

New error tags `UnsupportedMediaType` (415) and `PayloadTooLarge` (413) are
added to `src/shared/errors.ts` and wired into the exhaustive
`error-status.ts` table.

### 2. Client: `client.upload` added to the frozen `shared/http` surface

`http.md` rule 2 freezes the `shared/http` public surface and requires an ADR
to extend it. A photo upload is `multipart/form-data` with a binary body — it
cannot go through `client.post` (JSON only). Rather than introduce a second
transport (which `http.md` rule 1 forbids — `shared/http` is the only place
that calls `fetch`), the surface gains exactly one method:

- `client.upload<T>(url: string, file: Blob, fileName: string): ResultAsync<T, HttpError>`

It reuses the existing per-call token attach, the missing-token guard, the
401 retry-once, and the same `HttpError` union. It sends a `FormData` body
with a single `photo` field and does **not** set `content-type` (the browser
sets the multipart boundary). No other surface change; no new `HttpError`
variant.

Public photo reads do **not** use the transport: the report photo is rendered
as `<img src={baseUrl + '/reports/:id/photo'}>` (the route is `@Public()`),
so no JSON/parse path is involved.

## Why

- A filesystem adapter behind a port keeps the storage backend swappable
  (S3 later) with a one-line module change, and is testable against a temp
  directory with no Docker.
- Extending `shared/http` with one upload method preserves the single-transport
  invariant (token attach, 401 retry, error mapping all stay in one place)
  instead of scattering `fetch` across feature modules.

## Alternatives considered

- **Base64 the image into the JSON `POST /reports` body.** Avoids a transport
  change but bloats the create payload, couples photo to creation (the PRD
  wants photo optional and addable later), and still needs a binary stream
  endpoint for reads. Rejected.
- **A second `fetch` call inside the reports module.** Violates `http.md`
  rule 1 (single transport) and duplicates the token/401 logic. Rejected.

## Consequences

- `STORAGE_DIR` is new optional config; absent → `./.storage` (created on
  first write). Production deployment must point it at a persistent volume.
- The local FS adapter is single-node; horizontal scaling needs an S3-backed
  adapter (same port, new module) — explicitly deferred.
