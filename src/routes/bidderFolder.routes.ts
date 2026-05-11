import { Router } from "express";
import { authenticate, requireBidder } from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { bidderFolderController } from "../controllers/bidderFolder.controller";

const router = Router();
router.use(authenticate, requireBidder);

router.post("/", asyncHandler(bidderFolderController.create));
router.get("/", asyncHandler(bidderFolderController.list));
router.get("/:label/generations", asyncHandler(bidderFolderController.listGenerations));

export { router as bidderFolderRouter };
