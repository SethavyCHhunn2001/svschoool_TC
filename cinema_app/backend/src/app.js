import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { z } from "zod";
import { Booking, Cinema, Movie, Review, Screen, Showtime, User } from "./models.js";
import { requireAdmin, requireAuth } from "./middleware/auth.js";
import { validate } from "./middleware/validation.js";
import {
  bookingSchema,
  cinemaSchema,
  loginSchema,
  movieSchema,
  registerSchema,
  reviewSchema,
  screenSchema,
  showtimeSchema,
} from "./validation.js";

const app = express();
const api = express.Router();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "64kb" }));
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 }));
app.use("/api", api);

api.get("/health", (_req, res) => {
  res.json({ status: "ok", database: mongoose.connection.readyState === 1 });
});

const authToken = (user) =>
  jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
const userDto = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const sendAuth = (res, user) =>
  res.json({ token: authToken(user), user: userDto(user) });
const duplicateError = (res, message) =>
  res.status(409).json({ error: message });

api.post("/auth/register", validate(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password } = req.validated.body;
    const exists = await User.exists({ email: email.toLowerCase() });
    if (exists) return duplicateError(res, "An account with this email already exists.");
    const user = await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
    });
    return res.status(201).json({ token: authToken(user), user: userDto(user) });
  } catch (error) {
    if (error.code === 11000) return duplicateError(res, "An account with this email already exists.");
    return next(error);
  }
});

api.post("/auth/login", validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.validated.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Email or password is incorrect." });
    }
    return sendAuth(res, user);
  } catch (error) {
    return next(error);
  }
});

api.get("/auth/me", requireAuth, (req, res) => {
  res.json({ user: userDto(req.user) });
});

api.get("/watchlist/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate("watchlist");
    res.json({
      movies: (user?.watchlist ?? []).filter(Boolean),
    });
  } catch (error) {
    next(error);
  }
});

api.put("/watchlist/:movieId", requireAuth, async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.movieId);
    if (!movie) return res.status(404).json({ error: "Movie not found." });
    await User.updateOne(
      { _id: req.user.id },
      { $addToSet: { watchlist: movie.id } },
    );
    return res.json({ saved: true });
  } catch (error) {
    next(error);
  }
});

api.delete("/watchlist/:movieId", requireAuth, async (req, res, next) => {
  try {
    await User.updateOne(
      { _id: req.user.id },
      { $pull: { watchlist: req.params.movieId } },
    );
    return res.json({ saved: false });
  } catch (error) {
    next(error);
  }
});

api.get("/movies", async (req, res, next) => {
  try {
    const filter = {};
    if (typeof req.query.search === "string" && req.query.search.trim()) {
      const term = escapeRegex(req.query.search.trim().slice(0, 100));
      filter.$or = [
        { title: { $regex: term, $options: "i" } },
        { genre: { $regex: term, $options: "i" } },
      ];
    }
    res.json({ movies: await Movie.find(filter).sort({ isFeatured: -1, createdAt: -1 }).limit(100) });
  } catch (error) {
    next(error);
  }
});

api.get("/movies/:id", async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ error: "Movie not found." });
    return res.json({ movie });
  } catch (error) {
    next(error);
  }
});

api.post("/movies", requireAuth, requireAdmin, validate(movieSchema), async (req, res, next) => {
  try {
    const movie = await Movie.create(req.validated.body);
    res.status(201).json({ movie });
  } catch (error) {
    next(error);
  }
});

api.put("/movies/:id", requireAuth, requireAdmin, validate(movieSchema), async (req, res, next) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.validated.body, {
      new: true,
      runValidators: true,
    });
    if (!movie) return res.status(404).json({ error: "Movie not found." });
    return res.json({ movie });
  } catch (error) {
    next(error);
  }
});

api.delete("/movies/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const [hasShowtimes, hasReviews] = await Promise.all([
      Showtime.exists({ movie: req.params.id }),
      Review.exists({ movie: req.params.id }),
    ]);
    if (hasShowtimes || hasReviews) {
      return res.status(409).json({
        error: "Cannot delete a movie with scheduled showtimes or reviews.",
      });
    }
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) return res.status(404).json({ error: "Movie not found." });
    return res.status(204).end();
  } catch (error) {
    next(error);
  }
});

api.get("/cinemas", async (_req, res, next) => {
  try {
    res.json({ cinemas: await Cinema.find({ isActive: true }).sort({ city: 1, name: 1 }) });
  } catch (error) {
    next(error);
  }
});

api.post("/cinemas", requireAuth, requireAdmin, validate(cinemaSchema), async (req, res, next) => {
  try {
    res.status(201).json({ cinema: await Cinema.create(req.validated.body) });
  } catch (error) {
    next(error);
  }
});

api.get("/cinemas/:cinemaId/screens", async (req, res, next) => {
  try {
    const screens = await Screen.find({ cinema: req.params.cinemaId }).populate("cinema", "name city");
    res.json({ screens });
  } catch (error) {
    next(error);
  }
});

api.get("/screens", async (_req, res, next) => {
  try {
    res.json({
      screens: await Screen.find()
        .populate("cinema", "name city")
        .sort({ name: 1 }),
    });
  } catch (error) {
    next(error);
  }
});

api.post("/screens", requireAuth, requireAdmin, validate(screenSchema), async (req, res, next) => {
  try {
    if (!(await Cinema.exists({ _id: req.validated.body.cinema, isActive: true }))) {
      return res.status(404).json({ error: "Cinema not found." });
    }
    res.status(201).json({ screen: await Screen.create(req.validated.body) });
  } catch (error) {
    if (error.code === 11000) return duplicateError(res, "That screen name already exists at this cinema.");
    return next(error);
  }
});

