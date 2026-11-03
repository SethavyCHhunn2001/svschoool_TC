import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.js";
import resourceRoutes from "./routes/resources.js";
import { errorHandler, notFound } from "./middleware/errors.js";

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "sv-school-dev-secret-key-change-me-123456";
}
if (process.env.JWT_SECRET.length < 32 && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET must be set to a random value of at least 32 characters");
}
if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/sv_high_school";
}

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173").split(",").map((origin) => origin.trim());
app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("combined"));
app.use("/api/v1/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 }), authRoutes);
app.use("/api/v1", resourceRoutes);
app.get("/api/v1/health", (req, res) => res.json({ success: true, data: { status: "ok" } }));
app.use(notFound);
app.use(errorHandler);

export default app;
