import jwt from "jsonwebtoken";
import { User } from "../models.js";

export async function requireAuth(req, res, next) {
  try {
    const token = req.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: "Account is no longer available." });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Invalid or expired token." });
    }
    return next(error);
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Administrator access required." });
  }
  return next();
}
