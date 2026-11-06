import mongoose from "mongoose";

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, trim: true, required: true, maxlength: 80 },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
      unique: true,
      maxlength: 254,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true },
);

const movieSchema = new Schema(
  {
    title: { type: String, trim: true, required: true, maxlength: 140 },
    genre: { type: String, trim: true, required: true, maxlength: 60 },
    year: { type: Number, required: true, min: 1888, max: 2200 },
    rating: { type: Number, default: 0, min: 0, max: 10 },
    durationMinutes: { type: Number, required: true, min: 1, max: 600 },
    description: { type: String, trim: true, required: true, maxlength: 4000 },
    posterUrl: { type: String, trim: true, default: "", maxlength: 2048 },
    cast: { type: [String], default: [] },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const cinemaSchema = new Schema(
  {
    name: { type: String, trim: true, required: true, maxlength: 140 },
    address: { type: String, trim: true, required: true, maxlength: 240 },
    city: { type: String, trim: true, required: true, maxlength: 100 },
    country: { type: String, trim: true, required: true, maxlength: 100 },
    phone: { type: String, trim: true, default: "", maxlength: 40 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const screenSchema = new Schema(
  {
    cinema: { type: Schema.Types.ObjectId, ref: "Cinema", required: true },
    name: { type: String, trim: true, required: true, maxlength: 80 },
    rows: { type: Number, required: true, min: 1, max: 26 },
    columns: { type: Number, required: true, min: 1, max: 30 },
    seatPrice: { type: Number, required: true, min: 0 },
    format: { type: String, trim: true, default: "Standard", maxlength: 40 },
  },
  { timestamps: true },
);
screenSchema.index({ cinema: 1, name: 1 }, { unique: true });

const showtimeSchema = new Schema(
  {
    movie: { type: Schema.Types.ObjectId, ref: "Movie", required: true },
    screen: { type: Schema.Types.ObjectId, ref: "Screen", required: true },
    startAt: { type: Date, required: true },
    price: { type: Number, required: true, min: 0 },
    bookedSeats: { type: [String], default: [] },
  },
  { timestamps: true },
);
showtimeSchema.index({ screen: 1, startAt: 1 });

const bookingSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    showtime: { type: Schema.Types.ObjectId, ref: "Showtime", required: true },
    seats: { type: [String], required: true },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["confirmed", "cancelled"], default: "confirmed" },
  },
  { timestamps: true },
);

const reviewSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    movie: { type: Schema.Types.ObjectId, ref: "Movie", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, required: true, maxlength: 1500 },
  },
  { timestamps: true },
);
reviewSchema.index({ user: 1, movie: 1 }, { unique: true });

export const User = mongoose.model("User", userSchema);
export const Movie = mongoose.model("Movie", movieSchema);
export const Cinema = mongoose.model("Cinema", cinemaSchema);
export const Screen = mongoose.model("Screen", screenSchema);
export const Showtime = mongoose.model("Showtime", showtimeSchema);
export const Booking = mongoose.model("Booking", bookingSchema);
export const Review = mongoose.model("Review", reviewSchema);
