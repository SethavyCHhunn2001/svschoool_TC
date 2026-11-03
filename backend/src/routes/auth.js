import { Router } from "express";
import { login, me } from "../controllers/auth.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { loginSchema } from "../validators/auth.js";

const router = Router();
router.post("/login", validate(loginSchema), login);
router.get("/me", authenticate, me);
export default router;
