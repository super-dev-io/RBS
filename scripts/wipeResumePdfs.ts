/*
 * One-shot cleanup: delete every persisted resume + cover-letter PDF from
 * storage, then null out the legacy pdf_path / pdf_url / cover_letter_path /
 * cover_letter_url columns. Run this BEFORE the migration that drops those
 * columns so the migration only has to remove empty fields.
 *
 *   ts-node backend/scripts/wipeResumePdfs.ts
 */
import { prisma } from "../src/config/prisma";
import { getStorage } from "../src/services/storage";
import { logger } from "../src/utils/logger";

async function main() {
  const rows: Array<{
    id: string;
    pdf_path: string | null;
    cover_letter_path: string | null;
  }> = await prisma.$queryRawUnsafe(`
    SELECT id, pdf_path, cover_letter_path
    FROM resume_generations
    WHERE pdf_path IS NOT NULL OR cover_letter_path IS NOT NULL
  `);

  logger.info({ count: rows.length }, "Resume generations with persisted PDFs");
  const storage = getStorage();
  let resumeDeleted = 0;
  let coverDeleted = 0;

  for (const row of rows) {
    if (row.pdf_path) {
      try {
        await storage.delete(row.pdf_path);
        resumeDeleted++;
      } catch (err) {
        logger.warn({ err, key: row.pdf_path }, "Failed to delete resume PDF");
      }
    }
    if (row.cover_letter_path) {
      try {
        await storage.delete(row.cover_letter_path);
        coverDeleted++;
      } catch (err) {
        logger.warn({ err, key: row.cover_letter_path }, "Failed to delete cover-letter PDF");
      }
    }
  }

  await prisma.$executeRawUnsafe(`
    UPDATE resume_generations
    SET pdf_path = NULL, pdf_url = NULL,
        cover_letter_path = NULL, cover_letter_url = NULL
    WHERE pdf_path IS NOT NULL OR cover_letter_path IS NOT NULL
       OR pdf_url IS NOT NULL OR cover_letter_url IS NOT NULL
  `);

  logger.info({ resumeDeleted, coverDeleted }, "Wipe complete");
}

main()
  .catch((err) => {
    logger.error({ err }, "Wipe failed");
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
