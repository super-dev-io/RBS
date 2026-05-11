import { Router } from "express";
import { authenticate, requireAdmin } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createTemplateSchema,
  listTemplateQuery,
  updateTemplateSchema,
} from "../validators/template.validator";
import { asyncHandler } from "../utils/asyncHandler";
import { templateController } from "../controllers/template.controller";

const router = Router();
router.use(authenticate, requireAdmin);

router.post("/", validate(createTemplateSchema), asyncHandler(templateController.create));
router.get("/", validate(listTemplateQuery, "query"), asyncHandler(templateController.list));
router.get("/available", asyncHandler(templateController.listAvailable));
router.get("/:id", asyncHandler(templateController.get));
router.patch("/:id", validate(updateTemplateSchema), asyncHandler(templateController.update));
router.delete("/:id", asyncHandler(templateController.delete));
router.get("/:id/preview.html", asyncHandler(templateController.previewHtml));
router.get("/:id/preview.pdf", asyncHandler(templateController.previewPdf));
router.get("/:id/thumbnail.png", asyncHandler(templateController.thumbnail));

export default router;
