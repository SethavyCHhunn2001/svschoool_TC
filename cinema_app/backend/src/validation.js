import { z } from "zod";

const id = z.string().regex(/^[a-f\d]{24}$/i, "Must be a valid ID.");
const positiveInt = (maximum) => z.coerce.number().int().min(1).max(maximum);
const optionalUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => value === "" || /^https?:\/\//i.test(value), {
    message: "Must be an http(s) URL.",
  })
  .optional();

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(80),
    email: z.string().trim().email().max(254),
    password: z.string().min(8).max(128),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email().max(254),
    password: z.string().min(1).max(128),
  }),
});

export const movieSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(140),
    genre: z.string().trim().min(1).max(60),
    year: z.coerce.number().int().min(1888).max(2200),
    rating: z.coerce.number().min(0).max(10).default(0),
    durationMinutes: z.coerce.number().int().min(1).max(600),
    description: z.string().trim().min(1).max(4000),
    posterUrl: optionalUrl,
    cast: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
    isFeatured: z.coerce.boolean().default(false),
  }),
});

export const cinemaSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(140),
    address: z.string().trim().min(1).max(240),
    city: z.string().trim().min(1).max(100),
    country: z.string().trim().min(1).max(100),
    phone: z.string().trim().max(40).default(""),
    isActive: z.coerce.boolean().default(true),
  }),
});

export const screenSchema = z.object({
  body: z.object({
    cinema: id,
    name: z.string().trim().min(1).max(80),
    rows: positiveInt(26),
    columns: positiveInt(30),
    seatPrice: z.coerce.number().min(0).max(10000),
    format: z.string().trim().max(40).default("Standard"),
  }),
});

export const showtimeSchema = z.object({
  body: z.object({
    movie: id,
    screen: id,
    startAt: z.coerce.date(),
    price: z.coerce.number().min(0).max(10000),
  }),
});

export const reviewSchema = z.object({
  params: z.object({ movieId: id }),
  body: z.object({
    rating: z.coerce.number().int().min(1).max(5),
    comment: z.string().trim().min(1).max(1500),
  }),
});

export const bookingSchema = z.object({
  body: z.object({
    showtimeId: id,
    seats: z.array(z.string().regex(/^[A-Z](?:[1-9]|[12]\d|30)$/)).min(1).max(8),
  }),
});
