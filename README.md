# SV High School Management System

Responsive school administration portal for Cambodian high schools, built with React/Vite, Tailwind CSS, Express, Mongoose, and MongoDB. The current implementation provides an authenticated portal, role-checked API, schema-backed CRUD for school records, a live summary dashboard, CSV summary export, and Docker-based local development.

## Technology

- Frontend: React 18, Vite, Tailwind CSS, React Router, Axios, Recharts, Lucide React
- Backend: Node.js, Express, Mongoose, JWT, bcryptjs, Zod, Helmet, rate limiting
- Database: MongoDB 7
- Local deployment: Docker Compose

## Quick start (local Node.js)

Requirements: Node.js 20+ and MongoDB 7+.

1. Copy `backend/.env.example` to `backend/.env`.
2. Set `MONGODB_URI` to your MongoDB connection string and replace `JWT_SECRET` with a random value of at least 32 characters. Set `SEED_ADMIN_PASSWORD` to a unique password with at least 12 characters.
3. Install packages and seed demo records:

   ```sh
   npm install --prefix backend
   npm install --prefix frontend
   npm run seed
   ```

4. Start the API and frontend in separate terminals:

   ```sh
   npm run dev:backend
   npm run dev:frontend
   ```

5. Open `http://localhost:5173` and sign in using `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`.

The seed command creates an administrator plus sample teachers, students, classes, subjects, an academic year, and an announcement. It is safe to rerun: the administrator and demo collections are only initially created.

## Docker Compose

Copy `.env.example` to `.env`, replace the JWT secret and seed password, then run:

```sh
docker compose up --build -d
docker compose exec backend npm run seed
```

Visit `http://localhost:5173`. The MongoDB data is persisted in the `school-data` volume. Use MongoDB Compass with `mongodb://localhost:27017` to inspect local collections.

## Roles and access

Roles: `super_admin`, `admin`, `teacher`, `student`, and `parent`. The first seeded account is `super_admin`. Writes are restricted by resource; audit log reads are super-admin-only. Learner and parent reads are limited to linked student data. Configure parent `linkedStudents` references in MongoDB or via a secured administrative workflow before enabling parent access.

## Main features

- Role-aware sign-in with signed JWTs and protected API routes.
- Responsive dashboard with current enrollment/staff/class/parent counts, attendance, collected payments, latest students, and announcements.
- Searchable, paginated CRUD screens for student, staff, class, subject, attendance, examination, grade, timetable, parent, fee, payment, library, enrollment, academic calendar, announcement, notification, and audit records.
- Mongoose schemas for all requested school entities, model validation, indexes, timestamps, relationships, and audit entries on resource writes.
- Light/dark themes, English/Khmer UI labels, Inter/Noto Sans Khmer font stack, loading/error/empty states, and mobile navigation.
- CSV download for the current school-summary report.

## Validation and tests

```sh
npm run build
node --check backend/server.js
```

The repo currently has no automated test suite. Before production use, add integration tests against a disposable MongoDB instance, enforce HTTPS, configure MongoDB authentication and backups, and add monitoring.

## Current scope

This is a working initial system foundation, not a claim that every requested production workflow is complete. Password reset and account provisioning UI, Multer uploads, PDF/Excel report generation, detailed timetable conflict checks, automated ranking/GPA calculation, and end-to-end tests are not included yet. File upload and PDFKit dependencies are intentionally not added until those workflows are implemented. Keep secrets out of source control and use a managed secret store in production.

See [docs/api.md](./docs/api.md) for routes and [docs/database.md](./docs/database.md) for the MongoDB schema map.
