import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { Cinema, Movie, Screen, Showtime, User } from "../src/models.js";
import { connectDatabase } from "../src/config/database.js";

await connectDatabase();

const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
const adminPassword = process.env.SEED_ADMIN_PASSWORD;
if (adminEmail && adminPassword) {
  await User.updateOne(
    { email: adminEmail },
    {
      $setOnInsert: {
        name: process.env.SEED_ADMIN_NAME || "Cinema Admin",
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword, 12),
        role: "admin",
      },
    },
    { upsert: true },
  );
}

let cinema = await Cinema.findOne({ name: "CINÉMA Central" });
if (!cinema) {
  cinema = await Cinema.create({
    name: "CINÉMA Central",
    address: "100 Grand Avenue",
    city: "Los Angeles",
    country: "United States",
    phone: "+1 555 0100",
  });
}

let movie = await Movie.findOne({ title: "Stellar Void" });
if (!movie) {
  movie = await Movie.create({
    title: "Stellar Void",
    genre: "Sci-Fi",
    year: 2026,
    rating: 9.1,
    durationMinutes: 148,
    description: "An astronaut discovers an anomaly at the edge of the universe that changes humanity's understanding of time.",
    cast: ["Elena Voss", "Marcus Chen", "Aria Nakamura"],
    isFeatured: true,
  });
}

let screen = await Screen.findOne({ cinema: cinema.id, name: "Hall 1 — IMAX" });
if (!screen) {
  screen = await Screen.create({
    cinema: cinema.id,
    name: "Hall 1 — IMAX",
    rows: 8,
    columns: 10,
    seatPrice: 14,
    format: "IMAX",
  });
}

if (!(await Showtime.exists({ movie: movie.id, screen: screen.id }))) {
  await Showtime.create({
    movie: movie.id,
    screen: screen.id,
    startAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    price: screen.seatPrice,
  });
}

console.log("Cinema seed data is ready.");
await mongoose.disconnect();