api.get("/showtimes", async (req, res, next) => {
  try {
    const query = { startAt: { $gte: new Date() } };
    if (typeof req.query.movieId === "string") query.movie = req.query.movieId;
    if (typeof req.query.screenId === "string") query.screen = req.query.screenId;
    if (typeof req.query.cinemaId === "string") {
      const screenIds = await Screen.distinct("_id", {
        cinema: req.query.cinemaId,
      });
      if (query.screen) {
        query.$and = [{ screen: query.screen }, { screen: { $in: screenIds } }];
        delete query.screen;
      } else {
        query.screen = { $in: screenIds };
      }
    }
    let showtimes = await Showtime.find(query)
      .sort({ startAt: 1 })
      .populate("movie")
      .populate({ path: "screen", populate: { path: "cinema", select: "name city address" } })
      .limit(100);
    res.json({ showtimes });
  } catch (error) {
    next(error);
  }
});

api.post("/showtimes", requireAuth, requireAdmin, validate(showtimeSchema), async (req, res, next) => {
  try {
    const { movie, screen, startAt, price } = req.validated.body;
    if (startAt <= new Date()) {
      return res.status(400).json({ error: "Showtime must be in the future." });
    }
    const [movieExists, screenExists] = await Promise.all([
      Movie.exists({ _id: movie }),
      Screen.exists({ _id: screen }),
    ]);
    if (!movieExists || !screenExists) {
      return res.status(404).json({ error: "Movie or screen not found." });
    }
    res.status(201).json({ showtime: await Showtime.create({ movie, screen, startAt, price }) });
  } catch (error) {
    next(error);
  }
});

api.get("/movies/:movieId/reviews", async (req, res, next) => {
  try {
    const reviews = await Review.find({ movie: req.params.movieId })
      .sort({ createdAt: -1 })
      .populate("user", "name")
      .limit(100);
    res.json({ reviews });
  } catch (error) {
    next(error);
  }
});

api.post("/movies/:movieId/reviews", requireAuth, validate(reviewSchema), async (req, res, next) => {
  try {
    const { movieId } = req.validated.params;
    if (!(await Movie.exists({ _id: movieId }))) {
      return res.status(404).json({ error: "Movie not found." });
    }
    const review = await Review.findOneAndUpdate(
      { movie: movieId, user: req.user.id },
      { ...req.validated.body, movie: movieId, user: req.user.id },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    ).populate("user", "name");
    return res.status(200).json({ review });
  } catch (error) {
    next(error);
  }
});

api.post("/bookings", requireAuth, validate(bookingSchema), async (req, res, next) => {
  const { showtimeId, seats } = req.validated.body;
  if (new Set(seats).size !== seats.length) {
    return res.status(400).json({ error: "Choose each seat only once." });
  }
  try {
    const showtime = await Showtime.findById(showtimeId).populate("screen");
    if (!showtime || showtime.startAt <= new Date()) {
      return res.status(404).json({ error: "Upcoming showtime not found." });
    }
    const validSeats = new Set();
    for (let row = 0; row < showtime.screen.rows; row += 1) {
      for (let column = 1; column <= showtime.screen.columns; column += 1) {
        validSeats.add(`${String.fromCharCode(65 + row)}${column}`);
      }
    }
    if (seats.some((seat) => !validSeats.has(seat))) {
      return res.status(400).json({ error: "One or more selected seats do not exist." });
    }

    const reserved = await Showtime.findOneAndUpdate(
      { _id: showtimeId, bookedSeats: { $nin: seats } },
      { $addToSet: { bookedSeats: { $each: seats } } },
      { new: true },
    );
    if (!reserved) {
      return res.status(409).json({ error: "One or more selected seats are no longer available." });
    }

    try {
      const booking = await Booking.create({
        user: req.user.id,
        showtime: showtimeId,
        seats,
        total: showtime.price * seats.length,
      });
      await booking.populate({
        path: "showtime",
        populate: [
          { path: "movie" },
          { path: "screen", populate: { path: "cinema" } },
        ],
      });
      return res.status(201).json({ booking });
    } catch (error) {
      await Showtime.updateOne({ _id: showtimeId }, { $pullAll: { bookedSeats: seats } });
      throw error;
    }
  } catch (error) {
    return next(error);
  }
});

api.get("/bookings/me", requireAuth, async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate({
        path: "showtime",
        populate: [
          { path: "movie" },
          { path: "screen", populate: { path: "cinema" } },
        ],
      });
    res.json({ bookings });
  } catch (error) {
    next(error);
  }
});

api.get("/admin/summary", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const [movies, cinemas, screens, showtimes, bookings, reviews] = await Promise.all([
      Movie.countDocuments(),
      Cinema.countDocuments(),
      Screen.countDocuments(),
      Showtime.countDocuments(),
      Booking.countDocuments(),
      Review.countDocuments(),
    ]);
    res.json({ movies, cinemas, screens, showtimes, bookings, reviews });
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => res.status(404).json({ error: "Route not found." }));
app.use((error, _req, res, _next) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ error: "Invalid request." });
  }
  if (error.name === "CastError") {
    return res.status(400).json({ error: "Invalid resource ID." });
  }
  if (error.name === "ValidationError") {
    return res.status(400).json({ error: error.message });
  }
  console.error(error);
  return res.status(500).json({ error: "An unexpected server error occurred." });
});

export default app;
