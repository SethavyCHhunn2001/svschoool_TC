import test from "node:test";
import assert from "node:assert/strict";
import {
  bookingSchema,
  movieSchema,
  registerSchema,
  reviewSchema,
} from "../src/validation.js";

test("registration requires a valid email and strong-enough password", () => {
  assert.equal(
    registerSchema.safeParse({
      body: { name: "Alex", email: "alex@example.com", password: "passphrase1" },
    }).success,
    true,
  );
  assert.equal(
    registerSchema.safeParse({
      body: { name: "Alex", email: "not-an-email", password: "short" },
    }).success,
    false,
  );
});

test("movie validation rejects invalid duration and rating", () => {
  const result = movieSchema.safeParse({
    body: {
      title: "Test Film",
      genre: "Drama",
      year: 2026,
      rating: 11,
      durationMinutes: 0,
      description: "A test.",
    },
  });
  assert.equal(result.success, false);
});

test("booking validation caps seat count and validates seat labels", () => {
  const result = bookingSchema.safeParse({
    body: {
      showtimeId: "507f1f77bcf86cd799439011",
      seats: Array.from({ length: 9 }, (_, index) => `A${index + 1}`),
    },
  });
  assert.equal(result.success, false);
});

test("review validation only accepts ratings from one through five", () => {
  const result = reviewSchema.safeParse({
    params: { movieId: "507f1f77bcf86cd799439011" },
    body: { rating: 6, comment: "Too high" },
  });
  assert.equal(result.success, false);
});
