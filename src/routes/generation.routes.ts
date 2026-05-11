import { Router } from "express";
import { authenticate, requireBidder } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createGenerationSchema,
  listGenerationQuery,
} from "../validators/generation.validator";
import { asyncHandler } from "../utils/asyncHandler";
import { generationController } from "../controllers/generation.controller";
import { generationLimiter } from "../middlewares/rateLimit.middleware";

const bidderRouter = Router();
bidderRouter.use(authenticate, requireBidder);

bidderRouter.post(
  "/",
  generationLimiter,
  validate(createGenerationSchema),
  asyncHandler(generationController.create)
);
bidderRouter.get(
  "/",
  validate(listGenerationQuery, "query"),
  asyncHandler(generationController.listMine)
);
bidderRouter.get("/:id", asyncHandler(generationController.getMine));
bidderRouter.get("/:id/download", asyncHandler(generationController.downloadMine));
bidderRouter.get(
  "/:id/cover-letter/download",
  asyncHandler(generationController.downloadCoverLetterMine)
);

export { bidderRouter as bidderGenerationRouter };
