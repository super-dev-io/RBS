import { Router } from "express";
import { authenticate, requireAdmin, requireBidder } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { listWorkLogsQuery } from "../validators/generation.validator";
import { asyncHandler } from "../utils/asyncHandler";
import { workLogController } from "../controllers/workLog.controller";

const adminRouter = Router();
adminRouter.use(authenticate, requireAdmin);
adminRouter.get(
  "/",
  validate(listWorkLogsQuery, "query"),
  asyncHandler(workLogController.listAdmin)
);
adminRouter.get("/bidders", asyncHandler(workLogController.listBiddersAdmin));
adminRouter.get(
  "/bidders/:bidderId/folders",
  asyncHandler(workLogController.listFoldersAdmin)
);
adminRouter.get(
  "/bidders/:bidderId/folders/:date",
  asyncHandler(workLogController.listFolderContentsAdmin)
);

const bidderRouter = Router();
bidderRouter.use(authenticate, requireBidder);
bidderRouter.get(
  "/",
  validate(listWorkLogsQuery, "query"),
  asyncHandler(workLogController.listMine)
);

export { adminRouter as adminWorkLogRouter, bidderRouter as bidderWorkLogRouter };
