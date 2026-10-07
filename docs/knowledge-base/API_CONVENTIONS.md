# API Conventions

## URL style & versioning

- Base path: **`/api`** (set globally with `app.setGlobalPrefix('api')`). Everything else on the server is the React SPA.
- **No versioning** (`/api/books`, not `/api/v1/books`). If a breaking change is ever needed, introduce `/api/v2/...` via Nest URI versioning rather than changing existing responses.
- Resources are **plural nouns**, lower-case: `/books`, `/members`, `/loans`, `/dashboard`.
- IDs are integers in the path: `/books/:id` (parsed with `ParseIntPipe`; non-numeric → 400).
- Actions that aren't plain CRUD are **sub-resource verbs with PATCH**: `PATCH /loans/:id/return`.
- Filters and search use **query params**: `?search=`, `?status=`, `?memberId=`, `?bookId=`.
- JSON in, JSON out. Field names are **camelCase**, matching entity properties.

## Endpoints

| Method | Path | Body / query | Success |
| --- | --- | --- | --- |
| GET | `/api/dashboard` | – | 200 `DashboardStats` |
| GET | `/api/books` | `?search=` (title/author/ISBN/category, case-insensitive contains) | 200 `Book[]` sorted by title |
| GET | `/api/books/:id` | – | 200 `Book` |
| POST | `/api/books` | `{ title, author, isbn, category?, publishedYear?, totalCopies }` | 201 `Book` |
| PATCH | `/api/books/:id` | any subset of the POST fields | 200 `Book` |
| DELETE | `/api/books/:id` | – | 204 (no body) |
| GET | `/api/members` | `?search=` (name/email/phone) | 200 `Member[]` sorted by name |
| GET | `/api/members/:id` | – | 200 `Member` |
| POST | `/api/members` | `{ name, email, phone?, active? }` | 201 `Member` |
| PATCH | `/api/members/:id` | any subset of the POST fields | 200 `Member` |
| DELETE | `/api/members/:id` | – | 204 |
| GET | `/api/loans` | `?status=active\|overdue\|returned&memberId=&bookId=` | 200 `Loan[]` newest first |
| GET | `/api/loans/:id` | – | 200 `Loan` |
| POST | `/api/loans` | `{ bookId, memberId, loanDays? }` (1–60, default 14) | 201 `Loan` |
| PATCH | `/api/loans/:id/return` | – | 200 `Loan` (with `fine`) |

`status=active` means *not yet returned* (it **includes** overdue loans); `status=overdue` is only the late subset.

## Response shapes

```jsonc
// Book
{ "id": 1, "title": "Dune", "author": "Frank Herbert", "isbn": "9780441172719",
  "category": "Science Fiction", "publishedYear": 1965,
  "totalCopies": 3, "availableCopies": 2, "createdAt": "2026-10-05T11:32:00.000Z" }

// Member
{ "id": 1, "name": "Aarav Sharma", "email": "aarav.sharma@example.com",
  "phone": "9876543210", "active": true, "joinedAt": "2026-10-05T11:32:00.000Z" }

// Loan — book and member are always embedded; status & daysOverdue are computed
{ "id": 7, "book": { /* Book */ }, "member": { /* Member */ },
  "loanDate": "...", "dueDate": "...", "returnDate": null, "fine": 0,
  "status": "overdue", "daysOverdue": 4 }

// DashboardStats
{ "totalTitles": 16, "totalCopies": 55, "availableCopies": 46,
  "totalMembers": 8, "activeMembers": 7, "activeLoans": 9, "overdueLoans": 2,
  "recentLoans": [ /* 5 × Loan */ ],
  "topBooks": [ { "id": 2, "title": "1984", "author": "George Orwell", "loanCount": 2 } ] }
```

- Dates are **ISO-8601 UTC strings**.
- Nullable fields are returned as `null`, never omitted.
- Collections are returned as a **bare JSON array** (no envelope).

## Validation

Global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`:

- DTOs with `class-validator` decorators live in `backend/src/<module>/dto/`. Update DTOs are `PartialType(CreateDto)`.
- **Unknown properties are rejected** (400), not silently dropped.
- Query params are transformed to numbers where the DTO says so (`LoanQueryDto`).

## Error format

Standard NestJS exception body:

```json
{ "statusCode": 400, "message": "Member already has a copy of \"Dune\"", "error": "Bad Request" }
```

For validation failures `message` is an **array** of strings:

```json
{ "statusCode": 400, "message": ["title should not be empty", "totalCopies must not be less than 1"], "error": "Bad Request" }
```

| Status | When |
| --- | --- |
| 400 Bad Request | Validation failure, non-numeric id, or business-rule violation (no copies, inactive member, loan limit, already returned, delete with active loans, copies below on-loan count) |
| 404 Not Found | Unknown book / member / loan id |
| 409 Conflict | Duplicate ISBN or member email |
| 500 | Unexpected errors only |

Services throw Nest exceptions (`BadRequestException`, `NotFoundException`, `ConflictException`) with a human-readable message that the UI shows as-is.

## Auth

- **None.** No login, tokens or roles; all endpoints are open. CORS is enabled for all origins (`app.enableCors()`).
- The app is intended for a trusted local/staff network. If exposed publicly, add auth (e.g. a Nest guard with JWT/session) before anything else.

## Pagination

- **Not implemented.** List endpoints return all matching rows (catalogue sizes are small). Dashboard `recentLoans` and `topBooks` are capped at 5.
- If needed, add `?page=&pageSize=` (or `?limit=&offset=`) to the query DTO and return `{ items, total, page, pageSize }` — as a new, versioned shape so existing clients keep working.

## How the frontend calls the API

- **All HTTP goes through `frontend/src/api.ts`** — components never call `fetch` directly.
- Calls use **relative URLs** (`/api/...`): same origin in production; Vite dev server proxies `/api` to `http://localhost:3000` in development.
- `request<T>()` sets `Content-Type: application/json`, parses JSON, treats an empty body (204) as `undefined`, and on non-2xx throws `ApiError(message, status)`; an array `message` is joined with `", "`.
- Response types are declared in `frontend/src/types.ts` and must be kept in sync with backend entities/DTOs by hand.
- Query strings are built with `URLSearchParams`, skipping empty/undefined values.
- Pages catch errors and display `err.message` in an alert; after any successful mutation they re-fetch the list.

## Checklist for a new endpoint

1. DTO with validators in `dto/`; use `ParseIntPipe` for `:id` params.
2. Business rules in the service; throw the matching Nest exception with a clear message.
3. Use `@HttpCode(204)` for deletes; POST returns 201 with the created entity.
4. Add a unit test (service, in-memory DB) and extend `test/app.e2e-spec.ts` for the HTTP contract.
5. Add the method to `frontend/src/api.ts` and types to `frontend/src/types.ts`.
6. Update this document.
