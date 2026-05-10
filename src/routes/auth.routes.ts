import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { authLimiter } from "../middlewares/rateLimit.middleware";
import { loginSchema, refreshSchema } from "../validators/auth.validator";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post("/login", authLimiter, validate(loginSchema), asyncHandler(authController.login));
router.post("/refresh", authLimiter, validate(refreshSchema), asyncHandler(authController.refresh));
router.post("/logout", asyncHandler(authController.logout));
router.get("/me", authenticate, asyncHandler(authController.me));

export default router;
