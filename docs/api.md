# REST API

Base URL: `http://localhost:4000/api/v1`. Responses use `{ "success": true, "data": ... }`; list responses also include a `pagination` object. Errors use `{ "success": false, "message": ... }`.

## Authentication

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/auth/login` | Public, rate-limited | Exchange email/password for a signed bearer token |
| GET | `/auth/me` | Authenticated | Return the current account |
| GET | `/health` | Public | Health probe |

Pass tokens as `Authorization: Bearer <token>`.

## School resources

Authenticated CRUD routes are available at `/{resource}` and `/{resource}/:id`:

`students`, `teachers`, `parents`, `classes`, `subjects`, `enrollments`, `attendance`, `examinations`, `grades`, `timetable`, `academic-years`, `semesters`, `fees`, `payments`, `announcements`, `notifications`, `books`, `library-transactions`, `audit-logs`.

List routes accept `page`, `limit` (maximum 100), and `search`. Writes are validated against the Mongoose resource schema and role authorization is applied per module. Learner/parent list reads are restricted to linked student records and applicable notifications/announcements.

| Method | Path | Purpose |
|---|---|---|
| GET | `/dashboard` | Counts, today's attendance summary, payments and latest registrations/notices |
| GET | `/{resource}?page=1&limit=10&search=...` | Search and paginate records |
| POST | `/{resource}` | Create a record |
| PATCH | `/{resource}/:id` | Update a record |
| DELETE | `/{resource}/:id` | Delete a record |

The backend schema registry is the source of truth for field names and validation. Reference fields expect MongoDB document IDs. Parent accounts must have `linkedStudents` configured by an administrator; student accounts must use the matching student email for scoped reads.
