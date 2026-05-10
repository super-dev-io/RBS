import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { getStorage } from "../services/storage";
import { prisma } from "../config/prisma";
import { Role } from "@prisma/client";
import { AppError } from "../utils/AppError";
import path from "path";

const router = Router();

router.get(
  "/resumes/:filename",
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user) throw AppError.unauthorized();
    const filename = path.basename(req.params.filename);
    const id = filename.replace(/\.pdf$/i, "");
    const gen = await prisma.resumeGeneration.findUnique({ where: { id } });
    if (!gen || !gen.pdfPath) throw AppError.notFound();

    if (req.user.role === Role.BIDDER && gen.bidderId !== req.user.id) {
      throw AppError.forbidden();
    }
    if (req.user.role === Role.ADMIN) {
      const profile = await prisma.profile.findFirst({
        where: { id: gen.profileId, createdByAdminId: req.user.id },
        select: { id: true },
      });
      if (!profile) throw AppError.forbidden();
    }
    const buf = await getStorage().read(gen.pdfPath);
    res.type("application/pdf").send(buf);
  })
);

export default router;
