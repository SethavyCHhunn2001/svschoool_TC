import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/index.js";

export async function login(req, res) {
  const user = await User.findOne({ email: req.validatedBody.email }).select("+password");
  if (!user || !user.active || !(await bcrypt.compare(req.validatedBody.password, user.password))) {
    return res.status(401).json({ success: false, message: "Email or password is incorrect" });
  }
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "8h" });
  res.json({
    success: true,
    data: {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    },
  });
}

export function me(req, res) {
  res.json({ success: true, data: req.user });
}
