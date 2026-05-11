import { Router } from "express";
import { authenticate, requireAdmin } from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { analyticsController } from "../controllers/analytics.controller";

const router = Router();
router.use(authenticate, requireAdmin);

router.get("/resumes-per-day", asyncHandler(analyticsController.resumesPerDay));

export default router;
