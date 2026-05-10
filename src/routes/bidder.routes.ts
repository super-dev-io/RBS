import { Router } from "express";
import { authenticate, requireAdmin } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createBidderSchema,
  listBidderQuery,
  updateBidderSchema,
} from "../validators/bidder.validator";
import { asyncHandler } from "../utils/asyncHandler";
import { bidderController } from "../controllers/bidder.controller";

const router = Router();

router.use(authenticate, requireAdmin);

router.post("/", validate(createBidderSchema), asyncHandler(bidderController.create));
router.get("/", validate(listBidderQuery, "query"), asyncHandler(bidderController.list));
router.get("/:id", asyncHandler(bidderController.getById));
router.patch("/:id", validate(updateBidderSchema), asyncHandler(bidderController.update));
router.delete("/:id", asyncHandler(bidderController.delete));

export default router;
