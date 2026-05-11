-- CreateTable
CREATE TABLE "bidder_folders" (
    "id" UUID NOT NULL,
    "bidder_id" UUID NOT NULL,
    "date" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bidder_folders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bidder_folders_bidder_id_date_idx" ON "bidder_folders"("bidder_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "bidder_folders_bidder_id_date_key" ON "bidder_folders"("bidder_id", "date");

-- AddForeignKey
ALTER TABLE "bidder_folders" ADD CONSTRAINT "bidder_folders_bidder_id_fkey" FOREIGN KEY ("bidder_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: one BidderFolder per (bidder, day) that has existing generations
INSERT INTO "bidder_folders" ("id", "bidder_id", "date", "created_at")
SELECT gen_random_uuid(), "bidder_id", to_char("created_at", 'YYYY-MM-DD'), MIN("created_at")
FROM "resume_generations"
GROUP BY "bidder_id", to_char("created_at", 'YYYY-MM-DD')
ON CONFLICT ("bidder_id", "date") DO NOTHING;
