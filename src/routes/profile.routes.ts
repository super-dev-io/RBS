import { Router } from "express";
import { authenticate, requireAdmin, requireBidder } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  assignProfileSchema,
  createProfileSchema,
  listProfileQuery,
  updateProfileSchema,
} from "../validators/profile.validator";
import { asyncHandler } from "../utils/asyncHandler";
import { profileController } from "../controllers/profile.controller";

const adminRouter = Router();
adminRouter.use(authenticate, requireAdmin);

adminRouter.post("/", validate(createProfileSchema), asyncHandler(profileController.create));
adminRouter.get("/", validate(listProfileQuery, "query"), asyncHandler(profileController.listAdmin));
adminRouter.get("/:id", asyncHandler(profileController.getAdmin));
adminRouter.patch("/:id", validate(updateProfileSchema), asyncHandler(profileController.update));
adminRouter.delete("/:id", asyncHandler(profileController.delete));

adminRouter.get("/:id/assignments", asyncHandler(profileController.listAssignments));
adminRouter.post(
  "/:id/assignments",
  validate(assignProfileSchema),
  asyncHandler(profileController.assign)
);
adminRouter.delete("/:id/assignments/:bidderId", asyncHandler(profileController.unassign));

const bidderRouter = Router();
bidderRouter.use(authenticate, requireBidder);
bidderRouter.get(
  "/",
  validate(listProfileQuery, "query"),
  asyncHandler(profileController.listMine)
);
bidderRouter.get("/:id", asyncHandler(profileController.getMine));

export { adminRouter as adminProfileRouter, bidderRouter as bidderProfileRouter };
