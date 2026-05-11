-- Drop persisted PDF columns from resume_generations (PDFs are now rendered on demand)
ALTER TABLE "resume_generations" DROP COLUMN IF EXISTS "pdf_path";
ALTER TABLE "resume_generations" DROP COLUMN IF EXISTS "pdf_url";
ALTER TABLE "resume_generations" DROP COLUMN IF EXISTS "cover_letter_path";
ALTER TABLE "resume_generations" DROP COLUMN IF EXISTS "cover_letter_url";

-- Rename bidder_folders.date -> bidder_folders.label (free-form workspace name)
ALTER INDEX "bidder_folders_bidder_id_date_idx" RENAME TO "bidder_folders_bidder_id_label_idx";
ALTER INDEX "bidder_folders_bidder_id_date_key" RENAME TO "bidder_folders_bidder_id_label_key";
ALTER TABLE "bidder_folders" RENAME COLUMN "date" TO "label";
