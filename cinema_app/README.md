# CINÉMA

A Flutter cinema-ticketing app with an Express API and MongoDB storage. The
mobile UI uses the dark CINÉMA palette from the supplied design and reads its
movie, cinema, showtime, screen, booking, and review data from the API.

## Features

- Email/password registration and login with hashed passwords and signed JWTs.
- Browse movies, cinema locations, auditorium screens, and upcoming showtimes.
- View movie details and write one review per user/movie.
- Choose seats and book up to eight tickets; seat reservations are checked
  atomically in MongoDB.
- Admin tools for adding movies, cinemas, screens, and showtimes.
- MongoDB seed data for a sample cinema, movie, screen, and showtime.
- Docker Compose configuration for MongoDB and the API.

Bookings confirm ticket reservations only; payment processing is not included.

## Run locally

Requirements: Flutter/Dart, Node.js 20+, and either Docker or a MongoDB server.

1. Configure the API:

   ```sh
   cd cinema_app/backend
   npm run setup
   ```

   This creates `backend/.env` with a unique, secure JWT secret and does not
   overwrite an existing `.env`. To use the admin tools, edit `.env` and set
   `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`.

2. Start MongoDB and the API with Docker:

   ```sh
   docker compose up --build -d
   docker compose exec api npm run seed
   ```

   The API health check is at `http://localhost:3000/api/health`.

   To run the API without Docker, start a local MongoDB server, then run:

   ```sh
   cd cinema_app/backend
   npm run seed
   npm start
   ```

   `npm run setup` configures `MONGODB_URI=mongodb://127.0.0.1:27017/cinema`
   for a local MongoDB server. Start MongoDB before starting the API.

3. Run Flutter:

   ```sh
   cd mobile
   flutter pub get
   flutter run --dart-define=API_BASE_URL=http://127.0.0.1:3000/api
   ```

   Use the API URL reachable from your target device:

   - Android emulator: `http://10.0.2.2:3000/api`
   - iOS simulator or desktop browser: `http://127.0.0.1:3000/api`
   - Physical device: `http://<computer-LAN-IP>:3000/api`

   For a production release, deploy the API behind HTTPS and build with that
   public URL, for example:

   ```sh
   flutter build apk --dart-define=API_BASE_URL=https://api.example.com/api
   ```

## Admin access

`npm run seed` creates the administrator account only when both
`SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` are set. Sign in with those
credentials to see the **Manage** tab. New registrations are always regular
users; admin privileges cannot be requested from the public registration API.

## API overview

All endpoints are prefixed with `/api`.

| Method | Path | Access | Purpose |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Create a regular account |
| `POST` | `/auth/login` | Public | Sign in |
| `GET` | `/auth/me` | User | Get the current account |
| `GET` | `/movies` | Public | List/search movies |
| `POST` | `/movies` | Admin | Add a movie |
| `PUT`, `DELETE` | `/movies/:id` | Admin | Update/delete a movie |
| `GET` | `/cinemas` | Public | List cinemas |
| `POST` | `/cinemas` | Admin | Add a cinema |
| `GET` | `/screens` | Public | List screens |
| `POST` | `/screens` | Admin | Add a screen |
| `GET` | `/showtimes` | Public | List upcoming showtimes |
| `POST` | `/showtimes` | Admin | Add a showtime |
| `GET` | `/movies/:movieId/reviews` | Public | List movie reviews |
| `POST` | `/movies/:movieId/reviews` | User | Create/update own review |
| `POST` | `/bookings` | User | Reserve seats |
| `GET` | `/bookings/me` | User | List own bookings |
| `GET` | `/admin/summary` | Admin | MongoDB document counts |

Send authenticated requests with `Authorization: Bearer <token>`. See
`backend/src/validation.js` for request fields and constraints.

## Checks

```sh
cd backend && npm test
cd mobile && flutter test
cd mobile && flutter analyze
```

## Source package

`cinema_app-source.zip` contains this directory's source and setup files.
It excludes local environment files, package caches, and build outputs. This
package is not deployed to a public hosting service.
